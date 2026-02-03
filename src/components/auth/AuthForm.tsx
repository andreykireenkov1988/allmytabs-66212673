import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Music, Guitar, ArrowLeft } from 'lucide-react';

type FormMode = 'login' | 'register' | 'forgot-password';

export function AuthForm() {
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Добро пожаловать!');
      } else if (mode === 'register') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success('Проверьте почту для подтверждения аккаунта');
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success('Ссылка для сброса пароля отправлена на почту');
        setMode('login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return null;
    switch (mode) {
      case 'login':
        return 'Войти';
      case 'register':
        return 'Зарегистрироваться';
      case 'forgot-password':
        return 'Отправить ссылку';
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
            {mode === 'forgot-password'
              ? 'Введите email для сброса пароля'
              : 'Создавайте и храните гитарные табулатуры'}
          </p>
        </div>

        <div className="glass-card p-8">
          {mode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к входу
            </button>
          )}

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

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Music className="w-4 h-4 animate-spin" />
                  Загрузка...
                </span>
              ) : (
                getSubmitButtonText()
              )}
            </Button>
          </form>

          {mode !== 'forgot-password' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {mode === 'login'
                  ? 'Нет аккаунта? Зарегистрируйтесь'
                  : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
