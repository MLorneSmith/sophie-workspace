---
description: Reset and rebuild the remote Supabase database from migrations and seeds
allowed-tools: [Read, Write, Bash, Task, TodoWrite]
model: opus
argument-hint: [--push-only] [--schema-only] [--full-backup] [--verbose]
---

# Supabase Remote Database Reset

Reset remote Supabase database and seed Payload CMS with fresh data.

## Key Features

- **Remote Database Focus**: Manages linked remote Supabase project
- **Full Payload Integration**: Runs Payload migrations AND seeding (unlike local which uses Docker)
- **Safety Mechanisms**: Automatic backup before destructive operations with auto-cleanup
- **Backup Options**: Schema-only (default, fast) or full backup with `--full-backup` (includes data)
- **Flag Options**: `--push-only` for non-destructive, `--schema-only` to skip seeding

## Usage

```
/supabase-seed-remote [--push-only] [--schema-only] [--full-backup] [--verbose]
```

- Default: Full reset (drops everything, rebuilds from migrations + Payload seeds)
- `--push-only`: Only push new migrations (non-destructive)
- `--schema-only`: Reset database and migrations but skip Payload seeding
- `--full-backup`: Backup both schema AND data (default is schema-only)
- `--verbose`: Enable detailed logging

## Prompt

<role>
You are a Database Operations Specialist with expertise in Supabase management, PostgreSQL administration, and Payload CMS integration. You execute remote database resets with safety validation and comprehensive progress tracking.
</role>

<instructions>

**CORE REQUIREMENTS**:

- **Execute** sequential database reset workflow
- **Backup** database before destructive operations
- **Run Payload migrations** to create CMS tables (60+ tables)
- **Seed** Payload CMS by default unless --schema-only specified
- **Track** progress with TodoWrite for visibility

## PRIME Framework

### Phase P - PURPOSE

<purpose>

**Remote database reset outcomes**:

1. **Primary Objective**: Fresh remote Supabase database with seeded Payload CMS
2. **Success Criteria**: Database reset, Supabase migrations applied, Payload migrations run (60+ tables), 255 records seeded across 12 collections
3. **Safety Features**: Pre-backup, progress tracking, comprehensive verification

</purpose>

### Phase R - ROLE

<role_definition>

1. **Expertise Domain**: Supabase CLI, PostgreSQL, Payload CMS, remote database management
2. **Experience Level**: Senior database administrator for remote environments
3. **Decision Authority**: Autonomous execution of remote reset procedures with safety backups
4. **Approach Style**: Safety-first with validation and detailed progress reporting

</role_definition>

### Phase I - INPUTS

<inputs>

**Essential Context**:

- Remote Supabase project must be linked (`npx supabase link`)
- Payload CMS migrations located in `apps/payload/src/migrations/`
- Seed engine and scripts in `apps/payload/src/seed/`

**Arguments & Validation**:

- `--push-only`: Only push new migrations, skip reset (non-destructive)
- `--schema-only`: Skip Payload seeding, only reset database and run migrations
- `--full-backup`: Backup both schema AND data before reset (default is schema-only)
- `--verbose`: Enable detailed logging

**Environment Requirements**:

- Remote DATABASE_URI from `apps/payload/.env.production`
- `SEED_USER_PASSWORD` from `apps/payload/.env` (for test user creation)
- SSL mode required for remote connections
- `NODE_TLS_REJECT_UNAUTHORIZED=0` may be needed for some environments

**Validate**:

- Supabase CLI is available
- Project is linked to remote (`supabase projects list`)
- Required scripts exist

</inputs>

### Phase M - METHOD

<method>

**Execute** the workflow based on flags:

**Push Only Mode** (`--push-only`):
1. Push new migrations to remote (non-destructive)
2. Verify migration status

**Full Reset Mode** (default):
1. **Phase 1**: Validate environment and backup
2. **Phase 2**: Reset Supabase database (drops everything, applies migrations)
3. **Phase 3**: Run Payload migrations (creates 60+ CMS tables)
4. **Phase 4**: Seed Payload CMS data (unless --schema-only)
5. **Phase 5**: Verify final database state

#### Progress Tracking Setup

**Initialize** TodoWrite progress tracking:

```javascript
todos = [
  {content: "Validate environment and create backup", status: "pending", activeForm: "Validating environment"},
  {content: "Reset Supabase database", status: "pending", activeForm: "Resetting remote database"},
  {content: "Run Payload migrations", status: "pending", activeForm: "Running Payload migrations"},
  {content: "Seed Payload CMS (unless --schema-only)", status: "pending", activeForm: "Seeding Payload"},
  {content: "Verify database state", status: "pending", activeForm: "Verifying database"}
]
```

