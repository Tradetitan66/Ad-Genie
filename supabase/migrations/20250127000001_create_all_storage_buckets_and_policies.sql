/*
  # Create All Storage Buckets and Policies
  
  ## Overview
  This migration ensures all three required storage buckets exist and have proper policies:
  1. brand-assets - For brand logos and product images
  2. output-images - For generated campaign images and videos
  3. campaign-images - For campaign-related images
  
  ## Security Model
  - All buckets are public for reading (images accessible via URL)
  - Upload/update/delete require authenticated users (Supabase Auth sessions)
  - Policies use TO authenticated (not auth.uid()) to work with Supabase Auth sessions
  - Folder structure provides basic security (users need exact path)
  
  ## Important Notes
  - Uses ON CONFLICT DO NOTHING for buckets (safe to run multiple times)
  - Drops old policies that use auth.uid() before creating new ones
  - All policies work with Supabase Auth sessions created during login
*/

-- ==========================================
-- BRAND-ASSETS BUCKET
-- ==========================================

-- Create brand-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true, -- Public for reading
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

-- Drop old policies for brand-assets (if they exist)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete brand assets" ON storage.objects;

-- Create new policies for brand-assets
CREATE POLICY "Public can read brand assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can update brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets')
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can delete brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets');

-- ==========================================
-- OUTPUT-IMAGES BUCKET
-- ==========================================

-- Create output-images bucket if it doesn't exist
-- Supports both images and videos (videos added in migration 20250125000000)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'output-images',
  'output-images',
  true, -- Public for reading
  104857600, -- 100MB limit (increased for videos)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600, -- 100MB limit (increased for videos)
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

-- Drop old policies for output-images (if they exist)
DROP POLICY IF EXISTS "Users can upload output images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own output images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read output images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload output images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update output images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete output images" ON storage.objects;

-- Create new policies for output-images
CREATE POLICY "Public can read output images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'output-images');

CREATE POLICY "Authenticated can upload output images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'output-images');

CREATE POLICY "Authenticated can update output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'output-images')
WITH CHECK (bucket_id = 'output-images');

CREATE POLICY "Authenticated can delete output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'output-images');

-- ==========================================
-- CAMPAIGN-IMAGES BUCKET
-- ==========================================

-- Create campaign-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images',
  'campaign-images',
  true, -- Public for reading
  52428800, -- 50MB limit (default)
  NULL -- Allow any MIME type
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop old policies for campaign-images (if they exist)
-- Note: We don't know the exact policy names, so we'll use a safe approach
DO $$
BEGIN
  -- Drop any existing policies for campaign-images
  DROP POLICY IF EXISTS "Public can read campaign images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated can upload campaign images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated can update campaign images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated can delete campaign images" ON storage.objects;
END $$;

-- Create new policies for campaign-images
CREATE POLICY "Public can read campaign images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated can upload campaign images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated can update campaign images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-images')
WITH CHECK (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated can delete campaign images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-images');
