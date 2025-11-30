/*
  # Create Storage for Output Images

  ## Storage Setup
  1. Create 'output-images' bucket for storing:
     - Generated campaign output images from webhook
     - Regenerated campaign images
  
  2. Security
    - Enable RLS on storage.objects
    - Users can only upload to their own user_id folder
    - Users can read their own uploaded files
    - Public read access disabled for privacy
  
  ## Important Notes
  - Images will be organized by user_id and campaign_id in folder structure: output-images/{user_id}/{campaign_id}/{filename}
  - Generated images from webhook are uploaded here after campaign generation
  - Regenerated images are also stored in this bucket
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'output-images',
  'output-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload to their own folder structure {userId}/{campaignId}/{filename}
CREATE POLICY "Users can upload output images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own output images
CREATE POLICY "Users can view own output images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own output images
CREATE POLICY "Users can update own output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own output images
CREATE POLICY "Users can delete own output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);













