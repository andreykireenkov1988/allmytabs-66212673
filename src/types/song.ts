export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  content: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedSongData {
  title: string;
  artist: string;
  content: string;
  sourceUrl: string;
}
