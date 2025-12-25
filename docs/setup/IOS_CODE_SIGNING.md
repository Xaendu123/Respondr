# iOS Code Signing Setup

This project is configured for **automatic code signing** using EAS Build. EAS Build handles all code signing automatically, so you don't need to manually manage certificates or provisioning profiles.

## How It Works

EAS Build uses Apple's automatic code signing feature, which:
- Automatically generates and manages certificates
- Creates and updates provisioning profiles
- Handles code signing during the build process
- No manual certificate or profile management required

## Configuration

The project is already configured for automatic signing:

- **Bundle Identifier**: `ch.respondr.app`
- **Apple Team**: Managed through EAS credentials
- **Deployment Target**: iOS 15.4
- **Build Profiles**: Configured in `eas.json`

## Setting Up Credentials

To set up your Apple Developer credentials with EAS:

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```

3. **Configure iOS credentials**:
   ```bash
   eas credentials
   ```
   
   Select:
   - Platform: `iOS`
   - Build profile: Choose the profile you want to configure (development, preview, or production)
   - Follow the prompts to set up your Apple Developer account

4. **Choose credential management**:
   - **Automatic (Recommended)**: EAS will manage everything automatically
   - **Manual**: You can provide your own certificates and profiles

## Build Profiles

The project has three build profiles configured:

### Development
- **Purpose**: Internal testing and development
- **Distribution**: Internal
- **Code Signing**: Automatic (managed by EAS)
- **Build Configuration**: Debug

### Preview
- **Purpose**: Internal distribution for testing
- **Distribution**: Internal
- **Code Signing**: Automatic (managed by EAS)
- **Build Configuration**: Release

### Production
- **Purpose**: App Store submission
- **Distribution**: App Store
- **Code Signing**: Automatic (managed by EAS)
- **Build Configuration**: Release
- **Auto Increment**: Enabled (build number increments automatically)

## Building Your App

Once credentials are set up, you can build your app:

```bash
# Development build
eas build --platform ios --profile development

# Preview build
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

## Troubleshooting

### Archive Failures

If you encounter archive failures:

1. **Check credentials**:
   ```bash
   eas credentials
   ```
   Verify that your Apple Developer account is properly configured.

2. **Verify bundle identifier**:
   - Ensure `ch.respondr.app` exists in your Apple Developer account
   - Check App Store Connect to confirm the app is registered

3. **Check Apple Team ID**:
   - Your Apple Team ID should be configured in EAS credentials
   - You can find it in your Apple Developer account

4. **Review build logs**:
   - Check the EAS Build dashboard for detailed error messages
   - Look for code signing or certificate-related errors

### Common Issues

- **"No provisioning profile found"**: Run `eas credentials` and ensure automatic signing is enabled
- **"Invalid bundle identifier"**: Verify the bundle ID in `app.json` matches your Apple Developer account
- **"Certificate expired"**: EAS will automatically renew certificates, but you may need to run `eas credentials` again

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Code Signing Guide](https://docs.expo.dev/app-signing/app-credentials/)
- [Apple Developer Portal](https://developer.apple.com/account/)

## Notes

- EAS Build uses automatic code signing by default
- Certificates and provisioning profiles are managed automatically
- No need to manually download or install certificates
- The build process handles all code signing steps automatically

