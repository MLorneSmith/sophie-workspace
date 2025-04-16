# Supabase Remote Migration Scripts

This directory contains organized scripts for managing and migrating content to a remote Supabase instance.

## Directory Structure

- **/schema/**
  - Schema creation and management scripts
  - SQL files for creating database structures
- **/migrations/**
  - Migration synchronization and reset scripts
- **/content/**
  - Content migration scripts
  - Content verification tools
- **/fixes/**
  - Utility scripts to fix various issues
  - Diagnostic tools
- **/tests/**
  - Test scripts to verify connections and functionality
- **/utils/**
  - Utility functions used by multiple scripts

## Main Script Categories

### Schema Management

- **schema/create-payload-schema.ps1** - Primary schema creation script (recommended)
- **schema/sql/payload-schema.sql** - SQL file for creating the payload schema

### Migration Management

- **migrations/sync-migrations.ps1** - Synchronize migrations between local and remote databases
- **migrations/reset-remote-migrations.ps1** - Reset remote migrations

### Content Migration

- **content/migrate-content-progressive.ps1** - Main script for progressively migrating content
- **content/migrate-posts-direct.ps1** - Migrate posts content directly
- **content/migrate-data.ps1** - Data migration script
- **content/verify-remote-content.ps1** - Verify migrated content integrity

### Fixes and Diagnostics

- **fixes/fix-connection-string.ps1** - Fix database connection string issues
- **fixes/fix-remote-relationships.ps1** - Fix relationship issues in remote database
- **fixes/diagnose-course-route.ps1** - Diagnose course route issues

### Root Scripts

- **migrate-schema.ps1** - Schema migration script
- **setup-uuid-tables.ps1** - Set up UUID table management
- **init-payload-schema.ps1** - Initialize payload schema (legacy)

### Test Scripts

- **tests/basic-connection-test.ps1** - Main connection test script
- **tests/test-core-tables.ps1** - Test core table migration
- **tests/test-posts-only.ps1** - Test posts migration
- **tests/verify-remote-payload-schema.ps1** - Verify remote payload schema

## Usage

The scripts in this directory should be run through the main wrapper script at the root:

```powershell
# Run a basic connection test
./supabase-remote-migration.ps1 -Test

# Migrate schema only
./supabase-remote-migration.ps1 -SchemaOnly

# Run the full migration
./supabase-remote-migration.ps1
```

## Maintenance Notes

- This directory structure is organized by function for better maintenance
- The wrapper script (supabase-remote-migration.ps1) uses the appropriate paths to the scripts
- Avoid hardcoding credentials; use environment variables where possible
- Use `tests/basic-connection-test.ps1` as the primary connection test script
