# Privacy Policy Information - Respondr

This document contains all technical information relevant for drafting the Respondr privacy policy. It describes what data is collected, how it's stored, processed, and shared.

---

## 1. App Overview

- **App Name:** Respondr
- **Bundle ID:** ch.respondr.app
- **Description:** Activity logging and social platform for first responders
- **Supported Languages:** German (de), English (en)
- **Region:** Switzerland / EU
- **Website:** https://respondr.ch
- **Support Email:** info@respondr.ch

---

## 2. Data Collection

### 2.1 User Profile Data

| Field | Required | Description |
|-------|----------|-------------|
| Email | Yes | Used for account authentication and communication |
| Display Name | Yes | Public-facing name shown in the app |
| First Name | No | Personal identification |
| Last Name | No | Personal identification |
| Avatar | No | Profile image uploaded by user |
| Bio | No | User's self-description |
| Organization/Unit | No | User's fire department or rescue unit |
| Rank/Title | No | Professional rank within organization |
| Location | No | General location (city/region) |

### 2.2 Activity Data

Users log activities with the following information:

| Field | Required | Description |
|-------|----------|-------------|
| Type | Yes | Training, Exercise, or Operation |
| Title | Yes | Activity name/description |
| Date & Time | Yes | When the activity occurred |
| Duration | Yes | Length of activity (minutes) |
| Description | No | Detailed description |
| Situation | No | Context/situation description |
| Lessons Learned | No | Takeaways from the activity |
| Location (Town) | No | Town/city where activity took place |
| Location (Street) | No | Street address (not collected for operations) |
| GPS Coordinates | No | Latitude/longitude (optional, off by default) |
| Category | No | Operation category classification |
| False Alarm Flag | No | Whether operation was a false alarm |
| Tags | No | Comma-separated keywords |
| Images | No | Photos associated with the activity |
| Visibility | Yes | Public, Unit, or Private |

### 2.3 Social Interaction Data

| Data Type | Description |
|-----------|-------------|
| Reactions | User reactions to activities (respect, strong, teamwork, impressive) |
| Comments | Text comments on activities |
| Badges | Earned achievements and milestones |
| Streaks | Consecutive days with logged activities |

### 2.4 Preference Data

| Preference | Description |
|------------|-------------|
| Theme | Light, Dark, or System preference |
| Language | German or English |
| Notification Settings | Email and push notification preferences |
| Privacy Settings | Visibility controls for profile and activities |

### 2.5 Data NOT Collected

- **No analytics tracking** - No third-party analytics services (Google Analytics, Mixpanel, Segment, etc.)
- **No crash reporting** - No services like Sentry or Bugsnag
- **No advertising identifiers** - No ad tracking
- **No device fingerprinting** - No unique device identification beyond standard app functionality
- **No background location tracking** - Location only captured when user explicitly adds it to an activity

---

## 3. Data Storage

### 3.1 Primary Database: Supabase

- **Service Provider:** Supabase Inc.
- **Infrastructure:** AWS EU Central (Frankfurt)
- **Database Type:** PostgreSQL
- **Project URL:** https://nbdmoapoiqxyjrrhzqvg.supabase.co

#### Database Tables

| Table | Purpose |
|-------|---------|
| profiles | User account and profile information |
| activities | Activity logs created by users |
| reactions | User reactions to activities |
| comments | User comments on activities |
| user_badges | Badges earned by users |
| user_streaks | Activity streak tracking |
| units | Organization/unit information |
| data_deletion_requests | GDPR deletion request tracking |
| audit_logs | Compliance audit trail |

### 3.2 File Storage: Supabase Storage

- **Bucket: avatars** - User profile images
- **Activity images** - Photos attached to activities

### 3.3 Local Device Storage: AsyncStorage

Data stored locally on the user's device:

| Data | Purpose |
|------|---------|
| Access Token | Authentication session |
| Refresh Token | Session renewal |
| User Profile Cache | Offline access to profile data |
| Theme Preference | Remember user's theme choice |
| Language Preference | Remember user's language choice |

---

## 4. Third-Party Services

### 4.1 Supabase (Backend Services)

