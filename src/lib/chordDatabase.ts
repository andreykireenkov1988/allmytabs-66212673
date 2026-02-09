// Chord fingering database
// Each chord has multiple voicings with fret positions and finger placements

export interface ChordVoicing {
  /** Frets for each string [E, A, D, G, B, e]. -1 = muted, 0 = open */
  frets: number[];
  /** Finger numbers [1-4] or 0 for open/muted */
  fingers: number[];
  /** Starting fret (for barre chords displayed higher on neck) */
  baseFret: number;
  /** Barre across strings, if any */
  barres?: number[];
}

export interface ChordDefinition {
  name: string;
  /** Normalized key for lookup (e.g. "Am", "C#m7") */
  key: string;
  voicings: ChordVoicing[];
}

// Helper to create chord definitions concisely
function chord(name: string, voicings: Array<{ frets: number[]; fingers: number[]; baseFret?: number; barres?: number[] }>): ChordDefinition {
  return {
    name,
    key: name,
    voicings: voicings.map(v => ({ ...v, baseFret: v.baseFret || 1 })),
  };
}

export const CHORD_DATABASE: ChordDefinition[] = [
  // ── C chords ──
  chord('C', [
    { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    { frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Cm', [
    { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
    { frets: [-1, -1, 1, 3, 2, 1], fingers: [0, 0, 1, 4, 3, 1], baseFret: 3, barres: [1] },
  ]),
  chord('C7', [
    { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  ]),
  chord('Cmaj7', [
    { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  ]),
  chord('Cm7', [
    { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Csus2', [
    { frets: [-1, 3, 3, 0, 1, 3], fingers: [0, 2, 3, 0, 1, 4] },
  ]),
  chord('Csus4', [
    { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },
  ]),

  // ── C# / Db chords ──
  chord('C#', [
    { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  ]),
  chord('C#m', [
    { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  ]),

  // ── D chords ──
  chord('D', [
    { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  ]),
  chord('Dm', [
    { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  ]),
  chord('D7', [
    { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  ]),
  chord('Dmaj7', [
    { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barres: [1] },
  ]),
  chord('Dm7', [
    { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  ]),
  chord('Dsus2', [
    { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  ]),
  chord('Dsus4', [
    { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  ]),

  // ── D# / Eb chords ──
  chord('D#', [
    { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3], baseFret: 1 },
  ]),
  chord('D#m', [
    { frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2], baseFret: 1 },
  ]),

  // ── E chords ──
  chord('E', [
    { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  ]),
  chord('Em', [
    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  ]),
  chord('E7', [
    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  ]),
  chord('Em7', [
    { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  ]),
  chord('Emaj7', [
    { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  ]),
  chord('Esus4', [
    { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  ]),

  // ── F chords ──
  chord('F', [
    { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
    { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] },
  ]),
  chord('Fm', [
    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  ]),
  chord('F7', [
    { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barres: [1] },
  ]),
  chord('Fmaj7', [
    { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
    { frets: [1, 3, 3, 2, 1, 0], fingers: [1, 3, 4, 2, 1, 0], barres: [1] },
  ]),
  chord('Fm7', [
    { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barres: [1] },
  ]),

  // ── F# / Gb chords ──
  chord('F#', [
    { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
  ]),
  chord('F#m', [
    { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  ]),
  chord('F#7', [
    { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], barres: [1] },
  ]),

  // ── G chords ──
  chord('G', [
    { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  ]),
  chord('Gm', [
    { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  ]),
  chord('G7', [
    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  ]),
  chord('Gmaj7', [
    { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2] },
  ]),
  chord('Gm7', [
    { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barres: [1] },
  ]),

  // ── G# / Ab chords ──
  chord('G#', [
    { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
  ]),
  chord('G#m', [
    { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  ]),

  // ── A chords ──
  chord('A', [
    { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  ]),
  chord('Am', [
    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  ]),
  chord('A7', [
    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  ]),
  chord('Am7', [
    { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  ]),
  chord('Amaj7', [
    { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  ]),
  chord('Asus2', [
    { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  ]),
  chord('Asus4', [
    { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  ]),
  chord('Adim', [
    { frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  ]),

  // ── A# / Bb chords ──
  chord('A#', [
    { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  ]),
  chord('A#m', [
    { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Bb', [
    { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Bbm', [
    { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  ]),

  // ── B / H chords ──
  chord('B', [
    { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Bm', [
    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  ]),
  chord('B7', [
    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  ]),
  chord('Bm7', [
    { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  ]),
  chord('H', [
    { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  ]),
  chord('Hm', [
    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  ]),
  chord('H7', [
    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  ]),
];

/** Normalize chord name for lookup: handles flats, H notation */
function normalizeChordKey(name: string): string {
  // Replace Db→C#, Eb→D#, Gb→F#, Ab→G#, Bb→A# for lookup
  return name
    .replace(/^Db/, 'C#')
    .replace(/^Eb/, 'D#')
    .replace(/^Gb/, 'F#')
    .replace(/^Ab/, 'G#');
}

/** Find chord definitions by name */
export function findChord(name: string): ChordDefinition | undefined {
  const normalized = normalizeChordKey(name);
  return CHORD_DATABASE.find(c => c.key === name || c.key === normalized);
}

/** Get all unique root notes */
export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Get all chord types available */
export const CHORD_TYPES = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim'] as const;

/** Get display name for chord type */
export function getChordTypeLabel(type: string): string {
  switch (type) {
    case '': return 'Мажор';
    case 'm': return 'Минор';
    case '7': return 'Септ (7)';
    case 'm7': return 'Минор септ (m7)';
    case 'maj7': return 'Мажор септ (maj7)';
    case 'sus2': return 'Sus2';
    case 'sus4': return 'Sus4';
    case 'dim': return 'Уменьшённый';
    default: return type;
  }
}
