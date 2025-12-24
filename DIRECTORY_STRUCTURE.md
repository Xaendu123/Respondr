# Directory Structure

This document outlines the clean directory architecture for the Respondr project.

## Project Structure

```
respondr/
├── app/                    # Expo Router app directory
├── src/                    # Source code
│   ├── components/        # UI components
│   ├── config/            # Configuration files
│   ├── hooks/             # React hooks
│   ├── i18n/              # Internationalization
│   ├── providers/         # Context providers
│   ├── screens/           # Screen components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── docs/                   # Project documentation
│   ├── architecture/      # Architecture documentation
│   ├── features/          # Feature documentation
│   ├── setup/             # Setup and configuration guides
│   └── README.md          # Documentation index
├── supabase/              # Supabase database files
│   ├── schema/            # Database schema files
│   ├── scripts/           # Automation scripts
│   ├── docs/              # Database documentation
│   ├── assets/            # Diagrams and images
│   └── README.md          # Supabase directory index
├── plugins/                # Expo config plugins
└── README.md              # Project README
```

## Supabase Directory

```
supabase/
├── schema/
│   └── schema_enhanced.sql        # Complete database schema
├── scripts/
│   └── automate_deletion.sql      # Automated user deletion trigger
├── docs/
│   └── DATABASE_FUNCTIONS_AND_RULES.md  # Database documentation
├── assets/
│   └── Respondr_ERD_Current_use.png     # ERD diagram
└── README.md                          # Directory index
```

**Purpose:** All Supabase-related files are organized by type:
- **schema/** - SQL schema definitions
- **scripts/** - Automation scripts and migrations
- **docs/** - Database-specific documentation
- **assets/** - Visual diagrams and images

## Documentation Directory

```
docs/
├── architecture/
│   └── ARCHITECTURE.md            # Application architecture guide
├── features/
│   ├── USER_DELETION_PROCESS.md   # User deletion documentation
│   ├── AUTOMATED_DELETION_SETUP.md # Automated deletion setup
│   ├── BIOMETRIC_AUTH_EXPLAINED.md # Biometric auth guide
│   ├── CONVENIENT_FEATURES.md     # Feature ideas
│   ├── FEATURE_ROADMAP.md         # Feature roadmap
│   └── PRIVACY_AND_GDPR.md        # Privacy/GDPR guide
├── setup/
│   ├── APP_CONFIG_CHECKLIST.md    # App config checklist
│   ├── CONFIGURATION_COMPLETE.md  # Config summary
│   ├── DOMAIN_CONNECTION.md       # Domain setup guide
│   ├── OAUTH_SETUP.md             # OAuth configuration
│   ├── PRODUCTION_READY_SUMMARY.md # Production checklist
│   ├── QUICK_START_SUPABASE.md    # Quick Supabase setup
│   ├── README_SUPABASE.md         # Supabase overview
│   └── SUPABASE_COMPLETE_SETUP.md # Complete Supabase guide
└── README.md                      # Documentation index
```

**Purpose:** All documentation is organized by category:
- **architecture/** - System architecture and design patterns
- **features/** - Feature-specific documentation
- **setup/** - Setup, configuration, and deployment guides

## Benefits of This Structure

### ✅ Organization
- Clear separation of concerns
- Easy to find files by purpose
- Logical grouping of related files

### ✅ Scalability
- Easy to add new files in appropriate locations
- Can grow without becoming cluttered
- Clear patterns for where new files should go

### ✅ Maintainability
- Clear structure makes onboarding easier
- Reduced cognitive load when searching for files
- Consistent patterns across the project

### ✅ Documentation
- README files in each major directory explain contents
- Easy navigation for new developers
- Clear entry points for different topics

## File Path References

When referencing files in documentation, use these patterns:

### Supabase Files
- Schema: `supabase/schema/schema_enhanced.sql`
- Scripts: `supabase/scripts/automate_deletion.sql`
- Docs: `supabase/docs/DATABASE_FUNCTIONS_AND_RULES.md`
- Assets: `supabase/assets/Respondr_ERD_Current_use.png`

### Documentation Files
- Architecture: `docs/architecture/ARCHITECTURE.md`
- Features: `docs/features/[FEATURE_NAME].md`
- Setup: `docs/setup/[SETUP_GUIDE].md`

### Relative References
Within documentation files in the same category, use relative paths:
- `./FEATURE_NAME.md` (same directory)
- `../setup/GUIDE_NAME.md` (different category)

