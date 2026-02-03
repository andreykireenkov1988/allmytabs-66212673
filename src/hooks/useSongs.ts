import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song, SongBlock, ChordsBlockContent, isChordsContent, isTablatureContent } from '@/types/song';
import { TablatureContent, createEmptyLine } from '@/types/tablature';
import { Json } from '@/integrations/supabase/types';

// Helper to migrate old content formats
const migrateBlockContent = (block: unknown): SongBlock => {
  const b = block as SongBlock;
  
  if (b.block_type === 'tablature') {
    const content = b.content as unknown;
    
    // Check if it's already in the lines format
    if (isTablatureContent(content)) {
      return b;
    }
    
    // Migrate old array format
    if (Array.isArray(content)) {
      return {
        ...b,
        content: {
          lines: [{
            id: crypto.randomUUID(),
            title: '',
            notes: content,
            connections: [],
            columns: Math.max(16, ...content.map((n: { position: number }) => n.position + 4)),
          }],
        } as TablatureContent,
      };
    }
    
    return {
      ...b,
      content: { lines: [createEmptyLine()] } as TablatureContent,
    };
  }
  
  if (b.block_type === 'chords') {
    const content = b.content as unknown;
    
    if (isChordsContent(content)) {
      return b;
    }
    
    // If content is a string (shouldn't happen but handle it)
    if (typeof content === 'string') {
      return {
        ...b,
        content: { text: content } as ChordsBlockContent,
      };
    }
    
    return {
      ...b,
      content: { text: '' } as ChordsBlockContent,
    };
  }
  
  return b;
};

export function useSongs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const songsQuery = useQuery({
    queryKey: ['songs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Fetch songs with their blocks
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (songsError) throw songsError;
      
      // Fetch all blocks for these songs
      const songIds = songs?.map(s => s.id) || [];
      
      if (songIds.length === 0) return [];
      
      const { data: blocks, error: blocksError } = await supabase
        .from('song_blocks')
        .select('*')
        .in('song_id', songIds)
        .order('position', { ascending: true });
      
      if (blocksError) throw blocksError;
      
      // Migrate and group blocks by song_id
      const migratedBlocks = (blocks || []).map(migrateBlockContent);
      const blocksBySongId = migratedBlocks.reduce((acc, block) => {
        if (!acc[block.song_id]) acc[block.song_id] = [];
        acc[block.song_id].push(block);
        return acc;
      }, {} as Record<string, SongBlock[]>);
      
      // Combine songs with their blocks
      return (songs || []).map(song => ({
        ...song,
        blocks: blocksBySongId[song.id] || [],
      })) as Song[];
    },
    enabled: !!userId,
  });

  const createSong = useMutation({
    mutationFn: async ({ 
      title, 
      artist, 
      content, 
      sourceUrl, 
      userId,
      collectionId,
    }: { 
      title: string; 
      artist?: string; 
      content?: string; 
      sourceUrl?: string; 
      userId: string;
      collectionId?: string | null;
    }) => {
      // Create the song
      const { data: song, error: songError } = await supabase
        .from('songs')
        .insert([{ 
          title, 
          artist: artist || null, 
          content: '', // Keep empty, content lives in blocks
          source_url: sourceUrl || null, 
          user_id: userId,
          collection_id: collectionId || null,
        }])
        .select()
        .single();
      
      if (songError) throw songError;
      
      // If content was provided, create a chords block
      if (content) {
        const { error: blockError } = await supabase
          .from('song_blocks')
          .insert([{
            song_id: song.id,
            user_id: userId,
            block_type: 'chords',
            title: '',
            content: { text: content } as unknown as Json,
            position: 0,
          }]);
        
        if (blockError) throw blockError;
      }
      
      return song as Song;
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
      collectionId,
      imageUrl,
    }: { 
      id: string; 
      title?: string; 
      artist?: string; 
      collectionId?: string | null;
      imageUrl?: string | null;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (artist !== undefined) updateData.artist = artist;
      if (collectionId !== undefined) updateData.collection_id = collectionId;
      if (imageUrl !== undefined) updateData.image_url = imageUrl;

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

  const generateSongImage = useMutation({
    mutationFn: async ({ id, title, artist }: { id: string; title: string; artist?: string | null }) => {
      const { data, error } = await supabase.functions.invoke('generate-card-image', {
        body: { title, artist, itemType: 'song', itemId: id },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.imageUrl as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const deleteSong = useMutation({
    mutationFn: async (id: string) => {
      // Blocks will be deleted automatically via CASCADE
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
    generateSongImage,
  };
}
