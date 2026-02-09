import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportElementAsImage } from '@/lib/exportImage';

interface ExportImageButtonProps {
  contentRef: React.RefObject<HTMLDivElement>;
  filename: string;
}

export function ExportImageButton({ contentRef, filename }: ExportImageButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!contentRef.current) {
      toast.error('Нечего экспортировать');
      return;
    }

    setIsExporting(true);
    try {
      // Get computed background color from CSS
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
      const backgroundColor = bgColor ? `hsl(${bgColor})` : '#ffffff';

      await exportElementAsImage(contentRef.current, {
        filename,
        backgroundColor,
      });
      toast.success('Изображение сохранено!');
    } catch (error) {
      toast.error('Ошибка экспорта изображения');
    } finally {
      setIsExporting(false);
    }
  }, [contentRef, filename]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
      title="Скачать как PNG"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ImageIcon className="w-4 h-4" />
      )}
      PNG
    </Button>
  );
}
