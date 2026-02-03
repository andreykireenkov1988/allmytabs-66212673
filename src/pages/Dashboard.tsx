import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTablatures } from '@/hooks/useTablatures';
import { Header } from '@/components/layout/Header';
import { TablatureCard } from '@/components/tablature/TablatureCard';
import { CreateTablatureDialog } from '@/components/tablature/CreateTablatureDialog';
import { EditTablatureView } from '@/components/tablature/EditTablatureView';
import { Tablature, TablatureNote } from '@/types/tablature';
import { toast } from 'sonner';
import { Music, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    tablatures,
    isLoading,
    createTablature,
    updateTablature,
    deleteTablature,
  } = useTablatures(user?.id);

  const [editingTab, setEditingTab] = useState<Tablature | null>(null);

  const handleCreate = async (title: string) => {
    if (!user) return;
    try {
      await createTablature.mutateAsync({ title, userId: user.id });
      toast.success('Табулатура создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания');
    }
  };

  const handleSave = async (id: string, title: string, content: TablatureNote[]) => {
    try {
      await updateTablature.mutateAsync({ id, title, content });
      toast.success('Сохранено!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTablature.mutateAsync(id);
      toast.success('Табулатура удалена');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  if (editingTab) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EditTablatureView
            tablature={editingTab}
            onBack={() => setEditingTab(null)}
            onSave={handleSave}
            isSaving={updateTablature.isPending}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Мои табулатуры
            </h1>
            <p className="text-muted-foreground">
              {tablatures.length} {tablatures.length === 1 ? 'табулатура' : 'табулатур'}
            </p>
          </div>
          <CreateTablatureDialog
            onSubmit={handleCreate}
            isLoading={createTablature.isPending}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tablatures.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Пока нет табулатур
            </h2>
            <p className="text-muted-foreground mb-6">
              Создайте первую табулатуру, чтобы начать
            </p>
            <CreateTablatureDialog
              onSubmit={handleCreate}
              isLoading={createTablature.isPending}
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tablatures.map((tab) => (
              <TablatureCard
                key={tab.id}
                tablature={tab}
                onEdit={setEditingTab}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
