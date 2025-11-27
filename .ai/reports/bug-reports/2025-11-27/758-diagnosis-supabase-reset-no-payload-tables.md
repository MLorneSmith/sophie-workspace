# Bug Diagnosis: /supabase-reset Command Does Not Create Payload Tables

**ID**: ISSUE-758
**Created**: 2025-11-27T20:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/supabase-reset` slash command completes without errors but results in 0 Payload CMS tables being created. The database resets successfully for the Supabase `public` schema, but the `payload` schema and its tables are not created, making Payload CMS unusable after the reset.

## Environment

- **Application Version**: 3.65.0 (Payload)
- **Environment**: development
- **Browser**: N/A (CLI command)
- **Node Version**: 20.x
- **Database**: PostgreSQL 17 (local Supabase)
- **Last Working**: Unknown

## Reproduction Steps

1. Run the `/supabase-reset` slash command in Claude Code
2. Wait for command to complete (appears successful)
3. Check database tables: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';`
4. Result: 0 tables in payload schema

## Expected Behavior

- `supabase db reset` completes
- Payload schema is created
- Payload migrations are applied (creating 40+ tables)
- Payload seeding runs (252 records across 12 collections)
- Final database has fully populated payload schema

## Actual Behavior

- `supabase db reset` completes successfully
- Payload schema does NOT exist (or is empty)
- Payload migrations never run
- No seeding occurs
- Database has 0 payload tables

## Diagnostic Data

### File Structure Analysis

```
apps/web/supabase/migrations/
├── 20221215192558_web_schema.sql       # Active migration
├── 20240319163440_web_roles-seed.sql   # Active migration
├── ... (30+ active migrations for public schema)
├── backup/
│   ├── 20250325160000_payload_initial_schema.sql    # NOT ACTIVE
│   ├── 20250325164500_payload_course_lessons.sql    # NOT ACTIVE
│   └── ... (payload migrations in backup - NOT processed)
```

### Supabase Config (config.toml)

```toml
schemas = ["public", "storage", "graphql_public", "payload"]
extra_search_path = ["public", "extensions", "payload"]

[db.seed]
sql_paths = ['./seeds/*.sql']  # Only seeds public/auth schemas
```

### Slash Command Structure (.claude/commands/supabase-reset.md)

The slash command is a **documentation/prompt file** (not an executable script) that instructs Claude to:

1. **Phase 1**: Validate environment
2. **Phase 2**: Run `npx supabase db reset --debug` in apps/web
3. **Phase 4**: Create payload schema and run migrations:
   ```bash
   psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS payload CASCADE;"
   psql "$DATABASE_URL" -c "CREATE SCHEMA payload;"
   PAYLOAD_ENABLE_SSL=false pnpm run payload migrate --forceAcceptWarning
   ```
4. **Phase 5**: Run seeding:
   ```bash
   PAYLOAD_ENABLE_SSL=false pnpm run seed:run
   ```

### Migration Files Status

| Location | Schema Created | Tables Created | Status |
|----------|---------------|----------------|--------|
| `apps/web/supabase/migrations/*.sql` | public, auth | Yes | Active |
| `apps/web/supabase/migrations/backup/*.sql` | payload | No | IGNORED |
| `apps/payload/src/migrations/*.ts` | payload | Yes | Manual |

## Error Stack Traces

No errors produced - the command appears to succeed but critical steps are not executed.

## Related Code

- **Affected Files**:
  - `.claude/commands/supabase-reset.md` (slash command definition)
  - `apps/web/supabase/config.toml` (supabase config)
  - `apps/payload/src/migrations/index.ts` (payload migrations)
  - `apps/payload/src/migrations/20251104_191046.ts` (base migration)

- **Recent Changes**: No relevant recent changes to the reset workflow

- **Suspected Functions**: The slash command itself is a prompt, not executable code

## Related Issues & Context

### Direct Predecessors
None found - first report of this issue.

