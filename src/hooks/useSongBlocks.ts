import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SongBlock, SongBlockType, ChordsBlockContent } from '@/types/song';
import { TablatureContent, createEmptyLine } from '@/types/tablature';
import { Json } from '@/integrations/supabase/types';

export function useSongBlocks(userId: string | undefined) {
  const queryClient = useQueryClient();

  const createBlock = useMutation({
    mutationFn: async ({
      songId,
      blockType,
      title,
      position,
    }: {
      songId: string;
      blockType: SongBlockType;
      title?: string;
      position: number;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      const defaultContent: ChordsBlockContent | TablatureContent =
        blockType === 'chords'
          ? { text: '' }
          : { lines: [createEmptyLine()] };

      const { data, error } = await supabase
        .from('song_blocks')
        .insert([{
          song_id: songId,
          user_id: userId,
          block_type: blockType,
          title: title || '',
          content: defaultContent as unknown as Json,
          position,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SongBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const updateBlock = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      position,
    }: {
      id: string;
      title?: string;
      content?: ChordsBlockContent | TablatureContent;
      position?: number;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content as unknown as Json;
      if (position !== undefined) updateData.position = position;

      const { data, error } = await supabase
        .from('song_blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SongBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('song_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  const reorderBlocks = useMutation({
    mutationFn: async (blocks: { id: string; position: number }[]) => {
      const promises = blocks.map(({ id, position }) =>
        supabase
          .from('song_blocks')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', userId] });
    },
  });

  return {
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
  };
}
