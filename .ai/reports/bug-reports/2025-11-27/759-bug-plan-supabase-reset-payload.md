# Bug Fix: Add Payload Schema to Supabase Migrations

**Related Diagnosis**: #758 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `/supabase-reset` slash command relies on manual execution phases, and the `supabase db reset` command only resets the `public` schema while Payload schema creation requires separate, fragile psql and pnpm commands
- **Fix Approach**: Add an active Supabase migration that drops and recreates the `payload` schema, ensuring a clean slate during `supabase db reset`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When `/supabase-reset` runs, the `npx supabase db reset` command only creates the `public` schema and its tables. The Payload CMS schema is not created because:
1. Payload migrations live in `apps/payload/src/migrations/` (separate from Supabase migrations)
2. The slash command relies on manual Claude execution to create the payload schema via psql and pnpm
3. This multi-phase approach is fragile - DATABASE_URL extraction can fail silently, psql commands can fail without stopping the process
4. Payload schema SQL files exist in `apps/web/supabase/migrations/backup/` but are ignored by the Supabase CLI

See diagnosis #758 for full details.

### Solution Approaches Considered

#### Option 1: Add Payload Schema to Supabase Migrations ⭐ RECOMMENDED

**Description**: Move the payload schema creation from manual slash command phases into an active Supabase migration file. This leverages the existing `supabase db reset` mechanism to automatically create the payload schema as part of the normal migration flow.

**Pros**:
- Fixes the root cause: payload schema is now created by the same mechanism as public schema
- Zero fragility: no manual execution phases, no variable extraction, no error-prone parsing
- Consistent with project architecture: uses the established migration system
- Minimal code changes: just move/restore one SQL file
- Automatic for all reset operations: `supabase db reset`, migrations up, etc. all work
- No performance impact: just one schema creation operation

**Cons**:
- Requires renaming/moving `apps/web/supabase/migrations/backup/20250325160000_payload_initial_schema.sql`
- Requires careful ordering: payload schema migration must run before any payload-schema-dependent code
- Requires testing to ensure Payload migrations work with this approach

**Risk Assessment**: low - this is a simple schema creation operation with zero dependencies on application code

**Complexity**: simple - just moving a SQL file into the active migrations directory

#### Option 2: Create Executable Reset Bash Script

**Description**: Replace the documentation-based slash command with an actual bash script (`scripts/reset-database.sh`) that handles all phases with proper error handling, validation, and retry logic.

**Pros**:
- Comprehensive: handles all phases in one place with proper coordination
- Better error handling: can validate each phase and fail fast
- Can add retry logic for DATABASE_URL extraction
- Easier to debug: script can output detailed logs
- Can add pre-checks: verify Supabase is running, database is accessible, etc.

**Cons**:
- More complex: requires bash scripting expertise
- More to maintain: 100+ lines of bash code
- Still requires manual execution of the script
- Doesn't solve the architectural issue of Payload schema not being in Supabase migrations
- Higher risk: more code paths, more potential failure modes
- Delayed benefit: still a workaround, not integrating Payload properly

**Why Not Chosen**: While comprehensive, this is a workaround that doesn't fix the root architectural issue. Option 1 is simpler, requires zero maintenance, and properly integrates Payload schema creation into the standard Supabase migration system.

#### Option 3: Use Supabase Seed Files for Schema Creation

**Description**: Add the payload schema creation to the Supabase seed system in `apps/web/supabase/seeds/create-payload-schema.sql`.

**Pros**:
- Leverages existing seed mechanism
- Simple to implement

**Cons**:
- Seeds should contain data, not schema
- Not idempotent: if seeds re-run, schema already exists (minor issue)
- Doesn't follow project conventions: schemas are in migrations, not seeds
- Seed files don't run unless explicitly configured in `supabase db reset`

**Why Not Chosen**: Violates separation of concerns. Schemas belong in migrations, seeds belong in `seeds/`. The seed approach is a workaround; Option 1 is architecturally correct.

### Selected Solution: Add Payload Schema to Supabase Migrations

