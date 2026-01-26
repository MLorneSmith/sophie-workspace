# Bug Fix: E2E Payload Shards Fail - Missing Payload CMS Migrations in CI

**Related Diagnosis**: #1813
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Payload CMS migrations are not executed in the CI workflow before starting the Payload production server. The Supabase migration only creates an empty schema, but Payload's own migrations (which create tables like `payload.users`, `payload.media`, etc.) are never run.
- **Fix Approach**: Add a single step to the E2E CI workflow to run `pnpm --filter payload payload migrate` after Supabase starts but before tests begin.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shards 7, 8, and 9 (Payload CMS tests) fail with `relation "payload.users" does not exist` errors when the Payload server attempts to query missing tables at startup.

The project maintains two separate migration systems:
1. **Supabase migrations** (`apps/web/supabase/migrations/`) - Create tables in the `public` schema and an empty `payload` schema
2. **Payload CMS migrations** (`apps/payload/src/migrations/`) - Create Payload-specific tables in the `payload` schema

The CI workflow runs `supabase db reset` (which executes Supabase migrations) but never executes Payload's own migrations. This causes the Payload server to fail during startup when it queries its expected tables.

For full context, see diagnosis issue #1813.

### Solution Approaches Considered

#### Option 1: Add Payload Migration Step to E2E Workflow ⭐ RECOMMENDED

**Description**: Insert a single workflow step in `.github/workflows/e2e-sharded.yml` that runs `pnpm --filter payload payload migrate` after Supabase is running but before tests execute.

**Pros**:
- Minimal change (2-3 lines of workflow YAML)
- Follows existing pattern (mirrors how Supabase migrations are run)
- Directly fixes the root cause
- No code changes required

**Cons**:
- Requires understanding of Payload migration system (low complexity)
- Slightly increases CI workflow duration (negligible, <5 seconds)

**Risk Assessment**: low - This is a straightforward workflow addition with no code logic changes or database side effects.

**Complexity**: simple - Single workflow step addition.

#### Option 2: Create Automated Database Setup Script

**Description**: Create a dedicated shell script that orchestrates both Supabase and Payload migrations, then call this script from the workflow.

**Pros**:
- Centralizes database setup logic
- Reusable across different workflows
- Single source of truth for setup

**Cons**:
- Over-engineered for this specific issue
- Adds complexity without proportional benefit
- More code to maintain

**Why Not Chosen**: The direct workflow approach is simpler and more transparent. The automation isn't needed at scale yet.

#### Option 3: Modify Supabase Migration to Run Payload Migrations

**Description**: Extend the Supabase migration that creates the `payload` schema to also execute Payload migrations.

**Pros**:
- Single migration file contains all setup

