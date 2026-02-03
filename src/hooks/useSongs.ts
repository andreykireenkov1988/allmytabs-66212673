import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/song';

export function useSongs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const songsQuery = useQuery({
    queryKey: ['songs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Song[];
    },
    enabled: !!userId,
  });

  const createSong = useMutation({
    mutationFn: async ({ 
      title, 
      artist, 
      content, 
      sourceUrl, 
      userId 
    }: { 
      title: string; 
      artist?: string; 
      content: string; 
      sourceUrl?: string; 
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('songs')
        .insert([{ 
          title, 
          artist: artist || null, 
          content, 
          source_url: sourceUrl || null, 
          user_id: userId 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const updateSong = useMutation({
    mutationFn: async ({ 
      id, 
      title, 
      artist, 
      content 
    }: { 
      id: string; 
      title?: string; 
      artist?: string; 
      content?: string;
    }) => {
      const updateData: Partial<Song> = {};
      if (title !== undefined) updateData.title = title;
      if (artist !== undefined) updateData.artist = artist;
      if (content !== undefined) updateData.content = content;

      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const deleteSong = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  return {
    songs: songsQuery.data ?? [],
    isLoading: songsQuery.isLoading,
    error: songsQuery.error,
    createSong,
    updateSong,
    deleteSong,
  };
}
