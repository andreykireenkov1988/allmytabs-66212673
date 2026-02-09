// This module parses the raw guitar chords JSON from tombatossals/chords-db
// and converts it to our ChordDefinition format.

import rawData from '@/data/guitar-chords-raw.json';
import { ChordVoicing, ChordDefinition } from '@/lib/chordDatabase';

interface RawPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  capo?: boolean;
}

interface RawChord {
  key: string;
  suffix: string;
  positions: RawPosition[];
}

// Map suffix names to display suffixes
const SUFFIX_MAP: Record<string, string> = {
  'major': '',
  'minor': 'm',
  'dim': 'dim',
  'dim7': 'dim7',
  'sus2': 'sus2',
  'sus4': 'sus4',
  '7': '7',
  '7b5': '7b5',
  'aug': 'aug',
  'aug7': 'aug7',
  '5': '5',
  '6': '6',
  '69': '6/9',
  '9': '9',
  '9b5': '9b5',
  'aug9': 'aug9',
  '7b9': '7b9',
  '7#9': '7#9',
  '11': '11',
  '9#11': '9#11',
  '13': '13',
  'maj7': 'maj7',
  'maj7b5': 'maj7b5',
  'maj7#5': 'maj7#5',
  'maj9': 'maj9',
  'maj11': 'maj11',
  'maj13': 'maj13',
  'm6': 'm6',
  'm69': 'm6/9',
  'm7': 'm7',
  'm7b5': 'm7b5',
  'm9': 'm9',
  'm11': 'm11',
  'mmaj7': 'mmaj7',
  'mmaj7b5': 'mmaj7b5',
  'mmaj9': 'mmaj9',
  'mmaj11': 'mmaj11',
  'add9': 'add9',
  'madd9': 'madd9',
  'add11': 'add11',
  'sus': 'sus',
  'sus2sus4': 'sus2sus4',
  '7sus4': '7sus4',
  'alt': 'alt',
  'maj7sus2': 'maj7sus2',
};

// Commonly used suffixes to include (skip obscure slash chords etc.)
const INCLUDED_SUFFIXES = new Set([
  'major', 'minor', 'dim', 'dim7', 'sus2', 'sus4', '7', '7b5',
  'aug', 'aug7', '5', '6', '69', '9', '9b5', '7b9', '7#9',
  '11', '13', 'maj7', 'maj7b5', 'maj7#5', 'maj9', 'maj11', 'maj13',
  'm6', 'm69', 'm7', 'm7b5', 'm9', 'm11',
  'mmaj7', 'mmaj9', 'add9', 'madd9', 'sus', '7sus4',
  'alt', 'aug9',
]);

function convertPosition(pos: RawPosition): ChordVoicing {
  return {
    frets: pos.frets,
    fingers: pos.fingers,
    baseFret: pos.baseFret,
    barres: pos.barres?.length > 0 ? pos.barres : undefined,
  };
}

let _parsedChords: ChordDefinition[] | null = null;

export function getAllChords(): ChordDefinition[] {
  if (_parsedChords) return _parsedChords;

  const data = rawData as any;
  const chords: ChordDefinition[] = [];

  for (const key of Object.keys(data.chords)) {
    const chordGroup: RawChord[] = data.chords[key];
    for (const chord of chordGroup) {
      if (!INCLUDED_SUFFIXES.has(chord.suffix)) continue;

      const suffix = SUFFIX_MAP[chord.suffix] ?? chord.suffix;
      const name = `${chord.key}${suffix}`;
      
      // Take up to 4 most useful voicings (first ones are typically best)
      const voicings = chord.positions.slice(0, 4).map(convertPosition);

      chords.push({ name, key: name, voicings });
    }
  }

  // Also add H notation aliases for B chords
  const bChords = chords.filter(c => c.key.startsWith('B') && !c.key.startsWith('Bb'));
  for (const bc of bChords) {
    const hName = 'H' + bc.key.slice(1);
    chords.push({ name: hName, key: hName, voicings: bc.voicings });
  }

  _parsedChords = chords;
  return chords;
}

/** Find a chord by name from the full database */
export function findChordFull(name: string): ChordDefinition | undefined {
  const chords = getAllChords();
  
  // Direct match
  let found = chords.find(c => c.key === name);
  if (found) return found;

  // Try normalizing flats to sharps
  const normalized = name
    .replace(/^Db/, 'C#')
    .replace(/^Eb/, 'D#')  
    .replace(/^Gb/, 'F#')
    .replace(/^Ab/, 'G#');
  found = chords.find(c => c.key === normalized);
  if (found) return found;

  // Try sharps to flats (the DB uses Eb, Ab, Bb)
  const toFlat = name
    .replace(/^C#/, 'Db')
    .replace(/^D#/, 'Eb')
    .replace(/^F#/, 'Gb')  // DB actually uses F# though
    .replace(/^G#/, 'Ab');
  found = chords.find(c => c.key === toFlat);
  if (found) return found;

  // The raw DB uses specific key names: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
  // Map our input accordingly
  const dbKeyMap: Record<string, string> = {
    'Db': 'C#', 'D#': 'Eb', 'Gb': 'F#', 'G#': 'Ab', 'A#': 'Bb',
  };
  
  const rootMatch = name.match(/^([A-H][#b]?)(.*)/);
  if (rootMatch) {
    const [, root, suffix] = rootMatch;
    const mappedRoot = dbKeyMap[root] || root;
    if (mappedRoot !== root) {
      found = chords.find(c => c.key === `${mappedRoot}${suffix}`);
      if (found) return found;
    }
  }

  return undefined;
}

/** Get all unique suffixes available */
export function getAvailableSuffixes(): string[] {
  return Array.from(INCLUDED_SUFFIXES).map(s => SUFFIX_MAP[s] ?? s);
}
