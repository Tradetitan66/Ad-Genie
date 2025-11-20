/*
  # Simplify RLS for Development/Testing

  1. Changes
    - Make users table accessible for basic CRUD operations
    - Allow public access since we're using email-based authentication
    - This is suitable for development/MVP stage
  
  2. Security Note
    - For production, implement proper Supabase Auth
    - These policies allow basic operations for testing
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow public to insert users (for registration)
CREATE POLICY "Public can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to select users by email (for login lookup)
CREATE POLICY "Public can select users"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow public to update users
CREATE POLICY "Public can update users"
  ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Similar policies for brand_profiles
DROP POLICY IF EXISTS "Users can manage own brand profiles" ON brand_profiles;

CREATE POLICY "Public can insert brand profiles"
  ON brand_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can select brand profiles"
  ON brand_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update brand profiles"
  ON brand_profiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete brand profiles"
  ON brand_profiles
  FOR DELETE
  TO public
  USING (true);

-- Similar policies for preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON preferences;

CREATE POLICY "Public can insert preferences"
  ON preferences
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can select preferences"
  ON preferences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update preferences"
  ON preferences
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete preferences"
  ON preferences
  FOR DELETE
  TO public
  USING (true);

-- Similar policies for campaigns
DROP POLICY IF EXISTS "Users can manage own campaigns" ON campaigns;

CREATE POLICY "Public can insert campaigns"
  ON campaigns
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can select campaigns"
  ON campaigns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update campaigns"
  ON campaigns
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete campaigns"
  ON campaigns
  FOR DELETE
  TO public
  USING (true);
