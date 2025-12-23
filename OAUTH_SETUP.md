# 🔐 OAuth Setup Guide (Google & Apple Sign-In)

This guide explains how to set up Google and Apple OAuth authentication for the Respondr app.

## 📋 Prerequisites

- Supabase project created
- Database schema deployed (`schema_enhanced.sql`)
- `.env` file configured

---

## 🔵 Google OAuth Setup

### 1. Create Google Cloud Project (5 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

### 2. Configure OAuth Consent Screen

1. Click **Configure Consent Screen**
2. Choose **External** (for public app)
3. Fill in:
   - **App name**: Respondr
   - **User support email**: your-email@example.com
   - **App logo**: Upload Respondr logo
   - **App domain**: Leave blank for now
   - **Developer contact**: your-email@example.com
4. Click **Save and Continue**
5. **Scopes**: Add `email` and `profile` (already selected by default)
6. **Test users**: Add test emails if in development
7. Click **Save and Continue**

### 3. Create OAuth Client IDs

You need **THREE** client IDs for full support:

#### A. Web Client (Required for Supabase)

1. **Application type**: Web application
2. **Name**: Respondr Web
3. **Authorized JavaScript origins**:
   ```
   https://your-project-ref.supabase.co
   ```
4. **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
5. Click **Create**
6. **Save** the Client ID and Client Secret

#### B. iOS Client

1. **Application type**: iOS
2. **Name**: Respondr iOS
3. **Bundle ID**: Get from `app.json` → `ios.bundleIdentifier`
   ```
   ch.respondr.app
   ```
4. Click **Create**
5. **Save** the iOS Client ID

#### C. Android Client

1. **Application type**: Android
2. **Name**: Respondr Android
3. **Package name**: Get from `app.json` → `android.package`
   ```
   ch.respondr.app
   ```
4. **SHA-1 certificate fingerprint**: 
   ```bash
   # For development (debug keystore)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For production (your signing keystore)
   keytool -list -v -keystore /path/to/your/release.keystore -alias your-alias
   ```
5. Copy the SHA-1 fingerprint and paste it
6. Click **Create**
7. **Save** the Android Client ID

### 4. Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it ON
3. Enter:
   - **Client ID**: (Web Client ID from step 3A)
   - **Client Secret**: (Web Client Secret from step 3A)
4. Click **Save**

### 5. Update App Configuration

Add to your `.env`:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

---

## 🍎 Apple Sign-In Setup

### 1. Apple Developer Account Setup (10 min)

1. Go to [Apple Developer](https://developer.apple.com/)
2. Enroll in Apple Developer Program ($99/year) if not already
3. Navigate to **Certificates, Identifiers & Profiles**

### 2. Create App ID

1. Click **Identifiers** → **+** (Add)
2. Select **App IDs** → Continue
3. Choose **App** → Continue
4. Configure:
   - **Description**: Respondr
   - **Bundle ID**: Explicit - `ch.respondr.app`
   - **Capabilities**: Check **Sign in with Apple**
5. Click **Continue** → **Register**

### 3. Create Services ID (for Supabase)

1. Click **Identifiers** → **+** (Add)
2. Select **Services IDs** → Continue
3. Configure:
   - **Description**: Respondr Web Service
   - **Identifier**: `ch.respondr.app.service`
4. Click **Continue** → **Register**
5. Click on your newly created Services ID
6. Check **Sign in with Apple** → **Configure**
7. Settings:
   - **Primary App ID**: Select your App ID from step 2
   - **Web Domain**: `your-project-ref.supabase.co`
   - **Return URLs**: `https://your-project-ref.supabase.co/auth/v1/callback`
8. Click **Save** → **Continue** → **Register**

### 4. Create Key for Sign in with Apple

1. Click **Keys** → **+** (Add)
2. Configure:
   - **Key Name**: Respondr Sign in with Apple Key
   - **Enable**: Check **Sign in with Apple**
   - Click **Configure** → Select your Primary App ID
3. Click **Save** → **Continue** → **Register**
4. **Download the .p8 key file** (you can only download once!)
5. **Save the Key ID** (10 characters, e.g., `ABC123DEFG`)

### 5. Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and toggle it ON
3. Enter:
   - **Services ID**: `ch.respondr.app.service`
   - **Team ID**: Find in Apple Developer → **Membership** (10 characters)
   - **Key ID**: From step 4
   - **Private Key**: Open the .p8 file and paste the content
4. Click **Save**

### 6. Update App Configuration

Add to your `.env`:
```bash
EXPO_PUBLIC_APPLE_SERVICE_ID=ch.respondr.app.service
```

---

## 📱 App Integration

### Install Required Packages

```bash
npx expo install expo-auth-session expo-web-browser expo-crypto
npx expo install @react-native-google-signin/google-signin
npx expo install expo-apple-authentication
```

### Update `app.json`

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "ch.respondr.app",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "ch.respondr.app"
    },
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR-IOS-CLIENT-ID"
        }
      ],
      "expo-apple-authentication"
    ]
  }
}
```

### Auth Service Integration

The OAuth functions are already prepared in `src/services/supabase/authService.ts`:

```typescript
// Google Sign-In
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'your-app-scheme://auth-callback',
  },
});

