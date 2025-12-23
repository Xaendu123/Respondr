# 🔐 Credential Autofill Setup Guide

This guide explains how to set up password/credential autofill so your phone can save and autofill login credentials for the Respondr app.

## What This Enables

✅ **iOS**: iPhone will offer to save passwords in iCloud Keychain and autofill them  
✅ **Android**: Google Password Manager will save and autofill credentials  
✅ **Secure**: Credentials are stored in the device's secure keychain/password manager  

---

## 📋 Prerequisites

- Domain: `respondr.ch` (must be accessible via HTTPS)
- Ability to add files to your web server (`.well-known` directory)
- App configured with bundle identifier: `ch.respondr.app`

---

## 🔧 Setup Steps

### Step 1: iOS - Apple App Site Association

Create a file at: `https://respondr.ch/.well-known/apple-app-site-association`

**File Content** (no file extension, Content-Type: `application/json`):

```json
{
  "webcredentials": {
    "apps": [
      "TEAM_ID.ch.respondr.app"
    ]
  }
}
```

**Important Notes:**
- Replace `TEAM_ID` with your Apple Developer Team ID
- Get your Team ID: [Apple Developer Account](https://developer.apple.com/account) → Membership → Team ID
- File must be served with `Content-Type: application/json`
- File must be accessible via HTTPS (not HTTP)
- No file extension (just `apple-app-site-association`, not `.json`)
- File size limit: 128KB

**Example Nginx configuration:**
```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Content-Type application/json;
}
```

**Verify:**
```bash
curl https://respondr.ch/.well-known/apple-app-site-association
```

---

### Step 2: Android - Digital Asset Links

Create a file at: `https://respondr.ch/.well-known/assetlinks.json`

**File Content:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ch.respondr.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Get SHA256 Fingerprint:**

1. **Development/Debug:**
   ```bash
   # Get debug keystore fingerprint (default Expo debug keystore)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. **Production/Release:**
   ```bash
   # Get release keystore fingerprint (after creating release keystore)
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

3. Look for `SHA256:` in the output and copy the fingerprint

**For EAS Build (Recommended):**
- Use the fingerprint from your EAS signing key
- Get it from: `eas credentials` → View signing key fingerprint
- Or add multiple fingerprints (debug + production) to support both:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ch.respondr.app",
      "sha256_cert_fingerprints": [
        "DEBUG_KEY_FINGERPRINT",
        "RELEASE_KEY_FINGERPRINT"
      ]
    }
  }
]
```

**Verify:**
```bash
curl https://respondr.ch/.well-known/assetlinks.json
```

Or use Google's verification tool:
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://respondr.ch&relation=delegate_permission/common.handle_all_urls

---

## 📱 App Configuration (Already Done)

The app is already configured with:

✅ **iOS (`app.json`):**
- `associatedDomains: ["webcredentials:respondr.ch"]`

✅ **Android (`app.json`):**
- `intentFilters` configured for `https://respondr.ch`

✅ **Input Fields:**
- Login: `textContentType="username"` and `textContentType="password"`
- Register: `textContentType="username"` and `textContentType="newPassword"`
- Android: `autoComplete="email"`, `autoComplete="password"`, `autoComplete="password-new"`

---

## 🧪 Testing

### iOS Testing

1. Build and install the app on a physical device (not simulator)
2. Open the app and go to login screen
3. Enter email and password
4. When you submit, iOS should prompt: **"Do you want to save this password in your iCloud Keychain?"**
5. Tap "Save Password"
6. Next time you open login screen, tap the email field
7. iOS should show saved credentials above the keyboard

**Troubleshooting:**
- Ensure domain file is accessible: `curl https://respondr.ch/.well-known/apple-app-site-association`
- Check Team ID matches your Apple Developer account
- File must be served with correct Content-Type
- Must be HTTPS (not HTTP)

### Android Testing

1. Build and install the app
2. Go to login screen
3. Enter email and password
4. Google Password Manager should prompt to save
5. Next time, credentials should autofill

**Troubleshooting:**
- Verify assetlinks.json is accessible
- Ensure SHA256 fingerprint matches your signing key
- Use Google's verification tool to check
- For release builds, use release keystore fingerprint

---

## 🔍 Verification Tools

### Apple App Site Association
```bash
# Check if file is accessible
curl -I https://respondr.ch/.well-known/apple-app-site-association

# Verify content
curl https://respondr.ch/.well-known/apple-app-site-association
```

### Android Asset Links
```bash
# Check if file is accessible
curl -I https://respondr.ch/.well-known/assetlinks.json

# Verify content
curl https://respondr.ch/.well-known/assetlinks.json
```

**Google Verification Tool:**
https://developers.google.com/digital-asset-links/tools/generator

Enter:
- **Site domain**: `respondr.ch`
- **Package name**: `ch.respondr.app`
- **SHA-256 fingerprint**: Your fingerprint

---

## 📝 Important Notes

1. **Domain Must Match**: The domain in your app config (`respondr.ch`) must exactly match the domain where the files are hosted

2. **HTTPS Required**: Both platforms require HTTPS (no HTTP allowed)

3. **File Location**: Files must be at:
   - iOS: `https://respondr.ch/.well-known/apple-app-site-association` (no extension)
   - Android: `https://respondr.ch/.well-known/assetlinks.json`

4. **Content-Type Headers**: 
   - iOS: `application/json`
   - Android: `application/json`

5. **File Size**: Keep files under 128KB

6. **Updates**: Changes to these files may take time to propagate (cache)

---

## 🚀 Production Checklist

- [ ] Created `apple-app-site-association` file on domain
- [ ] Created `assetlinks.json` file on domain
- [ ] Verified files are accessible via HTTPS
- [ ] Added correct Apple Team ID
- [ ] Added correct Android SHA256 fingerprint(s)
- [ ] Tested on physical iOS device
- [ ] Tested on Android device
- [ ] Verified autofill prompts appear
- [ ] Verified saved credentials autofill correctly

---

## 📚 Resources

- [Apple: Supporting Password AutoFill](https://developer.apple.com/documentation/security/password_autofill)
- [Google: Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Expo: Associated Domains](https://docs.expo.dev/guides/apple-authentication-services/)

---

**Need Help?**

- Check file accessibility with `curl`
- Verify Team ID in Apple Developer account
- Verify SHA256 fingerprint matches signing key
- Test on physical devices (not simulators)
- Check browser developer tools for HTTP headers

