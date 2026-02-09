import { useMemo, useState, useCallback } from 'react';
import { ChordsBlockContent } from '@/types/song';
import { transposeContent, CHORD_PATTERN } from '@/lib/chordUtils';
import { ChordModal } from '@/components/chord/ChordModal';

interface ChordsBlockViewerProps {
  content: ChordsBlockContent;
  transpose: number;
  useFlats: boolean;
}

export function ChordsBlockViewer({ content, transpose, useFlats }: ChordsBlockViewerProps) {
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleChordClick = useCallback((chord: string) => {
    setSelectedChord(chord);
    setModalOpen(true);
  }, []);

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
      // Reset lastIndex after test calls
      CHORD_PATTERN.lastIndex = 0;
      const isChordLine = chordWords.length > 0 && chordWords.length >= nonSpaceWords.length * 0.5;

      if (isChordLine) {
        const parts: { text: string; isChord: boolean }[] = [];
        let lastIndex = 0;
        const regex = new RegExp(CHORD_PATTERN.source, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: line.slice(lastIndex, match.index), isChord: false });
          }
          parts.push({ text: match[0], isChord: true });
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < line.length) {
          parts.push({ text: line.slice(lastIndex), isChord: false });
        }

        return (
          <div key={lineIndex} className="chord-line text-primary font-bold whitespace-pre">
            {parts.map((part, i) => {
              if (part.isChord) {
                return (
                  <span
                    key={i}
                    className="text-primary cursor-pointer hover:underline hover:text-primary/80 transition-colors"
                    onClick={() => handleChordClick(part.text)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleChordClick(part.text)}
                  >
                    {part.text}
                  </span>
                );
              }
              return <span key={i}>{part.text}</span>;
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
  }, [content.text, transpose, useFlats, handleChordClick]);

  if (!content.text) {
    return <p className="text-muted-foreground">Нет содержимого</p>;
  }

  return (
    <>
      <div className="font-mono text-sm leading-relaxed">
        {renderedContent}
      </div>
      <ChordModal chordName={selectedChord} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
