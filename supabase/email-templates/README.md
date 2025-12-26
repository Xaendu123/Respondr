# Supabase Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Templates Included

- **password-reset.html** - English password reset email template
- **password-reset-de.html** - German password reset email template

## How to Apply These Templates

### Step 1: Access Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Password Reset Template

1. Click on the **Reset Password** template section
2. Copy the contents of `password-reset.html` (for English) or `password-reset-de.html` (for German)
3. Paste it into the **HTML** field in the Supabase dashboard
4. Click **Save**

### Step 3: Verify Template Variables

Ensure these Supabase template variables are present:
- `{{ .ConfirmationURL }}` - The password reset link (required)

### Step 4: Test the Template

1. Use the "Send test email" feature in Supabase dashboard
2. Or trigger a password reset from your app
3. Verify the email renders correctly in different email clients

## Template Features

### Design Elements

- **Brand Colors**: Uses Respondr brand colors (#0891B2, #06B6D4)
- **Gradient Header**: Matches the app's visual style
- **Icon Design**: Three emergency service icons (fire, lightning, medical)
- **Responsive**: Works on desktop and mobile email clients

### Content Sections

1. **Header**: Branded header with app name and tagline
2. **Greeting**: Personalized greeting
3. **Message**: Clear instructions for password reset
4. **Button**: Prominent call-to-action button
5. **Link Fallback**: Plain text link for email clients that don't support HTML
6. **Security Note**: Important security information
7. **Footer**: Contact information and links

### Customization

To customize the templates:

1. **Colors**: Update the gradient colors in the `.header` and `.reset-button` CSS
2. **Branding**: Change app name, tagline, and icons in the HTML
3. **Content**: Modify the greeting and message text
4. **Links**: Update footer links (support email, website, privacy policy)

## Matching Sign-Up Template

This password reset template is designed to match your sign-up email template. If you need to update the sign-up template to match this style:

1. Use the same header design (gradient, icons, app name)
2. Keep consistent styling and colors
3. Use similar button styles and layout
4. Maintain the same footer structure

## Language Support

Currently available:
- ✅ English (`password-reset.html`)
- ✅ German (`password-reset-de.html`)

To add more languages:
1. Copy one of the existing templates
2. Translate the text content
3. Save as `password-reset-{lang}.html`
4. Apply in Supabase dashboard

## Notes

- The template uses inline CSS for maximum email client compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
- The `{{ .ConfirmationURL }}` variable is automatically replaced by Supabase
- Links expire after 1 hour (configured in Supabase settings)

## Troubleshooting

### Template Not Updating

1. Clear browser cache
2. Wait a few minutes for changes to propagate
3. Check that you saved the template in Supabase dashboard

### Email Not Sending

1. Check Supabase email settings
2. Verify SMTP configuration (if using custom SMTP)
3. Check spam folder
4. Verify email address is correct

### Styling Issues

1. Some email clients strip certain CSS (use inline styles)
2. Test in multiple email clients
3. Use table-based layouts for complex designs (if needed)

## Related Files

- `src/config/brand.ts` - Brand configuration (colors, metadata)
- `src/services/supabase/authService.ts` - Password reset function
- `app/login.tsx` - Login screen with forgot password functionality