- **Purpose:** Authentication, database, file storage, real-time features
- **Data Shared:** All user data is stored in Supabase
- **Privacy Policy:** https://supabase.com/privacy
- **Data Location:** EU (Frankfurt)

### 4.2 OAuth Providers

#### Google OAuth
- **Purpose:** Alternative sign-in method
- **Data Received:** Email, name, profile picture
- **Privacy Policy:** https://policies.google.com/privacy

#### Apple Sign-In
- **Purpose:** Alternative sign-in method
- **Data Received:** Email (can be hidden), name
- **Privacy Policy:** https://www.apple.com/legal/privacy/

### 4.3 Expo (Development Platform)

- **Purpose:** App development and build infrastructure
- **Runtime Services:** Navigation, image picker, file system, localization
- **Privacy Policy:** https://expo.dev/privacy

### 4.4 No Additional Third-Party Services

The app does NOT use:
- Analytics services
- Advertising networks
- Crash reporting services
- Push notification services (beyond native)
- Payment processors
- Social media SDKs

---

## 5. Device Permissions

### 5.1 iOS Permissions

| Permission | Purpose | Usage |
|------------|---------|-------|
| Camera | Taking photos | Profile pictures and activity photos |
| Photo Library | Selecting photos | Profile pictures and activity photos |

### 5.2 Android Permissions

| Permission | Purpose |
|------------|---------|
| CAMERA | Taking profile and activity photos |
| READ_EXTERNAL_STORAGE | Accessing photos for upload |
| WRITE_EXTERNAL_STORAGE | Saving exported data |
| READ_MEDIA_IMAGES | Accessing photos on Android 13+ |

### 5.3 Permissions NOT Requested

- Location (GPS) - Not requested as a permission; users manually enter location data
- Contacts - Not accessed
- Microphone - Not accessed
- Background App Refresh - Not used
- Push Notifications - Not currently implemented

---

## 6. Authentication & Security

### 6.1 Authentication Methods

| Method | Description |
|--------|-------------|
| Email/Password | Traditional sign-up with email confirmation |
| Google OAuth | Sign in with Google account |
| Apple Sign-In | Sign in with Apple ID |

### 6.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| HTTPS Only | All network requests use TLS 1.2+ |
| PKCE Flow | Secure OAuth implementation for mobile |
| Email Confirmation | Required before account activation |
| Password Reset | Secure token-based reset via email |
| Session Management | Automatic token refresh with secure storage |
| Row-Level Security | Database-enforced access controls |

### 6.3 Token Storage

- Access and refresh tokens stored in AsyncStorage (device-local)
- Tokens cleared on logout
- 30-second network timeout for requests

---

## 7. Data Visibility & Sharing

### 7.1 Activity Visibility Levels

| Level | Who Can See |
|-------|-------------|
| Public | All app users |
| Unit | Members of the same organization/unit |
| Private | Only the activity creator |

### 7.2 Profile Visibility Levels

| Level | Who Can See |
|-------|-------------|
| Public | All app users |
| Unit | Members of the same organization/unit |
| Private | Only the profile owner |

### 7.3 Privacy Controls

Users can control:
- Profile visibility (public/unit/private)
- Activity default visibility
- Whether statistics are shown to others
- Whether location is included in activities
- Marketing communication preferences

### 7.4 Social Interactions

- Reactions and comments are only possible on activities the user can view
- User identity (display name, avatar) is visible when reacting or commenting
- Badges earned are visible based on profile visibility settings

---

## 8. Data Retention & Deletion

### 8.1 Data Retention

- User data retained indefinitely while account is active
- Individual activities can be deleted by the user at any time
- All data anonymized upon account deletion request

### 8.2 Account Deletion (Right to be Forgotten)

Users can request account deletion through Privacy Settings. The process:

1. User submits deletion request
2. Request logged in `data_deletion_requests` table
3. Automated anonymization process executes:

**Profile Anonymization:**
- Email → `deleted_{uuid}@deleted.local`
- Display Name → "Deleted User"
- First/Last Name → Removed
- Avatar → Removed
- Bio → Removed
- Location → Removed
- Account marked as inactive

**Activity Anonymization:**
- Title → "Deleted Activity"
- Description → Removed
- Location → Removed
- GPS Coordinates → Removed
- Images → Removed

