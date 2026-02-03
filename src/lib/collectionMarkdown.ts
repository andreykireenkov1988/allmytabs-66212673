import { Song, SongBlock, ChordsBlockContent, isChordsContent, isTablatureContent } from '@/types/song';
import { HarmonicaTab, HarmonicaLine, HarmonicaNote, formatHarmonicaNote, parseHarmonicaNoteString } from '@/types/harmonica';
import { TablatureContent, TablatureLine, TablatureNote, TablatureConnection, ConnectionType, STRING_NAMES } from '@/types/tablature';

// ============ EXPORT FUNCTIONS ============

function formatTablatureLine(line: TablatureLine): string {
  const { notes, connections = [], columns, title } = line;
  
  // Build ASCII tab representation
  const grid: string[][] = STRING_NAMES.map(() => Array(columns).fill('-'));
  
  // Place notes
  for (const note of notes || []) {
    if (note.stringIndex >= 0 && note.stringIndex < 6 && note.position >= 0 && note.position < columns) {
      grid[note.stringIndex][note.position] = note.fret;
    }
  }
  
  // Build string lines
  const tabLines = STRING_NAMES.map((name, idx) => `${name}|${grid[idx].join('')}|`);
  
  // Format connections as comments
  const connectionLines = (connections || []).map(conn => 
    `<!-- connection: ${conn.type} string=${conn.stringIndex} from=${conn.startPosition} to=${conn.endPosition} -->`
  );
  
  const parts: string[] = [];
  if (title) {
    parts.push(`#### ${title}`);
  }
  parts.push('```tab');
  parts.push(...tabLines);
  parts.push('```');
  if (connectionLines.length > 0) {
    parts.push(...connectionLines);
  }
  
  return parts.join('\n');
}

function formatTablatureBlock(block: SongBlock): string {
  const content = block.content as TablatureContent;
  const lines = content.lines || [];
  
  const parts: string[] = [];
  if (block.title) {
    parts.push(`### ${block.title}`);
    parts.push('');
  }
  
  for (const line of lines) {
    parts.push(formatTablatureLine(line));
    parts.push('');
  }
  
  return parts.join('\n');
}

function formatChordsBlock(block: SongBlock): string {
  const content = block.content as ChordsBlockContent;
  const parts: string[] = [];
  
  if (block.title) {
    parts.push(`### ${block.title}`);
    parts.push('');
  }
  
  parts.push('```chords');
  parts.push(content.text || '');
  parts.push('```');
  
  return parts.join('\n');
}

function formatSong(song: Song): string {
  const parts: string[] = [];
  
  parts.push(`## 🎸 ${song.title}`);
  if (song.artist) {
    parts.push(`**Исполнитель:** ${song.artist}`);
  }
  parts.push('');
  
  const blocks = song.blocks || [];
  for (const block of blocks.sort((a, b) => a.position - b.position)) {
    if (block.block_type === 'chords') {
      parts.push(formatChordsBlock(block));
    } else if (block.block_type === 'tablature') {
      parts.push(formatTablatureBlock(block));
    }
    parts.push('');
  }
  
  return parts.join('\n');
}

function formatHarmonicaLine(line: HarmonicaLine): string {
  const { notes, columns, title } = line;
  
  // Build a single line of notes at their positions
  const noteGrid: string[] = Array(columns).fill('.');
  for (const note of notes) {
    if (note.position >= 0 && note.position < columns) {
      noteGrid[note.position] = formatHarmonicaNote(note);
    }
  }
  
  const parts: string[] = [];
  if (title) {
    parts.push(`#### ${title}`);
  }
  parts.push('```harmonica');
  parts.push(noteGrid.join(' '));
  parts.push('```');
  
  // Store full note data as comment for perfect restoration
  const noteDataComment = `<!-- notes: ${JSON.stringify(notes)} -->`;
  parts.push(noteDataComment);
  
  return parts.join('\n');
}

