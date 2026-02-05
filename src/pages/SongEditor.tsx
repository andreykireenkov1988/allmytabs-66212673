 import { useParams, useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { useSongs } from '@/hooks/useSongs';
 import { useCollections } from '@/hooks/useCollections';
 import { Header } from '@/components/layout/Header';
 import { Footer } from '@/components/layout/Footer';
 import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
 import { UnifiedSongEditor } from '@/components/song/UnifiedSongEditor';
 import { Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 
 export default function SongEditor() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { user, loading: authLoading } = useAuth();
   const { songs, isLoading: songsLoading, updateSong } = useSongs(user?.id);
   const { collections, isLoading: collectionsLoading } = useCollections(user?.id);
 
   const isLoading = authLoading || songsLoading || collectionsLoading;
   const song = songs.find(s => s.id === id);
 
   const handleBack = () => {
     if (song?.collection_id) {
       navigate(`/?collection=${song.collection_id}`);
     } else {
       navigate('/');
     }
   };
 
   const handleSaveSong = async (songId: string, title: string, artist: string) => {
     try {
       await updateSong.mutateAsync({ id: songId, title, artist });
     } catch (error: any) {
       toast.error(error.message || 'Ошибка сохранения');
     }
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user) {
     navigate('/');
     return null;
   }
 
   if (!song) {
     navigate('/');
     return null;
   }
 
   const songCollection = collections.find(c => c.id === song.collection_id);
   const breadcrumbItems = [
     { label: 'Все табы', onClick: handleBack },
     ...(songCollection ? [{ 
       label: songCollection.name, 
       onClick: () => navigate(`/?collection=${songCollection.id}`) 
     }] : []),
     { label: song.title }
   ];
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header />
       <main className="container mx-auto px-4 py-8 flex-1">
         <Breadcrumbs items={breadcrumbItems} />
         <UnifiedSongEditor
           song={song}
           onBack={handleBack}
           onSaveSong={handleSaveSong}
           isSaving={updateSong.isPending}
         />
       </main>
       <Footer />
     </div>
   );
 }