import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HarmonicaTab, HarmonicaTabContent, createEmptyHarmonicaLine } from '@/types/harmonica';
import { Json } from '@/integrations/supabase/types';

// Helper to migrate/validate content
const migrateContent = (content: unknown): HarmonicaTabContent => {
  if (!content) {
    return { lines: [createEmptyHarmonicaLine()] };
  }
  
  if (typeof content === 'object' && 'lines' in (content as object)) {
    return content as HarmonicaTabContent;
  }
  
  return { lines: [createEmptyHarmonicaLine()] };
};

export function useHarmonicaTabs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const harmonicaTabsQuery = useQuery({
    queryKey: ['harmonica_tabs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('harmonica_tabs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return (data ?? []).map((item) => ({
        ...item,
        content: migrateContent(item.content),
      })) as HarmonicaTab[];
    },
    enabled: !!userId,
  });

  const createHarmonicaTab = useMutation({
    mutationFn: async ({ title, userId }: { title: string; userId: string }) => {
      const initialContent: HarmonicaTabContent = { lines: [createEmptyHarmonicaLine()] };
      
      const { data, error } = await supabase
        .from('harmonica_tabs')
        .insert([{ title, user_id: userId, content: initialContent as unknown as Json }])
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        content: migrateContent(data.content),
      } as HarmonicaTab;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harmonica_tabs', userId] });
    },
  });

  const updateHarmonicaTab = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title?: string; content?: HarmonicaTabContent }) => {
      const updateData: { title?: string; content?: Json } = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content as unknown as Json;

      const { data, error } = await supabase
        .from('harmonica_tabs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        content: migrateContent(data.content),
      } as HarmonicaTab;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harmonica_tabs', userId] });
    },
  });

  const deleteHarmonicaTab = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('harmonica_tabs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harmonica_tabs', userId] });
    },
  });

  return {
    harmonicaTabs: harmonicaTabsQuery.data ?? [],
    isLoading: harmonicaTabsQuery.isLoading,
    error: harmonicaTabsQuery.error,
    createHarmonicaTab,
    updateHarmonicaTab,
    deleteHarmonicaTab,
  };
}
