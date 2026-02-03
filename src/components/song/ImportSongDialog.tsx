import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ParsedSongData } from '@/types/song';
import { toast } from 'sonner';

interface ImportSongDialogProps {
  onImport: (data: ParsedSongData) => void;
  onCreateEmpty: () => void;
  isLoading?: boolean;
}

export function ImportSongDialog({ onImport, onCreateEmpty, isLoading }: ImportSongDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!url.trim()) {
      toast.error('Введите URL страницы с аккордами');
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-song', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Не удалось распарсить страницу');
      }

      onImport(data.data);
      setOpen(false);
      setUrl('');
      toast.success('Песня импортирована!');
    } catch (error: any) {
      console.error('Error parsing song:', error);
      toast.error(error.message || 'Ошибка при парсинге страницы');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateEmpty = () => {
    onCreateEmpty();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Гитара
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить песню с аккордами</DialogTitle>
          <DialogDescription>
            Вставьте ссылку на страницу с аккордами (например, Ultimate Guitar) или создайте пустую песню
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Ссылка на страницу</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tabs.ultimate-guitar.com/..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCreateEmpty}
            disabled={isParsing}
            className="w-full sm:w-auto"
          >
            Создать пустую
          </Button>
          <Button
            onClick={handleParse}
            disabled={isParsing || !url.trim()}
            className="w-full sm:w-auto gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              'Импортировать'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
