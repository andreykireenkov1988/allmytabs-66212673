import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, ClipboardPaste, Upload, X } from 'lucide-react';
import { TablatureLine } from '@/types/tablature';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecognizeTabsDialogProps {
  onRecognized: (lines: TablatureLine[]) => void;
  trigger?: React.ReactNode;
}

export function RecognizeTabsDialog({ onRecognized, trigger }: RecognizeTabsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            setImageData({ base64, mimeType: imageType });
            setPreviewUrl(dataUrl);
          };
          
          reader.readAsDataURL(blob);
          return;
        }
      }
      
      toast.error('В буфере обмена нет изображения');
    } catch (error) {
      console.error('Paste error:', error);
      toast.error('Не удалось получить изображение из буфера обмена');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setImageData({ base64, mimeType: file.type });
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setPreviewUrl(null);
    setImageData(null);
  };

  const handleRecognize = async () => {
    if (!imageData) {
      toast.error('Сначала вставьте или загрузите изображение');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('recognize-tabs', {
        body: {
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (!data.lines || data.lines.length === 0) {
        toast.error('Не удалось распознать табулатуру на изображении');
        return;
      }

      onRecognized(data.lines);
      toast.success(`Распознано ${data.lines.length} строк табулатуры`);
      setOpen(false);
      clearImage();
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Ошибка при распознавании табулатуры');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8">
            <ImageIcon className="w-4 h-4 mr-2" />
            Распознать
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Распознать табулатуру из изображения</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!previewUrl ? (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-24 border-dashed"
                onClick={handlePaste}
              >
                <div className="flex flex-col items-center gap-2">
                  <ClipboardPaste className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Вставить из буфера (Ctrl+V)
                  </span>
                </div>
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-16">
                  <Upload className="w-5 h-5 mr-2" />
                  Загрузить файл
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg border max-h-64 object-contain bg-muted"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            AI распознает гитарные табы на изображении и добавит их в редактор.
            Поддерживаются стандартные табулатуры с 6 струнами.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleRecognize} disabled={!imageData || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Распознаю...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Распознать
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