// Apple Sign-In
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: 'your-app-scheme://auth-callback',
  },
});
```

---

## 🧪 Testing

### Test Google Sign-In

1. Run app on device/emulator
2. Click "Sign in with Google"
3. Select Google account
4. Grant permissions
5. Should redirect back to app with user logged in

### Test Apple Sign-In

1. Run app on iOS device (Apple Sign-In doesn't work on simulator in development)
2. Click "Sign in with Apple"
3. Use Face ID / Touch ID or Apple ID password
4. Choose to share or hide email
5. Should redirect back to app with user logged in

### Verify in Supabase

1. Go to **Authentication** → **Users**
2. Check that new users appear with:
   - Provider: `google` or `apple`
   - Email from their Google/Apple account
3. Go to **Database** → **profiles**
4. Verify profile was auto-created via trigger

---

## 🔒 Security Best Practices

### 1. Never Commit Client Secrets

Add to `.gitignore`:
```
.env
.env.local
google-services.json
GoogleService-Info.plist
*.p8
```

### 2. Use Environment-Specific Credentials

```bash
# Development
.env.development

# Production
.env.production
```

### 3. Rotate Keys Regularly

- Rotate Google Client Secrets annually
- Rotate Apple Keys every 2 years
- Update Supabase configuration when rotating

### 4. Monitor OAuth Usage

- Check Google Cloud Console → **APIs & Services** → **Dashboard**
- Check Apple Developer → **Certificates, Identifiers & Profiles** → Usage
- Monitor Supabase → **Authentication** → **Providers** for auth attempts

---

## 🐛 Common Issues & Solutions

### Google Sign-In

| Issue | Solution |
|-------|----------|
| "Invalid client" error | Verify Web Client ID and Secret in Supabase match Google Cloud Console |
| OAuth consent screen error | Ensure app is published or test users are added |
| Redirect mismatch | Verify redirect URI in Google Console exactly matches Supabase callback URL |
| Android SHA-1 error | Regenerate SHA-1 with correct keystore and update in Google Console |

### Apple Sign-In

| Issue | Solution |
|-------|----------|
| "Invalid client" error | Verify Services ID in Supabase matches Apple Developer |
| Private key error | Ensure .p8 file content is pasted correctly (including BEGIN/END lines) |
| Domain not verified | Wait 24-48 hours after adding domain in Apple Developer |
| iOS simulator not working | Use real device for Apple Sign-In testing |

### General

| Issue | Solution |
|-------|----------|
| User not created in profiles table | Check Supabase logs, verify `handle_new_user` trigger is active |
| Redirect not working | Check URL scheme in `app.json` matches redirect configuration |
| Environment variables not loading | Restart Expo dev server after adding/changing `.env` |

---

## 📊 Monitoring & Analytics

### Track OAuth Usage

Monitor these metrics in your Supabase dashboard:

1. **Authentication** → **Users**:
   - Total users by provider
   - Daily/weekly signups
   - Auth failure rate

2. **Logs** → **Auth Logs**:
   - Failed login attempts
   - Provider errors
   - Token refresh issues

### Set Up Alerts

Create alerts for:
- High auth failure rate (> 5%)
- Unusual login patterns
- API quota warnings (Google Cloud Console)

---

## ✅ Launch Checklist

Before going to production:

- [ ] Google OAuth Consent Screen **published** (not in testing)
- [ ] Apple Services ID configured with production domain
- [ ] All client IDs updated in production `.env`
- [ ] Production keystores/certificates configured
- [ ] Privacy policy URL added to OAuth consent screens
- [ ] Terms of service URL added to OAuth consent screens
- [ ] Data usage disclosure submitted to Google and Apple
- [ ] Test OAuth flow on production build
- [ ] Monitor auth logs for first 24 hours

---

## 🆘 Need Help?

- **Supabase OAuth Docs**: https://supabase.com/docs/guides/auth/social-login
- **Google OAuth**: https://support.google.com/cloud/answer/6158849
- **Apple Sign-In**: https://developer.apple.com/sign-in-with-apple/
- **Expo Auth**: https://docs.expo.dev/guides/authentication/

---

**Setup Time**: ~30 minutes (excluding Apple Developer enrollment)  
**Cost**: Apple Developer Program ($99/year) - Google is free

