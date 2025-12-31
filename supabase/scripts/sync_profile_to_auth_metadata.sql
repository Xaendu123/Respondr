-- ============================================================================
-- SYNC PROFILE TO AUTH METADATA TRIGGER
-- 
-- This trigger automatically updates auth.users.raw_user_meta_data when
-- profile fields (first_name, last_name, language) are updated in the
-- profiles table. This ensures email templates always have the latest data.
-- ============================================================================

-- Function to sync profile data to auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_current_metadata JSONB;
  v_new_metadata JSONB;
BEGIN
  -- Only proceed if relevant columns changed
  IF (TG_OP = 'UPDATE' AND 
      (OLD.first_name IS DISTINCT FROM NEW.first_name OR
       OLD.last_name IS DISTINCT FROM NEW.last_name OR
       OLD.language IS DISTINCT FROM NEW.language)) OR
     (TG_OP = 'INSERT') THEN
    
    -- Get current metadata from auth.users
    SELECT raw_user_meta_data INTO v_current_metadata
    FROM auth.users
    WHERE id = NEW.id;
    
    -- If no metadata exists, initialize as empty object
    IF v_current_metadata IS NULL THEN
      v_current_metadata := '{}'::JSONB;
    END IF;
    
    -- Build new metadata, preserving existing fields and updating relevant ones
    v_new_metadata := v_current_metadata;
    
    -- Update first_name if provided
    IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN
      v_new_metadata := v_new_metadata || jsonb_build_object('first_name', NEW.first_name);
    ELSE
      -- Remove first_name if it's null or empty
      v_new_metadata := v_new_metadata - 'first_name';
    END IF;
    
    -- Update last_name if provided
    IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN
      v_new_metadata := v_new_metadata || jsonb_build_object('last_name', NEW.last_name);
    ELSE
      -- Remove last_name if it's null or empty
      v_new_metadata := v_new_metadata - 'last_name';
    END IF;
    
    -- Always update language (it has a default, so it should always exist)
    IF NEW.language IS NOT NULL AND NEW.language != '' THEN
      v_new_metadata := v_new_metadata || jsonb_build_object('language', NEW.language);
    ELSE
      -- Default to 'en' if language is null or empty
      v_new_metadata := v_new_metadata || jsonb_build_object('language', 'en');
    END IF;
    
    -- Update auth.users.raw_user_meta_data
    -- Note: This requires SECURITY DEFINER to access auth schema
    UPDATE auth.users
    SET raw_user_meta_data = v_new_metadata
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_profile_to_auth_metadata ON public.profiles;

-- Create trigger
CREATE TRIGGER trigger_sync_profile_to_auth_metadata
  AFTER INSERT OR UPDATE OF first_name, last_name, language
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

-- Add comment
COMMENT ON FUNCTION public.sync_profile_to_auth_metadata() IS 
  'Automatically syncs profile first_name, last_name, and language to auth.users.raw_user_meta_data for email template access';

-- Backfill existing profiles
-- This ensures all existing users have language in their metadata
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::JSONB) || 
    jsonb_build_object(
      'language', COALESCE(
        (SELECT language FROM public.profiles WHERE profiles.id = auth.users.id),
        'en'
      ),
      'first_name', (SELECT first_name FROM public.profiles WHERE profiles.id = auth.users.id),
      'last_name', (SELECT last_name FROM public.profiles WHERE profiles.id = auth.users.id)
    )
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id)
  AND (
    -- Only update if language is missing or different
    NOT (raw_user_meta_data ? 'language') OR
    raw_user_meta_data->>'language' IS DISTINCT FROM 
      (SELECT language FROM public.profiles WHERE profiles.id = auth.users.id)::text OR
    -- Or if first_name/last_name are missing or different
    (raw_user_meta_data->>'first_name' IS DISTINCT FROM 
      (SELECT first_name FROM public.profiles WHERE profiles.id = auth.users.id)) OR
    (raw_user_meta_data->>'last_name' IS DISTINCT FROM 
      (SELECT last_name FROM public.profiles WHERE profiles.id = auth.users.id))
  );

