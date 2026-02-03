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
import { TablatureContent, STRING_NAMES, createEmptyLine } from '@/types/tablature';
import { toast } from 'sonner';

interface ExportImportDialogProps {
  title: string;
  content: TablatureContent;
  onImport: (title: string, content: TablatureContent) => void;
}

export function ExportImportDialog({ title, content, onImport }: ExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAscii, setCopiedAscii] = useState(false);

  const exportToMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push('');

    content.lines.forEach((line) => {
      if (line.title) {
        lines.push(`## ${line.title}`);
      }
      lines.push('```tab');

      STRING_NAMES.forEach((stringName, stringIndex) => {
        let tabLine = `${stringName}|`;
        for (let pos = 0; pos < line.columns; pos++) {
          const note = line.notes.find(
            (n) => n.stringIndex === stringIndex && n.position === pos
          );
          if (note?.fret) {
            const fret = note.fret.padEnd(2, '-');
            tabLine += fret;
          } else {
            tabLine += '--';
          }
        }
        tabLine += '|';
        lines.push(tabLine);
      });

      lines.push('```');
      lines.push('');
    });

    return lines.join('\n');
  };

  const exportToAscii = (): string => {
    const lines: string[] = [];
    lines.push(title);
    lines.push('='.repeat(Math.max(title.length, 40)));
    lines.push('');

    content.lines.forEach((line, lineIndex) => {
      if (line.title) {
        lines.push(`[${line.title}]`);
      } else if (content.lines.length > 1) {
        lines.push(`[Часть ${lineIndex + 1}]`);
      }

      STRING_NAMES.forEach((stringName, stringIndex) => {
        let tabLine = `${stringName}|`;
        for (let pos = 0; pos < line.columns; pos++) {
          const note = line.notes.find(
            (n) => n.stringIndex === stringIndex && n.position === pos
          );
          if (note?.fret) {
            const fret = note.fret.padEnd(2, '-');
            tabLine += fret;
          } else {
            tabLine += '--';
          }
        }
        tabLine += '|';
        lines.push(tabLine);
      });

      lines.push('');
    });

    return lines.join('\n');
  };

  const parseImportText = (text: string): { title: string; content: TablatureContent } | null => {
    try {
      const lines = text.split('\n');
      let parsedTitle = 'Импортированная табулатура';
      const tablatureLines: TablatureContent['lines'] = [];

      let currentLineTitle = '';
      let inTabBlock = false;
      let tabBlockLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          parsedTitle = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('## ')) {
          currentLineTitle = trimmed.substring(3).trim();
        } else if (trimmed === '```tab') {
          inTabBlock = true;
          tabBlockLines = [];
        } else if (trimmed === '```' && inTabBlock) {
          inTabBlock = false;

          if (tabBlockLines.length === 6) {
            const newLine = createEmptyLine();
            newLine.title = currentLineTitle;
            currentLineTitle = '';

            let maxPos = 0;

            tabBlockLines.forEach((tabLine, stringIndex) => {
              // Remove string name and pipes: e|--3-5-|
              const match = tabLine.match(/^[a-zA-Z]\|(.*)\|?$/);
              if (match) {
                const frets = match[1];
                let pos = 0;
                let i = 0;

                while (i < frets.length) {
                  let fret = '';
                  // Read up to 2 characters (or until we hit end)
                  while (fret.length < 2 && i < frets.length) {
                    fret += frets[i];
                    i++;
                  }

                  const cleanFret = fret.replace(/-/g, '').trim();
                  if (cleanFret) {
                    newLine.notes.push({
                      stringIndex,
                      position: pos,
                      fret: cleanFret,
                    });
                  }
                  pos++;
                  maxPos = Math.max(maxPos, pos);
                }
              }
            });

            newLine.columns = Math.max(16, maxPos);
            tablatureLines.push(newLine);
          }
        } else if (inTabBlock) {
          tabBlockLines.push(trimmed);
        }
      }

      if (tablatureLines.length === 0) {
        return null;
      }

      return {
        title: parsedTitle,
        content: { lines: tablatureLines },
      };
    } catch {
      return null;
    }
  };

  const handleCopyMarkdown = async () => {
    const text = exportToMarkdown();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Markdown скопирован в буфер обмена');
  };

  const handleCopyAscii = async () => {
    const text = exportToAscii();
    await navigator.clipboard.writeText(text);
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2000);
    toast.success('ASCII табулатура скопирована в буфер обмена');
  };

  const handleDownloadMarkdown = () => {
    const text = exportToMarkdown();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл .md загружен');
  };

  const handleDownloadTxt = () => {
    const text = exportToAscii();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл .txt загружен');
  };

  const handleImport = () => {
    const result = parseImportText(importText);
    if (result) {
      onImport(result.title, result.content);
      setOpen(false);
      setImportText('');
      toast.success('Табулатура импортирована');
    } else {
      toast.error('Не удалось распознать формат табулатуры');
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

  const markdownText = exportToMarkdown();
  const asciiText = exportToAscii();

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
          <DialogTitle>Экспорт и импорт табулатуры</DialogTitle>
          <DialogDescription>
            Экспортируйте табулатуру в текстовый формат или импортируйте из файла
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ascii">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ascii" className="gap-2">
              <Copy className="w-4 h-4" />
              ASCII
            </TabsTrigger>
            <TabsTrigger value="markdown" className="gap-2">
              <Download className="w-4 h-4" />
              Markdown
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Импорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ascii" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Чистый текстовый формат для копирования на форумы, в чаты и соцсети
            </p>
            <Textarea
              value={asciiText}
              readOnly
              className="font-mono text-xs h-64 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopyAscii} variant="outline" className="gap-2">
                {copiedAscii ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAscii ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button onClick={handleDownloadTxt} variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Скачать .txt
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="markdown" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Формат с разметкой для GitHub, Notion и других платформ
            </p>
            <Textarea
              value={markdownText}
              readOnly
              className="font-mono text-xs h-64 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopyMarkdown} variant="outline" className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button onClick={handleDownloadMarkdown} className="gap-2">
                <Download className="w-4 h-4" />
                Скачать .md
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Или вставьте текст табулатуры сюда..."
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