function formatHarmonicaTab(tab: HarmonicaTab): string {
  const parts: string[] = [];
  
  parts.push(`## 🎵 ${tab.title}`);
  parts.push('');
  
  const lines = tab.content.lines || [];
  for (const line of lines) {
    parts.push(formatHarmonicaLine(line));
    parts.push('');
  }
  
  return parts.join('\n');
}

export function exportToMarkdown(
  songs: Song[],
  harmonicaTabs: HarmonicaTab[],
  collectionName?: string
): string {
  const parts: string[] = [];
  
  parts.push('# Коллекция табулатур');
  if (collectionName) {
    parts.push(`**Название:** ${collectionName}`);
  }
  parts.push(`**Экспортировано:** ${new Date().toLocaleString('ru-RU')}`);
  parts.push('');
  parts.push('---');
  parts.push('');
  
  if (songs.length > 0) {
    parts.push('# Гитара');
    parts.push('');
    for (const song of songs) {
      parts.push(formatSong(song));
      parts.push('---');
      parts.push('');
    }
  }
  
  if (harmonicaTabs.length > 0) {
    parts.push('# Гармошка');
    parts.push('');
    for (const tab of harmonicaTabs) {
      parts.push(formatHarmonicaTab(tab));
      parts.push('---');
      parts.push('');
    }
  }
  
  return parts.join('\n');
}

// ============ IMPORT FUNCTIONS ============

interface ParsedSong {
  title: string;
  artist: string | null;
  blocks: Array<{
    block_type: 'chords' | 'tablature';
    title: string;
    content: ChordsBlockContent | TablatureContent;
    position: number;
  }>;
}

interface ParsedHarmonicaTab {
  title: string;
  content: { lines: HarmonicaLine[] };
}

interface ParsedCollection {
  songs: ParsedSong[];
  harmonicaTabs: ParsedHarmonicaTab[];
}

function parseTablatureBlock(content: string, connectionComments: string[]): TablatureLine {
  const lines = content.trim().split('\n');
  const notes: TablatureNote[] = [];
  let columns = 16;
  
  for (const line of lines) {
    // Match pattern like "e|---5-3---|" or "E|--2-0----|"
    const match = line.match(/^([eBGDAE])\|(.+)\|$/);
    if (!match) continue;
    
    const stringName = match[1];
    const stringIndex = STRING_NAMES.indexOf(stringName as typeof STRING_NAMES[number]);
    if (stringIndex === -1) continue;
    
    const tabContent = match[2];
    columns = Math.max(columns, tabContent.length);
    
    for (let i = 0; i < tabContent.length; i++) {
      const char = tabContent[i];
      if (char !== '-' && char !== ' ') {
        notes.push({
          stringIndex,
          position: i,
          fret: char,
        });
      }
    }
  }
  
  // Parse connections from comments
  const connections: TablatureConnection[] = [];
  for (const comment of connectionComments) {
    const match = comment.match(/connection:\s*(\S+)\s+string=(\d+)\s+from=(\d+)\s+to=(\d+)/);
    if (match) {
      connections.push({
        id: crypto.randomUUID(),
        type: match[1] as ConnectionType,
        stringIndex: parseInt(match[2]),
        startPosition: parseInt(match[3]),
        endPosition: parseInt(match[4]),
      });
    }
  }
  
  return {
    id: crypto.randomUUID(),
    title: '',
    notes,
    connections,
    columns,
  };
}

function parseHarmonicaLine(content: string, notesComment?: string): HarmonicaLine {
  // Try to restore from JSON comment first
  if (notesComment) {
    const match = notesComment.match(/notes:\s*(\[.+\])/);
    if (match) {
      try {
        const notes = JSON.parse(match[1]) as HarmonicaNote[];
        return {
          id: crypto.randomUUID(),
          title: '',
          notes: notes.map(n => ({ ...n, id: crypto.randomUUID() })),
          columns: Math.max(16, ...notes.map(n => n.position + 1)),
        };
      } catch {}
    }
  }
  
  // Fallback: parse from visual representation
  const notes: HarmonicaNote[] = [];
  const parts = content.trim().split(/\s+/);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '.' || part === '') continue;
    
    const parsed = parseHarmonicaNoteString(part);
    if (parsed) {
      notes.push({
        id: crypto.randomUUID(),
        hole: parsed.hole,
        direction: parsed.direction,
        bend: parsed.bend,
        position: i,
      });
    }
  }
  
  return {
    id: crypto.randomUUID(),
    title: '',
    notes,
    columns: Math.max(16, parts.length),
  };
}

