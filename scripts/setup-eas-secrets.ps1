# Script to set up EAS environment variables for Supabase
# Note: EXPO_PUBLIC_ variables are NOT secrets - they're public and visible in the compiled app
# Run this script to configure your Supabase credentials for EAS builds

Write-Host "Setting up EAS environment variables for Supabase..." -ForegroundColor Cyan
Write-Host "Note: These are PUBLIC variables (EXPO_PUBLIC_*) and will be visible in your compiled app" -ForegroundColor Yellow
Write-Host ""

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "❌ EAS CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "Please provide your Supabase credentials:" -ForegroundColor Yellow
Write-Host "You can find these in your Supabase project: Settings → API" -ForegroundColor Gray
Write-Host ""

# Prompt for Supabase URL
$supabaseUrl = Read-Host "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co)"

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "❌ Supabase URL is required" -ForegroundColor Red
    exit 1
}

# Prompt for Supabase Anon Key
$supabaseAnonKey = Read-Host "Enter your Supabase Anon Key"

if ([string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
    Write-Host "❌ Supabase Anon Key is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up EAS environment variables (Plain text visibility)..." -ForegroundColor Cyan

# Set EXPO_PUBLIC_SUPABASE_URL with plain text visibility
Write-Host "Setting EXPO_PUBLIC_SUPABASE_URL..." -ForegroundColor Gray
$urlResult = eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value $supabaseUrl --type string --visibility plain 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ EXPO_PUBLIC_SUPABASE_URL set successfully" -ForegroundColor Green
} else {
    # Check if secret already exists
    if ($urlResult -match "already exists") {
        Write-Host "⚠️  EXPO_PUBLIC_SUPABASE_URL already exists. Updating..." -ForegroundColor Yellow
        eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_URL --force
        eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value $supabaseUrl --type string --visibility plain
    } else {
        Write-Host "❌ Failed to set EXPO_PUBLIC_SUPABASE_URL" -ForegroundColor Red
        Write-Host $urlResult
    }
}

# Set EXPO_PUBLIC_SUPABASE_ANON_KEY with plain text visibility
Write-Host "Setting EXPO_PUBLIC_SUPABASE_ANON_KEY..." -ForegroundColor Gray
$keyResult = eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value $supabaseAnonKey --type string --visibility plain 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ EXPO_PUBLIC_SUPABASE_ANON_KEY set successfully" -ForegroundColor Green
} else {
    # Check if secret already exists
    if ($keyResult -match "already exists") {
        Write-Host "⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY already exists. Updating..." -ForegroundColor Yellow
        eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --force
        eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value $supabaseAnonKey --type string --visibility plain
    } else {
        Write-Host "❌ Failed to set EXPO_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Red
        Write-Host $keyResult
    }
}

Write-Host ""
Write-Host "✅ EAS environment variables configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Alternative: You can also set these directly in eas.json under the 'env' section" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a .env file for local development (optional)" -ForegroundColor White
Write-Host "2. Rebuild your app with: eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""

