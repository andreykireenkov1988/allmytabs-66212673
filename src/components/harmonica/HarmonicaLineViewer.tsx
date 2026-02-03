import {
  HarmonicaNote,
  HarmonicaLine,
  formatHarmonicaNote,
} from '@/types/harmonica';
import { cn } from '@/lib/utils';

interface HarmonicaLineViewerProps {
  line: HarmonicaLine;
  lineIndex: number;
}

export function HarmonicaLineViewer({ line, lineIndex }: HarmonicaLineViewerProps) {
  const getNoteAtPosition = (position: number): HarmonicaNote | undefined => {
    return line.notes.find((n) => n.position === position);
  };

  return (
    <div className="space-y-2">
      {line.title && (
        <h4 className="text-sm font-medium text-muted-foreground">{line.title}</h4>
      )}
      
      <div className="flex items-center gap-1 flex-wrap">
        {Array.from({ length: line.columns }).map((_, position) => {
          const note = getNoteAtPosition(position);

          return (
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
        })}
      </div>
    </div>
  );
}
