import { useState } from 'react';
import { Download, Upload, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SongExportImportDialogProps {
  title: string;
  artist: string;
  content: string;
  onImport: (title: string, artist: string, content: string) => void;
}

export function SongExportImportDialog({ 
  title, 
  artist, 
  content, 
  onImport 
}: SongExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const exportToText = (): string => {
    const lines: string[] = [];
    lines.push(title);
    if (artist) {
      lines.push(`by ${artist}`);
    }
    lines.push('='.repeat(Math.max(title.length, artist ? artist.length + 3 : 0, 40)));
    lines.push('');
    lines.push(content);
    return lines.join('\n');
  };

  const parseImportText = (text: string): { title: string; artist: string; content: string } | null => {
    try {
      const lines = text.split('\n');
      if (lines.length === 0) return null;

      let parsedTitle = 'Импортированная песня';
      let parsedArtist = '';
      let contentStartIndex = 0;

      // First non-empty line is the title
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          parsedTitle = lines[i].trim();
          contentStartIndex = i + 1;
          break;
        }
      }

      // Check if second line is artist (starts with "by " or contains only name-like text)
      if (contentStartIndex < lines.length) {
        const secondLine = lines[contentStartIndex].trim();
        if (secondLine.toLowerCase().startsWith('by ')) {
          parsedArtist = secondLine.substring(3).trim();
          contentStartIndex++;
        }
      }

      // Skip separator line (===, ---, etc.)
      if (contentStartIndex < lines.length) {
        const separatorLine = lines[contentStartIndex].trim();
        if (/^[=\-_]{3,}$/.test(separatorLine)) {
          contentStartIndex++;
        }
      }

      // Skip empty lines after header
      while (contentStartIndex < lines.length && !lines[contentStartIndex].trim()) {
        contentStartIndex++;
      }

      // Rest is content
      const parsedContent = lines.slice(contentStartIndex).join('\n').trim();

      if (!parsedContent) {
        return null;
      }

      return {
        title: parsedTitle,
        artist: parsedArtist,
        content: parsedContent,
      };
    } catch {
      return null;
    }
  };

  const handleCopy = async () => {
    const text = exportToText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Песня скопирована в буфер обмена');
  };

  const handleDownload = () => {
    const text = exportToText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = artist 
      ? `${artist} - ${title}`.replace(/[^a-zA-Zа-яА-Я0-9\s\-]/g, '').replace(/\s+/g, '_')
      : title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл загружен');
  };

  const handleImport = () => {
    const result = parseImportText(importText);
    if (result) {
      onImport(result.title, result.artist, result.content);
      setOpen(false);
      setImportText('');
      toast.success('Песня импортирована');
    } else {
      toast.error('Не удалось распознать формат песни');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
      };
      reader.readAsText(file);
    }
  };

  const exportText = exportToText();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Экспорт/Импорт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Экспорт и импорт песни</DialogTitle>
          <DialogDescription>
            Экспортируйте песню в текстовый формат или импортируйте из файла
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export">
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

          <TabsContent value="export" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Текстовый формат с аккордами для копирования или сохранения
            </p>
            <Textarea
              value={exportText}
              readOnly
              className="font-mono text-xs h-64 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Скачать .txt
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Вставьте текст песни сюда...

Пример формата:
Название песни
by Исполнитель
========================================

[Verse]
Am              C
Текст песни здесь
G               F
Продолжение текста`}
              className="font-mono text-xs h-48 resize-none"
            />
            <Button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Импортировать
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
