# Bug Fix: Dev Integration Tests Health Check Scope - Complete Fix

**Related Diagnosis**: #1682
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The fix in #1681 only addressed one branch of the health check logic. The `else` branch still attempts direct PostgreSQL connections for ALL non-local-Supabase environments, including remote Supabase workflows.
- **Fix Approach**: Add a third branch to distinguish between local development (with local Supabase) and CI with remote Supabase. Skip direct PostgreSQL checks in CI without local Supabase.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests workflow fails because the global-setup.ts still runs direct PostgreSQL health checks (`localhost:54522`) even though:
1. The workflow uses remote Supabase
2. There is no local PostgreSQL running
3. The PostgREST API health check already passes (remote Supabase is accessible)

The incomplete fix in #1681 only fixed the `if` branch but left the `else` branch broken.

For full details, see diagnosis issue #1682.

### Solution Approaches Considered

#### Option 1: Three-Branch Health Check Logic ⭐ RECOMMENDED

**Description**: Replace the current two-branch logic (`if E2E_LOCAL_SUPABASE === "true"` / `else`) with three branches:
1. **Local Supabase** (`E2E_LOCAL_SUPABASE === "true"`): Full health checks (PostgreSQL + PostgREST)
2. **CI with remote Supabase** (`CI === "true"` AND `E2E_LOCAL_SUPABASE !== "true"`): PostgREST API check only
3. **Local development** (not CI): Both PostgreSQL and PostgREST checks

**Pros**:
- Surgical fix that directly addresses the root cause
- Minimal code changes (only modifies the conditional logic)
- Reuses existing health check functions
- No new dependencies or infrastructure changes
- Works for all current and future CI environments with remote Supabase
- Clear semantic meaning: explicitly detects CI with remote Supabase

**Cons**:
- Requires careful ordering of conditions
- Adds one more conditional branch

**Risk Assessment**: Low - The fix only adds a new condition, doesn't modify existing healthy code paths

**Complexity**: Simple - Just add another conditional branch

#### Option 2: Environment Variable to Disable PostgreSQL Check

**Description**: Add a new environment variable `E2E_SKIP_POSTGRES_HEALTH=true` that skips PostgreSQL checks when set.

**Pros**:
- Explicit control per workflow

**Cons**:
- Requires updating the workflow file
- Introduces new environment variable to manage
- More configuration overhead
- Less semantic than detecting the pattern directly

**Why Not Chosen**: Option 1 is more elegant and requires no workflow changes. We already have `E2E_LOCAL_SUPABASE` which is perfect for this detection.

#### Option 3: Try-Catch with Fallback

**Description**: Wrap PostgreSQL check in try-catch, continue if it fails.

**Pros**:
- Minimal code change

**Cons**:
- Silently ignores real PostgreSQL connection errors in local development
- Poor error visibility
- Masks underlying issues

