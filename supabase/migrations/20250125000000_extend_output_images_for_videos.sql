/*
  # Extend Output Images Bucket for Videos

  ## Changes
  1. Update 'output-images' bucket to support video MIME types:
     - Add video/mp4, video/webm, video/quicktime
     - Increase file_size_limit from 10MB to 100MB (videos are larger than images)
  
  2. Keep existing structure
    - Same folder structure: output-images/{user_id}/{campaign_id}/{filename}
    - Same RLS policies (already public bucket with public read access)
    - Videos will be stored alongside images in the same bucket

  ## Important Notes
  - Videos from RunwayML/N8N will be uploaded to the same bucket as images
  - File size limit increased to accommodate larger video files
  - Existing image functionality remains unchanged
*/

-- Update bucket to support video MIME types and increase file size limit
UPDATE storage.buckets
SET 
  file_size_limit = 104857600, -- 100MB (increased from 10MB)
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
WHERE id = 'output-images';

