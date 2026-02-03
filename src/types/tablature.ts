export interface TablatureNote {
  stringIndex: number; // 0-5 (E, B, G, D, A, E)
  position: number; // horizontal position
  fret: string; // can be number, letter, or symbol
}

export interface TablatureLine {
  id: string;
  title: string;
  notes: TablatureNote[];
  columns: number;
}

export interface TablatureContent {
  lines: TablatureLine[];
}

export interface Tablature {
  id: string;
  user_id: string;
  title: string;
  content: TablatureContent;
  created_at: string;
  updated_at: string;
}

export const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;
export type StringName = typeof STRING_NAMES[number];

export const createEmptyLine = (): TablatureLine => ({
  id: crypto.randomUUID(),
  title: '',
  notes: [],
  columns: 16,
});
