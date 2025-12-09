/*
  # Add 100 Magic Tokens to All Users
  
  ## Overview
  - Adds 100 tokens to all existing users in the database
  - Creates a transaction record for each user to track the addition
  - Safe to run multiple times (uses COALESCE to handle NULL tokens)
*/

-- Add 100 tokens to all users
UPDATE users 
SET tokens = COALESCE(tokens, 0) + 100
WHERE id IS NOT NULL;

-- Create transaction records for the token addition
-- This tracks that 100 tokens were added to each user
-- Only insert if a transaction with this description doesn't already exist for today
INSERT INTO token_transactions (user_id, amount, type, campaign_id, description)
SELECT 
  id,
  100, -- Positive amount for addition
  'welcome', -- Using 'welcome' type for bonus tokens
  NULL, -- No campaign associated
  'Bonus: 100 Magic Tokens added'
FROM users
WHERE id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM token_transactions 
    WHERE token_transactions.user_id = users.id 
      AND token_transactions.description = 'Bonus: 100 Magic Tokens added'
      AND token_transactions.created_at::date = CURRENT_DATE
  );

-- Log summary
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  RAISE NOTICE 'Added 100 Magic Tokens to % users', user_count;
END $$;

