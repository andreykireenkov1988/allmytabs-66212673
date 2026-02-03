import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export function Footer() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Ошибка выхода');
    } else {
      toast.success('До свидания!');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!user) return null;

  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </footer>
  );
}
