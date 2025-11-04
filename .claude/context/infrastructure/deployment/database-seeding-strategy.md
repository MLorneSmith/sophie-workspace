---
id: "database-seeding-strategy"
title: "Database Seeding Strategy: Dual-Mode Approach"
version: "1.0.0"
category: "implementation"
description: "Comprehensive dual-strategy database seeding system for Supabase: local development with automatic seeding vs remote deployment with migration-based seeding"
tags: ["database", "seeding", "supabase", "migrations", "deployment", "local-development", "ci-cd"]
dependencies: ["supabase-cli", "migrations"]
cross_references:
  - id: "database/migrations"
    type: "related"
    description: "Core migration system documentation"
  - id: "tools/cli/supabase-cli"
    type: "prerequisite"
    description: "Supabase CLI commands and workflows"
created: "2025-11-04"
last_updated: "2025-11-04"
author: "create-context"
---

# Database Seeding Strategy

## Overview

SlideHeroes implements a **dual-strategy seeding approach** optimized for both solo development speed and production deployment safety:

- **Local Development**: Automatic seeding via `supabase db reset` using `config.toml`
- **Remote Deployment**: Migration-based seeding via `supabase db push --linked`

This separation provides the best of both worlds: fast iteration locally while maintaining audit trails and safety in deployed environments.

## Core Concepts

### Strategy Selection Decision Tree

```
Is this a local development database?
├─ YES → Use `supabase db reset` (automatic seeding)
│  ├─ Fast (seconds for complete reset)
│  ├─ Destructive (safe locally)
│  └─ Runs ALL seed files automatically
│
└─ NO → Use migration-based seeding
   ├─ Safe (incremental only)
   ├─ Version controlled (Git tracked)
   └─ Production guards prevent accidents
```

### Idempotency Patterns

All seed operations must be safe to run multiple times:

```sql
-- Pattern 1: Conditional updates (most common)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email IN ('test@example.com')
AND email_confirmed_at IS NULL;  -- Only update if NULL

-- Pattern 2: Check before insert
INSERT INTO table_name (id, value)
SELECT 'id-value', 'data'
WHERE NOT EXISTS (
  SELECT 1 FROM table_name WHERE id = 'id-value'
);

-- Pattern 3: Upsert with ON CONFLICT
INSERT INTO table_name (id, value)
VALUES ('id-value', 'data')
ON CONFLICT (id) DO UPDATE
SET value = EXCLUDED.value;
```

### Production Safety Guards

Prevent accidental production seeding:

```sql
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot seed production database: %',
      current_database();
  END IF;
END $$;
```

## Local Development Workflow

### Command: `/database:supabase-reset`

**Purpose**: Complete local database reset with automatic seeding

**What it does**:
1. Drops entire local database
2. Recreates schema from migrations
3. **Automatically runs ALL seed files** (from `config.toml`)
4. Fresh data in seconds

**Configuration** (`apps/web/supabase/config.toml`):

```toml
[db.seed]
enabled = true
sql_paths = [
  './seed.sql',                    # Main dev data
  './seeds/01_main_seed.sql',      # Core users
  './seeds/02_e2e_test_users.sql'  # E2E users
]
```

**When to use**:
- ✅ Daily local development
- ✅ Testing schema changes
- ✅ Quick iteration cycles
- ✅ After modifying seed files

**Characteristics**:
- **Speed**: 10-30 seconds total
- **Data loss**: Complete (intentional)
- **Automation**: Zero manual steps
- **Safety**: Local only (not for remote)

### Example Seed File

`apps/web/supabase/seeds/02_e2e_test_users.sql`:

```sql
-- ==================================================================
-- E2E TEST USER CONFIGURATION
-- ==================================================================
-- Idempotent: Safe to run multiple times
-- Environment-agnostic: Works local, dev, staging

DO $$
DECLARE
    confirmed_count INTEGER;
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email IN (
        'test1@slideheroes.com',
        'test2@slideheroes.com'
    )
    AND email_confirmed_at IS NULL;

    GET DIAGNOSTICS confirmed_count = ROW_COUNT;

    RAISE NOTICE '✅ Confirmed % test user(s)', confirmed_count;
END $$;
```

## Remote Deployment Workflow

### Command: `/database:supabase-seed-remote <env>`

**Purpose**: Deploy seed data to remote environments as migrations

**Implementation**: Calls reusable script at `.claude/scripts/database/supabase-seed-remote.sh`

**What it does**:
1. Links to remote Supabase project
2. Pushes seed migrations (incremental only)
3. Verifies seeded data
4. Reports completion

**When to use**:
- ✅ First-time environment setup
- ✅ Adding new E2E test users
- ✅ Deploying seed changes to dev/staging
- ❌ Never for production (blocked by guards)

**Characteristics**:
- **Speed**: 1-5 minutes
- **Data loss**: None (incremental)
- **Automation**: Via `supabase db push`
- **Safety**: Production guards enforced

### Creating Seed Migrations

**Step 1**: Test seed file locally

```bash
# Edit seed file
vim apps/web/supabase/seeds/02_e2e_test_users.sql

# Test locally
/database:supabase-reset

# Verify it works
```

**Step 2**: Convert to migration

```bash
# Create migration
cd apps/web
npx supabase migration new seed_e2e_test_users

# Copy seed content to migration
cat supabase/seeds/02_e2e_test_users.sql >> \
  supabase/migrations/TIMESTAMP_seed_e2e_test_users.sql
```

**Step 3**: Add safety guards

```sql
-- Add to top of migration file
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot seed production database';
  END IF;
END $$;
```

**Step 4**: Deploy to remote

