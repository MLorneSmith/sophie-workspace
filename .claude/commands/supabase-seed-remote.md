# Supabase Remote Database Reset

Reset and rebuild the remote Supabase database from migrations and seeds.

## Usage

```
/supabase-seed-remote [--push-only]
```

- Default: Full reset (drops everything, rebuilds from migrations + seeds)
- `--push-only`: Only push new migrations (non-destructive)

## What It Does

### Full Reset (Default)

Completely rebuilds the remote database:

1. Backs up current database
2. Drops all tables, functions, policies
3. Re-applies all migrations from scratch
4. Runs seed files

```bash
cd apps/web

# Backup first
npx supabase db dump --linked -f backup-$(date +%Y%m%d).sql

# Full reset (destructive)
npx supabase db reset --linked

# Verify
npx supabase migration list --linked
```

### Push Only (--push-only)

Applies only new migrations without dropping data:

```bash
cd apps/web
npx supabase db push
```

## Verification

```bash
# Check migration status
npx supabase migration list --linked

# Verify test users
npx supabase db exec --linked "
  SELECT email, email_confirmed_at IS NOT NULL as confirmed
  FROM auth.users
  WHERE email LIKE '%@slideheroes.com'
  ORDER BY email;
"
```

## When to Use

- **Full reset**: Schema changes during active development, starting fresh
- **Push only**: Adding new migrations to a working database

## Local Development

For local development, use `/supabase-reset` instead.

## Project Reference

Remote project: `ldebzombxtszzcgnylgq` (2025slideheroes)
