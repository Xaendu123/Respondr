# Script to clean Gradle cache and fix corruption issues
# Run this from the project root directory
# Fixes "Incompatible magic value 0 in class file" errors

Write-Host "Cleaning Gradle cache..." -ForegroundColor Yellow

# Stop all Gradle daemons
Write-Host "`n1. Stopping Gradle daemons..." -ForegroundColor Cyan
cd android
.\gradlew.bat --stop
cd ..

# Delete the corrupted Gradle 8.14.3 cache (includes class files and metadata)
$gradleCachePath = "$env:USERPROFILE\.gradle\caches\8.14.3"
if (Test-Path $gradleCachePath) {
    Write-Host "`n2. Removing Gradle 8.14.3 cache directory (fixes corrupted class files and metadata)..." -ForegroundColor Cyan
    Remove-Item -Path $gradleCachePath -Recurse -Force
    Write-Host "   Removed: $gradleCachePath" -ForegroundColor Green
} else {
    Write-Host "`n2. Gradle 8.14.3 cache directory not found (may have been cleaned already)" -ForegroundColor Yellow
}

# Clean the Gradle build cache (contains corrupted settings files)
$buildCachePath = "$env:USERPROFILE\.gradle\caches\build-cache-1"
if (Test-Path $buildCachePath) {
    Write-Host "`n3. Removing Gradle build cache (fixes corrupted settings files)..." -ForegroundColor Cyan
    Remove-Item -Path $buildCachePath -Recurse -Force
    Write-Host "   Removed: $buildCachePath" -ForegroundColor Green
} else {
    Write-Host "`n3. Gradle build cache directory not found" -ForegroundColor Yellow
}

# Clean the Gradle caches directory (may contain other corrupted files)
$cachesPath = "$env:USERPROFILE\.gradle\caches"
if (Test-Path "$cachesPath\modules-2") {
    Write-Host "`n4. Cleaning Gradle modules cache..." -ForegroundColor Cyan
    Remove-Item -Path "$cachesPath\modules-2" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleaned modules cache" -ForegroundColor Green
}

# Clean the Gradle daemon cache (contains corrupted settings class files)
$daemonCachePath = "$env:USERPROFILE\.gradle\daemon"
if (Test-Path $daemonCachePath) {
    Write-Host "`n5. Removing Gradle daemon cache (fixes corrupted settings class files)..." -ForegroundColor Cyan
    Remove-Item -Path $daemonCachePath -Recurse -Force
    Write-Host "   Removed: $daemonCachePath" -ForegroundColor Green
} else {
    Write-Host "`n5. Gradle daemon cache directory not found" -ForegroundColor Yellow
}

# Clean CMake build cache for native modules (fixes corrupted object files)
Write-Host "`n6. Cleaning CMake build cache for native modules..." -ForegroundColor Cyan
$nativeModules = @("react-native-worklets", "react-native-reanimated")
foreach ($module in $nativeModules) {
    $cmakeCachePath = "node_modules\$module\android\.cxx"
    if (Test-Path $cmakeCachePath) {
        Remove-Item -Path $cmakeCachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Cleaned CMake cache: $module" -ForegroundColor Green
    }
}

# Clean the project's build directories
Write-Host "`n7. Cleaning project build directories..." -ForegroundColor Cyan
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force
    Write-Host "   Removed: android\build" -ForegroundColor Green
}
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force
    Write-Host "   Removed: android\app\build" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force
    Write-Host "   Removed: android\.gradle" -ForegroundColor Green
}

# Clean any remaining corrupted class files in the Gradle cache
Write-Host "`n8. Cleaning any remaining corrupted class files..." -ForegroundColor Cyan
$cachesPath = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $cachesPath) {
    # Remove all settings_* compiled class files
    Get-ChildItem -Path $cachesPath -Filter "settings_*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleaned corrupted settings files" -ForegroundColor Green
    
    # Remove the specific corrupted file if it exists
    $corruptedFile = "settings_69elq8tf7vled9t5yzl4z0gjb"
    Get-ChildItem -Path $cachesPath -Filter "*$corruptedFile*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   Removed specific corrupted file: $corruptedFile" -ForegroundColor Green
}

# Clean the entire Gradle cache directory (nuclear option if corruption persists)
Write-Host "`n9. Performing deep cache cleanup..." -ForegroundColor Cyan
$gradleHome = "$env:USERPROFILE\.gradle"
if (Test-Path "$gradleHome\caches") {
    # Remove all cache subdirectories except wrapper
    Get-ChildItem -Path "$gradleHome\caches" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "wrapper" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleaned all Gradle cache subdirectories (except wrapper)" -ForegroundColor Green
}

Write-Host "`n✅ Gradle cache cleanup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. In Android Studio: File → Invalidate Caches → Invalidate and Restart" -ForegroundColor White
Write-Host "2. After restart, the Gradle sync should work correctly" -ForegroundColor White


