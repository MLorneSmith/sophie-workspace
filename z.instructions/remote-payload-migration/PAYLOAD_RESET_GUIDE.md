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

> **Note:** Use supabase-mcp MCP server, not postgres MCP server (postgres only works with local databases)
```

## 🔄 4-Step Reset Procedure

### Step 1: Drop Payload Schema

> **Important:** Enum cleanup is now mandatory for reset success. Perform enum cleanup before proceeding to Step 2.

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

> **Updated:** Enum cleanup is now a required step in the main reset procedure, not optional troubleshooting.

**Verification:**
```bash
# Use Supabase MCP: list_tables
# Parameters: { "schemas": ["payload"] }
# Expected result: Empty list (0 tables)
```

:start_line:87
-------
### Step 3: Delete Migration Files
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

:start_line:106
-------
### Step 4: Generate Fresh Migration
```bash
# Generate new comprehensive migration
pnpm --filter payload payload migrate:create -- --name reset_schema

# Verify migration was created
:start_line:116
-------
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

### Step 4.5: Add Enum Cleanup to Migration (Optional Safety Measure)
For extra safety, you can add enum cleanup directly to your generated migration file:

```typescript
// Add this at the beginning of the up() function in your migration file:
// First, drop any existing enums to ensure a clean slate - one by one for safety
const enumDrops = [
  'DROP TYPE IF EXISTS "payload"."enum_users_role" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_media_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_downloads_category" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_downloads_access_level" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_posts_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__posts_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_documentation_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__documentation_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_private_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__private_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_courses_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__courses_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_course_lessons_video_source_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_course_lessons_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__course_lessons_v_version_video_source_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__course_lessons_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_course_quizzes_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__course_quizzes_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_quiz_questions_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_survey_questions_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_survey_questions_questionspin" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_survey_questions_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__survey_questions_v_version_type" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__survey_questions_v_version_questionspin" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__survey_questions_v_version_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum_surveys_status" CASCADE;',
  'DROP TYPE IF EXISTS "payload"."enum__surveys_v_version_status" CASCADE;'
];

// Execute enum drops one by one for safety
for (const drop of enumDrops) {
  try {
    await db.execute(sql.raw(drop));
  } catch (error) {
    // Ignore errors if enum doesn't exist
    console.log(`Enum drop ignored: ${drop}`);
  }
}
```

**Benefits:** This approach ensures enums are cleaned up as part of the migration itself, providing an additional safety layer.


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

:start_line:130
-------
### Step 5: Execute Migration
```bash
# Use Supabase MCP: execute_sql
# Parameters: { "query": "CREATE SCHEMA IF NOT EXISTS payload;" }

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

:start_line:161
-------
## 🔍 Comprehensive Verification

### 6. Schema State Verification
```bash
# Use Supabase MCP: list_tables
# Parameters: { "schemas": ["payload"] }
# Expected result: List of all tables in payload schema

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' AND table_name IN ('courses', 'users', 'media', 'payload_migrations') ORDER BY table_name;" }
# Expected result: List of key tables present
```

### 7. Migration Record Verification
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT * FROM payload.payload_migrations ORDER BY created_at DESC LIMIT 1;" }
# Expected result: Latest migration record details

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT name, created_at FROM payload.payload_migrations WHERE name LIKE '%reset_schema%';" }
# Expected result: Migration names matching reset_schema with timestamps
```

### 8. Schema Integrity Verification
```bash
# Use Supabase MCP: query
# Parameters: { "sql": "SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'payload' AND tc.constraint_type = 'FOREIGN KEY';" }
# Expected result: List of foreign key constraints in payload schema

# Use Supabase MCP: query
# Parameters: { "sql": "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'payload';" }
# Expected result: List of indexes in payload schema
```

### 9. Application Health Verification
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

:start_line:314
-------
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

## 🆔 Supabase Project ID

The Supabase project ID for this reset is:

```
ldebzombxtszzcgnylgq
```

> **Note:** When delegating tasks related to this reset, always provide this project ID to ensure correct context and access.


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