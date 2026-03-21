
-- Add business branding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS stamp_url text,
  ADD COLUMN IF NOT EXISTS signature_url text;

-- Create a storage bucket for business assets (logos, stamps, signatures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access for business assets
CREATE POLICY "Public read access for business assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'business-assets');
