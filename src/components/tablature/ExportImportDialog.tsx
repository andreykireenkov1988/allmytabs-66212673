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
import { TablatureContent, TablatureLine, TablatureConnection, ConnectionType, STRING_NAMES, createEmptyLine, createConnection } from '@/types/tablature';
import { toast } from 'sonner';

// Connection type symbols for export/import
const CONNECTION_SYMBOLS: Record<ConnectionType, string> = {
  'hammer-on': 'h',
  'pull-off': 'p',
  'slide': '/',
};

const SYMBOL_TO_CONNECTION: Record<string, ConnectionType> = {
  'h': 'hammer-on',
  'p': 'pull-off',
  '/': 'slide',
};

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

  const serializeConnections = (connections: TablatureConnection[]): string => {
    if (!connections || connections.length === 0) return '';
    
    return connections.map(c => 
      `${c.stringIndex}:${c.startPosition}-${c.endPosition}${CONNECTION_SYMBOLS[c.type]}`
    ).join(',');
  };

  const exportToMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push('');

    content.lines.forEach((line) => {
      if (line.title) {
        lines.push(`## ${line.title}`);
      }
      
      // Export connections as a comment
      if (line.connections && line.connections.length > 0) {
        lines.push(`<!-- connections: ${serializeConnections(line.connections)} -->`);
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
      
      // Export connections in ASCII format
      if (line.connections && line.connections.length > 0) {
        lines.push(`# connections: ${serializeConnections(line.connections)}`);
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

  const parseConnections = (connectionsStr: string): TablatureConnection[] => {
    if (!connectionsStr) return [];
    
    const connections: TablatureConnection[] = [];
    const parts = connectionsStr.split(',');
    
    for (const part of parts) {
      // Format: stringIndex:startPos-endPosType (e.g., "0:2-4h")
      const match = part.trim().match(/^(\d+):(\d+)-(\d+)([hpb\/])$/);
      if (match) {
        const stringIndex = parseInt(match[1], 10);
        const startPosition = parseInt(match[2], 10);
        const endPosition = parseInt(match[3], 10);
        const type = SYMBOL_TO_CONNECTION[match[4]];
        
        if (type) {
          connections.push(createConnection(type, stringIndex, startPosition, endPosition));
        }
      }
    }
    
    return connections;
  };

  const parseTabBlock = (tabBlockLines: string[], lineTitle: string, connections: TablatureConnection[] = []): TablatureLine | null => {
    if (tabBlockLines.length !== 6) return null;
    
    const newLine = createEmptyLine();
    newLine.title = lineTitle;
    newLine.connections = connections;
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
    return newLine;
  };

  const isTabLine = (line: string): boolean => {
    // Check if line looks like a tab line: e|--3-5-| or E|--3-5--|
    return /^[eEbBgGdDaA]\|.*\|?$/.test(line.trim());
  };

  const parseImportText = (text: string): { title: string; content: TablatureContent } | null => {
    try {
      const lines = text.split('\n');
      let parsedTitle = 'Импортированная табулатура';
      const tablatureLines: TablatureContent['lines'] = [];

      let currentLineTitle = '';
      let currentConnections: TablatureConnection[] = [];
      let inTabBlock = false;
      let tabBlockLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Markdown format: # Title
        if (trimmed.startsWith('# ')) {
          parsedTitle = trimmed.substring(2).trim();
        } 
        // ASCII format: Title followed by === separator
        else if (i === 0 && trimmed && !isTabLine(trimmed) && !trimmed.startsWith('[') && !trimmed.startsWith('#')) {
          // Check if next non-empty line is a separator
          let nextIdx = i + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
          if (nextIdx < lines.length && /^[=\-]{3,}$/.test(lines[nextIdx].trim())) {
            parsedTitle = trimmed;
          }
        }
        // Markdown connections comment: <!-- connections: ... -->
        else if (trimmed.startsWith('<!-- connections:') && trimmed.endsWith('-->')) {
          const connectionsStr = trimmed.slice(17, -3).trim();
          currentConnections = parseConnections(connectionsStr);
        }
        // ASCII connections comment: # connections: ...
        else if (trimmed.startsWith('# connections:')) {
          const connectionsStr = trimmed.slice(14).trim();
          currentConnections = parseConnections(connectionsStr);
        }
        // Markdown section: ## Section Name
        else if (trimmed.startsWith('## ')) {
          currentLineTitle = trimmed.substring(3).trim();
        }
        // ASCII section: [Section Name] or [Часть N]
        else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentLineTitle = trimmed.slice(1, -1).trim();
        }
        // Markdown tab block start
        else if (trimmed === '```tab') {
          inTabBlock = true;
          tabBlockLines = [];
        }
        // Markdown tab block end
        else if (trimmed === '```' && inTabBlock) {
          inTabBlock = false;
          const parsed = parseTabBlock(tabBlockLines, currentLineTitle, currentConnections);
          if (parsed) {
            tablatureLines.push(parsed);
            currentLineTitle = '';
            currentConnections = [];
          }
        }
        // Inside markdown tab block
        else if (inTabBlock) {
          tabBlockLines.push(trimmed);
        }
        // ASCII format: detect tab lines directly
        else if (isTabLine(trimmed)) {
          // Start collecting ASCII tab block
          tabBlockLines = [trimmed];
          
          // Look ahead for the remaining 5 string lines
          let j = i + 1;
          while (j < lines.length && tabBlockLines.length < 6) {
            const nextLine = lines[j].trim();
            if (isTabLine(nextLine)) {
              tabBlockLines.push(nextLine);
              j++;
            } else if (nextLine === '') {
              j++;
            } else {
              break;
            }
          }
          
          if (tabBlockLines.length === 6) {
            const parsed = parseTabBlock(tabBlockLines, currentLineTitle, currentConnections);
            if (parsed) {
              tablatureLines.push(parsed);
              currentLineTitle = '';
              currentConnections = [];
            }
            i = j - 1; // Skip processed lines
          }
          tabBlockLines = [];
        }
        // Skip separator lines
        else if (/^[=\-]{3,}$/.test(trimmed)) {
          continue;
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
