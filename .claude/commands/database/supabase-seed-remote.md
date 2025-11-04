# Supabase Remote Seeding

Apply seed migrations to remote Supabase environments (dev, staging).

## Command

- `/database:supabase-seed-remote dev` - Seed dev environment
- `/database:supabase-seed-remote staging` - Seed staging environment

## What It Does

This command deploys seed data to remote Supabase databases using migrations instead of manual SQL execution. It provides:

1. **Version Control**: All seed changes tracked in Git via migrations
2. **Repeatability**: Same command works across all environments
3. **Safety**: Production guards prevent accidental seeding
4. **Auditability**: Migration history shows when/why users added

## Environment Configuration

The command supports these environments:

- **dev**: Development environment (dev.slideheroes.com)
  - Project ref: `ldebzombxtszzcgnylgq`
- **staging**: Staging environment (staging.slideheroes.com)
  - Project ref: TBD (configure when staging is set up)

## How It Works

### Step 1: Link to Remote Project

```bash
# Link to the specified remote environment
npx supabase link --project-ref <PROJECT_REF>
```

### Step 2: Push Migrations

```bash
# Push all pending migrations (includes seeding migrations)
npx supabase db push --linked
```

### Step 3: Verify Seeded Data

```bash
# Verify E2E test users are confirmed
npx supabase db exec "
  SELECT
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
  FROM auth.users
  WHERE email IN (
    'test1@slideheroes.com',
    'test2@slideheroes.com',
    'michael@slideheroes.com'
  )
  ORDER BY email;
"
```

## Implementation

This command calls the reusable script at `.claude/scripts/database/supabase-seed-remote.sh`:

```bash
./.claude/scripts/database/supabase-seed-remote.sh "$@"
```

The script handles:
- Environment validation (dev/staging)
- Project linking
- Migration deployment
- Data verification
- Error handling

## Safety Features

### Production Guards

All seeding migrations include automatic production guards:

```sql
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot seed production database';
  END IF;
END $$;
```

### Idempotency

Seeding migrations are designed to be run multiple times safely:

- Check if users exist before creating
- Use `COALESCE` for conditional updates
- Only update `NULL` values (don't overwrite existing data)

## When to Use This Command

**Use this command when:**
- ✅ First-time environment setup
- ✅ Adding new E2E test users
- ✅ Updating test data structure
- ✅ After creating new seed migrations

**Don't use for:**
- ❌ Local development (use `/database:supabase-reset` instead)
- ❌ Production environments (blocked by guards)
- ❌ Ad-hoc data changes (create proper migrations)

## Relationship with Local Development

### Local Development Workflow

For solo development, use the existing `/database:supabase-reset` command:

```bash
# Local reset (fast, destructive, automatic seeding)
/database:supabase-reset

# What it does:
# 1. Drops local database
# 2. Recreates schema
# 3. Runs migrations
# 4. Automatically runs ALL seed files from config.toml
```

**Characteristics:**
- **Fast**: Complete reset in seconds
- **Destructive**: Drops everything (safe locally)
- **Automatic**: Seeds without extra flags
- **Flexible**: Can regenerate migrations freely

### Remote Deployment Workflow

For deployed environments, use this command:

```bash
# Remote seeding (safe, incremental, version controlled)
/database:supabase-seed-remote dev

# What it does:
# 1. Links to remote project
# 2. Pushes seed migrations
# 3. Verifies seeded data
```

**Characteristics:**
- **Safe**: Never drops existing data
- **Incremental**: Only applies new migrations
- **Tracked**: Git history of all changes
- **Auditable**: Clear what was applied when

## Adding New Test Users

### Step 1: Update Seed File Locally

```bash
# Edit the seed file
vim apps/web/supabase/seeds/02_e2e_test_users.sql

# Add new user to the WHERE clause
WHERE email IN (
    'test1@slideheroes.com',
    'test2@slideheroes.com',
    'michael@slideheroes.com',
    'admin@slideheroes.com'  -- New user
)

# Test locally
/database:supabase-reset
```

### Step 2: Create Migration for Remote

```bash
# Create new migration
cd apps/web
npx supabase migration new add_admin_test_user

# Copy updated content to migration
# (Or manually add just the new user to the migration)

# Commit to Git
git add supabase/migrations/
git commit -m "feat: add admin test user for E2E tests"
```

### Step 3: Deploy to Remote

```bash
# Deploy to dev
/database:supabase-seed-remote dev

# ✅ New user appears in dev.slideheroes.com
# ✅ CI/CD tests can use admin@slideheroes.com
```

## Troubleshooting

### Issue: "Project not linked"

**Solution:**
```bash
cd apps/web
npx supabase link --project-ref ldebzombxtszzcgnylgq
```

### Issue: "Migration already applied"

**Resolution:** This is expected! Seeding migrations are idempotent. The command will report "no migrations to apply" which is normal.

### Issue: Test users not created

**Solution:** Seeding migrations only confirm emails for existing users. Users must be created first via:
1. Main seed file (`seed.sql`)
2. Manual creation in Supabase Dashboard
3. Separate user creation migration

### Issue: Production database error

**Expected:** Production guards are working correctly. Never seed production databases.

## Technical Details

### Migration File Location

Seeding migrations are stored in: `apps/web/supabase/migrations/`

Example: `20251104193705_seed_e2e_test_users.sql`

### Environment Variables

The command uses Supabase CLI's built-in linking mechanism. No environment variables needed for basic operation.

For advanced usage, you can set:
- `SUPABASE_ACCESS_TOKEN`: Personal access token (if not using CLI login)

### Migration History

View applied migrations on remote:

```bash
npx supabase migration list --linked
```

## References

- [Supabase CLI - db push](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Supabase - Seeding Your Database](https://supabase.com/docs/guides/local-development/seeding-your-database)
- Issue #545: Implement migration-based seeding for remote databases
- Local command: `.claude/commands/database/supabase-reset.md`

## Related Commands

- `/database:supabase-reset` - Local database reset with automatic seeding
- `/supabase:web:typegen` - Generate TypeScript types after migrations
- `/core:git:status` - Check what migrations are staged for commit

---

**Command Type**: Infrastructure
**Category**: Database
**Created**: 2025-11-04
**Related Issue**: #545
