# Remote Database Reset Workflow

## Overview

This workflow provides step-by-step instructions for completely resetting the remote Supabase database for the Payload CMS schema. This is a destructive operation that rebuilds the Payload schema from scratch when schema corruption occurs or a fresh start is needed.

## ⚠️ Critical Warning

**This procedure completely destroys and rebuilds the Payload schema in production.** Use only when:

- Migration failures due to schema corruption
- "Column does not exist" errors during migration
- Inconsistent schema state after failed migrations
- Complete rebuild of Payload schema is required

## Prerequisites

- [ ] Access to remote Supabase database credentials
- [ ] Database backup completed (MANDATORY)
- [ ] SSL certificate obtained for secure connection
- [ ] All Payload environment variables configured
- [ ] Use TodoWrite tool to track progress through the workflow steps

## Supabase Project Configuration

```
Project ID: ldebzombxtszzcgnylgq
Database Host: aws-0-us-east-2.pooler.supabase.com
SSL Certificate: prod-ca-2021.crt
```

## Step 1: Pre-Reset Preparation

### 1.1 Create Database Backup

**MANDATORY** - Create a timestamped backup before proceeding:

```bash
# Set database URI with current credentials
export DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=prod-ca-2021.crt"

# Create backup with timestamp
pg_dump "$DATABASE_URI" > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup integrity
pg_restore --list backup_*.sql | head -10
```

### 1.2 Setup SSL Certificate

Ensure SSL certificate exists in apps/payload directory:

```bash
cd apps/payload

# Download SSL certificate if missing
curl -o prod-ca-2021.crt https://supabase.com/docs/guides/database/ssl

# Verify certificate exists
ls -la prod-ca-2021.crt
```

### 1.3 Configure Environment Variables

Set all required environment variables for production connection:

```bash
export DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=prod-ca-2021.crt"
export PAYLOAD_SECRET="abcfedd4-6912-42ae-b4c9-b29101294a00"
export NODE_ENV="development"
export PAYLOAD_ENABLE_SSL="true"
export PAYLOAD_MIGRATION_MODE="production"
export PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"
```

### 1.4 Verify Environment Variables

Confirm all required variables are properly set:

```bash
echo "DATABASE_URI: ${DATABASE_URI:0:50}..."
echo "PAYLOAD_SECRET: ${PAYLOAD_SECRET:0:20}..."
echo "NODE_ENV: $NODE_ENV"
echo "PAYLOAD_ENABLE_SSL: $PAYLOAD_ENABLE_SSL"
echo "PAYLOAD_MIGRATION_MODE: $PAYLOAD_MIGRATION_MODE"
echo "PAYLOAD_PUBLIC_SERVER_URL: $PAYLOAD_PUBLIC_SERVER_URL"
```

### 1.5 Test SSL Connection

Verify database connectivity before proceeding:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT version();" }
# Expected result: PostgreSQL version string confirming connection
```

## Step 2: Schema Cleanup

### 2.1 Drop Payload Schema

Remove the existing Payload schema and all its contents:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Expected result: Schema dropped successfully
```

### 2.2 Clean Up Enum Types

Clean up any orphaned enum types that may persist:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DO $$ DECLARE enum_record RECORD; BEGIN FOR enum_record IN SELECT typname, nspname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typtype = 'e' AND (nspname = 'payload' OR (nspname = 'public' AND typname LIKE 'enum_%')) LOOP EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(enum_record.nspname) || '.' || quote_ident(enum_record.typname) || ' CASCADE'; END LOOP; END $$;" }
# Expected result: Enum types cleaned up successfully
```

### 2.3 Verify Schema Removal

Confirm the Payload schema has been completely removed:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';" }
# Expected result: Empty list (No matching schemas found)

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';" }
# Expected result: Empty list (0 tables)
```

## Step 3: Migration File Cleanup

### 3.1 Clear Migration Files

Remove all existing migration files to start fresh:

```bash
cd apps/payload

# Remove migration files (preserve index.ts)
rm -rf src/migrations/*.ts src/migrations/*.json

# Verify migrations directory is clean
ls -la src/migrations/
# Should show only index.ts file

# Ensure index.ts contains empty migrations array
cat src/migrations/index.ts
# Should show: export const migrations = [];
```

### 3.2 Verify Migration Cleanup

Confirm migration directory is properly cleaned:

```bash
# Count remaining migration files (should be 0)
find src/migrations/ -name "*.ts" ! -name "index.ts" | wc -l
find src/migrations/ -name "*.json" | wc -l
# Both should return: 0
```

## Step 4: Generate Fresh Migration

### 4.1 Generate New Migration

Create a comprehensive migration for the entire schema:

```bash
cd apps/payload

# Generate new migration
pnpm payload migrate:create --name reset_schema

# Verify migration was created
ls -la src/migrations/
```

### 4.2 Verify Migration Generation

Confirm the new migration is properly generated:

```bash
# Check migration file exists
find src/migrations/ -name "*.ts" ! -name "index.ts"
# Should show new migration file

# Preview migration content (first 20 lines)
head -20 src/migrations/20*.ts

# Check migration file size (should be 1,485+ lines)
wc -l src/migrations/20*.ts
```

## Step 5: Execute Migration

### 5.1 Create Payload Schema

Create the Payload schema before running migration:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "CREATE SCHEMA IF NOT EXISTS payload;" }
# Expected result: Schema created successfully
```

### 5.2 Run Fresh Migration

Execute the newly generated migration:

```bash
cd apps/payload

