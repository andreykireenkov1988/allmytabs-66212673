import { Button } from '@/components/ui/button';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { getTransposeLabel } from '@/lib/chordUtils';
import { Toggle } from '@/components/ui/toggle';

interface TransposeControlsProps {
  value: number;
  onChange: (value: number) => void;
  useFlats: boolean;
  onToggleFlats: () => void;
}

export function TransposeControls({ 
  value, 
  onChange, 
  useFlats, 
  onToggleFlats 
}: TransposeControlsProps) {
  const handleDecrease = () => {
    onChange(value - 1);
  };

  const handleIncrease = () => {
    onChange(value + 1);
  };

  const handleReset = () => {
    onChange(0);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Транспонирование:</span>
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrease}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <span className="min-w-[60px] text-center font-mono text-sm font-medium">
          {getTransposeLabel(value)}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrease}
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        {value !== 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleReset}
            title="Сбросить"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <Toggle
        pressed={useFlats}
        onPressedChange={onToggleFlats}
        size="sm"
        className="text-xs"
        title="Использовать бемоли вместо диезов"
      >
        {useFlats ? '♭' : '♯'}
      </Toggle>
    </div>
  );
}
