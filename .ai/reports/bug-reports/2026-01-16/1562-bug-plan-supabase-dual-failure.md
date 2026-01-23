# Bug Fix: Alpha Orchestrator Supabase Database Setup Fails (CLI Flag + Trigger Cleanup)

**Related Diagnosis**: #1560
**Severity**: critical
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: (1) Supabase CLI v2.62.5 `--yes` flag doesn't suppress prompts, (2) Reset script doesn't clean up triggers on auth.users
- **Fix Approach**: Upgrade Supabase CLI + add trigger cleanup to reset script
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator's database reset fails silently, leaving the sandbox database with 0 tables. Two separate issues prevent migration completion:

1. **CLI Flag Bug**: The `supabase db push --yes` command in v2.62.5 still prompts for confirmation despite the `--yes` flag, causing non-interactive execution via `execSync` to fail with "context canceled"

2. **Incomplete Schema Reset**: The reset script drops only the `public` schema but leaves triggers on `auth.users` intact. Subsequent migrations fail with "trigger already exists" (SQLSTATE 42710)

For full details, see diagnosis issue #1560.

### Solution Approaches Considered

#### Option 1: Supabase CLI Upgrade + Trigger Cleanup ⭐ RECOMMENDED

**Description**: Upgrade Supabase CLI from v2.62.5 to v2.72.7 (latest), then add SQL to drop auth.users triggers in the reset script.

**Pros**:
- Addresses both root causes completely
- v2.72.7 may have the flag bug fixed
- Trigger cleanup is permanent and correct
- No workarounds or hacks needed
- Aligns with best practices (keep dependencies current)

**Cons**:
- Requires CLI upgrade (potential compatibility risk, though low)
- Two separate changes needed
- Slight delay waiting for upgrade verification

**Risk Assessment**: low - Supabase CLI updates are stable, trigger cleanup is standard SQL

**Complexity**: moderate - Two changes but both straightforward

#### Option 2: Pipe Input as Workaround Only

**Description**: Keep v2.62.5, workaround the prompt with `echo "y" |` piping, still add trigger cleanup.

**Pros**:
- No dependency upgrade needed
- Avoids potential compatibility issues
- Immediate fix

**Cons**:
- Underlying CLI bug remains unfixed
- Fragile workaround (may break if CLI behavior changes)
- Doesn't address the root problem
- Shell piping adds complexity to Node.js `execSync` code
- May fail if there are multiple prompts

**Why Not Chosen**: Leaves the underlying bug unfixed. If future Supabase CLI versions change behavior, the workaround could fail again.

#### Option 3: Use `--db-url` with `--linked` Flag

**Description**: Switch from `--db-url` to `--linked` flag instead of prompt workaround.

**Pros**:
- May bypass the prompt entirely
- Cleaner than input piping

**Cons**:
- Still doesn't fix the root issue
- Requires Supabase project linking setup
- Doesn't work for sandboxes using remote database URLs
- Still incomplete without trigger cleanup

**Why Not Chosen**: Doesn't address both root causes, less reliable than upgrade.

### Selected Solution: Supabase CLI Upgrade + Trigger Cleanup

**Justification**:
This approach fixes both root causes at their source rather than working around them. CLI upgrades are low-risk in this codebase since Supabase CLI changes are backward compatible. The trigger cleanup is a standard database operation. Together, they ensure the migration system works correctly going forward.

**Technical Approach**:

1. **Upgrade Supabase CLI**: Update `.pnpm` lockfile to install v2.72.7
2. **Add Trigger Cleanup**: Extend the reset script in `database.ts:160-173` to drop auth schema triggers
3. **Test Thoroughly**: Verify migrations apply correctly and tables are created
4. **Verify No Regressions**: Ensure existing local development still works