**Justification**: This approach is architecturally correct because:
- Payload schema creation is a **schema change**, not data seeding
- Supabase migrations are the proper place for schema changes
- Integrates Payload seamlessly into the standard Supabase reset workflow
- Eliminates the fragility of the manual slash command phases
- Requires zero maintenance: just moves an existing SQL file
- Minimal risk: simple schema creation with zero dependencies
- Follows project conventions: schemas are managed via migrations

**Technical Approach**:
1. Create a new migration file `apps/web/supabase/migrations/20250327_create_payload_schema.sql` that:
   - Uses `DROP SCHEMA IF EXISTS payload CASCADE` to remove any existing schema and all its objects
   - Uses `CREATE SCHEMA payload` to create a fresh, empty schema
   - Includes a production safety guard to prevent accidental drops in production
2. Remove the manual payload schema creation code from `.claude/commands/supabase-reset.md` (simplify the slash command)
3. Verify Payload migrations (`apps/payload/src/migrations/`) still work correctly
4. Test: `supabase db reset` should now create a clean payload schema automatically

**Migration SQL Pattern**:
```sql
-- Production safety guard
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot drop payload schema in production database: %', current_database();
  END IF;
END $$;

-- Drop existing payload schema and all its objects (tables, functions, etc.)
DROP SCHEMA IF EXISTS payload CASCADE;

-- Create fresh payload schema
CREATE SCHEMA payload;
```

This ensures:
- Any stale payload tables/objects are removed before recreation
- Fresh schema for Payload CMS migrations to populate
- Production databases are protected from accidental drops

**Architecture Changes** (if any):
- Minimal: payload schema creation moves from manual execution to automated migration
- The Payload migration system (`apps/payload/src/migrations/`) remains unchanged
- The slash command becomes simpler: just runs `supabase db reset` without manual phases

**Migration Strategy** (if needed):
- No data migration needed: this is a forward-only schema change
- For local databases: `pnpm supabase:web:reset` will automatically create the schema
- For existing databases: `pnpm --filter web supabase migration up` will create the schema

## Implementation Plan

### Affected Files

List files that need modification:
- `.claude/commands/supabase-reset.md` - Remove manual payload schema creation steps (simplify the slash command)
- No changes to `apps/payload/src/migrations/` - Payload migration system continues to work

### New Files

- `apps/web/supabase/migrations/20250327_create_payload_schema.sql` - Migration to drop and recreate payload schema with production safety guard

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Payload Schema Migration File

Create a new migration file that drops and recreates the payload schema for a clean reset.

- Create `apps/web/supabase/migrations/20250327_create_payload_schema.sql`
- Include production safety guard (prevents accidental drops in production)
- Use `DROP SCHEMA IF EXISTS payload CASCADE` to remove existing schema and all objects
- Use `CREATE SCHEMA payload` to create fresh schema
- Verify the file is in the correct location and properly named

**Migration SQL**:
```sql
-- Production safety guard: prevent accidental drops in production
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot drop payload schema in production database: %', current_database();
  END IF;
END $$;

-- Drop existing payload schema and all its objects (tables, functions, etc.)
-- This ensures a clean slate for Payload CMS migrations
DROP SCHEMA IF EXISTS payload CASCADE;

-- Create fresh payload schema
CREATE SCHEMA payload;
```

**Why this step first**: The migration file must be in place and properly named before we run the reset. The DROP CASCADE ensures any stale tables are removed.

#### Step 2: Verify Migration File Works Correctly

Test the migration SQL to ensure it handles all scenarios.

- Verify DROP CASCADE removes all existing payload objects
- Verify CREATE SCHEMA creates the fresh schema
- Verify production safety guard works (test with production-like database name)
- Verify the migration can run multiple times without error (each reset drops and recreates)

**Why this step**: Ensures the migration handles both fresh databases and databases with existing payload schema.

#### Step 3: Test the Migration

Run the Supabase reset to verify the payload schema is created automatically.

- Run `pnpm supabase:web:reset`
- Verify the command completes without errors
- Check that payload schema exists: `SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';`
- Expected result: 1 (schema exists)

**Why this step**: Confirms the fix works before updating the slash command.

#### Step 4: Simplify the `/supabase-reset` Slash Command

Update `.claude/commands/supabase-reset.md` to remove manual payload schema creation steps.

