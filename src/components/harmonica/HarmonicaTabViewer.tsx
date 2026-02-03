import { HarmonicaTabContent } from '@/types/harmonica';
import { HarmonicaLineViewer } from './HarmonicaLineViewer';

interface HarmonicaTabViewerProps {
  content: HarmonicaTabContent;
}

export function HarmonicaTabViewer({ content }: HarmonicaTabViewerProps) {
  return (
    <div className="space-y-4">
      {content.lines.map((line, index) => (
        <HarmonicaLineViewer
          key={line.id}
          line={line}
          lineIndex={index}
        />
      ))}
    </div>
  );
}
