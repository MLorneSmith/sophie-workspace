---
id: "database-patterns"
title: "Database Patterns"
version: "1.0.0"
category: "pattern"
description: "RLS policies, migration workflows, relationship management, and type safety patterns for database operations"
tags: ["database", "rls", "migrations", "postgresql", "supabase", "type-safety", "zero-downtime"]
created: "2025-11-14"
last_updated: "2025-11-14"
author: "consolidation"
---

# Database Patterns

This document consolidates database patterns including RLS policies, migration workflows, relationship management, and type safety patterns for the SlideHeroes platform.

## Migration System Overview

Three-tier migration system for database schema management:

- **Supabase migrations** for main application and E2E testing
- **Payload CMS migrations** for content management
- **Separate schemas** for isolation and security

### Migration Philosophy

- **Forward-only**: Prefer additive changes over destructive
- **Atomic operations**: Single transaction per migration
- **Zero-downtime**: Design for production continuity
- **Data preservation**: Never lose data during changes
- **Idempotency**: Safe to run multiple times

### Migration Locations

| Location | Purpose | Schema |
|----------|---------|--------|
| `apps/web/supabase/migrations/` | Production database | `public`, `kit` |
| `apps/e2e/supabase/migrations/` | Test environment | `public`, `kit` |
| `apps/payload/src/migrations/` | Content management | `payload` |

## Essential Commands

### Development

```bash
npx supabase start                    # Start local database
npx supabase migration new <name>     # Create migration
npx supabase migration up              # Apply migrations
npx supabase migration list            # Check status
npx supabase db reset                  # Reset with all migrations
```

### Production

```bash
npx supabase db push --linked         # Deploy to linked project
npx supabase db push --db-url "$URL"  # Deploy to specific database
npx supabase db dump -f backup.sql     # Create backup
```

## Database Workflow - CRITICAL SEQUENCE

When adding new database features, ALWAYS follow this exact order:

1. **Create/modify schema file** in `apps/web/supabase/schemas/XX-feature.sql`
2. **Generate migration**: `pnpm --filter web supabase:db:diff -f <migration_name>`
3. **Apply changes**: `pnpm --filter web supabase migration up` (or `pnpm supabase:web:reset` for clean rebuild)
4. **Generate types**: `pnpm supabase:web:typegen`
5. **Verify types exist** before using in code

**NEVER skip step 2** - schema files alone don't create tables! The migration step is required to apply changes to the database.

## RLS Patterns

### Basic Table with RLS

```sql
CREATE TABLE public.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON public.table_name(user_id);
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- User access
CREATE POLICY "users_own" ON public.table_name
  FOR ALL USING (auth.uid() = user_id);

-- Team access
CREATE POLICY "team_members" ON public.table_name
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.accounts_memberships
    WHERE account_id = table_name.team_id AND user_id = auth.uid()
  ));

-- Service role bypass
CREATE POLICY "service_role" ON public.table_name
  FOR ALL TO service_role USING (true);
```

### Hierarchical Team Access

```sql
-- Teams with parent/child relationships
CREATE POLICY "hierarchical_access" ON public.documents
  FOR SELECT USING (
    EXISTS (
      WITH RECURSIVE team_hierarchy AS (
        -- Direct team membership
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()

        UNION

        -- Parent team access
        SELECT parent_id FROM public.accounts
        JOIN team_hierarchy ON accounts.id = team_hierarchy.account_id
        WHERE parent_id IS NOT NULL
      )
      SELECT 1 FROM team_hierarchy
      WHERE team_hierarchy.account_id = documents.team_id
    )
  );
```

### Time-based Access Control

```sql
CREATE POLICY "temporal_access" ON public.content
  FOR SELECT USING (
    -- Public after publish date
    (published_at IS NOT NULL AND published_at <= NOW())
    OR
    -- Author always has access
    (author_id = auth.uid())
    OR
    -- Editors before publish
    EXISTS (
      SELECT 1 FROM public.content_editors
      WHERE content_id = content.id AND editor_id = auth.uid()
    )
  );
```

## Secure Function Pattern

```sql
CREATE OR REPLACE FUNCTION public.function_name()
RETURNS return_type
SET search_path = ''
SECURITY INVOKER
AS $$
BEGIN
  -- Logic here
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.function_name() TO authenticated;
```

### Available Auth Functions

- `auth.uid()` - Current user ID
- `auth.jwt()` - JWT claims
- `auth.role()` - User role
- `public.is_aal2()` - MFA check

## Zero-Downtime Migration Patterns

### Multi-Phase Migration Pattern

For breaking changes that require zero-downtime deployment:

#### Phase 1: Add New Structure

```sql
-- Deploy: Add new column alongside old
ALTER TABLE public.users ADD COLUMN email_normalized VARCHAR(255);
CREATE INDEX CONCURRENTLY idx_users_email_normalized ON public.users(email_normalized);
```

#### Phase 2: Dual Write (Application Change)

```typescript
// Update application to write both columns
await db.update({
  email: userEmail,
  email_normalized: userEmail.toLowerCase().trim()
});
```

#### Phase 3: Backfill Data

```sql
-- Migration: Backfill existing data
UPDATE public.users
SET email_normalized = LOWER(TRIM(email))
WHERE email_normalized IS NULL;

-- Verify backfill
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.users WHERE email_normalized IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % rows missing', null_count;
  END IF;
END $$;
```

#### Phase 4: Add Constraints

