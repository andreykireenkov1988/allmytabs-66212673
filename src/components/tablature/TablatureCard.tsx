import { Tablature, STRING_NAMES } from '@/types/tablature';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Music, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablatureCardProps {
  tablature: Tablature;
  onEdit: (tablature: Tablature) => void;
  onDelete: (id: string) => void;
}

export function TablatureCard({ tablature, onEdit, onDelete }: TablatureCardProps) {
  const previewColumns = 12;

  const getNoteAt = (stringIndex: number, position: number): string => {
    const note = tablature.content.find(
      (n: any) => n.stringIndex === stringIndex && n.position === position
    );
    return note?.fret ?? '-';
  };

  return (
    <div className="glass-card p-5 group hover:border-primary/30 transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {tablature.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(tablature.updated_at), {
                addSuffix: true,
                locale: ru,
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(tablature)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(tablature.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tab preview */}
      <div 
        className="bg-tab-bg rounded-lg p-3 overflow-hidden cursor-pointer"
        onClick={() => onEdit(tablature)}
      >
        <div className="font-mono text-xs">
          {STRING_NAMES.map((stringName, stringIndex) => (
            <div key={stringIndex} className="flex items-center">
              <span className="text-string-label w-4">{stringName}</span>
              <span className="text-string-line">|</span>
              {Array.from({ length: previewColumns }).map((_, position) => (
                <span
                  key={position}
                  className={`w-4 text-center ${
                    getNoteAt(stringIndex, position) !== '-'
                      ? 'text-fret-number'
                      : 'text-string-line'
                  }`}
                >
                  {getNoteAt(stringIndex, position)}
                </span>
              ))}
              <span className="text-muted-foreground">...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
