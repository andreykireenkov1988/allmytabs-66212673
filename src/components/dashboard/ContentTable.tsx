import { Tablature } from '@/types/tablature';
import { Song, isChordsContent, isTablatureContent } from '@/types/song';
import { HarmonicaTab } from '@/types/harmonica';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Guitar, Wind, Music2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ContentTableProps {
  tablatures: Tablature[];
  harmonicaTabs: HarmonicaTab[];
  songs: Song[];
  showTabs: boolean;
  showHarmonica: boolean;
  showSongs: boolean;
  onEditTab: (tab: Tablature) => void;
  onDeleteTab: (id: string) => void;
  onEditHarmonicaTab: (tab: HarmonicaTab) => void;
  onDeleteHarmonicaTab: (id: string) => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (id: string) => void;
}

type ContentItem = 
  | { type: 'harmonica'; data: HarmonicaTab }
  | { type: 'song'; data: Song };

export function ContentTable({
  harmonicaTabs,
  songs,
  showHarmonica,
  showSongs,
  onEditHarmonicaTab,
  onDeleteHarmonicaTab,
  onEditSong,
  onDeleteSong,
}: ContentTableProps) {
  // Combine all items into a single list sorted by updated_at
  const allItems: ContentItem[] = [
    ...(showHarmonica ? harmonicaTabs.map((t) => ({ type: 'harmonica' as const, data: t })) : []),
    ...(showSongs ? songs.map((s) => ({ type: 'song' as const, data: s })) : []),
  ].sort((a, b) => new Date(b.data.updated_at).getTime() - new Date(a.data.updated_at).getTime());

  if (allItems.length === 0) {
    return null;
  }

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'harmonica':
        return <Wind className="w-4 h-4" />;
      case 'song':
        return <Music2 className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: ContentItem['type']) => {
    switch (type) {
      case 'harmonica':
        return 'Гармошка';
      case 'song':
        return 'Песня';
    }
  };

  const getTypeVariant = (type: ContentItem['type']): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'harmonica':
        return 'secondary';
      case 'song':
        return 'default';
    }
  };

  const getSubtitle = (item: ContentItem): string => {
    switch (item.type) {
      case 'harmonica': {
        const lineCount = item.data.content?.lines?.length || 0;
        const noteCount = item.data.content?.lines?.reduce((sum, line) => sum + line.notes.length, 0) || 0;
        return `${lineCount} строк • ${noteCount} нот`;
      }
      case 'song': {
        const blocks = item.data.blocks || [];
        const hasChords = blocks.some(b => b.block_type === 'chords');
        const hasTabs = blocks.some(b => b.block_type === 'tablature');
        const parts = [];
        if (item.data.artist) parts.push(item.data.artist);
        if (hasChords) parts.push('Аккорды');
        if (hasTabs) parts.push(`${blocks.filter(b => b.block_type === 'tablature').length} табов`);
        return parts.join(' • ') || 'Пустая песня';
      }
    }
  };

  const handleEdit = (item: ContentItem) => {
    switch (item.type) {
      case 'harmonica':
        onEditHarmonicaTab(item.data);
        break;
      case 'song':
        onEditSong(item.data);
        break;
    }
  };

  const handleDelete = (item: ContentItem) => {
    switch (item.type) {
      case 'harmonica':
        onDeleteHarmonicaTab(item.data.id);
        break;
      case 'song':
        onDeleteSong(item.data.id);
        break;
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Тип</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="hidden md:table-cell">Детали</TableHead>
            <TableHead className="hidden sm:table-cell">Обновлено</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((item) => (
            <TableRow 
              key={`${item.type}-${item.data.id}`}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleEdit(item)}
            >
              <TableCell>
                <Badge variant={getTypeVariant(item.type)} className="gap-1">
                  {getTypeIcon(item.type)}
                  <span className="hidden sm:inline">{getTypeLabel(item.type)}</span>
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {item.data.title}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {getSubtitle(item)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(item.data.updated_at), { addSuffix: true, locale: ru })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
