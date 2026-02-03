// All notes in chromatic scale
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// H is used in some countries instead of B
const NOTE_MAP: Record<string, string> = {
  'H': 'B',
  'Hb': 'Bb',
  'H#': 'C',
};

// Chord pattern for matching
export const CHORD_PATTERN = /\b([A-H][#b]?)(m|maj|min|dim|aug|sus|add|7|9|11|13|M|°|ø)*(\/[A-H][#b]?)?\b/g;

function normalizeNote(note: string): string {
  return NOTE_MAP[note] || note;
}

function getNoteIndex(note: string): number {
  const normalized = normalizeNote(note);
  let index = NOTES_SHARP.indexOf(normalized);
  if (index === -1) {
    index = NOTES_FLAT.indexOf(normalized);
  }
  return index;
}

function transposeNote(note: string, semitones: number, useFlats: boolean): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;
  
  const newIndex = (index + semitones + 12) % 12;
  return useFlats ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
}

export function transposeChord(chord: string, semitones: number, useFlats: boolean = false): string {
  if (semitones === 0) return chord;
  
  // Match the root note and optional bass note
  return chord.replace(/([A-H][#b]?)/g, (match) => {
    return transposeNote(match, semitones, useFlats);
  });
}

export function transposeContent(content: string, semitones: number, useFlats: boolean = false): string {
  if (semitones === 0) return content;
  
  return content.replace(CHORD_PATTERN, (match) => {
    return transposeChord(match, semitones, useFlats);
  });
}

// Get the key name for display
export function getTransposeLabel(semitones: number): string {
  if (semitones === 0) return 'Оригинал';
  const sign = semitones > 0 ? '+' : '';
  return `${sign}${semitones}`;
}

// Common keys for quick selection
export const COMMON_KEYS = [
  { label: 'C', semitones: 0 },
  { label: 'G', semitones: 7 },
  { label: 'D', semitones: 2 },
  { label: 'A', semitones: 9 },
  { label: 'E', semitones: 4 },
  { label: 'Am', semitones: 9 },
  { label: 'Em', semitones: 4 },
  { label: 'Dm', semitones: 2 },
];
