import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Guitar, ArrowLeft, Mail } from 'lucide-react';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSent(true);
      toast.success('Письмо отправлено на вашу почту');
    } catch (error: any) {
      toast.error(error.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Guitar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">TabMaster</h1>
          <p className="text-muted-foreground">
            Восстановление пароля
          </p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Проверьте почту</h2>
              <p className="text-muted-foreground text-sm">
                Мы отправили ссылку для сброса пароля на {email}
              </p>
              <Button
                variant="ghost"
                onClick={onBack}
                className="mt-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Вернуться к входу
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? 'Отправка...' : 'Отправить ссылку'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
