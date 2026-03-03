import JSZip from 'jszip';
import { Song, SongBlock, ChordsBlockContent, isTablatureContent } from '@/types/song';
import { HarmonicaTab, formatHarmonicaNote } from '@/types/harmonica';
import { TablatureContent, STRING_NAMES } from '@/types/tablature';
import { Collection } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';

// ============ YAML FRONTMATTER ============

function escapeYaml(value: string): string {
  if (/[:#\[\]{}&*!|>'"%@`]/.test(value) || value.trim() !== value) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function buildFrontmatter(fields: Record<string, string | string[] | null | undefined>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => escapeYaml(v)).join(', ')}]`);
    } else {
      lines.push(`${key}: ${escapeYaml(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ============ FORMAT SONG TO OBSIDIAN MD ============

function formatTablatureLineObsidian(line: { notes: any[]; connections?: any[]; columns: number; title: string }): string {
  const { notes, columns, title } = line;
  const grid: string[][] = STRING_NAMES.map(() => Array(columns).fill('-'));
  
  for (const note of notes || []) {
    if (note.stringIndex >= 0 && note.stringIndex < 6 && note.position >= 0 && note.position < columns) {
      grid[note.stringIndex][note.position] = note.fret;
    }
  }
  
  const tabLines = STRING_NAMES.map((name, idx) => `${name}|${grid[idx].join('')}|`);
  
  const parts: string[] = [];
  if (title) parts.push(`#### ${title}`);
  parts.push('```');
  parts.push(...tabLines);
  parts.push('```');
  return parts.join('\n');
}

function formatSongObsidian(song: Song, collectionName?: string): string {
  const tags = ['allmytabs', 'guitar'];
  if (song.blocks?.some(b => b.block_type === 'chords')) tags.push('chords');
  if (song.blocks?.some(b => b.block_type === 'tablature')) tags.push('tablature');

  const frontmatter = buildFrontmatter({
    title: song.title,
    artist: song.artist,
    type: 'guitar',
    collection: collectionName,
    tags,
    created: song.created_at?.split('T')[0],
    source: song.source_url,
  });

  const parts: string[] = [frontmatter, '', `# ${song.title}`];
  if (song.artist) parts.push(`**Исполнитель:** ${song.artist}`);
  parts.push('');

  const blocks = song.blocks || [];
  for (const block of blocks.sort((a, b) => a.position - b.position)) {
    if (block.block_type === 'chords') {
      const content = block.content as ChordsBlockContent;
      if (block.title) { parts.push(`## ${block.title}`); parts.push(''); }
      parts.push('```');
      parts.push(content.text || '');
      parts.push('```');
      parts.push('');
    } else if (block.block_type === 'tablature') {
      const content = block.content as TablatureContent;
      if (block.title) { parts.push(`## ${block.title}`); parts.push(''); }
      for (const line of content.lines || []) {
        parts.push(formatTablatureLineObsidian(line));
        parts.push('');
      }
    }
  }

  return parts.join('\n');
}

function formatHarmonicaTabObsidian(tab: HarmonicaTab, collectionName?: string): string {
  const frontmatter = buildFrontmatter({
    title: tab.title,
    artist: tab.artist,
    type: 'harmonica',
    collection: collectionName,
    tags: ['allmytabs', 'harmonica'],
    created: tab.created_at?.split('T')[0],
  });

  const parts: string[] = [frontmatter, '', `# ${tab.title}`];
  if (tab.artist) parts.push(`**Исполнитель:** ${tab.artist}`);
  parts.push('');

  for (const line of tab.content.lines || []) {
    if (line.title) parts.push(`## ${line.title}`);
    const noteGrid: string[] = Array(line.columns).fill('.');
    for (const note of line.notes) {
      if (note.position >= 0 && note.position < line.columns) {
        noteGrid[note.position] = formatHarmonicaNote(note);
      }
    }
    parts.push('```');
    parts.push(noteGrid.join(' '));
    parts.push('```');
    parts.push('');
  }

  return parts.join('\n');
}

// ============ SAFE FILENAME ============

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled';
}

// ============ RENDER PNG via Edge Function ============

async function renderBlockPng(
  type: 'chords' | 'tablature' | 'harmonica',
  content: any,
  title: string
): Promise<Uint8Array | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await supabase.functions.invoke('render-tab-png', {
      body: { type, content, title },
    });

    if (response.error || !response.data) return null;

    // response.data is a Blob
    const blob = response.data as Blob;
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.error('Error rendering PNG:', e);
    return null;
  }
}

