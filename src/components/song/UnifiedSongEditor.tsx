import { useState, useCallback } from 'react';
import { Song, SongBlock, ChordsBlockContent, isChordsContent, isTablatureContent } from '@/types/song';
import { TablatureContent } from '@/types/tablature';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, GripVertical, Trash2, Music2, Guitar, Eye, Pencil, Link } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useSongBlocks } from '@/hooks/useSongBlocks';
import { useAuth } from '@/hooks/useAuth';
import { ChordsBlockEditor } from './blocks/ChordsBlockEditor';
import { TablatureBlockEditor } from './blocks/TablatureBlockEditor';
import { ChordsBlockViewer } from './blocks/ChordsBlockViewer';
import { TablatureBlockViewer } from './blocks/TablatureBlockViewer';
import { TransposeControls } from './TransposeControls';
import { FullSongExportImportDialog } from './FullSongExportImportDialog';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

interface UnifiedSongEditorProps {
  song: Song;
  onBack: () => void;
  onSaveSong: (id: string, title: string, artist: string) => void;
  isSaving?: boolean;
}

export function UnifiedSongEditor({ song, onBack, onSaveSong, isSaving }: UnifiedSongEditorProps) {
  const { user } = useAuth();
  const { createBlock, updateBlock, deleteBlock, reorderBlocks } = useSongBlocks(user?.id);
  
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist || '');
  const [blocks, setBlocks] = useState<SongBlock[]>(song.blocks || []);
  const [isSavingState, setIsSavingState] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [useFlats, setUseFlats] = useState(false);

  // Debounced save for song metadata
  const debouncedSaveSong = useDebouncedCallback(
    (id: string, t: string, a: string) => {
      onSaveSong(id, t, a);
      setIsSavingState(false);
    },
    1000
  );

  // Debounced save for block content
  const debouncedSaveBlock = useDebouncedCallback(
    async (blockId: string, content: ChordsBlockContent | TablatureContent) => {
      try {
        await updateBlock.mutateAsync({ id: blockId, content });
      } catch (error) {
        console.error('Error saving block:', error);
      }
    },
    1000
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsSavingState(true);
    debouncedSaveSong(song.id, newTitle, artist);
  };

  const handleArtistChange = (newArtist: string) => {
    setArtist(newArtist);
    setIsSavingState(true);
    debouncedSaveSong(song.id, title, newArtist);
  };

  const handleBlockContentChange = useCallback((blockId: string, content: ChordsBlockContent | TablatureContent) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, content } : b
    ));
    debouncedSaveBlock(blockId, content);
  }, [debouncedSaveBlock]);

  const handleBlockTitleChange = useCallback(async (blockId: string, newTitle: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, title: newTitle } : b
    ));
    try {
      await updateBlock.mutateAsync({ id: blockId, title: newTitle });
    } catch (error) {
      console.error('Error saving block title:', error);
    }
  }, [updateBlock]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleAddBlock = async (type: 'chords' | 'tablature', content?: ChordsBlockContent | TablatureContent) => {
    try {
      const position = blocks.length;
      const newBlock = await createBlock.mutateAsync({
        songId: song.id,
        blockType: type,
        position,
      });
      
      // If content is provided, update the block with it
      if (content) {
        await updateBlock.mutateAsync({ id: newBlock.id, content });
        newBlock.content = content;
      }
      
      setBlocks(prev => [...prev, newBlock]);
      toast.success(type === 'chords' ? 'Блок аккордов добавлен' : 'Блок табулатуры добавлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка добавления блока');
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error('Введите URL страницы с аккордами');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-song', {
        body: { url: importUrl.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Не удалось распарсить страницу');
      }

      // Create a chords block with the imported content
      const chordsContent: ChordsBlockContent = { text: data.data.content || '' };
      await handleAddBlock('chords', chordsContent);
      
      // Update song title and artist if empty
      if (!title && data.data.title) {
        handleTitleChange(data.data.title);
      }
      if (!artist && data.data.artist) {
        handleArtistChange(data.data.artist);
      }

      setImportDialogOpen(false);
      setImportUrl('');
      toast.success('Аккорды импортированы!');
    } catch (error: any) {
      console.error('Error parsing song:', error);
      toast.error(error.message || 'Ошибка при парсинге страницы');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFullImport = async (data: {
    title: string;
    artist: string;
    blocks: Array<{ type: 'chords' | 'tablature'; title: string; content: ChordsBlockContent | TablatureContent }>;
  }) => {
    try {
      // Update song metadata
      if (data.title && data.title !== title) {
        handleTitleChange(data.title);
      }
      if (data.artist && data.artist !== artist) {
        handleArtistChange(data.artist);
      }

      // Delete existing blocks
      for (const block of blocks) {
        await deleteBlock.mutateAsync(block.id);
      }

      // Create new blocks
      const newBlocks: SongBlock[] = [];
      for (let i = 0; i < data.blocks.length; i++) {
        const blockData = data.blocks[i];
        const newBlock = await createBlock.mutateAsync({
          songId: song.id,
          blockType: blockData.type,
          title: blockData.title,
          position: i,
        });
        await updateBlock.mutateAsync({ id: newBlock.id, content: blockData.content });
        newBlock.content = blockData.content;
        newBlock.title = blockData.title;
        newBlocks.push(newBlock);
      }

      setBlocks(newBlocks);
      toast.success('Песня импортирована!');
    } catch (error: any) {
      console.error('Error importing song:', error);
      toast.error(error.message || 'Ошибка при импорте песни');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock.mutateAsync(blockId);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
      toast.success('Блок удалён');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления блока');
    }
  };

  const moveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    // Update positions
    const updatedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));
    setBlocks(updatedBlocks);

    try {
      await reorderBlocks.mutateAsync(updatedBlocks.map(b => ({ id: b.id, position: b.position })));
    } catch (error) {
      console.error('Error reordering blocks:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 space-y-1">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="Название песни"
              readOnly={isViewMode}
            />
            <Input
              value={artist}
              onChange={(e) => handleArtistChange(e.target.value)}
              className="text-sm text-muted-foreground bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="Исполнитель"
              readOnly={isViewMode}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(isSaving || isSavingState) && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </div>
          )}
          
          <FullSongExportImportDialog 
            song={song}
            blocks={blocks}
            onImport={handleFullImport}
          />
          
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={isViewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsViewMode(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Просмотр
            </Button>
            <Button
              variant={!isViewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsViewMode(false)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Редактор
            </Button>
          </div>
        </div>
      </div>

      {/* Transpose controls for chords */}
      {blocks.some(b => b.block_type === 'chords') && (
        <TransposeControls
          value={transpose}
          onChange={setTranspose}
          useFlats={useFlats}
          onToggleFlats={() => setUseFlats(!useFlats)}
        />
      )}

      {/* Blocks */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div key={block.id} className="glass-card p-4">
            {/* Block header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {block.block_type === 'chords' ? (
                  <Music2 className="w-4 h-4 text-primary" />
                ) : (
                  <Guitar className="w-4 h-4 text-primary" />
                )}
              </div>
              <Input
                value={block.title}
                onChange={(e) => handleBlockTitleChange(block.id, e.target.value)}
                placeholder={block.block_type === 'chords' ? 'Аккорды (например: Куплет 1)' : 'Табулатура (например: Соло)'}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
                readOnly={isViewMode}
              />
              
              {!isViewMode && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    ↓
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить блок?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Блок будет удалён безвозвратно.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteBlock(block.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Block content */}
            {block.block_type === 'chords' ? (
              isViewMode ? (
                <ChordsBlockViewer 
                  content={isChordsContent(block.content) ? block.content : { text: '' }}
                  transpose={transpose}
                  useFlats={useFlats}
                />
              ) : (
                <ChordsBlockEditor
                  content={isChordsContent(block.content) ? block.content : { text: '' }}
                  onChange={(content) => handleBlockContentChange(block.id, content)}
                />
              )
            ) : (
              isViewMode ? (
                <TablatureBlockViewer
                  content={isTablatureContent(block.content) ? block.content : { lines: [] }}
                />
              ) : (
                <TablatureBlockEditor
                  content={isTablatureContent(block.content) ? block.content : { lines: [] }}
                  onChange={(content) => handleBlockContentChange(block.id, content)}
                />
              )
            )}
          </div>
        ))}
      </div>

      {/* Add block button */}
      {!isViewMode && (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить блок
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddBlock('chords')} className="gap-2">
                <Music2 className="w-4 h-4" />
                Аккорды (текст с аккордами)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Link className="w-4 h-4" />
                Импортировать по ссылке
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddBlock('tablature')} className="gap-2">
                <Guitar className="w-4 h-4" />
                Табулатура (ноты на грифе)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Import dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Импортировать аккорды по ссылке</DialogTitle>
            <DialogDescription>
              Вставьте ссылку на страницу с аккордами (например, Ultimate Guitar)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-url">Ссылка на страницу</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="import-url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://tabs.ultimate-guitar.com/..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleImportFromUrl()}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleImportFromUrl}
              disabled={isImporting || !importUrl.trim()}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Импортировать'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">Добавьте первый блок с аккордами или табулатурой</p>
        </div>
      )}
    </div>
  );
}
