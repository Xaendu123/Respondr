# Database Functions and Rules Documentation

This document describes all database functions, triggers, rules, and business logic implemented in the Respondr database schema.

## 🔄 TRIGGERS

### 1. Auto-Update Timestamps

**Function:** `update_updated_at_column()`
- **Purpose:** Automatically updates the `updated_at` timestamp when a row is modified
- **Applied to:**
  - `profiles`
  - `activities`
  - `units`
  - `user_streaks`
  - `comments`
- **Trigger Type:** `BEFORE UPDATE`
- **Behavior:** Sets `NEW.updated_at = NOW()` before update

---

### 2. Profile Creation Trigger

**Function:** `handle_new_user()`
- **Purpose:** Automatically creates a profile when a new user signs up via Supabase Auth
- **Trigger:** `on_auth_user_created` (AFTER INSERT on `auth.users`)
- **Behavior:**
  - Extracts `display_name` from `raw_user_meta_data` or uses email
  - Creates corresponding entry in `profiles` table
  - Sets `data_processing_consent = TRUE` by default
  - **Security:** `SECURITY DEFINER` (runs with function owner privileges)

---

### 3. Unit Member Count Update

**Function:** `update_unit_member_count()`
- **Purpose:** Automatically maintains accurate member count for units
- **Trigger:** `update_unit_member_count_trigger` (AFTER INSERT/UPDATE/DELETE on `profiles`)
- **Behavior:**
  - On INSERT/UPDATE: Recalculates member count for `NEW.unit_id`
  - On DELETE/UPDATE: Recalculates member count for `OLD.unit_id`
  - Only counts active profiles (`is_active = true`)
- **Why:** Ensures `units.member_count` is always accurate

---

### 4. Activity Streak Update

**Function:** `trigger_update_streak()`
- **Purpose:** Triggers streak calculation when new activity is created
- **Trigger:** `on_activity_created_update_streak` (AFTER INSERT on `activities`)
- **Behavior:** Calls `update_user_streak()` function with activity date
- **See:** `update_user_streak()` function below

---

## 📊 FUNCTIONS

### 1. `update_user_streak(p_user_id UUID, p_activity_date DATE)`

**Purpose:** Calculates and updates user activity streaks

**Logic:**
1. **First Activity:** Creates streak record with `current_streak = 1`
2. **Consecutive Day:** If activity is exactly 1 day after last, increments streak
3. **Same Day:** If activity is on the same day, no change
4. **Broken Streak:** If gap > 1 day, resets streak to 1
5. **Longest Streak:** Tracks highest streak ever achieved

**Updates:**
- `current_streak` - Current consecutive days
- `longest_streak` - Highest streak ever achieved
- `last_activity_date` - Date of most recent activity
- `streak_start_date` - When current streak began

**Security:** `SECURITY DEFINER`

---

### 2. `anonymize_user_data(user_uuid UUID)`

**Purpose:** GDPR-compliant user data anonymization (Right to be Forgotten)

**Behavior:**
1. **Profile:**
   - Sets email to `deleted_{uuid}@deleted.local`
   - Sets display_name to "Deleted User"
   - Nullifies personal fields (name, avatar, bio, location)
   - Sets `is_active = false`
   - Sets `deleted_at = NOW()`

2. **Activities:**
   - Sets title to "Deleted Activity"
   - Nullifies description, location, coordinates, images
   - Sets `deleted_at = NOW()`

3. **Comments:**
   - Sets text to "[Deleted]"
   - Sets `deleted_at = NOW()`

4. **Deletion Request:**
   - Marks request as `status = 'completed'`
   - Sets `completed_at = NOW()`

**Note:** Reactions and follows are NOT deleted (historical data), but user is anonymized.

**Security:** `SECURITY DEFINER`

---

### 3. `create_notification(p_user_id UUID, p_type notification_type, p_title TEXT, p_message TEXT, p_data JSONB)`

**Purpose:** Helper function to create notifications

**Parameters:**
- `p_user_id` - Target user
- `p_type` - Notification type enum
- `p_title` - Notification title
- `p_message` - Notification body
- `p_data` - Optional JSON data (e.g., activity_id, badge_id)

**Returns:** UUID of created notification

**Usage Example:**
```sql
SELECT create_notification(
  'user-uuid',
  'badge_earned',
  'Badge Earned!',
  'You earned the Week Warrior badge',
  '{"badge_id": "badge-uuid"}'::jsonb
);
```

**Security:** `SECURITY DEFINER`

---

## 🔐 ROW LEVEL SECURITY (RLS) POLICIES

### Profiles Table

1. **View Public Profiles**
   - Users can view profiles where `profile_visibility = 'public'`
   - Users can always view their own profile

