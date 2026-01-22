# Bug Fix: Dev Integration Tests Failing Due to Incorrect Health Check Environment Scope

**Related Diagnosis**: #1680 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The condition `process.env.CI === "true"` in `global-setup.ts:372` is too broad - it triggers local PostgreSQL health checks for ALL CI environments, including `dev-integration-tests.yml` which uses remote Supabase
- **Fix Approach**: Replace `process.env.CI === "true"` with `process.env.E2E_LOCAL_SUPABASE === "true"` to scope health checks to only workflows running local Supabase
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow tests against a deployed Vercel environment with remote Supabase, but commit `8403ad4a8` introduced enhanced health checks that attempt to connect to `localhost:54522`. This causes the workflow to fail with "PostgreSQL unreachable" error.

For full details, see diagnosis issue #1680.

### Solution Approaches Considered

#### Option 1: Check `E2E_LOCAL_SUPABASE` Environment Variable ⭐ RECOMMENDED

**Description**: Modify the condition to check for `process.env.E2E_LOCAL_SUPABASE === "true"` instead of `process.env.CI === "true"`. The `e2e-sharded.yml` workflow already sets this variable (added in issue #1626), so this will correctly scope local health checks to only that workflow.

**Pros**:
- Explicit and clear: directly indicates when local Supabase is running
- Already implemented: `e2e-sharded.yml` already sets `E2E_LOCAL_SUPABASE: true`
- Minimal change: one-line condition modification
- Maintains existing logic: health check code doesn't need any changes
- Future-proof: any other CI workflow that runs local Supabase can set this flag

**Cons**:
- Requires `dev-integration-tests.yml` doesn't set the flag (current state)
- No other changes needed, very straightforward

**Risk Assessment**: low - extremely simple change with clear scope

**Complexity**: simple - single condition change

#### Option 2: Check for Presence of `E2E_POSTGRES_HOST` Environment Variable

**Description**: Only run local health checks if `E2E_POSTGRES_HOST` is explicitly set. This infers the intention from explicit configuration.

**Pros**:
- Uses existing environment variable
- Makes explicit what database is being used

**Cons**:
- Less clear intent: hard-coded port numbers are fallbacks, not indicators of intention
- Requires adding default configuration to dev-integration-tests to prevent false positives
- Less explicit than dedicated flag

**Why Not Chosen**: Option 1 is clearer and uses existing infrastructure already in place.

#### Option 3: Check if Testing Against Localhost URL

**Description**: Parse `PLAYWRIGHT_BASE_URL` and only run local health checks if it contains `localhost`.

**Pros**:
- Infers intent from URL configuration

**Cons**:
- Fragile: relies on URL parsing heuristics
- Doesn't work for Docker hosts (e.g., `host.docker.internal`)
- Introduces unnecessary string parsing logic
- Less explicit

**Why Not Chosen**: Option 1 is more explicit and reliable.

### Selected Solution: Check `E2E_LOCAL_SUPABASE` Environment Variable

**Justification**: This approach is the most explicit and uses infrastructure already implemented in the codebase (the flag was added in #1626 for exactly this purpose). It's a single-line change with zero risk and maximum clarity about intent.

**Technical Approach**:
- Change line 372 in `apps/e2e/global-setup.ts` from `if (process.env.CI === "true")` to `if (process.env.E2E_LOCAL_SUPABASE === "true")`
- No other code changes needed
- Health check functions remain unchanged
- Dev integration tests will skip local health checks and use existing remote health check path

**Architecture Changes**: None - this is a pure condition refinement

**Migration Strategy**: N/A - no data or state migration needed

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/global-setup.ts` - Change condition at line 372 to check `E2E_LOCAL_SUPABASE` flag instead of `CI` flag

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update the Health Check Condition

Modify `apps/e2e/global-setup.ts` to use the correct environment variable.

- Open `apps/e2e/global-setup.ts`
- Navigate to line 372 (in the `globalSetup` function)
- Change the condition from `if (process.env.CI === "true")` to `if (process.env.E2E_LOCAL_SUPABASE === "true")`
- This ensures local health checks only run when explicitly configured for local Supabase

**Why this step first**: This is the sole change needed to fix the regression.

#### Step 2: Verify No Regression in Existing Code

Ensure the change doesn't introduce new issues.

- Review the fallback path (the `else` block) to confirm it handles remote Supabase correctly
- Confirm that when `E2E_LOCAL_SUPABASE` is NOT set, the code executes the existing remote health check logic
- Verify the comment at line 457 about `E2E_LOCAL_SUPABASE` now correctly documents the new behavior

#### Step 3: Add Regression Test

Create a test to prevent this regression from happening again.

- Add test coverage for the condition logic
- Verify that when `E2E_LOCAL_SUPABASE !== "true"` and `CI === "true"`, the code takes the remote health check path
- Ensure no future changes revert this condition back to `CI === "true"`

#### Step 4: Validation

Run validation commands to ensure the fix works.

- Type check the modified file
- Lint the modified file
- Verify the logic is sound through code review

## Testing Strategy

### Unit Tests

No unit tests needed for this change - it's a simple condition modification. The entire flow is covered by integration tests.

### Integration Tests

The fix is validated by the `dev-integration-tests.yml` workflow itself:
- When the workflow runs, it will execute `global-setup.ts`
- The condition will now evaluate to `false` (since `E2E_LOCAL_SUPABASE` is not set)
- It will skip local health checks and proceed with remote health check path
- Integration tests will complete successfully

**Test verification**:
- Run `dev-integration-tests.yml` workflow after the fix
- Should complete without "PostgreSQL unreachable" errors
- Should authenticate users via remote Supabase API

### E2E Tests

The `e2e-sharded.yml` workflow (which sets `E2E_LOCAL_SUPABASE=true`) should continue to work:
- Local health checks should still execute when `E2E_LOCAL_SUPABASE === "true"`
- PostgreSQL checks should pass (local container is running)
- Test suite should complete successfully

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify dev integration tests pass after fix
- [ ] Confirm e2e-sharded tests still pass (local health checks work)
- [ ] Check that neither workflow regresses
- [ ] Review the condition change for logical correctness
- [ ] Verify no other code paths are affected

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **E2E-Sharded Workflow Breakage**: If `E2E_LOCAL_SUPABASE` is not set in e2e-sharded.yml
   - **Likelihood**: low (flag was added in #1626 for this exact purpose)
   - **Impact**: high (would break local E2E testing)
   - **Mitigation**: Verify that `.github/workflows/e2e-sharded.yml` sets `E2E_LOCAL_SUPABASE: true`

2. **Incomplete Condition Change**: If the condition is changed but logic is inverted
   - **Likelihood**: low (single straightforward change)
   - **Impact**: high (workflow would fail again or unexpectedly skip health checks)
   - **Mitigation**: Code review before merge, verify actual condition logic

3. **Future Developers Confusion**: If the flag's purpose is not documented
   - **Likelihood**: medium
   - **Impact**: low (documentation and comments explain it)
   - **Mitigation**: Add clear comment explaining the flag's purpose at the condition

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the single-line change in `apps/e2e/global-setup.ts:372`
2. Restore condition to `if (process.env.CI === "true")`
3. This will immediately restore original behavior (at the cost of dev-integration-tests failing again)
4. The bug would require a more complex solution

**Monitoring** (if needed):
- Monitor `dev-integration-tests` workflow runs to ensure they complete successfully
- Watch for "Supabase health check failed" errors in test logs
- Verify no new PostgreSQL connection errors appear

## Performance Impact

**Expected Impact**: none - This is a pure logic change. The same code path executes, just with different conditions.

The remote health check path (used by dev-integration-tests) is unchanged and will continue to work as designed.

## Security Considerations

**Security Impact**: none

This change doesn't affect security posture. It only determines which health check code path executes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug is already manifesting in the current state:

```bash
# The dev-integration-tests workflow is currently failing with:
# Error: PostgreSQL health check failed: PostgreSQL unreachable: ...
```

Check the latest failed run:
```bash
gh run view <latest-failure-id> --repo MLorneSmith/2025slideheroes --log-failed
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# No unit tests to run (single-line condition change)

# Manual verification by running workflow
gh workflow run dev-integration-tests.yml --ref dev

# Check the workflow run completes successfully
gh run list --workflow=dev-integration-tests.yml --limit 1 --json status
```

**Expected Result**: Workflow completes successfully without "PostgreSQL unreachable" errors

### Regression Prevention

```bash
# Verify e2e-sharded workflow still works with local health checks
gh workflow run e2e-sharded.yml --ref dev

# Monitor both workflows
gh run list --workflow=e2e-sharded.yml --limit 1 --json status
gh run list --workflow=dev-integration-tests.yml --limit 1 --json status
```

## Dependencies

**No new dependencies required**

The code uses the same dependencies as before. No additional packages or libraries are needed.

## Database Changes

**No database changes required**

This is a pure code logic change that doesn't affect the database.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - The change is backward compatible. Existing behavior is preserved for workflows that set `E2E_LOCAL_SUPABASE=true`, and the dev-integration-tests workflow will now work correctly.

## Success Criteria

The fix is complete when:
- [ ] The one-line condition change is made in `apps/e2e/global-setup.ts:372`
- [ ] Code is type-safe and lints successfully
- [ ] `dev-integration-tests.yml` workflow completes without errors
- [ ] `e2e-sharded.yml` workflow continues to work correctly
- [ ] No regressions in other CI workflows
- [ ] Code review approved

## Notes

**Why this specific approach:**

The condition `process.env.CI === "true"` is set in ALL GitHub Actions workflows. This is too broad for determining whether to run local health checks. The `E2E_LOCAL_SUPABASE` flag was specifically added in #1626 to distinguish between:

1. CI workflows testing against **deployed environments** (dev-integration-tests, etc.)
2. CI workflows running **local Supabase** (e2e-sharded, local development)

Using the dedicated flag is the correct architectural approach because:
- It's explicit about intent
- It's already implemented
- It's used by existing code for exactly this purpose
- It's documented and referenced in the workflow

**Verification of flag existence:**

The `e2e-sharded.yml` workflow shows:
```yaml
env:
  E2E_LOCAL_SUPABASE: "true"  # This flag is already being set
```

This confirms the flag is part of the existing infrastructure.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1680*
