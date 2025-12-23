# 🔒 Privacy & GDPR Compliance Guide

This document outlines how Respondr ensures data privacy and complies with GDPR (General Data Protection Regulation) and other privacy regulations.

## 📋 Table of Contents

1. [Data Privacy Features](#data-privacy-features)
2. [GDPR Compliance](#gdpr-compliance)
3. [User Privacy Controls](#user-privacy-controls)
4. [Data Retention](#data-retention)
5. [Security Measures](#security-measures)
6. [Privacy Policy Template](#privacy-policy-template)

---

## 🛡️ Data Privacy Features

### Built-in Privacy Controls

The Respondr app includes comprehensive privacy features at the database level:

#### 1. **Profile Visibility Settings**
Users can control who sees their profile:
- **Public**: Visible to everyone
- **Unit**: Only visible to members of their unit
- **Private**: Only visible to themselves

#### 2. **Activity Visibility**
Users can set default visibility for their activities:
- **Public**: Anyone can see
- **Unit**: Only unit members
- **Private**: Only the user

#### 3. **Statistics Visibility**
Users can choose to hide their statistics from others.

#### 4. **Location Privacy**
- Users can opt-out of sharing location data
- Location data (GPS coordinates) can be disabled per user
- Location is never shared without explicit consent

**Note**: App permissions for location are currently disabled in `app.json`. The database supports location features, but users won't be prompted for location access until permissions are added back. See `APP_CONFIG_CHECKLIST.md` for details.

#### 5. **Image Privacy**
- Users can upload profile pictures (avatars)
- Images are stored securely in Supabase storage
- Users can change or remove their profile picture at any time
- Camera and photo library permissions are requested only when needed (avatar upload)

### Row Level Security (RLS)

All database tables use Supabase's Row Level Security:

```sql
-- Example: Users can only see activities based on visibility
CREATE POLICY "Users can view public activities"
  ON activities FOR SELECT
  USING (
    deleted_at IS NULL AND
    visibility = 'public'
  );

CREATE POLICY "Users can view unit activities"
  ON activities FOR SELECT
  USING (
    visibility = 'unit' AND
    unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
  );
```

**What this means:**
- Users can ONLY access data they're authorized to see
- Database enforces privacy at the query level
- No way to bypass privacy settings via API

---

## ⚖️ GDPR Compliance

### User Rights Implementation

#### 1. **Right to Access**

Users can export all their data via API:

```typescript
// Fetch all user data
const userData = await supabase
  .from('profiles')
  .select('*, activities(*), comments(*), reactions(*)')
  .eq('id', userId)
  .single();
```

**Implementation TODO**: Create "Download My Data" feature in Settings.

#### 2. **Right to Rectification**

Users can edit their profile data at any time:
- Name, bio, organization, rank, location
- Privacy preferences
- All changes are instant and audited

#### 3. **Right to Erasure (Right to be Forgotten)**

Implemented via `anonymize_user_data()` function:

```typescript
// Request account deletion
await supabaseAuth.requestAccountDeletion(reason);

// Admin can execute:
await supabase.rpc('anonymize_user_data', { user_uuid: userId });
```

**What happens:**
- Email changed to `deleted_[uuid]@deleted.local`
- Name changed to "Deleted User"
- Personal info (bio, location, etc.) removed
- Activities anonymized (titles changed, descriptions removed)
- Comments replaced with "[Deleted]"
- User marked as inactive
- Original relationships preserved for data integrity

#### 4. **Right to Data Portability**

Users can export data in JSON format:

```typescript
// Export all user activities
const activities = await supabase
  .from('activities')
  .select('*')
  .eq('user_id', userId)
  .csv();
```

**Implementation TODO**: Add "Export to JSON/CSV" button in Settings.

#### 5. **Right to Object**

Users can object to data processing:
- Marketing consent is opt-in (false by default)
- Users can disable all non-essential notifications
- Analytics tracking can be disabled (future feature)

#### 6. **Right to Restrict Processing**

Users can:
- Make profile/activities private (soft deletion)
- Disable all notifications
- Opt-out of optional features

---

## 🎛️ User Privacy Controls

### In-App Settings

#### Privacy Settings Screen

Users should have access to:

```typescript
// Example: Update privacy settings
await supabaseAuth.updatePrivacySettings({
  profileVisibility: 'unit',    // 'public' | 'unit' | 'private'
  activityVisibility: 'unit',   // 'public' | 'unit' | 'private'
  showStatistics: true,          // Show stats to others
  showLocation: false,           // Share location data
});
```

**Recommended UI**:
```
Settings > Privacy
├── Profile Visibility: [Public / Unit / Private]
├── Activity Visibility: [Public / Unit / Private]
├── Show Statistics: [Toggle]
├── Show Location: [Toggle]
├── Data Processing Consent: [View/Revoke]
└── Marketing Consent: [Toggle]
```

### Data Processing Consent

Required by GDPR, tracked in database:

```sql
-- In profiles table
data_processing_consent BOOLEAN NOT NULL DEFAULT true,
data_processing_consent_date TIMESTAMPTZ,
marketing_consent BOOLEAN NOT NULL DEFAULT false,
```

**Implementation:**
- Show consent dialog on first app launch
- Log consent date
- Allow users to view and revoke consent
- If consent revoked, disable data collection

---

## 📅 Data Retention

### Retention Policy

| Data Type | Retention Period | Notes |
|-----------|------------------|-------|
| Active user profiles | Indefinite | While account is active |
| Inactive accounts | 2 years | After last login |
| Activities | Indefinite | Linked to user |
| Deleted activities (soft) | 90 days | Then permanently deleted |
| Deleted comments (soft) | 90 days | Then permanently deleted |
| Audit logs | 1 year | For compliance |
| Deletion requests | 30 days after completion | |

### Automatic Cleanup

**Recommended Supabase Edge Function** (run daily):

```typescript
// cleanup-soft-deletes.ts
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

// Permanently delete soft-deleted activities
await supabase
  .from('activities')
  .delete()
  .not('deleted_at', 'is', null)
  .lt('deleted_at', ninetyDaysAgo.toISOString());

// Permanently delete soft-deleted comments
await supabase
  .from('comments')
  .delete()
  .not('deleted_at', 'is', null)
  .lt('deleted_at', ninetyDaysAgo.toISOString());
```

---

## 🔐 Security Measures

### 1. **Authentication Security**

- ✅ Secure password hashing (bcrypt via Supabase Auth)
- ✅ JWT token-based authentication
- ✅ Auto token refresh
- ✅ Session persistence with encryption
- ✅ OAuth support (Google, Apple)
- ✅ Multi-factor authentication ready (Supabase feature)

### 2. **Data Encryption**

- ✅ **In Transit**: All API calls use HTTPS/TLS 1.3
- ✅ **At Rest**: Supabase encrypts all data at rest (AES-256)
- ✅ **Backups**: Encrypted backups stored securely

### 3. **Access Control**

- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control (member, leader, admin)
- ✅ Unit-based data isolation
- ✅ User can only modify own data

### 4. **Audit Logging**

All sensitive actions are logged:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**What's logged:**
- Profile updates
- Activity creation/deletion
- Privacy setting changes
- Account deletion requests

### 5. **API Rate Limiting**

Supabase provides built-in rate limiting:
- Prevents brute force attacks
- Limits API calls per user/IP
- DDoS protection

---

## 📄 Privacy Policy Template

Below is a basic privacy policy template. **Customize for your organization!**

```markdown
# Privacy Policy for Respondr

**Last Updated**: [Date]

## 1. Introduction

Respondr ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information.

## 2. Data We Collect

### Personal Information
- Name and email address (required for account)
- Profile information (display name, bio, avatar)
- Organization and rank (optional)
- Location (optional, can be disabled) - **Note**: App location permissions currently disabled
- **Profile pictures (avatars)**: Users can upload photos, stored in Supabase storage

### Activity Data
- Training, exercise, and operation logs
- Activity duration, date, and type
- Location data (only if enabled) - **Note**: App location permissions currently disabled
- Photos and descriptions - **Note**: Activity image uploads not yet implemented

### Automatically Collected
- Device information (OS version, app version)
- Usage data (pages visited, features used)
- Log data (IP address, timestamps)

## 3. How We Use Your Data

We use your data to:
- Provide and improve the Respondr service
- Enable social features (activity feed, reactions, comments)
- Calculate statistics and achievements
- Send notifications (if enabled)
- Ensure security and prevent fraud
- Comply with legal obligations

## 4. Data Sharing

We **do not sell** your personal data. We may share data with:
- **Unit Members**: If you set visibility to "Unit"
- **Public**: If you set visibility to "Public"
- **Service Providers**: Supabase (hosting), cloud storage (for images)
- **Legal Requirements**: If required by law

## 5. Your Rights (GDPR)

You have the right to:
- **Access**: Download all your data
- **Rectify**: Edit your profile information
- **Erase**: Request account deletion
- **Restrict**: Make your data private
- **Port**: Export your data
- **Object**: Opt-out of marketing communications

To exercise these rights, go to **Settings > Privacy** in the app or contact us at [your-email@example.com].

## 6. Data Retention

- Active accounts: Data retained indefinitely
- Inactive accounts: Data retained for 2 years after last login
- Deleted accounts: Data anonymized within 30 days

## 7. Security

We implement industry-standard security measures:
- Encryption in transit (HTTPS/TLS)
- Encryption at rest (AES-256)
- Row-level security
- Regular security audits

## 8. Children's Privacy

Respondr is not intended for users under 16. We do not knowingly collect data from children.

## 9. Changes to This Policy

We may update this policy. We will notify you of significant changes via email or in-app notification.

## 10. Contact Us

For questions about this policy, contact:
- Email: [your-email@example.com]
- Address: [Your Organization Address]
- Data Protection Officer: [DPO Contact]

---

**EU Representative**: [If applicable, for GDPR]
**UK Representative**: [If applicable, for UK GDPR]
```

---

## ✅ Compliance Checklist

Before launch, ensure:

### Legal
- [ ] Privacy policy published and linked in app
- [ ] Terms of service created
- [ ] Cookie policy (if using web)
- [ ] Data processing agreement with Supabase
- [ ] GDPR representative appointed (if EU users)
- [ ] Privacy policy available in German (primary market)

### Technical
- [ ] All tables have RLS policies
- [ ] Soft delete implemented for personal data
- [ ] Audit logging enabled
- [ ] Data export feature implemented
- [ ] Account deletion feature implemented
- [ ] Consent tracking implemented
- [ ] Data retention policy automated

### User Experience
- [ ] Privacy settings easily accessible
- [ ] Consent dialog on first launch
- [ ] Clear data usage explanations
- [ ] Easy-to-understand privacy controls
- [ ] Transparent about data sharing

### Documentation
- [ ] Privacy policy reviewed by lawyer
- [ ] Data processing records maintained
- [ ] Incident response plan created
- [ ] Data breach notification procedures
- [ ] Staff trained on GDPR compliance

---

## 🆘 Data Breach Response

In case of a data breach:

1. **Contain**: Immediately isolate affected systems
2. **Assess**: Determine scope and severity
3. **Notify**: 
   - Users within 72 hours (GDPR requirement)
   - Supervisory authority (ICO, etc.)
4. **Remediate**: Fix vulnerability
5. **Document**: Record incident details

**Supabase Monitoring**:
- Enable database audit logs
- Set up alerts for unusual access patterns
- Regular security scans

---

## 📚 Resources

- **GDPR Full Text**: https://gdpr-info.eu/
- **Supabase Security**: https://supabase.com/docs/guides/platform/security
- **ICO GDPR Guide**: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/
- **Google OAuth Privacy**: https://developers.google.com/identity/protocols/oauth2
- **Apple Privacy**: https://developer.apple.com/app-store/app-privacy-details/

---

**Last Updated**: [Add date when you deploy]  
**Review Schedule**: Quarterly or when regulations change

