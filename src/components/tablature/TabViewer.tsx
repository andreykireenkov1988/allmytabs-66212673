import { STRING_NAMES, TablatureContent, TablatureLine } from '@/types/tablature';
import { ConnectionRenderer } from './ConnectionRenderer';

interface TabViewerProps {
  content: TablatureContent;
}

export function TabViewer({ content }: TabViewerProps) {
  const CELL_WIDTH = 28;
  const CELL_HEIGHT = 24;

  const getNoteAt = (line: TablatureLine, stringIndex: number, position: number): string => {
    const note = line.notes.find(
      (n) => n.stringIndex === stringIndex && n.position === position
    );
    return note?.fret ?? '';
  };

  return (
    <div className="space-y-6">
      {content.lines.map((line, lineIndex) => (
        <div key={line.id} className="tab-container overflow-x-auto">
          {/* Line title */}
          {line.title && (
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {line.title}
            </h4>
          )}

          {/* Tab grid */}
          <div className="inline-block min-w-full">
            {/* Chord row */}
            {line.chords && line.chords.length > 0 && (
              <div className="flex items-center gap-0 mb-1">
                <span className="string-label"> </span>
                <div className="flex">
                  {Array.from({ length: line.columns }).map((_, position) => {
                    const chordEntry = line.chords.find(c => c.position === position);
                    return (
                      <div
                        key={`chord-${position}`}
                        className="flex items-center justify-center text-xs font-semibold text-primary"
                        style={{ width: CELL_WIDTH, height: 20 }}
                      >
                        {chordEntry?.chord || ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {STRING_NAMES.map((stringName, stringIndex) => (
              <div key={stringIndex} className="flex items-center gap-0 mb-1">
                <span className="string-label">{stringName}</span>
                <div className="flex-1 relative flex items-center" style={{ height: CELL_HEIGHT }}>
                  {/* String line */}
                  <div className="absolute left-0 right-0 h-px bg-string-line" />
                  
                  {/* Connection renderer */}
                  <ConnectionRenderer 
                    connections={line.connections || []}
                    stringIndex={stringIndex}
                    cellWidth={CELL_WIDTH}
                    cellHeight={CELL_HEIGHT}
                    selectedConnectionId={null}
                    onConnectionClick={() => {}}
                    notes={line.notes}
                  />
                  
                  {/* Fret values */}
                  <div className="flex relative z-10">
                    {Array.from({ length: line.columns }).map((_, position) => {
                      const fretValue = getNoteAt(line, stringIndex, position);
                      
                      return (
                        <div
                          key={position}
                          className="fret-cell flex items-center justify-center"
                          style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                        >
                          {fretValue && (
                            <span className="text-xs font-mono font-semibold text-foreground bg-background px-0.5">
                              {fretValue}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
