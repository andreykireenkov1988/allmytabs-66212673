-- AllMyTabs Database Schema
-- This creates all the tables needed for the application

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own collections" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- Songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    artist TEXT,
    content TEXT NOT NULL DEFAULT '',
    source_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own songs" ON public.songs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own songs" ON public.songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own songs" ON public.songs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own songs" ON public.songs
    FOR DELETE USING (auth.uid() = user_id);

-- Song blocks table
CREATE TABLE IF NOT EXISTS public.song_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    block_type TEXT NOT NULL,
    title TEXT DEFAULT '',
    content JSONB NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.song_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own song blocks" ON public.song_blocks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own song blocks" ON public.song_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own song blocks" ON public.song_blocks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own song blocks" ON public.song_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Harmonica tabs table
CREATE TABLE IF NOT EXISTS public.harmonica_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    artist TEXT,
    content JSONB NOT NULL DEFAULT '{"lines": []}',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.harmonica_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own harmonica tabs" ON public.harmonica_tabs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own harmonica tabs" ON public.harmonica_tabs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own harmonica tabs" ON public.harmonica_tabs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own harmonica tabs" ON public.harmonica_tabs
    FOR DELETE USING (auth.uid() = user_id);

-- Tablatures table
CREATE TABLE IF NOT EXISTS public.tablatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tablatures" ON public.tablatures
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tablatures" ON public.tablatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tablatures" ON public.tablatures
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tablatures" ON public.tablatures
    FOR DELETE USING (auth.uid() = user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_song_blocks_updated_at
    BEFORE UPDATE ON public.song_blocks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_harmonica_tabs_updated_at
    BEFORE UPDATE ON public.harmonica_tabs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tablatures_updated_at
    BEFORE UPDATE ON public.tablatures
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for card images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;
