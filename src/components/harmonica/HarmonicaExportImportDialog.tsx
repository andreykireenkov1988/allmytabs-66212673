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
import { HarmonicaTabContent, HarmonicaLine, HarmonicaNote, HarmonicaChord, formatHarmonicaNote, formatHarmonicaChord, parseHarmonicaNoteString, createEmptyHarmonicaLine } from '@/types/harmonica';
import { toast } from 'sonner';

interface HarmonicaExportImportDialogProps {
  title: string;
  content: HarmonicaTabContent;
  onImport: (title: string, content: HarmonicaTabContent) => void;
}

export function HarmonicaExportImportDialog({ title, content, onImport }: HarmonicaExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);

  // Format line to text representation
  const formatLineToText = (line: HarmonicaLine): string => {
    // Build notes array with chord spans
    const cells: string[] = Array(line.columns).fill('.');
    
    // Set of positions occupied by chords
    const chordPositions = new Set<number>();
    
    // Place chords first
    for (const chord of line.chords || []) {
      cells[chord.position] = formatHarmonicaChord(chord);
      // Mark spanned positions
      for (let i = 1; i < chord.span; i++) {
        chordPositions.add(chord.position + i);
      }
    }
    
    // Place individual notes (not in chords)
    for (const note of line.notes) {
      // Skip if this position is part of a chord
      const noteInChord = (line.chords || []).some(c => 
        c.notes.some(n => n.id === note.id)
      );
      if (noteInChord) continue;
      if (chordPositions.has(note.position)) continue;
      
      cells[note.position] = formatHarmonicaNote(note);
    }
    
    // Remove trailing dots and spanned positions
    return cells
      .filter((_, i) => !chordPositions.has(i))
      .join(' ')
      .replace(/(\s*\.\s*)+$/, '')
      .trim();
  };

  const exportToMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push('');

    content.lines.forEach((line) => {
      if (line.title) {
        lines.push(`## ${line.title}`);
      }
      
      lines.push('```harmonica');
      lines.push(formatLineToText(line));
      lines.push('```');
      
      // Store full data as JSON comment for perfect restoration
      const lineData = {
        notes: line.notes,
        chords: line.chords || [],
        columns: line.columns,
      };
      lines.push(`<!-- data: ${JSON.stringify(lineData)} -->`);
      lines.push('');
    });

    return lines.join('\n');
  };

  const exportToTxt = (): string => {
    const lines: string[] = [];
    lines.push(title);
    lines.push('='.repeat(Math.max(title.length, 40)));
    lines.push('');

    content.lines.forEach((line, idx) => {
      if (line.title) {
        lines.push(`[${line.title}]`);
      } else if (content.lines.length > 1) {
        lines.push(`[Часть ${idx + 1}]`);
      }
      
      lines.push(formatLineToText(line));
      lines.push('');
    });

    return lines.join('\n');
  };

  const parseHarmonicaLineFromText = (text: string, dataComment?: string): HarmonicaLine => {
    // Try to restore from JSON comment first
    if (dataComment) {
      const match = dataComment.match(/data:\s*(\{.+\})/);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          return {
            id: crypto.randomUUID(),
            title: '',
            notes: (data.notes || []).map((n: HarmonicaNote) => ({ ...n, id: crypto.randomUUID() })),
            chords: (data.chords || []).map((c: HarmonicaChord) => ({
              ...c,
              id: crypto.randomUUID(),
              notes: c.notes.map(n => ({ ...n, id: crypto.randomUUID() })),
            })),
            columns: data.columns || 16,
          };
        } catch {}
      }
    }
    
    // Parse from visual representation
    const notes: HarmonicaNote[] = [];
    const parts = text.trim().split(/\s+/);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '.' || part === '') continue;
      
      // Check if it's a chord (multiple digits like "234" or "-234")
      const chordMatch = part.match(/^(-?)(\d{2,})$/);
      if (chordMatch) {
        const direction = chordMatch[1] === '-' ? 'draw' : 'blow';
        const holes = chordMatch[2].split('').map(Number);
        
        for (const hole of holes) {
          if (hole >= 1 && hole <= 10) {
            notes.push({
              id: crypto.randomUUID(),
              hole,
              direction,
              bend: 0,
              position: i,
            });
          }
        }
        continue;
      }
      
      // Single note
      const parsed = parseHarmonicaNoteString(part);
      if (parsed) {
        notes.push({
          id: crypto.randomUUID(),
          hole: parsed.hole,
          direction: parsed.direction,
          bend: parsed.bend,
          position: i,
        });
      }
    }
    
    return {
      id: crypto.randomUUID(),
      title: '',
      notes,
      chords: [],
      columns: Math.max(16, parts.length),
    };
  };

  const parseImportText = (text: string): { title: string; content: HarmonicaTabContent } | null => {
    try {
      const lines = text.split('\n');
      let parsedTitle = 'Импортированная табулатура';
      const harmonicaLines: HarmonicaLine[] = [];

      let currentLineTitle = '';
      let inCodeBlock = false;
      let codeBlockContent = '';
      let pendingDataComment = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Markdown title
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
          parsedTitle = trimmed.substring(2).trim();
        }
        // TXT title (first line before separator)
        else if (i === 0 && trimmed && !trimmed.startsWith('[') && !trimmed.startsWith('```')) {
          let nextIdx = i + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
          if (nextIdx < lines.length && /^[=\-]{3,}$/.test(lines[nextIdx].trim())) {
            parsedTitle = trimmed;
          }
        }
        // Section title in markdown
        else if (trimmed.startsWith('## ')) {
          currentLineTitle = trimmed.substring(3).trim();
        }
        // Section title in txt
        else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentLineTitle = trimmed.slice(1, -1).trim();
        }
        // Code block start
        else if (trimmed === '```harmonica') {
          inCodeBlock = true;
          codeBlockContent = '';
        }
        // Code block end
        else if (trimmed === '```' && inCodeBlock) {
          inCodeBlock = false;
          
          // Look for data comment on next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.startsWith('<!-- data:') && nextLine.endsWith('-->')) {
              pendingDataComment = nextLine;
            }
          }
          
          const parsed = parseHarmonicaLineFromText(codeBlockContent, pendingDataComment);
          parsed.title = currentLineTitle;
          harmonicaLines.push(parsed);
          currentLineTitle = '';
          pendingDataComment = '';
        }
        // Inside code block
        else if (inCodeBlock) {
          codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        }
        // TXT format: line with notes (after section title)
        else if (!trimmed.startsWith('=') && !trimmed.startsWith('-') && 
                 !trimmed.startsWith('<!--') && trimmed.length > 0 && 
                 !inCodeBlock) {
          // Check if line contains harmonica notation
          const hasHarmonicaNotes = /^[\d\s.\-']+$/.test(trimmed.replace(/-\d/g, 'X'));
          const hasNotePattern = /(-?\d+'*)/.test(trimmed);
          
          if (hasNotePattern) {
            const parsed = parseHarmonicaLineFromText(trimmed);
            if (parsed.notes.length > 0) {
              parsed.title = currentLineTitle;
              harmonicaLines.push(parsed);
              currentLineTitle = '';
            }
          }
        }
      }

      if (harmonicaLines.length === 0) {
        return null;
      }

      return {
        title: parsedTitle,
        content: { lines: harmonicaLines },
      };
    } catch {
      return null;
    }
  };

  const handleCopyMarkdown = async () => {
    const text = exportToMarkdown();
    await navigator.clipboard.writeText(text);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
    toast.success('Markdown скопирован');
  };

  const handleCopyTxt = async () => {
    const text = exportToTxt();
    await navigator.clipboard.writeText(text);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2000);
    toast.success('Текст скопирован');
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
    toast.success('Файл .md скачан');
  };

  const handleDownloadTxt = () => {
    const text = exportToTxt();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл .txt скачан');
  };

  const handleImport = () => {
    const result = parseImportText(importText);
    if (result) {
      onImport(result.title, result.content);
      setOpen(false);
      setImportText('');
      toast.success('Табулатура импортирована');
    } else {
      toast.error('Не удалось распознать формат');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const markdownText = exportToMarkdown();
  const txtText = exportToTxt();

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

        <Tabs defaultValue="txt">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="txt" className="gap-2">
              <Copy className="w-4 h-4" />
              TXT
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

          <TabsContent value="txt" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Простой текстовый формат для чатов и форумов
            </p>
            <Textarea
              value={txtText}
              readOnly
              className="font-mono text-xs h-64 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopyTxt} variant="outline" className="gap-2">
                {copiedTxt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedTxt ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button onClick={handleDownloadTxt} variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Скачать .txt
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="markdown" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Формат с разметкой для GitHub, Notion и повторного импорта
            </p>
            <Textarea
              value={markdownText}
              readOnly
              className="font-mono text-xs h-64 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleCopyMarkdown} variant="outline" className="gap-2">
                {copiedMd ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedMd ? 'Скопировано' : 'Копировать'}
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
              placeholder={`Вставьте текст или загрузите файл...

Пример формата TXT:
Название
========================================

[Куплет]
4 -4 5 -5 6

[Припев]
-6 6 -5 5

Пример формата Markdown:
# Название

## Куплет
\`\`\`harmonica
4 -4 5 -5 6
\`\`\``}
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
