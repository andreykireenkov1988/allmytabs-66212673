import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle, Copy, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function TelegramLinkDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCode = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      // Generate 6-char code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = '';
      for (let i = 0; i < 6; i++) {
        newCode += chars[Math.floor(Math.random() * chars.length)];
      }

      // Delete old codes for this user
      await supabase
        .from('telegram_link_codes')
        .delete()
        .eq('user_id', user.id);

      // Insert new code
      const { error } = await supabase
        .from('telegram_link_codes')
        .insert({
          user_id: user.id,
          code: newCode,
        });

      if (error) throw error;
      setCode(newCode);
    } catch (error: any) {
      toast.error('Ошибка генерации кода');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(`/link ${code}`);
      toast.success('Скопировано!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !code) generateCode(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Telegram бот">
          <MessageCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Привязка Telegram</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Привяжите Telegram для экспорта табулатур прямо в мессенджер.
          </p>

          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>1. Найдите бота в Telegram и нажмите /start</li>
            <li>2. Отправьте боту команду ниже:</li>
          </ol>

          {isGenerating ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : code ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-md text-center font-mono text-lg tracking-wider">
                  /link {code}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Код действует 10 минут
              </p>
              <Button variant="ghost" size="sm" onClick={generateCode} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Новый код
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