#### Push Only Mode

**Execute** for `--push-only` flag:

```bash
cd apps/web

echo "📤 Pushing new migrations to remote..."
npx supabase db push

echo "✅ Migrations pushed successfully"

# Verify migration status
npx supabase migration list --linked
```

**Skip remaining phases** and report success.

#### Phase 1: Validate Environment and Backup

**Execute** pre-flight checks and backup:

```bash
# 1.1 Parse arguments
PUSH_ONLY=false
SCHEMA_ONLY=false
FULL_BACKUP=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --push-only) PUSH_ONLY=true ;;
    --schema-only) SCHEMA_ONLY=true ;;
    --full-backup) FULL_BACKUP=true ;;
    --verbose) VERBOSE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# 1.2 Verify Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: Supabase CLI not found"
  echo "Install: pnpm add supabase --save-dev"
  exit 1
fi

# 1.3 Verify project is linked
cd apps/web
if ! npx supabase projects list --linked 2>/dev/null | grep -q "ldebzombxtszzcgnylgq"; then
  echo "ERROR: Project not linked to remote"
  echo "Run: npx supabase link --project-ref ldebzombxtszzcgnylgq"
  exit 1
fi

# 1.4 Cleanup old backups (keep last 5)
echo "Cleaning up old backups..."
BACKUP_COUNT=$(ls -1 backup-remote-*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
  echo "Found $BACKUP_COUNT backups, removing oldest..."
  ls -1t backup-remote-*.sql | tail -n +6 | xargs rm -f
  echo "Kept 5 most recent backups"
fi

# 1.5 Create backup before destructive operations
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_SCHEMA="backup-remote-${TIMESTAMP}-schema.sql"

echo "Creating schema backup..."
npx supabase db dump --linked -f "$BACKUP_SCHEMA"
echo "Schema backup saved: $BACKUP_SCHEMA"

if [ "$FULL_BACKUP" = true ]; then
  BACKUP_DATA="backup-remote-${TIMESTAMP}-data.sql"
  echo "Creating data backup (--full-backup enabled)..."
  npx supabase db dump --linked --data-only -f "$BACKUP_DATA"
  echo "Data backup saved: $BACKUP_DATA"
  echo ""
  echo "Full backup complete:"
  echo "  Schema: $BACKUP_SCHEMA"
  echo "  Data:   $BACKUP_DATA"
  BACKUP_FILE="$BACKUP_SCHEMA + $BACKUP_DATA"
else
  echo ""
  echo "Schema-only backup (use --full-backup to include data)"
  BACKUP_FILE="$BACKUP_SCHEMA"
fi

echo "Environment validation complete"
```

**Update** TodoWrite: Mark Phase 1 complete

#### Phase 2: Reset Supabase Database

**Execute** database reset:

```bash
cd apps/web

echo "Resetting remote Supabase database..."
echo "This will drop all tables and reapply migrations..."

# Full reset (destructive) - creates empty payload schema via migration
# Note: Requires confirmation - pipe "y" or use interactive prompt
echo "y" | npx supabase db reset --linked

echo "Supabase reset complete"

# Verify migrations applied
echo "Verifying migrations..."
npx supabase migration list --linked
```

**Update** TodoWrite: Mark Phase 2 complete

#### Phase 3: Run Payload Migrations

**Execute** Payload migrations to create CMS tables:

