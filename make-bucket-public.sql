-- SQL script to make brand-assets bucket public
-- Run this in Supabase SQL Editor

UPDATE storage.buckets 
SET public = true 
WHERE name = 'brand-assets';

-- Verify the change
SELECT name, public, created_at 
FROM storage.buckets 
WHERE name = 'brand-assets';





