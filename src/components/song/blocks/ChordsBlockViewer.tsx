import { useMemo } from 'react';
import { ChordsBlockContent } from '@/types/song';
import { transposeContent, CHORD_PATTERN } from '@/lib/chordUtils';

interface ChordsBlockViewerProps {
  content: ChordsBlockContent;
  transpose: number;
  useFlats: boolean;
}

export function ChordsBlockViewer({ content, transpose, useFlats }: ChordsBlockViewerProps) {
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

  if (!content.text) {
    return <p className="text-muted-foreground">Нет содержимого</p>;
  }

  return (
    <div className="font-mono text-sm leading-relaxed">
      {renderedContent}
    </div>
  );
}
