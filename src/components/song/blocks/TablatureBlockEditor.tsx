import { TablatureContent } from '@/types/tablature';
import { TabEditor } from '@/components/tablature/TabEditor';

interface TablatureBlockEditorProps {
  content: TablatureContent;
  onChange: (content: TablatureContent) => void;
}

export function TablatureBlockEditor({ content, onChange }: TablatureBlockEditorProps) {
  return <TabEditor content={content} onChange={onChange} />;
}