```bash
/database:supabase-seed-remote dev

# ✅ Seeding migration applied to dev.slideheroes.com
```

### Migration Structure

Example: `20251104193705_seed_e2e_test_users.sql`

```sql
-- ==================================================================
-- MIGRATION: Seed E2E Test Users for Remote Environments
-- ==================================================================

-- Safety guard
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot seed production';
  END IF;
  RAISE NOTICE 'Database % verified as non-production', current_database();
END $$;

-- Idempotent seeding logic
DO $$
DECLARE
    confirmed_count INTEGER;
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email IN ('test1@slideheroes.com', 'test2@slideheroes.com')
    AND email_confirmed_at IS NULL;

    GET DIAGNOSTICS confirmed_count = ROW_COUNT;

    IF confirmed_count > 0 THEN
        RAISE NOTICE '✅ Confirmed % test users', confirmed_count;
    ELSE
        RAISE NOTICE '✓ All test users already confirmed';
    END IF;
END $$;

-- Verification
DO $$
DECLARE
    unconfirmed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unconfirmed_count
    FROM auth.users
    WHERE email IN ('test1@slideheroes.com')
    AND email_confirmed_at IS NULL;

    IF unconfirmed_count > 0 THEN
        RAISE WARNING 'Still have % unconfirmed users', unconfirmed_count;
    END IF;
END $$;
```

## Implementation Patterns

### Pattern 1: Email Confirmation

**Use case**: Confirm E2E test users for automated testing

```sql
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email IN ('test1@example.com', 'test2@example.com')
AND email_confirmed_at IS NULL;
```

**Why idempotent**: Uses `COALESCE` to preserve existing timestamps

### Pattern 2: Reference Data

**Use case**: Seed lookup tables with standard values

```sql
INSERT INTO categories (id, name, slug)
VALUES
  ('cat-1', 'Category 1', 'category-1'),
  ('cat-2', 'Category 2', 'category-2')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, slug = EXCLUDED.slug;
```

**Why idempotent**: Upsert pattern handles existing records

### Pattern 3: Test Accounts

**Use case**: Create test users for E2E testing

```sql
-- Insert only if not exists
INSERT INTO auth.users (id, email, encrypted_password)
SELECT
  'test-user-1',
  'test@example.com',
  crypt('password', gen_salt('bf'))
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'test@example.com'
);
```

**Why idempotent**: Check existence before insert

## Troubleshooting

### Local: Seed File Not Running

**Symptoms**: Fresh reset but seed data missing

**Solution**:
1. Check `config.toml` has correct `sql_paths`
2. Verify seed file syntax (no SQL errors)
3. Run `supabase db reset --debug` for detailed logs

### Remote: Migration Already Applied

**Symptoms**: "Migration already applied" but data missing

**Cause**: Idempotent migrations skip if already run

**Solution**: This is expected behavior. Seed migrations are one-time. To re-seed:
1. Create new migration with updated data
2. Or manually execute seed SQL via Supabase dashboard

### Production Safety Triggered

**Symptoms**: `Cannot seed production database` error

**Cause**: Safety guard working correctly

**Solution**: This is expected. Production databases should NEVER be seeded via automated scripts.

### Duplicate Data

**Symptoms**: Multiple records when expecting one

**Root cause**: Seed not idempotent

**Solution**:
1. Add proper idempotency checks (`WHERE NOT EXISTS`, `ON CONFLICT`)
2. Reset database: `/database:supabase-reset`
3. Update seed file with idempotent pattern

## Best Practices

### Do's ✅

- **Test locally first**: Always test seed files with `/database:supabase-reset`
- **Make idempotent**: Use `COALESCE`, `ON CONFLICT`, `WHERE NOT EXISTS`
- **Add guards**: Include production safety in all remote seed migrations
- **Verify results**: Log counts and check expectations
- **Use RAISE NOTICE**: Provide feedback on what was seeded

### Don'ts ❌

- **Don't seed production**: Use manual data entry or proper data migration strategies
- **Don't assume clean state**: Always handle existing data gracefully
- **Don't skip verification**: Check that seed operation succeeded
- **Don't hardcode timestamps**: Use `NOW()` or `CURRENT_TIMESTAMP`
- **Don't mix environments**: Keep local seeding separate from remote

## Commands Reference

### Local Development

```bash
# Full reset with seeding (default)
/database:supabase-reset

# Reset without seeding
/database:supabase-reset --schema-only

# Reset with fresh Payload migrations
/database:supabase-reset --regenerate-payload-migrations
```

### Remote Deployment

```bash
# Seed dev environment (via slash command)
/database:supabase-seed-remote dev

# Or call script directly
./.claude/scripts/database/supabase-seed-remote.sh dev

# Seed staging environment
/database:supabase-seed-remote staging

# Check applied migrations
npx supabase migration list --linked
```

### Manual Operations

```bash
# Apply specific migration locally
npx supabase migration up

# View migration status
npx supabase migration list

# Generate new migration
npx supabase migration new <name>
```

## Integration with CI/CD

Seed migrations integrate seamlessly with deployment pipelines:

```yaml
# GitHub Actions example
- name: Deploy seed migrations
  run: |
    npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    npx supabase db push --linked
```

**Benefits**:
- Automated seed deployment on merge
- Audit trail in Git history
- Rollback via migration history

## Related Documentation

- **Local Reset**: `.claude/commands/database/supabase-reset.md`
- **Remote Seeding**: `.claude/commands/database/supabase-seed-remote.md`
- **Migrations Overview**: `.claude/context/data/migrations/overview.md`
- **Supabase CLI**: `.claude/context/tools/cli/supabase-cli.md`
