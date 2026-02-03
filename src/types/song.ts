import { TablatureContent } from './tablature';

export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  content: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  blocks?: SongBlock[];
}

export type SongBlockType = 'chords' | 'tablature';

export interface ChordsBlockContent {
  text: string;
}

export interface SongBlock {
  id: string;
  song_id: string;
  user_id: string;
  block_type: SongBlockType;
  title: string;
  content: ChordsBlockContent | TablatureContent;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ParsedSongData {
  title: string;
  artist: string;
  content: string;
  sourceUrl: string;
}

// Type guards
export function isChordsContent(content: unknown): content is ChordsBlockContent {
  return typeof content === 'object' && content !== null && 'text' in content;
}

export function isTablatureContent(content: unknown): content is TablatureContent {
  return typeof content === 'object' && content !== null && 'lines' in content;
}
