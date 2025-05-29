# Payload CMS Complete Reset Guide

This guide documents the complete 4-step reset procedure for Payload CMS when schema corruption occurs or a fresh start is needed in production.


## 🚨 When to Use This Guide

- Migration failures due to schema corruption
- "Column does not exist" errors during migration
- Inconsistent schema state after failed migrations
- Need to rebuild payload schema from scratch
- Production schema conflicts requiring clean slate

## ⚠️ Critical Prerequisites

### 1. Database Backup (MANDATORY)
```bash
# Create timestamped backup
pg_dump "$DATABASE_URI" > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup integrity
pg_restore --list backup_20250528_131900.sql | head -10
```

### 2. SSL Certificate Setup
```bash
cd apps/payload

# Ensure SSL certificate exists (CORRECT FILENAME)
ls -la prod-ca-2021.crt

# Download if missing (UPDATED URL)
curl -o prod-ca-2021.crt https://supabase.com/docs/guides/database/ssl

# For Windows PowerShell users:
Test-Path prod-ca-2021.crt
# Download if missing
Invoke-WebRequest -Uri "https://supabase.com/docs/guides/database/ssl" -OutFile "prod-ca-2021.crt"
```

### 3. Environment Variables (VERIFIED WORKING CONFIGURATION)
```bash
# CRITICAL: Verify these environment variables are set BEFORE proceeding
export DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=prod-ca-2021.crt"
export PAYLOAD_SECRET="abcfedd4-6912-42ae-b4c9-b29101294a00"
export NODE_ENV="development"
export PAYLOAD_ENABLE_SSL="true"
export PAYLOAD_MIGRATION_MODE="production"
export PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"

# For Windows PowerShell users:
$env:DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=prod-ca-2021.crt"
$env:PAYLOAD_SECRET="abcfedd4-6912-42ae-b4c9-b29101294a00"
$env:NODE_ENV="development"
$env:PAYLOAD_ENABLE_SSL="true"
$env:PAYLOAD_MIGRATION_MODE="production"
$env:PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"
```

### 4. Environment Variables Verification (MANDATORY)
```bash
# UNIX/Linux/MacOS - Verify all required variables are set
echo "DATABASE_URI: ${DATABASE_URI:0:50}..."
echo "PAYLOAD_SECRET: ${PAYLOAD_SECRET:0:20}..."
echo "NODE_ENV: $NODE_ENV"
echo "PAYLOAD_ENABLE_SSL: $PAYLOAD_ENABLE_SSL"
echo "PAYLOAD_MIGRATION_MODE: $PAYLOAD_MIGRATION_MODE"
echo "PAYLOAD_PUBLIC_SERVER_URL: $PAYLOAD_PUBLIC_SERVER_URL"

# Windows PowerShell - Verify all required variables are set
Write-Host "DATABASE_URI: $($env:DATABASE_URI.Substring(0,50))..."
Write-Host "PAYLOAD_SECRET: $($env:PAYLOAD_SECRET.Substring(0,20))..."
Write-Host "NODE_ENV: $env:NODE_ENV"
Write-Host "PAYLOAD_ENABLE_SSL: $env:PAYLOAD_ENABLE_SSL"
Write-Host "PAYLOAD_MIGRATION_MODE: $env:PAYLOAD_MIGRATION_MODE"
Write-Host "PAYLOAD_PUBLIC_SERVER_URL: $env:PAYLOAD_PUBLIC_SERVER_URL"

# Check for PAYLOAD-related environment variables
Get-ChildItem Env: | Where-Object Name -like "*PAYLOAD*"
```

### 5. Verify SSL Connection
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT version();" }
# Expected result: PostgreSQL version string confirming connection

> **Note:** Use supabase-mcp MCP server, not postgres MCP server (postgres only works with local databases)
```

## 🔄 4-Step Reset Procedure

### Step 1: Drop Payload Schema

> **Important:** Enum cleanup is now mandatory for reset success. Perform enum cleanup before proceeding to Step 2.

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Expected result: Schema dropped successfully

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';" }
# Expected result: Empty list (No matching schemas found)
```

