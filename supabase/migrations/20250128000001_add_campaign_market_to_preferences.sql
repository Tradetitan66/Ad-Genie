-- Add campaign_market column to preferences table
-- This column stores the target market for campaigns (e.g., 'Local (India)', 'International')

ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS campaign_market text;

-- Add comment for documentation
COMMENT ON COLUMN preferences.campaign_market IS 'Target market for the campaign (e.g., Local (India), International)';
