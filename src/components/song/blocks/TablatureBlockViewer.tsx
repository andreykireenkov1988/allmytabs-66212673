import { TablatureContent } from '@/types/tablature';
import { TabViewer } from '@/components/tablature/TabViewer';

interface TablatureBlockViewerProps {
  content: TablatureContent;
}

export function TablatureBlockViewer({ content }: TablatureBlockViewerProps) {
  return <TabViewer content={content} />;
}