> **Note:** You may need to clean up enum types manually if they persist after dropping the schema:
> ```sql
> DROP TYPE IF EXISTS enum_users_role CASCADE;
> DROP TYPE IF EXISTS payload.enum_users_role CASCADE;
> DROP TYPE IF EXISTS public.enum_users_role CASCADE;
> ```

> **Updated:** Enum cleanup is now a required step in the main reset procedure, not optional troubleshooting.

**Verification:**
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';" }
# Expected result: Empty list (0 tables)
```

### Step 2: Clear Migration Files
```bash
cd apps/payload

# For UNIX/Linux/MacOS users:
rm -rf src/migrations/*.ts src/migrations/*.json

# For Windows PowerShell users:
Remove-Item src/migrations/*.ts -Force -ErrorAction SilentlyContinue
Remove-Item src/migrations/*.json -Force -ErrorAction SilentlyContinue

# Verify migrations directory is clean
Get-ChildItem src/migrations/ -File
# Should show only index.ts file

# Ensure index.ts contains empty migrations array
cat src/migrations/index.ts
# Should show: export const migrations = [];
```

**Verification:**
```bash
# Confirm migrations directory is clean (Windows PowerShell)
(Get-ChildItem src/migrations/ -Name "*.ts" -Exclude "index.ts").Count
(Get-ChildItem src/migrations/ -Name "*.json").Count
# Both should return: 0
```

### Step 3: Generate Fresh Migration
```bash
# Generate new comprehensive migration
pnpm payload migrate:create --name reset_schema

# For Windows PowerShell users verify migration was created:
Get-ChildItem src/migrations/ -File
```

**Expected Results:**
- New migration file: `20250529_XXXXXX.ts` (timestamp-based naming)
- Migration size: ~1,485+ lines (comprehensive schema)
- Updated index.ts with migration export

**Verification:**
```bash
# Check migration file exists (Windows PowerShell)
Get-ChildItem src/migrations/ -Name "*.ts" -Exclude "index.ts"
# Should show new migration file

# Preview migration content (Windows PowerShell)
Get-Content src/migrations/20*.ts | Select-Object -First 20
```

### Step 4: Execute Migration
```bash
# CRITICAL: Create payload schema first
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "CREATE SCHEMA IF NOT EXISTS payload;" }

# Run the fresh migration
pnpm payload migrate

# Monitor output for success
```

**Expected Output:**
```
[PAYLOAD-CONFIG] Initializing Payload CMS with enhanced database connection management
[PAYLOAD-CONFIG] Environment: development
[PAYLOAD-CONFIG] Database adapter: Enhanced PostgreSQL with singleton pattern
[DB-ADAPTER-INFO] Database adapter created successfully
[INFO] Migrating: 20250529_195206
[INFO] Migrated:  20250529_195206 (1744ms)
[INFO] Done.
```

**Verification:**
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';" }
# Expected result: 'payload' schema listed

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'payload';" }
# Expected result: Count of 50+ tables
```

## 🔍 Comprehensive Verification

### 5. Schema State Verification
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name;" }
# Expected result: List of all tables in payload schema (58+ tables)

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name IN ('courses', 'users', 'media', 'payload_migrations') ORDER BY table_name;" }
# Expected result: List of key tables present
```

### 6. Migration Record Verification
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT * FROM payload.payload_migrations ORDER BY created_at DESC LIMIT 1;" }
# Expected result: Latest migration record details

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT name, created_at FROM payload.payload_migrations WHERE name LIKE '%reset_schema%' OR name LIKE '%20250529%';" }
# Expected result: Migration names matching reset pattern with timestamps
```

### 7. Schema Integrity Verification
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'payload' AND tc.constraint_type = 'FOREIGN KEY';" }
# Expected result: List of foreign key constraints in payload schema

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'payload';" }
# Expected result: List of indexes in payload schema
```

### 8. Application Health Verification
```bash
# Test Payload CLI
pnpm payload --help

# Test admin panel (if running)
curl -f https://payload.slideheroes.com/admin || echo "Admin not accessible"

# Test API health endpoint
curl -f https://payload.slideheroes.com/api/health || echo "API not accessible"
```

## 🐛 Troubleshooting Reset Issues

### Missing Environment Variables
```bash
# CRITICAL: Check environment variables first
echo "Checking critical environment variables..."

# For UNIX/Linux/MacOS
if [ -z "$DATABASE_URI" ]; then echo "ERROR: DATABASE_URI not set"; fi
if [ -z "$PAYLOAD_SECRET" ]; then echo "ERROR: PAYLOAD_SECRET not set"; fi
if [ -z "$PAYLOAD_ENABLE_SSL" ]; then echo "ERROR: PAYLOAD_ENABLE_SSL not set"; fi

# For Windows PowerShell
if (-not $env:DATABASE_URI) { Write-Host "ERROR: DATABASE_URI not set" -ForegroundColor Red }
if (-not $env:PAYLOAD_SECRET) { Write-Host "ERROR: PAYLOAD_SECRET not set" -ForegroundColor Red }
if (-not $env:PAYLOAD_ENABLE_SSL) { Write-Host "ERROR: PAYLOAD_ENABLE_SSL not set" -ForegroundColor Red }

# Solution: Re-export all environment variables from Step 3
```

### SSL Connection Failures
```bash
# CRITICAL: Use correct certificate filename (prod-ca-2021.crt, NOT supabase-ca-cert.crt)
ls -la prod-ca-2021.crt  # UNIX/Linux/MacOS
Test-Path prod-ca-2021.crt  # Windows PowerShell

# Re-download SSL certificate with correct filename
curl -o prod-ca-2021.crt https://supabase.com/docs/guides/database/ssl  # UNIX/Linux/MacOS
Invoke-WebRequest -Uri "https://supabase.com/docs/guides/database/ssl" -OutFile "prod-ca-2021.crt"  # Windows PowerShell

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT current_database();" }
# Expected result: Current database name confirming SSL connection

# If still failing, check certificate permissions
chmod 644 prod-ca-2021.crt  # UNIX/Linux/MacOS
# For Windows: Ensure file is not blocked
Unblock-File prod-ca-2021.crt  # Windows PowerShell
```

### Migration Generation Failures
```bash
# Enable debug mode
export PAYLOAD_DEBUG=true  # UNIX/Linux/MacOS
$env:PAYLOAD_DEBUG="true"  # Windows PowerShell

# Try migration generation with verbose output
pnpm payload migrate:create --name reset_schema

# Check for configuration issues
pnpm payload --help | grep migrate
```

### Schema Drop Failures
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT pid, usename, application_name FROM pg_stat_activity WHERE datname = current_database();" }
# Expected result: List of active connections to current database

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" }
# Expected result: Termination of other active connections

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Expected result: Schema dropped successfully
```

### Migration Execution Failures
```bash
# CRITICAL: Ensure payload schema exists before migration
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "CREATE SCHEMA IF NOT EXISTS payload;" }

# Verify migration file integrity
node -c src/migrations/20*.ts

# Run with increased timeout
export PAYLOAD_DB_TIMEOUT=60000  # UNIX/Linux/MacOS
$env:PAYLOAD_DB_TIMEOUT="60000"  # Windows PowerShell
pnpm payload migrate
```

## 📊 Success Metrics

### Expected Schema Results
- **Tables Created**: 58+ tables in payload schema
- **Migration File Size**: 1,548+ lines
- **Foreign Key Constraints**: 88+ constraints
- **Indexes**: 302+ indexes created
- **Execution Time**: 30-60 seconds

### Verification Checklist
- [ ] Environment variables verified and set correctly
- [ ] SSL certificate exists with correct filename (prod-ca-2021.crt)
- [ ] Schema dropped successfully
- [ ] Migration files deleted
- [ ] New migration generated (1,485+ lines)
- [ ] Payload schema created before migration execution
- [ ] Migration executed without errors
- [ ] Payload schema exists with 58+ tables
- [ ] Migration recorded in payload_migrations
- [ ] Foreign key constraints in place
- [ ] SSL connection working
- [ ] No error messages in logs

## 🔄 Rollback from Reset

### Option 1: Restore from Backup (Recommended)
```bash
# Restore complete database from backup using psql as no direct MCP equivalent for restore
psql "$DATABASE_URI" < backup_20250528_131900.sql
```

### Option 2: Re-run Reset (If Partial Failure)
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Continue with remaining steps...
```

## 🚨 Emergency Procedures

### If Reset Fails Completely
1. **Immediate**: Restore from backup
2. **Investigate**: Check logs and error messages
3. **Verify**: Environment variables and SSL setup (most common issue)
4. **Retry**: With debug mode enabled

### If Database Connection Lost
1. **Check**: Environment variables (DATABASE_URI, PAYLOAD_ENABLE_SSL)
2. **Verify**: SSL certificate validity and correct filename (prod-ca-2021.crt)
3. **Test**: Connection string format
4. **Confirm**: Database server status

## ⚠️ Known Issues

### Payload/Drizzle Enum Conflict Workaround

When recreating enums, you may encounter conflicts due to Payload and Drizzle enum handling. Use the following DO block to safely create enums without errors:

```sql
DO $$ BEGIN
    CREATE TYPE "payload"."enum_name" AS ENUM('value1', 'value2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

### Enum Conflict Resolution During Reset

If you encounter enum conflicts during the reset process, ensure the mandatory enum cleanup step is completed before dropping the schema. Use the following verification and cleanup commands as needed:

```sql
-- Verify existing enums
SELECT typname, nspname
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typtype = 'e'
AND (nspname = 'payload' OR typname LIKE 'enum_%' OR typname LIKE '%payload%')
ORDER BY nspname, typname;

-- Cleanup enums manually if necessary
DO $$
DECLARE
    enum_record RECORD;
BEGIN
    FOR enum_record IN
        SELECT typname, nspname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typtype = 'e' AND (nspname = 'payload' OR (nspname = 'public' AND typname LIKE 'enum_%'))
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(enum_record.nspname) || '.' || quote_ident(enum_record.typname) || ' CASCADE';
    END LOOP;
END $$;
```

## 📝 Reset Completion Checklist

- [ ] Database backup created and verified
- [ ] SSL certificate setup confirmed (prod-ca-2021.crt)
- [ ] Environment variables loaded and verified correctly
- [ ] Schema dropped successfully
- [ ] Migration files cleaned up
- [ ] Fresh migration generated (1,485+ lines)
- [ ] Payload schema created before migration execution
- [ ] Migration executed without errors
- [ ] Schema verification completed (58+ tables)
- [ ] Application health check passed
- [ ] Migration recorded in database
- [ ] No error messages in final logs

## 🔗 Related Documentation

- **Migration Guide**: `MIGRATION_GUIDE.md` - Standard migration procedures
- **Quick Reference**: `QUICK_MIGRATION_REFERENCE.md` - Essential commands
- **Config Files**:
  - `src/payload.config.ts` - Payload configuration
  - `src/lib/database-adapter-singleton.ts` - Database adapter

## 🆔 Supabase Project ID

The Supabase project ID for this reset is:

```
ldebzombxtszzcgnylgq
```

> **Note:** When delegating tasks related to this reset, always provide this project ID to ensure correct context and access.


## 📞 Support

If reset procedure fails:
1. **FIRST**: Check environment variables are properly set (most common issue)
2. **SECOND**: Verify SSL certificate filename is correct (prod-ca-2021.crt)
3. Restore from backup immediately if needed
4. Review network connectivity to Supabase
5. Enable debug mode for detailed error logs
6. Document specific error messages for investigation

---
⚠️ **IMPORTANT**: This procedure completely rebuilds the payload schema. Ensure you have a verified backup before proceeding.