
-- Table to store Telegram ↔ User linkings
CREATE TABLE public.telegram_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  telegram_chat_id bigint NOT NULL UNIQUE,
  telegram_username text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram links"
  ON public.telegram_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram links"
  ON public.telegram_links FOR DELETE
  USING (auth.uid() = user_id);

-- Service role will insert links, so no INSERT policy for regular users needed
-- But allow service role via no RLS bypass

-- Temporary codes for linking
CREATE TABLE public.telegram_link_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own link codes"
  ON public.telegram_link_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own link codes"
  ON public.telegram_link_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own link codes"
  ON public.telegram_link_codes FOR DELETE
  USING (auth.uid() = user_id);
