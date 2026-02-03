import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Download, Upload, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { CollectionSelect } from './CollectionSelect';

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
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedExportCollection, setSelectedExportCollection] = useState<string | null>(null);
  const [selectedImportCollection, setSelectedImportCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [importMode, setImportMode] = useState<'existing' | 'new'>('existing');

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

  const exportData: ExportData = useMemo(() => {
    const collection = collections.find(c => c.id === selectedExportCollection);
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collection: collection ? { name: collection.name } : undefined,
      songs: exportItems.songs.map(song => ({
        title: song.title,
        artist: song.artist,
        blocks: (song.blocks || []).map(block => ({
          block_type: block.block_type,
          title: block.title,
          content: block.content,
          position: block.position,
        })),
      })),
      harmonicaTabs: exportItems.harmonicaTabs.map(tab => ({
        title: tab.title,
        content: tab.content,
      })),
    };
  }, [exportItems, collections, selectedExportCollection]);

  const exportText = useMemo(() => JSON.stringify(exportData, null, 2), [exportData]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error('Вставьте данные для импорта');
      return;
    }

    try {
      const data = JSON.parse(importText) as ExportData;
      
      if (!data.version || (!data.songs && !data.harmonicaTabs)) {
        throw new Error('Неверный формат данных');
      }

      setIsImporting(true);
      
      const targetCollectionId = importMode === 'existing' ? selectedImportCollection : null;
      const collectionName = importMode === 'new' ? newCollectionName.trim() : undefined;

      if (importMode === 'new' && !collectionName) {
        toast.error('Введите название для новой коллекции');
        setIsImporting(false);
        return;
      }

      await onImport(data, targetCollectionId, collectionName);
      
      toast.success('Импорт завершён!');
      setImportText('');
      setOpen(false);
    } catch (error) {
      toast.error('Ошибка импорта: неверный формат данных');
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Экспорт и импорт коллекции</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Экспорт
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
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
            
            <Textarea
              value={exportText}
              readOnly
              className="font-mono text-xs h-64"
            />
            
            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Копировать'}
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

            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Вставьте данные для импорта..."
              className="font-mono text-xs h-64"
            />
            
            <Button 
              onClick={handleImport} 
              className="w-full gap-2"
              disabled={!importText.trim() || isImporting}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Импорт...' : 'Импортировать'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
