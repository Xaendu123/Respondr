# 🗺️ Respondr Feature Roadmap

This document outlines which features are **implemented**, **database-ready**, or **planned** for future development.

## ✅ Fully Implemented Features

These features are complete in both database and app:

### Authentication & User Management
- ✅ Email/password sign up and login
- ✅ Session persistence
- ✅ Auto token refresh
- ✅ Profile creation and editing
- ✅ Avatar display (initials)
- ✅ User statistics (activity counts, duration)
- ✅ Logout

### Activities
- ✅ Create activities (Training, Exercise, Operation)
- ✅ Activity types with custom fields (title, description, duration, date/time, category, false alarm)
- ✅ Duration units (minutes, hours, days)
- ✅ Activity logbook (view all, search, filter by type)
- ✅ Delete activities
- ✅ Activity feed (coming soon teaser)
- ⚠️ Location field - Database supports it, app permissions not enabled yet

### Settings
- ✅ Language switching (German/English)
- ✅ Theme switching (Light/Dark mode)
- ✅ Persistent preferences

### UI/UX
- ✅ Modern glassmorphism design
- ✅ Gradient backgrounds matching "Blaulicht" theme
- ✅ Responsive keyboard handling
- ✅ Status bar styling
- ✅ Bottom tab navigation
- ✅ Custom UI components (Button, Input, Card, Avatar, Select)

### Internationalization
- ✅ Complete i18n system
- ✅ German translations (informal)
- ✅ English translations
- ✅ Runtime language switching

### Theming & Branding
- ✅ Centralized theme system
- ✅ Design tokens
- ✅ Light/Dark mode support
- ✅ Rescue organization color scheme (red/orange/blue)

---

## 🗄️ Database-Ready Features

These features have complete database schemas and can be implemented in the app:

### 🏆 Badges & Achievements
**Status**: Schema ✅ | App ❌

**What's Ready**:
- Database tables: `badges`, `user_badges`
- Default badges included:
  - First Activity (bronze)
  - Week Warrior (silver)
  - Month Master (gold)
  - Century Club (gold)
  - Team Player (silver)
- Automatic badge tracking possible

**To Implement**:
```typescript
// Example: Award "First Activity" badge
const { count } = await supabase
  .from('activities')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

if (count === 1) {
  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: 'first-activity-badge-id',
  });
}
```

**UI Needed**:
- BadgesScreen to display earned badges
- Badge notification on earning
- Badge icon in profile

**Estimated Time**: 4-6 hours

---

### 🔥 Activity Streaks
**Status**: Schema ✅ | Logic ✅ | UI Partial ✅

**What's Ready**:
- Database table: `user_streaks`
- Automatic streak calculation (trigger function)
- Current streak and longest streak tracking
- Already displayed on ProfileScreen

**To Enhance**:
- Streak visualization (calendar view)
- Streak milestone notifications
- Streak freeze/protection (1 day forgiveness)

**UI Needed**:
- Calendar heatmap showing activity days
- Streak progress indicator
- Streak milestones (7, 30, 100 days)

**Estimated Time**: 3-4 hours

---

### 🔔 Notifications
**Status**: Schema ✅ | App ❌

**What's Ready**:
- Database table: `notifications`
- Notification types: activity_reaction, activity_comment, badge_earned, streak_milestone, unit_announcement
- Helper function: `create_notification()`

**To Implement**:
```typescript
// Create notification when someone reacts to activity
await supabase.rpc('create_notification', {
  p_user_id: activityOwnerId,
  p_type: 'activity_reaction',
  p_title: 'New Reaction',
  p_message: `${userName} reacted with 👍`,
  p_data: { activity_id: activityId },
});

// Fetch unread notifications
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false);
```

**UI Needed**:
- NotificationsScreen
- Bell icon in header with unread count
- Notification items with action buttons
- Mark as read functionality
- Push notifications (Expo Notifications)

**Estimated Time**: 6-8 hours

---

### 👥 Social Features (Follows)
**Status**: Schema ✅ | App ❌

**What's Ready**:
- Database table: `follows`
- Follow/unfollow logic
- Follower/following counts

**To Implement**:
- Follow/unfollow users
- View followers list
- View following list
- Follow suggestions (same unit, similar activity)

**UI Needed**:
- Follow button on user profiles
- Followers/Following lists
- Follow activity in feed