```bash
cd apps/payload

echo "Running Payload migrations on remote database..."

# Get remote database connection string
# Priority: 1) REMOTE_DATABASE_URL env var, 2) .env.production file

if [ -n "$REMOTE_DATABASE_URL" ]; then
  DATABASE_URI="$REMOTE_DATABASE_URL"
  echo "Using REMOTE_DATABASE_URL from environment"
elif [ -f ".env.production" ]; then
  # Source DATABASE_URI from .env.production (already configured for remote)
  source .env.production
  if [ -n "$DATABASE_URI" ]; then
    echo "Using DATABASE_URI from apps/payload/.env.production"
  else
    echo "ERROR: DATABASE_URI not found in .env.production"
    exit 1
  fi
else
  echo "ERROR: No remote database configuration found"
  echo ""
  echo "Options:"
  echo "1. Ensure apps/payload/.env.production exists with DATABASE_URI"
  echo "2. Set REMOTE_DATABASE_URL environment variable"
  echo ""
  echo "You can find the connection string in Supabase Dashboard > Settings > Database"
  exit 1
fi

# Verify payload schema exists (created by Supabase migration)
# Note: Use psql with DATABASE_URI since supabase db exec doesn't support --linked
echo "Verifying payload schema exists..."
source .env.production
SCHEMA_CHECK=$(psql "$DATABASE_URI" -t -c "
  SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';
" 2>/dev/null | tr -d ' ')

if [ "$SCHEMA_CHECK" != "1" ]; then
  echo "ERROR: Payload schema not found after Supabase reset"
  echo "Check migration 20250327_create_payload_schema.sql was applied"
  exit 1
fi
echo "Payload schema exists"

# Run Payload migrations (DATABASE_URI already set above)
echo "Executing Payload migrations..."
NODE_TLS_REJECT_UNAUTHORIZED=0 \
  pnpm run payload migrate --forceAcceptWarning || {
    echo "ERROR: Payload migration failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify DATABASE_URI in apps/payload/.env.production is correct"
    echo "2. Check Supabase Dashboard for connection issues"
    echo "3. Try: npx supabase db exec --linked 'SELECT 1;'"
    exit 1
  }

# Verify tables were created
echo "Verifying Payload tables created..."
TABLE_COUNT=$(psql "$DATABASE_URI" -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';
" 2>/dev/null | tr -d ' ')

echo "Payload migrations complete ($TABLE_COUNT tables created)"

if [ "$TABLE_COUNT" -lt 60 ]; then
  echo "WARNING: Expected 60+ tables, found $TABLE_COUNT"
  echo "Some tables may not have been created"
fi
```

**Update** TodoWrite: Mark Phase 3 complete

#### Phase 4: Seed Payload Data

**Execute** seeding unless --schema-only:

```bash
if [ "$SCHEMA_ONLY" = false ]; then
  cd apps/payload

  echo "Seeding Payload CMS..."

  # Build SEED_FLAGS based on command-line options
  SEED_FLAGS=""
  if [ "$VERBOSE" = true ]; then
    SEED_FLAGS="$SEED_FLAGS --verbose"
  fi

  # Run seeding with --env=production and --force flags
  # --env=production: Use .env.production to connect to remote database
  # --force: Bypass NODE_ENV=production safety check for intentional remote seeding
  # --verbose: Enable detailed logging of seeding operations (if specified)
  # SEED_USER_PASSWORD: Required for creating test users (get from .env or .env.example)
  echo "Seeding database with Payload content..."

  # Source SEED_USER_PASSWORD from local .env if not already set
  if [ -z "$SEED_USER_PASSWORD" ] && [ -f ".env" ]; then
    export SEED_USER_PASSWORD=$(grep "^SEED_USER_PASSWORD=" .env | cut -d'=' -f2)
  fi

  NODE_TLS_REJECT_UNAUTHORIZED=0 \
    pnpm run seed:run:remote $SEED_FLAGS || {
      echo "ERROR: Seeding failed"
      echo ""
      echo "Troubleshooting:"
      echo "1. Check seeding script for errors"
      echo "2. Verify all collections exist in Payload config"
      echo "3. Try running migrations again"
      echo "4. Verify apps/payload/.env.production has correct DATABASE_URI"
      exit 1
    }

  # Validate seeded data using psql (supabase db exec doesn't support --linked)
  echo "Validating seeded data..."
  VALIDATION_RESULT=$(psql "$DATABASE_URI" -c "
    SELECT
      collection,
      actual,
      expected,
      CASE
        WHEN actual = expected THEN 'OK'
        WHEN actual > expected THEN 'EXTRA'
        ELSE 'MISSING'
      END as status
    FROM (
      SELECT 'users' as collection, COUNT(*)::int as actual, 1 as expected FROM payload.users
      UNION ALL SELECT 'media', COUNT(*)::int, 24 FROM payload.media
      UNION ALL SELECT 'downloads', COUNT(*)::int, 23 FROM payload.downloads
      UNION ALL SELECT 'posts', COUNT(*)::int, 8 FROM payload.posts
      UNION ALL SELECT 'courses', COUNT(*)::int, 1 FROM payload.courses
      UNION ALL SELECT 'course_lessons', COUNT(*)::int, 25 FROM payload.course_lessons
      UNION ALL SELECT 'course_quizzes', COUNT(*)::int, 20 FROM payload.course_quizzes
      UNION ALL SELECT 'quiz_questions', COUNT(*)::int, 94 FROM payload.quiz_questions
      UNION ALL SELECT 'survey_questions', COUNT(*)::int, 32 FROM payload.survey_questions
      UNION ALL SELECT 'surveys', COUNT(*)::int, 3 FROM payload.surveys
      UNION ALL SELECT 'documentation', COUNT(*)::int, 19 FROM payload.documentation
      UNION ALL SELECT 'private_posts', COUNT(*)::int, 5 FROM payload.private_posts
    ) counts
    ORDER BY collection;
  " 2>/dev/null)

  echo "$VALIDATION_RESULT"

  # Check for issues
  if echo "$VALIDATION_RESULT" | grep -q "DUPLICATE"; then
    echo "WARNING: Duplicate records detected"
    echo "This may indicate seeding ran multiple times"
  fi

  if echo "$VALIDATION_RESULT" | grep -q "MISSING"; then
    echo "WARNING: Some expected records are missing"
    echo "Check seeding script output for errors"
  fi

  echo "Seeding complete"
else
  echo "Skipping seeding (--schema-only flag)"
fi
```

