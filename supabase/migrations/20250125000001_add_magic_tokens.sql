/*
  # Add Magic Tokens System
  
  ## Overview
  - Add tokens column to users table (default 20 welcome tokens)
  - Create token_transactions table to track all token usage
  - Track token costs: 1 token per image, 2 tokens per campaign generation, 5 tokens per video
  - Test mode: track but don't restrict usage
*/

-- Add tokens column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 20;

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  type text NOT NULL, -- 'welcome', 'campaign_generation', 'image', 'video'
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_campaign_id ON token_transactions(campaign_id);

-- Initialize tokens for existing users who don't have tokens set
UPDATE users 
SET tokens = 20 
WHERE tokens IS NULL;