### Related Infrastructure Issues
- Similar architectural issues where CLI commands are documentation files rather than executable scripts

### Historical Context
The slash command design relies on Claude executing each phase manually, which creates fragility if:
1. Any phase is skipped or partially executed
2. Error output is not captured
3. The DATABASE_URL variable is not properly set

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `/supabase-reset` slash command is a documentation/prompt file that instructs Claude to execute multiple phases manually, but `supabase db reset` only resets the `public` schema while Payload schema creation requires separate psql and pnpm commands that depend on proper DATABASE_URL extraction - a step that can silently fail.

**Detailed Explanation**:

The architecture has a **critical separation** between:
1. **Supabase migrations** (`apps/web/supabase/migrations/`) - Handle `public`, `auth`, `storage` schemas
2. **Payload migrations** (`apps/payload/src/migrations/`) - Handle `payload` schema

When `npx supabase db reset --debug` runs, it:
- Applies all SQL files in `apps/web/supabase/migrations/` (excluding backup/)
- Runs seeds from `apps/web/supabase/seeds/`
- **Does NOT** create the `payload` schema
- **Does NOT** run Payload CMS migrations

The slash command instructs Claude to manually:
1. Extract DATABASE_URL from `npx supabase status`
2. Run `psql` commands to create payload schema
3. Run `pnpm run payload migrate`
4. Run `pnpm run seed:run`

**Failure Points**:
1. **DATABASE_URL extraction fails silently**: If Supabase isn't running or the grep/awk parsing fails, the variable is empty
2. **psql commands fail silently**: Without `-e` flag, psql may fail without stopping the process
3. **No validation between steps**: If one phase fails, subsequent phases don't know

**Supporting Evidence**:
- `apps/web/supabase/migrations/backup/*.sql` contains payload schema SQL but is in backup folder (not processed)
- `apps/payload/src/migrations/20251104_191046.ts` contains proper migration code
- `apps/payload/src/migrations/index.ts` correctly exports the migration
- No active Supabase migration creates the payload schema

### How This Causes the Observed Behavior

1. User runs `/supabase-reset`
2. Claude executes `npx supabase db reset --debug` (works - resets public schema)
3. Claude attempts to extract DATABASE_URL from `supabase status` (may fail if Supabase not started yet after reset)
4. Claude runs psql commands with empty/invalid DATABASE_URL (silently fails)
5. Claude runs `pnpm run payload migrate` (fails because payload schema doesn't exist)
6. User sees "completed" but payload tables are not created

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and verifiable
- The backup folder exclusion is documented Supabase behavior
- The slash command reliance on manual execution is a known fragility
- DATABASE_URL extraction from supabase status output is parsing-dependent

## Fix Approach (High-Level)

Two complementary fixes are recommended:

**Option A: Add Payload Schema to Supabase Migrations (Recommended)**
Move or create a migration file in `apps/web/supabase/migrations/` that creates the payload schema before Payload's own migrations run. This ensures `supabase db reset` creates the schema automatically.

**Option B: Create Executable Reset Script**
Replace the documentation-based slash command with an actual bash script that:
1. Stops and restarts Supabase
2. Runs `supabase db reset`
3. Waits for database availability
4. Creates payload schema with proper error handling
5. Runs payload migrate with retry logic
6. Runs seeding with validation

## Diagnosis Determination

The root cause is a **architectural design issue** where:
1. Supabase reset only handles `public` schema
2. Payload schema creation is delegated to manual Claude execution
3. The slash command is a prompt file, not an executable script
4. There's no error propagation or validation between phases

The fix requires either integrating payload schema creation into Supabase migrations OR creating a proper executable script that handles all phases with error handling.

## Additional Context

- The backup folder contains legacy payload migrations that were moved out of active processing
- The Payload CMS migration system (`@payloadcms/db-postgres`) expects the schema to exist before running migrations
- The seed engine (`apps/payload/src/seed/seed-engine/`) requires Payload tables to exist

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash*
