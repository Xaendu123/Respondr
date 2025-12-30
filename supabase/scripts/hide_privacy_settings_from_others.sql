-- Migration: Hide privacy settings from other users
-- Privacy settings should only be visible to the profile owner
-- This uses a SECURITY DEFINER function to mask privacy columns

-- Create a function that returns profiles with privacy settings only for owner
CREATE OR REPLACE FUNCTION get_profile_safe(profile_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  is_owner BOOLEAN;
BEGIN
  -- Check if the requesting user is the profile owner
  is_owner := (profile_id = auth.uid());
  
  -- Build result based on ownership
  IF is_owner THEN
    -- Return all columns including privacy settings for owner
    SELECT to_jsonb(p.*)
    INTO result
    FROM profiles p
    WHERE p.id = profile_id
      AND p.is_active = true 
      AND p.deleted_at IS NULL;
  ELSE
    -- Return only public columns, excluding privacy settings
    SELECT jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'display_name', p.display_name,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'avatar', p.avatar,
      'bio', p.bio,
      'organization', p.organization,
      'rank', p.rank,
      'location', p.location,
      'unit_id', p.unit_id,
      'role', p.role,
      'is_active', p.is_active,
      'is_verified', p.is_verified,
      'last_seen_at', p.last_seen_at,
      'created_at', p.created_at,
      'updated_at', p.updated_at
      -- Explicitly EXCLUDE: profile_visibility, activity_visibility, 
      -- show_statistics, show_location, marketing_consent, data_processing_consent
    )
    INTO result
    FROM profiles p
    WHERE p.id = profile_id
      AND p.is_active = true 
      AND p.deleted_at IS NULL
      AND (
        -- Public profiles visible to everyone
        p.profile_visibility = 'public'
        OR
        -- Unit profiles visible to unit members
        (p.profile_visibility = 'unit' AND p.unit_id IN (
          SELECT unit_id FROM profiles WHERE id = auth.uid()
        ))
      );
  END IF;
  
  RETURN result;
END;
$$;

-- Create a view that excludes privacy settings for public viewing
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  email,
  display_name,
  first_name,
  last_name,
  avatar,
  bio,
  organization,
  rank,
  location,
  unit_id,
  role,
  is_active,
  is_verified,
  last_seen_at,
  created_at,
  updated_at
  -- Explicitly EXCLUDE all privacy settings
FROM profiles
WHERE is_active = true AND deleted_at IS NULL;

-- Grant access
GRANT SELECT ON public_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_safe(UUID) TO authenticated;

-- Add comments
COMMENT ON VIEW public_profiles IS 'Public profile view that excludes all privacy settings. Use this for viewing other users profiles.';
COMMENT ON FUNCTION get_profile_safe(UUID) IS 'Returns profile data as JSONB with privacy settings only visible to the profile owner. Returns NULL for privacy columns when viewing others.';
