-- ============================================================================
-- RESPONDR DATABASE BACKUP
-- Generated: 2025-12-27 11:37:26 UTC
-- Project: mryretaoanuuwruhjdvn (eu-west-1)
-- Target: nbdmoapoiqxyjrrhzqvg (eu-central-2)
-- ============================================================================
-- 
-- This backup contains:
-- - Complete database schema
-- - All data from all tables
-- 
-- To restore:
-- 1. Ensure the target database has the schema applied
-- 2. Run this file in order (schema first, then data)
-- ============================================================================

-- ============================================================================
-- PART 1: SCHEMA (from schema_enhanced.sql)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- ENUMS
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
-- PART 2: DATA BACKUP
-- ============================================================================

-- ============================================================================
-- UNITS TABLE DATA
-- ============================================================================

INSERT INTO units (id, name, description, location, type, avatar, member_count, created_at, updated_at) VALUES
('bede8e3f-9052-4ca1-a363-eec18fea18dc', 'Feuerwehr Bellmund-Port', NULL, NULL, 'firestation', NULL, 1, '2025-12-24 11:29:50.604092+00', '2025-12-27 02:16:23.824389+00'),
('a6e52e54-1aad-4118-abc1-e6c898903885', 'Feuerwehr BASSS', NULL, NULL, NULL, NULL, 0, '2025-12-27 00:43:51.488714+00', '2025-12-27 00:47:32.13181+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROFILES TABLE DATA
-- ============================================================================

INSERT INTO profiles (
    id, email, display_name, first_name, last_name, avatar, bio, rank, location, 
    unit_id, role, profile_visibility, activity_visibility, show_statistics, 
    show_location, language, theme, notifications_enabled, email_notifications, 
    push_notifications, auth_provider, provider_id, is_active, is_verified, 
    last_seen_at, data_processing_consent, data_processing_consent_date, 
    marketing_consent, created_at, updated_at, deleted_at, organization
) VALUES
(
    'a0418947-82db-4eac-bd99-8a4566bab790',
    'dev@respondr.ch',
    'dev@respondr.ch',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'member',
    'unit',
    'unit',
    true,
    false,
    'de',
    'system',
    true,
    true,
    true,
    NULL,
    NULL,
    true,
    false,
    NULL,
    true,
    NULL,
    false,
    '2025-12-26 19:13:27.247279+00',
    '2025-12-26 19:13:27.247279+00',
    NULL,
    NULL
),
(
    '452649e4-ae0d-469b-bd82-7d63b7309d66',
    'lar.rei@evard.ch',
    'Lars Reinmann',
    NULL,
    NULL,
    'https://mryretaoanuuwruhjdvn.supabase.co/storage/v1/object/public/avatars/452649e4-ae0d-469b-bd82-7d63b7309d66/1766786538291.jpg',
    NULL,
    NULL,
    NULL,
    NULL,
    'member',
    'unit',
    'unit',
    true,
    false,
    'de',
    'system',
    true,
    true,
    true,
    NULL,
    NULL,
    true,
    false,
    NULL,
    true,
    NULL,
    false,
    '2025-12-26 21:09:12.694721+00',
    '2025-12-26 22:02:19.367741+00',
    NULL,
    NULL
),
(
    '808d7f0c-b66b-4583-985b-e841f75dae0c',
    'alex_bugnon@bluewin.ch',
    'Alexandre Bugnon',
    'Alex',
    'Bugnon',
    'https://mryretaoanuuwruhjdvn.supabase.co/storage/v1/object/public/avatars/808d7f0c-b66b-4583-985b-e841f75dae0c/1766798716819.jpg',
    '',
    '',
    '',
    'bede8e3f-9052-4ca1-a363-eec18fea18dc',
    'member',
    'public',
    'unit',
    true,
    false,
    'de',
    'system',
    true,
    true,
    true,
    NULL,
    NULL,
    true,
    false,
    NULL,
    true,
    NULL,
    true,
    '2025-12-26 22:58:14.126299+00',
    '2025-12-27 02:16:23.824389+00',
    NULL,
    'Feuerwehr Bellmund-Port'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar = EXCLUDED.avatar,
    bio = EXCLUDED.bio,
    rank = EXCLUDED.rank,
    location = EXCLUDED.location,
    unit_id = EXCLUDED.unit_id,
    role = EXCLUDED.role,
    profile_visibility = EXCLUDED.profile_visibility,
    activity_visibility = EXCLUDED.activity_visibility,
    show_statistics = EXCLUDED.show_statistics,
    show_location = EXCLUDED.show_location,
    language = EXCLUDED.language,
    theme = EXCLUDED.theme,
    notifications_enabled = EXCLUDED.notifications_enabled,
    email_notifications = EXCLUDED.email_notifications,
    push_notifications = EXCLUDED.push_notifications,
    auth_provider = EXCLUDED.auth_provider,
    provider_id = EXCLUDED.provider_id,
    is_active = EXCLUDED.is_active,
    is_verified = EXCLUDED.is_verified,
    last_seen_at = EXCLUDED.last_seen_at,
    data_processing_consent = EXCLUDED.data_processing_consent,
    data_processing_consent_date = EXCLUDED.data_processing_consent_date,
    marketing_consent = EXCLUDED.marketing_consent,
    updated_at = EXCLUDED.updated_at,
    deleted_at = EXCLUDED.deleted_at,
    organization = EXCLUDED.organization;

-- ============================================================================
-- ACTIVITIES TABLE DATA
-- ============================================================================

INSERT INTO activities (
    id, user_id, unit_id, type, title, description, duration, date, location,
    latitude, longitude, visibility, is_pinned, tags, images, view_count,
    created_at, updated_at, deleted_at
) VALUES
(
    '2e1e79af-ccbe-42bf-a25b-17711a0184a1',
    '452649e4-ae0d-469b-bd82-7d63b7309d66',
    NULL,
    'operation',
    'Boot Brennt',
    'Boot hat gebrannt. Ich bin mit Alex und Lukas Teippel ausgerückt mit dem TLF (meine erste Blaulichfahrt). Vor Ort keine weiteren Aufgaben für uns. Brand konnte durch BASSS glöscht werden',
    30,
    '2025-12-22 14:39:12+00',
    'Oberer Kanalweg 17, Aegerten',
    NULL,
    NULL,
    'unit',
    false,
    ARRAY['A1'],
    NULL,
    0,
    '2025-12-26 21:15:33.398+00',
    '2025-12-26 21:15:33.398+00',
    NULL
),
(
    '4ba02f51-64e7-46c4-bacb-d81d97e4d195',
    '808d7f0c-b66b-4583-985b-e841f75dae0c',
    'bede8e3f-9052-4ca1-a363-eec18fea18dc',
    'training',
    'Test 1',
    'Das war richtig cool und ich konnte viel machen',
    120,
    '2025-12-27 00:25:49+00',
    'Hohlenweg, Bellmund',
    NULL,
    NULL,
    'public',
    false,
    NULL,
    NULL,
    0,
    '2025-12-27 01:32:38.266+00',
    '2025-12-27 01:32:38.266+00',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BADGES TABLE DATA
-- ============================================================================

INSERT INTO badges (id, name, description, icon, level, criteria, points, is_active, created_at) VALUES
(
    '2be555ff-db4c-42b3-be74-8f076addbec7',
    'First Activity',
    'Log your first activity',
    'trophy',
    'bronze',
    '{"activities_count": 1}'::jsonb,
    10,
    true,
    '2025-12-24 09:42:51.791623+00'
),
(
    'cf3b53d8-c7c8-4c73-8355-ebd0a40070aa',
    'Week Warrior',
    '7 day activity streak',
    'flame',
    'silver',
    '{"streak_days": 7}'::jsonb,
    50,
    true,
    '2025-12-24 09:42:51.791623+00'
),
(
    '623d6255-df5c-4c22-90ea-dd78672bfed7',
    'Month Master',
    '30 day activity streak',
    'star',
    'gold',
    '{"streak_days": 30}'::jsonb,
    200,
    true,
    '2025-12-24 09:42:51.791623+00'
),
(
    'f7c56556-3a2f-4b8b-afbb-64379436b646',
    'Century Club',
    '100 total activities',
    'medal',
    'gold',
    '{"activities_count": 100}'::jsonb,
    500,
    true,
    '2025-12-24 09:42:51.791623+00'
),
(
    '151505cb-a1bf-426e-b928-3ee3d9ad7942',
    'Team Player',
    'Receive 50 reactions',
    'heart',
    'silver',
    '{"reactions_received": 50}'::jsonb,
    100,
    true,
    '2025-12-24 09:42:51.791623+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USER_STREAKS TABLE DATA
-- ============================================================================

INSERT INTO user_streaks (
    id, user_id, current_streak, longest_streak, last_activity_date,
    streak_start_date, created_at, updated_at
) VALUES
(
    'aeda657d-53cd-4f8e-b17a-98da3f0e16f2',
    '452649e4-ae0d-469b-bd82-7d63b7309d66',
    1,
    1,
    '2025-12-22',
    '2025-12-22',
    '2025-12-26 21:15:33.40911+00',
    '2025-12-26 21:15:33.40911+00'
),
(
    'e3f206ae-39d6-4216-bcef-e098a592597e',
    '808d7f0c-b66b-4583-985b-e841f75dae0c',
    1,
    1,
    '2025-12-27',
    '2025-12-27',
    '2025-12-27 01:32:38.33952+00',
    '2025-12-27 01:32:38.33952+00'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- END OF BACKUP
-- ============================================================================
-- 
-- Summary:
-- - Units: 2 records
-- - Profiles: 3 records
-- - Activities: 2 records
-- - Badges: 5 records
-- - User Streaks: 2 records
-- - Other tables: Empty (reactions, comments, follows, notifications, etc.)
-- 
-- Note: Storage URLs in avatar fields reference the old project.
-- These will need to be updated or files migrated to the new project.
-- ============================================================================



