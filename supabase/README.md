# Supabase Database

This directory contains all Supabase database-related files including schema, scripts, documentation, and assets.

## Directory Structure

```
supabase/
├── schema/              # Database schema files
│   └── schema_enhanced.sql
├── scripts/             # Automation scripts and migrations
│   └── automate_deletion.sql
├── docs/                # Database documentation
│   └── DATABASE_FUNCTIONS_AND_RULES.md
├── assets/          # Diagrams and images
│   └── Respondr_ERD_Current_use.png
└── README.md        # This file
```

## Quick Start

1. **Schema Setup**: Run `schema/schema_enhanced.sql` in your Supabase SQL Editor
2. **Automation**: Run `scripts/automate_deletion.sql` to enable automated user deletion
3. **Documentation**: See `docs/DATABASE_FUNCTIONS_AND_RULES.md` for detailed documentation

## Files Overview

### Schema Files
- **`schema/schema_enhanced.sql`** - Complete database schema with tables, functions, triggers, RLS policies, and storage buckets

### Scripts
- **`scripts/automate_deletion.sql`** - Database trigger for automated user deletion/anonymization

### Documentation
- **`docs/DATABASE_FUNCTIONS_AND_RULES.md`** - Comprehensive documentation of all database functions, triggers, RLS policies, and storage policies

### Assets
- **`assets/Respondr_ERD_Current_use.png`** - Entity Relationship Diagram showing currently used tables

## Files

### Schema
- **`schema/schema_enhanced.sql`** - Complete database schema with tables, functions, triggers, and RLS policies

### Scripts
- **`scripts/automate_deletion.sql`** - Database trigger for automated user deletion/anonymization

### Documentation
- **`docs/DATABASE_FUNCTIONS_AND_RULES.md`** - Comprehensive documentation of all database functions, triggers, RLS policies, and storage policies

### Assets
- **`assets/Respondr_ERD_Current_use.png`** - Entity Relationship Diagram showing currently used tables

## Related Documentation

For setup and configuration instructions, see:
- `../docs/setup/SUPABASE_COMPLETE_SETUP.md` - Complete Supabase setup guide
- `../docs/setup/QUICK_START_SUPABASE.md` - Quick 5-minute setup guide
- `../docs/features/USER_DELETION_PROCESS.md` - User deletion process documentation

