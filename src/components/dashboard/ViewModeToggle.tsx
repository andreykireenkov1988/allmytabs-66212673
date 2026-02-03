import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'tiles' | 'table';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('tiles')}
        className={cn(
          'h-8 px-3 gap-2',
          value === 'tiles' && 'bg-muted'
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Плитки</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('table')}
        className={cn(
          'h-8 px-3 gap-2',
          value === 'table' && 'bg-muted'
        )}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Таблица</span>
      </Button>
    </div>
  );
}
