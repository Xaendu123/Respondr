# Script to fix common Metro bundler issues
# Run this from the project root directory

Write-Host "Fixing Metro Bundler issues..." -ForegroundColor Yellow

# 1. Kill processes on port 8081
Write-Host "`n1. Clearing port 8081..." -ForegroundColor Cyan
$connections = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processIds) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   Killed process $pid" -ForegroundColor Green
        } catch {
            Write-Host "   Could not kill process $pid" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   Port 8081 is free" -ForegroundColor Green
}

# 2. Clear Metro bundler cache (fixes "Unable to deserialize cloned data" error)
Write-Host "`n2. Clearing Metro bundler cache..." -ForegroundColor Cyan
$metroCachePaths = @(
    "$env:TEMP\metro-*",
    "$env:TEMP\haste-map-*",
    "$env:LOCALAPPDATA\Temp\metro-*",
    "$env:LOCALAPPDATA\Temp\haste-map-*"
)
foreach ($cachePath in $metroCachePaths) {
    $items = Get-ChildItem -Path $cachePath -ErrorAction SilentlyContinue
    if ($items) {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Cleared Metro cache: $cachePath" -ForegroundColor Green
    }
}
if (-not (Get-ChildItem -Path "$env:TEMP\metro-*" -ErrorAction SilentlyContinue)) {
    Write-Host "   Metro cache cleared" -ForegroundColor Green
}

# 3. Clear Expo cache
Write-Host "`n3. Clearing Expo cache..." -ForegroundColor Cyan
$expoCache = ".expo"
if (Test-Path $expoCache) {
    Remove-Item -Path $expoCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleared .expo directory" -ForegroundColor Green
} else {
    Write-Host "   No .expo directory found" -ForegroundColor Yellow
}

# 4. Clear node_modules/.cache and Metro file map cache
Write-Host "`n4. Clearing node_modules and Metro file map cache..." -ForegroundColor Cyan
$nodeCache = "node_modules\.cache"
if (Test-Path $nodeCache) {
    Remove-Item -Path $nodeCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleared node_modules cache" -ForegroundColor Green
} else {
    Write-Host "   No node_modules cache found" -ForegroundColor Yellow
}

# Clear Metro file map cache (fixes deserialization errors)
$metroFileMapCache = "node_modules\metro-file-map\cache"
if (Test-Path $metroFileMapCache) {
    Remove-Item -Path $metroFileMapCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cleared Metro file map cache" -ForegroundColor Green
}

# 5. Clear watchman (if installed)
Write-Host "`n5. Clearing Watchman (if installed)..." -ForegroundColor Cyan
try {
    $watchman = Get-Command watchman -ErrorAction SilentlyContinue
    if ($watchman) {
        watchman watch-del-all 2>$null
        Write-Host "   Cleared Watchman watches" -ForegroundColor Green
    } else {
        Write-Host "   Watchman not installed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Watchman not available" -ForegroundColor Yellow
}

Write-Host "`n✅ Metro bundler cleanup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx expo start --clear" -ForegroundColor White
Write-Host "2. If issues persist, try: npm start -- --reset-cache" -ForegroundColor White

