import { useState, useRef, useMemo } from 'react';
import {
  HarmonicaNote,
  HarmonicaLine,
  HarmonicaChord,
  BreathDirection,
  formatHarmonicaNote,
  formatHarmonicaChord,
  parseHarmonicaNoteString,
  createHarmonicaNote,
  createHarmonicaChord,
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
import { Plus, Minus, Combine, X } from 'lucide-react';
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
  const [selectedPositions, setSelectedPositions] = useState<Set<number>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMultiSelect = selectedPositions.size > 1;
  const activePosition = selectedPositions.size === 1 ? Array.from(selectedPositions)[0] : null;

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

  // Get note at position (excluding notes that are part of chords)
  const getNoteAtPosition = (position: number): HarmonicaNote | undefined => {
    if (positionsInChords.has(position)) return undefined;
    return line.notes.find((n) => n.position === position);
  };

  // Handle cell click with shift for multi-select
  const handleCellClick = (position: number, shiftKey: boolean) => {
    if (shiftKey && selectedPositions.size > 0) {
      // Extend selection
      const positions = Array.from(selectedPositions);
      const minPos = Math.min(...positions, position);
      const maxPos = Math.max(...positions, position);
      const newSelection = new Set<number>();
      for (let i = minPos; i <= maxPos; i++) {
        newSelection.add(i);
      }
      setSelectedPositions(newSelection);
    } else {
      // Single selection
      setSelectedPositions(new Set([position]));
      const existingNote = getNoteAtPosition(position);
      if (existingNote) {
        setInputValue(formatHarmonicaNote(existingNote));
      } else {
        setInputValue('');
      }
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (activePosition === null) return;

    // Try to parse the input
    const parsed = parseHarmonicaNoteString(value);
    if (parsed) {
      // Update or add note
      const existingIndex = line.notes.findIndex((n) => n.position === activePosition);
      const newNote = createHarmonicaNote(parsed.hole, parsed.direction, activePosition, parsed.bend);

      if (existingIndex >= 0) {
        const newNotes = [...line.notes];
        newNotes[existingIndex] = { ...newNote, id: line.notes[existingIndex].id };
        onChange({ ...line, notes: newNotes });
      } else {
        onChange({ ...line, notes: [...line.notes, newNote] });
      }
    } else if (value === '') {
      // Remove note
      const newNotes = line.notes.filter((n) => n.position !== activePosition);
      onChange({ ...line, notes: newNotes });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activePosition === null) return;

    if (e.key === 'ArrowLeft' && activePosition > 0) {
      e.preventDefault();
      handleCellClick(activePosition - 1, false);
    } else if (e.key === 'ArrowRight' && activePosition < line.columns - 1) {
      e.preventDefault();
      handleCellClick(activePosition + 1, false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (inputValue === '') {
        const newNotes = line.notes.filter((n) => n.position !== activePosition);
        onChange({ ...line, notes: newNotes });
      }
    } else if (e.key === 'Escape') {
      setSelectedPositions(new Set());
      setInputValue('');
    }
  };

  // Add note from dropdown
  const handleAddNoteFromMenu = (position: number, hole: number, direction: BreathDirection, bend: number = 0) => {
    const newNote = createHarmonicaNote(hole, direction, position, bend);
    const existingIndex = line.notes.findIndex((n) => n.position === position);

    if (existingIndex >= 0) {
      const newNotes = [...line.notes];
      newNotes[existingIndex] = { ...newNote, id: line.notes[existingIndex].id };
      onChange({ ...line, notes: newNotes });
    } else {
      onChange({ ...line, notes: [...line.notes, newNote] });
    }

    setSelectedPositions(new Set([position]));
    setInputValue(formatHarmonicaNote(newNote));
  };

  // Delete note at position
  const handleDeleteNote = (position: number) => {
    const newNotes = line.notes.filter((n) => n.position !== position);
    onChange({ ...line, notes: newNotes });
    setInputValue('');
  };

  // Check if selected positions can be merged
  const canMerge = useMemo(() => {
    if (selectedPositions.size < 2) return false;
    
    const positions = Array.from(selectedPositions).sort((a, b) => a - b);
    
    // Check they are adjacent
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] !== positions[i - 1] + 1) return false;
    }
    
    // Check all have notes with same direction
    const notes: HarmonicaNote[] = [];
    for (const pos of positions) {
      const note = getNoteAtPosition(pos);
      if (!note) return false;
      notes.push(note);
    }
    
    // All must have same direction and no bends
    const direction = notes[0].direction;
    for (const note of notes) {
      if (note.direction !== direction || note.bend > 0) return false;
    }
    
    return true;
  }, [selectedPositions, line.notes, positionsInChords]);

  // Merge selected notes into a chord
  const handleMerge = () => {
    if (!canMerge) return;
    
    const positions = Array.from(selectedPositions).sort((a, b) => a - b);
    const notesToMerge: HarmonicaNote[] = [];
    
    for (const pos of positions) {
      const note = getNoteAtPosition(pos);
      if (note) notesToMerge.push(note);
    }
    
    const chord = createHarmonicaChord(notesToMerge, positions[0], positions.length);
    
    // Remove merged notes from notes array
    const newNotes = line.notes.filter(n => !positions.includes(n.position));
    
    // Add chord
    const newChords = [...(line.chords || []), chord];
    
    onChange({ ...line, notes: newNotes, chords: newChords });
    setSelectedPositions(new Set());
  };

  // Unmerge a chord back to individual notes
  const handleUnmergeChord = (chord: HarmonicaChord) => {
    // Remove chord
    const newChords = (line.chords || []).filter(c => c.id !== chord.id);
    
    // Add notes back
    const newNotes = [...line.notes, ...chord.notes];
    
    onChange({ ...line, notes: newNotes, chords: newChords });
    setSelectedPositions(new Set());
  };

  // Delete a chord
  const handleDeleteChord = (chord: HarmonicaChord) => {
    const newChords = (line.chords || []).filter(c => c.id !== chord.id);
    onChange({ ...line, chords: newChords });
  };

  // Adjust columns
  const addColumns = () => onChange({ ...line, columns: line.columns + 4 });
  const removeColumns = () => {
    if (line.columns > 4) {
      onChange({ ...line, columns: line.columns - 4 });
    }
  };

  // Render cells with chord awareness
  const renderCells = () => {
    const cells: React.ReactNode[] = [];
    let position = 0;
    
    while (position < line.columns) {
      const chord = chordAtPosition.get(position);
      
      if (chord && chord.position === position) {
        // Render chord cell
        const isSelected = selectedPositions.has(position);
        cells.push(
          <div
            key={`chord-${chord.id}`}
            className={cn(
              'h-10 flex items-center justify-center rounded border text-sm font-mono transition-all relative group',
              isSelected
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-border bg-accent/30 hover:border-primary/50',
            )}
            style={{ width: `${chord.span * 48 + (chord.span - 1) * 4}px` }}
            onClick={(e) => handleCellClick(position, e.shiftKey)}
          >
            <span className={cn(
              'font-semibold text-base',
              chord.notes[0]?.direction === 'blow' ? 'text-primary' : 'text-secondary-foreground'
            )}>
              {formatHarmonicaChord(chord)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUnmergeChord(chord);
              }}
              title="Разъединить"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
        position += chord.span;
      } else if (!chordAtPosition.has(position)) {
        // Render regular note cell
        const note = getNoteAtPosition(position);
        const isSelected = selectedPositions.has(position);
        const currentPos = position;
        
        cells.push(
          <DropdownMenu key={position}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => handleCellClick(currentPos, e.shiftKey)}
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
            <DropdownMenuContent className="max-h-80 overflow-y-auto bg-popover border border-border shadow-lg z-50">
              <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                Выдох
              </div>
              {HARMONICA_HOLES.map((hole) => (
                <DropdownMenuItem
                  key={`blow-${hole}`}
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'blow')}
                  className="font-mono cursor-pointer"
                >
                  {hole}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">
                Вдох (-)
              </div>
              {HARMONICA_HOLES.map((hole) => (
                <DropdownMenuItem
                  key={`draw-${hole}`}
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'draw')}
                  className="font-mono cursor-pointer"
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
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'draw', 1)}
                  className="font-mono cursor-pointer"
                >
                  -{hole}'
                </DropdownMenuItem>
              ))}
              {[2, 3].map((hole) => (
                <DropdownMenuItem
                  key={`bend2-${hole}`}
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'draw', 2)}
                  className="font-mono cursor-pointer"
                >
                  -{hole}''
                </DropdownMenuItem>
              ))}
              {[3].map((hole) => (
                <DropdownMenuItem
                  key={`bend3-${hole}`}
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'draw', 3)}
                  className="font-mono cursor-pointer"
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
                  onSelect={() => handleAddNoteFromMenu(currentPos, hole, 'blow', 1)}
                  className="font-mono cursor-pointer"
                >
                  {hole}'
                </DropdownMenuItem>
              ))}
              {note && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleDeleteNote(currentPos)}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    Удалить ноту
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Merge button when multiple cells selected */}
      {isMultiSelect && (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleMerge}
            disabled={!canMerge}
            className="gap-2"
          >
            <Combine className="w-4 h-4" />
            Объединить ({selectedPositions.size} ячеек)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPositions(new Set())}
          >
            Отмена
          </Button>
          {!canMerge && selectedPositions.size >= 2 && (
            <span className="text-xs text-muted-foreground">
              Можно объединить только соседние ноты с одинаковым направлением
            </span>
          )}
        </div>
      )}

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
        {renderCells()}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Кликните на ячейку для ввода ноты. Shift+клик для выбора нескольких соседних ячеек и объединения в аккорд.
      </p>
    </div>
  );
}