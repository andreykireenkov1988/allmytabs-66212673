export interface TablatureNote {
  stringIndex: number; // 0-5 (E, B, G, D, A, E)
  position: number; // horizontal position
  fret: string; // can be number, letter, or symbol
  bend?: BendSize; // optional bend size
}

export type BendSize = '1/4' | '1/2' | 'full' | '1.5';

export type ConnectionType = 'hammer-on' | 'pull-off' | 'slide';

export interface TablatureConnection {
  id: string;
  type: ConnectionType;
  stringIndex: number;
  startPosition: number;
  endPosition: number;
}

export interface TablatureChord {
  position: number;
  chord: string;
}

export interface TablatureLine {
  id: string;
  title: string;
  notes: TablatureNote[];
  connections: TablatureConnection[];
  chords: TablatureChord[];
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
  connections: [],
  chords: [],
  columns: 16,
});

export const createConnection = (
  type: ConnectionType,
  stringIndex: number,
  startPosition: number,
  endPosition: number
): TablatureConnection => ({
  id: crypto.randomUUID(),
  type,
  stringIndex,
  startPosition,
  endPosition,
});

export const BEND_SIZES: { value: BendSize; label: string }[] = [
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: 'full', label: 'Full' },
  { value: '1.5', label: '1½' },
];
