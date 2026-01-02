# Supabase Email Templates - Multilingual Setup

## Overview
This document explains how to configure Supabase email templates to be multilingual based on user language preferences stored in `auth.users.raw_user_meta_data`.

## How It Works

When a user registers, their language preference is automatically stored in the `raw_user_meta_data` column of the `auth.users` table. This metadata is accessible in Supabase email templates using the `{{ .Data.language }}` variable.

## Supported Languages

Currently supported languages:
- `en` - English
- `de` - German

## Accessing User Metadata in Templates

In Supabase email templates, you can access user metadata using:
- `{{ .Data.first_name }}` - User's first name
- `{{ .Data.last_name }}` - User's last name
- `{{ .Data.language }}` - User's language preference (e.g., "en", "de")

## Template Structure

Use conditional statements (`if/else`) to display content in the appropriate language:

```go
{{if eq .Data.language "de" }}
  <!-- German content -->
{{ else }}
  <!-- English content (default) -->
{{end}}
```

## Email Templates to Update

### 1. Confirm Signup Email

**Template Name:** `Confirm signup`

**Location:** Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Template:**

```html
{{if eq .Data.language "de" }}
<h2>Hallo, {{ .Data.first_name }} {{ .Data.last_name }}!</h2>
<p>Bitte bestätigen Sie Ihr Konto, indem Sie auf den folgenden Link klicken:</p>
<p><a href="{{ .ConfirmationURL }}">Konto bestätigen</a></p>
<p>Falls Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren.</p>
<p>Mit freundlichen Grüssen,<br>Das Respondr Team</p>
{{ else }}
<h2>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</h2>
<p>Please confirm your account by clicking the following link:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>If you didn't sign up, you can safely ignore this email.</p>
<p>Best regards,<br>The Respondr Team</p>
{{end}}
```

### 2. Magic Link Email

**Template Name:** `Magic Link`

**Location:** Supabase Dashboard → Authentication → Email Templates → Magic Link

**Template:**

```html
{{if eq .Data.language "de" }}
<h2>Hallo, {{ .Data.first_name }} {{ .Data.last_name }}!</h2>
<p>Klicken Sie auf den folgenden Link, um sich anzumelden:</p>
<p><a href="{{ .ConfirmationURL }}">Anmelden</a></p>
<p>Dieser Link ist 1 Stunde gültig.</p>
<p>Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
<p>Mit freundlichen Grüssen,<br>Das Respondr Team</p>
{{ else }}
<h2>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</h2>
<p>Click the following link to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>This link is valid for 1 hour.</p>
<p>If you didn't request this sign-in, you can safely ignore this email.</p>
<p>Best regards,<br>The Respondr Team</p>
{{end}}
```

### 3. Change Email Address Email

**Template Name:** `Change Email Address`

**Location:** Supabase Dashboard → Authentication → Email Templates → Change Email Address

**Template:**

```html
{{if eq .Data.language "de" }}
<h2>E-Mail-Adresse ändern</h2>
<p>Hallo, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert. Klicken Sie auf den folgenden Link, um die Änderung zu bestätigen:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail-Adresse bestätigen</a></p>
<p>Falls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
<p>Mit freundlichen Grüssen,<br>Das Respondr Team</p>
{{ else }}
<h2>Change Email Address</h2>
<p>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>You have requested to change your email address. Click the following link to confirm the change:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>
<p>If you didn't request this change, you can safely ignore this email.</p>
<p>Best regards,<br>The Respondr Team</p>
{{end}}
```

### 4. Reset Password Email

**Template Name:** `Reset Password`

**Location:** Supabase Dashboard → Authentication → Email Templates → Reset Password

**Template:**

```html
{{if eq .Data.language "de" }}
<h2>Passwort zurücksetzen</h2>
<p>Hallo, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>Sie haben eine Passwort-Reset-Anfrage gestellt. Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
<p><a href="{{ .ConfirmationURL }}">Passwort zurücksetzen</a></p>
<p>Dieser Link ist 1 Stunde gültig.</p>
<p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.</p>
<p>Mit freundlichen Grüssen,<br>Das Respondr Team</p>
{{ else }}
<h2>Reset Password</h2>
<p>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>You have requested to reset your password. Click the following link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>This link is valid for 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
<p>Best regards,<br>The Respondr Team</p>
{{end}}
```

### 5. Reauthentication Email

**Template Name:** `Reauthentication`

**Location:** Supabase Dashboard → Authentication → Email Templates → Reauthentication

**Template:**

```html
{{if eq .Data.language "de" }}
<h2>Erneute Authentifizierung</h2>
<p>Hallo, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>Sie müssen sich erneut authentifizieren. Klicken Sie auf den folgenden Link:</p>
<p><a href="{{ .ConfirmationURL }}">Authentifizieren</a></p>
<p>Dieser Link ist 1 Stunde gültig.</p>
<p>Mit freundlichen Grüssen,<br>Das Respondr Team</p>
{{ else }}
<h2>Reauthentication</h2>
<p>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</p>
<p>You need to reauthenticate. Click the following link:</p>
<p><a href="{{ .ConfirmationURL }}">Authenticate</a></p>
<p>This link is valid for 1 hour.</p>
<p>Best regards,<br>The Respondr Team</p>
{{end}}
```

## Adding New Languages

To add support for a new language:

1. **Update the app code:**
   - Add the language to `src/i18n/config.ts`
   - Create translation files in `src/i18n/locales/[locale].json`

2. **Update email templates:**
   - Add a new condition in each template:
   ```go
   {{if eq .Data.language "de" }}
     <!-- German -->
   {{ else if eq .Data.language "fr" }}
     <!-- French -->
   {{ else }}
     <!-- English (default) -->
   {{end}}
   ```

3. **Test:**
   - Register a new user with the new language preference
   - Verify the email is sent in the correct language

## Testing

To test multilingual emails:

1. **Create test users with different language preferences:**
   ```javascript
   // German user
   await supabase.auth.signUp({
     email: 'test-de@example.com',
     password: 'password123',
     options: {
       data: { language: 'de', first_name: 'Max', last_name: 'Mustermann' }
     }
   });
   
   // English user
   await supabase.auth.signUp({
     email: 'test-en@example.com',
     password: 'password123',
     options: {
       data: { language: 'en', first_name: 'John', last_name: 'Doe' }
     }
   });
   ```

2. **Check the emails:**
   - Verify German users receive German emails
   - Verify English users receive English emails
   - Verify users without language preference receive English (default)

## Language Metadata Update

The language preference is automatically:
- **Set during signup** - Based on the user's current app language
- **Updated when changed** - When user changes language in settings, the auth metadata is updated

## Troubleshooting

### Email shows default language instead of user's preference

1. Check that `raw_user_meta_data` contains `language` field:
   ```sql
   SELECT raw_user_meta_data->>'language' 
   FROM auth.users 
   WHERE email = 'user@example.com';
   ```

2. Verify the template syntax is correct (Go template syntax)

3. Check that the language code matches exactly (case-sensitive: "de" not "DE")

### User metadata not updating

- Ensure `updateProfile` is called when language changes
- Check that `supabase.auth.updateUser()` is being called with the new language

## References

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Go Template Syntax](https://pkg.go.dev/text/template)
- [Customizing Emails by Language](https://supabase.com/docs/guides/auth/auth-deep-links#customizing-emails-by-language)

