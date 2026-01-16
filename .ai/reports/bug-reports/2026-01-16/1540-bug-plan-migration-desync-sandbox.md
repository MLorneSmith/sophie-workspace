# Bug Fix: Supabase Migration Desync Prevents Sandbox Database Setup

**Related Diagnosis**: #1539
**Severity**: critical
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `resetSandboxDatabase()` doesn't reset `supabase_migrations.schema_migrations`, leaving orphan migration records that prevent `supabase db push` from succeeding
- **Fix Approach**: Add SQL to truncate the migration history table during sandbox reset
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator's sandbox database reset fails silently because:

1. The orchestrator runs SQL to reset the public schema:
   ```sql
   DROP SCHEMA IF EXISTS public CASCADE;
   CREATE SCHEMA public;
   ```

2. This successfully clears all tables from the `public` schema (0 tables remain)

3. **But** it does NOT reset `supabase_migrations.schema_migrations` — which is in the `supabase_migrations` schema, not `public`

4. When the orchestrator later runs `supabase db push`, the remote database still has orphan migration records (e.g., `20260116173835 | create_user_activities_table`) that don't exist locally

5. `supabase db push` fails with: `Remote migration versions not found in local migrations directory`

6. As a result, sandboxes start with an empty public schema (0 tables instead of 30+) and features fail

### Solution Approaches Considered

#### Option 1: Truncate schema_migrations ⭐ RECOMMENDED

**Description**: Add a SQL command to reset the migration history table during sandbox reset

```sql
TRUNCATE supabase_migrations.schema_migrations;
```

**Pros**:
- Simple one-line fix in the orchestrator
- Aligns intent (reset database = reset all state including migration history)
- Idempotent and safe (TRUNCATE is a standard SQL operation)
- Minimal code change (~2 lines)

**Cons**:
- Creates minor semantic gap: `supabase_migrations` table isn't technically in `public` schema
- Documentation may need update to explain why this is necessary

**Risk Assessment**: **Low** - This is a standard database operation that mirrors what `supabase db reset` already does

**Complexity**: **Simple** - Single SQL statement

#### Option 2: Use `supabase db reset` instead of manual SQL

**Description**: Replace the manual `DROP SCHEMA` logic with `supabase db reset`

**Pros**:
- Delegates to official Supabase CLI (less custom code)
- Guarantees proper reset including migration history

**Cons**:
- Requires Supabase CLI to be available in sandbox environment
- Less control over what gets reset
- Slower (full reset vs quick schema drop)
- May not work as expected in sandboxes with limited tooling

**Why Not Chosen**: Adds external dependency and complexity when we control the database directly

#### Option 3: Use `--include-all` flag with supabase db push

**Description**: Modify `supabase db push` command to use `--include-all` flag to push all migrations including those with orphan records

**Pros**:
- Doesn't require database schema changes
- Flag exists in Supabase CLI

**Cons**:
- Doesn't actually solve the root problem (orphan records still exist)
- May cause unexpected behavior in future resets
- Masking symptoms rather than fixing root cause

**Why Not Chosen**: Doesn't address the fundamental issue of orphan migration records

### Selected Solution: Truncate schema_migrations

**Justification**: This is the surgical, minimal fix that directly addresses the root cause. The migration history is deployment metadata that should be reset when the entire database schema is reset. This aligns with the orchestrator's intent and matches what proper database reset tools (like `supabase db reset`) already do.

**Technical Approach**:

1. Locate the `resetSandboxDatabase()` function in `.ai/alpha/scripts/lib/database.ts`
2. After dropping and recreating the public schema, add:
   ```sql
   TRUNCATE supabase_migrations.schema_migrations;
   ```
3. This ensures fresh migration history for the next `supabase db push`

**Architecture Changes**: None - this is a single-line addition to existing SQL logic

