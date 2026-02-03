import { useState } from 'react';
import { Song, isChordsContent } from '@/types/song';
import { Collection } from '@/types/collection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Trash2, ExternalLink, FolderInput, Sparkles, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoveToCollectionDialog } from '@/components/collection/MoveToCollectionDialog';
import { toast } from 'sonner';

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  collections?: Collection[];
  onMove?: (collectionId: string | null) => void;
  onGenerateImage?: (song: Song) => Promise<void>;
  isGeneratingImage?: boolean;
}

export function SongCard({ song, onEdit, onDelete, collections, onMove, onGenerateImage, isGeneratingImage }: SongCardProps) {
  const blocks = song.blocks || [];
  
  // Get preview from first chords block
  const chordsBlock = blocks.find(b => b.block_type === 'chords');
  
  const preview = chordsBlock && isChordsContent(chordsBlock.content)
    ? chordsBlock.content.text
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 4)
        .join('\n')
    : '';

  const hasTabs = blocks.some(b => b.block_type === 'tablature');

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGenerateImage) {
      try {
        await onGenerateImage(song);
        toast.success('Обложка создана!');
      } catch (error) {
        toast.error('Не удалось создать обложку');
      }
    }
  };

  return (
    <Card 
      className="glass-card hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
      onClick={() => onEdit(song)}
    >
      {/* Generated Image */}
      {song.image_url && (
        <div className="relative h-32 w-full overflow-hidden">
          <img 
            src={song.image_url} 
            alt={song.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      
      <CardHeader className={song.image_url ? "pb-2 pt-3" : "pb-2"}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!song.image_url && (
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <Music2 className="w-4 h-4 text-accent" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{song.title}</CardTitle>
              {song.artist && (
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onGenerateImage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
            {collections && onMove && collections.length > 0 && (
              <MoveToCollectionDialog
                collections={collections}
                currentCollectionId={song.collection_id}
                onMove={onMove}
                itemName={song.title}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderInput className="w-4 h-4" />
                  </Button>
                }
              />
            )}
            {song.source_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(song.source_url!, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить песню?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Песня "{song.title}" будет удалена безвозвратно.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(song.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      {!song.image_url && (
        <CardContent>
          {preview ? (
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-4 bg-muted/30 p-2 rounded">
              {preview}
            </pre>
          ) : hasTabs ? (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              Табулатура для гитары
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              Нет содержимого
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
