# Respondr

A production-ready React Native application for social activity and logging for first responders, built with Clean Architecture principles.

## Architecture

This app follows strict architecture rules:

- ✅ **Centralized Configuration**: All values (colors, spacing, fonts) in config files
- ✅ **Design Tokens**: Semantic token system for styling
- ✅ **Theme System**: Light/dark/system themes with runtime switching
- ✅ **White-Label Ready**: Complete brand configuration system
- ✅ **Internationalization**: Full i18n support (German default, English included)
- ✅ **Clean Architecture**: Separation of UI and business logic
- ✅ **Type Safety**: Full TypeScript support

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Project Structure

```
src/
├── config/           # Centralized configuration
│   ├── tokens.ts     # Design tokens
│   ├── theme.ts      # Theme system
│   └── brand.ts      # Brand configuration
├── types/            # TypeScript types
├── i18n/             # Internationalization
├── providers/        # React Context providers
├── hooks/            # Business logic hooks
├── components/       # UI components
└── screens/          # Screen components
```

## Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive documentation on:

- Architecture principles
- Design tokens system
- Theme system (how to add themes, change colors)
- Brand configuration (how to white-label)
- Internationalization (how to add languages)
- Component architecture
- Business logic separation

## Key Features

### Theme System
- Light/dark/system themes
- Runtime theme switching
- Persistent theme preference
- Semantic color tokens

### Internationalization
- German (default) and English included
- Easy to add new languages
- All text via translation keys

### Brand Configuration
- White-label ready
- Centralized brand config
- Logo, colors, fonts configurable
- Zero component changes needed for rebranding

### UI Components
- Themed base components (Text, Button, Card, Avatar)
- All components use design tokens
- Consistent styling throughout

## Development

### Adding a New Screen

1. Create screen in `src/screens/`
2. Use `useTheme()` for styling
3. Use `useTranslation()` for text
4. Separate business logic into hooks

### Adding a New Component

1. Create component in `src/components/ui/`
2. Use theme tokens (no hardcoded values)
3. Export from `src/components/ui/index.ts`

### Adding a New Language

1. Create `src/i18n/locales/[locale].json`
2. Register in `src/i18n/config.ts`
3. No component changes needed

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed instructions.

## License

Private
