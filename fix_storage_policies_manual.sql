-- ==========================================
-- MANUAL FIX: Run these one at a time
-- ==========================================

-- STEP 1: Make bucket public (SAFE - no data loss)
UPDATE storage.buckets
SET public = true
WHERE id = 'output-images';

-- STEP 2: Create new read policy (run this first, ignore error if policy exists)
CREATE POLICY "Public can read output images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'output-images');

-- STEP 3: Create upload policy
CREATE POLICY "Authenticated can upload output images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'output-images');

-- STEP 4: Create update policy
CREATE POLICY "Authenticated can update output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'output-images')
WITH CHECK (bucket_id = 'output-images');

-- STEP 5: Create delete policy
CREATE POLICY "Authenticated can delete output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'output-images');

-- STEP 6: (Optional) Remove old policies via Supabase Dashboard
-- Go to: Storage → output-images → Policies tab
-- Manually delete the old policies that use auth.uid()





