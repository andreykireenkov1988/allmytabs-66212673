import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Collection } from '@/types/collection';
import { exportToObsidianZip } from '@/lib/obsidianExport';

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
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const handleZipExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setProgressTotal(songs.length + harmonicaTabs.length);

      const blob = await exportToObsidianZip(songs, harmonicaTabs, collections, {
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

  const totalCount = songs.length + harmonicaTabs.length;
  const progressPercent = progressTotal > 0 ? Math.round((progress / progressTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Archive className="w-4 h-4" />
            Экспорт PNG
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Экспорт в PNG</DialogTitle>
          <DialogDescription>
            Все табулатуры и аккорды будут отрендерены как картинки
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Структура архива:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>📁 <code>AllMyTabs/</code></li>
              <li className="pl-4">📁 Папки по коллекциям</li>
              <li className="pl-8">📁 Папка на каждую песню</li>
              <li className="pl-12">🖼️ PNG-файлы блоков</li>
              <li className="pl-4">🖼️ Гармошка — отдельные PNG</li>
            </ul>
          </div>

          {isExporting && progressTotal > 0 && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Рендер: {progress} / {progressTotal} — {progressPercent}%
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
              ? `Рендер изображений... ${progress}/${progressTotal}`
              : `Скачать ZIP (${totalCount} элементов)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
