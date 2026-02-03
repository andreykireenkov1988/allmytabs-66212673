import { useState, useEffect } from 'react';
import { Tablature, TablatureNote } from '@/types/tablature';
import { TabEditor } from './TabEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Check } from 'lucide-react';

interface EditTablatureViewProps {
  tablature: Tablature;
  onBack: () => void;
  onSave: (id: string, title: string, content: TablatureNote[]) => void;
  isSaving?: boolean;
}

export function EditTablatureView({
  tablature,
  onBack,
  onSave,
  isSaving,
}: EditTablatureViewProps) {
  const [title, setTitle] = useState(tablature.title);
  const [content, setContent] = useState<TablatureNote[]>(
    (tablature.content as TablatureNote[]) || []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const titleChanged = title !== tablature.title;
    const contentChanged =
      JSON.stringify(content) !== JSON.stringify(tablature.content);
    setHasChanges(titleChanged || contentChanged);
  }, [title, content, tablature]);

  const handleSave = () => {
    onSave(tablature.id, title, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`gap-2 transition-all ${
            saved
              ? 'bg-green-600 hover:bg-green-600'
              : 'bg-primary hover:bg-primary/90'
          } text-primary-foreground`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Сохранено
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Сохранить
            </>
          )}
        </Button>
      </div>

      <TabEditor content={content} onChange={setContent} />

      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Как пользоваться:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Кликните на позицию струны и введите номер лада</li>
          <li>• Можно вводить цифры (0-24), буквы (h, p, b) и символы (/)</li>
          <li>• Используйте кнопки "Больше/Меньше" для изменения длины</li>
          <li>• E - самая толстая струна (бас), e - самая тонкая</li>
        </ul>
      </div>
    </div>
  );
}
