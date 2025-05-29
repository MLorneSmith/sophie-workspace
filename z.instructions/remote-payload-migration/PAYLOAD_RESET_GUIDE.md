# Payload CMS Complete Reset Guide

This guide documents the complete 4-step reset procedure for Payload CMS when schema corruption occurs or a fresh start is needed in production.
test 

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

# Ensure SSL certificate exists
ls -la supabase-ca-cert.crt

# Download if missing
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl
```

### 3. Environment Variables (Working Configuration)
```bash
# Load proven working environment
export DATABASE_URI="postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=supabase-ca-cert.crt"
export PAYLOAD_SECRET="abcfedd4-6912-42ae-b4c9-b29101294a00"
export NODE_ENV="production"
export PAYLOAD_MIGRATION_MODE="production"
export PAYLOAD_ENABLE_SSL="true"
export PAYLOAD_PUBLIC_SERVER_URL="https://payload.slideheroes.com"
```

### 4. Verify SSL Connection
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT version();" }
# Expected result: PostgreSQL version string confirming connection
```

## 🔄 4-Step Reset Procedure

### Step 1: Drop Payload Schema
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Expected result: Schema dropped successfully

# Use Supabase MCP: list_schemas
# Expected result: 'payload' schema not listed (No matching schemas found)
```

> **Note:** You may need to clean up enum types manually if they persist after dropping the schema:
> ```sql
> DROP TYPE IF EXISTS enum_users_role CASCADE;
> DROP TYPE IF EXISTS payload.enum_users_role CASCADE;
> DROP TYPE IF EXISTS public.enum_users_role CASCADE;
> ```

**Verification:**
```bash
# Use Supabase MCP: list_tables
# Parameters: { "schemas": ["payload"] }
# Expected result: Empty list (0 tables)
```

### Step 2: Delete Migration Files
```bash
cd apps/payload

