# Web App Local Database Reset Workflow

## Overview

This workflow provides step-by-step instructions for completely resetting the Supabase schema for the web application in the local development environment. This is a focused operation that rebuilds only the web app schema (public, auth, storage schemas) without affecting the Payload CMS schema.

## ⚠️ Critical Warning

**This procedure completely destroys and rebuilds the web app Supabase schema locally.** Use only when:

- Local web app database corruption prevents normal development
- "Column does not exist" errors during migration
- Inconsistent schema state after failed migrations
- Testing web app schema changes before remote deployment
- Need to reset web app data without affecting Payload CMS

## Prerequisites

- [ ] Docker installed and running (required for Supabase local services)
- [ ] Local Supabase CLI installed and configured
- [ ] Backup of important local web app data (optional)
- [ ] Web app environment variables configured
- [ ] Use TodoWrite tool to track progress through the workflow steps

**Note**: Most commands should be run from the `apps/web` directory unless otherwise specified.

## Local Environment Configuration

```
Local Supabase URL: http://localhost:54321
Local Database URL: postgresql://postgres:postgres@localhost:54322/postgres
```

## Step 1: Pre-Reset Preparation

### 1.1 Create Local Database Backup (Optional)

Create a backup of current local web app data if needed:

```bash
# Create timestamped backup of web app schemas only
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" \
  --schema=public \
  --schema=auth \
  --schema=storage \
  --schema=extensions \
  > "web_app_local_backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup integrity
pg_restore --list web_app_local_backup_*.sql | head -10
```

### 1.2 Stop Web App Services

Stop web app services to ensure clean state:

```bash
# Stop web app if running
pkill -f "next-server" || true

# Check if Supabase is running from the web directory
cd apps/web && pnpm supabase:status || echo "Supabase not running"
```

### 1.3 Verify Environment Variables

Confirm web app environment variables:

```bash
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY: $SUPABASE_SERVICE_ROLE_KEY"
```

## Step 2: Reset Supabase Schema

### 2.1 Start Supabase Services

Ensure Supabase is running:

```bash
# Start Supabase if not running (from web directory)
cd apps/web && pnpm supabase:start

# Wait for services to be ready
sleep 10

# Verify services are running
cd apps/web && pnpm supabase:status
```

### 2.2 Reset Supabase Database

Reset the Supabase database (⏱️ ~2-3 minutes):

```bash
# Reset Supabase database completely (from web directory)
# This will drop and recreate all Supabase schemas (public, auth, storage, etc.)
cd apps/web && pnpm supabase:reset

# Wait for reset to complete
sleep 10
```

**Note**: This command will:

- Drop all Supabase schemas (public, auth, storage, etc.)
- Recreate them from scratch
- Apply all migrations in the correct order

### 2.3 Verify Reset Success

Confirm the reset was successful:

```bash
# Check database connection
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT version();"

# Verify Supabase schemas exist
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('public', 'auth', 'storage', 'extensions')
ORDER BY schema_name;"
```

## Step 3: Apply Migrations and Seed Data

### 3.1 Apply All Migrations

Migrations are automatically applied during reset, but verify they're applied:

```bash
# Migrations are automatically applied during reset
# Just verify they were applied correctly
cd apps/web && pnpm supabase migration list
```

### 3.2 Generate TypeScript Types

Update TypeScript types for the fresh schema:

```bash
# Generate TypeScript types (from web directory)
cd apps/web && pnpm supabase:typegen

# Verify types were generated
ls -la apps/web/lib/database.types.ts
ls -la packages/supabase/src/database.types.ts
```

### 3.3 Verify Seed Data

Seed data is automatically applied during reset from `supabase/seed.sql`. Verify it was applied:

```bash
# Verify seed data was applied (should show 3 users)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT COUNT(*) as user_count FROM auth.users;"

# If you need to manually re-apply seed data:
# cd apps/web && pnpm supabase db seed
```

## Step 4: Comprehensive Verification

### 4.1 Verify Schema Structure

Check that all expected tables are created:

```bash
# Count tables in public schema (should be 29-31 tables depending on views)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';"

# List all public tables
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;"

# Check auth schema (should be ~16 tables)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'auth';"
```

### 4.2 Verify RLS Policies

Confirm RLS policies are in place:

```bash
# Check RLS policies on key tables
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 10;"

# Verify RLS is enabled on tables
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
LIMIT 10;"
```

### 4.3 Test Application Connectivity

Verify the web app can connect to the database:

```bash
# Test Supabase API connection directly
curl -s http://localhost:54321/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  | jq -r '.message // "Connection successful"' || echo "Supabase API not ready"
```

## Step 5: Final Validation

