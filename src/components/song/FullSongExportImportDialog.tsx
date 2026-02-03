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
import { Song, SongBlock, ChordsBlockContent, isChordsContent, isTablatureContent } from '@/types/song';
import { TablatureContent, STRING_NAMES, createEmptyLine, createConnection, ConnectionType, TablatureConnection } from '@/types/tablature';
import { toast } from 'sonner';

const CONNECTION_SYMBOLS: Record<ConnectionType, string> = {
  'hammer-on': 'h',
  'pull-off': 'p',
  'slide': '/',
  'bend': 'b',
};

const SYMBOL_TO_CONNECTION: Record<string, ConnectionType> = {
  'h': 'hammer-on',
  'p': 'pull-off',
  '/': 'slide',
  'b': 'bend',
};

interface FullSongExportImportDialogProps {
  song: Song;
  blocks: SongBlock[];
  onImport: (data: {
    title: string;
    artist: string;
    blocks: Array<{ type: 'chords' | 'tablature'; title: string; content: ChordsBlockContent | TablatureContent }>;
  }) => void;
}

export function FullSongExportImportDialog({ song, blocks, onImport }: FullSongExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const serializeConnections = (connections: TablatureConnection[]): string => {
    if (!connections || connections.length === 0) return '';
    return connections.map(c => 
      `${c.stringIndex}:${c.startPosition}-${c.endPosition}${CONNECTION_SYMBOLS[c.type]}`
    ).join(',');
  };

  const exportToText = (): string => {
    const lines: string[] = [];
    
    // Header
    lines.push(`# ${song.title}`);
    if (song.artist) {
      lines.push(`by ${song.artist}`);
    }
    lines.push('');
    lines.push('='.repeat(50));
    lines.push('');

    // Blocks
    blocks.forEach((block, blockIndex) => {
      const blockTitle = block.title || `Блок ${blockIndex + 1}`;
      
      if (block.block_type === 'chords') {
        lines.push(`## [CHORDS] ${blockTitle}`);
        lines.push('');
        const content = isChordsContent(block.content) ? block.content : { text: '' };
        lines.push(content.text);
        lines.push('');
      } else {
        lines.push(`## [TAB] ${blockTitle}`);
        lines.push('');
        const content = isTablatureContent(block.content) ? block.content : { lines: [] };
        
        content.lines.forEach((tabLine, lineIndex) => {
          if (tabLine.title) {
            lines.push(`### ${tabLine.title}`);
          } else if (content.lines.length > 1) {
            lines.push(`### Часть ${lineIndex + 1}`);
          }
          
          if (tabLine.connections && tabLine.connections.length > 0) {
            lines.push(`# connections: ${serializeConnections(tabLine.connections)}`);
          }
          
          STRING_NAMES.forEach((stringName, stringIndex) => {
            let tabLineStr = `${stringName}|`;
            for (let pos = 0; pos < tabLine.columns; pos++) {
              const note = tabLine.notes.find(
                (n) => n.stringIndex === stringIndex && n.position === pos
              );
              if (note?.fret) {
                const fret = note.fret.padEnd(2, '-');
                tabLineStr += fret;
              } else {
                tabLineStr += '--';
              }
            }
            tabLineStr += '|';
            lines.push(tabLineStr);
          });
          lines.push('');
        });
      }
      
      lines.push('---');
      lines.push('');
    });

    return lines.join('\n');
  };

  const parseConnections = (connectionsStr: string): TablatureConnection[] => {
    if (!connectionsStr) return [];
    
    const connections: TablatureConnection[] = [];
    const parts = connectionsStr.split(',');
    
    for (const part of parts) {
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

  const isTabLine = (line: string): boolean => {
    return /^[eEbBgGdDaA]\|.*\|?$/.test(line.trim());
  };

  const parseTabBlock = (tabBlockLines: string[], connections: TablatureConnection[] = []) => {
    if (tabBlockLines.length !== 6) return null;
    
    const newLine = createEmptyLine();
    newLine.connections = connections;
    let maxPos = 0;

    tabBlockLines.forEach((tabLine, stringIndex) => {
      const match = tabLine.match(/^[a-zA-Z]\|(.*)\|?$/);
      if (match) {
        const frets = match[1];
        let pos = 0;
        let i = 0;

        while (i < frets.length) {
          let fret = '';
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

  const parseImportText = (text: string) => {
    try {
      const lines = text.split('\n');
      let parsedTitle = 'Импортированная песня';
      let parsedArtist = '';
      const parsedBlocks: Array<{ type: 'chords' | 'tablature'; title: string; content: ChordsBlockContent | TablatureContent }> = [];

      let currentBlockType: 'chords' | 'tablature' | null = null;
      let currentBlockTitle = '';
      let currentChordsContent: string[] = [];
      let currentTabLines: Array<{ title: string; connections: TablatureConnection[]; tabLines: string[] }> = [];
      let currentTabTitle = '';
      let currentConnections: TablatureConnection[] = [];
      let tabBlockLines: string[] = [];

      const saveCurrentBlock = () => {
        if (currentBlockType === 'chords' && currentChordsContent.length > 0) {
          parsedBlocks.push({
            type: 'chords',
            title: currentBlockTitle,
            content: { text: currentChordsContent.join('\n').trim() },
          });
        } else if (currentBlockType === 'tablature' && currentTabLines.length > 0) {
          const tabContent: TablatureContent = {
            lines: currentTabLines.map(tl => {
              const parsed = parseTabBlock(tl.tabLines, tl.connections);
              if (parsed) {
                parsed.title = tl.title;
                return parsed;
              }
              return createEmptyLine();
            }).filter(l => l.notes.length > 0 || l.title),
          };
          if (tabContent.lines.length > 0) {
            parsedBlocks.push({
              type: 'tablature',
              title: currentBlockTitle,
              content: tabContent,
            });
          }
        }
        currentBlockType = null;
        currentBlockTitle = '';
        currentChordsContent = [];
        currentTabLines = [];
        currentTabTitle = '';
        currentConnections = [];
        tabBlockLines = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Song title
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
          parsedTitle = trimmed.substring(2).trim();
        }
        // Artist
        else if (trimmed.toLowerCase().startsWith('by ') && parsedArtist === '') {
          parsedArtist = trimmed.substring(3).trim();
        }
        // Block separator
        else if (trimmed === '---') {
          saveCurrentBlock();
        }
        // Block header: ## [CHORDS] Title or ## [TAB] Title
        else if (trimmed.startsWith('## ')) {
          saveCurrentBlock();
          const blockHeader = trimmed.substring(3).trim();
          
          if (blockHeader.startsWith('[CHORDS]')) {
            currentBlockType = 'chords';
            currentBlockTitle = blockHeader.replace('[CHORDS]', '').trim();
          } else if (blockHeader.startsWith('[TAB]')) {
            currentBlockType = 'tablature';
            currentBlockTitle = blockHeader.replace('[TAB]', '').trim();
          }
        }
        // Tab section title: ### Title
        else if (trimmed.startsWith('### ') && currentBlockType === 'tablature') {
          if (tabBlockLines.length === 6) {
            currentTabLines.push({ title: currentTabTitle, connections: currentConnections, tabLines: tabBlockLines });
            tabBlockLines = [];
          }
          currentTabTitle = trimmed.substring(4).trim();
          currentConnections = [];
        }
        // Connections comment
        else if (trimmed.startsWith('# connections:') && currentBlockType === 'tablature') {
          currentConnections = parseConnections(trimmed.slice(14).trim());
        }
        // Tab line
        else if (isTabLine(trimmed) && currentBlockType === 'tablature') {
          tabBlockLines.push(trimmed);
          if (tabBlockLines.length === 6) {
            currentTabLines.push({ title: currentTabTitle, connections: currentConnections, tabLines: tabBlockLines });
            tabBlockLines = [];
            currentTabTitle = '';
            currentConnections = [];
          }
        }
        // Chords content
        else if (currentBlockType === 'chords' && !trimmed.startsWith('=')) {
          currentChordsContent.push(line);
        }
      }

      // Save last block
      saveCurrentBlock();

      if (parsedBlocks.length === 0) {
        return null;
      }

      return {
        title: parsedTitle,
        artist: parsedArtist,
        blocks: parsedBlocks,
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
    const fileName = song.artist 
      ? `${song.artist} - ${song.title}`.replace(/[^a-zA-Zа-яА-Я0-9\s\-]/g, '').replace(/\s+/g, '_')
      : song.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл загружен');
  };

  const handleImport = () => {
    const result = parseImportText(importText);
    if (result) {
      onImport(result);
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
            Экспортируйте всю песню с блоками или импортируйте из файла
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
              Полный экспорт песни со всеми блоками (аккорды и табулатуры)
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

Формат:
# Название песни
by Исполнитель

==================================================

## [CHORDS] Куплет 1

Am              C
Текст песни здесь

---

## [TAB] Соло

e|--3-5-7--|
B|---------|
G|---------|
D|---------|
A|---------|
E|---------|

---`}
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
