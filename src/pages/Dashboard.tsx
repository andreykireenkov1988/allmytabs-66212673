import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTablatures } from '@/hooks/useTablatures';
import { useSongs } from '@/hooks/useSongs';
import { Header } from '@/components/layout/Header';
import { TablatureCard } from '@/components/tablature/TablatureCard';
import { CreateTablatureDialog } from '@/components/tablature/CreateTablatureDialog';
import { EditTablatureView } from '@/components/tablature/EditTablatureView';
import { SongCard } from '@/components/song/SongCard';
import { ImportSongDialog } from '@/components/song/ImportSongDialog';
import { SongEditor } from '@/components/song/SongEditor';
import { Tablature, TablatureContent } from '@/types/tablature';
import { Song, ParsedSongData } from '@/types/song';
import { toast } from 'sonner';
import { Music, Loader2, Guitar, Music2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    tablatures,
    isLoading: isLoadingTabs,
    createTablature,
    updateTablature,
    deleteTablature,
  } = useTablatures(user?.id);

  const {
    songs,
    isLoading: isLoadingSongs,
    createSong,
    updateSong,
    deleteSong,
  } = useSongs(user?.id);

  const [editingTab, setEditingTab] = useState<Tablature | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const isLoading = isLoadingTabs || isLoadingSongs;

  // Handlers for tablatures
  const handleCreateTab = async (title: string) => {
    if (!user) return;
    try {
      await createTablature.mutateAsync({ title, userId: user.id });
      toast.success('Табулатура создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания');
    }
  };

  const handleSaveTab = async (id: string, title: string, content: TablatureContent) => {
    try {
      await updateTablature.mutateAsync({ id, title, content });
      toast.success('Сохранено!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  const handleDeleteTab = async (id: string) => {
    try {
      await deleteTablature.mutateAsync(id);
      toast.success('Табулатура удалена');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  // Handlers for songs
  const handleImportSong = async (data: ParsedSongData) => {
    if (!user) return;
    try {
      const newSong = await createSong.mutateAsync({
        title: data.title || 'Новая песня',
        artist: data.artist,
        content: data.content,
        sourceUrl: data.sourceUrl,
        userId: user.id,
      });
      setEditingSong(newSong);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания песни');
    }
  };

  const handleCreateEmptySong = async () => {
    if (!user) return;
    try {
      const newSong = await createSong.mutateAsync({
        title: 'Новая песня',
        content: '',
        userId: user.id,
      });
      setEditingSong(newSong);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания песни');
    }
  };

  const handleSaveSong = async (id: string, title: string, artist: string, content: string) => {
    try {
      await updateSong.mutateAsync({ id, title, artist, content });
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      await deleteSong.mutateAsync(id);
      toast.success('Песня удалена');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  // Editing views
  if (editingTab) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EditTablatureView
            tablature={editingTab}
            onBack={() => setEditingTab(null)}
            onSave={handleSaveTab}
            isSaving={updateTablature.isPending}
          />
        </main>
      </div>
    );
  }

  if (editingSong) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <SongEditor
            song={editingSong}
            onBack={() => setEditingSong(null)}
            onSave={handleSaveSong}
            isSaving={updateSong.isPending}
          />
        </main>
      </div>
    );
  }

  const totalCount = tablatures.length + songs.length;
  const isEmpty = totalCount === 0;

  // Filter items based on active tab
  const showTabs = activeTab === 'all' || activeTab === 'tabs';
  const showSongs = activeTab === 'all' || activeTab === 'songs';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Моя коллекция
            </h1>
            <p className="text-muted-foreground">
              {tablatures.length} табулатур • {songs.length} песен
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CreateTablatureDialog
              onSubmit={handleCreateTab}
              isLoading={createTablature.isPending}
            />
            <ImportSongDialog
              onImport={handleImportSong}
              onCreateEmpty={handleCreateEmptySong}
              isLoading={createSong.isPending}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Пока ничего нет
            </h2>
            <p className="text-muted-foreground mb-6">
              Создайте табулатуру или добавьте песню с аккордами
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <CreateTablatureDialog
                onSubmit={handleCreateTab}
                isLoading={createTablature.isPending}
              />
              <ImportSongDialog
                onImport={handleImportSong}
                onCreateEmpty={handleCreateEmptySong}
                isLoading={createSong.isPending}
              />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="gap-2">
                <Music className="w-4 h-4" />
                Все ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="tabs" className="gap-2">
                <Guitar className="w-4 h-4" />
                Табулатуры ({tablatures.length})
              </TabsTrigger>
              <TabsTrigger value="songs" className="gap-2">
                <Music2 className="w-4 h-4" />
                Песни ({songs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {showTabs && tablatures.map((tab) => (
                  <TablatureCard
                    key={tab.id}
                    tablature={tab}
                    onEdit={setEditingTab}
                    onDelete={handleDeleteTab}
                  />
                ))}
                {showSongs && songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={setEditingSong}
                    onDelete={handleDeleteSong}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
