import { ChordsBlockContent } from '@/types/song';
import { Textarea } from '@/components/ui/textarea';

interface ChordsBlockEditorProps {
  content: ChordsBlockContent;
  onChange: (content: ChordsBlockContent) => void;
}

export function ChordsBlockEditor({ content, onChange }: ChordsBlockEditorProps) {
  return (
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
  );
}
