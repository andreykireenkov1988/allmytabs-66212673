import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FolderInput } from 'lucide-react';
import { Collection } from '@/types/collection';
import { CollectionSelect } from './CollectionSelect';

interface MoveToCollectionDialogProps {
  collections: Collection[];
  currentCollectionId: string | null;
  onMove: (collectionId: string | null) => void;
  trigger?: React.ReactNode;
  itemName?: string;
}

export function MoveToCollectionDialog({
  collections,
  currentCollectionId,
  onMove,
  trigger,
  itemName,
}: MoveToCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(currentCollectionId);

  const handleMove = () => {
    onMove(selectedCollection);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2">
            <FolderInput className="w-4 h-4" />
            Переместить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {itemName ? `Переместить "${itemName}"` : 'Переместить в коллекцию'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <CollectionSelect
            collections={collections}
            value={selectedCollection}
            onChange={setSelectedCollection}
            allowNone
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleMove}>
              Переместить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