export function parseMarkdown(markdown: string): ParsedCollection {
  const songs: ParsedSong[] = [];
  const harmonicaTabs: ParsedHarmonicaTab[] = [];
  
  // Split by horizontal rules to get sections
  const sections = markdown.split(/\n---\n/);
  
  let currentSection: 'guitar' | 'harmonica' | null = null;
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // Check for section headers
    if (trimmed.match(/^#\s*Гитара/m)) {
      currentSection = 'guitar';
    } else if (trimmed.match(/^#\s*Гармошка/m)) {
      currentSection = 'harmonica';
    }
    
    // Parse guitar songs
    const songMatch = trimmed.match(/^##\s*🎸\s*(.+)$/m);
    if (songMatch) {
      const title = songMatch[1].trim();
      const artistMatch = trimmed.match(/\*\*Исполнитель:\*\*\s*(.+)/);
      const artist = artistMatch ? artistMatch[1].trim() : null;
      
      const blocks: ParsedSong['blocks'] = [];
      let position = 0;
      
      // Find all code blocks
      const codeBlockRegex = /(?:###\s*(.+?)\n\n?)?```(chords|tab)\n([\s\S]*?)```(?:\n((?:<!--[^>]+-->\n?)*))?/g;
      let match;
      
      while ((match = codeBlockRegex.exec(trimmed)) !== null) {
        const blockTitle = match[1] || '';
        const blockType = match[2];
        const blockContent = match[3];
        const comments = match[4] || '';
        
        if (blockType === 'chords') {
          blocks.push({
            block_type: 'chords',
            title: blockTitle,
            content: { text: blockContent.trim() },
            position: position++,
          });
        } else if (blockType === 'tab') {
          const connectionComments = comments.match(/<!--[^>]+-->/g) || [];
          const tabLine = parseTablatureBlock(blockContent, connectionComments);
          tabLine.title = blockTitle;
          
          // Check if we need to merge with previous tablature block
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.block_type === 'tablature') {
            (lastBlock.content as TablatureContent).lines.push(tabLine);
          } else {
            blocks.push({
              block_type: 'tablature',
              title: blockTitle,
              content: { lines: [tabLine] },
              position: position++,
            });
          }
        }
      }
      
      songs.push({ title, artist, blocks });
      continue;
    }
    
    // Parse harmonica tabs
    const harmonicaMatch = trimmed.match(/^##\s*🎵\s*(.+)$/m);
    if (harmonicaMatch) {
      const title = harmonicaMatch[1].trim();
      const lines: HarmonicaLine[] = [];
      
      const codeBlockRegex = /(?:####\s*(.+?)\n\n?)?```harmonica\n([\s\S]*?)```(?:\n(<!--[^>]+-->))?/g;
      let match;
      
      while ((match = codeBlockRegex.exec(trimmed)) !== null) {
        const lineTitle = match[1] || '';
        const lineContent = match[2];
        const notesComment = match[3];
        
        const line = parseHarmonicaLine(lineContent, notesComment);
        line.title = lineTitle;
        lines.push(line);
      }
      
      if (lines.length === 0) {
        lines.push({
          id: crypto.randomUUID(),
          title: '',
          notes: [],
          columns: 16,
        });
      }
      
      harmonicaTabs.push({ title, content: { lines } });
    }
  }
  
  return { songs, harmonicaTabs };
}

export function downloadMarkdownFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