**Why Not Chosen**: The root cause is clear (PostgreSQL doesn't exist in CI), so we should explicitly detect and handle this case, not silently ignore errors.

### Selected Solution: Three-Branch Health Check Logic

**Justification**: This is the most straightforward, maintainable solution. It explicitly detects the pattern (CI + remote Supabase) and handles it appropriately. It's a surgical fix that:
1. Directly addresses the root cause identified in the diagnosis
2. Requires no workflow changes
3. Reuses existing, proven health check functions
4. Makes the intent explicit in the code
5. Prevents future regressions by being clear about environment expectations

**Technical Approach**:
- Keep the `if (process.env.E2E_LOCAL_SUPABASE === "true")` branch as-is
- Add `else if (process.env.CI === "true")` branch to handle CI with remote Supabase
- Move the existing `else` logic into the final `else` branch (local development only)
- Apply the same pattern to `cleanupBillingTestData()` for consistency

**Architecture Changes**: None. This is a logical reorganization within the existing conditional flow.

**Migration Strategy**: No migration needed. This is a fix for broken behavior.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Fix health check logic and billing cleanup

### Step-by-Step Tasks

#### Step 1: Fix Health Check Conditional Logic

**Task**: Replace lines 371-405 with three-branch logic

- Identify the exact line numbers and existing code
- Create the `else if (process.env.CI === "true")` branch
- Move existing `else` logic to final `else` for local development
- Add console output for clarity

**Why this step first**: The health check is executed early in global setup, and the entire test suite depends on it succeeding.

#### Step 2: Fix Billing Cleanup Conditional Logic

**Task**: Wrap `cleanupBillingTestData()` call with the same environment check

- Add `if (process.env.E2E_LOCAL_SUPABASE === "true")` guard around line 358
- Allows graceful skip of cleanup for remote Supabase workflows
- Prevents the ECONNREFUSED error warning

**Why this step**: Maintain consistency across the file and prevent misleading error logs

#### Step 3: Add Unit Tests

**Task**: Add tests to verify the correct health check path is taken for different environments

- Test with `E2E_LOCAL_SUPABASE=true` → uses `waitForSupabaseHealth()`
- Test with `CI=true` and no `E2E_LOCAL_SUPABASE` → uses only PostgREST check
- Test with neither flag → uses both PostgreSQL and PostgREST checks

**Why this step**: Prevent regression of this bug in the future

#### Step 4: Validation and Testing

**Task**: Run the dev-integration-tests workflow to verify the fix

- Verify global setup completes successfully
- Verify all health checks pass
- Verify no new errors or warnings
- Run full test suite to ensure no regressions

**Why this step**: Ensure the fix actually resolves the reported issue

## Testing Strategy

### Unit Tests

Add tests in a new test file: `apps/e2e/tests/setup/__tests__/global-setup-health-checks.spec.ts`

Tests should verify:
- ✅ With `E2E_LOCAL_SUPABASE=true`: Calls `waitForSupabaseHealth()`
- ✅ With `CI=true` and no `E2E_LOCAL_SUPABASE`: Calls only `checkPostgRESTHealth()`
- ✅ With neither flag: Calls both PostgreSQL and PostgREST checks
- ✅ PostgREST failure in CI mode throws appropriate error
- ✅ Billing cleanup skipped in CI with remote Supabase

### Integration Tests

Run the workflow that was failing:
- Execute `dev-integration-tests.yml` manually via GitHub UI
- Verify global setup completes without "PostgreSQL unreachable" error
- Verify e2e-sharded.yml still works with local Supabase

### Manual Testing Checklist

Execute these before considering the fix complete:

- [ ] Run `dev-integration-tests.yml` workflow manually - should pass
- [ ] Verify no "PostgreSQL unreachable" error in logs
- [ ] Run `e2e-sharded.yml` workflow - should still pass with local Supabase
- [ ] Check that PreFlight validations still pass
- [ ] Verify health check output shows correct environment detection
- [ ] Confirm no ECONNREFUSED warnings from billing cleanup

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Breaking local development health checks**: If we misorder the conditionals, local development might skip PostgreSQL checks
   - **Likelihood**: Low (straightforward conditional logic)
   - **Impact**: High (local development would be broken)
   - **Mitigation**: Carefully verify the final `else` is only reached in local development, test with `CI=false` before committing

2. **Incomplete fix**: Might miss other places where `localhost:54522` is hardcoded
   - **Likelihood**: Low (diagnosis identified the specific code paths)
   - **Impact**: Medium (some workflows might still fail)
   - **Mitigation**: Search for all `54522` references in the codebase after fixing

3. **PostgREST check insufficient for CI**: What if PostgREST passes but main service is unhealthy?
   - **Likelihood**: Low (PreFlight validation and separate app health checks already in place)
   - **Impact**: Low (other health checks provide safety)
   - **Mitigation**: The diagnosis shows PostgREST passing while tests are ready, so this is already sufficient

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit: `git revert <commit-sha>`
2. Push revert to dev branch
3. Investigate the specific error in the workflow logs
4. The old behavior (failing with PostgreSQL error) will return

**Monitoring** (if needed):

- Monitor `dev-integration-tests.yml` success rate after deployment
- Check for any new errors in global setup logs
- Verify `e2e-sharded.yml` continues to pass

## Performance Impact

**Expected Impact**: None - No performance changes, just conditional logic reorganization

The health checks themselves are not modified, just their conditional execution path.

## Validation Commands

### Before Fix (Bug Should Reproduce)

In the `dev-integration-tests.yml` logs, you'll see:

```
[PostgreSQL] Health check failed: PostgreSQL unreachable
Error: ❌ Supabase health check failed: PostgreSQL health check failed
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check (verify no syntax errors)
pnpm typecheck

# Lint (verify code style)
pnpm lint

# Format (verify formatting)
pnpm format

# Run the previously failing workflow
# This would normally be done via GitHub UI, but we can verify the fix logically:
# 1. Check that the code compiles
# 2. Verify the logic is sound

# Test with different environment combinations
# (These would be unit tests)
pnpm --filter web-e2e test --testPathPattern="global-setup-health-checks"
```

**Expected Result**:
- All commands succeed
- dev-integration-tests.yml workflow completes without "PostgreSQL unreachable" error
- e2e-sharded.yml workflow continues to work with local Supabase

### Regression Prevention

```bash
# Run full E2E setup to ensure no regressions
pnpm --filter web-e2e test:integration --verbose

# Ensure e2e-sharded still works by running a subset of tests locally
pnpm --filter web-e2e test --grep "@integration" --max-workers=1
```

## Dependencies

**No new dependencies required** - The fix uses existing functions and conditional logic.

## Database Changes

**No database changes required** - This is a configuration/conditional logic fix.

## Deployment Considerations

**Deployment Risk**: Low - Code change is localized to test setup

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - The fix correctly handles all existing environments

## Success Criteria

The fix is complete when:
- [ ] Lines 371-405 in global-setup.ts have been refactored to three-branch logic
- [ ] cleanupBillingTestData() call is guarded with proper environment check
- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Code passes linting and formatting
- [ ] Unit tests verify all three code paths work correctly
- [ ] dev-integration-tests.yml workflow completes successfully without PostgreSQL errors
- [ ] e2e-sharded.yml workflow continues to pass (verifies local Supabase path still works)
- [ ] No "PostgreSQL unreachable" errors in any workflow logs

## Notes

**Code Context**:

The key insight is that the current code has this structure:
```typescript
if (process.env.E2E_LOCAL_SUPABASE === "true") {
    // Local Supabase - full checks
    await waitForSupabaseHealth();
} else {
    // PROBLEM: This runs for dev-integration-tests.yml too!
    // It tries to connect to localhost:54522 which doesn't exist
    const [postgresResult, postgrestResult] = await Promise.all([
        checkPostgresHealth(5000),   // FAILS for remote Supabase
        checkPostgRESTHealth(5000),  // PASSES for remote Supabase
    ]);
}
```

**The Fix**:
```typescript
if (process.env.E2E_LOCAL_SUPABASE === "true") {
    // Local Supabase in sharded workflow
    await waitForSupabaseHealth();
} else if (process.env.CI === "true") {
    // CI with remote Supabase (dev-integration-tests.yml)
    // Skip PostgreSQL check, only verify API access
    const postgrestResult = await checkPostgRESTHealth(5000);
    if (!postgrestResult.healthy) {
        throw new Error(...);
    }
} else {
    // Local development with local Supabase
    const [postgresResult, postgrestResult] = await Promise.all([
        checkPostgresHealth(5000),
        checkPostgRESTHealth(5000),
    ]);
    // ... rest of checks
}
```

**Additional Cleanup**:

After fixing the health checks, consider a follow-up to search for other hardcoded `54522` references that might have similar issues. However, this should be a separate task.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1682*
