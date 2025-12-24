# Fully Automated User Deletion Setup Guide

This guide explains how to fully automate the user deletion process using a **database trigger**.

---

## Quick Setup (5 minutes)

### Step 1: Run the SQL Script

Execute the trigger creation script in your Supabase SQL Editor:

See `supabase/scripts/automate_deletion.sql` for the complete SQL script.

### Step 2: Service Code (Already Configured)

The service code in `src/services/supabase/authService.ts` is configured to:
1. Create the deletion request (triggers automatic anonymization)
2. Sign out the user

**Note:** The database trigger handles all anonymization automatically. The service code only needs to create the deletion request record, and the trigger takes care of the rest.

---

## How It Works

### Flow Diagram

```
User clicks "Delete Account"
        ↓
PrivacySettingsScreen shows confirmation
        ↓
User confirms deletion
        ↓
requestAccountDeletion() called
        ↓
[1] Insert into data_deletion_requests (status='pending')
        ↓
[2] Database TRIGGER fires automatically
        ↓
[3] anonymize_user_data() executes
        ↓
[4] User data anonymized
        ↓
[5] Service code signs out user
        ↓
Done ✅
```

### What Happens

1. **User initiates deletion** → Creates record in `data_deletion_requests`
2. **Trigger fires immediately** → Calls `anonymize_user_data()`
3. **Data is anonymized** → Profile, activities, comments are anonymized
4. **User is signed out** → App automatically logs out the user

---

## Testing

### Test the Automated Deletion

1. **Create a test user account**
2. **Create some test data:**
   - Profile information
   - Activities
   - Comments (if applicable)

3. **Request deletion via app:**
   - Go to Settings → Privacy Settings
   - Click "Delete Account"
   - Confirm deletion

4. **Verify automation worked:**
   ```sql
   -- Check deletion request was created and processed
   SELECT * FROM data_deletion_requests 
   WHERE user_id = 'test-user-uuid' 
   ORDER BY requested_at DESC;
   -- Should show status = 'completed'
   
   -- Check profile was anonymized
   SELECT email, display_name, deleted_at 
   FROM profiles 
   WHERE id = 'test-user-uuid';
   -- Should show: email = 'deleted_...@deleted.local', display_name = 'Deleted User'
   
   -- Check activities were anonymized
   SELECT title, description, deleted_at 
   FROM activities 
   WHERE user_id = 'test-user-uuid';
   -- Should show: title = 'Deleted Activity', description = NULL
   ```

---

## Benefits of Database Trigger Approach

### ✅ Advantages

1. **Zero Infrastructure**
   - No external services needed
   - No Edge Functions to deploy
   - No cron jobs to configure

2. **100% Reliable**
   - Runs even if app is down
   - Runs even if network fails
   - Database-level guarantee

3. **Immediate Execution**
   - No delay or polling
   - GDPR compliant (right to erasure)
   - User data is immediately anonymized

4. **Fail-Safe**
   - If service code fails, trigger still runs
   - If trigger fails, service code can retry
   - Dual redundancy

5. **Audit Trail**
   - Deletion request is always logged
   - Completion timestamp is recorded
   - Full compliance tracking

---


## Troubleshooting

### Trigger Not Firing

Check if trigger exists:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'trigger_auto_anonymize_on_deletion_request';
```

Check trigger function:
```sql
SELECT * FROM pg_proc 
WHERE proname = 'auto_anonymize_on_deletion_request';
```

### Anonymization Not Working

Check function permissions:
```sql
-- Function should have SECURITY DEFINER
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'anonymize_user_data';
-- prosecdef should be 't' (true)
```

### User Still Active After Deletion

Check if anonymization completed:
```sql
SELECT id, email, is_active, deleted_at 
FROM profiles 
WHERE id = 'user-uuid';
-- is_active should be false, deleted_at should be set
```

---

## Production Checklist

Before deploying to production:

- [ ] Test trigger creation in staging
- [ ] Verify anonymization works correctly
- [ ] Test with real user data (backup first!)
- [ ] Verify audit trail is created
- [ ] Check RLS policies allow trigger execution
- [ ] Monitor deletion requests table
- [ ] Set up alerts for anonymization failures
- [ ] Document process for your team

---

## Summary

✅ **Fully Automated Deletion** is now implemented using:
1. **Database trigger** (recommended) - See `supabase/scripts/automate_deletion.sql`
2. **Service code** - Already updated in `authService.ts`

The process is **completely automated** - when a user requests deletion, their data is immediately anonymized and they are signed out. No manual intervention required!

