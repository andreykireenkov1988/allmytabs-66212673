import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, FileDown, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { CollectionSelect } from './CollectionSelect';
import { exportToMarkdown, parseMarkdown, downloadMarkdownFile } from '@/lib/collectionMarkdown';

interface ExportData {
  version: string;
  exportedAt: string;
  collection?: {
    name: string;
  };
  songs: Array<{
    title: string;
    artist: string | null;
    blocks: Array<{
      block_type: string;
      title: string;
      content: unknown;
      position: number;
    }>;
  }>;
  harmonicaTabs: Array<{
    title: string;
    artist?: string | null;
    content: unknown;
  }>;
}

interface CollectionExportImportDialogProps {
  songs: Song[];
  harmonicaTabs: HarmonicaTab[];
  collections: Collection[];
  onImport: (data: ExportData, targetCollectionId: string | null, collectionName?: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function CollectionExportImportDialog({
  songs,
  harmonicaTabs,
  collections,
  onImport,
  trigger,
}: CollectionExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedExportCollection, setSelectedExportCollection] = useState<string | null>(null);
  const [selectedImportCollection, setSelectedImportCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [importMode, setImportMode] = useState<'existing' | 'new'>('existing');
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items by selected collection for export
  const exportItems = useMemo(() => {
    const filteredSongs = selectedExportCollection === null 
      ? songs 
      : songs.filter(s => s.collection_id === selectedExportCollection);
    const filteredHarmonicaTabs = selectedExportCollection === null 
      ? harmonicaTabs 
      : harmonicaTabs.filter(h => h.collection_id === selectedExportCollection);
    return { songs: filteredSongs, harmonicaTabs: filteredHarmonicaTabs };
  }, [songs, harmonicaTabs, selectedExportCollection]);

  const selectedCollection = collections.find(c => c.id === selectedExportCollection);

  const handleExport = () => {
    const markdown = exportToMarkdown(
      exportItems.songs,
      exportItems.harmonicaTabs,
      selectedCollection?.name
    );
    
    const filename = selectedCollection 
      ? `${selectedCollection.name}.md`
      : 'collection.md';
    
    downloadMarkdownFile(markdown, filename);
    toast.success('Файл скачан!');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.md')) {
        toast.error('Пожалуйста, выберите .md файл');
        return;
      }
      setImportedFile(file);
    }
  };

  const handleImport = async () => {
    if (!importedFile) {
      toast.error('Выберите файл для импорта');
      return;
    }

    try {
      setIsImporting(true);
      
      const text = await importedFile.text();
      const parsed = parseMarkdown(text);
      
      if (parsed.songs.length === 0 && parsed.harmonicaTabs.length === 0) {
        toast.error('Файл не содержит данных для импорта');
        setIsImporting(false);
        return;
      }

      const targetCollectionId = importMode === 'existing' ? selectedImportCollection : null;
      const collectionName = importMode === 'new' ? newCollectionName.trim() : undefined;

      if (importMode === 'new' && !collectionName) {
        toast.error('Введите название для новой коллекции');
        setIsImporting(false);
        return;
      }

      // Convert to ExportData format for compatibility
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        songs: parsed.songs.map(s => ({
          title: s.title,
          artist: s.artist,
          blocks: s.blocks,
        })),
        harmonicaTabs: parsed.harmonicaTabs.map(t => ({
          title: t.title,
          content: t.content,
        })),
      };

      await onImport(exportData, targetCollectionId, collectionName);
      
      toast.success(`Импортировано: ${parsed.songs.length} гитара, ${parsed.harmonicaTabs.length} гармошка`);
      setImportedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Ошибка импорта файла');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Экспорт/Импорт
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Экспорт и импорт коллекции</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-2">
              <FileDown className="w-4 h-4" />
              Экспорт
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <FileUp className="w-4 h-4" />
              Импорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Что экспортировать</Label>
              <CollectionSelect
                collections={collections}
                value={selectedExportCollection}
                onChange={setSelectedExportCollection}
                placeholder="Вся коллекция"
                allowNone
              />
              <p className="text-sm text-muted-foreground">
                {selectedExportCollection === null 
                  ? `Будет экспортировано: ${songs.length} гитара, ${harmonicaTabs.length} гармошка`
                  : `Будет экспортировано: ${exportItems.songs.length} гитара, ${exportItems.harmonicaTabs.length} гармошка`
                }
              </p>
            </div>
            
            <Button onClick={handleExport} className="w-full gap-2">
              <FileDown className="w-4 h-4" />
              Скачать .md файл
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Куда импортировать</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={importMode === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('existing')}
                  >
                    Существующая коллекция
                  </Button>
                  <Button
                    type="button"
                    variant={importMode === 'new' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('new')}
                  >
                    Новая коллекция
                  </Button>
                </div>
              </div>

              {importMode === 'existing' ? (
                <CollectionSelect
                  collections={collections}
                  value={selectedImportCollection}
                  onChange={setSelectedImportCollection}
                  placeholder="Без коллекции"
                  allowNone
                />
              ) : (
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Название новой коллекции"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Файл для импорта</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
              </div>
              {importedFile && (
                <p className="text-sm text-muted-foreground">
                  Выбран: {importedFile.name}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleImport} 
              className="w-full gap-2"
              disabled={!importedFile || isImporting}
            >
              <FileUp className="w-4 h-4" />
              {isImporting ? 'Импорт...' : 'Импортировать'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
