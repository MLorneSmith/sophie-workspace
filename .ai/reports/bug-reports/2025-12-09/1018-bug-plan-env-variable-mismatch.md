# Bug Fix: Environment Variable Mismatch in Health Check

**Related Diagnosis**: #1017 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `checkSupabaseHealth()` uses `NEXT_PUBLIC_SUPABASE_URL` instead of `E2E_SUPABASE_URL`, causing health checks to fail in CI where only `E2E_SUPABASE_URL` is set
- **Fix Approach**: Update health check to prioritize `E2E_SUPABASE_URL` before falling back to other variables
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow consistently fails because the health check in `server-health-check.ts` uses the wrong environment variable. The CI workflow sets `E2E_SUPABASE_URL` (which is correctly used by all other E2E test files), but the health check looks for `NEXT_PUBLIC_SUPABASE_URL` and defaults to `localhost:54321`. Since localhost is unreachable from CI runners, all health checks fail, preventing integration tests from running.

For full details, see diagnosis issue #1017.

### Solution Approaches Considered

#### Option 1: Prioritize E2E_SUPABASE_URL ⭐ RECOMMENDED

**Description**: Update `checkSupabaseHealth()` to check `E2E_SUPABASE_URL` first, then fall back to `NEXT_PUBLIC_SUPABASE_URL`, then localhost.

**Pros**:
- Single line change aligns with existing E2E test patterns
- Maintains backward compatibility with dev environments
- All E2E test files use this same priority order
- Immediate fix for CI failures

**Cons**:
- None significant

**Risk Assessment**: low - This is a one-line environment variable priority change with no logic changes

**Complexity**: simple - Straightforward variable priority ordering

#### Option 2: Create Separate Health Check Config

**Description**: Create a dedicated config file for health check environment variables that mirrors the E2E test setup.

**Pros**:
- Centralized configuration for all health checks
- Could be extended for other services

**Cons**:
- Over-engineering for a simple fix
- Adds maintenance burden for minimal benefit
- Duplicates existing environment variable handling

**Why Not Chosen**: The diagnosis clearly shows that other E2E test files successfully use the same environment variable pattern. No configuration centralization needed.

### Selected Solution: Prioritize E2E_SUPABASE_URL

**Justification**: This is the simplest, most maintainable fix. It aligns the health check with how all other E2E test utilities (`e2e-validation.ts`, `auth.po.ts`, `global-setup.ts`) access Supabase, ensuring consistency across the E2E testing infrastructure.

**Technical Approach**:
- Update line 23-24 in `server-health-check.ts` to check `E2E_SUPABASE_URL` first
- Change fallback order from: `NEXT_PUBLIC_SUPABASE_URL || localhost`
- To: `E2E_SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL || localhost`
- This matches the pattern used in `e2e-validation.ts` (line 26)

**Architecture Changes**: None - This is purely an environment variable priority change

**Migration Strategy**: No migration needed - This is backward compatible

## Implementation Plan

### Affected Files

- `apps/e2e/tests/utils/server-health-check.ts` - Update `checkSupabaseHealth()` function to use correct environment variable priority

### New Files

None required - This is a single-function update.

### Step-by-Step Tasks

#### Step 1: Update Environment Variable Priority

Update the `checkSupabaseHealth()` function to prioritize `E2E_SUPABASE_URL`:

- Open `apps/e2e/tests/utils/server-health-check.ts`
- Locate line 23-24 in the `checkSupabaseHealth()` function
- Change from:
  ```typescript
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  ```
- To:
  ```typescript
  const supabaseUrl =
    process.env.E2E_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  ```

**Why this step first**: This is the root cause of the health check failures. The fix must be applied before running any tests.

#### Step 2: Verify Environment Variable Usage Consistency

Confirm that this matches the pattern used in other E2E test utilities:

- Check `apps/e2e/tests/utils/e2e-validation.ts` (line 26) - Uses `E2E_SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL`
- Check `apps/e2e/global-setup.ts` (line 293) - Uses `E2E_SUPABASE_URL` for CI
- Confirm all three files now use the same variable priority order

**Why this step**: Ensures consistency across the codebase and validates our fix approach

#### Step 3: Run Type Check and Linting

Execute validation commands to ensure no syntax errors:

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

**Why this step**: Verify the code change doesn't introduce type errors or formatting issues

#### Step 4: Manual Testing - Verify CI Environment Behavior

Test that the health check now works correctly in CI context:

- Create a test script that simulates CI environment (sets `E2E_SUPABASE_URL` only)
- Run `checkSupabaseHealth()` to verify it successfully connects
- Verify that the function correctly falls back when `E2E_SUPABASE_URL` is not set

**Why this step**: Confirm the fix resolves the original CI failure scenario

#### Step 5: Validation

Run the integration test workflow to verify the bug is fixed:

```bash
# The dev-integration-tests.yml workflow should now pass
# Health checks should succeed when E2E_SUPABASE_URL is set
```

## Testing Strategy

### Unit Tests

The health check function is already tested implicitly by the global setup. No new unit tests needed since:
- This is a simple variable priority change
- The function logic remains unchanged
- Existing E2E tests will validate the fix

