import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tablature, TablatureContent, createEmptyLine } from '@/types/tablature';
import { Json } from '@/integrations/supabase/types';

// Helper to migrate old format to new format
const migrateContent = (content: unknown): TablatureContent => {
  if (!content) {
    return { lines: [createEmptyLine()] };
  }
  
  // Check if it's already in new format
  if (typeof content === 'object' && 'lines' in (content as object)) {
    return content as TablatureContent;
  }
  
  // Migrate old array format to new lines format
  if (Array.isArray(content)) {
    return {
      lines: [{
        id: crypto.randomUUID(),
        title: '',
        notes: content,
        columns: Math.max(16, ...content.map((n: { position: number }) => n.position + 4)),
      }],
    };
  }
  
  return { lines: [createEmptyLine()] };
};

export function useTablatures(userId: string | undefined) {
  const queryClient = useQueryClient();

  const tablaturesQuery = useQuery({
    queryKey: ['tablatures', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('tablatures')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return (data ?? []).map((item) => ({
        ...item,
        content: migrateContent(item.content),
      })) as Tablature[];
    },
    enabled: !!userId,
  });

  const createTablature = useMutation({
    mutationFn: async ({ title, userId }: { title: string; userId: string }) => {
      const initialContent: TablatureContent = { lines: [createEmptyLine()] };
      
      const { data, error } = await supabase
        .from('tablatures')
        .insert([{ title, user_id: userId, content: initialContent as unknown as Json }])
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        content: migrateContent(data.content),
      } as Tablature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tablatures', userId] });
    },
  });

  const updateTablature = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title?: string; content?: TablatureContent }) => {
      const updateData: { title?: string; content?: Json } = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content as unknown as Json;

      const { data, error } = await supabase
        .from('tablatures')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        content: migrateContent(data.content),
      } as Tablature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tablatures', userId] });
    },
  });

  const deleteTablature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tablatures')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tablatures', userId] });
    },
  });

  return {
    tablatures: tablaturesQuery.data ?? [],
    isLoading: tablaturesQuery.isLoading,
    error: tablaturesQuery.error,
    createTablature,
    updateTablature,
    deleteTablature,
  };
}
