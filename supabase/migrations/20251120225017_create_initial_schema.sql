/*
  # Initial Schema Setup for Campaign Genie

  ## Overview
  Creates the complete database schema for the Campaign Genie application, supporting user authentication,
  brand profiles, preferences, and campaign management.

  ## New Tables

  ### 1. users
  Extended user profile information
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique, not null) - User email address
  - `display_name` (text) - User's display name
  - `has_completed_onboarding` (boolean, default false) - Onboarding status
  - `created_at` (timestamptz, default now()) - Account creation timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ### 2. brand_profiles
  Stores brand information and visual assets
  - `id` (uuid, primary key) - Unique brand profile ID
  - `user_id` (uuid, foreign key) - References users table
  - `brand_name` (text, not null) - Name of the brand
  - `industry` (text, not null) - Industry category
  - `audience` (text) - Target audience description
  - `website_url` (text, not null) - Brand website URL
  - `contact_email` (text, not null) - Contact email
  - `logo` (text) - Base64 encoded logo image
  - `product_images` (jsonb, default '[]') - Array of base64 encoded product images
  - `brand_colors` (jsonb) - Brand color palette (primary, secondary, accent)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 3. preferences
  User preferences for campaign generation
  - `id` (uuid, primary key) - Unique preference ID
  - `user_id` (uuid, foreign key, unique) - References users table (one per user)
  - `campaign_goal` (text) - Campaign objective description
  - `brand_voice` (text) - Preferred brand voice/tone
  - `visual_styles` (jsonb, default '[]') - Array of selected visual styles
  - `campaign_timing` (text) - Preferred campaign frequency
  - `seasonal_events` (jsonb) - Selected seasonal events (local & international)
  - `enable_auto_suggestions` (boolean, default true) - Auto-suggestion preference
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 4. campaigns
  Generated campaign assets and metadata
  - `id` (uuid, primary key) - Unique campaign ID
  - `user_id` (uuid, foreign key) - References users table
  - `brand_profile_id` (uuid, foreign key) - References brand_profiles table
  - `content_type` (text, not null) - Type of content (image-only, ugc-only, image-ugc)
  - `status` (text, default 'generating') - Campaign status (generating, completed, failed)
  - `generated_assets` (jsonb, default '[]') - Array of generated asset URLs/data
  - `created_at` (timestamptz, default now())
  - `completed_at` (timestamptz) - When generation completed

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
  - INSERT, SELECT, UPDATE, DELETE policies for each table

  ## Notes
  - All tables use UUID primary keys for security
  - Timestamps track creation and updates
  - JSONB used for flexible nested data structures
  - Foreign keys ensure referential integrity
*/

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
  website_url text NOT NULL,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for brand_profiles table
CREATE POLICY "Users can view own brand profiles"
  ON brand_profiles FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can insert own brand profiles"
  ON brand_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can update own brand profiles"
  ON brand_profiles FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can delete own brand profiles"
  ON brand_profiles FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for preferences table
CREATE POLICY "Users can view own preferences"
  ON preferences FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can insert own preferences"
  ON preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can update own preferences"
  ON preferences FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can delete own preferences"
  ON preferences FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for campaigns table
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));