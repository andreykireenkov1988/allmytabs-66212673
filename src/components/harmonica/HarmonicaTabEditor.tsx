import { HarmonicaTabContent, HarmonicaLine, createEmptyHarmonicaLine } from '@/types/harmonica';
import { HarmonicaLineEditor } from './HarmonicaLineEditor';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface HarmonicaTabEditorProps {
  content: HarmonicaTabContent;
  onChange: (content: HarmonicaTabContent) => void;
}

export function HarmonicaTabEditor({ content, onChange }: HarmonicaTabEditorProps) {
  const handleLineChange = (index: number, line: HarmonicaLine) => {
    const newLines = [...content.lines];
    newLines[index] = line;
    onChange({ ...content, lines: newLines });
  };

  const handleTitleChange = (index: number, title: string) => {
    const newLines = [...content.lines];
    newLines[index] = { ...newLines[index], title };
    onChange({ ...content, lines: newLines });
  };

  const handleAddLine = () => {
    onChange({ ...content, lines: [...content.lines, createEmptyHarmonicaLine()] });
  };

  const handleDeleteLine = (index: number) => {
    if (content.lines.length > 1) {
      const newLines = content.lines.filter((_, i) => i !== index);
      onChange({ ...content, lines: newLines });
    }
  };

  return (
    <div className="space-y-4">
      {content.lines.map((line, index) => (
        <HarmonicaLineEditor
          key={line.id}
          line={line}
          lineIndex={index}
          onChange={(l) => handleLineChange(index, l)}
          onTitleChange={(t) => handleTitleChange(index, t)}
          onDelete={() => handleDeleteLine(index)}
          canDelete={content.lines.length > 1}
        />
      ))}

      <Button variant="outline" onClick={handleAddLine} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Добавить строку
      </Button>
    </div>
  );
}
