/*
  # Fix RLS Policies for User Registration

  1. Changes
    - Drop existing restrictive policies on users table
    - Add policy to allow anyone to insert a new user (for registration)
    - Add policy to allow users to read their own data
    - Add policy to allow users to update their own data
  
  2. Security
    - Users can only read/update their own records (based on email)
    - Anyone can create a new user record (required for registration)
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Allow anyone to insert a new user (required for registration/login)
CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');
