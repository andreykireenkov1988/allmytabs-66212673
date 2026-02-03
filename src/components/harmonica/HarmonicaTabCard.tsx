import { HarmonicaTab } from '@/types/harmonica';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface HarmonicaTabCardProps {
  tab: HarmonicaTab;
  onEdit: (tab: HarmonicaTab) => void;
  onDelete: (id: string) => void;
}

export function HarmonicaTabCard({ tab, onEdit, onDelete }: HarmonicaTabCardProps) {
  const noteCount = tab.content.lines.reduce((sum, line) => sum + line.notes.length, 0);
  const lineCount = tab.content.lines.length;

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onEdit(tab)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{tab.title}</CardTitle>
            <CardDescription className="mt-1">
              {lineCount} {lineCount === 1 ? 'строка' : lineCount < 5 ? 'строки' : 'строк'} • {noteCount} {noteCount === 1 ? 'нота' : noteCount < 5 ? 'ноты' : 'нот'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(tab); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(tab.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Обновлено {formatDistanceToNow(new Date(tab.updated_at), { addSuffix: true, locale: ru })}
        </p>
      </CardContent>
    </Card>
  );
}
