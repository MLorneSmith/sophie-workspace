# Payload CMS PostgreSQL Fix Implementation

This document details the implementation of fixes for Payload CMS PostgreSQL integration issues in our project.

## Background

We encountered several issues with Payload CMS's PostgreSQL integration:

1. **Schema Push Errors**:

   - `ValidationError: The following field is invalid: User`
   - `error: there is no parameter $1`
   - `error: type "serial" does not exist`

2. **Missing Columns Errors**:

   - `error: column courses__rels.course_lessons_id does not exist`
   - `error: column "featured_image_id" does not exist`
   - `error: column posts.image_id does not exist`
   - `error: column quiz_questions.quiz_id does not exist`

3. **User Validation Errors**:
   - Persistent `ValidationError: The following field is invalid: User` errors when accessing collections

## Root Causes

1. **PostgreSQL Type Incompatibility**: Payload's PostgreSQL adapter uses the "serial" type for auto-incrementing columns, which is incompatible with some PostgreSQL setups that use "identity columns" instead.

2. **Schema Push Limitations**: When schema push is disabled to avoid the serial type error, the necessary columns aren't created in the database.

3. **Schema Naming Issues**: Payload needs to be configured to use the correct schema name to find and interact with the correct tables.

## Solution Implemented

We implemented a comprehensive solution using Payload's migration system instead of schema push:

### 1. Configuration Updates

In `apps/payload/src/payload.config.ts`:

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  // Disable schema push to prevent parameter errors
  push: false,
  // Configure Postgres to use the "payload" schema
  schemaName: 'payload',
  // Use UUID for ID columns
  idType: 'uuid',
}),
```

### 2. Migration-Based Schema Management

We created a series of migrations to properly set up the database schema:

#### Initial Schema Migration (20250327_152618_initial_schema.ts)

This migration:

- Creates the payload schema
- Creates the payload_migrations table first (to track migrations)
- Defines all required enum types
- Creates core tables (users, media) with proper column types
- Uses IF NOT EXISTS checks for safety

Key code:

```typescript
// Create payload schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payload;

// Create payload_migrations table first
CREATE TABLE IF NOT EXISTS "payload"."payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

// Create enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_documentation_status') THEN
    CREATE TYPE "payload"."enum_documentation_status" AS ENUM('draft', 'published');
  END IF;
  // ... other enum types
END $$;

// Create tables
CREATE TABLE IF NOT EXISTS "payload"."users" (
  "id" serial PRIMARY KEY NOT NULL,
  // ... user table columns
);
```

#### Column Fix Migration (20250328_145700_fix_column_names.ts)

This migration:

- Adds safety checks to only modify columns if they exist
- Renames columns to match Payload's expectations
- Adds relationship columns

Key code:

```typescript
DO $$
BEGIN
  // Check if posts table exists and has image column
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload' AND table_name = 'posts' AND column_name = 'image'
  ) THEN
    ALTER TABLE payload.posts RENAME COLUMN image TO image_id;
  END IF;

  // ... other column renames
END $$;
```

#### Preferences Table Migration (20250328_153500_create_preferences_table.ts)

This migration:

- Creates payload_preferences and payload_preferences_rels tables
- Creates payload_locked_documents and payload_locked_documents_rels tables
- These tables are required for Payload admin functionality

Key code:

```typescript
// Create payload_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user" integer,
  "key" varchar,
  "value" jsonb,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
```

#### User Relations Migration (20250328_153700_fix_user_relations.ts)

This migration:

- Adds proper foreign key constraints for user references
- Ensures payload_preferences and payload_locked_documents tables reference users correctly
- Adds safety checks to only add constraints if tables and columns exist

Key code:

```typescript
DO $$
BEGIN
  // Check if user column in payload_preferences exists
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload' AND table_name = 'payload_preferences' AND column_name = 'user'
  ) THEN
    // Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE constraint_name = 'payload_preferences_user_fkey'
    ) THEN
      ALTER TABLE payload.payload_preferences
      ADD CONSTRAINT payload_preferences_user_fkey
      FOREIGN KEY ("user") REFERENCES payload.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
```

### 3. Reset and Migration Script

We created a `reset-and-migrate.ps1` script to reset the database and run all migrations:

```powershell
# PowerShell script to reset the database and run all migrations
Write-Host "Resetting Supabase database..." -ForegroundColor Cyan
supabase db reset

Write-Host "Running Payload migrations..." -ForegroundColor Cyan
cd apps/payload
pnpm payload migrate

Write-Host "All migrations completed!" -ForegroundColor Green
```

## Results and Current Status

The migrations ran successfully, but we're still encountering a "ValidationError: The following field is invalid: User" error when accessing collections in the Payload admin panel. This suggests there may be additional issues with the user table or user-related functionality that need to be addressed.

## Lessons Learned

1. **Payload CMS and Existing Databases**:

   - Payload CMS v3 can have issues when added to an existing application with data in the database
   - Schema push can be problematic in production environments

2. **PostgreSQL Type Compatibility**:

   - Different PostgreSQL setups may have different type compatibility issues
   - "serial" type is not universally supported; identity columns are the SQL standard alternative

3. **Schema Management Approaches**:
   - Schema push is convenient for development but may not be suitable for production
   - Migrations provide a more controlled, version-tracked approach to schema changes

## Next Steps

To fully resolve the remaining issues, we would need to:

1. Further investigate the User validation error
2. Potentially create additional migrations to fix user-related tables
3. Consider examining Payload's auth implementation more closely
4. Test with a fresh database to verify the complete solution

## References

1. [GitHub Issue #6094](https://github.com/payloadcms/payload/issues/6094): "there is no parameter $1"
2. [GitHub Discussion #8096](https://github.com/payloadcms/payload/discussions/8096): "postgresql: use identity columns instead of serial"
3. [Payload CMS Documentation on PostgreSQL](https://payloadcms.com/docs/database/postgres)
4. [Payload CMS Documentation on Migrations](https://payloadcms.com/docs/database/migrations)
5. [PostgreSQL Identity Columns](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-IDENTITY)
