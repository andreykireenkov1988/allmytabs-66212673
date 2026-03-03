import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Download, Archive, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { exportToObsidianZip, buildObsidianUri } from '@/lib/obsidianExport';

interface ObsidianExportDialogProps {
  songs: Song[];
  harmonicaTabs: HarmonicaTab[];
  collections: Collection[];
  trigger?: React.ReactNode;
}

export function ObsidianExportDialog({
  songs,
  harmonicaTabs,
  collections,
  trigger,
}: ObsidianExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const handleZipExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setProgressTotal(songs.length + harmonicaTabs.length);

      const blob = await exportToObsidianZip(songs, harmonicaTabs, collections, {
        includeImages,
        onProgress: (current, total) => {
          setProgress(current);
          setProgressTotal(total);
        },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AllMyTabs.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`ZIP скачан! ${songs.length} гитара, ${harmonicaTabs.length} гармошка`);
    } catch (error) {
      console.error('ZIP export error:', error);
      toast.error('Ошибка создания ZIP файла');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const handleObsidianUri = (item: Song | HarmonicaTab, type: 'guitar' | 'harmonica') => {
    if (!vaultName.trim()) {
      toast.error('Введите название vault');
      return;
    }
    const uri = buildObsidianUri(item, type, vaultName.trim());
    window.open(uri, '_blank');
  };

  const totalCount = songs.length + harmonicaTabs.length;
  const progressPercent = progressTotal > 0 ? Math.round((progress / progressTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Obsidian
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Экспорт в Obsidian</DialogTitle>
          <DialogDescription>
            Файлы включают YAML frontmatter и Dataview-совместимые теги
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="zip">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zip" className="gap-2">
              <Archive className="w-4 h-4" />
              ZIP-архив
            </TabsTrigger>
            <TabsTrigger value="uri" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Открыть в Obsidian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zip" className="space-y-4 mt-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Что будет в архиве:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📁 <code>AllMyTabs/</code> — корневая папка</li>
                <li className="pl-4">📁 Папки по коллекциям</li>
                <li className="pl-4">📄 {songs.length} гитарных файлов (.md)</li>
                <li className="pl-4">📄 {harmonicaTabs.length} файлов гармошки (.md)</li>
                <li className="pl-4">📄 <code>AllMyTabs Index.md</code> — Dataview индекс</li>
              </ul>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-border p-4">
              <Checkbox
                id="include-images"
                checked={includeImages}
                onCheckedChange={(checked) => setIncludeImages(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="include-images" className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  Включить PNG-изображения
                </Label>
                <p className="text-xs text-muted-foreground">
                  Каждый блок аккордов и табулатуры будет отрендерен как картинка (занимает больше времени)
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/50">
              <p className="text-sm font-medium">Каждый файл содержит:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• YAML frontmatter (title, artist, tags, type)</li>
                <li>• Теги <code>#allmytabs</code>, <code>#guitar</code> / <code>#harmonica</code></li>
                <li>• Dataview-совместимые поля для таблиц и запросов</li>
              </ul>
            </div>

            {isExporting && progressTotal > 0 && (
              <div className="space-y-2">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress} / {progressTotal} — {progressPercent}%
                </p>
              </div>
            )}

            <Button 
              onClick={handleZipExport} 
              className="w-full gap-2" 
              disabled={isExporting || totalCount === 0}
            >
              <Download className="w-4 h-4" />
              {isExporting 
                ? (includeImages ? `Рендер изображений... ${progress}/${progressTotal}` : 'Создание архива...') 
                : `Скачать ZIP (${totalCount} файлов${includeImages ? ' + PNG' : ''})`}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Распакуйте архив в папку вашего Obsidian vault
            </p>
          </TabsContent>

          <TabsContent value="uri" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vault-name">Название Obsidian Vault</Label>
              <Input
                id="vault-name"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="Мой vault"
              />
              <p className="text-xs text-muted-foreground">
                Obsidian должен быть установлен на устройстве
              </p>
            </div>

            {vaultName.trim() && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {songs.map(song => (
                  <Button
                    key={song.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-left"
                    onClick={() => handleObsidianUri(song, 'guitar')}
                  >
                    <span className="text-base">🎸</span>
                    <span className="truncate">{song.title}</span>
                  </Button>
                ))}
                {harmonicaTabs.map(tab => (
                  <Button
                    key={tab.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-left"
                    onClick={() => handleObsidianUri(tab, 'harmonica')}
                  >
                    <span className="text-base">🎵</span>
                    <span className="truncate">{tab.title}</span>
                  </Button>
                ))}
              </div>
            )}

            {!vaultName.trim() && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Введите название vault, чтобы увидеть список элементов
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
