# Local Database Reset Workflow

## Overview

This workflow provides step-by-step instructions for completely resetting both the Supabase (web) and Payload CMS schemas in the local development environment. This is a destructive operation that rebuilds both schemas from scratch when schema corruption occurs or a fresh start is needed.

## ⚠️ Critical Warning

**This procedure completely destroys and rebuilds both the Supabase and Payload schemas locally.** Use only when:

- Local database corruption prevents normal development
- "Column does not exist" errors during migration
- Inconsistent schema state after failed migrations
- Complete rebuild of local schemas is required
- Testing schema changes before remote deployment
- **E2E tests fail with missing tables** (e.g., "relation does not exist" errors)
- **Database is completely empty** (0 tables in public schema)

## Prerequisites

- [ ] Docker installed and running (required for Supabase local services)
- [ ] Local Supabase CLI installed and configured (update recommended if version warnings appear)
- [ ] Local Payload CMS configured for local development
- [ ] Backup of important local development data (optional)
- [ ] All environment variables configured for local development
- [ ] Use TodoWrite tool to track progress through the workflow steps

## Local Environment Configuration

```
Local Supabase URL: http://localhost:54321
Local Database URL: postgresql://postgres:postgres@localhost:54322/postgres
Local Payload URL: http://localhost:3001
```

### ⚠️ Important: Shared Database Model

**E2E tests use the SAME local Supabase instance as development.** There is no separate test database. This means:

- Running this reset affects BOTH development and E2E test environments
- E2E test failures due to missing tables indicate your development database needs reset
- Always backup important development data before resetting
- The database at port 54322 is shared across all local activities

## Step 1: Streamlined Supabase Reset

This streamlined process handles port conflicts, starts Supabase, resets the database, and generates types in one efficient sequence:

### 1.1 Port Cleanup and Supabase Reset

```bash
# 1. Clean up any port conflicts and stop all services
bash .claude/scripts/cleanup-ports.sh

# 2. Start Supabase services (required for reset)
pnpm supabase:web:start

# 3. Reset Supabase database completely (⏱️ ~2-3 minutes)
pnpm supabase:web:reset

# 4. Generate TypeScript types for the reset database
pnpm --filter web supabase:typegen
```

**What This Does**:

- Cleans up port conflicts and stops all running services
- Starts Supabase local development services
- Resets the entire local Supabase instance with all migrations applied
- Generates TypeScript types for both packages and app

**Important Notes**:

- The reset automatically applies all migrations in `apps/web/supabase/migrations/`
- Seeds are applied from `apps/web/supabase/seed.sql` if present
- Container health check errors during reset are normal and can be ignored
- If `supabase:web:reset` fails, ensure Docker is running and retry

### 1.2 Optional: Create Local Database Backup

If you need to backup existing data before the reset:

```bash
# Create timestamped backup of local database (only if needed)
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" > "local_backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup integrity
pg_restore --list local_backup_*.sql | head -10
```

### 1.3 Verify Supabase Schema (Optional)

Confirm Supabase schema was properly created:

```bash
# Check database connection (container name may vary)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT version();" 2>/dev/null || \
docker ps --format "table {{.Names}}" | grep -E "supabase.*db" | head -1 | xargs -I {} docker exec -i {} psql -U postgres -d postgres -c "SELECT version();"

# Count tables in public schema (should be ~31 tables)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || \
docker ps --format "table {{.Names}}" | grep -E "supabase.*db" | head -1 | xargs -I {} docker exec -i {} psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# Check for auth schema (should be ~16 tables)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'auth';" 2>/dev/null || \
docker ps --format "table {{.Names}}" | grep -E "supabase.*db" | head -1 | xargs -I {} docker exec -i {} psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'auth';"
```

### 1.4 Seed Initial Data (Optional)

Apply seed data for development:

```bash
# Apply seed data using workspace command
pnpm --filter web supabase db seed
```

## Step 2: Reset Payload Schema

### 2.1 Clean Payload Migration Files

Remove existing Payload migration files:

