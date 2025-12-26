# Metro Bundler Errors

Common Metro bundler errors and how to fix them.

## Quick Fix Script

Run the automated fix script:
```powershell
.\scripts\fix-metro-bundler.ps1
```

## Common Errors

### 1. Port 8081 Already in Use

**Error:**
```
Port 8081 is being used by another process
```

**Fix:**
```powershell
# Kill process on port 8081
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process -Force

# Or use a different port
npx expo start --port 8082
```

### 2. Metro Bundler Cache Issues

**Error:**
```
Unable to resolve module...
Module not found...
```

**Fix:**
```bash
# Clear all caches
npx expo start --clear

# Or manually
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### 2a. Corrupted Metro Cache (Deserialization Error)

**Error:**
```
Error: Unable to deserialize cloned data due to invalid or unsupported version.
```

**Cause:** Metro cache was created with a different Node.js version or is corrupted.

**Fix:**
```powershell
# Run the fix script
.\scripts\fix-metro-bundler.ps1

# Or manually clear all Metro caches
Remove-Item -Recurse -Force "$env:TEMP\metro-*"
Remove-Item -Recurse -Force "$env:TEMP\haste-map-*"
Remove-Item -Recurse -Force "node_modules\.cache"
Remove-Item -Recurse -Force ".expo"

# Then restart
npx expo start --clear
```

### 3. Watchman Issues (macOS/Linux)

**Error:**
```
Watchman error: unable to resolve root...
```

**Fix:**
```bash
watchman watch-del-all
npx expo start --clear
```

### 4. Module Resolution Errors

**Error:**
```
Unable to resolve module '...' from '...'
```

**Fix:**
1. Check if module is installed:
   ```bash
   npm install
   ```

2. Clear cache and restart:
   ```bash
   npx expo start --clear
   ```

3. Check `metro.config.js` for incorrect blockList entries

### 5. Transform Errors

**Error:**
```
TransformError: ...
```

**Fix:**
1. Check `babel.config.js` syntax
2. Ensure all Babel plugins are installed
3. Clear cache:
   ```bash
   npx expo start --clear
   ```

### 6. Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Fix:**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npx expo start
```

### 7. Network Errors

**Error:**
```
Network request failed
fetch failed
```

**Fix:**
1. Check firewall settings
2. Ensure device and computer are on same network
3. Try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

## Metro Config Issues

### BlockList Causing Problems

If modules are incorrectly blocked, check `metro.config.js`:

```javascript
// Remove or fix incorrect blockList entries
blockList: [
  // Only block modules you're sure you don't need
]
```

### Platform Resolution Issues

If you see platform-specific errors:

```javascript
// Ensure platforms array is correct
platforms: ['ios', 'android']
```

## Debugging Steps

### 1. Enable Verbose Logging

```bash
npx expo start --verbose
```

### 2. Check Metro Bundler Logs

Look for:
- Module resolution errors
- Transform errors
- Network errors
- Cache issues

### 3. Reset Everything

```bash
# Kill Metro
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process -Force

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TEMP/metro-*

# Reinstall dependencies
rm -rf node_modules
npm install

# Start fresh
npx expo start --clear
```

### 4. Check for Conflicting Processes

```powershell
# Check what's using port 8081
Get-NetTCPConnection -LocalPort 8081

# Check for multiple Node processes
Get-Process node
```

## Prevention

1. **Always use `--clear` after dependency changes**
2. **Kill Metro before restarting** if it's stuck
3. **Check port availability** before starting
4. **Keep Metro config simple** - avoid aggressive optimizations in dev

## Still Having Issues?

1. Check Expo CLI version: `npx expo --version`
2. Update Expo: `npm install -g expo-cli@latest`
3. Check Node version: `node --version` (should be 18+)
4. Try development build instead: `npx expo run:ios` or `npx expo run:android`

