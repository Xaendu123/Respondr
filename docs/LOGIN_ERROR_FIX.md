# Login Error Fix: "Cannot coerce the result to a single JSON object"

## Problem

Users were experiencing the error "Cannot coerce the result to a single JSON object" when trying to log in. This PostgREST error occurs when `.single()` is called but the query returns multiple rows instead of one.

## Root Cause

While the `profiles` table has `id` as the primary key (which should guarantee uniqueness), this error can occur if:

1. **Database constraint issue**: Primary key constraint might be missing or corrupted
2. **RLS policy issue**: Row Level Security policies might be allowing multiple rows through
3. **Database function/view**: A function or view might be returning multiple rows
4. **Race condition**: Multiple profile creation attempts during migration

## Solution

### 1. Improved Error Handling

Updated all profile queries to:
- Use `.maybeSingle()` instead of `.single()` for better error handling
- Detect the specific "Cannot coerce" error
- Fallback to `.limit(1)` if multiple rows are detected
- Log warnings when duplicates are found

### 2. Code Changes

**File**: `src/services/supabase/authService.ts`

**Functions Updated**:
- `signIn()` - Login function
- `getCurrentUserProfile()` - Get current user profile
- `handleOAuthCallback()` - OAuth callback handler

**Changes**:
- Replaced `.single()` with `.maybeSingle()` for safer queries
- Added error detection for "Cannot coerce" errors
- Added fallback logic to handle multiple rows gracefully
- Improved error messages for users

### 3. Database Verification

Verified that:
- ✅ No duplicate profiles exist (checked with `GROUP BY id HAVING COUNT(*) > 1`)
- ✅ No duplicate user_statistics exist
- ✅ Primary key constraint is intact

## Prevention

To prevent this issue in the future:

1. **Database Constraints**: Ensure primary key constraints are always enforced
2. **RLS Policies**: Review RLS policies to ensure they don't allow duplicate access
3. **Trigger Functions**: Ensure `handle_new_user()` trigger doesn't create duplicates
4. **Error Monitoring**: Monitor for this error in production logs

## Testing

To test the fix:

1. **Normal Login**: Should work as before
2. **If duplicates exist**: Will use the first profile and log a warning
3. **If no profile exists**: Will show a clear error message

## Next Steps

If the error persists:

1. **Check for duplicates**:
   ```sql
   SELECT id, COUNT(*) as count
   FROM profiles
   GROUP BY id
   HAVING COUNT(*) > 1;
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Check trigger function**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

## Files Modified

- `src/services/supabase/authService.ts`: Improved error handling for profile queries

