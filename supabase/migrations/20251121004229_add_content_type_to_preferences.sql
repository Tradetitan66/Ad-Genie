/*
  # Add content type to preferences

  1. Changes
    - Add `content_type` column to preferences table
    - Stores user's choice: 'image-only', 'ugc-only', or 'image-ugc'
    - Default is NULL (not yet selected)
  
  2. Notes
    - This allows users to save their preferred content generation type
    - Used to determine what content to generate in campaigns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'preferences' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE preferences ADD COLUMN content_type text;
  END IF;
END $$;