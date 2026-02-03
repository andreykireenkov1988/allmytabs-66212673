import { useState, useMemo } from 'react';
import { ChordsBlockContent } from '@/types/song';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit2, Download, Upload, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { transposeContent, CHORD_PATTERN } from '@/lib/chordUtils';
import { toast } from 'sonner';

interface ChordsBlockEditorProps {
  content: ChordsBlockContent;
  onChange: (content: ChordsBlockContent) => void;
  transpose: number;
  useFlats: boolean;
}

export function ChordsBlockEditor({ content, onChange, transpose, useFlats }: ChordsBlockEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const renderedContent = useMemo(() => {
    const transposedContent = transposeContent(content.text, transpose, useFlats);
    const lines = transposedContent.split('\n');
    
    return lines.map((line, lineIndex) => {
      const isSectionHeader = /^\[?(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Instrumental|Coda|Hook|Refrain|Припев|Куплет|Вступление|Проигрыш|Соло)[\s\d]*\]?:?$/i.test(line.trim());
      
      if (isSectionHeader) {
        return (
          <div key={lineIndex} className="mt-6 mb-2 first:mt-0">
            <span className="text-primary font-bold text-sm uppercase tracking-wide">
              {line.trim().replace(/[\[\]:]/g, '')}
            </span>
          </div>
        );
      }

      const words = line.split(/(\s+)/);
      const nonSpaceWords = words.filter(w => w.trim());
      const chordWords = nonSpaceWords.filter(w => CHORD_PATTERN.test(w));
      const isChordLine = chordWords.length > 0 && chordWords.length >= nonSpaceWords.length * 0.5;

      if (isChordLine) {
        const parts = line.split(CHORD_PATTERN);
        return (
          <div key={lineIndex} className="chord-line text-primary font-bold whitespace-pre">
            {parts.map((part, i) => {
              if (CHORD_PATTERN.test(part)) {
                return <span key={i} className="text-primary">{part}</span>;
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        );
      }

      if (line.trim()) {
        return (
          <div key={lineIndex} className="lyrics-line text-foreground whitespace-pre">
            {line}
          </div>
        );
      }

      return <div key={lineIndex} className="h-4" />;
    });
  }, [content.text, transpose, useFlats]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано в буфер обмена');
  };

  const handleDownload = () => {
    const blob = new Blob([content.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chords.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл загружен');
  };

  const handleImport = () => {
    if (importText.trim()) {
      onChange({ text: importText.trim() });
      setExportDialogOpen(false);
      setImportText('');
      toast.success('Текст импортирован');
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Экспорт/Импорт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Экспорт и импорт текста</DialogTitle>
              <DialogDescription>
                Экспортируйте текст с аккордами или импортируйте из файла
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
                <Textarea
                  value={content.text}
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
                <Input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Вставьте текст с аккордами..."
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Просмотр
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Редактор
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <div className="min-h-[200px] font-mono text-sm leading-relaxed">
            {content.text ? renderedContent : (
              <p className="text-muted-foreground">Нет содержимого</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={content.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="font-mono text-sm min-h-[200px] leading-relaxed"
            placeholder="Введите текст с аккордами...

Пример:
[Verse 1]
Am              C
Слова песни здесь
G               F
Продолжение текста"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
