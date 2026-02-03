import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConnectionType } from '@/types/tablature';
import { Link2 } from 'lucide-react';

interface ConnectionControlsProps {
  onAddConnection: (type: ConnectionType) => void;
  disabled: boolean;
}

export function ConnectionControls({ onAddConnection, disabled }: ConnectionControlsProps) {
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
