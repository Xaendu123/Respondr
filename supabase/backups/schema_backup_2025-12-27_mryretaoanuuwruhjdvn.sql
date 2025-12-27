-- ============================================================================
-- RESPONDR DATABASE SCHEMA BACKUP
-- Generated: 2025-12-27 11:37:26 UTC
-- Source Project: mryretaoanuuwruhjdvn (eu-west-1)
-- Target Project: nbdmoapoiqxyjrrhzqvg (eu-central-2)
-- ============================================================================
-- 
-- This file contains the complete database schema including:
-- - Extensions
-- - Custom types/enums
-- - Tables (with all constraints)
-- - Functions
-- - Triggers
-- - Indexes
-- - Views
-- - RLS Policies
-- - Storage buckets and policies
-- 
-- To restore: Run this file in order on the new database
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- PART 2: CUSTOM TYPES / ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('training', 'exercise', 'operation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_visibility AS ENUM ('private', 'unit', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM ('respect', 'strong', 'teamwork', 'impressive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'leader', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE badge_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('activity_reaction', 'activity_comment', 'badge_earned', 'streak_milestone', 'unit_announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM ('public', 'unit', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PART 3: TABLES
-- ============================================================================

-- Units table (fire departments, rescue organizations)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT, -- 'fire', 'ems', 'rescue', 'civil', 'other'
  avatar TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users with privacy controls)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL CHECK (TRIM(BOTH FROM display_name) <> ''),
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  bio TEXT,
  organization TEXT,
  rank TEXT, -- Funktionsgrad
  location TEXT,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'member',
  
  -- Privacy settings
  profile_visibility privacy_level NOT NULL DEFAULT 'unit',
  activity_visibility privacy_level NOT NULL DEFAULT 'unit',
  show_statistics BOOLEAN NOT NULL DEFAULT true,
  show_location BOOLEAN NOT NULL DEFAULT false,
  
  -- Preferences
  language TEXT NOT NULL DEFAULT 'de',
  theme TEXT NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  
  -- OAuth providers
  auth_provider TEXT, -- 'email', 'google', 'apple'
  provider_id TEXT,
  
  -- Account status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  
  -- GDPR compliance
  data_processing_consent BOOLEAN NOT NULL DEFAULT true,
  data_processing_consent_date TIMESTAMPTZ,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for GDPR
);

COMMENT ON TABLE profiles IS 'User profiles with comprehensive privacy settings and GDPR compliance';

-- Activities table with enhanced privacy
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  date TIMESTAMPTZ NOT NULL,
  
  -- Location data (optional, respects privacy)
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Visibility and sharing
  visibility activity_visibility NOT NULL DEFAULT 'unit',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  tags TEXT[],
  images TEXT[], -- Storage URLs
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

COMMENT ON TABLE activities IS 'User activities with soft delete and visibility controls';

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- Comments table with moderation support
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Badges definition table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  level badge_level NOT NULL,
  criteria JSONB NOT NULL, -- Flexible criteria definition
  points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE badges IS 'Achievement badges that users can earn';

-- User badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

COMMENT ON TABLE user_badges IS 'Badges earned by users';

-- Streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE user_streaks IS 'Activity streak tracking for gamification';

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (e.g., activity_id, badge_id)
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'In-app notification system';

-- User follows/connections
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Unit memberships (for multi-unit support)
CREATE TABLE IF NOT EXISTS unit_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, unit_id)
);

-- Data deletion requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE data_deletion_requests IS 'GDPR right to be forgotten requests';

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Audit trail for GDPR compliance and security';

