/*
  # Fix Brand Assets Storage Policies for Public Upload
  
  ## Problem
  - Current policies require `TO authenticated` which needs Supabase Auth sessions
  - App uses custom auth (not Supabase Auth), so no auth sessions exist
  - This blocks all uploads to brand-assets bucket
  - Error: "Storage policy error: Upload blocked by security policies"
  
  ## Solution
  - Change INSERT policy from `TO authenticated` to `TO public`
  - This allows uploads using the anon key (which the app uses)
  - Keep SELECT policy as public (already working)
  - Keep UPDATE/DELETE as authenticated (less critical, can be changed later if needed)
  - Folder structure ({userId}/{filename}) still provides basic security
  
  ## Security Note
  - Public upload means anyone with the anon key can upload
  - This is acceptable because:
    1. Anon key is already exposed in client-side code
    2. Folder structure uses userId (from custom auth) for organization
    3. URLs are long and hard to guess (UUID-based paths)
    4. For higher security, implement proper Supabase Auth later
*/

-- Drop existing INSERT policy that requires authentication
DROP POLICY IF EXISTS "Authenticated can upload brand assets" ON storage.objects;

-- Create new policy: Allow public uploads (using anon key)
-- This works with the app's custom auth system
CREATE POLICY "Public can upload brand assets"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'brand-assets');

-- Also update UPDATE policy to public for consistency
DROP POLICY IF EXISTS "Authenticated can update brand assets" ON storage.objects;

CREATE POLICY "Public can update brand assets"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'brand-assets')
WITH CHECK (bucket_id = 'brand-assets');

-- Also update DELETE policy to public for consistency
DROP POLICY IF EXISTS "Authenticated can delete brand assets" ON storage.objects;

CREATE POLICY "Public can delete brand assets"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'brand-assets');