# Run the migration
pnpm payload migrate

# Monitor output for success indicators
```

### 5.3 Expected Migration Output

Look for these success indicators:

```
[PAYLOAD-CONFIG] Initializing Payload CMS with enhanced database connection management
[PAYLOAD-CONFIG] Environment: development
[PAYLOAD-CONFIG] Database adapter: Enhanced PostgreSQL with singleton pattern
[DB-ADAPTER-INFO] Database adapter created successfully
[INFO] Migrating: 20250529_195206
[INFO] Migrated:  20250529_195206 (1744ms)
[INFO] Done.
```

## Step 6: Comprehensive Verification

### 6.1 Schema State Verification

Verify the Payload schema was properly created:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload';" }
# Expected result: 'payload' schema listed

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'payload';" }
# Expected result: Count of 50+ tables
```

### 6.2 Migration Record Verification

Confirm the migration was properly recorded:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT * FROM payload.payload_migrations ORDER BY created_at DESC LIMIT 1;" }
# Expected result: Latest migration record details

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT name, created_at FROM payload.payload_migrations WHERE name LIKE '%reset_schema%';" }
# Expected result: Migration names matching reset pattern with timestamps
```

### 6.3 Schema Integrity Verification

Verify database constraints and indexes:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'payload' AND tc.constraint_type = 'FOREIGN KEY';" }
# Expected result: List of foreign key constraints in payload schema

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'payload';" }
# Expected result: List of indexes in payload schema
```

### 6.4 Application Health Verification

Test Payload application functionality:

```bash
# Test Payload CLI
pnpm payload --help

# Test admin panel (if accessible)
curl -f https://payload.slideheroes.com/admin || echo "Admin not accessible"

# Test API health endpoint
curl -f https://payload.slideheroes.com/api/health || echo "API not accessible"
```

## Step 7: Connection Testing

### 7.1 Test Database Connection

Verify the reset database is accessible:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT current_database();" }
# Expected result: Current database name
```

### 7.2 Test Schema Access

Confirm schema and tables are accessible:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name;" }
# Expected result: List of all tables in payload schema (58+ tables)
```

## Troubleshooting

### Missing Environment Variables

If environment variables are not set:

```bash
# Re-export all required variables
export DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=prod-ca-2021.crt"
export PAYLOAD_SECRET="abcfedd4-6912-42ae-b4c9-b29101294a00"
export NODE_ENV="development"
export PAYLOAD_ENABLE_SSL="true"
export PAYLOAD_MIGRATION_MODE="production"
export PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"
```

### SSL Connection Failures

If SSL connections fail:

```bash
# Re-download SSL certificate
cd apps/payload
curl -o prod-ca-2021.crt https://supabase.com/docs/guides/database/ssl

# Test connection
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT version();" }
```

### Migration Generation Failures

If migration generation fails:

```bash
# Enable debug mode
export PAYLOAD_DEBUG=true

# Try migration generation with verbose output
pnpm payload migrate:create --name reset_schema

# Check for configuration issues
pnpm payload --help | grep migrate
```

### Schema Drop Failures

If schema cannot be dropped:

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT pid, usename, application_name FROM pg_stat_activity WHERE datname = current_database();" }

# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" }

# Try dropping schema again
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
```

## Rollback Procedures

### Option 1: Restore from Backup (Recommended)

```bash
# Restore complete database from backup
psql "$DATABASE_URI" < backup_20250528_131900.sql
```

### Option 2: Re-run Reset (If Partial Failure)

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Continue with remaining steps...
```

## Success Metrics

- **Tables Created**: 58+ tables in payload schema
- **Migration File Size**: 1,548+ lines
- **Foreign Key Constraints**: 88+ constraints
- **Indexes**: 302+ indexes created
- **Execution Time**: 30-60 seconds

## Completion Checklist

- [ ] Database backup created and verified
- [ ] SSL certificate setup confirmed (prod-ca-2021.crt)
- [ ] Environment variables loaded and verified
- [ ] Schema dropped successfully
- [ ] Migration files cleaned up
- [ ] Fresh migration generated (1,485+ lines)
- [ ] Payload schema created before migration execution
- [ ] Migration executed without errors
- [ ] Schema verification completed (58+ tables)
- [ ] Application health check passed
- [ ] Migration recorded in database
- [ ] No error messages in final logs

## Claude Code Execution Commands

### Execute This Workflow

```bash
/run-workflow remote-db-reset
```

### Test Connection Command

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT version();" }
```

### Verify Schema Command

```bash
# Use Supabase MCP: execute_sql
# Parameters: { "project_id": "ldebzombxtszzcgnylgq", "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name;" }
```

## Related Documentation

- **Migration Guide**: `z.instructions/remote-payload-migration/Migration_Guide.md`
- **Reset Guide**: `z.instructions/remote-payload-migration/PAYLOAD_RESET_GUIDE.md`
- **Quick Reference**: `z.instructions/remote-payload-migration/Quick_Migration_Reference.md`
- **Config Files**: `apps/payload/src/payload.config.ts`

## Support

If reset procedure fails:

1. **FIRST**: Check environment variables are properly set (most common issue)
2. **SECOND**: Verify SSL certificate filename is correct (prod-ca-2021.crt)
3. Restore from backup immediately if needed
4. Review network connectivity to Supabase
5. Enable debug mode for detailed error logs
6. Document specific error messages for investigation
