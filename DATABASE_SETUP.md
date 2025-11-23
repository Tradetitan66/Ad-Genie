# Database Setup Guide

This guide explains how to set up the Supabase database and storage for the Ad-Genie application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Database Setup

### Step 1: Run Migrations

The SQL migration files are located in `supabase/migrations/`. Run them in order:

1. `001_create_users_table.sql` - Creates users table and triggers
2. `002_create_brands_table.sql` - Creates brands table
3. `003_create_product_images_table.sql` - Creates product_images table
4. `004_create_seasonal_suggestions_table.sql` - Creates seasonal_suggestions table
5. `005_create_user_preferences_table.sql` - Creates user_preferences table
6. `006_create_landing_page_submissions_table.sql` - Creates landing_page_submissions table

**To run migrations:**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content in order
4. Execute each migration

Alternatively, if you have Supabase CLI installed:
```bash
supabase db push
```

### Step 2: Create Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create two buckets:
   - **Bucket name:** `logos`
   - **Bucket name:** `product-images`
   - Both should be **Private** (not public)

### Step 3: Set Up Storage Policies

For each bucket (`logos` and `product-images`), create the following policies:

#### Policy 1: Users can upload to their own folder
- **Policy name:** "Users can upload to their own folder"
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```
(Replace `logos` with `product-images` for the product-images bucket)

#### Policy 2: Users can read from their own folder
- **Policy name:** "Users can read from their own folder"
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 3: Users can update their own files
- **Policy name:** "Users can update their own files"
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 4: Users can delete their own files
- **Policy name:** "Users can delete their own files"
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Note:** The folder structure is `{user_id}/{brand_id}/filename.ext`

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

## Verification

After setup, verify:

1. All tables are created (check in Table Editor)
2. RLS policies are enabled on all tables
3. Storage buckets exist and are private
4. Storage policies are set up correctly
5. The trigger `on_auth_user_created` is created and active

## Troubleshooting

### Issue: User profile not created on signup
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is created
- Check Supabase logs for errors

### Issue: Cannot upload files
- Verify storage buckets exist
- Check storage policies are set correctly
- Ensure user is authenticated
- Check file size limits (logos: 5MB, product images: 10MB)

### Issue: RLS policies blocking queries
- Verify user is authenticated (`auth.uid()` is not null)
- Check policy conditions match your use case
- Review Supabase logs for specific policy errors