2. **View Unit Profiles**
   - Users can view profiles where `profile_visibility = 'unit'`
   - Only if they belong to the same unit

3. **Update Own Profile**
   - Users can only update their own profile

4. **Insert Own Profile**
   - Users can only insert their own profile (via trigger)

---

### Activities Table

1. **View Public Activities**
   - Anyone can view activities with `visibility = 'public'`
   - Only from active, non-deleted users

2. **View Unit Activities**
   - Users can view activities with `visibility = 'unit'`
   - Only if they belong to the same unit

3. **View Own Activities**
   - Users can always view their own activities

4. **Create Own Activities**
   - Users can only create activities for themselves

5. **Update Own Activities**
   - Users can only update their own non-deleted activities

6. **Soft Delete Own Activities**
   - Users can only soft delete their own activities

---

### Reactions Table

1. **View Reactions**
   - Users can view reactions on visible (non-deleted) activities

2. **Create Own Reactions**
   - Users can only create reactions as themselves

3. **Delete Own Reactions**
   - Users can only delete their own reactions

---

### Comments Table

1. **View Comments**
   - Users can view non-deleted comments on visible activities

2. **Create Own Comments**
   - Users can only create comments as themselves

3. **Update Own Comments**
   - Users can only update their own non-deleted comments

4. **Soft Delete Own Comments**
   - Users can only soft delete their own comments

---

### Badges Table

1. **View Active Badges**
   - All users can view active badges

2. **View User Badges**
   - All users can view which badges others have earned

---

### User Streaks Table

1. **View Own Streaks**
   - Users can only view their own streak data

2. **Update Own Streaks**
   - Users can only update their own streaks (via function/trigger)

3. **Insert Own Streaks**
   - Users can only insert their own streak record

---

### Notifications Table

1. **View Own Notifications**
   - Users can only view their own notifications

2. **Update Own Notifications**
   - Users can only update their own notifications (e.g., mark as read)

---

### Follows Table

1. **View Follows**
   - All users can view follow relationships (for social features)

2. **Create Own Follows**
   - Users can only create follows where they are the follower

3. **Delete Own Follows**
   - Users can only delete their own follow relationships

---

### Unit Memberships Table

1. **View Memberships**
   - All users can view unit memberships (for discovery)

---

### Data Deletion Requests Table

1. **View Own Requests**
   - Users can only view their own deletion requests

2. **Create Own Requests**
   - Users can only create requests for themselves

---

### Audit Logs Table

1. **View Own Logs**
   - Users can only view audit logs related to their actions
   - Note: Logs are typically written by triggers, not directly by users

---

### Units Table

1. **View All Units**
   - All users can view all units (for discovery and selection)

---

## 📦 STORAGE POLICIES

### Avatars Bucket (`avatars`)

1. **Public Read**
   - All avatar images are publicly readable

2. **Upload Own Avatar**
   - Users can only upload to their own folder: `{user_id}/filename.ext`

3. **Update Own Avatar**
   - Users can only update files in their own folder

4. **Delete Own Avatar**
   - Users can only delete files in their own folder

---

### Activity Images Bucket (`activity-images`)

1. **Public Read**
   - All activity images are publicly readable

2. **Upload Activity Images**
   - Users can only upload to their own folder: `{user_id}/filename.ext`

3. **Update Own Images**
   - Users can only update files in their own folder

4. **Delete Own Images**
   - Users can only delete files in their own folder

---

### Unit Avatars Bucket (`unit-avatars`)

1. **Public Read**
   - All unit avatars are publicly readable

2. **Upload Unit Avatar**
   - Only users with `role = 'leader'` or `role = 'admin'` can upload
   - Must be uploading for a unit they belong to

---

## 🔍 INDEXES

### Performance Indexes

**Profiles:**
- `profiles_unit_id_idx` - Fast unit member lookups
- `profiles_email_idx` - Fast email lookups (unique constraint)
- `profiles_last_seen_idx` - For "active users" queries
- `profiles_deleted_at_idx` - Partial index for soft-deleted users

**Activities:**
- `activities_user_id_idx` - Fast user activity queries
- `activities_unit_id_idx` - Fast unit activity queries
- `activities_date_idx` - Chronological ordering
- `activities_type_idx` - Filter by activity type
- `activities_visibility_idx` - Privacy filtering
- `activities_deleted_at_idx` - Partial index for soft-deleted
- `activities_full_text_idx` - German full-text search (GIN index)

**Reactions & Comments:**
- Foreign key indexes on `activity_id` and `user_id`
- Partial index on `comments_deleted_at` for soft-deleted

