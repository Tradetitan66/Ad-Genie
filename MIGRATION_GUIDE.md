# Supabase Migration Guide

This guide will walk you through migrating the database schema to your Supabase project.

## Method 1: Using Supabase Dashboard (Recommended for Beginners)

### Step 1: Access SQL Editor
1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run Migrations in Order
Run each migration file **in order** (001 through 006):

1. **Migration 001** - Users Table
   - Open `supabase/migrations/001_create_users_table.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Verify success message appears

2. **Migration 002** - Brands Table
   - Open `supabase/migrations/002_create_brands_table.sql`
   - Copy and paste into SQL Editor
   - Click **Run**

3. **Migration 003** - Product Images Table
   - Open `supabase/migrations/003_create_product_images_table.sql`
   - Copy and paste into SQL Editor
   - Click **Run**

4. **Migration 004** - Seasonal Suggestions Table
   - Open `supabase/migrations/004_create_seasonal_suggestions_table.sql`
   - Copy and paste into SQL Editor
   - Click **Run**

5. **Migration 005** - User Preferences Table
   - Open `supabase/migrations/005_create_user_preferences_table.sql`
   - Copy and paste into SQL Editor
   - Click **Run**

6. **Migration 006** - Landing Page Submissions Table
   - Open `supabase/migrations/006_create_landing_page_submissions_table.sql`
   - Copy and paste into SQL Editor
   - Click **Run**

### Step 3: Verify Tables Created
1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `brands`
   - `product_images`
   - `seasonal_suggestions`
   - `user_preferences`
   - `landing_page_submissions`

### Step 4: Set Up Storage Buckets

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Create bucket: `logos`
   - Name: `logos`
   - Public bucket: **Unchecked** (Private)
   - Click **Create bucket**
4. Create bucket: `product-images`
   - Name: `product-images`
   - Public bucket: **Unchecked** (Private)
   - Click **Create bucket**

### Step 5: Set Up Storage Policies

For each bucket (`logos` and `product-images`):

1. Click on the bucket name
2. Go to **Policies** tab
3. Click **New Policy**
4. Create these 4 policies for each bucket:

#### Policy 1: Users can upload to their own folder
- **Policy name:** Users can upload to their own folder
- **Allowed operation:** INSERT
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```
(Replace `logos` with `product-images` for the product-images bucket)

#### Policy 2: Users can read from their own folder
- **Policy name:** Users can read from their own folder
- **Allowed operation:** SELECT
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 3: Users can update their own files
- **Policy name:** Users can update their own files
- **Allowed operation:** UPDATE
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 4: Users can delete their own files
- **Policy name:** Users can delete their own files
- **Allowed operation:** DELETE
- **Policy definition:**
```sql
(bucket_id = 'logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Note:** Repeat these 4 policies for the `product-images` bucket (replace `logos` with `product-images` in the policy definition).

---

## Method 2: Using Supabase CLI (Advanced)

### Prerequisites
- Node.js installed
- Supabase CLI installed

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref your-project-ref
```
(Find your project ref in your Supabase project settings)

### Step 4: Run Migrations
```bash
supabase db push
```

This will run all migrations in the `supabase/migrations/` folder.

### Step 5: Set Up Storage (Still need to do manually)
Storage buckets and policies still need to be set up via the Dashboard as described in Method 1.

---

## Quick Verification Checklist

After migration, verify:

- [ ] All 6 tables exist in Table Editor
- [ ] RLS is enabled on all tables (check in Table Editor → table → Settings)
- [ ] `logos` bucket exists and is private
- [ ] `product-images` bucket exists and is private
- [ ] Storage policies are set for both buckets (4 policies each)
- [ ] Trigger `on_auth_user_created` exists (check in Database → Functions)
- [ ] Function `handle_new_user` exists (check in Database → Functions)

---

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists
- You can either:
  - Drop the table and re-run the migration
  - Skip that migration and continue with the next one

### Error: "permission denied"
- Make sure you're running migrations as the project owner
- Check that RLS policies allow your operations

### Storage upload fails
- Verify storage buckets exist
- Check storage policies are correctly set
- Ensure user is authenticated (`auth.uid()` is not null)
- Check file size limits (logos: 5MB, product images: 10MB)

### User profile not created on signup
- Check that trigger `on_auth_user_created` exists
- Verify function `handle_new_user` is created
- Check Supabase logs for errors

---

## Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify all migrations ran successfully
3. Check that RLS policies are enabled
4. Ensure storage buckets and policies are set up correctly