### Integration Tests

The fix will be validated by:
- ✅ Health check passes when `E2E_SUPABASE_URL` is set (CI scenario)
- ✅ Health check passes when `NEXT_PUBLIC_SUPABASE_URL` is set (dev scenario)
- ✅ Health check falls back to localhost when neither is set (local scenario)
- ✅ Dev integration tests pass without errors

### E2E Tests

No E2E tests needed - the health check is part of global setup. Running any E2E test suite validates this fix.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Simulate CI environment (unset `NEXT_PUBLIC_SUPABASE_URL`, set `E2E_SUPABASE_URL`)
- [ ] Run `node -e "require('./apps/e2e/tests/utils/server-health-check').checkSupabaseHealth().then(r => console.log(r))"`
- [ ] Verify health check returns `healthy: true` with proper Supabase URL
- [ ] Test fallback scenario (unset both variables, verify localhost fallback)
- [ ] Run full E2E test suite to confirm global setup completes successfully
- [ ] Verify CI workflows (dev-integration-tests.yml) pass

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unexpected behavior in dev environment**: If developers have `E2E_SUPABASE_URL` set, health checks might use wrong URL
   - **Likelihood**: low
   - **Impact**: low - Still connects to a valid Supabase instance
   - **Mitigation**: `E2E_SUPABASE_URL` is only used in CI. Developers use default dev port.

2. **Breaking change for custom health check usage**: If code elsewhere depends on specific URL priority
   - **Likelihood**: very low
   - **Impact**: low - Health check is internal to E2E tests
   - **Mitigation**: Health check is only called from `global-setup.ts`. No external dependencies.

**Rollback Plan**:

If this change causes issues:
1. Revert the one-line change in `server-health-check.ts`
2. Push fix revert to dev branch
3. Re-run dev-integration-tests.yml workflow

No database changes, no data migration, no infrastructure changes needed for rollback.

**Monitoring** (if needed):
- Monitor dev-integration-tests.yml workflow success rate
- Watch for any unexpected health check failures in CI

## Performance Impact

**Expected Impact**: none

This is a simple environment variable priority change with no performance implications. The health check function logic remains identical.

## Security Considerations

**Security Impact**: none

This change only affects which environment variable is used for the Supabase URL. No security implications:
- `E2E_SUPABASE_URL` is already set in CI workflows
- The URL is internal (localhost in CI, dev URL in dev environment)
- No credentials exposed
- No security policies affected

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Simulate CI environment where only E2E_SUPABASE_URL is set
export E2E_SUPABASE_URL="http://supabase-test:54321"
unset NEXT_PUBLIC_SUPABASE_URL

# Before fix, health check would use localhost and fail
node -e "
const { checkSupabaseHealth } = require('./apps/e2e/tests/utils/server-health-check');
checkSupabaseHealth().then(r => console.log('BEFORE:', r.message));
"

# Expected: "Supabase unreachable: fetch failed" (because localhost is used, not E2E_SUPABASE_URL)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification with E2E_SUPABASE_URL set
export E2E_SUPABASE_URL="http://127.0.0.1:54521"
unset NEXT_PUBLIC_SUPABASE_URL

node -e "
const { checkSupabaseHealth } = require('./apps/e2e/tests/utils/server-health-check');
checkSupabaseHealth().then(r => console.log('AFTER:', r.message));
"

# Expected: "Supabase healthy (Xms)" (because E2E_SUPABASE_URL is now used)

# Run integration test suite
pnpm --filter e2e test:shard1  # Smoke tests - validates health checks pass
```

**Expected Result**: All commands succeed, health check correctly uses E2E_SUPABASE_URL, CI workflows pass.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm --filter e2e test

# Verify dev environment still works (NEXT_PUBLIC_SUPABASE_URL fallback)
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
unset E2E_SUPABASE_URL
pnpm --filter e2e test:shard1
```

## Dependencies

### New Dependencies

**No new dependencies required**

The fix uses only existing Node.js `process.env` APIs.

## Database Changes

**No database changes required**

This is purely a client-side environment variable fix with no database implications.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - This is a simple code change with no special deployment requirements.

**Feature flags needed**: no

**Backwards compatibility**: maintained - Fully backward compatible with existing environments

## Success Criteria

The fix is complete when:
- [ ] `server-health-check.ts` updated to prioritize `E2E_SUPABASE_URL`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Code is formatted: `pnpm format`
- [ ] Health check correctly uses `E2E_SUPABASE_URL` in CI
- [ ] Health check correctly falls back to `NEXT_PUBLIC_SUPABASE_URL` in dev
- [ ] dev-integration-tests.yml workflow passes
- [ ] All E2E tests pass without health check failures
- [ ] Manual testing checklist complete

## Notes

This is an extremely simple one-line fix that resolves a critical CI issue. The root cause was identified precisely in the diagnosis: the health check used the wrong environment variable compared to all other E2E test utilities.

The fix maintains consistency with how `e2e-validation.ts` (line 26) and `global-setup.ts` (line 293) handle Supabase URL resolution, ensuring all E2E test infrastructure uses the same variable priority order.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1017*
