-- ============================================================
-- SwingAI — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url   TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies — users can only access their own rows
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Storage — run these AFTER creating the bucket manually:
--   Supabase Dashboard → Storage → New Bucket
--   Name: golf-videos
--   Public bucket: YES  (tick "Public bucket")
-- ============================================================

-- Storage policies (run after bucket creation)
CREATE POLICY "Authenticated users can upload their own videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'golf-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read access for golf videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'golf-videos');

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'golf-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
