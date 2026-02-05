import { ConnectionType, BendSize, BEND_SIZES } from '@/types/tablature';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2 } from 'lucide-react';

interface ConnectionControlsProps {
  onAddConnection: (type: ConnectionType) => void;
  disabled?: boolean;
  singleNoteSelected?: boolean;
  onAddBend?: (size: BendSize) => void;
  hasBend?: boolean;
  onRemoveBend?: () => void;
}

export function ConnectionControls({ 
  onAddConnection, 
  disabled = false,
  singleNoteSelected = false,
  onAddBend,
  hasBend = false,
  onRemoveBend
}: ConnectionControlsProps) {
  // If single note is selected, show bend options
  if (singleNoteSelected) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
          >
            <span className="text-base">↗</span>
            Бенд
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="flex flex-col gap-1">
            {hasBend && onRemoveBend && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-9 text-destructive hover:text-destructive"
                  onClick={onRemoveBend}
                >
                  Убрать бенд
                </Button>
                <div className="h-px bg-border my-1" />
              </>
            )}
            <p className="text-xs text-muted-foreground px-2 py-1">Размер бенда:</p>
            {BEND_SIZES.map(({ value, label }) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                className="justify-start h-9"
                onClick={() => onAddBend?.(value)}
              >
                <span className="mr-2 w-8">↗{label}</span>
                {value === '1/4' && 'Четверть тона'}
                {value === '1/2' && 'Полтона'}
                {value === 'full' && 'Целый тон'}
                {value === '1.5' && 'Полтора тона'}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-2"
        >
          <Link2 className="w-4 h-4" />
          Связь
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-9"
            onClick={() => onAddConnection('hammer-on')}
          >
            <span className="mr-2">⌒</span>
            Hammer-On
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-9"
            onClick={() => onAddConnection('pull-off')}
          >
            <span className="mr-2">⌓</span>
            Pull-Off
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-9"
            onClick={() => onAddConnection('slide')}
          >
            <span className="mr-2">/</span>
            Slide
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