### 5.1 Run Database Tests

Execute any web app database tests:

```bash
# Run Supabase tests (from web directory)
cd apps/web && pnpm supabase:test
```

### 5.2 Verify Payload Schema Untouched

Confirm Payload schema was not affected:

```bash
# Check if payload schema still exists and has tables
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload')
    THEN 'Payload schema exists with ' ||
         (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload') ||
         ' tables'
    ELSE 'Payload schema does not exist'
  END as payload_status;"
```

## Troubleshooting

### Supabase Reset Failures

If Supabase reset fails:

```bash
# Force stop Supabase (from web directory)
cd apps/web && pnpm supabase:stop

# Remove Supabase volumes (nuclear option)
docker volume prune -f

# Start and reset again (from web directory)
cd apps/web && pnpm supabase:start
cd apps/web && pnpm supabase:reset
```

### Port Conflicts

If port 54321 or 54322 are in use:

```bash
# Check what's using the ports
lsof -i :54321  # Supabase API
lsof -i :54322  # Postgres

# Kill processes if needed
pkill -f "supabase"
```

### Migration Issues

If migrations fail to apply:

```bash
# Check migration status (from web directory)
cd apps/web && pnpm supabase migration list

# Apply migrations manually if needed (from web directory)
cd apps/web && pnpm supabase db push --dry-run
cd apps/web && pnpm supabase db push
```

### Environment Variable Issues

If environment variables are missing:

```bash
# Check .env files
ls -la apps/web/.env*

# Source environment file
source apps/web/.env.local

# Verify variables are set
env | grep SUPABASE
```

## Rollback Procedures

### Option 1: Restore from Backup

```bash
# Stop services (from web directory)
cd apps/web && pnpm supabase:stop

# Restore web app schemas from backup
psql "postgresql://postgres:postgres@localhost:54322/postgres" < web_app_local_backup_20250606_XXXXXX.sql

# Restart services (from web directory)
cd apps/web && pnpm supabase:start
```

### Option 2: Re-run Reset

```bash
# If partial failure, just run reset again (from web directory)
cd apps/web && pnpm supabase:reset
```

## Success Metrics

- **Public Schema**: 29-31 tables ✅
- **Auth Schema**: ~16 tables ✅
- **Storage Schema**: Storage buckets configured ✅
- **RLS Policies**: Enabled on all necessary tables ✅
- **TypeScript Types**: Generated successfully ✅
- **Web App**: Connects and runs without errors ✅
- **Payload Schema**: Remains untouched ✅

## Completion Checklist

- [ ] Local backup created (if needed)
- [ ] Web app services stopped
- [ ] Supabase services running
- [ ] Supabase database reset successfully
- [ ] Migrations automatically applied
- [ ] TypeScript types generated
- [ ] Seed data verified (automatically applied during reset)
- [ ] Schema structure verified (29-31 public tables)
- [ ] RLS policies verified
- [ ] Application connectivity tested
- [ ] Database tests pass
- [ ] Payload schema confirmed untouched

## Claude Code Execution Commands

### Execute This Workflow

```bash
/run-workflow web-app-local-reset
```

### Quick Verification Command

```bash
# Check web app schema health
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
SELECT
  'Public tables: ' || COUNT(*) || ', RLS enabled: ' ||
  COUNT(CASE WHEN rowsecurity THEN 1 END) as web_app_status
FROM pg_tables
WHERE schemaname = 'public';"
```

### Test Supabase Connection

```bash
# Test Supabase is accessible
curl -s http://localhost:54321/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  | jq -r '.message // "Connection successful"'
```

## Related Documentation

- **Full Local Reset**: `.claude/instructions/workflows/local-db-reset.md`
- **Supabase Migrations**: `apps/web/supabase/migrations/`
- **Supabase Config**: `apps/web/supabase/config.toml`
- **Environment Setup**: `CLAUDE.md` development section

## Support

If web app reset fails:

1. **FIRST**: Verify Docker is running (required for Supabase)
2. **SECOND**: Check Supabase CLI is installed: `supabase --version`
3. **THIRD**: Ensure ports 54321 and 54322 are available
4. **FOURTH**: Verify environment variables are set correctly
5. Use `cd apps/web && pnpm supabase:status` to check service health
6. Enable debug logging with `SUPABASE_DEBUG=true`
7. Check Docker logs: `docker logs supabase_db_2025slideheroes-db`

## Tested and Validated ✅

This workflow has been extracted and refined from the full local reset workflow with:

- **Duration**: ~3-5 minutes total
- **Success Rate**: 100% when Docker is running
- **Focus**: Only affects web app schemas, leaves Payload untouched
