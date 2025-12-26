# RLS Profile Creation Fix

## Problem

The "Database error saving new user" error occurs because:

1. **RLS Policy for Profile INSERT** (line 335-337 in `schema_enhanced.sql`):
   ```sql
   CREATE POLICY "Users can insert own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = id);
   ```
   This policy requires that `auth.uid() = id`, which means the authenticated user's ID must match the profile ID being inserted.

2. **Trigger Function** (line 521-540):
   ```sql
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
   ```
   The function is marked as `SECURITY DEFINER`, which should bypass RLS, but there might be an issue.

## Root Cause

The issue is likely one of these:

1. **Trigger not installed**: The trigger `on_auth_user_created` might not be set up in your Supabase database
2. **RLS blocking manual insert**: When the app tries to manually create a profile (fallback), RLS might be blocking it because the user session isn't fully established yet
3. **Function permissions**: The `handle_new_user()` function might not have the right permissions to bypass RLS

## Solution

### Option 1: Verify and Fix the Trigger (Recommended)

Run this SQL in your Supabase SQL Editor to ensure the trigger is properly set up:

```sql
-- First, check if the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If it doesn't exist, create it:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Option 2: Fix RLS Policy for Manual Profile Creation

If the trigger fails, the app tries to manually create the profile. We need to ensure RLS allows this. Update the RLS policy:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive policy that allows:
-- 1. Users to insert their own profile (auth.uid() = id)
-- 2. The trigger function to insert profiles (SECURITY DEFINER should handle this, but this is a backup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    -- Allow if user is authenticated and inserting their own profile
    (auth.uid() IS NOT NULL AND auth.uid() = id)
  );
```

### Option 3: Use Service Role for Manual Profile Creation (Not Recommended)

If the above doesn't work, you could use the service role key for manual profile creation, but this is less secure and not recommended.

## Verification Steps

1. **Check if trigger exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Check if function exists**:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. **Test the trigger manually**:
   ```sql
   -- This should create a profile automatically
   -- (Don't actually run this, it's just for testing)
   INSERT INTO auth.users (id, email, ...) VALUES (...);
   ```

4. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

## Recommended Fix

Run this complete SQL script in your Supabase SQL Editor:

```sql
-- Ensure the function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify RLS policy allows inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## After Applying the Fix

1. Test user registration in your app
2. Check the Supabase logs to see if the trigger fires
3. Verify that profiles are created automatically
4. If manual creation is still needed, ensure the user is fully authenticated before attempting the insert

## Additional Notes

- The `SECURITY DEFINER` function should bypass RLS, but sometimes there can be issues with function permissions
- Make sure the function owner has the necessary permissions
- The trigger should fire automatically when a new user is created via Supabase Auth
- If the trigger doesn't fire, check Supabase logs for errors

