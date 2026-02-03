import { Song, isChordsContent, isTablatureContent } from '@/types/song';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Trash2, ExternalLink, Guitar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
}

export function SongCard({ song, onEdit, onDelete }: SongCardProps) {
  const blocks = song.blocks || [];
  
  // Get preview from first chords block
  const chordsBlock = blocks.find(b => b.block_type === 'chords');
  const tabBlocks = blocks.filter(b => b.block_type === 'tablature');
  
  const preview = chordsBlock && isChordsContent(chordsBlock.content)
    ? chordsBlock.content.text
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 4)
        .join('\n')
    : '';

  const hasChords = blocks.some(b => b.block_type === 'chords');
  const hasTabs = blocks.some(b => b.block_type === 'tablature');

  return (
    <Card 
      className="glass-card hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onEdit(song)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Music2 className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{song.title}</CardTitle>
              {song.artist && (
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <CardContent>
        {/* Block badges */}
        <div className="flex gap-1 mb-2 flex-wrap">
          {hasChords && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Music2 className="w-3 h-3" />
              Аккорды
            </Badge>
          )}
          {hasTabs && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Guitar className="w-3 h-3" />
              {tabBlocks.length} таб{tabBlocks.length === 1 ? '' : tabBlocks.length < 5 ? 'а' : 'ов'}
            </Badge>
          )}
          {blocks.length === 0 && (
            <Badge variant="outline" className="text-xs">
              Пустая
            </Badge>
          )}
        </div>
        
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
        
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(song.updated_at).toLocaleDateString('ru-RU')}
        </p>
      </CardContent>
    </Card>
  );
}
