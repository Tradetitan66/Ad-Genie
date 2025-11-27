-- ==========================================
-- Supabase Setup Script for Collaborators
-- This script works even if you don't have owner permissions
-- ==========================================

-- ==========================================
-- Step 1: Create Tables
-- ==========================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  industry text NOT NULL,
  audience text,
  website_url text,
  contact_email text NOT NULL,
  logo text,
  product_images jsonb DEFAULT '[]'::jsonb,
  brand_colors jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_goal text,
  brand_voice text,
  visual_styles jsonb DEFAULT '[]'::jsonb,
  campaign_timing text,
  seasonal_events jsonb,
  enable_auto_suggestions boolean DEFAULT true,
  content_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  status text DEFAULT 'generating',
  generated_assets jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ==========================================
-- Step 2: Create Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================
-- Step 3: Create Functions
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Step 4: Create Triggers
-- ==========================================

-- Trigger for users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for brand_profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brand_profiles_updated_at') THEN
    CREATE TRIGGER update_brand_profiles_updated_at
      BEFORE UPDATE ON brand_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for preferences table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_preferences_updated_at') THEN
    CREATE TRIGGER update_preferences_updated_at
      BEFORE UPDATE ON preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ==========================================
-- Step 5: Enable Row Level Security (RLS)
-- ==========================================
-- Note: This may fail if you don't have owner permissions
-- The script will continue even if RLS can't be enabled

DO $$
BEGIN
  -- Try to enable RLS, but don't fail if permission denied
  BEGIN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on users table';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot enable RLS on users: Insufficient privileges (collaborator mode)';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable RLS on users: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on brand_profiles table';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot enable RLS on brand_profiles: Insufficient privileges (collaborator mode)';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable RLS on brand_profiles: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on preferences table';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot enable RLS on preferences: Insufficient privileges (collaborator mode)';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable RLS on preferences: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on campaigns table';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot enable RLS on campaigns: Insufficient privileges (collaborator mode)';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable RLS on campaigns: %', SQLERRM;
  END;
END $$;

-- ==========================================
-- Step 6: Create RLS Policies
-- ==========================================
-- Note: These will only work if RLS is enabled
-- If RLS is not enabled, tables will be accessible without policies

DO $$
BEGIN
  -- Users table policies
  BEGIN
    CREATE POLICY "Public can insert users" ON users FOR INSERT TO public WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can insert users';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can insert users';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can select users" ON users FOR SELECT TO public USING (true);
    RAISE NOTICE 'Created policy: Public can select users';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can select users';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can update users" ON users FOR UPDATE TO public USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can update users';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can update users';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;

  -- Brand profiles table policies
  BEGIN
    CREATE POLICY "Public can insert brand profiles" ON brand_profiles FOR INSERT TO public WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can insert brand profiles';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can insert brand profiles';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can select brand profiles" ON brand_profiles FOR SELECT TO public USING (true);
    RAISE NOTICE 'Created policy: Public can select brand profiles';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can select brand profiles';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can update brand profiles" ON brand_profiles FOR UPDATE TO public USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can update brand profiles';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can update brand profiles';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete brand profiles" ON brand_profiles FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created policy: Public can delete brand profiles';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can delete brand profiles';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;

  -- Preferences table policies
  BEGIN
    CREATE POLICY "Public can insert preferences" ON preferences FOR INSERT TO public WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can insert preferences';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can insert preferences';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can select preferences" ON preferences FOR SELECT TO public USING (true);
    RAISE NOTICE 'Created policy: Public can select preferences';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can select preferences';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can update preferences" ON preferences FOR UPDATE TO public USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can update preferences';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can update preferences';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete preferences" ON preferences FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created policy: Public can delete preferences';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can delete preferences';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;

  -- Campaigns table policies
  BEGIN
    CREATE POLICY "Public can insert campaigns" ON campaigns FOR INSERT TO public WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can insert campaigns';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can insert campaigns';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can select campaigns" ON campaigns FOR SELECT TO public USING (true);
    RAISE NOTICE 'Created policy: Public can select campaigns';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can select campaigns';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can update campaigns" ON campaigns FOR UPDATE TO public USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created policy: Public can update campaigns';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can update campaigns';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete campaigns" ON campaigns FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created policy: Public can delete campaigns';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy already exists: Public can delete campaigns';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policy: %', SQLERRM;
  END;
END $$;

-- ==========================================
-- Step 7: Create Storage Bucket
-- ==========================================
-- Note: Storage bucket creation requires owner permissions
-- If this fails, ask the project owner to create it

DO $$
BEGIN
  BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'brand-assets',
      'brand-assets',
      false,
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Storage bucket brand-assets created successfully';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create storage bucket: Insufficient privileges. Please ask project owner to create brand-assets bucket in Storage settings.';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage bucket: %', SQLERRM;
  END;
END $$;

-- ==========================================
-- Step 8: Create Storage Policies
-- ==========================================
-- Note: These will only work if you have permissions

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Public can upload files"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'brand-assets');
    RAISE NOTICE 'Created storage policy: Public can upload files';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Storage policy already exists: Public can upload files';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create storage policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can view files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'brand-assets');
    RAISE NOTICE 'Created storage policy: Public can view files';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Storage policy already exists: Public can view files';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create storage policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can update files"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'brand-assets')
    WITH CHECK (bucket_id = 'brand-assets');
    RAISE NOTICE 'Created storage policy: Public can update files';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Storage policy already exists: Public can update files';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create storage policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage policy: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete files"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'brand-assets');
    RAISE NOTICE 'Created storage policy: Public can delete files';
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Storage policy already exists: Public can delete files';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create storage policy: Insufficient privileges (collaborator mode)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage policy: %', SQLERRM;
  END;
END $$;

-- ==========================================
-- Setup Summary
-- ==========================================

DO $$
DECLARE
  table_count integer;
  rls_enabled_count integer;
BEGIN
  -- Count created tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('users', 'brand_profiles', 'preferences', 'campaigns');
  
  -- Check RLS status
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'brand_profiles', 'preferences', 'campaigns')
  AND rowsecurity = true;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Setup Summary:';
  RAISE NOTICE '  Tables created: %', table_count;
  RAISE NOTICE '  Tables with RLS enabled: %', rls_enabled_count;
  RAISE NOTICE '==========================================';
  
  IF rls_enabled_count < table_count THEN
    RAISE NOTICE '⚠️  RLS is not fully enabled. This is normal for collaborators.';
    RAISE NOTICE '   Tables will work without RLS, but ask the project owner to enable RLS for production.';
  END IF;
END $$;













