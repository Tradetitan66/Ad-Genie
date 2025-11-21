/*
  # Create Storage for Brand Assets

  ## Storage Setup
  1. Create 'brand-assets' bucket for storing:
     - Brand logos
     - Product images (with background removed)
  
  2. Security
    - Enable RLS on storage.objects
    - Users can only upload to their own user_id folder
    - Users can read their own uploaded files
    - Public read access disabled for privacy
  
  ## Important Notes
  - Images will be organized by user_id in folder structure: brand-assets/{user_id}/
  - Product images will have background removed via edge function before upload
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);