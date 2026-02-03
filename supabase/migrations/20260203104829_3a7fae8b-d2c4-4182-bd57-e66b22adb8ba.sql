-- Create a table for harmonica tablatures
CREATE TABLE public.harmonica_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{"lines": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.harmonica_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own harmonica tabs" 
ON public.harmonica_tabs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own harmonica tabs" 
ON public.harmonica_tabs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own harmonica tabs" 
ON public.harmonica_tabs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own harmonica tabs" 
ON public.harmonica_tabs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_harmonica_tabs_updated_at
BEFORE UPDATE ON public.harmonica_tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();