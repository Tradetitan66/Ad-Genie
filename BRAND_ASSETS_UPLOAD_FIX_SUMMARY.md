# Brand Assets Storage Upload Fix Summary

## Problem Fixed
Input images (logos, product images) were not being stored in the `brand-assets` bucket. Previously uploaded images existed, but new uploads were failing silently.

## Root Cause
The `brand-assets` bucket had the same issue as `output-images`:
- Storage policies used `auth.uid()` which requires Supabase Auth
- App uses custom email-based auth, so `auth.uid()` is NULL
- All uploads were blocked by RLS policies

## Changes Made

### 1. Created Migration (`supabase/migrations/20250124000001_fix_brand_assets_storage_policies.sql`)
- ✅ Makes `brand-assets` bucket public (allows reading without auth)
- ✅ Removes old policies that require `auth.uid()`
- ✅ Creates new policies that work with anon key
- ✅ Allows authenticated users (anon key) to upload/update/delete

### 2. Enhanced Error Logging (`src/services/imageService.ts`)
- ✅ Added detailed error logging for upload failures
- ✅ Logs include error details, status codes, and context
- ✅ Specific error messages for RLS policy errors
- ✅ Specific error messages for file size errors
- ✅ Verifies generated URL is actually a Supabase URL
- ✅ Better error messages for users

## How to Apply the Fix

### Step 1: Run the Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20250124000001_fix_brand_assets_storage_policies.sql`
3. Paste and execute the SQL
4. Verify: Go to Storage → `brand-assets` bucket → should show "Public bucket: Yes"

### Step 2: Test Uploads
1. Go to Visual Assets page (onboarding or settings)
2. Upload a logo or product image
3. Check browser console for upload logs
4. Verify image appears in Supabase Storage → `brand-assets` bucket

## Expected Behavior

### Before Fix:
- Uploads silently failed
- Images not stored in Supabase
- URLs might be stored but point to non-existent files
- No clear error messages

### After Fix:
- Uploads succeed and images stored in `brand-assets/{userId}/{filename}`
- Detailed console logs show upload progress
- Clear error messages if upload fails
- URLs point to Supabase Storage

## Console Logs to Watch For

### Success Logs:
- `📤 Uploading to Supabase storage bucket: {bucket, path, ...}`
- `✅ File uploaded successfully to Supabase: {path}`
- `🔗 Public URL generated: https://...supabase.co/storage/...`

### Error Logs (if any):
- `❌ Supabase storage upload error details: {...}` - Shows upload failure
- `🚫 RLS Policy Error: Storage policies are blocking upload` - Policy issue
- `💡 Solution: Run migration 20250124000001_fix_brand_assets_storage_policies.sql` - Helpful hint

## Storage Structure

```
brand-assets/
  └── {userId}/
      ├── logo-{timestamp}-{filename}
      ├── logo-processed-{timestamp}.png
      ├── product-{timestamp}-{filename}
      └── product-processed-{timestamp}.png
```

## Verification

After applying the fix and uploading an image:

1. **Check Supabase Storage**:
   - Go to Storage → `brand-assets` bucket
   - Navigate to `{userId}/` folder
   - Should see uploaded image files

2. **Check Database**:
   - Go to Table Editor → `brand_profiles` table
   - Find user's brand profile
   - Check `logo` and `product_images` fields
   - URLs should start with `https://your-project.supabase.co/storage/v1/object/public/brand-assets/...`

3. **Check Console**:
   - Should see success logs
   - No error messages
   - Public URL generated successfully

## Related Fixes

This fix is similar to the `output-images` bucket fix:
- Both buckets had the same `auth.uid()` policy issue
- Both now use public buckets with anon key policies
- Both have improved error logging

## Security Note

- **Public bucket** means anyone with the exact URL can view the image
- **This is acceptable because**:
  - URLs contain UUIDs (hard to guess)
  - URLs are only exposed to logged-in users via the app
  - Folder structure provides obscurity: `{userId}/{filename}`
  
- **For higher security** (if needed later):
  - Use signed URLs instead of public URLs
  - Requires code changes to generate signed URLs when displaying images