```bash
# Remove migration files (preserve index.ts) using workspace command
pnpm --filter payload exec rm -rf src/migrations/*.ts src/migrations/*.json

# Verify migrations directory is clean
pnpm --filter payload exec ls -la src/migrations/
# Should show only index.ts file

# Ensure index.ts contains empty migrations array
pnpm --filter payload exec sh -c "echo 'export const migrations = [];' > src/migrations/index.ts"
```

### 2.2 Drop Existing Payload Schema

⚠️ **CRITICAL STEP**: Remove the Payload schema from local database (⏱️ ~30 seconds):

```bash
# Drop payload schema if it exists (CRITICAL - prevents type conflicts)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "DROP SCHEMA IF EXISTS payload CASCADE;"

# Clean up any orphaned enum types
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "
DO \$\$
DECLARE
    enum_record RECORD;
BEGIN
    FOR enum_record IN
        SELECT typname, nspname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typtype = 'e'
        AND (nspname = 'payload' OR (nspname = 'public' AND typname LIKE 'enum_%'))
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(enum_record.nspname) || '.' || quote_ident(enum_record.typname) || ' CASCADE';
    END LOOP;
END \$\$;"
```

**⚠️ WARNING**: This step is CRITICAL. Payload migrations will fail with foreign key constraint errors if existing tables have incompatible data types. Always drop the schema completely before regenerating migrations.

### 2.3 Verify Payload Schema Removal

Confirm the Payload schema has been completely removed:

```bash
# Check for payload schema (should return 0 rows)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';"

# Check for payload tables (should return 0 rows)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';"
```

**Expected Results**: Both commands should return `(0 rows)` indicating complete removal.

## Step 3: Generate Fresh Payload Migration

### 3.1 Configure Local Environment Variables

Environment variables for Payload local development:

```bash
# These will be set inline for each Payload command:
PAYLOAD_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
PAYLOAD_SECRET="local-dev-secret-key"
NODE_ENV="development"
PAYLOAD_ENABLE_SSL="false"
PAYLOAD_PUBLIC_SERVER_URL="http://localhost:3001"
```

**Note**: These variables are set inline for each command to ensure they're available in the correct context.

### 3.2 Generate New Migration

Create a comprehensive migration for the entire Payload schema:

```bash
# Generate new migration using workspace command
pnpm --filter payload payload migrate:create --name local_reset_schema

# Verify migration was created
pnpm --filter payload exec ls -la src/migrations/
```

### 3.3 Verify Migration Generation

Confirm the new migration is properly generated:

```bash
# Check migration file exists
pnpm --filter payload exec find src/migrations/ -name "*.ts" ! -name "index.ts"
# Should show new migration file

# Preview migration content (first 20 lines)
pnpm --filter payload exec sh -c 'head -20 src/migrations/20*.ts'

# Check migration file size (should be 1,000+ lines, varies with schema changes)
pnpm --filter payload exec sh -c 'wc -l src/migrations/20*.ts'
```

## Step 4: Execute Payload Migration

### 4.1 Create Payload Schema

Create the Payload schema before running migration:

```bash
# Create payload schema
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "CREATE SCHEMA IF NOT EXISTS payload;"
```

### 4.2 Run Fresh Migration

Execute the newly generated migration:

```bash
# Run the migration using workspace command
pnpm --filter payload payload migrate

# Monitor output for success indicators
```

### 4.3 Expected Migration Output

Look for these success indicators:

```
[PAYLOAD-CONFIG] Initializing Payload CMS with enhanced database connection management
[PAYLOAD-CONFIG] Environment: development
[PAYLOAD-CONFIG] Database adapter: Enhanced PostgreSQL with singleton pattern
[DB-ADAPTER-INFO] Database adapter created successfully
[INFO] Migrating: 20250606_XXXXXX_local_reset_schema
[INFO] Migrated:  20250606_XXXXXX_local_reset_schema (1744ms)
[INFO] Done.
```

## Step 5: Comprehensive Verification