**Badges & Streaks:**
- Indexes on foreign keys for fast lookups

**Notifications:**
- `notifications_user_id_idx` - Fast user notification queries
- `notifications_is_read_idx` - Partial index for unread notifications
- `notifications_created_at_idx` - Chronological ordering

**Social:**
- Indexes on `follower_id` and `following_id` for bidirectional lookups
- Indexes on unit membership foreign keys

---

## 📊 VIEWS

### `user_statistics`

**Purpose:** Pre-calculated user statistics for performance

**Columns:**
- `user_id` - Profile ID
- `display_name` - User's display name
- `total_activities` - Count of all activities
- `total_minutes` - Sum of all activity durations
- `training_count` - Count of training activities
- `exercise_count` - Count of exercise activities
- `operation_count` - Count of operation activities
- `activities_this_month` - Activities in current month
- `activities_this_year` - Activities in current year
- `current_streak` - Current consecutive days
- `longest_streak` - Highest streak ever

**Filters:** Only includes active, non-deleted profiles and non-deleted activities

**Usage:** 
```sql
SELECT * FROM user_statistics WHERE user_id = 'uuid';
```

---

## 🎯 BUSINESS RULES

### 1. Soft Delete Pattern
- **Tables with soft delete:** `profiles`, `activities`, `comments`
- **Behavior:** Records marked with `deleted_at` timestamp instead of hard delete
- **Purpose:** GDPR compliance, data retention, audit trail
- **Queries:** Always filter `WHERE deleted_at IS NULL` for active records

### 2. Privacy Levels
- **Profile Visibility:** `public`, `unit`, `private`
  - `public` - Anyone can see
  - `unit` - Only unit members can see
  - `private` - Only user can see
- **Activity Visibility:** Same levels
  - Default: `unit` (most restrictive)

### 3. Unit Membership
- Users can belong to multiple units via `unit_memberships`
- Primary unit stored in `profiles.unit_id` (for convenience)
- `unit_memberships.is_active` tracks current membership

### 4. Reaction Constraints
- One reaction per user per activity (enforced by unique constraint)
- User can change reaction by deleting and re-adding

### 5. Badge Earning
- User can only earn each badge once (enforced by unique constraint)
- Badges can be active or inactive (`is_active`)
- Criteria stored as flexible JSONB for future expansion

### 6. Streak Calculation
- Streak continues if activities are consecutive days
- Same-day activities don't affect streak
- Broken streaks reset to 1, longest streak preserved
- Tracked automatically via trigger

### 7. GDPR Compliance
- Data processing consent tracked with timestamp
- Marketing consent separate and opt-in
- Right to be forgotten via `anonymize_user_data()`
- Deletion requests tracked in `data_deletion_requests`
- Audit trail in `audit_logs` for compliance

### 8. Notification Types
- `activity_reaction` - Someone reacted to activity
- `activity_comment` - Someone commented on activity
- `badge_earned` - User earned a badge
- `streak_milestone` - Streak milestone reached
- `unit_announcement` - Unit-wide announcement

---

## 🔄 Data Flow Examples

### User Registration Flow
1. User signs up via Supabase Auth → `auth.users` record created
2. Trigger `on_auth_user_created` fires
3. `handle_new_user()` function creates `profiles` record
4. Default privacy settings applied
5. `data_processing_consent` set to TRUE

### Activity Creation Flow
1. User creates activity → `activities` record inserted
2. Trigger `on_activity_created_update_streak` fires
3. `update_user_streak()` calculates streak
4. `user_streaks` table updated
5. Badge eligibility checked (future: via function)

### User Deletion Flow
1. User requests deletion → `data_deletion_requests` record created
2. Admin processes request
3. `anonymize_user_data(user_uuid)` called
4. All personal data anonymized
5. Deletion request marked complete

---

## 🚀 Performance Considerations

1. **Partial Indexes:** Used for soft-deleted records (smaller index size)
2. **GIN Indexes:** Full-text search on activities (German language)
3. **Foreign Key Indexes:** Automatically created, optimized for joins
4. **View Usage:** `user_statistics` view pre-aggregates common queries
5. **Trigger Efficiency:** Triggers use efficient queries and update only when needed

---

## 🔒 Security Considerations

1. **RLS Enabled:** All tables have Row Level Security enabled
2. **SECURITY DEFINER:** Functions that need elevated privileges marked appropriately
3. **Soft Deletes:** Prevent accidental data loss
4. **Audit Logging:** All important actions can be logged
5. **Privacy by Default:** Default visibility settings are restrictive (`unit` level)

---

This documentation provides a comprehensive overview of all database functions, triggers, rules, and business logic. For implementation details, refer to `schema_enhanced.sql`.

