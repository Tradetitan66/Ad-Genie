# Complete Supabase Setup Guide for Ad-Genie

This guide will walk you through setting up Supabase for your Ad-Genie application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: Ad-Genie (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: Copy this (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this (starts with `eyJ...`)

## Step 3: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `supabase-setup.sql` (we'll create this file)
4. Click **"Run"** or press `Ctrl/Cmd + Enter`
5. Wait for all migrations to complete successfully

## Step 4: Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **"Create bucket"**
3. Create a bucket named: `brand-assets`
4. Set it to **Private** (not public)
5. Click **"Create bucket"**

The storage policies will be created automatically by the migration script.

## Step 5: Configure Environment Variables

1. Open your `.env` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. **Restart your development server** for changes to take effect

## Step 6: Verify Setup

After completing the setup:

1. **Check Tables**: Go to **Table Editor** in Supabase dashboard
   - You should see: `users`, `brand_profiles`, `preferences`, `campaigns`
   
2. **Check Storage**: Go to **Storage** → **brand-assets**
   - The bucket should exist and be private
   
3. **Test the App**: 
   - Restart your dev server: `npm run dev`
   - Try logging in - it should now use Supabase instead of localStorage
   - Check the browser console - you should see Supabase operations instead of warnings

## Troubleshooting

### Issue: "Failed to save" errors
- **Solution**: Check that your `.env` file has the correct credentials
- Make sure you restarted the dev server after updating `.env`
- Check Supabase dashboard → Logs for any errors

### Issue: Tables not created
- **Solution**: Make sure you ran all migrations in order
- Check SQL Editor → History to see if migrations ran successfully
- Try running migrations one by one if needed

### Issue: Storage upload fails
- **Solution**: Verify the `brand-assets` bucket exists
- Check Storage → Policies to ensure policies are created
- Make sure the bucket is set to Private

### Issue: RLS policies blocking queries
- **Solution**: The migrations include public access policies for development
- For production, you'll need to implement proper authentication
- Check Table Editor → Policies to see current policies

## Next Steps

Once Supabase is configured:
- ✅ All data will be stored in Supabase instead of localStorage
- ✅ User data persists across sessions
- ✅ Multiple users can use the app simultaneously
- ✅ You can view/manage data in Supabase dashboard

## Production Considerations

For production deployment:
1. Implement proper Supabase Auth (email/password or OAuth)
2. Update RLS policies to be more restrictive
3. Set up proper error handling and logging
4. Configure backup strategies
5. Monitor usage and performance in Supabase dashboard