**Migration Strategy**: Not applicable - this is a fix to the orchestrator's reset logic, not a database migration

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/database.ts` - Contains `resetSandboxDatabase()` function that needs the fix

### New Files

None required - this is a fix to existing code

### Step-by-Step Tasks

#### Step 1: Locate and understand the reset function

- Navigate to `.ai/alpha/scripts/lib/database.ts` lines 144-267
- Find the `resetSandboxDatabase()` function
- Identify the SQL section that drops and recreates the public schema
- Understand the flow: it connects to the database, executes SQL, then later calls `supabase db push`

**Why this step first**: Need to understand exact location and context before making changes

#### Step 2: Add migration history reset

- After the line that creates the public schema (CREATE SCHEMA public), add:
  ```sql
  TRUNCATE supabase_migrations.schema_migrations;
  ```
- Ensure proper SQL formatting and line spacing

**Why this is critical**: The truncate must happen AFTER schema creation but BEFORE `supabase db push` is called

#### Step 3: Add validation and logging

- Add a comment explaining why this truncate is necessary
- Add console logging to confirm the truncate executed
- This aids future debugging if similar issues occur

#### Step 4: Test the fix locally

- Run the orchestrator against a test E2B sandbox
- Verify the sandbox database is created with all tables present
- Check that `supabase db push` completes successfully
- Confirm the database has proper schema (not 0 tables)

#### Step 5: Validate in the full orchestrator context

- Run orchestrator against multiple sandboxes
- Verify features that depend on database tables work correctly
- Check logs from previous failed runs would now succeed

## Testing Strategy

### Unit Tests

Not applicable - this is a fix to orchestrator infrastructure code, not a testable function

### Integration Tests

Add/update integration tests for:
- ✅ Database reset properly clears migration history
- ✅ Schema is created with all tables after reset
- ✅ `supabase db push` completes without orphan migration errors
- ✅ Subsequent orchestrator runs on same sandbox work correctly

**Test files**:
- `.ai/alpha/scripts/__tests__/database.test.ts` - Test the reset function behavior

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Spin up new E2B sandbox via orchestrator
- [ ] Verify sandbox database has tables (not 0)
- [ ] Check logs show no migration sync errors
- [ ] Run features that depend on database (e.g., event queries)
- [ ] Verify feature implementations complete successfully
- [ ] Run orchestrator multiple times on same sandbox (idempotency)
- [ ] Check logs from previous sandbox runs would now show success
- [ ] Review related issues (#1533, #1534, #1537, #1538) - should now show success patterns

## Risk Assessment

**Overall Risk Level**: **low**

**Potential Risks**:

1. **TRUNCATE affects migration history tracking**: If anyone was relying on the orphan records for some reason (unlikely)
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: This table is deployment metadata - orphan records are bugs, not features

2. **SQL syntax issues in target database**: TRUNCATE might have edge cases in Supabase
   - **Likelihood**: very low (TRUNCATE is standard SQL)
   - **Impact**: medium (reset would fail)
   - **Mitigation**: Test thoroughly locally before deployment

3. **Affects existing sandboxes**: Old sandboxes with orphan records
   - **Likelihood**: medium (sandboxes were created before fix)
   - **Impact**: low (fix only applies to new resets)
   - **Mitigation**: Clear approach for cleaning up existing broken sandboxes

**Rollback Plan**:

If this fix causes issues:
1. Revert the one-line change in `.ai/alpha/scripts/lib/database.ts`
2. Remove the TRUNCATE command
3. Redeploy orchestrator
4. Existing sandboxes unaffected (fix only applies to new resets)

**Monitoring**: None required for initial deployment - this fixes a failure mode, doesn't introduce new operational concerns

## Performance Impact

**Expected Impact**: **none**

- TRUNCATE is a very fast operation (milliseconds)
- Happens during reset which is already slow (minutes for full process)
- No performance regression expected

## Security Considerations

**Security Impact**: **none**

- This only affects development/test databases (sandboxes)
- No sensitive data at risk
- No privilege escalation or access control changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

To verify the bug exists in the current code:

```bash
# The orchestrator would show:
# ERROR: Remote migration versions not found in local migrations directory
# Result: public schema has 0 tables (empty database)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator against new sandbox
.ai/alpha/scripts/orchestrator.sh

# Verify sandbox database
psql "$SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
# Expected: 30+ (not 0)

# Check migration history is clean
psql "$SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM supabase_migrations.schema_migrations"
# Expected: number of actual migrations, not orphan records
```

**Expected Result**: Orchestrator completes successfully, sandboxes have proper schema, features work correctly

### Regression Prevention

```bash
# Run orchestrator multiple times on same sandbox
for i in {1..3}; do
  .ai/alpha/scripts/orchestrator.sh --sandbox-id test-$i
  # Each run should succeed without orphan migration errors
done

# Verify existing features still work
pnpm --filter e2e test:shard-1
# E2E tests should pass (they rely on database tables)
```

## Dependencies

### New Dependencies

None - this uses standard PostgreSQL TRUNCATE command that Supabase already supports

## Database Changes

**Migration needed**: **No**

This fix modifies the orchestrator's reset logic, not the production schema.

## Deployment Considerations

**Deployment Risk**: **low**

**Special deployment steps**: None required - this is code change to `.ai/alpha/scripts/lib/database.ts`

**Feature flags needed**: No

**Backwards compatibility**: **maintained** - This only affects new sandbox resets, not existing data

## Success Criteria

The fix is complete when:
- [ ] Code change validated (syntax, formatting)
- [ ] Typecheck passes
- [ ] Linting passes
- [ ] Orchestrator successfully creates sandboxes
- [ ] Sandbox databases have 30+ tables (not 0)
- [ ] `supabase db push` completes without orphan migration errors
- [ ] Related feature implementations (#1533, #1534, #1537, #1538) succeed
- [ ] E2E tests pass on sandbox environments
- [ ] No regression in other orchestrator functionality

## Notes

**Important Context**:

This bug affected the Alpha Orchestrator's sandboxed feature implementation workflow. Previous issues (#1533, #1534, #1537, #1538) were correct but masked by this underlying database reset failure. Once this fix is applied, those feature implementations should work as intended.

**Related Issues**:
- #1533 - Feature implementation (was failing due to empty database)
- #1534 - Feature implementation (was failing due to empty database)
- #1537 - E2B sandbox diagnosis (identified the git diverged symptom, but root cause was database reset)
- #1538 - Bug plan for git diverged (addressed symptom, not root cause)

**Key Insight**: The migration history table is deployment metadata that MUST be reset when the entire database schema is reset. Leaving it in a stale state breaks the contract that `supabase db push` relies on.

---

*Bug Fix Plan for Supabase Migration Desync Issue*
*Created: 2026-01-16*
*Based on diagnosis: #1539*
