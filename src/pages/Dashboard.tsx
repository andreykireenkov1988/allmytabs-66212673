import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSongs } from '@/hooks/useSongs';
import { useHarmonicaTabs } from '@/hooks/useHarmonicaTabs';
import { useDebouncedCallback } from '@/hooks/useDebounce';
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
import { Music, Loader2, Guitar, Wind, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const query = searchQuery.toLowerCase().trim();
    return songs.filter(song => song.title.toLowerCase().includes(query));
  }, [songs, searchQuery]);

  const filteredHarmonicaTabs = useMemo(() => {
    if (!searchQuery.trim()) return harmonicaTabs;
    const query = searchQuery.toLowerCase().trim();
    return harmonicaTabs.filter(tab => tab.title.toLowerCase().includes(query));
  }, [harmonicaTabs, searchQuery]);

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

  const totalCount = filteredSongs.length + filteredHarmonicaTabs.length;
  const isEmpty = songs.length === 0 && harmonicaTabs.length === 0;
  const noResults = totalCount === 0 && searchQuery.trim() !== '';

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
              {songs.length} гитара • {harmonicaTabs.length} гармошка
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
                  Гитара ({filteredSongs.length})
                </TabsTrigger>
                <TabsTrigger value="harmonica" className="gap-2">
                  <Wind className="w-4 h-4" />
                  Гармошка ({filteredHarmonicaTabs.length})
                </TabsTrigger>
              </TabsList>
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 max-w-sm"
              />
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {noResults ? (
                <div className="text-center py-12 text-muted-foreground">
                  Ничего не найдено по запросу «{searchQuery}»
                </div>
              ) : viewMode === 'tiles' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {showSongs && filteredSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onEdit={setEditingSong}
                      onDelete={handleDeleteSong}
                    />
                  ))}
                  {showHarmonica && filteredHarmonicaTabs.map((tab) => (
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
                  harmonicaTabs={filteredHarmonicaTabs}
                  songs={filteredSongs}
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