-- ============================================================================
-- PART 4: INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_unit_id_idx ON profiles(unit_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Activities indexes
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_unit_id_idx ON activities(unit_id);
CREATE INDEX IF NOT EXISTS activities_date_idx ON activities(date DESC);
CREATE INDEX IF NOT EXISTS activities_type_idx ON activities(type);
CREATE INDEX IF NOT EXISTS activities_visibility_idx ON activities(visibility);
CREATE INDEX IF NOT EXISTS activities_deleted_at_idx ON activities(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS activities_full_text_idx ON activities USING gin(to_tsvector('german', title || ' ' || COALESCE(description, '')));

-- Reactions & Comments indexes
CREATE INDEX IF NOT EXISTS reactions_activity_id_idx ON reactions(activity_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON reactions(user_id);
CREATE INDEX IF NOT EXISTS comments_activity_id_idx ON comments(activity_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_deleted_at_idx ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Badges & Streaks indexes
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS user_streaks_user_id_idx ON user_streaks(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Social indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS unit_memberships_user_id_idx ON unit_memberships(user_id);
CREATE INDEX IF NOT EXISTS unit_memberships_unit_id_idx ON unit_memberships(unit_id);

-- ============================================================================
-- PART 5: FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$;

-- Function to update unit member count
CREATE OR REPLACE FUNCTION public.update_unit_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only update if unit_id is not null
    IF NEW.unit_id IS NOT NULL THEN
      UPDATE units 
      SET member_count = (
        SELECT COUNT(*) FROM profiles WHERE unit_id = NEW.unit_id AND is_active = true
      )
      WHERE id = NEW.unit_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    -- Only update if OLD.unit_id is not null
    IF OLD.unit_id IS NOT NULL THEN
      UPDATE units 
      SET member_count = (
        SELECT COUNT(*) FROM profiles WHERE unit_id = OLD.unit_id AND is_active = true
      )
      WHERE id = OLD.unit_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to anonymize user data (GDPR right to be forgotten)
CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Soft delete profile
  UPDATE profiles
  SET 
    email = 'deleted_' || user_uuid || '@deleted.local',
    display_name = 'Deleted User',
    first_name = NULL,
    last_name = NULL,
    avatar = NULL,
    bio = NULL,
    location = NULL,
    is_active = false,
    deleted_at = NOW()
  WHERE id = user_uuid;
  
  -- Anonymize activities
  UPDATE activities
  SET 
    title = 'Deleted Activity',
    description = NULL,
    location = NULL,
    latitude = NULL,
    longitude = NULL,
    images = NULL,
    deleted_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Delete personal comments
  UPDATE comments
  SET 
    text = '[Deleted]',
    deleted_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Delete user from auth.users (Supabase Auth)
  DELETE FROM auth.users
  WHERE id = user_uuid;
  
  -- Mark deletion request as completed
  UPDATE data_deletion_requests
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE user_id = user_uuid AND status = 'pending';
END;
$$;

COMMENT ON FUNCTION anonymize_user_data IS 'GDPR compliant user data anonymization';

-- Function to auto-anonymize on deletion request
CREATE OR REPLACE FUNCTION public.auto_anonymize_on_deletion_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Execute anonymization immediately
  PERFORM anonymize_user_data(NEW.user_id);
  
  -- Return the new record
  RETURN NEW;
END;
$$;

-- Function to cleanup old avatars
CREATE OR REPLACE FUNCTION public.cleanup_old_avatars()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  user_id_text TEXT;
  old_files RECORD;
BEGIN
  -- Only process avatars bucket
  IF NEW.bucket_id != 'avatars' THEN
    RETURN NEW;
  END IF;

  -- Extract user ID from the file path (format: user_id/timestamp.ext)
  -- The path is in the 'name' column, e.g., 'user-id-123/1234567890.jpg'
  user_id_text := (string_to_array(NEW.name, '/'))[1];

  -- If we couldn't extract a user ID, skip cleanup
  IF user_id_text IS NULL OR user_id_text = '' THEN
    RETURN NEW;
  END IF;

  -- Find all other avatar files for this user (excluding the current one)
  FOR old_files IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'avatars'
      AND name LIKE user_id_text || '/%'
      AND name != NEW.name
      AND id != NEW.id
  LOOP
    -- Delete the old file
    DELETE FROM storage.objects
    WHERE bucket_id = 'avatars'
      AND name = old_files.name;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type notification_type, p_title text, p_message text, p_data jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications';

-- Function to get user unit ID
CREATE OR REPLACE FUNCTION public.get_user_unit_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT unit_id FROM profiles WHERE id = user_uuid LIMIT 1;
$$;

-- Function to search organizations
CREATE OR REPLACE FUNCTION public.search_organizations(search_query text DEFAULT ''::text)
RETURNS TABLE(organization text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Search only in units.name (organizations/units)
  SELECT DISTINCT u.name AS organization
  FROM public.units u
  WHERE u.name IS NOT NULL
    AND u.name != ''
    AND (search_query = '' OR u.name ILIKE '%' || search_query || '%')
  
  ORDER BY organization
  LIMIT 10;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid, p_activity_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak_count INTEGER;
  last_date DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date)
  VALUES (p_user_id, 0, 0, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT current_streak, last_activity_date 
  INTO current_streak_count, last_date
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- Update streak logic
  IF last_date IS NULL OR p_activity_date > last_date THEN
    IF last_date IS NULL OR p_activity_date - last_date = 1 THEN
      -- Continue streak
      current_streak_count := current_streak_count + 1;
    ELSIF p_activity_date = last_date THEN
      -- Same day, no change
      RETURN;
    ELSE
      -- Streak broken, reset
      current_streak_count := 1;
    END IF;
    
    UPDATE user_streaks
    SET 
      current_streak = current_streak_count,
      longest_streak = GREATEST(longest_streak, current_streak_count),
      last_activity_date = p_activity_date,
      streak_start_date = CASE 
        WHEN current_streak_count = 1 THEN p_activity_date 
        ELSE streak_start_date 
      END
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_user_streak IS 'Automatically update user activity streaks';

-- Function to trigger update streak
CREATE OR REPLACE FUNCTION public.trigger_update_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_user_streak(NEW.user_id, NEW.date::DATE);
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Triggers for auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update unit member count
DROP TRIGGER IF EXISTS update_unit_member_count_trigger ON profiles;
CREATE TRIGGER update_unit_member_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_member_count();

-- Trigger to update streaks on activity creation
DROP TRIGGER IF EXISTS on_activity_created_update_streak ON activities;
CREATE TRIGGER on_activity_created_update_streak
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

-- Trigger to auto-anonymize on deletion request
DROP TRIGGER IF EXISTS trigger_auto_anonymize_on_deletion_request ON data_deletion_requests;
CREATE TRIGGER trigger_auto_anonymize_on_deletion_request
  AFTER INSERT ON data_deletion_requests
  FOR EACH ROW
  WHEN (new.status = 'pending'::text)
  EXECUTE FUNCTION auto_anonymize_on_deletion_request();

-- ============================================================================
-- PART 7: VIEWS
-- ============================================================================

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.id AS user_id,
  p.display_name,
  count(DISTINCT a.id) AS total_activities,
  COALESCE(sum(a.duration), (0)::bigint) AS total_minutes,
  count(DISTINCT
      CASE
          WHEN (a.type = 'training'::activity_type) THEN a.id
          ELSE NULL::uuid
      END) AS training_count,
  count(DISTINCT
      CASE
          WHEN (a.type = 'exercise'::activity_type) THEN a.id
          ELSE NULL::uuid
      END) AS exercise_count,
  count(DISTINCT
      CASE
          WHEN (a.type = 'operation'::activity_type) THEN a.id
          ELSE NULL::uuid
      END) AS operation_count,
  count(DISTINCT
      CASE
          WHEN (date_trunc('month'::text, a.date) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) THEN a.id
          ELSE NULL::uuid
      END) AS activities_this_month,
  count(DISTINCT
      CASE
          WHEN (date_trunc('year'::text, a.date) = date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone)) THEN a.id
          ELSE NULL::uuid
      END) AS activities_this_year,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.longest_streak, 0) AS longest_streak
FROM ((profiles p
  LEFT JOIN activities a ON (((p.id = a.user_id) AND (a.deleted_at IS NULL))))
  LEFT JOIN user_streaks us ON ((p.id = us.user_id)))
WHERE ((p.deleted_at IS NULL) AND (p.is_active = true))
GROUP BY p.id, p.display_name, us.current_streak, us.longest_streak;

-- ============================================================================
-- PART 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean recreation)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (
    is_active = true AND 
    deleted_at IS NULL AND 
    (profile_visibility = 'public' OR id = auth.uid())
  );

CREATE POLICY "Users can view unit member profiles"
  ON profiles FOR SELECT
  USING (
    is_active = true AND 
    deleted_at IS NULL AND 
    (profile_visibility = 'unit' AND unit_id IS NOT NULL AND unit_id = get_user_unit_id(auth.uid()))
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Activities policies
CREATE POLICY "Users can view public activities"
  ON activities FOR SELECT
  USING (
    deleted_at IS NULL AND
    visibility = 'public' AND
    user_id IN (SELECT id FROM profiles WHERE is_active = true AND deleted_at IS NULL)
  );

CREATE POLICY "Users can view unit activities"
  ON activities FOR SELECT
  USING (
    deleted_at IS NULL AND
    visibility = 'unit' AND
    unit_id IN (SELECT profiles.unit_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own activities"
  ON activities FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (user_id = auth.uid());

-- Reactions policies
CREATE POLICY "Users can view reactions on visible activities"
  ON reactions FOR SELECT
  USING (
    activity_id IN (SELECT id FROM activities WHERE deleted_at IS NULL)
  );

CREATE POLICY "Users can create own reactions"
  ON reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments on visible activities"
  ON comments FOR SELECT
  USING (
    deleted_at IS NULL AND
    activity_id IN (SELECT id FROM activities WHERE deleted_at IS NULL)
  );

CREATE POLICY "Users can create own comments"
  ON comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Badges policies
CREATE POLICY "All users can view active badges"
  ON badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "All users can view user badges"
  ON user_badges FOR SELECT
  USING (true);

-- Streaks policies
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Social policies
CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  USING (follower_id = auth.uid());

CREATE POLICY "Users can view unit memberships"
  ON unit_memberships FOR SELECT
  USING (true);

-- Data deletion policies
CREATE POLICY "Users can view own deletion requests"
  ON data_deletion_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own deletion requests"
  ON data_deletion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Units policies
CREATE POLICY "Users can view all units"
  ON units FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create units"
  ON units FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 9: STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('activity-images', 'activity-images', true),
  ('unit-avatars', 'unit-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.' || r.tablename;
    END LOOP;
END $$;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Storage policies for activity images
CREATE POLICY "Activity images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-images');

CREATE POLICY "Users can upload activity images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'activity-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own activity images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'activity-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own activity images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'activity-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Storage policies for unit avatars
CREATE POLICY "Unit avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'unit-avatars');

CREATE POLICY "Unit leaders can upload unit avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'unit-avatars' AND
    ((storage.foldername(name))[1])::uuid IN (
      SELECT profiles.unit_id
      FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['leader'::user_role, 'admin'::user_role]) AND profiles.unit_id IS NOT NULL
    )
  );

-- ============================================================================
-- END OF SCHEMA BACKUP
-- ============================================================================
-- 
-- Summary:
-- - Extensions: uuid-ossp, pg_trgm
-- - Custom Types: 7 enums
-- - Tables: 14 tables
-- - Functions: 11 custom functions
-- - Triggers: 9 triggers
-- - Indexes: 30+ indexes
-- - Views: 1 view (user_statistics)
-- - RLS Policies: 30+ policies
-- - Storage: 3 buckets with 10 policies
-- 
-- Next step: Run the data backup file to restore data
-- ============================================================================



