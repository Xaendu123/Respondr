# Setting Up Environment Variables

## For Local Development

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## For EAS Builds

**Important**: `EXPO_PUBLIC_` variables are NOT secrets - they're public and visible in your compiled app. Use "Plain text" visibility.

### Option 1: Set as EAS environment variables (Plain text visibility)

```bash
# Set Supabase URL (Plain text - safe for EXPO_PUBLIC_ variables)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co" --type string --visibility plain

# Set Supabase Anon Key (Plain text - safe for EXPO_PUBLIC_ variables)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here" --type string --visibility plain
```

### Option 2: Configure directly in `eas.json` (Recommended)

This is the simplest approach for `EXPO_PUBLIC_` variables since they're not sensitive:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project-id.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

## Getting Your Supabase Credentials

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