- Remove the psql schema creation commands
- Remove the DATABASE_URL extraction
- Keep only the essential `supabase db reset` command
- Update the command description to reflect the simpler process

**Why this step**: Removes the fragile manual phases that were the source of the bug.

#### Step 5: Update Slash Command Documentation

Verify the slash command is clear and correct.

- Ensure instructions are accurate
- Add a note about what the command does: resets public and payload schemas
- Add troubleshooting: what to do if Supabase isn't running
- Test that the command works when called

**Why this step**: Ensures future users understand what the command does and can troubleshoot issues.

#### Step 6: Validation

Verify the fix works end-to-end.

- Run the `/supabase-reset` slash command
- Verify payload schema is created
- Verify Payload CMS migrations work (Payload tables are created)
- Verify seeding works
- Check for any errors or warnings

**Why this step**: Confirms the bug is fixed with no regressions.

## Testing Strategy

### Unit Tests

No unit tests needed for schema creation.

### Integration Tests

Test the migration and reset workflow:
- ✅ `supabase db reset` creates payload schema
- ✅ Payload migrations run after schema creation
- ✅ Migration is idempotent (can run multiple times)
- ✅ Schema exists before Payload tables are created

**Test files**:
- Manual testing using Supabase CLI commands

### E2E Tests

Test the full reset workflow:
- ✅ `/supabase-reset` slash command completes without errors
- ✅ Payload schema exists after reset
- ✅ Payload CMS is fully functional with all tables created

**Test files**:
- Manual testing of the slash command

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read `apps/web/supabase/migrations/backup/20250325160000_payload_initial_schema.sql` to understand the schema
- [ ] Copy/move the file to `apps/web/supabase/migrations/` with appropriate naming
- [ ] Run `pnpm supabase:web:reset` and verify it completes successfully
- [ ] Verify payload schema exists: `SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';`
- [ ] Verify Payload tables exist: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';`
- [ ] Run `/supabase-reset` slash command and verify it works
- [ ] Verify database is fully populated (public and payload schemas)
- [ ] Check Payload CMS admin interface can load (tables exist)
- [ ] Verify no errors in Supabase or Payload logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Migration Ordering Issue**: Payload schema migration runs after other migrations that might need it
   - **Likelihood**: low (schema creation is simple and has no dependencies)
   - **Impact**: medium (Payload migrations would fail)
   - **Mitigation**: Place the migration early in the sequence (use early timestamp), test before deployment

2. **Accidental Production Data Loss**: DROP CASCADE could delete production data
   - **Likelihood**: very low (production safety guard blocks execution)
   - **Impact**: critical (all payload data would be lost)
   - **Mitigation**: Production safety guard raises exception if database name contains "prod" or "production"

3. **Staging/Preview Data Loss**: DROP CASCADE will remove data in non-production environments
   - **Likelihood**: expected (this is the intended behavior for resets)
   - **Impact**: low (staging/preview data is ephemeral)
   - **Mitigation**: Document that this migration is for reset workflows, not incremental deployments

4. **Payload Migration Incompatibility**: Payload migrations expect a different schema structure
   - **Likelihood**: very low (Payload CMS is designed for empty schema)
   - **Impact**: high (Payload would fail to initialize)
   - **Mitigation**: Test Payload CMS initialization after reset

5. **Safety Guard False Positive**: Database name doesn't contain "prod" but is actually production
   - **Likelihood**: low (standard naming conventions)
   - **Impact**: critical (data loss)
   - **Mitigation**: Review database naming conventions, consider adding additional checks (e.g., environment variables)

**Rollback Plan**:

If the migration causes issues:
1. Remove the migration file from `apps/web/supabase/migrations/`
2. Run `pnpm supabase:web:reset` to reset the database
3. Restore the manual phases in the slash command from git history
4. Commit the revert

**Monitoring** (if needed):
- Monitor first use by team members to ensure no issues
- Check Payload CMS initialization logs for errors
- Verify E2E tests pass without payload-related failures

## Performance Impact

**Expected Impact**: none

The schema creation is a one-time operation during `supabase db reset`. No ongoing performance impact.

**Performance Testing**:
- `pnpm supabase:web:reset` should complete in same time as before
- No additional queries or overhead

