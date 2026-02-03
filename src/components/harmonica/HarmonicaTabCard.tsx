import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, FolderInput, Wind, Sparkles, Loader2 } from 'lucide-react';
import { MoveToCollectionDialog } from '@/components/collection/MoveToCollectionDialog';
import { toast } from 'sonner';

interface HarmonicaTabCardProps {
  tab: HarmonicaTab;
  onEdit: (tab: HarmonicaTab) => void;
  onDelete: (id: string) => void;
  collections?: Collection[];
  onMove?: (collectionId: string | null) => void;
  onGenerateImage?: (tab: HarmonicaTab) => Promise<void>;
  isGeneratingImage?: boolean;
}

export function HarmonicaTabCard({ tab, onEdit, onDelete, collections, onMove, onGenerateImage, isGeneratingImage }: HarmonicaTabCardProps) {
  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGenerateImage) {
      try {
        await onGenerateImage(tab);
        toast.success('Обложка создана!');
      } catch (error) {
        toast.error('Не удалось создать обложку');
      }
    }
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
      onClick={() => onEdit(tab)}
    >
      {/* Generated Image */}
      {tab.image_url && (
        <div className="relative h-32 w-full overflow-hidden">
          <img 
            src={tab.image_url} 
            alt={tab.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      
      <CardHeader className={tab.image_url ? "pb-2 pt-3" : "pb-2"}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!tab.image_url && (
              <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                <Wind className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
            <CardTitle className="text-lg truncate">{tab.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            {onGenerateImage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(tab); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                {collections && onMove && collections.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <MoveToCollectionDialog
                      collections={collections}
                      currentCollectionId={tab.collection_id}
                      onMove={onMove}
                      itemName={tab.title}
                      trigger={
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()} onSelect={(e) => e.preventDefault()}>
                          <FolderInput className="w-4 h-4 mr-2" />
                          Переместить
                        </DropdownMenuItem>
                      }
                    />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(tab.id); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
