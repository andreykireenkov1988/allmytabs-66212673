import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Collection } from '@/types/collection';

interface DeleteCollectionDialogProps {
  collection: Collection;
  songsCount: number;
  harmonicaTabsCount: number;
  onDelete: (collectionId: string, deleteCards: boolean) => void;
  trigger?: React.ReactNode;
}

export function DeleteCollectionDialog({
  collection,
  songsCount,
  harmonicaTabsCount,
  onDelete,
  trigger,
}: DeleteCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteCards, setDeleteCards] = useState(false);

  const totalCards = songsCount + harmonicaTabsCount;

  const handleDelete = () => {
    onDelete(collection.id, deleteCards);
    setOpen(false);
    setDeleteCards(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить коллекцию?</DialogTitle>
          <DialogDescription>
            Коллекция "{collection.name}" будет удалена.
          </DialogDescription>
        </DialogHeader>
        
        {totalCards > 0 && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              В этой коллекции: {songsCount > 0 && `${songsCount} гитара`}
              {songsCount > 0 && harmonicaTabsCount > 0 && ', '}
              {harmonicaTabsCount > 0 && `${harmonicaTabsCount} гармошка`}
            </p>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteCards"
                checked={deleteCards}
                onCheckedChange={(checked) => setDeleteCards(checked === true)}
              />
              <Label 
                htmlFor="deleteCards" 
                className="text-sm font-normal cursor-pointer"
              >
                Также удалить все карточки из этой коллекции
              </Label>
            </div>
            
            {!deleteCards && (
              <p className="text-xs text-muted-foreground">
                Карточки останутся без коллекции
              </p>
            )}
            
            {deleteCards && (
              <p className="text-xs text-destructive">
                ⚠️ Все карточки будут удалены безвозвратно!
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            {deleteCards ? 'Удалить всё' : 'Удалить коллекцию'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
