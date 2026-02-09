import { useState, useEffect, useRef } from 'react';
import { HarmonicaTab, HarmonicaTabContent, createEmptyHarmonicaLine } from '@/types/harmonica';
import { HarmonicaTabEditor } from './HarmonicaTabEditor';
import { HarmonicaTabViewer } from './HarmonicaTabViewer';
import { HarmonicaExportImportDialog } from './HarmonicaExportImportDialog';
import { ExportImageButton } from '@/components/export/ExportImageButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Eye, Pencil } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface EditHarmonicaTabViewProps {
  tab: HarmonicaTab;
  onBack: () => void;
  onSave: (id: string, title: string, content: HarmonicaTabContent) => void;
  isSaving?: boolean;
}

export function EditHarmonicaTabView({
  tab,
  onBack,
  onSave,
  isSaving,
}: EditHarmonicaTabViewProps) {
  const [title, setTitle] = useState(tab.title);
  const [content, setContent] = useState<HarmonicaTabContent>(() => {
    if (!tab.content?.lines?.length) {
      return { lines: [createEmptyHarmonicaLine()] };
    }
    return tab.content;
  });
  const [isSavingState, setIsSavingState] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback((id: string, t: string, c: HarmonicaTabContent) => {
    onSave(id, t, c);
    setIsSavingState(false);
  }, 1000);

  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    const titleChanged = title !== tab.title;
    const contentChanged = JSON.stringify(content) !== JSON.stringify(tab.content);

    if (titleChanged || contentChanged) {
      setIsSavingState(true);
      debouncedSave(tab.id, title, content);
    }
  }, [title, content, tab, debouncedSave]);

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
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
            placeholder="Название табулатуры"
          />
        </div>

        <div className="flex items-center gap-3">
          {(isSaving || isSavingState) && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </div>
          )}
          
          <ExportImageButton
            contentRef={exportRef}
            filename={title}
          />
          
          <HarmonicaExportImportDialog
            title={title}
            content={content}
            onImport={(newTitle, newContent) => {
              setTitle(newTitle);
              setContent(newContent);
            }}
          />

          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={isViewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsViewMode(true)}
              className={`gap-2 ${isViewMode ? "shadow-md font-semibold" : "opacity-60"}`}
            >
              <Eye className="w-4 h-4" />
              Просмотр
            </Button>
            <Button
              variant={!isViewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsViewMode(false)}
              className={`gap-2 ${!isViewMode ? "shadow-md font-semibold" : "opacity-60"}`}
            >
              <Pencil className="w-4 h-4" />
              Редактор
            </Button>
          </div>
        </div>
      </div>

      {isViewMode ? (
        <div ref={exportRef} className="glass-card p-6">
          <HarmonicaTabViewer content={content} />
        </div>
      ) : (
        <>
          <HarmonicaTabEditor content={content} onChange={setContent} />

          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Как пользоваться:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Кликните на ячейку и введите ноту с клавиатуры или выберите из меню</li>
              <li>• <strong>1</strong> — выдох (blow) в 1-е отверстие</li>
              <li>• <strong>-4</strong> — вдох (draw) в 4-е отверстие</li>
              <li>• <strong>-3'</strong> — бенд на полтона вниз</li>
              <li>• <strong>-3''</strong> — бенд на тон вниз</li>
              <li>• Стрелки ← → для навигации между ячейками</li>
              <li>• Добавляйте новые строки для куплетов, припевов и т.д.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
