export type BreathDirection = 'blow' | 'draw'; // blow = exhale (+), draw = inhale (-)

export interface HarmonicaNote {
  id: string;
  hole: number; // 1-10
  direction: BreathDirection;
  bend: number; // 0 = no bend, 1 = half-step, 2 = whole-step, etc.
  position: number; // horizontal position in the line
}

export interface HarmonicaLine {
  id: string;
  title: string;
  notes: HarmonicaNote[];
  columns: number; // number of positions in the line
}

export interface HarmonicaTabContent {
  lines: HarmonicaLine[];
}

export interface HarmonicaTab {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  content: HarmonicaTabContent;
  created_at: string;
  updated_at: string;
}

// Helper to create empty line
export const createEmptyHarmonicaLine = (): HarmonicaLine => ({
  id: crypto.randomUUID(),
  title: '',
  notes: [],
  columns: 16,
});

// Helper to create a note
export const createHarmonicaNote = (
  hole: number,
  direction: BreathDirection,
  position: number,
  bend: number = 0
): HarmonicaNote => ({
  id: crypto.randomUUID(),
  hole,
  direction,
  bend,
  position,
});

// Format note for display: 1, -3, -3', -3'', etc. (blow = just number, draw = minus)
export const formatHarmonicaNote = (note: HarmonicaNote): string => {
  const prefix = note.direction === 'blow' ? '' : '-';
  const bendMarks = "'".repeat(note.bend);
  return `${prefix}${note.hole}${bendMarks}`;
};

// Parse note string to components: "1" or "+1" -> blow, "-3" -> draw
export const parseHarmonicaNoteString = (str: string): { hole: number; direction: BreathDirection; bend: number } | null => {
  // Match: optional +, or -, followed by number and optional bends
  const match = str.match(/^([+-]?)(\d+)('*)$/);
  if (!match) return null;
  
  // No prefix or + means blow, - means draw
  const direction: BreathDirection = match[1] === '-' ? 'draw' : 'blow';
  const hole = parseInt(match[2], 10);
  const bend = match[3].length;
  
  if (hole < 1 || hole > 10) return null;
  
  return { hole, direction, bend };
};

// Available holes for selection
export const HARMONICA_HOLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