## Security Considerations

**Security Impact**: none

This is a schema creation operation with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Run the current slash command and check for missing tables:

```bash
# Run the current broken slash command
/supabase-reset

# After command completes, verify payload schema is NOT created
SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';
# Expected: 0 (schema missing)

SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';
# Expected: 0 (no tables)
```

**Expected Result**: payload schema does not exist, bug is reproduced

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint (if any code changes to slash command)
pnpm lint

# Format (if any code changes to slash command)
pnpm format

# Reset database
pnpm supabase:web:reset

# Verify payload schema is created
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';"
# Expected: 1 (schema exists)

# Verify payload tables are created
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';"
# Expected: 40+ (Payload migrations create tables)

# Test the slash command
/supabase-reset

# Verify everything still works after slash command
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload';"
# Expected: 1 (schema exists)
```

**Expected Result**: All commands succeed, payload schema and tables exist, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests that depend on database schema
pnpm test:e2e

# Additional regression checks
# Verify Payload CMS initialization still works
pnpm --filter payload build
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

**Migration needed**: yes

**Changes**:
- Drop existing `payload` schema using `DROP SCHEMA IF EXISTS payload CASCADE;`
- Create fresh `payload` schema using `CREATE SCHEMA payload;`
- This ensures a clean slate for Payload CMS migrations on every reset
- Production safety guard prevents accidental drops in production environments

**Migration SQL**:
```sql
-- Production safety guard
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot drop payload schema in production database: %', current_database();
  END IF;
END $$;

DROP SCHEMA IF EXISTS payload CASCADE;
CREATE SCHEMA payload;
```

**Migration file**: `apps/web/supabase/migrations/20250327_create_payload_schema.sql`

## Deployment Considerations

**Deployment Risk**: low (with production safety guard)

**Special deployment steps**:
- **For local development**: `pnpm supabase:web:reset` will drop and recreate the payload schema
- **For production**: The migration includes a safety guard that will BLOCK execution if the database name contains "production" or "prod". This prevents accidental data loss.
- **For staging/preview**: Review carefully before running - the DROP CASCADE will remove all payload data

**Production Safety**:
The migration includes a runtime check that raises an exception if run against a production database:
```sql
DO $$
BEGIN
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot drop payload schema in production database: %', current_database();
  END IF;
END $$;
```

**For production deployments with existing payload data**:
- DO NOT run this migration directly
- Use Payload CMS's own migration system to handle schema changes
- This migration is specifically designed for development reset workflows

**Feature flags needed**: no

**Backwards compatibility**: N/A - this is a reset migration, not an incremental change

## Success Criteria

The fix is complete when:
- [ ] Payload schema migration file is in place and properly named
- [ ] `pnpm supabase:web:reset` creates payload schema automatically
- [ ] Payload tables are created after schema exists
- [ ] `/supabase-reset` slash command works end-to-end
- [ ] All manual testing checklist items pass
- [ ] Zero regressions (existing tests still pass)
- [ ] Database seeding works correctly
- [ ] Payload CMS admin interface functions properly

## Notes

**Key Decision**: Why DROP CASCADE + CREATE instead of CREATE IF NOT EXISTS?
- User feedback indicates stale payload tables can cause issues during resets
- DROP CASCADE ensures a truly clean slate - removes all existing tables, functions, indexes, etc.
- CREATE then provides a fresh, empty schema for Payload CMS migrations
- This matches the expected behavior of a "reset" operation

**Production Safety**:
- The migration includes a runtime guard that checks the database name
- If the name contains "prod" or "production", the migration raises an exception
- This prevents accidental data loss in production environments
- For production schema management, use Payload CMS's own migration system

**About the Backup Folder**:
- The `backup/` folder contains legacy payload migrations that were moved out of active processing
- Those files use a different approach (CREATE IF NOT EXISTS)
- We're creating a new migration instead of moving the backup files to ensure the DROP CASCADE behavior

**Payload CMS Initialization**:
- Payload CMS has its own migration system (`apps/payload/src/migrations/`)
- Those migrations expect the payload schema to exist but be empty
- This fix ensures the schema is dropped and recreated before Payload migrations run

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #758*