**Estimated Time**: 4-5 hours

---

### 👤 Enhanced Profile Features
**Status**: Schema ✅ | App Partial ✅

**What's Ready**:
- Privacy settings (profile_visibility, activity_visibility, show_statistics, show_location)
- OAuth provider tracking (Google, Apple)
- Last seen tracking
- Data consent tracking

**To Implement**:
- Privacy settings UI in Settings screen
- OAuth sign-in buttons (see [OAUTH_SETUP.md](./OAUTH_SETUP.md))
- "Last seen" display
- Data export feature

**UI Needed**:
- Settings > Privacy section
- OAuth login buttons on auth screens
- Data export button
- Account deletion confirmation

**Estimated Time**: 5-6 hours

---

### 🏢 Multi-Unit Support
**Status**: Schema ✅ | App ❌

**What's Ready**:
- Database table: `unit_memberships`
- Users can belong to multiple units
- Unit role tracking (member, leader, admin)

**To Implement**:
- Join/leave units
- Switch active unit
- View all joined units
- Unit discovery/search

**UI Needed**:
- UnitsScreen to view all units
- Unit switching in Settings
- "Join Unit" flow

**Estimated Time**: 5-7 hours

---

### 📸 Image Uploads
**Status**: Schema ✅ | Storage ✅ | App Partial ✅

**What's Ready**:
- Storage buckets: `avatars`, `activity-images`, `unit-avatars`
- RLS policies for secure uploads
- Database schema supports image URLs
- ✅ **Avatar upload** - Fully implemented in ProfileScreen

**Implemented**:
- ✅ Camera/photo library permissions enabled
- ✅ Avatar upload in profile edit modal
- ✅ Image picker with camera/library options
- ✅ Upload to Supabase storage bucket `avatars`
- ✅ Profile update with avatar URL

**To Implement**:
- Activity image uploads (multiple images per activity)
- Image compression and optimization
- Image gallery view for activities
- Unit avatar uploads

**UI Needed**:
- Image picker in activity creation
- Image gallery component for activities
- Image full-screen view

**Estimated Time**: 3-4 hours (for activity images)

---

### 🔍 Advanced Search
**Status**: Schema ✅ | App Partial ✅

**What's Ready**:
- Full-text search index on activities (German language)
- Client-side search in LogbookScreen

**To Enhance**:
- Server-side full-text search
- Search users
- Search units
- Search by tags
- Search filters (date range, type, location)

**UI Needed**:
- Global search bar
- Search results screen
- Advanced filters modal

**Estimated Time**: 4-5 hours

---

### 📊 Enhanced Statistics
**Status**: Schema ✅ (View created) | App Partial ✅

**What's Ready**:
- Database view: `user_statistics`
- Activity counts by type
- Total duration tracking
- Monthly/yearly stats

**To Enhance**:
- Charts and graphs (activity over time)
- Comparison with unit average
- Personal records (longest activity, most in a day)
- Export statistics

**UI Needed**:
- Statistics charts (react-native-chart-kit)
- Personal records section
- Unit comparison view

**Estimated Time**: 6-8 hours

---

## 🔐 OAuth Integration

**Status**: Schema ✅ | Auth Service ✅ | UI ❌

**What's Ready**:
- Google OAuth support in authService
- Apple OAuth support in authService
- OAuth callback handling
- Provider tracking in database

**Setup Required**:
1. Follow [OAUTH_SETUP.md](./OAUTH_SETUP.md)
2. Configure Google Cloud Console
3. Configure Apple Developer Portal
4. Enable in Supabase Dashboard
5. Add OAuth buttons to login/register screens

**UI Needed**:
- "Sign in with Google" button
- "Sign in with Apple" button
- OAuth loading states
- OAuth error handling

**Estimated Time**: 8-10 hours (including setup)

---

## 🔒 Privacy & GDPR Features

**Status**: Schema ✅ | Functions ✅ | UI ❌

**What's Ready**:
- Privacy settings (profile_visibility, activity_visibility, etc.)
- Data deletion request tracking
- Audit logging
- `anonymize_user_data()` function
- Data consent tracking

**To Implement**:
- Privacy settings UI
- "Download My Data" feature
- "Delete My Account" feature
- Consent management UI
- Audit log viewer (admin only)