**Update** TodoWrite: Mark Phase 4 complete

#### Phase 5: Verify Database

**Execute** final verification:

```bash
cd apps/web

echo ""
echo "============================================"
echo "        VERIFICATION RESULTS"
echo "============================================"
echo ""

# 5.1 Check migration status
echo "Migration Status:"
npx supabase migration list --linked | tail -10

# 5.2 Verify Payload tables using psql
cd ../payload && source .env.production
echo ""
echo "Payload Tables:"
TABLE_COUNT=$(psql "$DATABASE_URI" -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';
" 2>/dev/null | tr -d ' ')
echo "Total Payload tables: $TABLE_COUNT"

# 5.3 Verify seeded data (if seeded)
if [ "$SCHEMA_ONLY" = false ]; then
  echo ""
  echo "Payload Admin User:"
  psql "$DATABASE_URI" -c "SELECT email FROM payload.users;" 2>/dev/null

  echo ""
  echo "Seeded Collections:"
  psql "$DATABASE_URI" -c "
    SELECT
      'courses' as collection, COUNT(*) as records FROM payload.courses
    UNION ALL SELECT 'course_lessons', COUNT(*) FROM payload.course_lessons
    UNION ALL SELECT 'posts', COUNT(*) FROM payload.posts
    UNION ALL SELECT 'media', COUNT(*) FROM payload.media
    UNION ALL SELECT 'downloads', COUNT(*) FROM payload.downloads
    ORDER BY collection;
  " 2>/dev/null
fi

echo ""
echo "============================================"
echo "        REMOTE RESET COMPLETE"
echo "============================================"
echo ""
echo "Remote project: ldebzombxtszzcgnylgq (2025slideheroes)"
echo "Payload tables: $TABLE_COUNT"
if [ "$SCHEMA_ONLY" = false ]; then
  echo "Seeding: Complete (255 records expected)"
else
  echo "Seeding: Skipped (--schema-only)"
fi
echo ""
echo "Backup file: $BACKUP_FILE"
echo ""
echo "View in Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/ldebzombxtszzcgnylgq/editor"
echo ""
```

**Update** TodoWrite: Mark Phase 5 complete

#### Error Handling

**Handle** failures at each phase:

**Phase 1 Errors**:
- Supabase CLI missing -> Provide installation command
- Project not linked -> Provide link command
- Backup fails -> Continue with warning (data loss risk)

**Phase 2 Errors**:
- Reset fails -> Check Supabase Dashboard for issues
- Migration conflicts -> May need manual intervention

**Phase 3 Errors**:
- Database URL missing -> Guide to set REMOTE_DATABASE_URL
- Schema not found -> Check Supabase migration applied
- Migration fails -> Check SSL settings, connection string

**Phase 4 Errors**:
- Seeding fails -> Check collection configuration
- Duplicate records -> Consider re-running with full reset
- Missing records -> Check seeding script

**Phase 5 Errors**:
- Verification queries fail -> Check database connectivity
- Missing data -> Review previous phase logs

</method>

### Phase E - EXPECTATIONS

<expectations>

**Output Specification**:

- **Format**: Console output with progress indicators and final status
- **Structure**: 5-phase workflow with clear completion messages
- **Quality Standards**: Database operational, migrations applied, seeding validated

**Success Validation**:

- Supabase migrations applied successfully
- Payload schema exists with 60+ tables
- 255 records seeded across 12 collections (if not --schema-only)
- No duplicate records detected
- Verification queries succeed

**Final Status Report**:

```
============================================
        REMOTE RESET COMPLETE
============================================

Results:
Phase 1: Environment validated, backup created
Phase 2: Supabase reset complete
Phase 3: Payload migrations applied (60+ tables)
Phase 4: Seeding complete (255/255 records)
Phase 5: Database verified

Remote project: ldebzombxtszzcgnylgq
Backup file: backup-remote-20251209-123456.sql

View in Supabase Dashboard:
https://supabase.com/dashboard/project/ldebzombxtszzcgnylgq/editor
```

</expectations>

</instructions>

## What It Does

### Full Reset (Default)

Completely rebuilds the remote database:

1. Cleans up old backups (keeps last 5)
2. Creates backup of current database (schema-only by default, or full with `--full-backup`)
3. Drops all tables, functions, policies
4. Re-applies all Supabase migrations from scratch
5. **Runs Payload CMS migrations** (creates 60+ tables)
6. **Seeds Payload CMS data** (255 records)
7. Verifies final database state

### Push Only (--push-only)

Applies only new migrations without dropping data:

```bash
cd apps/web
npx supabase db push
```

### Schema Only (--schema-only)

Resets database and runs migrations but skips seeding:

1. Creates backup
2. Resets database
3. Runs Supabase migrations
4. Runs Payload migrations
5. Skips seeding

## When to Use

- **Full reset**: Starting fresh, major schema changes, testing deployment
- **Push only**: Adding new migrations to a working database
- **Schema only**: Need empty database with correct schema

## Database Connection

The command uses `DATABASE_URI` from `apps/payload/.env.production` for Payload migrations and seeding.

**Default**: Uses existing `apps/payload/.env.production` (already configured)

**Override**: Set `REMOTE_DATABASE_URL` environment variable:

```bash
export REMOTE_DATABASE_URL='postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'
```

Connection string can be found in Supabase Dashboard > Settings > Database

## Local Development

For local development, use `/supabase-reset` instead.

## Project Reference

Remote project: `ldebzombxtszzcgnylgq` (2025slideheroes)

<help>
**Supabase Remote Database Reset**

Reset remote Supabase database and seed Payload CMS with fresh data.

**Usage:**

- `/supabase-seed-remote` - Full reset + Payload migrations + seed (default)
- `/supabase-seed-remote --push-only` - Only push new migrations (non-destructive)
- `/supabase-seed-remote --schema-only` - Reset + migrations but skip seeding
- `/supabase-seed-remote --full-backup` - Include data in backup (not just schema)
- `/supabase-seed-remote --verbose` - Enable detailed seed engine logging

**Flag Details:**

- `--full-backup` - Creates both schema AND data backups before reset. Default is schema-only which is faster but doesn't preserve existing data. Use this when you have important data to preserve.
- `--verbose` - Enables detailed logging from the seed engine, showing each record being created and any warnings/errors encountered during seeding
- `--force` - (Passed internally to seed engine) Bypasses NODE_ENV=production safety check for intentional remote seeding. This is automatically included when seeding remote databases.
- `--env=production` - (Used internally) Tells seed engine to use `.env.production` for database connection

**Backup Behavior:**

- Default: Schema-only backup (~300KB, fast)
- With `--full-backup`: Schema + data backup (larger, complete)
- Auto-cleanup: Keeps only the 5 most recent backups
- Backup location: `apps/web/backup-remote-*.sql`

**Restoring from Backup:**

```bash
# Restore schema
psql "$DATABASE_URI" < backup-remote-YYYYMMDD-HHMMSS-schema.sql

# Restore data (if --full-backup was used)
psql "$DATABASE_URI" < backup-remote-YYYYMMDD-HHMMSS-data.sql
```

**What It Does:**

1. Validates environment, cleans old backups, creates new backup
2. Resets Supabase database (drops and recreates)
3. Runs Payload CMS migrations (creates 60+ tables)
4. Seeds Payload CMS with 255 records (unless --schema-only)
5. Verifies database state

**Requirements:**

- Supabase CLI installed
- Project linked to remote (`npx supabase link`)
- `apps/payload/.env.production` with DATABASE_URI (already configured)
- `SEED_USER_PASSWORD` in `apps/payload/.env` (for seeding test users)

**Default Behavior:**
Full reset WITH Payload migrations AND seeding - complete database rebuild.

Your remote database will be reset with comprehensive validation!
</help>
