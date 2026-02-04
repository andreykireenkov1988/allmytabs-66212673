export type BreathDirection = 'blow' | 'draw'; // blow = exhale (+), draw = inhale (-)

export interface HarmonicaNote {
  id: string;
  hole: number; // 1-10
  direction: BreathDirection;
  bend: number; // 0 = no bend, 1 = half-step, 2 = whole-step, etc.
  position: number; // horizontal position in the line
}

// Group of notes played simultaneously (chord)
export interface HarmonicaChord {
  id: string;
  notes: HarmonicaNote[]; // Multiple notes at same position
  position: number; // Position of the chord (takes position of first note)
  span: number; // How many cells this chord spans visually
}

export interface HarmonicaLine {
  id: string;
  title: string;
  notes: HarmonicaNote[];
  chords: HarmonicaChord[]; // Grouped notes
  columns: number; // number of positions in the line
}

export interface HarmonicaTabContent {
  lines: HarmonicaLine[];
}

export interface HarmonicaTab {
  id: string;
  user_id: string;
  title: string;
  artist?: string | null;
  content: HarmonicaTabContent;
  collection_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to create empty line
export const createEmptyHarmonicaLine = (): HarmonicaLine => ({
  id: crypto.randomUUID(),
  title: '',
  notes: [],
  chords: [],
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

// Helper to create a chord from notes
export const createHarmonicaChord = (
  notes: HarmonicaNote[],
  position: number,
  span: number
): HarmonicaChord => ({
  id: crypto.randomUUID(),
  notes,
  position,
  span,
});

// Format note for display: 1, -3, -3', -3'', etc. (blow = just number, draw = minus)
export const formatHarmonicaNote = (note: HarmonicaNote): string => {
  const prefix = note.direction === 'blow' ? '' : '-';
  const bendMarks = "'".repeat(note.bend);
  return `${prefix}${note.hole}${bendMarks}`;
};

// Format chord for display: "234" or "-234" (all notes must have same direction)
export const formatHarmonicaChord = (chord: HarmonicaChord): string => {
  if (chord.notes.length === 0) return '';
  
  // Sort notes by hole number
  const sortedNotes = [...chord.notes].sort((a, b) => a.hole - b.hole);
  const direction = sortedNotes[0].direction;
  const prefix = direction === 'blow' ? '' : '-';
  const holes = sortedNotes.map(n => n.hole).join('');
  
  return `${prefix}${holes}`;
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