```sql
-- Deploy: Make new column required
ALTER TABLE public.users ALTER COLUMN email_normalized SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_email_normalized_unique UNIQUE(email_normalized);
```

#### Phase 5: Remove Old Structure

```sql
-- Final migration after app no longer uses old column
ALTER TABLE public.users DROP COLUMN email;
ALTER TABLE public.users RENAME COLUMN email_normalized TO email;
```

## Safe Migration Practices

### Safe Changes

```sql
ALTER TABLE users ADD COLUMN field TEXT;                    -- Nullable column
CREATE INDEX CONCURRENTLY idx_name ON table(column);       -- Non-blocking index
CREATE TABLE new_table (...);                              -- New tables
```

### Careful Changes

```sql
ALTER TABLE users ADD COLUMN field TEXT NOT NULL DEFAULT 'value';  -- Requires default
```

### Unsafe Changes

```sql
ALTER TABLE users DROP COLUMN field;           -- Breaks old code
ALTER TABLE users RENAME COLUMN old TO new;    -- Breaks references
```

## Performance Optimization

### Index Creation Strategy

```sql
-- Create indexes CONCURRENTLY in production
CREATE INDEX CONCURRENTLY idx_large_table_field ON public.large_table(field);

-- Partial indexes for common queries
CREATE INDEX idx_orders_pending ON public.orders(created_at)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- Composite indexes for multi-column queries
CREATE INDEX idx_users_search ON public.users(email, name)
  WHERE deleted_at IS NULL;

-- Expression indexes
CREATE INDEX idx_users_email_lower ON public.users(LOWER(email));
```

### Constraint Addition Strategy

```sql
-- Add NOT VALID constraint first (no table scan)
ALTER TABLE public.large_table
  ADD CONSTRAINT check_positive_amount
  CHECK (amount > 0) NOT VALID;

-- Validate in separate transaction (can be done during low traffic)
ALTER TABLE public.large_table
  VALIDATE CONSTRAINT check_positive_amount;
```

## Relationship Table Management

### Junction Tables

Junction tables (many-to-many relationships) require careful management:

```sql
CREATE TABLE public.course_lessons (
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (course_id, lesson_id)
);

CREATE INDEX ON public.course_lessons(course_id);
CREATE INDEX ON public.course_lessons(lesson_id);
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
```

### Dynamic UUID Tables (Payload CMS)

Payload CMS dynamically creates tables with UUID names for relationship management. Use view-based abstraction for stability:

```sql
-- Create view over dynamic tables
CREATE OR REPLACE VIEW downloads_relationships AS
SELECT
  collection_type,
  collection_id,
  download_id
FROM dynamic_uuid_table_1
UNION ALL
SELECT
  collection_type,
  collection_id,
  download_id
FROM dynamic_uuid_table_2;
```

## Data Migration Patterns

### Safe Data Transformation

```sql
BEGIN;

-- Create temporary column
ALTER TABLE public.orders ADD COLUMN total_cents INTEGER;

-- Transform data with validation
UPDATE public.orders
SET total_cents = ROUND(total_amount * 100)::INTEGER
WHERE total_amount IS NOT NULL;

-- Verify transformation
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.orders
  WHERE total_amount IS NOT NULL AND total_cents IS NULL;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Data transformation failed for % rows', invalid_count;
  END IF;
END $$;

-- Make new column required
ALTER TABLE public.orders ALTER COLUMN total_cents SET NOT NULL;

COMMIT;
```

### Batch Processing for Large Tables

```sql
-- Process in batches to avoid long locks
DO $$
DECLARE
  batch_size INTEGER := 10000;
  processed INTEGER := 0;
  total INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM public.large_table WHERE processed = FALSE;

  WHILE processed < total LOOP
    UPDATE public.large_table
    SET
      new_field = complex_calculation(old_field),
      processed = TRUE
    WHERE id IN (
      SELECT id FROM public.large_table
      WHERE processed = FALSE
      LIMIT batch_size
    );

    processed := processed + batch_size;
    RAISE NOTICE 'Processed % of % rows', processed, total;

    -- Optional: pause between batches
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

## Type Safety

### Database Types

Always use the Database type from Supabase:

```typescript
import { type Database } from '@kit/supabase/database';

// Table types
type Item = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

// Enum types
type Status = Database['public']['Enums']['status'];

// Function return types
type FunctionResult = Database['public']['Functions']['calculate_total']['Returns'];
```

## Common Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";         -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgvector";          -- Vector embeddings
CREATE EXTENSION IF NOT EXISTS "pg_cron";           -- Scheduled jobs
CREATE EXTENSION IF NOT EXISTS "postgis";           -- Geospatial
```

## Migration Validation

```sql
-- Include validation in every migration
DO $$
BEGIN
  -- Check table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'new_table') THEN
    RAISE EXCEPTION 'Migration failed: table not created';
  END IF;

  -- Check column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'new_column') THEN
    RAISE EXCEPTION 'Migration failed: column not created';
  END IF;

  RAISE NOTICE 'Migration validation passed';
END $$;
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Migration order dependencies | Use proper timestamp ordering |
| RLS policy conflicts | Use unique, descriptive names |
| Function search path | Always set `search_path = ''` |
| Concurrent execution | Supabase handles locking automatically |

## Related Files

- [Architecture Overview](./architecture-overview.md) - System architecture
- [Server Actions](./server-actions.md) - Application layer patterns
- `/apps/web/supabase/schemas/` - Schema definitions
- `/apps/web/supabase/migrations/` - Migration files
