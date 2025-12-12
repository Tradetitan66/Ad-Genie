-- ==========================================
-- Complete Supabase Setup for Ad-Genie
-- Run this entire file in Supabase SQL Editor
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

-- Trigger for users table (create only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for brand_profiles table (create only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brand_profiles_updated_at') THEN
    CREATE TRIGGER update_brand_profiles_updated_at
      BEFORE UPDATE ON brand_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for preferences table (create only if doesn't exist)
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
-- Step 5: Enable Row Level Security
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Step 6: Create RLS Policies (Public Access for Development)
-- ==========================================

-- Create policies only if they don't exist (using exception handling)
DO $$
BEGIN
  -- Users table policies
  BEGIN
    CREATE POLICY "Public can insert users" ON users FOR INSERT TO public WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can select users" ON users FOR SELECT TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can update users" ON users FOR UPDATE TO public USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Brand profiles table policies
  BEGIN
    CREATE POLICY "Public can insert brand profiles" ON brand_profiles FOR INSERT TO public WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can select brand profiles" ON brand_profiles FOR SELECT TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can update brand profiles" ON brand_profiles FOR UPDATE TO public USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete brand profiles" ON brand_profiles FOR DELETE TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Preferences table policies
  BEGIN
    CREATE POLICY "Public can insert preferences" ON preferences FOR INSERT TO public WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can select preferences" ON preferences FOR SELECT TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can update preferences" ON preferences FOR UPDATE TO public USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete preferences" ON preferences FOR DELETE TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Campaigns table policies
  BEGIN
    CREATE POLICY "Public can insert campaigns" ON campaigns FOR INSERT TO public WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can select campaigns" ON campaigns FOR SELECT TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can update campaigns" ON campaigns FOR UPDATE TO public USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete campaigns" ON campaigns FOR DELETE TO public USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==========================================
-- Step 7: Create Storage Bucket
-- ==========================================

-- Create brand-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Step 8: Create Storage Policies
-- ==========================================

-- Storage policies for brand-assets bucket (create only if don't exist)
-- Note: These policies allow public access for development
-- For production, implement proper authentication

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Public can upload files"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'brand-assets');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can view files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'brand-assets');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can update files"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'brand-assets')
    WITH CHECK (bucket_id = 'brand-assets');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Public can delete files"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'brand-assets');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==========================================
-- Setup Complete!
-- ==========================================

-- Verify tables were created
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('users', 'brand_profiles', 'preferences', 'campaigns');
  
  RAISE NOTICE 'Setup complete! Created % tables.', table_count;
END $$;

