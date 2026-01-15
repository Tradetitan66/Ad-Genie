-- Migration: Add preferred_language field to brand_profiles table
-- This field stores the user's preferred language for campaign content

ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS preferred_language text;

-- Add comment to document the field
COMMENT ON COLUMN brand_profiles.preferred_language IS 'User preferred language for campaign content (English, Hindi, Telugu, Tamil)';
