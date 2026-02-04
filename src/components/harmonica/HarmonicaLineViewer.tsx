import {
  HarmonicaNote,
  HarmonicaLine,
  HarmonicaChord,
  formatHarmonicaNote,
  formatHarmonicaChord,
} from '@/types/harmonica';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface HarmonicaLineViewerProps {
  line: HarmonicaLine;
  lineIndex: number;
}

export function HarmonicaLineViewer({ line, lineIndex }: HarmonicaLineViewerProps) {
  // Build a map of position -> chord for quick lookup
  const chordAtPosition = useMemo(() => {
    const map = new Map<number, HarmonicaChord>();
    for (const chord of (line.chords || [])) {
      for (let i = 0; i < chord.span; i++) {
        map.set(chord.position + i, chord);
      }
    }
    return map;
  }, [line.chords]);

  // Get positions occupied by chords
  const positionsInChords = useMemo(() => {
    const set = new Set<number>();
    for (const chord of (line.chords || [])) {
      for (let i = 0; i < chord.span; i++) {
        set.add(chord.position + i);
      }
    }
    return set;
  }, [line.chords]);

  const getNoteAtPosition = (position: number): HarmonicaNote | undefined => {
    if (positionsInChords.has(position)) return undefined;
    return line.notes.find((n) => n.position === position);
  };

  // Render cells with chord awareness
  const renderCells = () => {
    const cells: React.ReactNode[] = [];
    let position = 0;
    
    while (position < line.columns) {
      const chord = chordAtPosition.get(position);
      
      if (chord && chord.position === position) {
        // Render chord cell
        cells.push(
          <div
            key={`chord-${chord.id}`}
            className={cn(
              'h-8 flex items-center justify-center rounded border text-sm font-mono',
              'border-border bg-accent/30'
            )}
            style={{ width: `${chord.span * 40 + (chord.span - 1) * 4}px` }}
          >
            <span className={cn(
              'font-semibold',
              chord.notes[0]?.direction === 'blow' ? 'text-primary' : 'text-foreground'
            )}>
              {formatHarmonicaChord(chord)}
            </span>
          </div>
        );
        position += chord.span;
      } else if (!chordAtPosition.has(position)) {
        // Render regular note cell
        const note = getNoteAtPosition(position);
        
        cells.push(
          <div
            key={position}
            className={cn(
              'w-10 h-8 flex items-center justify-center rounded border text-sm font-mono',
              note 
                ? 'border-border bg-secondary/30' 
                : 'border-transparent'
            )}
          >
            {note ? (
              <span className={cn(
                'font-semibold',
                note.direction === 'blow' ? 'text-primary' : 'text-foreground'
              )}>
                {formatHarmonicaNote(note)}
              </span>
            ) : null}
          </div>
        );
        position++;
      } else {
        // Skip positions that are part of a chord but not the start
        position++;
      }
    }
    
    return cells;
  };

  return (
    <div className="space-y-2">
      {line.title && (
        <h4 className="text-sm font-medium text-muted-foreground">{line.title}</h4>
      )}
      
      <div className="flex items-center gap-1 flex-wrap">
        {renderCells()}
      </div>
    </div>
  );
}