**UI Needed**:
- Settings > Privacy screen
- Settings > Data & Privacy screen
- Consent management modal
- Account deletion confirmation flow

**Estimated Time**: 6-8 hours

See [PRIVACY_AND_GDPR.md](./PRIVACY_AND_GDPR.md) for full guide.

---

## 🚀 Future Features (Planned)

These features are planned but not yet in the database schema:

### 📅 Event Calendar
- Unit-wide events and trainings
- Event RSVPs
- Event reminders
- Integration with device calendar

**Estimated Time**: 10-12 hours

---

### 💬 Direct Messaging
- Private messages between users
- Group chats for units
- Message notifications
- Image sharing in messages

**Estimated Time**: 15-20 hours

---

### 📍 Location-Based Features
- Find nearby units
- Activity heatmap
- Location-based activity suggestions
- Emergency contact nearby units

**Note**: App permissions for location are currently disabled. To enable:
1. Add location permissions to `app.json` (iOS `infoPlist` and Android `permissions`)
2. Add location permission descriptions

**Estimated Time**: 8-10 hours (plus permission setup)

---

### 📈 Advanced Analytics
- Unit performance dashboards
- Activity trends analysis
- Response time tracking (for operations)
- Predictive analytics (busy periods)

**Estimated Time**: 12-15 hours

---

### 🏅 Leaderboards
- Unit leaderboards
- Regional leaderboards
- Activity type leaderboards
- Monthly competitions

**Estimated Time**: 6-8 hours

---

### 📱 Widgets
- Home screen widgets showing stats
- Quick log activity widget
- Streak widget

**Estimated Time**: 8-10 hours

---

### 🌐 Web Portal
- Admin dashboard
- Unit management interface
- Analytics and reporting
- User management

**Estimated Time**: 40-60 hours

---

### 🔊 Voice Logging
- Voice-to-text activity logging
- Quick voice notes
- Voice commands

**Estimated Time**: 10-12 hours

---

## 📊 Priority Ranking

Based on user value and implementation complexity:

### High Priority (Next Sprint)
1. **Badges & Achievements** - 4-6 hours
2. **Notifications** - 6-8 hours
3. **Image Uploads** - 4-6 hours
4. **OAuth (Google/Apple)** - 8-10 hours

**Total**: ~25-30 hours

### Medium Priority (Following Sprint)
1. **Social Features (Follows)** - 4-5 hours
2. **Enhanced Statistics** - 6-8 hours
3. **Privacy Settings UI** - 6-8 hours
4. **Multi-Unit Support** - 5-7 hours

**Total**: ~21-28 hours

### Low Priority (Backlog)
1. **Advanced Search** - 4-5 hours
2. **Event Calendar** - 10-12 hours
3. **Leaderboards** - 6-8 hours

---

## 🎯 Sprint Planning

### Sprint 1: Gamification (1-2 weeks)
- [ ] Implement badges
- [ ] Enhance streak visualization
- [ ] Create notifications system
- [ ] Add badge notification integration

### Sprint 2: Social & Content (1-2 weeks)
- [ ] Implement follows
- [ ] Add image uploads
- [ ] Create user profile enhancements
- [ ] Build notification screen

### Sprint 3: OAuth & Privacy (1-2 weeks)
- [ ] Set up Google OAuth
- [ ] Set up Apple OAuth
- [ ] Create privacy settings UI
- [ ] Implement data export

### Sprint 4: Advanced Features (2-3 weeks)
- [ ] Multi-unit support
- [ ] Enhanced statistics with charts
- [ ] Advanced search
- [ ] Unit management

---

## 📝 Notes

- All database schemas are production-ready and include:
  - Row Level Security (RLS) policies
  - Indexes for performance
  - Triggers for automation
  - Audit logging
  - GDPR compliance

- Supabase provides:
  - Realtime subscriptions (can be used for live updates)
  - Storage for images/files
  - Edge Functions (for serverless logic)
  - Automatic API generation

- The app architecture supports easy feature addition:
  - Centralized theme system
  - i18n ready
  - Clean separation of concerns
  - Reusable UI components

---

**Total Implementation Time Estimate**: ~150-200 hours for all features

**Database Readiness**: 90% complete (only new features like events, messaging need new tables)

**Current App Completion**: ~40% of planned features

