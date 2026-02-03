import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSongs } from '@/hooks/useSongs';
import { useHarmonicaTabs } from '@/hooks/useHarmonicaTabs';
import { Header } from '@/components/layout/Header';
import { SongCard } from '@/components/song/SongCard';
import { ImportSongDialog } from '@/components/song/ImportSongDialog';
import { UnifiedSongEditor } from '@/components/song/UnifiedSongEditor';
import { HarmonicaTabCard } from '@/components/harmonica/HarmonicaTabCard';
import { CreateHarmonicaTabDialog } from '@/components/harmonica/CreateHarmonicaTabDialog';
import { EditHarmonicaTabView } from '@/components/harmonica/EditHarmonicaTabView';
import { ContentTable } from '@/components/dashboard/ContentTable';
import { ViewModeToggle, ViewMode } from '@/components/dashboard/ViewModeToggle';
import { Song, ParsedSongData } from '@/types/song';
import { HarmonicaTab, HarmonicaTabContent } from '@/types/harmonica';
import { toast } from 'sonner';
import { Music, Loader2, Guitar, Wind } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { user } = useAuth();
  
  const {
    songs,
    isLoading: isLoadingSongs,
    createSong,
    updateSong,
    deleteSong,
  } = useSongs(user?.id);

  const {
    harmonicaTabs,
    isLoading: isLoadingHarmonica,
    createHarmonicaTab,
    updateHarmonicaTab,
    deleteHarmonicaTab,
  } = useHarmonicaTabs(user?.id);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editingHarmonicaTab, setEditingHarmonicaTab] = useState<HarmonicaTab | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');

  const isLoading = isLoadingSongs || isLoadingHarmonica;

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
        userId: user.id,
      });
      setEditingSong(newSong);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания песни');
    }
  };

  const handleSaveSong = async (id: string, title: string, artist: string) => {
    try {
      await updateSong.mutateAsync({ id, title, artist });
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

  // Handlers for harmonica tabs
  const handleCreateHarmonicaTab = async (title: string) => {
    if (!user) return;
    try {
      await createHarmonicaTab.mutateAsync({ title, userId: user.id });
      toast.success('Табулатура гармошки создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания');
    }
  };

  const handleSaveHarmonicaTab = async (id: string, title: string, content: HarmonicaTabContent) => {
    try {
      await updateHarmonicaTab.mutateAsync({ id, title, content });
      toast.success('Сохранено!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  const handleDeleteHarmonicaTab = async (id: string) => {
    try {
      await deleteHarmonicaTab.mutateAsync(id);
      toast.success('Табулатура гармошки удалена');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  // Editing views
  if (editingSong) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <UnifiedSongEditor
            song={editingSong}
            onBack={() => setEditingSong(null)}
            onSaveSong={handleSaveSong}
            isSaving={updateSong.isPending}
          />
        </main>
      </div>
    );
  }

  if (editingHarmonicaTab) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EditHarmonicaTabView
            tab={editingHarmonicaTab}
            onBack={() => setEditingHarmonicaTab(null)}
            onSave={handleSaveHarmonicaTab}
            isSaving={updateHarmonicaTab.isPending}
          />
        </main>
      </div>
    );
  }

  const totalCount = songs.length + harmonicaTabs.length;
  const isEmpty = totalCount === 0;

  // Filter items based on active tab
  const showSongs = activeTab === 'all' || activeTab === 'songs';
  const showHarmonica = activeTab === 'all' || activeTab === 'harmonica';

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
              {songs.length} песен • {harmonicaTabs.length} табулатур гармошки
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ImportSongDialog
              onImport={handleImportSong}
              onCreateEmpty={handleCreateEmptySong}
              isLoading={createSong.isPending}
            />
            <CreateHarmonicaTabDialog
              onSubmit={handleCreateHarmonicaTab}
              isLoading={createHarmonicaTab.isPending}
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
              Добавьте песню с аккордами и табулатурами или создайте табулатуру для гармошки
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <ImportSongDialog
                onImport={handleImportSong}
                onCreateEmpty={handleCreateEmptySong}
                isLoading={createSong.isPending}
              />
              <CreateHarmonicaTabDialog
                onSubmit={handleCreateHarmonicaTab}
                isLoading={createHarmonicaTab.isPending}
              />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all" className="gap-2">
                  <Music className="w-4 h-4" />
                  Все ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="songs" className="gap-2">
                  <Guitar className="w-4 h-4" />
                  Песни ({songs.length})
                </TabsTrigger>
                <TabsTrigger value="harmonica" className="gap-2">
                  <Wind className="w-4 h-4" />
                  Гармошка ({harmonicaTabs.length})
                </TabsTrigger>
              </TabsList>
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {viewMode === 'tiles' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {showSongs && songs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onEdit={setEditingSong}
                      onDelete={handleDeleteSong}
                    />
                  ))}
                  {showHarmonica && harmonicaTabs.map((tab) => (
                    <HarmonicaTabCard
                      key={tab.id}
                      tab={tab}
                      onEdit={setEditingHarmonicaTab}
                      onDelete={handleDeleteHarmonicaTab}
                    />
                  ))}
                </div>
              ) : (
                <ContentTable
                  tablatures={[]}
                  harmonicaTabs={harmonicaTabs}
                  songs={songs}
                  showTabs={false}
                  showHarmonica={showHarmonica}
                  showSongs={showSongs}
                  onEditTab={() => {}}
                  onDeleteTab={() => {}}
                  onEditHarmonicaTab={setEditingHarmonicaTab}
                  onDeleteHarmonicaTab={handleDeleteHarmonicaTab}
                  onEditSong={setEditingSong}
                  onDeleteSong={handleDeleteSong}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
