import { useState, useRef, useEffect } from 'react';
import {
  HarmonicaNote,
  HarmonicaLine,
  BreathDirection,
  formatHarmonicaNote,
  parseHarmonicaNoteString,
  createHarmonicaNote,
  HARMONICA_HOLES,
} from '@/types/harmonica';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HarmonicaLineEditorProps {
  line: HarmonicaLine;
  lineIndex: number;
  onChange: (line: HarmonicaLine) => void;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function HarmonicaLineEditor({
  line,
  lineIndex,
  onChange,
  onTitleChange,
  onDelete,
  canDelete,
}: HarmonicaLineEditorProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get note at position
  const getNoteAtPosition = (position: number): HarmonicaNote | undefined => {
    return line.notes.find((n) => n.position === position);
  };

  // Handle cell click
  const handleCellClick = (position: number) => {
    setSelectedPosition(position);
    const existingNote = getNoteAtPosition(position);
    if (existingNote) {
      setInputValue(formatHarmonicaNote(existingNote));
    } else {
      setInputValue('');
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (selectedPosition === null) return;

    // Try to parse the input
    const parsed = parseHarmonicaNoteString(value);
    if (parsed) {
      // Update or add note
      const existingIndex = line.notes.findIndex((n) => n.position === selectedPosition);
      const newNote = createHarmonicaNote(parsed.hole, parsed.direction, selectedPosition, parsed.bend);

      if (existingIndex >= 0) {
        const newNotes = [...line.notes];
        newNotes[existingIndex] = { ...newNote, id: line.notes[existingIndex].id };
        onChange({ ...line, notes: newNotes });
      } else {
        onChange({ ...line, notes: [...line.notes, newNote] });
      }
    } else if (value === '') {
      // Remove note
      const newNotes = line.notes.filter((n) => n.position !== selectedPosition);
      onChange({ ...line, notes: newNotes });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedPosition === null) return;

    if (e.key === 'ArrowLeft' && selectedPosition > 0) {
      e.preventDefault();
      handleCellClick(selectedPosition - 1);
    } else if (e.key === 'ArrowRight' && selectedPosition < line.columns - 1) {
      e.preventDefault();
      handleCellClick(selectedPosition + 1);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (inputValue === '') {
        const newNotes = line.notes.filter((n) => n.position !== selectedPosition);
        onChange({ ...line, notes: newNotes });
      }
    } else if (e.key === 'Escape') {
      setSelectedPosition(null);
      setInputValue('');
    }
  };

  // Add note from dropdown
  const handleAddNoteFromMenu = (hole: number, direction: BreathDirection, bend: number = 0) => {
    if (selectedPosition === null) return;

    const newNote = createHarmonicaNote(hole, direction, selectedPosition, bend);
    const existingIndex = line.notes.findIndex((n) => n.position === selectedPosition);

    if (existingIndex >= 0) {
      const newNotes = [...line.notes];
      newNotes[existingIndex] = { ...newNote, id: line.notes[existingIndex].id };
      onChange({ ...line, notes: newNotes });
    } else {
      onChange({ ...line, notes: [...line.notes, newNote] });
    }

    setInputValue(formatHarmonicaNote(newNote));
  };

  // Adjust columns
  const addColumns = () => onChange({ ...line, columns: line.columns + 4 });
  const removeColumns = () => {
    if (line.columns > 4) {
      onChange({ ...line, columns: line.columns - 4 });
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Line header */}
      <div className="flex items-center gap-3">
        <Input
          value={line.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`Строка ${lineIndex + 1} (название секции)`}
          className="flex-1 bg-transparent border-dashed"
        />
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={removeColumns} disabled={line.columns <= 4}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-xs text-muted-foreground w-8 text-center">{line.columns}</span>
          <Button variant="outline" size="sm" onClick={addColumns}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            Удалить
          </Button>
        )}
      </div>

      {/* Hidden input for keyboard entry */}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="sr-only"
        aria-label="Ввод ноты"
      />

      {/* Note cells */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {Array.from({ length: line.columns }).map((_, position) => {
          const note = getNoteAtPosition(position);
          const isSelected = selectedPosition === position;

          return (
            <DropdownMenu key={position}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={() => handleCellClick(position)}
                  className={cn(
                    'w-12 h-10 flex items-center justify-center rounded border text-sm font-mono transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50',
                    note && !isSelected && 'bg-secondary/50'
                  )}
                >
                  {note ? (
                    <span className={cn(
                      'font-semibold',
                      note.direction === 'blow' ? 'text-primary' : 'text-secondary-foreground'
                    )}>
                      {formatHarmonicaNote(note)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">•</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-y-auto">
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                  Выдох (+)
                </div>
                {HARMONICA_HOLES.map((hole) => (
                  <DropdownMenuItem
                    key={`blow-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'blow')}
                    className="font-mono"
                  >
                    +{hole}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                  Вдох (-)
                </div>
                {HARMONICA_HOLES.map((hole) => (
                  <DropdownMenuItem
                    key={`draw-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'draw')}
                    className="font-mono"
                  >
                    -{hole}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                  Бенды вдоха
                </div>
                {[1, 2, 3, 4, 5, 6].map((hole) => (
                  <DropdownMenuItem
                    key={`bend1-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'draw', 1)}
                    className="font-mono"
                  >
                    -{hole}'
                  </DropdownMenuItem>
                ))}
                {[2, 3].map((hole) => (
                  <DropdownMenuItem
                    key={`bend2-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'draw', 2)}
                    className="font-mono"
                  >
                    -{hole}''
                  </DropdownMenuItem>
                ))}
                {[3].map((hole) => (
                  <DropdownMenuItem
                    key={`bend3-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'draw', 3)}
                    className="font-mono"
                  >
                    -{hole}'''
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                  Бенды выдоха (overblow)
                </div>
                {[8, 9, 10].map((hole) => (
                  <DropdownMenuItem
                    key={`overblow-${hole}`}
                    onClick={() => handleAddNoteFromMenu(hole, 'blow', 1)}
                    className="font-mono"
                  >
                    +{hole}'
                  </DropdownMenuItem>
                ))}
                {note && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        const newNotes = line.notes.filter((n) => n.position !== position);
                        onChange({ ...line, notes: newNotes });
                        setInputValue('');
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      Удалить ноту
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Кликните на ячейку и введите ноту (+1 для выдоха, -3 для вдоха, -3' для бенда) или выберите из меню
      </p>
    </div>
  );
}
