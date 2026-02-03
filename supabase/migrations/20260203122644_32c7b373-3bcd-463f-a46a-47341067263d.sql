-- Шаг 1: Добавить новые колонки в songs (artist, source_url уже есть)
-- Таблица songs уже содержит нужные поля

-- Шаг 2: Создать таблицу song_blocks для хранения блоков
CREATE TABLE public.song_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('chords', 'tablature')),
    title TEXT DEFAULT '',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индекс для сортировки блоков
CREATE INDEX idx_song_blocks_song_position ON public.song_blocks(song_id, position);

-- Enable RLS
ALTER TABLE public.song_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own song blocks"
ON public.song_blocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own song blocks"
ON public.song_blocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own song blocks"
ON public.song_blocks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own song blocks"
ON public.song_blocks
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger для updated_at
CREATE TRIGGER update_song_blocks_updated_at
BEFORE UPDATE ON public.song_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Шаг 3: Миграция существующих данных

-- 3a: Миграция песен - создать блок "chords" для каждой песни с контентом
INSERT INTO public.song_blocks (song_id, user_id, block_type, title, content, position)
SELECT 
    id as song_id,
    user_id,
    'chords' as block_type,
    '' as title,
    jsonb_build_object('text', content) as content,
    0 as position
FROM public.songs
WHERE content IS NOT NULL AND content != '';

-- 3b: Миграция табулатур - создать песню для каждой табулатуры
INSERT INTO public.songs (id, user_id, title, artist, content, source_url, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    user_id,
    title,
    NULL as artist,
    '' as content,
    NULL as source_url,
    created_at,
    updated_at
FROM public.tablatures;

-- 3c: Создать блоки табулатур для мигрированных песен
INSERT INTO public.song_blocks (song_id, user_id, block_type, title, content, position)
SELECT 
    s.id as song_id,
    t.user_id,
    'tablature' as block_type,
    '' as title,
    t.content as content,
    0 as position
FROM public.tablatures t
JOIN public.songs s ON s.title = t.title AND s.user_id = t.user_id AND s.artist IS NULL AND s.content = '';