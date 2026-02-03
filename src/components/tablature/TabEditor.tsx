import { useState, useCallback } from 'react';
import { STRING_NAMES, TablatureNote } from '@/types/tablature';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabEditorProps {
  content: TablatureNote[];
  onChange: (content: TablatureNote[]) => void;
}

const INITIAL_COLUMNS = 16;

export function TabEditor({ content, onChange }: TabEditorProps) {
  const [columns, setColumns] = useState(() => {
    const maxPos = content.reduce((max, note) => Math.max(max, note.position), 0);
    return Math.max(INITIAL_COLUMNS, maxPos + 4);
  });

  const getNoteAt = useCallback(
    (stringIndex: number, position: number): string => {
      const note = content.find(
        (n) => n.stringIndex === stringIndex && n.position === position
      );
      return note?.fret ?? '';
    },
    [content]
  );

  const setNoteAt = useCallback(
    (stringIndex: number, position: number, fret: string) => {
      const existingIndex = content.findIndex(
        (n) => n.stringIndex === stringIndex && n.position === position
      );

      let newContent: TablatureNote[];

      if (fret === '') {
        // Remove note
        newContent = content.filter(
          (n) => !(n.stringIndex === stringIndex && n.position === position)
        );
      } else if (existingIndex >= 0) {
        // Update existing note
        newContent = [...content];
        newContent[existingIndex] = { stringIndex, position, fret };
      } else {
        // Add new note
        newContent = [...content, { stringIndex, position, fret }];
      }

      onChange(newContent);
    },
    [content, onChange]
  );

  const addColumns = () => setColumns((c) => c + 8);
  const removeColumns = () => setColumns((c) => Math.max(8, c - 8));

  return (
    <div className="tab-container overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={removeColumns}
          className="h-8"
        >
          <Minus className="w-4 h-4 mr-1" />
          Меньше
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addColumns}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Больше
        </Button>
        <span className="text-sm text-muted-foreground ml-2">
          {columns} позиций
        </span>
      </div>

      <div className="inline-block min-w-full">
        {STRING_NAMES.map((stringName, stringIndex) => (
          <div key={stringIndex} className="flex items-center gap-0 mb-1">
            <span className="string-label">{stringName}</span>
            <div className="flex-1 relative flex items-center">
              {/* String line */}
              <div className="absolute left-0 right-0 h-px bg-string-line" />
              
              {/* Fret inputs */}
              <div className="flex relative z-10">
                {Array.from({ length: columns }).map((_, position) => (
                  <input
                    key={position}
                    type="text"
                    maxLength={3}
                    value={getNoteAt(stringIndex, position)}
                    onChange={(e) =>
                      setNoteAt(stringIndex, position, e.target.value)
                    }
                    className="tab-fret-input"
                    placeholder="-"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
