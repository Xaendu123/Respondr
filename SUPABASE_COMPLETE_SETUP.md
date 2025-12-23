# 🚀 Complete Supabase Setup Guide (Production-Ready)

This is the **complete, production-ready** setup guide for Respondr with Supabase, including all current and future features, OAuth support, and GDPR compliance.

## 📋 What This Guide Covers

✅ **Core Features**: Auth, Activities, Profiles, Social Features  
✅ **Advanced Features**: Badges, Streaks, Notifications  
✅ **OAuth**: Google & Apple Sign-In  
✅ **Privacy**: GDPR compliance, Data deletion, Privacy controls  
✅ **Security**: RLS policies, Encryption, Audit logging  

---

## 🎯 Quick Navigation

- **New to Supabase?** → Start with [5-Minute Quick Start](#5-minute-quick-start)
- **Setting up OAuth?** → See [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- **Privacy & GDPR?** → See [PRIVACY_AND_GDPR.md](./PRIVACY_AND_GDPR.md)

---

## ⚡ 5-Minute Quick Start

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project:
   - **Name**: Respondr
   - **Password**: [Strong password - save it!]
   - **Region**: Choose closest to your users (e.g., EU Central for Germany)
3. Wait ~2 minutes for setup

### Step 2: Deploy Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Open `supabase/schema_enhanced.sql` from your project
4. Copy **entire file** and paste into SQL Editor
5. Click **Run** (⏵)
6. Wait ~30 seconds
7. Verify: Go to **Database** → **Tables** → Should see 15+ tables

### Step 3: Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...`

### Step 4: Configure App

Create `.env` in project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### Step 5: Test It!

```bash
npm start
```

1. Press `a` (Android) or `i` (iOS)
2. Register a new user
3. Log an activity
4. Check Supabase Dashboard → **Authentication** → **Users**
5. Check **Table Editor** → **activities**

**✅ You're done!** App is now connected to Supabase.

---

## 📊 Database Schema Overview

The enhanced schema includes **15 tables** organized into these categories:

### Core Tables
- `profiles` - User profiles with privacy settings
- `activities` - Training, exercises, operations
- `units` - Fire departments, rescue organizations
- `reactions` - Activity reactions (respect, strong, teamwork, impressive)
- `comments` - Activity comments

### Gamification
- `badges` - Achievement definitions
- `user_badges` - Earned badges
- `user_streaks` - Activity streak tracking

### Social Features
- `follows` - User connections
- `unit_memberships` - Multi-unit support
- `notifications` - In-app notification system

### Privacy & Compliance
- `data_deletion_requests` - GDPR deletion requests
- `audit_logs` - Action audit trail for compliance

### System
- `storage.buckets` - File storage (avatars, images)

---

## 🔒 Privacy & Security Features

### Built-In Privacy Controls

Every user can control:

| Setting | Options | Default |
|---------|---------|---------|
| Profile Visibility | Public / Unit / Private | Unit |
| Activity Visibility | Public / Unit / Private | Unit |
| Show Statistics | Yes / No | Yes |
| Share Location | Yes / No | No |

### Row Level Security (RLS)

**All tables use RLS** - users can only access data they're allowed to see:

```sql
-- Example: Activities respect visibility settings
CREATE POLICY "Users can view public activities"
  ON activities FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view unit activities"
  ON activities FOR SELECT
  USING (
    visibility = 'unit' AND
    unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
  );
```

### GDPR Compliance

✅ **Right to Access**: Users can export all their data  
✅ **Right to Rectification**: Users can edit profile anytime  
✅ **Right to Erasure**: `anonymize_user_data()` function  
✅ **Right to Portability**: JSON/CSV export  
✅ **Right to Object**: Marketing opt-out  
✅ **Right to Restrict**: Privacy settings  

See [PRIVACY_AND_GDPR.md](./PRIVACY_AND_GDPR.md) for full details.

---

## 🎨 Feature Implementation Guide

### 1. Badges & Achievements

**Database**: Already set up! Default badges included.

**App Implementation**:

```typescript
// Fetch user badges
const { data: userBadges } = await supabase
  .from('user_badges')
  .select('*, badges(*)')
  .eq('user_id', userId);

// Award a badge (when criteria met)
await supabase.from('user_badges').insert({
  user_id: userId,
  badge_id: badgeId,
  earned_at: new Date().toISOString(),
});

// Check if user earned "First Activity" badge
const activityCount = await supabase
  .from('activities')
  .select('id', { count: 'exact' })
  .eq('user_id', userId);

if (activityCount.count === 1) {
  // Award badge!
}
```

**UI TODO**: Create `BadgesScreen` to display earned badges.

### 2. Activity Streaks

**Database**: Automatically tracked via trigger!

When a user creates an activity, the `update_user_streak()` function:
- Checks if activity extends the streak
- Updates `current_streak` and `longest_streak`
- Resets streak if gap > 1 day

**App Implementation**:

```typescript
// Fetch user streak
const { data: streak } = await supabase
  .from('user_streaks')
  .select('*')
  .eq('user_id', userId)
  .single();

// Display: "🔥 7 day streak!"
```

**Already implemented** on `ProfileScreen`!

### 3. Notifications

**Database**: Table ready, needs trigger functions.

**Implementation TODO**:

```typescript
// Create notification (when someone reacts to your activity)
await supabase.rpc('create_notification', {
  p_user_id: activityOwnerId,
  p_type: 'activity_reaction',
  p_title: 'New Reaction',
  p_message: `${userName} reacted to your activity`,
  p_data: { activity_id: activityId },
});

// Fetch unread notifications
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Mark as read
await supabase
  .from('notifications')
  .update({ is_read: true, read_at: new Date().toISOString() })
  .eq('id', notificationId);
```

**UI TODO**: Create `NotificationsScreen` and bell icon in header.

### 4. User Follows/Connections

**Database**: `follows` table ready.

**Implementation**:

```typescript
// Follow a user
await supabase.from('follows').insert({
  follower_id: currentUserId,
  following_id: userToFollowId,
});

// Unfollow
await supabase
  .from('follows')
  .delete()
  .eq('follower_id', currentUserId)
  .eq('following_id', userToFollowId);

// Get followers count
const { count: followersCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', userId);

// Get following count
const { count: followingCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('follower_id', userId);
```

**UI TODO**: Add "Follow" button on user profiles.

### 5. Multi-Unit Support

**Database**: `unit_memberships` table allows users to join multiple units.

**Implementation**:

```typescript
// Join a unit
await supabase.from('unit_memberships').insert({
  user_id: userId,
  unit_id: unitId,
  role: 'member',
  is_active: true,
});

// Get user's units
const { data: units } = await supabase
  .from('unit_memberships')
  .select('*, units(*)')
  .eq('user_id', userId)
  .eq('is_active', true);

// Switch active unit
await supabase
  .from('profiles')
  .update({ unit_id: newUnitId })
  .eq('id', userId);
```

**UI TODO**: Add "Units" tab to show all units and allow switching.

### 6. Search Functionality

**Database**: Full-text search index already created!

```typescript
// Search activities by title/description
const { data: results } = await supabase
  .from('activities')
  .select('*')
  .textSearch('title', searchQuery, {
    type: 'websearch',
    config: 'german',
  });

// Or use the existing filter in LogbookScreen
// (already implemented with client-side filtering)
```

**Enhancement TODO**: Move to server-side search for better performance.

---

## 🔐 OAuth Setup (Google & Apple)

**Full guide**: [OAUTH_SETUP.md](./OAUTH_SETUP.md)

### Quick Setup

1. **Google**: 
   - Create OAuth Client in Google Cloud Console
   - Add to Supabase: **Authentication** → **Providers** → **Google**

2. **Apple**:
   - Create Services ID in Apple Developer
   - Add to Supabase: **Authentication** → **Providers** → **Apple**

3. **App**:
   ```bash
   npm install @react-native-google-signin/google-signin expo-apple-authentication
   ```

4. **Usage**:
   ```typescript
   // Google Sign-In
   const { url } = await supabaseAuth.signInWithGoogle();
   await WebBrowser.openAuthSessionAsync(url);
   
   // Apple Sign-In
   const { url } = await supabaseAuth.signInWithApple();
   await WebBrowser.openAuthSessionAsync(url);
   ```

**OAuth functions already added** to `src/services/supabase/authService.ts`!

---

## 📦 Storage Setup (Images)

### Enable Storage

**Already done!** The schema creates 3 storage buckets:
- `avatars` - User profile pictures
- `activity-images` - Activity photos
- `unit-avatars` - Unit logos

**✅ Avatar Upload Ready**: App permissions for camera/photo library are enabled and avatar upload is implemented in ProfileScreen. Users can upload profile pictures from camera or photo library.

**Note**: Activity image uploads are not yet implemented, but storage buckets and permissions are ready.

### Upload Image

```typescript
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

// Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});

if (!result.canceled) {
  const file = result.assets[0];
  const fileExt = file.uri.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, {
      uri: file.uri,
      type: `image/${fileExt}`,
      name: fileName,
    });
  
  if (!error) {
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update profile
    await supabase
      .from('profiles')
      .update({ avatar: publicUrl })
      .eq('id', userId);
  }
}
```

**UI TODO**: Add image upload to profile edit and activity creation.

---

## 🔧 Advanced Configuration

### Environment Variables

For production, use multiple environments:

```bash
# .env.development
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dev_key

# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod_key
```

Load based on environment:

```typescript
// app.config.js
export default ({ config }) => ({
  ...config,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
```

### Realtime Subscriptions

Listen to database changes in real-time:

```typescript
// Listen to new activities in your unit
const subscription = supabase
  .channel('unit-activities')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'activities',
      filter: `unit_id=eq.${unitId}`,
    },
    (payload) => {
      console.log('New activity!', payload.new);
      // Update UI, show notification, etc.
    }
  )
  .subscribe();

// Cleanup
return () => subscription.unsubscribe();
```

**Use cases**:
- Live feed updates
- Real-time reaction notifications
- Live activity tracking

### Database Functions (RPC)

Call custom database functions:

```typescript
// Example: Get user statistics (uses the user_statistics view)
const { data: stats } = await supabase
  .rpc('get_user_statistics', { user_uuid: userId });

// Example: Anonymize user (admin only)
await supabase.rpc('anonymize_user_data', { user_uuid: userId });
```

### Backup Strategy

**Supabase Pro** includes:
- Daily automated backups (retained for 7 days)
- Point-in-time recovery

**Free tier**: Manual backups recommended

```bash
# Manual backup (requires Supabase CLI)
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## 📈 Performance Optimization

### Indexes

**Already included!** The schema creates indexes on:
- Foreign keys (user_id, unit_id, activity_id)
- Frequently queried columns (date, type, visibility)
- Full-text search (title, description)

### Query Optimization

```typescript
// ❌ Bad: Fetches all activities, filters in app
const { data } = await supabase.from('activities').select('*');
const myActivities = data.filter(a => a.user_id === userId);

// ✅ Good: Filters in database
const { data } = await supabase
  .from('activities')
  .select('*')
  .eq('user_id', userId);
```

### Caching Strategy

Use React Query for automatic caching:

```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery } from '@tanstack/react-query';

function useActivities(userId: string) {
  return useQuery({
    queryKey: ['activities', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 🐛 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "Invalid JWT" error | Token expired, call `supabase.auth.refreshSession()` |
| RLS policy blocks query | Check user has correct permissions, verify `auth.uid()` matches |
| Storage upload fails | Verify bucket exists and RLS policy allows upload |
| "relation does not exist" | Schema not deployed, re-run `schema_enhanced.sql` |
| OAuth redirect fails | Check redirect URLs match exactly in provider console |

### Enable Debug Logging

```typescript
// In development, log all Supabase queries
if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
  });
}
```

### Check Supabase Logs

1. Go to Supabase Dashboard → **Logs**
2. Select:
   - **API**: See all API requests
   - **Auth**: See login/signup attempts
   - **Database**: See query errors

### Verify RLS Policies

```sql
-- Test if a policy allows a query
-- In SQL Editor, run as specific user:
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid-here';

SELECT * FROM activities WHERE user_id = 'user-uuid-here';
-- Should return user's activities
```

---

## ✅ Production Launch Checklist

### Legal & Compliance
- [ ] Privacy policy published (use template in [PRIVACY_AND_GDPR.md](./PRIVACY_AND_GDPR.md))
- [ ] Terms of service created
- [ ] GDPR representative appointed (if EU users)
- [ ] Data processing agreement signed with Supabase
- [ ] Cookie policy (if web version)

### Security
- [ ] All RLS policies tested
- [ ] Audit logging enabled
- [ ] Storage RLS policies configured
- [ ] API rate limiting configured
- [ ] OAuth providers configured for production
- [ ] Environment variables secured (not committed to git)

### Database
- [ ] Production schema deployed (`schema_enhanced.sql`)
- [ ] Backups configured (Supabase Pro)
- [ ] Indexes verified
- [ ] Initial data seeded (badges, etc.)
- [ ] Database password rotated from default

### Features
- [ ] User registration/login working
- [ ] Activity CRUD working
- [ ] Social features (reactions, comments) working
- [ ] Profile editing working
- [ ] Privacy settings functional
- [ ] Image upload working
- [ ] Notifications implemented
- [ ] Badges implemented
- [ ] Streaks working

### Monitoring
- [ ] Supabase logs monitored
- [ ] Error tracking (Sentry, etc.) set up
- [ ] Analytics implemented (optional)
- [ ] Performance monitoring
- [ ] Uptime monitoring

### Documentation
- [ ] API documentation updated
- [ ] User guide created (in-app or external)
- [ ] Support contact information added
- [ ] Data breach response plan documented

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Auth Guide**: https://supabase.com/docs/guides/auth
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Storage Guide**: https://supabase.com/docs/guides/storage
- **Realtime Guide**: https://supabase.com/docs/guides/realtime

### Community
- **Supabase Discord**: https://discord.supabase.com
- **Supabase GitHub**: https://github.com/supabase/supabase

---

## 🆘 Support

If you encounter issues:

1. **Check Documentation**: Start with this guide and linked docs
2. **Supabase Logs**: Check Dashboard → Logs for errors
3. **Search Issues**: GitHub issues for Supabase and expo
4. **Community**: Ask in Supabase Discord
5. **Support**: Pro plan includes support tickets

---

**Last Updated**: December 2024  
**Schema Version**: 2.0 (Enhanced)  
**Supabase SDK**: v2.x

**Ready to launch?** 🚀 Follow the checklist above!

