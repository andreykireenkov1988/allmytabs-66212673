import { Button } from '@/components/ui/button';
import { Guitar, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
export function Header() {
  const {
    user,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast.error('Ошибка выхода');
    } else {
      toast.success('До свидания!');
    }
  };
  return <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Guitar className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold gradient-text">Allmytabs</span>
        </div>

        {user && <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>}
      </div>
    </header>;
}