// ============ ZIP EXPORT ============

export interface ObsidianExportOptions {
  includeImages?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export async function exportToObsidianZip(
  songs: Song[],
  harmonicaTabs: HarmonicaTab[],
  collections: Collection[],
  options: ObsidianExportOptions = {}
): Promise<Blob> {
  const { includeImages = false, onProgress } = options;
  const zip = new JSZip();
  const root = zip.folder('AllMyTabs')!;

  const collectionMap = new Map(collections.map(c => [c.id, c.name]));

  // Group by collection
  const uncategorized = root.folder('Без коллекции')!;

  let completed = 0;
  const totalItems = songs.length + harmonicaTabs.length;

  for (const song of songs) {
    const collName = song.collection_id ? collectionMap.get(song.collection_id) : null;
    const folder = collName ? root.folder(safeFilename(collName))! : uncategorized;
    const baseName = safeFilename(song.artist ? `${song.artist} - ${song.title}` : song.title);
    folder.file(`${baseName}.md`, formatSongObsidian(song, collName || undefined));

    // Render blocks as PNG images
    if (includeImages && song.blocks?.length) {
      const imgFolder = folder.folder(`${baseName}_images`)!;
      const blocks = [...song.blocks].sort((a, b) => a.position - b.position);
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockTitle = block.title || (block.block_type === 'chords' ? 'Аккорды' : 'Табулатура');
        const png = await renderBlockPng(block.block_type as any, block.content, blockTitle);
        if (png) {
          imgFolder.file(`${safeFilename(blockTitle)}_${i + 1}.png`, png);
        }
      }
    }

    completed++;
    onProgress?.(completed, totalItems);
  }

  for (const tab of harmonicaTabs) {
    const collName = tab.collection_id ? collectionMap.get(tab.collection_id) : null;
    const folder = collName ? root.folder(safeFilename(collName))! : uncategorized;
    const baseName = safeFilename(tab.artist ? `${tab.artist} - ${tab.title}` : tab.title);
    folder.file(`${baseName} (harmonica).md`, formatHarmonicaTabObsidian(tab, collName || undefined));

    if (includeImages) {
      const png = await renderBlockPng('harmonica', tab.content, tab.title);
      if (png) {
        folder.file(`${baseName} (harmonica).png`, png);
      }
    }

    completed++;
    onProgress?.(completed, totalItems);
  }

  // Create a Dataview index note
  const indexContent = buildFrontmatter({
    title: 'AllMyTabs Index',
    tags: ['allmytabs', 'index'],
  }) + `\n\n# 🎵 AllMyTabs Index\n\nЭта заметка автоматически показывает все импортированные табулатуры.\n\n## Гитара\n\n\`\`\`dataview\ntable artist as "Исполнитель", collection as "Коллекция"\nfrom #guitar and #allmytabs\nsort artist asc, title asc\n\`\`\`\n\n## Гармошка\n\n\`\`\`dataview\ntable artist as "Исполнитель", collection as "Коллекция"\nfrom #harmonica and #allmytabs\nsort title asc\n\`\`\`\n`;

  root.file('AllMyTabs Index.md', indexContent);

  return zip.generateAsync({ type: 'blob' });
}

// ============ OBSIDIAN URI ============

export function buildObsidianUri(
  song: Song | HarmonicaTab,
  type: 'guitar' | 'harmonica',
  vaultName: string
): string {
  let content: string;
  if (type === 'guitar') {
    content = formatSongObsidian(song as Song);
  } else {
    content = formatHarmonicaTabObsidian(song as HarmonicaTab);
  }

  const filename = safeFilename('artist' in song && song.artist ? `${song.artist} - ${song.title}` : song.title);

  const params = new URLSearchParams({
    vault: vaultName,
    file: `AllMyTabs/${filename}`,
    content,
  });

  return `obsidian://new?${params.toString()}`;
}

// ============ SINGLE FILE EXPORT ============

export function exportSingleObsidianMd(song: Song): string {
  return formatSongObsidian(song);
}

export function exportSingleHarmonicaObsidianMd(tab: HarmonicaTab): string {
  return formatHarmonicaTabObsidian(tab);
}