**Cons**:
- Violates separation of concerns (Supabase migrations shouldn't orchestrate Payload migrations)
- Creates tight coupling between migration systems
- Harder to test and debug

**Why Not Chosen**: Clear separation of concerns is important for maintainability.

### Selected Solution: Add Payload Migration Step to E2E Workflow

**Justification**: This is the most straightforward, maintainable fix. It:
- Directly addresses the root cause (missing Payload migrations)
- Requires minimal code changes (1 workflow step)
- Follows existing patterns (mirrors Supabase setup)
- Maintains clear separation of concerns
- Has low risk and complexity
- Is easy to understand and debug

**Technical Approach**:
1. Identify the correct workflow file (`.github/workflows/e2e-sharded.yml`)
2. Locate the "Start Supabase" step or similar
3. Add a new step "Run Payload CMS Migrations" after Supabase starts
4. Set the required environment variables (`DATABASE_URI`, `PAYLOAD_SECRET`)
5. Run `pnpm --filter payload payload migrate`

**Architecture Changes** (if any):
- None. This is a workflow configuration change only.

**Migration Strategy** (if needed):
- No data migration needed. This is purely about applying missing schema definitions.

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Add Payload migration step to the `e2e-shards` job

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Locate the E2E Workflow

Examine `.github/workflows/e2e-sharded.yml` to understand:
- Where Supabase is started
- What environment variables are already set
- The structure of the job steps

**Why this step first**: You need to understand the existing workflow structure to add the step in the correct location.

#### Step 2: Add Payload Migration Step

Insert a new workflow step after the "Start Supabase" step:

```yaml
- name: Run Payload CMS migrations
  if: steps.check-skip.outputs.skip != 'true'  # Respect skip logic
  run: |\
    pnpm --filter payload payload migrate
  env:
    DATABASE_URI: postgresql://postgres:postgres@localhost:54322/postgres
    PAYLOAD_SECRET: test_payload_secret_for_e2e_testing
```

**Critical details**:
- Use the same `if` condition as Supabase startup (to respect skip checks)
- Use `--filter payload` to run in the Payload workspace
- Set `DATABASE_URI` to match the Supabase local connection string
- Set `PAYLOAD_SECRET` to a test value (same as used in Supabase config)
- Place this step AFTER Supabase starts, BEFORE any test runs

**Why this step**: This is the core fix.

#### Step 3: Verify Connection String Matches Supabase Setup

Confirm the `DATABASE_URI` matches how Supabase is configured:
- Check the Supabase startup step for the database port
- Verify the username/password match
- Ensure the database name is correct (`postgres`)

**Why this step**: Connection string mismatch is the most common failure mode.

#### Step 4: Test Locally First (Optional but Recommended)

If you want to verify the migration command works before committing:

```bash
# Start Supabase locally
pnpm supabase:web:start

# Run Payload migrations
pnpm --filter payload payload migrate
```

**Why this step**: Verifies the command works in isolation before deploying to CI.

#### Step 5: Commit and Push

Commit the workflow change with a clear message:

```bash
git add .github/workflows/e2e-sharded.yml
git commit -m "fix(ci): add Payload CMS migration step to E2E workflow [agent: sdlc_implementor]"
git push
```

Monitor the next E2E test run to verify Shards 7, 8, 9 now pass.

**Why this step**: Deploys the fix to CI for validation.

## Testing Strategy

### Unit Tests

No unit tests required for this fix (it's a CI workflow configuration change).

### Integration Tests

The integration testing happens automatically:
- E2E Shards 7, 8, 9 will execute their Payload CMS tests
- These tests will fail if Payload tables are missing (before fix)
- These tests will pass if migrations run successfully (after fix)

**Test evidence**:
- Check GitHub Actions workflow run #21361376052 (or next run)
- Verify Shards 7, 8, 9 status changes from ❌ to ✅
- Verify no increase in overall CI duration

### Manual Testing Checklist

Execute these before considering the fix complete:

- [ ] Review the updated `.github/workflows/e2e-sharded.yml` for syntax correctness
- [ ] Verify the step is placed after Supabase startup, before test execution
- [ ] Confirm DATABASE_URI matches Supabase local connection settings
- [ ] Optionally, run `pnpm --filter payload payload migrate` locally with Supabase running
- [ ] Push to a feature branch and trigger E2E tests
- [ ] Verify Shards 7, 8, 9 pass in the test run
- [ ] Verify no other shards regressed
- [ ] Check CI logs for clear "Payload migrations completed" message

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Connection String Mismatch**: If the DATABASE_URI doesn't match the Supabase setup
   - **Likelihood**: low (connection string is well-documented in workflow)
   - **Impact**: low (test run simply fails with clear error, easy to debug)
   - **Mitigation**: Verify connection string against Supabase startup step before deploying

2. **Payload Migration Compatibility**: If Payload migrations have unexpected side effects
   - **Likelihood**: very low (migrations are idempotent and tested locally)
   - **Impact**: low (would only affect test environment, not production)
   - **Mitigation**: Migrations have already been run locally, this just applies them in CI

3. **Performance Regression**: If migrations add significant time to CI
   - **Likelihood**: very low (migrations typically take 1-2 seconds)
   - **Impact**: low (overall CI time negligible)
   - **Mitigation**: Monitor CI duration before/after; migrations are cached per run anyway

4. **Step Order Issues**: If step executes before Supabase is ready
   - **Likelihood**: low (using explicit `if` condition like other steps)
   - **Impact**: low (step will fail with clear "connection refused" error)
   - **Mitigation**: Place step after "Start Supabase" step in workflow

**Rollback Plan**:

If this causes unexpected issues in CI:

1. Remove the added step from `.github/workflows/e2e-sharded.yml`
2. Commit and push the change
3. Re-run E2E tests to verify rollback works
4. Investigate root cause and try alternative approach

This is trivial to rollback (single step removal).

**Monitoring** (if needed):

Monitor these during the next CI run:
- Shard 7, 8, 9 status (should change from ❌ to ✅)
- CI workflow overall duration (should be negligible impact)
- Payload migration logs for any unexpected errors

## Performance Impact

**Expected Impact**: minimal

The Payload migration step adds:
- ~1-2 seconds to CI workflow execution
- Zero code execution overhead (workflow infrastructure only)
- Zero database size overhead (migrations just create schema, no data)

This is negligible and acceptable for fixing a critical test failure.

## Security Considerations

**Security Impact**: none

**Rationale**:
- No changes to production code
- No changes to security policies
- Test environment only
- Credentials used are test values, not production secrets
- Migration system is already vetted (used locally in development)

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug already reproduced in workflow run #21361376052. If you need to verify:

```bash
# Trigger E2E test run
gh workflow run e2e-sharded.yml --ref dev

# Monitor Shards 7, 8, 9 (should fail with "relation payload.users does not exist")
gh run list --workflow e2e-sharded.yml --limit 1 --json status,conclusion
```

**Expected Result**: Shards 7, 8, 9 fail with PostgreSQL error code 42P01 (undefined_table).

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow syntax is correct
cat .github/workflows/e2e-sharded.yml | head -100

# Verify the new step is present
grep -A 5 "Run Payload CMS migrations" .github/workflows/e2e-sharded.yml

# Trigger E2E tests
gh workflow run e2e-sharded.yml --ref dev

# Monitor all shards
gh run list --workflow e2e-sharded.yml --limit 1 --json status,conclusion,number

# After test completes, check results
gh run view <run-number> --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

**Expected Result**:
- All 12 shards pass
- Shards 7, 8, 9 specifically show ✅ status
- No other shards regressed
- CI workflow duration is similar to previous runs

### Regression Prevention

```bash
# After fix is deployed, verify in future runs that:
# 1. Shards 7, 8, 9 consistently pass
# 2. No "relation does not exist" errors appear
# 3. Payload migration logs show successful completion

# Optional: grep logs for confirmation
gh run view <run-number> --log | grep -i "payload\|migration\|completed"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The `pnpm --filter payload payload migrate` command:
- Uses existing Payload CMS package
- Uses existing database connection (Supabase)
- Requires no new npm packages
- Requires no new system dependencies

## Database Changes

**No database schema changes required**

The Payload migrations that will execute have already been created. They're just not being run in CI. No new migrations need to be created for this fix.

**Workflow**:
1. Supabase creates empty `payload` schema (already happens)
2. Payload migrations populate `payload` schema with tables (THIS STEP WAS MISSING)
3. Tests run with fully initialized database (now works)

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None. This is a workflow configuration change.
- No feature flags needed.
- No database migrations needed.
- No code changes to deploy.

**Backwards compatibility**: maintained

The workflow change doesn't affect any deployed code or infrastructure. It only changes the CI test setup.

## Success Criteria

The fix is complete when:
- [ ] Workflow file updated with Payload migration step
- [ ] Step is placed after Supabase startup
- [ ] Step uses correct DATABASE_URI and PAYLOAD_SECRET
- [ ] Workflow syntax is valid (no YAML errors)
- [ ] E2E test run 7, 8, 9 pass on next CI run
- [ ] No other test shards regressed
- [ ] CI logs show "Payload migrations completed" or similar success message
- [ ] Manual verification checklist complete

## Notes

**Why this bug wasn't caught earlier**:
- Payload CMS was added recently (issue context suggests it's a newer addition)
- The migration system wasn't integrated into CI setup
- Previous fix attempts (#1800, #1801) addressed test code timing, not server startup
- This is a CI configuration gap, not a code bug

**Related issues**:
- #1800, #1801: Previous Payload shard fixes (test code level)
- #1796, #1797: CI/CD regression fixes
- Diagnosis: #1813

**Implementation references**:
- Payload migration documentation: `apps/payload/src/migrations/`
- E2E workflow structure: `.github/workflows/e2e-sharded.yml`
- Supabase setup in workflow: Search for "supabase" in e2e-sharded.yml

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1813*