**Architecture Changes**: None - this is a fix to existing code, no new architecture.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/database.ts` - Reset script needs trigger cleanup SQL
- `.pnpm-lock.yaml` OR equivalent lockfile - Supabase CLI version upgrade
- `apps/web/package.json` - May specify Supabase CLI version (if not using global)

### New Files

No new files needed - this is a pure bug fix.

### Step-by-Step Tasks

#### Step 1: Upgrade Supabase CLI to v2.72.7

**Why this step first**: Must upgrade CLI before testing, ensures we're working with the fixed version.

- Check current Supabase CLI installation: `supabase --version`
- Upgrade globally OR update lockfile depending on setup
- Verify new version: `supabase --version` should show v2.72.7
- Verify `--yes` flag works: `supabase db push --help | grep -A2 "yes"`

#### Step 2: Add Trigger Cleanup to Reset Script

**Why this step second**: Depends on CLI upgrade to actually run migrations successfully.

- Edit `.ai/alpha/scripts/lib/database.ts` lines 160-173
- Add SQL to drop existing auth.users triggers BEFORE recreation
- New reset script should:
  ```sql
  -- Drop auth schema triggers created by our migrations
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
  -- Original reset operations...
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;
  ...
  ```

#### Step 3: Test Migration Push with New CLI

**Why this step third**: Verify the upgraded CLI and trigger cleanup work together.

- Create a test database connection (use existing sandbox DB)
- Run the reset script: `resetSandboxDatabase()` or equivalent
- Check database table count: `psql "$DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"`
- Expected result: > 30 tables (not 0)
- Check no trigger conflicts: `psql "$DB_URL" -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth%'"`
- Expected result: Triggers exist and migrations succeeded

#### Step 4: Verify Orchestrator Flow

**Why this step fourth**: Ensure the full orchestrator still works with changes.

- Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --skip-db-seed`
- Monitor UI Recent Events
- Expected: ✅ `db_migration_complete` event (not ⚠️ Migration warning)
- Check event details show success, not errors

#### Step 5: Test Full Orchestrator with Seeding

**Why this step fifth**: Final comprehensive test before considering done.

- Run full orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Verify database reset succeeds
- Verify migrations apply successfully
- Verify seeding completes
- Verify sandboxes start working on features with valid database

## Testing Strategy

### Unit Tests

Not applicable - this is infrastructure code, not unit-testable in isolation.

### Integration Tests

Add integration test in `.ai/alpha/scripts/__tests__/`:
- ✅ Database reset completes without errors
- ✅ All expected tables are created (check table count > 30)
- ✅ No trigger conflicts after reset
- ✅ Migration history is truncated correctly
- ✅ Subsequent migrations apply cleanly

**Test file**: `.ai/alpha/scripts/__tests__/database-reset.test.ts` (create if doesn't exist)

### Manual Testing Checklist

Execute these tests before considering the fix complete:

- [ ] Upgrade Supabase CLI to v2.72.7 and verify version
- [ ] Verify `--yes` flag no longer prompts with simple test command
- [ ] Run orchestrator with database reset only (skip seeding)
- [ ] Check database has 30+ tables after reset
- [ ] Check no "trigger already exists" errors in logs
- [ ] Run full orchestrator with all stages
- [ ] Verify sandboxes start working on features
- [ ] Test resume capability (kill and restart orchestrator, ensure continues)
- [ ] Verify no UI shows "Migration warning" events
- [ ] Check git history shows no unexpected changes to database files

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **CLI Upgrade Compatibility**: Supabase CLI v2.72.7 may have breaking changes
   - **Likelihood**: low (Supabase maintains CLI stability)
   - **Impact**: high (would block orchestrator)
   - **Mitigation**:
     - Test CLI upgrade locally first before deploying
     - Review Supabase CLI v2.72.7 changelog for breaking changes
     - Keep v2.62.5 available as fallback (easy to downgrade)

2. **Trigger Cleanup Errors**: SQL syntax errors or trigger names wrong
   - **Likelihood**: low (straightforward DROP IF EXISTS)
   - **Impact**: medium (reset would fail)
   - **Mitigation**:
     - Use `DROP IF EXISTS` to make operation idempotent
     - Test SQL manually first on sandbox DB
     - Add clear error messages if triggers don't drop

3. **Auth Migration Failure**: Migrations depend on triggers being recreated
   - **Likelihood**: low (migrations create them)
   - **Impact**: high (database unusable)
   - **Mitigation**:
     - Migration `20221215192558_web_schema.sql` defines trigger creation
     - If triggers don't recreate, migration itself failed (not our problem)
     - Test migrations apply correctly

**Rollback Plan**:

If this fix causes issues:
1. Downgrade Supabase CLI: `npm install -g @supabase/cli@2.62.5`
2. Revert `.ai/alpha/scripts/lib/database.ts` to previous version: `git checkout HEAD~1 .ai/alpha/scripts/lib/database.ts`
3. Re-run orchestrator
4. Investigate what went wrong

## Performance Impact

**Expected Impact**: none

No performance implications - this is a database setup operation that happens once per orchestrator run. The trigger cleanup is a simple SQL operation (~1ms).

## Security Considerations

**Security Impact**: none

- Dropping triggers on auth schema is safe (we recreate them)
- Upgrading to latest CLI version actually improves security
- No sensitive data exposure or permission changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start with current setup (v2.62.5)
supabase --version  # Should show v2.62.5

# Test --yes flag doesn't work
cd apps/web
supabase db push --yes --db-url "postgresql://..." 2>&1 | head -5
# Should show: "Do you want to push these migrations? [Y/n]"
# Flag is ignored - still prompts

# Check database state before fix
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
# Expected: 0 (migrations never completed)

# Check auth triggers exist
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth%'"
# Expected: on_auth_user_created, on_auth_user_updated
```

