import { TablatureContent } from '@/types/tablature';
import { TabEditor } from '@/components/tablature/TabEditor';
import { ExportImportDialog } from '@/components/tablature/ExportImportDialog';

interface TablatureBlockEditorProps {
  content: TablatureContent;
  onChange: (content: TablatureContent) => void;
  blockTitle?: string;
}

export function TablatureBlockEditor({ content, onChange, blockTitle }: TablatureBlockEditorProps) {
  const handleImport = (_title: string, importedContent: TablatureContent) => {
    onChange(importedContent);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportImportDialog
          title={blockTitle || 'Табулатура'}
          content={content}
          onImport={handleImport}
        />
      </div>
      <TabEditor content={content} onChange={onChange} />
    </div>
  );
}