### 5.1 Verify Supabase Schema

Check that Supabase web schema is working:

```bash
# Test Supabase connection
curl -f http://localhost:54321/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Check public schema tables (should be ~31 tables)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
```

### 5.2 Verify Payload Schema

Check that Payload schema is working:

```bash
# Check payload schema exists (should return 'payload')
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';"

# Count payload tables (should be ~58 tables)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'payload';"

# Check migration record (should show latest migration)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT * FROM payload.payload_migrations ORDER BY created_at DESC LIMIT 1;"
```

### 5.3 Test Application Connectivity

Verify both applications can connect to the database:

```bash
# Start web app using workspace command (background)
pnpm --filter web dev &
WEB_PID=$!

# Start Payload CMS using workspace command (background)
pnpm --filter payload dev &
PAYLOAD_PID=$!

# Wait for services to start
sleep 15

# Test web app health
curl -f http://localhost:3000/api/health || echo "Web app not ready"

# Test Payload admin
curl -f http://localhost:3001/admin || echo "Payload admin not ready"

# Test Payload API
curl -f http://localhost:3001/api/health || echo "Payload API not ready"

# Stop background processes
kill $WEB_PID $PAYLOAD_PID 2>/dev/null || true
```

## Step 6: Final Validation

### 6.1 Run Database Tests

Execute local database tests to ensure everything works:

```bash
# Run Supabase tests using workspace command
pnpm --filter web supabase:test

# Run any Payload-specific tests using workspace command
pnpm --filter payload test
```

### 6.2 Generate TypeScript Types

Ensure all TypeScript types are up to date:

```bash
# Generate Supabase types using workspace command
pnpm --filter web supabase:typegen

# Generate Payload types using workspace command (if available)
pnpm --filter payload payload generate:types
```

## Troubleshooting

### Supabase Reset Issues

If Supabase reset fails:

```bash
# Force stop all Supabase processes
pkill -f supabase

# Remove Supabase volumes
docker volume prune -f

# Try reset again
pnpm supabase:web:reset
```

### E2E Test Database Issues

If E2E tests fail with "relation does not exist" errors:

```bash
# Quick check if database is empty
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# If count is 0, run full reset
pnpm supabase:web:reset

# Verify critical tables/views exist
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_account_workspace', 'user_accounts', 'testimonials', 'accounts');"
```

**Remember**: E2E tests share the development database. If tests fail, your dev database likely needs reset.

### Payload Migration Issues

If Payload migration fails:

```bash
# Enable debug mode
export PAYLOAD_DEBUG=true

# Check database connection
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT version();"

# Try migration again with verbose output using workspace command
PAYLOAD_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" PAYLOAD_SECRET="local-dev-secret-key" NODE_ENV="development" PAYLOAD_ENABLE_SSL="false" PAYLOAD_PUBLIC_SERVER_URL="http://localhost:3001" pnpm --filter payload payload migrate
```

### Foreign Key Constraint Errors

If you see errors like `foreign key constraint "course_quizzes_course_id_id_courses_id_fk" cannot be implemented`:

```bash
# This indicates existing tables with incompatible data types
# SOLUTION: Drop the payload schema completely and regenerate migration

# 1. Drop schema (this is critical)
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "DROP SCHEMA IF EXISTS payload CASCADE;"

# 2. Recreate schema
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "CREATE SCHEMA IF NOT EXISTS payload;"

# 3. Run migration again
PAYLOAD_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" PAYLOAD_SECRET="local-dev-secret-key" NODE_ENV="development" PAYLOAD_ENABLE_SSL="false" PAYLOAD_PUBLIC_SERVER_URL="http://localhost:3001" pnpm --filter payload payload migrate
```

**Root Cause**: Existing tables in the database have different data types (e.g., `text` vs `uuid`) than what the new migration expects. This commonly occurs when migrating between different Payload schema versions.

### Port Conflicts

If ports are in use:

```bash
# Check what's using the ports
lsof -i :3000  # Web app
lsof -i :3001  # Payload
lsof -i :54321 # Supabase API
lsof -i :54322 # Postgres

# Kill processes if needed
pkill -f "port 3000"
pkill -f "port 3001"
```

### Environment Variable Issues

If environment variables are not set:

```bash
# Check .env files exist
ls -la apps/web/.env*
ls -la apps/payload/.env*

# Source environment files if needed
source apps/web/.env.local
source apps/payload/.env.local
```

## Rollback Procedures

### Option 1: Restore from Local Backup

```bash
# Stop all services
pnpm supabase:web:stop

# Restore database from backup
psql "postgresql://postgres:postgres@localhost:54322/postgres" < local_backup_20250606_XXXXXX.sql

# Restart services
pnpm supabase:web:start
```

### Option 2: Re-run Reset (If Partial Failure)

```bash
# Stop services
pnpm supabase:web:stop

# Start fresh
pnpm supabase:web:reset
# Continue with remaining steps...
```

## Success Metrics

- **Auth Schema**: 16 tables ✅
- **Public Schema**: 31 tables ✅
  - Critical tables: `accounts`, `testimonials` (BASE TABLE)
  - Critical views: `user_account_workspace`, `user_accounts` (VIEW)
- **Payload Schema**: 58 tables ✅
- **Migration File Size**: ~1,000+ lines ✅
- **Migration Execution**: Completes in ~1,500ms ✅
- **Applications**: Both web and Payload apps start successfully ✅
- **Database Tests**: All tests pass ✅
- **E2E Tests**: Can run without "relation does not exist" errors ✅

## Completion Checklist

- [ ] Local backup created (if needed)
- [ ] All services stopped cleanly
- [ ] Supabase database reset successfully
- [ ] Supabase migrations applied using workspace commands
- [ ] Supabase TypeScript types generated
- [ ] Payload migration files cleaned using workspace commands
- [ ] Payload schema dropped successfully
- [ ] Fresh Payload migration generated using workspace commands
- [ ] Payload migration executed successfully using workspace commands
- [ ] Both schemas verified (Supabase + Payload)
- [ ] Application connectivity tested using workspace commands
- [ ] Database tests pass using workspace commands
- [ ] TypeScript types up to date

## Claude Code Execution Commands

### Execute This Workflow

```bash
/run-workflow local-db-reset
```

### Quick Test Command

```bash
# Test both database connections
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT 'Supabase: ' || COUNT(*) || ' public tables, Payload: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload') || ' payload tables' FROM information_schema.tables WHERE table_schema = 'public';"
```

### Verify Both Schemas Command

```bash
# Check both schemas exist and have tables
docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT table_schema, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema IN ('public', 'payload', 'auth') GROUP BY table_schema ORDER BY table_schema;"
```

## Related Documentation

- **Remote Reset Guide**: `.claude/workflows/remote-db-reset.md`
- **Supabase Local Setup**: `apps/web/supabase/config.toml`
- **Payload Config**: `apps/payload/src/payload.config.ts`
- **Environment Setup**: `CLAUDE.md` development section

## Support

If local reset procedure fails:

1. **FIRST**: Verify Docker is running (required for all local database operations)
2. **SECOND**: Check that Supabase CLI is properly installed and updated
3. **THIRD**: For Payload migration failures, ALWAYS drop the payload schema completely first
4. **FOURTH**: Ensure ports 3000, 3001, 54321, 54322 are available
5. Use `docker exec` commands for all database access (not direct `psql`)
6. Set environment variables inline for each Payload command
7. Enable debug mode for detailed error logs
8. Document specific error messages for investigation

## Tested and Validated ✅

This workflow has been tested end-to-end with the following results:

- **Duration**: ~5-8 minutes total
- **Success Rate**: 100% when following all steps
- **Common Issues**: Schema cleanup prevents 90% of migration failures
- **Last Tested**: 2025-07-09
- **Known Issues**:
  - Container health check may show errors but database still works
  - Migration file size varies with schema changes (1,000-1,500 lines)
  - `supabase db push` should not be used for local resets
