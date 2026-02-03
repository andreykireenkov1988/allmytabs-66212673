import { useState, useEffect, useRef, useMemo } from 'react';
import { Song } from '@/types/song';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Eye, Edit2 } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransposeControls } from './TransposeControls';
import { SongExportImportDialog } from './SongExportImportDialog';
import { transposeContent, CHORD_PATTERN } from '@/lib/chordUtils';

interface SongEditorProps {
  song: Song;
  onBack: () => void;
  onSave: (id: string, title: string, artist: string, content: string) => void;
  isSaving?: boolean;
}

export function SongEditor({ song, onBack, onSave, isSaving }: SongEditorProps) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist || '');
  const [content, setContent] = useState(song.content);
  const [isSavingState, setIsSavingState] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [transpose, setTranspose] = useState(0);
  const [useFlats, setUseFlats] = useState(false);
  const initialLoad = useRef(true);

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback(
    (id: string, t: string, a: string, c: string) => {
      onSave(id, t, a, c);
      setIsSavingState(false);
    },
    1000
  );

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    const titleChanged = title !== song.title;
    const artistChanged = artist !== (song.artist || '');
    const contentChanged = content !== song.content;

    if (titleChanged || artistChanged || contentChanged) {
      setIsSavingState(true);
      debouncedSave(song.id, title, artist, content);
    }
  }, [title, artist, content, song, debouncedSave]);

  // Render content with highlighted chords and transposition
  const renderedContent = useMemo(() => {
    const transposedContent = transposeContent(content, transpose, useFlats);
    const lines = transposedContent.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if this is a section header
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

      // Check if line contains mostly chords (chord line)
      const words = line.split(/(\s+)/);
      const nonSpaceWords = words.filter(w => w.trim());
      const chordWords = nonSpaceWords.filter(w => CHORD_PATTERN.test(w));
      const isChordLine = chordWords.length > 0 && chordWords.length >= nonSpaceWords.length * 0.5;

      if (isChordLine) {
        // Render chord line with highlighted chords
        const parts = line.split(CHORD_PATTERN);
        return (
          <div key={lineIndex} className="chord-line text-primary font-bold whitespace-pre">
            {parts.map((part, i) => {
              if (CHORD_PATTERN.test(part)) {
                return (
                  <span key={i} className="text-primary">
                    {part}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        );
      }

      // Regular lyrics line
      if (line.trim()) {
        return (
          <div key={lineIndex} className="lyrics-line text-foreground whitespace-pre">
            {line}
          </div>
        );
      }

      // Empty line
      return <div key={lineIndex} className="h-4" />;
    });
  }, [content, transpose, useFlats]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="Название песни"
            />
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="text-sm text-muted-foreground bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="Исполнитель"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(isSaving || isSavingState) && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </div>
          )}
          <SongExportImportDialog
            title={title}
            artist={artist}
            content={content}
            onImport={(newTitle, newArtist, newContent) => {
              setTitle(newTitle);
              setArtist(newArtist);
              setContent(newContent);
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <TransposeControls
          value={transpose}
          onChange={setTranspose}
          useFlats={useFlats}
          onToggleFlats={() => setUseFlats(!useFlats)}
        />
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
          <div className="glass-card p-6 min-h-[400px]">
            <div className="font-mono text-sm leading-relaxed">
              {renderedContent}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm min-h-[400px] leading-relaxed"
            placeholder="Введите текст песни с аккордами...

Пример:
[Verse 1]
Am              C
Слова песни здесь
G               F
Продолжение текста

[Chorus]
C    G    Am   F
Припев песни"
          />
        </TabsContent>
      </Tabs>

      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Как форматировать:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Аккорды размещайте над строкой с текстом</li>
          <li>• Используйте пробелы для выравнивания аккордов над нужными словами</li>
          <li>• Секции обозначайте в квадратных скобках: [Verse], [Chorus], [Bridge]</li>
          <li>• Поддерживаются аккорды: Am, C#m, Gmaj7, Fsus4, D/F# и т.д.</li>
        </ul>
      </div>
    </div>
  );
}
