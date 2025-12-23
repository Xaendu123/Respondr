-- ============================================================================
-- RESPONDR DATABASE SCHEMA - ENHANCED VERSION
-- ============================================================================
-- This schema includes all current and future features with comprehensive
-- data privacy, GDPR compliance, and OAuth support
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE activity_type AS ENUM ('training', 'exercise', 'operation');
CREATE TYPE activity_visibility AS ENUM ('private', 'unit', 'public');
CREATE TYPE reaction_type AS ENUM ('respect', 'strong', 'teamwork', 'impressive');
CREATE TYPE user_role AS ENUM ('member', 'leader', 'admin');
CREATE TYPE badge_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE notification_type AS ENUM ('activity_reaction', 'activity_comment', 'badge_earned', 'streak_milestone', 'unit_announcement');
CREATE TYPE privacy_level AS ENUM ('public', 'unit', 'private');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Units table (fire departments, rescue organizations)
CREATE TABLE units (
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
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
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

-- Activities table with enhanced privacy
CREATE TABLE activities (
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

-- Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- Comments table with moderation support
CREATE TABLE comments (
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

-- ============================================================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================================================

-- Badges definition table
CREATE TABLE badges (
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

-- User badges (earned badges)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Streaks tracking
CREATE TABLE user_streaks (
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

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

CREATE TABLE notifications (
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

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

-- User follows/connections
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Unit memberships (for multi-unit support)
CREATE TABLE unit_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, unit_id)
);

-- ============================================================================
-- GDPR & DATA PRIVACY
-- ============================================================================

-- Data deletion requests
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Audit log for compliance
CREATE TABLE audit_logs (
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX profiles_unit_id_idx ON profiles(unit_id);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_last_seen_idx ON profiles(last_seen_at DESC);
CREATE INDEX profiles_deleted_at_idx ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Activities
CREATE INDEX activities_user_id_idx ON activities(user_id);
CREATE INDEX activities_unit_id_idx ON activities(unit_id);
CREATE INDEX activities_date_idx ON activities(date DESC);
CREATE INDEX activities_type_idx ON activities(type);
CREATE INDEX activities_visibility_idx ON activities(visibility);
CREATE INDEX activities_deleted_at_idx ON activities(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX activities_full_text_idx ON activities USING gin(to_tsvector('german', title || ' ' || COALESCE(description, '')));

-- Reactions & Comments
CREATE INDEX reactions_activity_id_idx ON reactions(activity_id);
CREATE INDEX reactions_user_id_idx ON reactions(user_id);
CREATE INDEX comments_activity_id_idx ON comments(activity_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_deleted_at_idx ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Badges & Streaks
CREATE INDEX user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX user_badges_badge_id_idx ON user_badges(badge_id);
CREATE INDEX user_streaks_user_id_idx ON user_streaks(user_id);

-- Notifications
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read) WHERE is_read = false;
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- Social
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);
CREATE INDEX unit_memberships_user_id_idx ON unit_memberships(user_id);
CREATE INDEX unit_memberships_unit_id_idx ON unit_memberships(unit_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Profiles policies (respecting privacy settings)
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
    (profile_visibility = 'unit' AND unit_id IN (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Activities policies (comprehensive visibility control)
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
    unit_id IN (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    )
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

-- Reactions policies
CREATE POLICY "Users can view reactions on visible activities"
  ON reactions FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM activities WHERE deleted_at IS NULL
    )
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
    activity_id IN (
      SELECT id FROM activities WHERE deleted_at IS NULL
    )
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

-- Audit logs (read-only for users, write via triggers)
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Units policies
CREATE POLICY "Users can view all units"
  ON units FOR SELECT
  USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-update
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle profile creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update unit member count
CREATE OR REPLACE FUNCTION update_unit_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE units 
    SET member_count = (
      SELECT COUNT(*) FROM profiles WHERE unit_id = NEW.unit_id AND is_active = true
    )
    WHERE id = NEW.unit_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE units 
    SET member_count = (
      SELECT COUNT(*) FROM profiles WHERE unit_id = OLD.unit_id AND is_active = true
    )
    WHERE id = OLD.unit_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unit_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_member_count();

-- Function to anonymize user data (GDPR right to be forgotten)
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS VOID AS $$
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
  
  -- Mark deletion request as completed
  UPDATE data_deletion_requests
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE user_id = user_uuid AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_activity_date DATE)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streaks on activity creation
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_streak(NEW.user_id, NEW.date::DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_activity_created_update_streak
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

-- ============================================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('activity-images', 'activity-images', true),
  ('unit-avatars', 'unit-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for activity images
CREATE POLICY "Activity images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-images');

CREATE POLICY "Users can upload activity images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'activity-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own activity images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'activity-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own activity images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'activity-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for unit avatars
CREATE POLICY "Unit avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'unit-avatars');

CREATE POLICY "Unit leaders can upload unit avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'unit-avatars' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT unit_id::text FROM profiles 
      WHERE id = auth.uid() AND role IN ('leader', 'admin')
    )
  );

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Insert default badges
INSERT INTO badges (name, description, icon, level, criteria, points) VALUES
('First Activity', 'Log your first activity', 'trophy', 'bronze', '{"activities_count": 1}', 10),
('Week Warrior', '7 day activity streak', 'flame', 'silver', '{"streak_days": 7}', 50),
('Month Master', '30 day activity streak', 'star', 'gold', '{"streak_days": 30}', 200),
('Century Club', '100 total activities', 'medal', 'gold', '{"activities_count": 100}', 500),
('Team Player', 'Receive 50 reactions', 'heart', 'silver', '{"reactions_received": 50}', 100)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.id as user_id,
  p.display_name,
  COUNT(DISTINCT a.id) as total_activities,
  COALESCE(SUM(a.duration), 0) as total_minutes,
  COUNT(DISTINCT CASE WHEN a.type = 'training' THEN a.id END) as training_count,
  COUNT(DISTINCT CASE WHEN a.type = 'exercise' THEN a.id END) as exercise_count,
  COUNT(DISTINCT CASE WHEN a.type = 'operation' THEN a.id END) as operation_count,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', a.date) = DATE_TRUNC('month', CURRENT_DATE) THEN a.id END) as activities_this_month,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('year', a.date) = DATE_TRUNC('year', CURRENT_DATE) THEN a.id END) as activities_this_year,
  COALESCE(us.current_streak, 0) as current_streak,
  COALESCE(us.longest_streak, 0) as longest_streak
FROM profiles p
LEFT JOIN activities a ON p.id = a.user_id AND a.deleted_at IS NULL
LEFT JOIN user_streaks us ON p.id = us.user_id
WHERE p.deleted_at IS NULL AND p.is_active = true
GROUP BY p.id, p.display_name, us.current_streak, us.longest_streak;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles with comprehensive privacy settings and GDPR compliance';
COMMENT ON TABLE activities IS 'User activities with soft delete and visibility controls';
COMMENT ON TABLE badges IS 'Achievement badges that users can earn';
COMMENT ON TABLE user_badges IS 'Badges earned by users';
COMMENT ON TABLE user_streaks IS 'Activity streak tracking for gamification';
COMMENT ON TABLE notifications IS 'In-app notification system';
COMMENT ON TABLE audit_logs IS 'Audit trail for GDPR compliance and security';
COMMENT ON TABLE data_deletion_requests IS 'GDPR right to be forgotten requests';

COMMENT ON FUNCTION anonymize_user_data IS 'GDPR compliant user data anonymization';
COMMENT ON FUNCTION update_user_streak IS 'Automatically update user activity streaks';
COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications';

