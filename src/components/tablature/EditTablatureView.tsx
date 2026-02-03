import { useState, useEffect, useRef } from 'react';
import { Tablature, TablatureContent, createEmptyLine } from '@/types/tablature';
import { TabEditor } from './TabEditor';
import { TabViewer } from './TabViewer';
import { ExportImportDialog } from './ExportImportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Eye, Pencil } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface EditTablatureViewProps {
  tablature: Tablature;
  onBack: () => void;
  onSave: (id: string, title: string, content: TablatureContent) => void;
  isSaving?: boolean;
}

export function EditTablatureView({
  tablature,
  onBack,
  onSave,
  isSaving,
}: EditTablatureViewProps) {
  const [title, setTitle] = useState(tablature.title);
  const [content, setContent] = useState<TablatureContent>(() => {
    if (!tablature.content?.lines?.length) {
      return { lines: [createEmptyLine()] };
    }
    return tablature.content;
  });
  const [isSavingState, setIsSavingState] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const initialLoad = useRef(true);

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback((id: string, t: string, c: TablatureContent) => {
    onSave(id, t, c);
    setIsSavingState(false);
  }, 1000);

  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    const titleChanged = title !== tablature.title;
    const contentChanged =
      JSON.stringify(content) !== JSON.stringify(tablature.content);

    if (titleChanged || contentChanged) {
      setIsSavingState(true);
      debouncedSave(tablature.id, title, content);
    }
  }, [title, content, tablature, debouncedSave]);

  const handleImport = (importedTitle: string, importedContent: TablatureContent) => {
    setTitle(importedTitle);
    setContent(importedContent);
  };

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
          <Button
            variant={isViewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsViewMode(true)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Просмотр
          </Button>
          <Button
            variant={!isViewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsViewMode(false)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Редактор
          </Button>
          {(isSaving || isSavingState) && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </div>
          )}
          <ExportImportDialog
            title={title}
            content={content}
            onImport={handleImport}
          />
        </div>
      </div>

      {isViewMode ? (
        <div className="glass-card p-6">
          <TabViewer content={content} />
        </div>
      ) : (
        <>
          <TabEditor content={content} onChange={setContent} />

          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Как пользоваться:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Кликните на позицию струны и введите номер лада</li>
              <li>• Можно вводить цифры (0-24), буквы (h, p, b) и символы (/)</li>
              <li>• <strong>Перетаскивание:</strong> копирует ноту, с <strong>Shift</strong> — переносит</li>
              <li>• <strong>Стрелки ↑↓</strong> — навигация между струнами</li>
              <li>• Используйте кнопки "Больше/Меньше" для изменения длины строки</li>
              <li>• Добавляйте новые строки для куплетов, припевов и т.д.</li>
              <li>• E - самая толстая струна (бас), e - самая тонкая</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
