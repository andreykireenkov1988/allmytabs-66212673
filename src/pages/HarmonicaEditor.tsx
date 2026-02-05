 import { useParams, useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { useHarmonicaTabs } from '@/hooks/useHarmonicaTabs';
 import { useCollections } from '@/hooks/useCollections';
 import { Header } from '@/components/layout/Header';
 import { Footer } from '@/components/layout/Footer';
 import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
 import { EditHarmonicaTabView } from '@/components/harmonica/EditHarmonicaTabView';
 import { HarmonicaTabContent } from '@/types/harmonica';
 import { Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 
 export default function HarmonicaEditor() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { user, loading: authLoading } = useAuth();
   const { harmonicaTabs, isLoading: tabsLoading, updateHarmonicaTab } = useHarmonicaTabs(user?.id);
   const { collections, isLoading: collectionsLoading } = useCollections(user?.id);
 
   const isLoading = authLoading || tabsLoading || collectionsLoading;
   const tab = harmonicaTabs.find(t => t.id === id);
 
   const handleBack = () => {
     if (tab?.collection_id) {
       navigate(`/?collection=${tab.collection_id}`);
     } else {
       navigate('/');
     }
   };
 
   const handleSave = async (tabId: string, title: string, content: HarmonicaTabContent) => {
     try {
       await updateHarmonicaTab.mutateAsync({ id: tabId, title, content });
       toast.success('Сохранено!');
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
 
   if (!tab) {
     navigate('/');
     return null;
   }
 
   const tabCollection = collections.find(c => c.id === tab.collection_id);
   const breadcrumbItems = [
     { label: 'Все табы', onClick: handleBack },
     ...(tabCollection ? [{ 
       label: tabCollection.name, 
       onClick: () => navigate(`/?collection=${tabCollection.id}`) 
     }] : []),
     { label: tab.title }
   ];
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header />
       <main className="container mx-auto px-4 py-8 flex-1">
         <Breadcrumbs items={breadcrumbItems} />
         <EditHarmonicaTabView
           tab={tab}
           onBack={handleBack}
           onSave={handleSave}
           isSaving={updateHarmonicaTab.isPending}
         />
       </main>
       <Footer />
     </div>
   );
 }