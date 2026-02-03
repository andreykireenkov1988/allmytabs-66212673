-- Add image_url column to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to harmonica_tabs table
ALTER TABLE public.harmonica_tabs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own card images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own card images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own card images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to card images
CREATE POLICY "Card images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'card-images');