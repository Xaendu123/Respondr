-- ============================================================================
-- Migration: Add show_full_name setting to profiles
-- ============================================================================
-- This migration adds a show_full_name boolean column to the profiles table
-- and automatically updates display_name based on this setting:
-- - show_full_name = true: "FirstName LastName" (e.g., "Alexandre Bugnon")
-- - show_full_name = false: "FirstName LastInitial." (e.g., "Alexandre B.")
-- ============================================================================

-- Add show_full_name column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN NOT NULL DEFAULT true;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_profiles_show_full_name ON profiles(show_full_name);

-- Function to calculate display_name based on show_full_name setting
CREATE OR REPLACE FUNCTION calculate_display_name(
  p_first_name TEXT,
  p_last_name TEXT,
  p_show_full_name BOOLEAN,
  p_current_display_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- If both first_name and last_name are provided
  IF p_first_name IS NOT NULL AND p_first_name != '' AND 
     p_last_name IS NOT NULL AND p_last_name != '' THEN
    IF p_show_full_name THEN
      -- Full name: "FirstName LastName"
      v_display_name := TRIM(p_first_name || ' ' || p_last_name);
    ELSE
      -- Abbreviated: "FirstName LastInitial."
      v_display_name := TRIM(p_first_name || ' ' || UPPER(SUBSTRING(p_last_name, 1, 1)) || '.');
    END IF;
  -- If only first_name is provided
  ELSIF p_first_name IS NOT NULL AND p_first_name != '' THEN
    v_display_name := p_first_name;
  -- If only last_name is provided
  ELSIF p_last_name IS NOT NULL AND p_last_name != '' THEN
    IF p_show_full_name THEN
      v_display_name := p_last_name;
    ELSE
      v_display_name := UPPER(SUBSTRING(p_last_name, 1, 1)) || '.';
    END IF;
  -- Fallback to current display_name or email
  ELSE
    v_display_name := COALESCE(p_current_display_name, 'User');
  END IF;
  
  RETURN v_display_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update display_name when show_full_name, first_name, or last_name changes
CREATE OR REPLACE FUNCTION update_display_name_from_name_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if show_full_name, first_name, or last_name changed
  IF (TG_OP = 'UPDATE' AND 
      (OLD.show_full_name IS DISTINCT FROM NEW.show_full_name OR
       OLD.first_name IS DISTINCT FROM NEW.first_name OR
       OLD.last_name IS DISTINCT FROM NEW.last_name)) OR
     (TG_OP = 'INSERT') THEN
    
    NEW.display_name := calculate_display_name(
      NEW.first_name,
      NEW.last_name,
      NEW.show_full_name,
      NEW.display_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update display_name
DROP TRIGGER IF EXISTS trigger_update_display_name_from_name_fields ON profiles;
CREATE TRIGGER trigger_update_display_name_from_name_fields
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_display_name_from_name_fields();

-- Update handle_new_user() function to set show_full_name and calculate display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_display_name TEXT;
BEGIN
  -- Extract first_name and last_name from metadata
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Calculate display_name based on show_full_name = true (default)
  v_display_name := calculate_display_name(
    v_first_name,
    v_last_name,
    true, -- show_full_name defaults to true
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name,
    first_name,
    last_name,
    show_full_name,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_first_name,
    v_last_name,
    true, -- Default to showing full name
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to have show_full_name = true and recalculate display_name
-- This ensures all existing users have the setting and correct display_name
UPDATE profiles
SET 
  show_full_name = COALESCE(show_full_name, true),
  display_name = calculate_display_name(
    first_name,
    last_name,
    COALESCE(show_full_name, true),
    display_name
  )
WHERE show_full_name IS NULL OR 
      (first_name IS NOT NULL AND last_name IS NOT NULL AND 
       display_name != calculate_display_name(first_name, last_name, COALESCE(show_full_name, true), display_name));

-- Add comment to the column
COMMENT ON COLUMN profiles.show_full_name IS 'If true, display_name shows full name (FirstName LastName). If false, shows abbreviated (FirstName LastInitial.)';

