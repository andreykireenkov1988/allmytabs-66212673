import { useAuth } from '@/hooks/useAuth';
import { TelegramLinkDialog } from '@/components/telegram/TelegramLinkDialog';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

export function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AllMyTabs" className="w-8 h-8" />
          <span className="font-semibold text-lg text-foreground">AllMyTabs</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link to="/chords">
              <BookOpen className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Аккорды</span>
            </Link>
          </Button>
          <TelegramLinkDialog />
        </div>
      </div>
    </header>
  );
}
