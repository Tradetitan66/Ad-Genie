# Storage Policy Fix for Output Images

## Problem Identified

The storage policies for the `output-images` bucket were blocking image access because:

1. **Policies use `auth.uid()`** - Requires Supabase Auth authentication
2. **App uses custom email-based auth** - Users are stored in custom `users` table, not Supabase Auth
3. **Result**: `auth.uid()` returns NULL, so all storage operations are blocked
4. **Symptom**: Images are uploaded successfully, but cannot be viewed when users log in again

## Solution

A new migration has been created: `supabase/migrations/20250124000000_fix_output_images_storage_policies.sql`

This migration:
- Makes the `output-images` bucket **public** (allows reading without auth)
- Updates policies to work with anon key (which counts as "authenticated" in Supabase)
- Removes dependency on `auth.uid()`

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250124000000_fix_output_images_storage_policies.sql`
4. Paste and run the SQL in the SQL Editor
5. Verify the bucket is now public:
   - Go to **Storage** → **output-images** bucket
   - Check that "Public bucket" is enabled

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI set up
supabase db push
```

### Option 3: Manual SQL Execution

Run this SQL in Supabase SQL Editor:

```sql
-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'output-images';

-- Drop old policies
DROP POLICY IF EXISTS "Users can upload output images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own output images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own output images" ON storage.objects;

-- Create new public read policy
CREATE POLICY "Public can read output images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'output-images');

-- Create new upload policy (works with anon key)
CREATE POLICY "Authenticated can upload output images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'output-images');

-- Create update policy
CREATE POLICY "Authenticated can update output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'output-images')
WITH CHECK (bucket_id = 'output-images');

-- Create delete policy
CREATE POLICY "Authenticated can delete output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'output-images');
```

## Verification

After applying the fix:

1. **Check bucket is public**:
   - Go to Storage → output-images
   - Should show "Public bucket: Yes"

2. **Test image loading**:
   - Log in to the app
   - Go to "My Campaigns"
   - Previously created campaigns should now show images
   - Check browser console for any errors

3. **Check console logs**:
   - Should see: `✅ CampaignService: Found X campaigns for user_id: ...`
   - Images should load without errors

## Security Considerations

- **Public bucket** means anyone with the exact URL can view the image
- **This is acceptable because**:
  - URLs contain UUIDs (hard to guess)
  - URLs are only exposed to logged-in users via the app
  - Folder structure provides obscurity: `{userId}/{campaignId}/{filename}`
  
- **For higher security** (if needed later):
  - Use signed URLs instead of public URLs
  - Requires code changes to generate signed URLs when displaying images
  - See Supabase docs: https://supabase.com/docs/guides/storage/serving/downloads

## What Changed

### Before:
- Bucket: Private
- Policies: Required `auth.uid()` (Supabase Auth)
- Result: Images blocked, cannot view

### After:
- Bucket: Public
- Policies: Work with anon key (custom auth)
- Result: Images accessible, can view when logged in