# Remove all existing migration files
rm -rf src/migrations/*.ts src/migrations/*.json

# Verify migrations directory is clean
ls -la src/migrations/
# Should show only directory structure, no .ts or .json files
```

**Verification:**
```bash
# Confirm migrations directory is empty
find src/migrations/ -name "*.ts" -o -name "*.json" | wc -l
# Should return: 0
```

### Step 3: Generate Fresh Migration
```bash
# Generate new comprehensive migration
pnpm --filter payload payload migrate:create -- --name reset_schema

# Verify migration was created
ls -la src/migrations/
```

**Expected Results:**
- New migration file: `20250528_XXXXXX_reset_schema.ts`
- Corresponding JSON file: `20250528_XXXXXX_reset_schema.json`
- Migration size: ~1,485+ lines (comprehensive schema)

**Verification:**
```bash
# Check migration file size
wc -l src/migrations/*_reset_schema.ts
# Should show 1400+ lines

# Preview migration content
head -20 src/migrations/*_reset_schema.ts
```

### Step 4: Execute Migration
```bash
# Recreate the payload schema before applying migrations
pnpm --filter payload payload migrate:create -- --recreate-schema

# Run the fresh migration
npm run payload migrate

# Monitor output for success
```

**Expected Output:**
```
[PAYLOAD-INFO] Database adapter created successfully
[PAYLOAD-INFO] Running migration: 20250528_XXXXXX_reset_schema
[PAYLOAD-INFO] Migration completed successfully
```

**Verification:**
```bash
# Run migration status command as usual
npm run payload migrate -- --status

# Use Supabase MCP: list_schemas
# Expected result: 'payload' schema listed

# Use Supabase MCP: list_tables
# Parameters: { "schemas": ["payload"] }
# Expected result: List of tables count 20+
```

## 🔍 Comprehensive Verification

### 1. Schema State Verification
```bash
# Use Supabase MCP: list_tables
# Parameters: { "schemas": ["payload"] }
# Expected result: List of all tables in payload schema

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name IN ('courses', 'users', 'media', 'payload_migrations') ORDER BY table_name;" }
# Expected result: List of key tables present
```

### 2. Migration Record Verification
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT * FROM payload.payload_migrations ORDER BY created_at DESC LIMIT 1;" }
# Expected result: Latest migration record details

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT name, created_at FROM payload.payload_migrations WHERE name LIKE '%reset_schema%';" }
# Expected result: Migration names matching reset_schema with timestamps
```

### 3. Schema Integrity Verification
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'payload' AND tc.constraint_type = 'FOREIGN KEY';" }
# Expected result: List of foreign key constraints in payload schema

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'payload';" }
# Expected result: List of indexes in payload schema
```

### 4. Application Health Verification
```bash
# Test Payload CLI
npm run payload --help

# Test admin panel (if running)
curl -f https://payload.slideheroes.com/admin || echo "Admin not accessible"

# Test API health endpoint
curl -f https://payload.slideheroes.com/api/health || echo "API not accessible"
```

## 🐛 Troubleshooting Reset Issues

### SSL Connection Failures
```bash
# Re-download SSL certificate
curl -o supabase-ca-cert.crt https://supabase.com/docs/guides/database/ssl

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT current_database();" }
# Expected result: Current database name confirming SSL connection

# If still failing, check certificate permissions
chmod 644 supabase-ca-cert.crt
```

### Migration Generation Failures
```bash
# Enable debug mode
export PAYLOAD_DEBUG=true

# Try migration generation with verbose output
npm run payload generate:migration -- --name reset_schema --verbose

# Check for configuration issues
npm run payload --help | grep migrate
```

### Schema Drop Failures
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT pid, usename, application_name FROM pg_stat_activity WHERE datname = current_database();" }
# Expected result: List of active connections to current database

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" }
# Expected result: Termination of other active connections

# Use Supabase MCP: execute_sql
# Parameters: { "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Expected result: Schema dropped successfully
```

### Migration Execution Failures
```bash
# Use Supabase MCP: list_schemas
# Expected result: 'payload' schema listed if exists

# Verify migration file integrity
node -c src/migrations/*_reset_schema.ts

# Run with increased timeout
export PAYLOAD_DB_TIMEOUT=60000
npm run payload migrate
```

## 📊 Success Metrics

### Expected Schema Results
- **Tables Created**: 58+ tables in payload schema
- **Migration File Size**: 1,548+ lines
- **Foreign Key Constraints**: 88+ constraints
- **Indexes**: 302+ indexes created
- **Execution Time**: 30-60 seconds

### Verification Checklist
- [ ] Schema dropped successfully
- [ ] Migration files deleted
- [ ] New migration generated (1,485+ lines)
- [ ] Migration executed without errors
- [ ] Payload schema exists with all tables
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
# Parameters: { "query": "DROP SCHEMA IF EXISTS payload CASCADE;" }
# Continue with remaining steps...
```

## 🚨 Emergency Procedures

### If Reset Fails Completely
1. **Immediate**: Restore from backup
2. **Investigate**: Check logs and error messages
3. **Verify**: Environment variables and SSL setup
4. **Retry**: With debug mode enabled

### If Database Connection Lost
1. **Check**: Network connectivity
2. **Verify**: SSL certificate validity
3. **Test**: Connection string format
4. **Confirm**: Database server status

## 📝 Reset Completion Checklist

- [ ] Database backup created and verified
- [ ] SSL certificate setup confirmed
- [ ] Environment variables loaded correctly
- [ ] Schema dropped successfully
- [ ] Migration files cleaned up
- [ ] Fresh migration generated (1,485+ lines)
- [ ] Migration executed without errors
- [ ] Schema verification completed
- [ ] Application health check passed
- [ ] Migration recorded in database
- [ ] No error messages in final logs

## 🔗 Related Documentation

- **Migration Guide**: `MIGRATION_GUIDE.md` - Standard migration procedures
- **Quick Reference**: `QUICK_MIGRATION_REFERENCE.md` - Essential commands
- **Config Files**: 
  - `src/payload.config.ts` - Payload configuration
  - `src/lib/database-adapter-singleton.ts` - Database adapter

## 📞 Support

If reset procedure fails:
1. Restore from backup immediately
2. Review environment variables and SSL setup
3. Check network connectivity to Supabase
4. Verify SSL certificate integrity
5. Enable debug mode for detailed error logs
6. Document specific error messages for investigation

---
⚠️ **IMPORTANT**: This procedure completely rebuilds the payload schema. Ensure you have a verified backup before proceeding.