**Comment Anonymization:**
- Text → "[Deleted]"

### 8.3 Soft Delete Pattern

All deletions use soft delete (records retain `deleted_at` timestamp):
- Maintains referential integrity
- Allows audit trail
- Prevents accidental data loss

### 8.4 Data Export (Right to Data Portability)

Users can export all their data as JSON:
- Profile information
- All activities
- All comments
- All reactions
- All badges earned

---

## 9. Consent Management

### 9.1 Required Consent

**Data Processing Consent**
- Required to use the app
- Covers: Activity logging, profile management, app functionality
- Recorded with timestamp in database

### 9.2 Optional Consent

**Marketing Communications**
- Opt-in (not enabled by default)
- Covers: Feature updates, tips, promotional content via email
- Can be changed anytime in Privacy Settings

### 9.3 Consent Dialog

First app launch displays consent dialog:
- Explains data processing
- Requests marketing consent (optional)
- Must accept data processing to proceed

---

## 10. Privacy Defaults

### 10.1 Default Settings for New Users

| Setting | Default Value |
|---------|---------------|
| Profile Visibility | Public |
| Activity Visibility | Public |
| Show Statistics | Yes |
| Show Location | **No** (privacy-friendly default) |
| Marketing Consent | Yes |

### 10.2 Privacy-by-Design Features

- Location sharing disabled by default
- Street address not collected for operations (operational security)
- Privacy settings hidden from other users
- Row-Level Security enforced at database level

---

## 11. Children's Privacy

- App is not directed at children under 16
- No age verification implemented
- No special handling for children's data
- Intended audience: Adult first responders

---

## 12. International Data Transfers

### 12.1 Data Location

- Primary data storage: EU (AWS Frankfurt via Supabase)
- OAuth providers may process data in their respective locations:
  - Google: Global
  - Apple: Global

### 12.2 GDPR Compliance

The app implements:
- Right to Access (view all personal data)
- Right to Rectification (edit profile and activities)
- Right to Erasure (account deletion)
- Right to Data Portability (JSON export)
- Right to Object (marketing consent)
- Data Processing Consent
- Privacy by Default

---

## 13. Audit & Compliance

### 13.1 Audit Logging

The `audit_logs` table records:
- User ID
- Action type (create/update/delete/view)
- Affected table and record
- Changes made (JSONB)
- IP address (if available)
- User agent
- Timestamp

### 13.2 Deletion Request Tracking

The `data_deletion_requests` table tracks:
- Request timestamp
- User ID
- Reason (optional)
- Status (pending/processing/completed)
- Completion timestamp

---

## 14. Contact Information

**Data Controller:**
- Company: Respondr
- Website: https://respondr.ch
- Email: info@respondr.ch

**For Privacy Inquiries:**
- Email: info@respondr.ch
- Privacy Policy: https://respondr.ch/privacy
- Terms of Service: https://respondr.ch/terms

---

## 15. Technical Implementation References

| Topic | Source File |
|-------|-------------|
| User Types | `src/types/index.ts` |
| Auth Service | `src/services/supabase/authService.ts` |
| Activity Service | `src/services/supabase/activitiesService.ts` |
| Profile Service | `src/services/supabase/profileService.ts` |
| Privacy Settings | `src/screens/PrivacySettingsScreen.tsx` |
| Database Schema | `supabase/schema/schema_enhanced.sql` |
| Anonymization Script | `supabase/scripts/automate_deletion.sql` |
| Supabase Config | `src/config/supabase.ts` |
| App Config | `app.json` |

---

## 16. Summary of Data Processing

| Category | Data | Legal Basis | Retention |
|----------|------|-------------|-----------|
| Account | Email, password hash | Contract performance | Until account deletion |
| Profile | Name, avatar, bio | Contract performance | Until account deletion |
| Activities | Logs, photos, location | Consent | Until deletion by user |
| Social | Reactions, comments | Legitimate interest | Until account deletion |
| Preferences | Theme, language | Consent | Until account deletion |
| Marketing | Email consent | Consent | Until withdrawn |

---

*Last Updated: January 2026*
*Document Version: 1.0*
