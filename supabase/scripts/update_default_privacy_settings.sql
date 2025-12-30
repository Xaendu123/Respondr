-- Migration: Update default privacy settings for new users
-- Changes:
-- - profile_visibility: 'unit' -> 'public'
-- - activity_visibility: 'unit' -> 'public'
-- - marketing_consent: false -> true
--
-- Note: This only changes the DEFAULT values for NEW rows.
-- Existing users will keep their current settings unless explicitly changed.

-- Update default for profile_visibility
ALTER TABLE profiles 
  ALTER COLUMN profile_visibility SET DEFAULT 'public';

-- Update default for activity_visibility
ALTER TABLE profiles 
  ALTER COLUMN activity_visibility SET DEFAULT 'public';

-- Update default for marketing_consent
ALTER TABLE profiles 
  ALTER COLUMN marketing_consent SET DEFAULT true;

-- Verify the changes
SELECT 
  column_name, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('profile_visibility', 'activity_visibility', 'marketing_consent');




