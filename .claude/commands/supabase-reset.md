---
description: Reset local Supabase database and seed Payload CMS
allowed-tools: [Read, Write, Bash, Task, TodoWrite]
model: opus
argument-hint: [--regenerate-payload-migrations] [--schema-only] [--verbose]
---

# Supabase Database Reset

Reset local Supabase database and seed Payload CMS with fresh data.

## Key Features

- **Local Development Focus**: Optimized for solo development workflows
- **Default Seeding**: Automatically seeds Payload CMS after reset
- **Safety Mechanisms**: Pre-flight validation and comprehensive error handling
- **Script-Based**: Leverages reusable bash scripts for maintainability

## Prompt

<role>
You are a Database Operations Specialist with expertise in Supabase management, PostgreSQL administration, and Payload CMS integration. You execute local database resets with safety validation and comprehensive progress tracking.
</role>

<instructions>

**CORE REQUIREMENTS**:

- **Execute** sequential database reset workflow
- **Validate** configurations before destructive operations
- **Seed** Payload CMS by default unless --schema-only specified
- **Track** progress with TodoWrite for visibility

## PRIME Framework

### Phase P - PURPOSE

<purpose>

**Database reset outcomes**:

1. **Primary Objective**: Fresh local Supabase database with seeded Payload CMS
2. **Success Criteria**: Database reset, migrations applied, 252 records seeded across 12 collections
3. **Safety Features**: Pre-flight validation, automatic cleanup, duplicate prevention

</purpose>

### Phase R - ROLE

<role_definition>

1. **Expertise Domain**: Supabase CLI, PostgreSQL, Payload CMS, local Docker orchestration
2. **Experience Level**: Senior database administrator for local development environments
3. **Decision Authority**: Autonomous execution of local reset procedures
4. **Approach Style**: Safety-first with validation and detailed progress reporting

</role_definition>

### Phase I - INPUTS

<inputs>

**Essential Context**:

- Supabase CLI commands for database management
- Scripts located in `.ai/ai_scripts/database/` and `.ai/ai_scripts/development/`

**Arguments & Validation**:

- `--regenerate-payload-migrations`: Delete and regenerate Payload migrations (fresh schema)
- `--schema-only`: Skip seeding, only reset database and run migrations
- `--verbose`: Enable detailed logging

**Environment Requirements**:

- `PAYLOAD_ENABLE_SSL=false` is automatically set for local Supabase (prevents SSL cert errors)
- `DATABASE_URL` is hardcoded to `postgresql://postgres:postgres@127.0.0.1:54522/postgres` for reliability
- Local Supabase always uses ports 54521-54527 (API, DB, Studio, etc.)

**Validate**:

- Docker daemon is running
- Supabase CLI is available
- Required bash scripts exist in `.ai/ai_scripts/database/` and `.ai/ai_scripts/development/`

</inputs>

### Phase M - METHOD

<method>

**Execute** the 5-phase reset workflow:

1. **Phase 1**: Validate environment and configuration
2. **Phase 2**: Start Supabase and reset database
3. **Phase 3**: Verify Payload schema and run migrations
4. **Phase 4**: Seed Payload CMS data
5. **Phase 5**: Verify final database state

#### Progress Tracking Setup

**Initialize** TodoWrite progress tracking:

```javascript
todos = [
  {content: "Validate environment and configuration", status: "pending", activeForm: "Validating environment"},
  {content: "Reset Supabase and run Payload migrations", status: "pending", activeForm: "Resetting database and running migrations"},
  {content: "Seed Payload CMS (unless --schema-only)", status: "pending", activeForm: "Seeding Payload"},
  {content: "Verify database state", status: "pending", activeForm: "Verifying database"}
]
```

#### Phase 1: Initialize & Validate Environment

**Execute** pre-flight checks:

```bash
# 1.1 Parse arguments
REGENERATE_MIGRATIONS=false
SCHEMA_ONLY=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --regenerate-payload-migrations) REGENERATE_MIGRATIONS=true ;;
    --schema-only) SCHEMA_ONLY=true ;;
    --verbose) VERBOSE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# 1.2 Verify Docker running
if ! docker info >/dev/null 2>&1; then
  echo "❌ ERROR: Docker is not running"
  echo "Start Docker and try again"
  exit 1
fi

# 1.3 Verify Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ ERROR: Supabase CLI not found"
  echo "Install: pnpm add supabase --save-dev"
  exit 1
fi

# 1.4 Validate Payload configuration (unless regenerating)
if [ "$REGENERATE_MIGRATIONS" = false ]; then
  bash .ai/ai_scripts/database/validate-payload-config.sh || exit 1
fi

echo "✅ Environment validation complete"
```