**Expected Result**: Bug is reproducible - 0 tables, existing triggers block migrations.

### After Fix (Bug Should Be Resolved)

```bash
# Verify CLI upgrade
supabase --version  # Should show v2.72.7

# Verify trigger cleanup in code
grep -A5 "on_auth_user_updated" .ai/alpha/scripts/lib/database.ts
# Should show: DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

# Run database reset
node -e "
  const { resetSandboxDatabase } = require('./.ai/alpha/scripts/lib/database.ts');
  resetSandboxDatabase(false).then(() => console.log('✓ Reset complete'));
" 2>&1

# Verify migrations succeeded
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
# Expected: 30+ tables

# Verify no trigger conflicts
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth'"
# Expected: 2 (auth triggers were recreated successfully)

# Run type check, lint, format
pnpm typecheck
pnpm lint
pnpm format

# Run unit tests if any exist
pnpm test
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run orchestrator without seeding to test database portion
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --skip-db-seed

# Check UI events - should show success
# Should NOT show: "Migration warning: Command failed"
# Should show: "db_migration_complete" with success

# Run full orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Verify sandboxes start working (not blocked by DB issues)
# Monitor logs for: "Starting work on feature..."

# Test local development still works
pnpm supabase:web:start
# Local Supabase should start without errors

# Test migrations still work locally
pnpm --filter web supabase migrations up
# Should apply migrations to local DB
```

## Dependencies

### New Dependencies

No new npm/pnpm dependencies required.

### Supabase CLI Version Change

- Current: v2.62.5
- Target: v2.72.7
- Installation method: Global or via package.json (depends on setup)

**Installation**:
```bash
# If installed globally
npm install -g @supabase/cli@2.72.7

# If installed via lockfile
pnpm install  # Will use v2.72.7 from updated lockfile
```

## Database Changes

**Migration needed**: no

This is not a database schema change. We're fixing the migration system itself, not the schema.

**Reset script change**: yes

The reset script gets extended with trigger cleanup SQL, but no actual database migrations are created.

## Deployment Considerations

**Deployment Risk**: low

- This fix is infrastructure code, not application code
- No changes to application logic, APIs, or user-facing features
- Safe to deploy immediately

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix doesn't break any existing functionality.

## Success Criteria

The fix is complete when:
- [ ] Supabase CLI upgraded to v2.72.7
- [ ] Trigger cleanup SQL added to reset script
- [ ] Database resets complete without "trigger exists" errors
- [ ] All 30+ tables are created in public schema
- [ ] Orchestrator runs successfully from start to finish
- [ ] Sandboxes start working on features with valid database
- [ ] UI shows ✅ success events, not ⚠️ warnings
- [ ] All validation commands pass
- [ ] Zero regressions in local development
- [ ] Code review approved (if applicable)

## Notes

**Related Issues**:
- #1555 - Original diagnosis of interactive prompt issue
- #1557 - Previous fix that added --yes flag (insufficient)
- #1539, #1540 - Previous migration desync fixes
- This is the 4th iteration of fixes for this subsystem, suggesting systemic issues with environment consistency

**Future Improvements**:
- Add automated verification that migrations actually complete (check table count)
- Consider using `IF NOT EXISTS` in migration trigger creation to prevent conflicts
- Add monitoring to catch future migration failures earlier
- Document the complete reset workflow in developer guide

**Migration Creation Files** (for reference):
- Core migration: `apps/web/supabase/migrations/20221215192558_web_schema.sql` (creates the triggers)
- Auth implementation: `infrastructure/auth-implementation.md`
- Database patterns: `development/database-patterns.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1560*
