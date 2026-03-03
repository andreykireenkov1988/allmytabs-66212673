import JSZip from 'jszip';
import { Song, SongBlock, ChordsBlockContent } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';

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

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/render-tab-png`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ type, content, title }),
    });

    if (!response.ok) {
      console.error('render-tab-png error:', response.status, await response.text());
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.error('Error rendering PNG:', e);
    return null;
  }
}

// ============ ZIP EXPORT (PNG only) ============

export interface ObsidianExportOptions {
  onProgress?: (current: number, total: number) => void;
}

export async function exportToObsidianZip(
  songs: Song[],
  harmonicaTabs: HarmonicaTab[],
  collections: Collection[],
  options: ObsidianExportOptions = {}
): Promise<Blob> {
  const { onProgress } = options;
  const zip = new JSZip();
  const root = zip.folder('AllMyTabs')!;

  const collectionMap = new Map(collections.map(c => [c.id, c.name]));

  let completed = 0;
  const totalItems = songs.length + harmonicaTabs.length;

  for (const song of songs) {
    const collName = song.collection_id ? collectionMap.get(song.collection_id) : null;
    const collFolder = collName ? root.folder(safeFilename(collName))! : root.folder('Без коллекции')!;
    const baseName = safeFilename(song.artist ? `${song.artist} - ${song.title}` : song.title);
    const songFolder = collFolder.folder(baseName)!;

    const blocks = [...(song.blocks || [])].sort((a, b) => a.position - b.position);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockTitle = block.title || (block.block_type === 'chords' ? 'Аккорды' : 'Табулатура');
      const filename = `${baseName}${blocks.length > 1 ? ` - ${blockTitle}` : ''}.png`;
      const png = await renderBlockPng(block.block_type as any, block.content, blockTitle);
      if (png) {
        songFolder.file(filename, png);
      }
    }

    completed++;
    onProgress?.(completed, totalItems);
  }

  for (const tab of harmonicaTabs) {
    const collName = tab.collection_id ? collectionMap.get(tab.collection_id) : null;
    const collFolder = collName ? root.folder(safeFilename(collName))! : root.folder('Без коллекции')!;
    const baseName = safeFilename(tab.artist ? `${tab.artist} - ${tab.title}` : tab.title);

    const png = await renderBlockPng('harmonica', tab.content, tab.title);
    if (png) {
      collFolder.file(`${baseName}.png`, png);
    }

    completed++;
    onProgress?.(completed, totalItems);
  }

  return zip.generateAsync({ type: 'blob' });
}
