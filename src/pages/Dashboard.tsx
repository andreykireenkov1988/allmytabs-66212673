import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSongs } from '@/hooks/useSongs';
import { useHarmonicaTabs } from '@/hooks/useHarmonicaTabs';
import { useCollections } from '@/hooks/useCollections';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SongCard } from '@/components/song/SongCard';
import { ImportSongDialog } from '@/components/song/ImportSongDialog';
import { UnifiedSongEditor } from '@/components/song/UnifiedSongEditor';
import { HarmonicaTabCard } from '@/components/harmonica/HarmonicaTabCard';
import { CreateHarmonicaTabDialog } from '@/components/harmonica/CreateHarmonicaTabDialog';
import { EditHarmonicaTabView } from '@/components/harmonica/EditHarmonicaTabView';
import { ContentTable } from '@/components/dashboard/ContentTable';
import { ViewModeToggle, ViewMode } from '@/components/dashboard/ViewModeToggle';
import { CreateCollectionDialog } from '@/components/collection/CreateCollectionDialog';
import { CollectionExportImportDialog } from '@/components/collection/CollectionExportImportDialog';
import { MoveToCollectionDialog } from '@/components/collection/MoveToCollectionDialog';
import { DeleteCollectionDialog } from '@/components/collection/DeleteCollectionDialog';
import { Song, ParsedSongData, ChordsBlockContent } from '@/types/song';
import { HarmonicaTab, HarmonicaTabContent } from '@/types/harmonica';
import { TablatureContent } from '@/types/tablature';
import { toast } from 'sonner';
import { Music, Loader2, Guitar, Wind, Search, FolderOpen, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
export default function Dashboard() {
  const {
    user
  } = useAuth();
  const {
    songs,
    isLoading: isLoadingSongs,
    createSong,
    updateSong,
    deleteSong,
    generateSongImage
  } = useSongs(user?.id);
  const {
    harmonicaTabs,
    isLoading: isLoadingHarmonica,
    createHarmonicaTab,
    updateHarmonicaTab,
    deleteHarmonicaTab,
    generateHarmonicaImage
  } = useHarmonicaTabs(user?.id);
  const {
    collections,
    isLoading: isLoadingCollections,
    createCollection,
    deleteCollection
  } = useCollections(user?.id);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editingHarmonicaTab, setEditingHarmonicaTab] = useState<HarmonicaTab | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [generatingSongId, setGeneratingSongId] = useState<string | null>(null);
  const [generatingHarmonicaId, setGeneratingHarmonicaId] = useState<string | null>(null);
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Filter by collection and search
  const filteredSongs = useMemo(() => {
    let result = songs;
    if (selectedCollectionId !== null) {
      result = result.filter(song => song.collection_id === selectedCollectionId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(song => song.title.toLowerCase().includes(query));
    }
    return result;
  }, [songs, searchQuery, selectedCollectionId]);
  const filteredHarmonicaTabs = useMemo(() => {
    let result = harmonicaTabs;
    if (selectedCollectionId !== null) {
      result = result.filter(tab => tab.collection_id === selectedCollectionId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(tab => tab.title.toLowerCase().includes(query));
    }
    return result;
  }, [harmonicaTabs, searchQuery, selectedCollectionId]);
  const isLoading = isLoadingSongs || isLoadingHarmonica || isLoadingCollections;

  // Handlers for collections
  const handleCreateCollection = async (name: string) => {
    if (!user) return;
    try {
      await createCollection.mutateAsync({
        name,
        userId: user.id
      });
      toast.success('Коллекция создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания коллекции');
    }
  };
  const handleDeleteCollection = async (id: string, deleteCards: boolean) => {
    try {
      if (deleteCards) {
        // Delete all songs in this collection
        const songsToDelete = songs.filter(s => s.collection_id === id);
        for (const song of songsToDelete) {
          await deleteSong.mutateAsync(song.id);
        }

        // Delete all harmonica tabs in this collection
        const tabsToDelete = harmonicaTabs.filter(t => t.collection_id === id);
        for (const tab of tabsToDelete) {
          await deleteHarmonicaTab.mutateAsync(tab.id);
        }
      }
      await deleteCollection.mutateAsync(id);
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
      }
      toast.success(deleteCards ? 'Коллекция и карточки удалены' : 'Коллекция удалена');
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
        collectionId: selectedCollectionId
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
        collectionId: selectedCollectionId
      });
      setEditingSong(newSong);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания песни');
    }
  };
  const handleSaveSong = async (id: string, title: string, artist: string) => {
    try {
      await updateSong.mutateAsync({
        id,
        title,
        artist
      });
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
  const handleMoveSong = async (songId: string, collectionId: string | null) => {
    try {
      await updateSong.mutateAsync({
        id: songId,
        collectionId
      });
      toast.success('Перемещено!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка перемещения');
    }
  };

  // Handlers for harmonica tabs
  const handleCreateHarmonicaTab = async (title: string) => {
    if (!user) return;
    try {
      await createHarmonicaTab.mutateAsync({
        title,
        userId: user.id,
        collectionId: selectedCollectionId
      });
      toast.success('Табулатура гармошки создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания');
    }
  };
  const handleSaveHarmonicaTab = async (id: string, title: string, content: HarmonicaTabContent) => {
    try {
      await updateHarmonicaTab.mutateAsync({
        id,
        title,
        content
      });
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
  const handleMoveHarmonicaTab = async (tabId: string, collectionId: string | null) => {
    try {
      await updateHarmonicaTab.mutateAsync({
        id: tabId,
        collectionId
      });
      toast.success('Перемещено!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка перемещения');
    }
  };

  // Handlers for image generation
  const handleGenerateSongImage = async (song: Song) => {
    setGeneratingSongId(song.id);
    try {
      await generateSongImage.mutateAsync({
        id: song.id,
        title: song.title,
        artist: song.artist
      });
    } finally {
      setGeneratingSongId(null);
    }
  };
  const handleGenerateHarmonicaImage = async (tab: HarmonicaTab) => {
    setGeneratingHarmonicaId(tab.id);
    try {
      await generateHarmonicaImage.mutateAsync({
        id: tab.id,
        title: tab.title,
        artist: tab.artist
      });
    } finally {
      setGeneratingHarmonicaId(null);
    }
  };

  // Import handler for collections
  const handleImportCollection = async (data: {
    songs: Array<{
      title: string;
      artist: string | null;
      blocks: Array<{
        block_type: string;
        title: string;
        content: unknown;
        position: number;
      }>;
    }>;
    harmonicaTabs: Array<{
      title: string;
      content: unknown;
    }>;
  }, targetCollectionId: string | null, collectionName?: string) => {
    if (!user) return;
    let finalCollectionId = targetCollectionId;

    // Create new collection if needed
    if (collectionName) {
      const newCollection = await createCollection.mutateAsync({
        name: collectionName,
        userId: user.id
      });
      finalCollectionId = newCollection.id;
    }

    // Import songs
    for (const songData of data.songs || []) {
      const {
        data: newSong,
        error: songError
      } = await supabase.from('songs').insert([{
        title: songData.title,
        artist: songData.artist,
        content: '',
        user_id: user.id,
        collection_id: finalCollectionId
      }]).select().single();
      if (songError) throw songError;

      // Import blocks
      if (songData.blocks && songData.blocks.length > 0) {
        const blocksToInsert = songData.blocks.map(block => ({
          song_id: newSong.id,
          user_id: user.id,
          block_type: block.block_type,
          title: block.title || '',
          content: block.content as Json,
          position: block.position
        }));
        const {
          error: blocksError
        } = await supabase.from('song_blocks').insert(blocksToInsert);
        if (blocksError) throw blocksError;
      }
    }

    // Import harmonica tabs
    for (const tabData of data.harmonicaTabs || []) {
      const {
        error
      } = await supabase.from('harmonica_tabs').insert([{
        title: tabData.title,
        content: tabData.content as Json,
        user_id: user.id,
        collection_id: finalCollectionId
      }]);
      if (error) throw error;
    }

    // Refetch data
    window.location.reload();
  };

  // Editing views
  if (editingSong) {
    const songCollection = collections.find(c => c.id === editingSong.collection_id);
    const breadcrumbItems = [
      { label: 'Все табы', onClick: () => setEditingSong(null) },
      ...(songCollection ? [{ label: songCollection.name, onClick: () => { setEditingSong(null); setSelectedCollectionId(songCollection.id); } }] : []),
      { label: editingSong.title }
    ];
    
    return <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Breadcrumbs items={breadcrumbItems} />
          <UnifiedSongEditor song={editingSong} onBack={() => setEditingSong(null)} onSaveSong={handleSaveSong} isSaving={updateSong.isPending} />
        </main>
        <Footer />
      </div>;
  }
  if (editingHarmonicaTab) {
    const tabCollection = collections.find(c => c.id === editingHarmonicaTab.collection_id);
    const breadcrumbItems = [
      { label: 'Все табы', onClick: () => setEditingHarmonicaTab(null) },
      ...(tabCollection ? [{ label: tabCollection.name, onClick: () => { setEditingHarmonicaTab(null); setSelectedCollectionId(tabCollection.id); } }] : []),
      { label: editingHarmonicaTab.title }
    ];
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Breadcrumbs items={breadcrumbItems} />
          <EditHarmonicaTabView
            tab={editingHarmonicaTab}
            onBack={() => setEditingHarmonicaTab(null)}
            onSave={handleSaveHarmonicaTab}
            isSaving={updateHarmonicaTab.isPending}
          />
        </main>
        <Footer />
      </div>
    );
  }
  const totalCount = filteredSongs.length + filteredHarmonicaTabs.length;
  const isEmpty = songs.length === 0 && harmonicaTabs.length === 0;
  const noResults = totalCount === 0 && (searchQuery.trim() !== '' || selectedCollectionId !== null);

  // Filter items based on active tab
  const showSongs = activeTab === 'all' || activeTab === 'songs';
  const showHarmonica = activeTab === 'all' || activeTab === 'harmonica';
  const selectedCollection = collections.find(c => c.id === selectedCollectionId);
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <ImportSongDialog onImport={handleImportSong} onCreateEmpty={handleCreateEmptySong} isLoading={createSong.isPending} />
            <CreateHarmonicaTabDialog onSubmit={handleCreateHarmonicaTab} isLoading={createHarmonicaTab.isPending} />
            <CreateCollectionDialog onSubmit={handleCreateCollection} isLoading={createCollection.isPending} />
            <CollectionExportImportDialog songs={songs} harmonicaTabs={harmonicaTabs} collections={collections} onImport={handleImportCollection} />
          </div>
        </div>

        {/* Collections filter */}
        {collections.length > 0 && <div className="flex items-center gap-2 mb-6 flex-wrap">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              <Button variant={selectedCollectionId === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollectionId(null)}>
                Все
              </Button>
              {collections.map(collection => <div key={collection.id} className="flex items-center gap-1">
                  <Button variant={selectedCollectionId === collection.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollectionId(collection.id)}>
                    {collection.name}
                  </Button>
                  <DeleteCollectionDialog collection={collection} songsCount={songs.filter(s => s.collection_id === collection.id).length} harmonicaTabsCount={harmonicaTabs.filter(t => t.collection_id === collection.id).length} onDelete={handleDeleteCollection} />
                </div>)}
            </div>
          </div>}

        {isLoading ? <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div> : isEmpty ? <div className="text-center py-20 animate-fade-in">
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
              <ImportSongDialog onImport={handleImportSong} onCreateEmpty={handleCreateEmptySong} isLoading={createSong.isPending} />
              <CreateHarmonicaTabDialog onSubmit={handleCreateHarmonicaTab} isLoading={createHarmonicaTab.isPending} />
            </div>
          </div> : <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Поиск по названию..." value={searchInput} onChange={handleSearchChange} className="pl-10 max-w-sm" />
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {noResults ? <div className="text-center py-12 text-muted-foreground">
                  {searchQuery.trim() ? `Ничего не найдено по запросу «${searchQuery}»` : 'В этой коллекции пока ничего нет'}
                </div> : <ContentTable tablatures={[]} harmonicaTabs={filteredHarmonicaTabs} songs={filteredSongs} showTabs={false} showHarmonica={showHarmonica} showSongs={showSongs} onEditTab={() => {}} onDeleteTab={() => {}} onEditHarmonicaTab={setEditingHarmonicaTab} onDeleteHarmonicaTab={handleDeleteHarmonicaTab} onEditSong={setEditingSong} onDeleteSong={handleDeleteSong} collections={collections} onMoveSong={handleMoveSong} onMoveHarmonicaTab={handleMoveHarmonicaTab} />}
            </TabsContent>
          </Tabs>}
      </main>
      <Footer />
    </div>;
}