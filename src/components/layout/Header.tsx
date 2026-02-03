import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

export function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AllMyTabs" className="w-8 h-8" />
          <span className="font-semibold text-lg text-foreground">AllMyTabs</span>
        </div>
      </div>
    </header>
  );
}
