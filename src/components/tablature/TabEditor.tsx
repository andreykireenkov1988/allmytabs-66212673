import { useState, useCallback, DragEvent } from 'react';
import { STRING_NAMES, TablatureContent, TablatureLine, TablatureNote, createEmptyLine } from '@/types/tablature';
import { Plus, Minus, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TabEditorProps {
  content: TablatureContent;
  onChange: (content: TablatureContent) => void;
}

interface DragData {
  lineId: string;
  stringIndex: number;
  position: number;
  fret: string;
}

export function TabEditor({ content, onChange }: TabEditorProps) {
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ lineId: string; stringIndex: number; position: number } | null>(null);

  const updateLine = useCallback(
    (lineId: string, updates: Partial<TablatureLine>) => {
      onChange({
        lines: content.lines.map((line) =>
          line.id === lineId ? { ...line, ...updates } : line
        ),
      });
    },
    [content, onChange]
  );

  const addLine = useCallback(() => {
    onChange({
      lines: [...content.lines, createEmptyLine()],
    });
  }, [content, onChange]);

  const removeLine = useCallback(
    (lineId: string) => {
      if (content.lines.length <= 1) return;
      onChange({
        lines: content.lines.filter((line) => line.id !== lineId),
      });
    },
    [content, onChange]
  );

  const getNoteAt = useCallback(
    (line: TablatureLine, stringIndex: number, position: number): string => {
      const note = line.notes.find(
        (n) => n.stringIndex === stringIndex && n.position === position
      );
      return note?.fret ?? '';
    },
    []
  );

  const setNoteAt = useCallback(
    (lineId: string, stringIndex: number, position: number, fret: string) => {
      const line = content.lines.find((l) => l.id === lineId);
      if (!line) return;

      const existingIndex = line.notes.findIndex(
        (n) => n.stringIndex === stringIndex && n.position === position
      );

      let newNotes: TablatureNote[];

      if (fret === '') {
        newNotes = line.notes.filter(
          (n) => !(n.stringIndex === stringIndex && n.position === position)
        );
      } else if (existingIndex >= 0) {
        newNotes = [...line.notes];
        newNotes[existingIndex] = { stringIndex, position, fret };
      } else {
        newNotes = [...line.notes, { stringIndex, position, fret }];
      }

      updateLine(lineId, { notes: newNotes });
    },
    [content, updateLine]
  );

  const addColumns = (lineId: string) => {
    const line = content.lines.find((l) => l.id === lineId);
    if (line) {
      updateLine(lineId, { columns: line.columns + 8 });
    }
  };

  const removeColumns = (lineId: string) => {
    const line = content.lines.find((l) => l.id === lineId);
    if (line) {
      updateLine(lineId, { columns: Math.max(8, line.columns - 8) });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLInputElement>, lineId: string, stringIndex: number, position: number, fret: string) => {
    if (!fret) {
      e.preventDefault();
      return;
    }
    setDragData({ lineId, stringIndex, position, fret });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fret);
  };

  const handleDragOver = (e: DragEvent<HTMLInputElement>, lineId: string, stringIndex: number, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ lineId, stringIndex, position });
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: DragEvent<HTMLInputElement>, targetLineId: string, targetStringIndex: number, targetPosition: number) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (!dragData) return;

    // Don't do anything if dropping on the same position
    if (
      dragData.lineId === targetLineId &&
      dragData.stringIndex === targetStringIndex &&
      dragData.position === targetPosition
    ) {
      setDragData(null);
      return;
    }

    // Remove from source position
    setNoteAt(dragData.lineId, dragData.stringIndex, dragData.position, '');
    
    // Add to target position
    setNoteAt(targetLineId, targetStringIndex, targetPosition, dragData.fret);
    
    setDragData(null);
  };

  const handleDragEnd = () => {
    setDragData(null);
    setDragOverTarget(null);
  };

  return (
    <div className="space-y-6">
      {content.lines.map((line, lineIndex) => (
        <div key={line.id} className="tab-container overflow-x-auto animate-fade-in">
          {/* Line header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <Input
              value={line.title}
              onChange={(e) => updateLine(line.id, { title: e.target.value })}
              placeholder={`Строка ${lineIndex + 1} (например: Вступление, Куплет, Припев)`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium placeholder:text-muted-foreground/50"
            />
            {content.lines.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLine(line.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Column controls */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeColumns(line.id)}
              className="h-8"
            >
              <Minus className="w-4 h-4 mr-1" />
              Меньше
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addColumns(line.id)}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Больше
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              {line.columns} позиций
            </span>
          </div>

          {/* Tab grid */}
          <div className="inline-block min-w-full">
            {STRING_NAMES.map((stringName, stringIndex) => (
              <div key={stringIndex} className="flex items-center gap-0 mb-1">
                <span className="string-label">{stringName}</span>
                <div className="flex-1 relative flex items-center">
                  {/* String line */}
                  <div className="absolute left-0 right-0 h-px bg-string-line" />
                  
                  {/* Fret inputs */}
                  <div className="flex relative z-10">
                    {Array.from({ length: line.columns }).map((_, position) => {
                      const fretValue = getNoteAt(line, stringIndex, position);
                      const isDragOver =
                        dragOverTarget?.lineId === line.id &&
                        dragOverTarget?.stringIndex === stringIndex &&
                        dragOverTarget?.position === position;
                      
                      return (
                        <input
                          key={position}
                          type="text"
                          maxLength={3}
                          value={fretValue}
                          onChange={(e) =>
                            setNoteAt(line.id, stringIndex, position, e.target.value)
                          }
                          draggable={!!fretValue}
                          onDragStart={(e) => handleDragStart(e, line.id, stringIndex, position, fretValue)}
                          onDragOver={(e) => handleDragOver(e, line.id, stringIndex, position)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, line.id, stringIndex, position)}
                          onDragEnd={handleDragEnd}
                          className={`tab-fret-input ${fretValue ? 'cursor-grab active:cursor-grabbing' : ''} ${
                            isDragOver ? 'ring-2 ring-primary bg-primary/20' : ''
                          }`}
                          placeholder="-"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add line button */}
      <Button
        variant="outline"
        onClick={addLine}
        className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-primary/50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить новую строку
      </Button>
    </div>
  );
}
