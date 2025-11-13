---
# Identity
id: "database-migrations"
title: "Database Migration System"
version: "3.0.0"
category: "implementation"

# Discovery
description: "Core guide to the three-tier migration system using Supabase and Payload CMS for database schema management"
tags: ["database", "migrations", "supabase", "payload", "postgresql", "schema", "rls"]

# Relationships
dependencies: ["supabase-config", "payload-config", "postgresql"]
cross_references:
  - id: "database-migration-patterns"
    type: "related"
    description: "Advanced migration patterns and strategies"
  - id: "database-migration-cicd"
    type: "related"
    description: "CI/CD integration and deployment automation"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Database Migration System

## Overview

Three-tier migration system for database schema management:

- **Supabase migrations** for main application and E2E testing
- **Payload CMS migrations** for content management
- **Separate schemas** for isolation and security

## Migration Philosophy

- **Forward-only**: Prefer additive changes over destructive
- **Atomic operations**: Single transaction per migration
- **Zero-downtime**: Design for production continuity
- **Data preservation**: Never lose data during changes
- **Idempotency**: Safe to run multiple times

## Migration Locations

| Location | Purpose | Schema |
|----------|---------|--------|
| `apps/web/supabase/migrations/` | Production database | `public`, `kit` |
| `apps/e2e/supabase/migrations/` | Test environment | `public`, `kit` |
| `apps/payload/src/migrations/` | Content management | `payload` |

## Supabase Migration System

### Naming Convention

```
YYYYMMDDHHMMSS_[prefix]_description.sql
```

- **Prefixes**: `web_`, `fix_`, `remote_migration_`
- **Tracking**: Auto-managed via `schema_migrations` table

### Essential Commands

```bash
# Development
npx supabase start                    # Start local database
npx supabase migration new <name>     # Create migration
npx supabase migration up              # Apply migrations
npx supabase migration list            # Check status
npx supabase db reset                  # Reset with all migrations

# Production
npx supabase db push --linked         # Deploy to linked project
npx supabase db push --db-url "$URL"  # Deploy to specific database
npx supabase db dump -f backup.sql     # Create backup
```

### Core Migration Patterns

#### Table with RLS

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

#### Secure Function

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

#### Auth Functions Available

- `auth.uid()` - Current user ID
- `auth.jwt()` - JWT claims
- `auth.role()` - User role
- `public.is_aal2()` - MFA check

## Payload CMS Migrations

### Structure

```typescript
// apps/payload/src/migrations/YYYYMMDD_HHMMSS_name.ts
import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`-- SQL here`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`-- Rollback SQL`);
}
```

### Commands

```bash
pnpm payload:migrate:ssl         # With SSL
pnpm payload:migrate:production  # Production mode
pnpm --filter payload payload migrate
```

## MakerKit Integration

### Server Actions Pattern

```typescript
import { enhanceAction } from '@kit/next/actions';

export const dbAction = enhanceAction(
  async (data, user) => {
    // Automatic: validation, auth, error handling
  },
  {
    schema: ZodSchema,
    auth: true,
    captcha: false
  }
);
```

## Safe Migration Practices

### ✅ Safe Changes

```sql
ALTER TABLE users ADD COLUMN field TEXT;                    -- Nullable column
CREATE INDEX CONCURRENTLY idx_name ON table(column);       -- Non-blocking index
CREATE TABLE new_table (...);                              -- New tables
```

### ⚠️ Careful Changes

```sql
ALTER TABLE users ADD COLUMN field TEXT NOT NULL DEFAULT 'value';  -- Requires default
```

### ❌ Unsafe Changes

```sql
ALTER TABLE users DROP COLUMN field;           -- Breaks old code
ALTER TABLE users RENAME COLUMN old TO new;    -- Breaks references
```

## Common Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";         -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgvector";          -- Vector embeddings
CREATE EXTENSION IF NOT EXISTS "pg_cron";           -- Scheduled jobs
CREATE EXTENSION IF NOT EXISTS "postgis";           -- Geospatial
```

## Rollback Strategy

**Important**: Supabase migrations are forward-only. Manual rollback required:

```sql
-- Create rollback migration: YYYYMMDDHHMMSS_rollback_feature.sql
DROP TABLE IF EXISTS public.feature_table;
ALTER TABLE public.users DROP COLUMN IF EXISTS feature_column;
-- Restore from backup if needed
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Migration order dependencies | Use proper timestamp ordering |
| RLS policy conflicts | Use unique, descriptive names |
| Function search path | Always set `search_path = ''` |
| Concurrent execution | Supabase handles locking automatically |

## See Also

- [[database-migration-patterns]]: Advanced patterns and zero-downtime strategies
- [[database-migration-cicd]]: CI/CD integration and automation
- [[database-rls]]: Row Level Security details
- [[supabase-configuration]]: Supabase project configuration
