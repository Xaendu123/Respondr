# Respondr Architecture Documentation

## Overview

This document explains the architecture of the Respondr application, a production-ready React Native app built with Clean Architecture principles, design tokens, theming, internationalization, and white-labeling support.

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Project Structure](#project-structure)
3. [Design Tokens](#design-tokens)
4. [Theme System](#theme-system)
5. [Brand Configuration](#brand-configuration)
6. [Internationalization (i18n)](#internationalization-i18n)
7. [Component Architecture](#component-architecture)
8. [Business Logic Separation](#business-logic-separation)
9. [How to Extend](#how-to-extend)

---

## Architecture Principles

### 1. Single Source of Truth
All configuration values are centralized:
- ✅ Colors, fonts, spacing → `src/config/tokens.ts` and `src/config/theme.ts`
- ✅ Brand assets → `src/config/brand.ts`
- ✅ Translations → `src/i18n/locales/*.json`
- ❌ **NEVER** hardcode values in components

### 2. Semantic Tokens
Use semantic naming that describes purpose, not appearance:
- ✅ `primary`, `background`, `textPrimary`, `surface`
- ❌ `red`, `blue`, `darkGray`

### 3. White-Label Ready
Branding is completely configurable:
- Logos, colors, fonts in `src/config/brand.ts`
- Changing brand requires **zero** component changes

### 4. UI vs Business Logic Separation
- **UI Components**: Pure presentational, no business logic
- **Hooks**: Business logic, API calls, state management
- **Services**: API clients, data transformations

### 5. Internationalization First
- Default language: German (de)
- All user-visible text via `useTranslation()` hook
- ❌ **NEVER** hardcode strings in components

---

## Project Structure

```
src/
├── config/           # Configuration files (single source of truth)
│   ├── tokens.ts     # Design tokens (spacing, typography, shadows)
│   ├── theme.ts      # Theme system (colors, semantic tokens)
│   └── brand.ts      # Brand configuration (white-labeling)
│
├── types/            # TypeScript type definitions
│   └── index.ts      # Domain entities (Activity, UserProfile, etc.)
│
├── i18n/             # Internationalization
│   ├── config.ts     # i18n setup
│   └── locales/      # Language files
│       ├── de.json   # German (default)
│       └── en.json   # English
│
├── providers/        # React Context providers
│   ├── ThemeProvider.tsx
│   ├── BrandProvider.tsx
│   ├── I18nProvider.tsx
│   └── AppProviders.tsx
│
├── hooks/            # Custom hooks (business logic)
│   ├── useActivities.ts
│   └── useTranslation.ts
│
├── components/       # UI Components
│   └── ui/           # Themed base components
│       ├── Text.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Avatar.tsx
│       └── index.ts
│
└── screens/          # Screen components
    └── FeedScreen.tsx
```

---

## Design Tokens

**File**: `src/config/tokens.ts`

Design tokens are the foundational values for spacing, typography, shadows, and animations.

### Usage

```typescript
import { tokens } from '../config/tokens';

// ✅ Correct - use tokens
const styles = {
  padding: tokens.spacing.md,
  fontSize: tokens.typography.fontSize.lg,
  borderRadius: tokens.borderRadius.lg,
};

// ❌ Wrong - hardcoded values
const styles = {
  padding: 16,
  fontSize: 18,
  borderRadius: 12,
};
```

### Adding New Tokens

1. Add the value to `tokens.ts`
2. Reference it in components via `useTheme()` hook (for theme-aware tokens) or direct import

---

## Theme System

**File**: `src/config/theme.ts`

The theme system provides semantic color tokens and supports multiple themes (light/dark/system).

### Themes

- **Light Theme**: Default light mode
- **Dark Theme**: Dark mode with proper contrast
- **System Theme**: Follows device preference

### Usage in Components

```typescript
import { useTheme } from '../providers/ThemeProvider';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    }}>
      <Text style={{ color: theme.colors.textPrimary }}>
        Content
      </Text>
    </View>
  );
}
```

### How to Add a New Theme

1. Create a new `ThemeColors` object in `theme.ts`:

```typescript
const highContrastThemeColors: ThemeColors = {
  primary: '#000000',
  // ... other colors
};

export const themes = {
  light: createTheme(lightThemeColors),
  dark: createTheme(darkThemeColors),
  highContrast: createTheme(highContrastThemeColors), // New theme
} as const;
```

2. Update `ThemeName` type if needed
3. No component changes required!

### How to Change Theme Colors

1. Edit color values in `lightThemeColors` or `darkThemeColors` objects
2. **Do NOT** change semantic token names (they define usage, not color)
3. Ensure contrast ratios meet accessibility standards (WCAG AA minimum)

---

## Brand Configuration

**File**: `src/config/brand.ts`

Brand configuration enables white-labeling without touching component code.

### Configuration Options

- `appName`: Application name
- `appTagline`: Tagline displayed in app
- `logo`, `logoLight`, `logoDark`: Logo assets
- `appIcon`, `splashImage`: App icons and splash
- `brandColors`: Primary, secondary, accent colors
- `brandFonts`: Font family overrides
- `metadata`: Support email, legal URLs

### Usage in Components

```typescript
import { useBrand } from '../providers/BrandProvider';

function MyComponent() {
  const brand = useBrand();
  
  return (
    <Text>{brand.appName}</Text>
  );
}
```

### How to Rebrand the App

1. **Update Brand Config** (`src/config/brand.ts`):
   ```typescript
   export const defaultBrandConfig: BrandConfig = {
     appName: 'YourAppName',
     brandColors: {
       primary: '#YOUR_COLOR',
       // ...
     },
     // ...
   };
   ```

2. **Replace Assets**:
   - Add logo files to `assets/brand/`
   - Update paths in `brandConfig`

3. **Done!** No component code changes needed.

### White-Labeling for Multiple Brands

Create multiple brand configs:

```typescript
// src/config/brands/fireDepartment.ts
export const fireDepartmentBrand: BrandConfig = { /* ... */ };

// src/config/brands/ems.ts
export const emsBrand: BrandConfig = { /* ... */ };

// In AppProviders.tsx
<BrandProvider brandConfig={selectedBrand}>
```

---

## Internationalization (i18n)

**Files**: 
- `src/i18n/config.ts` - i18n setup
- `src/i18n/locales/*.json` - Language files

Default language: **German (de)**

### Usage in Components

```typescript
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('home.title')}</Text>
  );
}
```

### How to Add a New Language

1. **Create Language File** (`src/i18n/locales/fr.json`):
   ```json
   {
     "common": {
       "loading": "Chargement...",
       ...
     }
   }
   ```

2. **Register in i18n Config** (`src/i18n/config.ts`):
   ```typescript
   resources: {
     de: { translation: de },
     en: { translation: en },
     fr: { translation: fr }, // Add new language
   }
   ```

3. **Done!** No component changes needed.

### Translation Keys Structure

Translation keys follow a hierarchical structure:

```
{
  "namespace": {
    "key": "Value",
    "nested": {
      "key": "Nested value"
    }
  }
}
```

Access via: `t('namespace.key')` or `t('namespace.nested.key')`

### Interpolation

```json
{
  "greeting": "Hello, {{name}}"
}
```

```typescript
t('greeting', { name: 'John' }) // "Hello, John"
```

---

## Component Architecture

### Base UI Components

All UI components are in `src/components/ui/` and use theme tokens.

**Available Components**:
- `Text` - Themed text with variants
- `Button` - Themed button with variants
- `Card` - Themed card container
- `Avatar` - User avatar with fallback

### Creating New Components

1. **Use Theme Tokens**:
   ```typescript
   import { useTheme } from '../providers/ThemeProvider';
   
   function MyComponent() {
     const { theme } = useTheme();
     return (
       <View style={{ 
         padding: theme.spacing.md,
         backgroundColor: theme.colors.surface,
       }} />
     );
   }
   ```

2. **Use i18n for Text**:
   ```typescript
   const { t } = useTranslation();
   return <Text>{t('myComponent.title')}</Text>;
   ```

3. **Export from `index.ts`**:
   ```typescript
   export { MyComponent } from './MyComponent';
   ```

### Component Rules

- ✅ Use `useTheme()` for all styling values
- ✅ Use `useTranslation()` for all text
- ✅ Use `useBrand()` for brand-specific values
- ❌ No hardcoded colors, spacing, or strings
- ❌ No business logic (use hooks instead)

---

## Business Logic Separation

Business logic lives in **custom hooks**, not in components.

### Example: Activities Hook

**File**: `src/hooks/useActivities.ts`

```typescript
export function useActivities(filter: ActivityFilter) {
  // Business logic: API calls, state management, filtering
  const [activities, setActivities] = useState<Activity[]>([]);
  // ...
  
  return { activities, loading, error, refresh };
}
```

**Usage in Component**:

```typescript
function FeedScreen() {
  const { activities, loading } = useActivities('all');
  // UI only - no business logic here
  return <View>...</View>;
}
```

### Rules

- ✅ Hooks contain: API calls, state management, data transformation
- ✅ Components contain: UI rendering, event handlers
- ❌ No API calls in components
- ❌ No complex calculations in components

---

## How to Extend

### Adding a New Theme

See [Theme System](#theme-system) section above.

### Adding a New Language

See [Internationalization](#internationalization-i18n) section above.

### Rebranding the App

See [Brand Configuration](#brand-configuration) section above.

### Adding a New Screen

1. Create screen file: `src/screens/MyScreen.tsx`
2. Use theme, i18n, and hooks:
   ```typescript
   import { useTheme } from '../providers/ThemeProvider';
   import { useTranslation } from '../hooks/useTranslation';
   import { Text, Button } from '../components/ui';
   ```
3. Create business logic hook if needed: `src/hooks/useMyFeature.ts`
4. Add route in navigation (expo-router automatically picks up files in `app/`)

### Adding a New UI Component

1. Create component: `src/components/ui/MyComponent.tsx`
2. Use `useTheme()` for all styling
3. Export from `src/components/ui/index.ts`
4. Document usage in component file

### Adding Domain Entities

1. Add type definition: `src/types/index.ts`
2. Use in hooks/services
3. TypeScript will enforce type safety throughout

---

## Best Practices Summary

### ✅ DO

- Use theme tokens for all styling
- Use i18n for all text
- Separate business logic into hooks
- Use semantic token names
- Export components from index files
- Add TypeScript types for all entities

### ❌ DON'T

- Hardcode colors, spacing, or strings
- Put business logic in components
- Use color names in tokens (use semantic names)
- Create components without theme support
- Skip type definitions

---

## Error Handling & Safe Defaults

The architecture provides fallbacks:

- **Missing translations**: Shows translation key as fallback
- **Missing theme tokens**: Uses default theme values
- **Missing brand config**: Uses `defaultBrandConfig`
- **Missing assets**: Components handle null gracefully

The app should never crash due to misconfiguration.

---

## Questions?

For questions about architecture, refer to:
1. This documentation
2. Example implementations in `src/screens/FeedScreen.tsx`
3. Configuration files in `src/config/`

