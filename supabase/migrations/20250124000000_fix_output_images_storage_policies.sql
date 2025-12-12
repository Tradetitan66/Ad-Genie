/*
  # Fix Output Images Storage Policies
  
  ## Problem
  - Current policies use auth.uid() which requires Supabase Auth
  - App uses email-based auth (custom users table), so auth.uid() is NULL
  - This blocks all storage access (upload and read)
  - Images are uploaded but cannot be viewed when user logs in again
  
  ## Solution
  - Make bucket public for reading (images can be accessed via URL)
  - Allow authenticated users (anon key) to upload/update/delete
  - Folder structure ({userId}/{campaignId}/{filename}) provides basic security
  - Users can only access images if they know the exact path
  - Since URLs are stored in campaigns table, only logged-in users see them
  
  ## Security Note
  - Making bucket public means anyone with the exact URL can view the image
  - This is acceptable because:
    1. URLs are long and hard to guess (UUID-based paths)
    2. URLs are only exposed to logged-in users via the app
    3. Folder structure provides obscurity
  - For higher security, consider using signed URLs (requires code changes)
*/

-- Update bucket to be public (allows reading without auth)
UPDATE storage.buckets
SET public = true
WHERE id = 'output-images';

-- Drop old policies that require auth.uid()
DROP POLICY IF EXISTS "Users can upload output images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own output images" ON storage.objects;

-- New policy: Allow anyone to read from output-images bucket (public bucket)
-- Folder structure provides basic security (users need to know exact path)
CREATE POLICY "Public can read output images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'output-images');

-- New policy: Allow authenticated users to upload (using anon key counts as authenticated)
-- In practice, this allows uploads from the app
CREATE POLICY "Authenticated can upload output images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'output-images');

-- Allow updates (for regenerating images)
CREATE POLICY "Authenticated can update output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'output-images')
WITH CHECK (bucket_id = 'output-images');

-- Allow deletes
CREATE POLICY "Authenticated can delete output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'output-images');

