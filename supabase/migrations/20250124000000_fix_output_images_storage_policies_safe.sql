/*
  # Fix Output Images Storage Policies (Safe Step-by-Step Version)
  
  This version avoids DROP statements to prevent Supabase warnings.
  Run each section separately if you prefer.
*/

-- ==========================================
-- STEP 1: Make bucket public (SAFE - no data loss)
-- ==========================================
UPDATE storage.buckets
SET public = true
WHERE id = 'output-images';

-- ==========================================
-- STEP 2: Create new policies (will fail if old ones exist, that's OK)
-- ==========================================

-- Policy 1: Allow public read access
-- Note: If policy already exists, you'll get an error - that's OK, just skip to next step
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read output images'
  ) THEN
    CREATE POLICY "Public can read output images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'output-images');
  END IF;
END $$;

-- Policy 2: Allow authenticated users to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can upload output images'
  ) THEN
    CREATE POLICY "Authenticated can upload output images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'output-images');
  END IF;
END $$;

-- Policy 3: Allow authenticated users to update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can update output images'
  ) THEN
    CREATE POLICY "Authenticated can update output images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'output-images')
    WITH CHECK (bucket_id = 'output-images');
  END IF;
END $$;

-- Policy 4: Allow authenticated users to delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated can delete output images'
  ) THEN
    CREATE POLICY "Authenticated can delete output images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'output-images');
  END IF;
END $$;

-- ==========================================
-- STEP 3: Remove old policies (only if they exist)
-- Run this AFTER the new policies are created
-- ==========================================
-- Uncomment and run these if you want to clean up old policies:
/*
DROP POLICY IF EXISTS "Users can upload output images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own output images" ON storage.objects;
*/