**Update** TodoWrite: Mark Phase 1 complete

#### Phase 2 & 3: Reset Supabase Database and Run Payload Migrations

**NOTE**: These phases CAN be run separately because we hardcode the DATABASE_URL for local
Supabase (it always uses the same ports). Running them separately provides better error
isolation and debugging. The hardcoded URL is more reliable than parsing `supabase status`.

**Note**: The payload schema is automatically created by the Supabase migration
`20250327_create_payload_schema.sql` during `supabase db reset`. This migration:
- Drops any existing payload schema with CASCADE (removes stale objects)
- Creates a fresh, empty payload schema
- Includes a production safety guard

**Execute** database reset and Payload migrations in a single shell session:

```bash
# ============================================================
# PHASE 2: Reset Supabase Database
# ============================================================

# 2.1 Cleanup conflicting ports (54521-54527 for web instance)
bash .ai/ai_scripts/development/cleanup-ports.sh 54521 54527 || {
  echo "⚠️  Port cleanup failed, attempting to continue..."
}

# 2.2 Stop Supabase if running
cd apps/web
npx supabase stop 2>/dev/null || true

# 2.3 Start Supabase first (required for db reset to work)
echo "🚀 Starting Supabase..."
npx supabase start

# 2.4 Reset database with migrations (requires Supabase to be running)
# Pipe "n" to reject remote database reset prompt when project is linked
echo "🔄 Resetting Supabase database..."
echo "n" | npx supabase db reset

# 2.5 Set DATABASE_URL for local Supabase (always uses these ports)
# Hardcoding is more reliable than parsing supabase status output
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54522/postgres"

echo "✅ Database reset complete"
echo "   Database URL: $DATABASE_URL"

# ============================================================
# PHASE 3: Verify Payload Schema and Run Migrations
# ============================================================

cd ../payload

# 3.1 Verify payload schema exists (created by Supabase migration)
SCHEMA_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';" | tr -d ' ')
if [ "$SCHEMA_EXISTS" -eq 0 ]; then
  echo "❌ ERROR: Payload schema not found after Supabase reset"
  echo "Check migration 20250327_create_payload_schema.sql"
  exit 1
fi
echo "✅ Payload schema exists (created by Supabase migration)"

# 3.2 Option A: Regenerate Migrations (if flag provided)
if [ "$REGENERATE_MIGRATIONS" = true ]; then
  echo "🔄 Regenerating Payload migrations..."
  PAYLOAD_ENABLE_SSL=false bash .ai/ai_scripts/database/regenerate-payload-migrations.sh "$DATABASE_URL" || exit 1
  echo "✅ Payload migrations regenerated"

# 3.3 Option B: Use Existing Migrations (default)
else
  # Run existing migrations with SSL disabled for local Supabase
  echo "🔄 Running Payload migrations..."
  DATABASE_URI="$DATABASE_URL?sslmode=disable" NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning || {
    echo "❌ ERROR: Migration failed"
    echo "Try: --regenerate-payload-migrations flag"
    exit 1
  }

  # Verify migrations created tables
  TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';" | tr -d ' ')
  echo "✅ Migrations complete ($TABLE_COUNT tables created)"

  if [ "$TABLE_COUNT" -lt 60 ]; then
    echo "⚠️  WARNING: Expected 60 tables, found $TABLE_COUNT"
    echo "Consider using --regenerate-payload-migrations flag"
  fi
fi
```

**IMPORTANT**: The `supabase db reset` command requires Supabase to be running first.
This is why we start Supabase before running reset, not after.

**Update** TodoWrite: Mark Phase 2 and Phase 3 complete

#### Phase 4: Seed Payload Data (Default)

**Execute** seeding unless --schema-only:

```bash
if [ "$SCHEMA_ONLY" = false ]; then
  echo "🌱 Seeding Payload CMS..."

  # 4.1 Validate seeding configuration
  bash .ai/ai_scripts/database/validate-seeding-config.sh || exit 1

  # 4.2 Cleanup existing data (prevent duplicates)
  bash .ai/ai_scripts/database/cleanup-payload-tables.sh "$DATABASE_URL" || {
    echo "⚠️  Cleanup failed, proceeding with seeding..."
  }

  # 4.3 Run seeding (files already pre-uploaded to R2)
  echo "📤 Seeding database with pre-uploaded R2 file URLs..."
  DATABASE_URI="$DATABASE_URL?sslmode=disable" NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run seed:run || {
    echo "❌ ERROR: Seeding failed"
    echo "Check collection configuration and try --regenerate-payload-migrations"
    exit 1
  }

  # 4.4 Validate seeded data (check for duplicates)
  echo "🔍 Validating seeded data..."
  VALIDATION_RESULT=$(psql "$DATABASE_URL" -t -c "
    SELECT
      collection,
      actual,
      expected,
      CASE
        WHEN actual = expected THEN 'OK'
        WHEN actual > expected THEN 'DUPLICATE'
        ELSE 'MISSING'
      END as status
    FROM (
      SELECT 'users' as collection, COUNT(*)::int as actual, 1 as expected FROM payload.users
      UNION ALL SELECT 'media', COUNT(*)::int, 24 FROM payload.media
      UNION ALL SELECT 'downloads', COUNT(*)::int, 20 FROM payload.downloads
      UNION ALL SELECT 'posts', COUNT(*)::int, 8 FROM payload.posts
      UNION ALL SELECT 'courses', COUNT(*)::int, 1 FROM payload.courses
      UNION ALL SELECT 'course_lessons', COUNT(*)::int, 25 FROM payload.course_lessons
      UNION ALL SELECT 'course_quizzes', COUNT(*)::int, 20 FROM payload.course_quizzes
      UNION ALL SELECT 'quiz_questions', COUNT(*)::int, 94 FROM payload.quiz_questions
      UNION ALL SELECT 'survey_questions', COUNT(*)::int, 32 FROM payload.survey_questions
      UNION ALL SELECT 'surveys', COUNT(*)::int, 3 FROM payload.surveys
      UNION ALL SELECT 'documentation', COUNT(*)::int, 19 FROM payload.documentation
      UNION ALL SELECT 'private', COUNT(*)::int, 5 FROM payload.private
    ) counts;
  ")

  echo "$VALIDATION_RESULT"

  # Check for duplicates
  if echo "$VALIDATION_RESULT" | grep -q "DUPLICATE"; then
    echo "❌ ERROR: Duplicate records detected!"
    echo "Re-run with --regenerate-payload-migrations flag"
    exit 1
  fi

  echo "✅ Seeding complete - all collections validated"
else
  echo "⏭️  Skipping seeding (--schema-only flag)"
fi
```

**Update** TodoWrite: Mark Phase 4 complete

#### Phase 5: Verify Database

**Execute** final verification:

```bash
# 5.1 Check Supabase status
cd apps/web
npx supabase status

# 5.2 Verify database connectivity
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "✅ Database connection verified"
else
  echo "⚠️  Database connection issues detected"
fi

# 5.3 Report completion
echo ""
echo "✅ Supabase Reset Complete!"
echo ""
echo "Database URL: $DATABASE_URL"
echo "Studio URL: http://localhost:54523"
echo ""

if [ "$SCHEMA_ONLY" = false ]; then
  echo "📊 Seeded Collections:"
  psql "$DATABASE_URL" -c "
    SELECT schemaname, relname as table, n_live_tup as records
    FROM pg_stat_user_tables
    WHERE schemaname = 'payload' AND relname <> 'payload_migrations'
    ORDER BY n_live_tup DESC;
  "
fi
```

**Update** TodoWrite: Mark Phase 5 complete

#### Error Handling

**Handle** failures at each phase:

**Phase 1 Errors**:

- Docker not running → Guide to start Docker
- Supabase CLI missing → Provide installation command
- Validation failure → Show specific fix from validate-payload-config.sh

**Phase 2 Errors**:

- Port conflicts → Manual cleanup instructions
- Supabase start fails → Check Docker status and available ports
- Database reset fails → Check Docker status and Supabase logs
- Remote database prompt → Command pipes "n" automatically; if still prompted, project may need unlinking

**Phase 3 Errors**:

- Schema not found → Check migration `20250327_create_payload_schema.sql` was applied
- Migration fails → Suggest --regenerate-payload-migrations flag
- Low table count → Recommend regenerating migrations

**Phase 4 Errors**:

- Seeding validation fails → Check seeding config consistency
- Cleanup fails → Continue with warning (seeding may catch duplicates)
- Seeding fails → Check for "collection not found" and suggest regeneration
- File URL errors → Verify R2 credentials in .env.test
- Duplicate detection → Recommend full reset with regeneration

**Phase 5 Errors**:

- Connection issues → Retry Supabase start
- Missing data → Check seeding logs

</method>

### Phase E - EXPECTATIONS

<expectations>

**Output Specification**:

- **Format**: Console output with progress indicators and final status
- **Structure**: 5-phase workflow with clear completion messages
- **Quality Standards**: Database operational, migrations applied, seeding validated

**Success Validation**:

- R2 storage configured with production credentials
- Supabase running on localhost:54521-54523
- Payload schema with 60 tables
- 252 records seeded across 12 collections (if not --schema-only)
- Media files (24) and downloads (20) with R2 URLs
- No duplicate records detected

**Final Status Report**:

```
✅ Supabase Reset Complete!

**Results:**
✅ Phase 1: Environment validated
✅ Phase 2: Supabase started and database reset
✅ Phase 3: Payload migrations applied (60 tables)
✅ Phase 4: Seeding complete (252/252 records)
✅ Phase 5: Database verified

**Connection Details:**
- Database: localhost:54522
- Studio: http://localhost:54523
- R2 Storage: Cloudflare (production buckets)
- Status: All services running

**Next Steps:**
- Start development: pnpm dev
- Run tests: pnpm test
- Verify data: Open Studio at http://localhost:54523
- Files are pre-uploaded to R2, accessed via CDN URLs
```

</expectations>

</instructions>

## Error Handling

### Common Issues

**Docker Not Running**

```
ERROR: Docker is not running
Fix: Start Docker Desktop and retry
```

**Migration Failures**

```
ERROR: Migration failed - table already exists
Fix: Use --regenerate-payload-migrations flag
```

**Seeding Failures**

```
ERROR: Collection 'downloads' can't be found
Root cause: Migration-config mismatch

Fix:
1. Check seeding config has all collections
2. Regenerate migrations:
   /database:supabase-reset --regenerate-payload-migrations
```

**Duplicate Records**

```
ERROR: Duplicate records detected (2x expected)
Root cause: Cleanup failed or seeding ran twice

Fix:
1. Full reset with regeneration:
   /database:supabase-reset --regenerate-payload-migrations

2. Manual cleanup:
   psql $DATABASE_URL -c "TRUNCATE TABLE payload.users, ... CASCADE;"
```

**Port Conflicts**

```
ERROR: Port 54521 already in use
Fix: Script will attempt automatic cleanup
Manual: lsof -ti:54521 | xargs kill -9
```

### Recovery Procedures

**If reset fails mid-process**:

1. Check TodoWrite progress to see which phase failed
2. Review error messages for specific guidance
3. Use --verbose flag for detailed logging
4. Try --regenerate-payload-migrations for schema issues

**Complete cleanup** (nuclear option):

```bash
# Stop Supabase
cd apps/web && npx supabase stop

# Kill processes
pkill -f "supabase"

# Restart fresh (migration will automatically drop and recreate payload schema)
/supabase-reset --regenerate-payload-migrations
```

**Note**: The payload schema is automatically dropped and recreated by the
Supabase migration `20250327_create_payload_schema.sql` during reset.

## Migration Guide

### When to Regenerate Migrations

**Always regenerate when:**

- ✅ Adding new collections to Payload config
- ✅ Modifying collection schemas significantly
- ✅ Seeding fails with "collection not found"
- ✅ After major Payload CMS upgrades

**Use existing migrations when:**

- ✅ Normal daily development reset
- ✅ Migrations are up-to-date with config
- ✅ Just need fresh data

### Best Practices

**Solo Development** (Current Focus):

- Use `--regenerate-payload-migrations` freely for config changes
- Default reset + seed for daily workflow
- Keep single base migration up-to-date

**Team Collaboration** (Future):

- Use incremental migrations
- Commit migrations to git
- Coordinate regeneration with team

<help>
🗄️ **Supabase Database Reset**

Reset local Supabase database and seed Payload CMS with fresh data.

**Usage:**

- `/database:supabase-reset` - Full reset + seed (default)
- `/database:supabase-reset --schema-only` - Reset without seeding
- `/database:supabase-reset --regenerate-payload-migrations` - Fresh migrations + seed
- `/database:supabase-reset --verbose` - Detailed logging

**Flags:**

- `--regenerate-payload-migrations` - Delete and regenerate Payload migrations
- `--schema-only` - Skip seeding, only reset database and migrations
- `--verbose` - Enable detailed logging

**What It Does:**

1. ✅ Validates environment and configuration
2. ✅ Resets Supabase database (drops and recreates public + payload schemas)
3. ✅ Payload schema auto-created by migration (with DROP CASCADE for clean slate)
4. ✅ Runs Payload CMS migrations (creates 60 tables)
5. ✅ Seeds Payload CMS with 252 records (unless --schema-only)
6. ✅ Verifies database state

**Requirements:**

- Docker running
- Supabase CLI installed
- Valid Payload configuration

**Default Behavior:**
Full reset WITH seeding - the most common workflow for local development.

Your local database will be reset safely with comprehensive validation!
</help>
