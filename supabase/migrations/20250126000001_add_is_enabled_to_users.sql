/*
  # Add is_enabled Column to Users Table
  
  ## Overview
  - Add `is_enabled` boolean column to users table
  - Default to `true` for existing users (so they can continue using the app)
  - Default to `false` for new users (admin must enable them)
  - Allows admin to control who can access the application
*/

-- Add is_enabled column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false;

-- Set existing users to enabled (so they can continue using the app)
UPDATE users 
SET is_enabled = true 
WHERE is_enabled IS NULL;

-- Create index for performance when filtering by is_enabled
CREATE INDEX IF NOT EXISTS idx_users_is_enabled ON users(is_enabled) WHERE is_enabled = true;
