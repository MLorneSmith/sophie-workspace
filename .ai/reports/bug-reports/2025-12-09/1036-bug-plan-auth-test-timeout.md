# Bug Fix: E2E Auth Test Timeout - Configuration Mismatch

**Related Diagnosis**: #1034
**Severity**: high
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test timeout (30s) shorter than `loginAsUser()` retry timeout (60s), killing test before retry completes
- **Fix Approach**: Align test timeout with configured retry intervals using `testConfig.getTimeout("medium")`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `auth-simple.spec.ts` test suite has a test timeout of 30 seconds (line 11), but the `loginAsUser()` function uses a 60-second timeout for its retry mechanism via `toPass()` (line 494 in auth.po.ts). This mismatch causes tests to be terminated before the retry logic can complete, preventing authentication attempts from succeeding even when the underlying functionality works.

For full details, see diagnosis issue #1034.

### Solution Approaches Considered

#### Option 1: Use `testConfig.getTimeout("medium")` for test timeout ⭐ RECOMMENDED

**Description**: Replace the hardcoded 30s timeout with a call to `testConfig.getTimeout("medium")`, which returns 60s in CI and 45s locally. This ensures the test timeout always exceeds the configured auth retry timeout.

**Pros**:
- Follows existing patterns (already used in `loginAsUser()`)
- Centralizes timeout management in `TestConfigManager`
- Environment-aware: CI gets 60s, local gets 45s
- Future timeout changes only need updates in one place
- Aligns with Issue #992 Phase 1 fix recommendations
- Simple one-line change, no refactoring needed

**Cons**:
- Extends test timeout slightly (was 30s, now 45-60s)
- Tests will take longer if they hang (acceptable since it prevents false failures)

**Risk Assessment**: low - This is a configuration alignment fix with no code logic changes

**Complexity**: simple - Single-line configuration change

#### Option 2: Increase hardcoded timeout to 90s

**Description**: Directly update line 11 to `timeout: 90000`

**Pros**:
- Straightforward change
- Gives maximum buffer for retries

**Cons**:
- Bypasses the environment-aware config system
- Doesn't follow existing patterns in the codebase
- Makes timeout management fragile (hardcoded values in multiple places)
- If test-config is updated later, this hardcoded value won't benefit
- Violates Issue #992 timeout policy (should use config, not hardcode)

**Why Not Chosen**: This approach creates technical debt by maintaining parallel timeout configurations. The recommended approach uses the existing config system that's already implemented.

#### Option 3: Reduce `loginAsUser()` timeout to match 30s test timeout

**Description**: Change `testConfig.getTimeout("medium")` to `testConfig.getTimeout("short")` in auth.po.ts

**Pros**:
- Keeps test timeout short (30s)
- Faster feedback for hanging tests

**Cons**:
- Reduces retry budget for legitimate auth operations
- Network delays or Turnstile could consume the 15s budget
- Risk of breaking working authentication when network is slow
- Creates tight coupling between test timeout and auth timeout

**Why Not Chosen**: Reduces reliability of the test itself. Auth operations need adequate time for network calls and Turnstile processing. Issue #1034 diagnosis shows that the first auth attempt takes >15s, making this approach unworkable.

### Selected Solution: Use `testConfig.getTimeout("medium")` for test timeout

**Justification**: This approach is the most maintainable and follows existing patterns in the codebase. The test timeout must accommodate the auth retry budget, and using the config system ensures consistency across all timeout-dependent code. This aligns with Issue #992's Phase 1 fix recommendations and centralizes timeout management for future maintainability.

**Technical Approach**:
- Replace hardcoded 30000ms timeout with `testConfig.getTimeout("medium")`
- Leverage existing `TestConfigManager` singleton that's already initialized in the test suite
- Auth timeout (60s in CI, 45s locally) now explicitly exceeds test timeout constraints
- Retry intervals (1s, 2s, 5s, 10s, 15s, 20s, 25s, 30s, 35s) have adequate completion time

**Architecture Changes**: None required. The `TestConfigManager` is already instantiated and available. No changes to test infrastructure.

**Migration Strategy**: Not applicable - pure configuration alignment with no data or state changes.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/authentication/auth-simple.spec.ts:11` - Update test timeout configuration from hardcoded 30000ms to dynamic config value

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Import TestConfigManager

Update the imports in `auth-simple.spec.ts` to include `TestConfigManager`:

```typescript
import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../helpers/test-users";
import { AuthPageObject } from "./auth.po";
import { testConfig } from "../utils/test-config"; // Add this import
```

**Why this step first**: The import must be in place before we can reference the config manager in the test configuration.

#### Step 2: Replace hardcoded timeout with config value

Update line 11 in `auth-simple.spec.ts`:

```typescript
// FROM:
test.describe.configure({ mode: "serial", timeout: 30000 });

// TO:
test.describe.configure({ mode: "serial", timeout: testConfig.getTimeout("medium") });
```

**Why this ordering**: After importing, we can immediately apply the configuration. This is the core fix that resolves the timeout mismatch.

#### Step 3: Verify the fix works

- Run the test locally to confirm it passes
- Run the test in CI to confirm the workflow succeeds
- Verify no new timeout issues appear in other auth tests

#### Step 4: Validate types and linting

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

Ensure no TypeScript or linting errors are introduced.

## Testing Strategy

### Unit Tests

Not applicable - this is a configuration fix with no unit-testable logic changes.

### Integration Tests

The existing test suite serves as the integration test:

- ✅ Test: `auth-simple.spec.ts` - "user can sign in with valid credentials"
- ✅ Edge case: First auth attempt takes >15s due to network/Turnstile
- ✅ Edge case: React Query hydration race condition (requires retries)
- ✅ Regression test: Timeout should not occur before retry mechanism completes

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Main authentication test suite

### E2E Tests

The `dev-integration-tests.yml` GitHub Actions workflow serves as the E2E validation:

- Run: `dev-integration-tests.yml` workflow on dev branch
- Verify: `user can sign in with valid credentials` test passes without timeout
- Verify: All other auth tests pass
- Verify: Workflow completes successfully

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Production test execution

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run tests locally: `pnpm test:e2e --grep "user can sign in"`
- [ ] Verify test passes within 45-60 second timeout window
- [ ] Check logs show auth operation completing before test timeout
- [ ] Verify no new timeouts appear in subsequent test runs
- [ ] Run full auth test suite: `pnpm test:e2e auth`
- [ ] All tests should pass without timeout failures

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tests run slower**: Tests now have 45-60s timeout instead of 30s
   - **Likelihood**: high
   - **Impact**: low (acceptable trade-off to prevent false failures)
   - **Mitigation**: This is intentional and correct. The timeout should match the actual operation time. If tests are timing out, the root cause should be fixed, not masked with arbitrary timeouts per Issue #992.

2. **Hanging tests now take longer to fail**: If a test hangs, it will take 45-60s instead of 30s to timeout
   - **Likelihood**: low
   - **Impact**: low (hanging tests are still detected, just with longer feedback loop)
   - **Mitigation**: Issue #992 recommends fixing root causes of hangs, not reducing timeout budgets.

3. **Configuration loading fails**: `testConfig` is not initialized
   - **Likelihood**: very low
   - **Impact**: medium (test would fail to initialize)
   - **Mitigation**: `TestConfigManager` is a singleton that auto-initializes. The import and usage pattern match existing code in auth.po.ts line 494.

**Rollback Plan**:

If this fix causes unexpected issues in production:

1. Revert the timeout change back to hardcoded 30000ms
2. Investigate why auth operations are taking >30 seconds
3. Address the root cause (network, server, React Query hydration, etc.)
4. Re-apply the fix once root cause is resolved

**Monitoring** (if needed):

- Monitor `dev-integration-tests.yml` workflow completion times
- Watch for timeout failures in auth tests
- Alert if auth test completion time consistently exceeds 45s (indicates performance regression)

## Performance Impact

**Expected Impact**: none (configuration only, no logic changes)

The timeout extension from 30s to 45-60s has negligible performance impact since it's a test configuration change. The actual auth operation time remains unchanged; we're just giving it adequate time to complete.

**Performance Testing**:

- Expected auth operation time: 5-15 seconds (network + Turnstile + React Query hydration)
- Test timeout budget: 45-60 seconds (CI) or 45 seconds (local)
- Buffer: 30-55 seconds for retries

This is appropriate and aligns with Issue #992 timeout policy.

## Security Considerations

**Security Impact**: none

This is purely a test timeout configuration change with no security implications. The authentication mechanism itself is unchanged.

## Validation Commands

### Before Fix (Bug Should Reproduce)

To reproduce the timeout in the current state:

```bash
# Run the integration test that times out
cd /home/msmith/projects/2025slideheroes
pnpm test:e2e --grep "user can sign in with valid credentials"

# OR run via GitHub Actions
gh workflow run dev-integration-tests.yml --ref dev
```

**Expected Result**: Test times out at exactly 30 seconds before auth completes.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the previously-failing auth test
pnpm test:e2e --grep "user can sign in with valid credentials"

# Run full auth test suite
pnpm test:e2e auth

# Run via GitHub Actions
gh workflow run dev-integration-tests.yml --ref dev
```

**Expected Result**: All commands succeed, auth test completes without timeout, zero regressions in other E2E tests.

### Regression Prevention

```bash
# Run full E2E test suite
pnpm test:e2e

# Verify dev-integration-tests workflow passes
gh workflow run dev-integration-tests.yml --ref dev
gh workflow view dev-integration-tests.yml --repo MLorneSmith/2025slideheroes
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. `TestConfigManager` is already available in the codebase.

### Existing Dependencies Used

- `@playwright/test` - Already a dependency
- `TestConfigManager` - Already implemented in `apps/e2e/tests/utils/test-config.ts`

## Database Changes

**Database changes needed**: no

This is purely a test configuration change with no database modifications.

## Deployment Considerations

**Deployment Risk**: none

This change only affects E2E test execution. There are no runtime code changes or configuration changes that affect the deployed application.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

This change is backwards compatible. The test behavior improves (no more false timeout failures) with no breaking changes to the application code or public APIs.

## Success Criteria

The fix is complete when:
- [ ] `auth-simple.spec.ts` imports `testConfig` from test utils
- [ ] Test timeout configuration uses `testConfig.getTimeout("medium")`
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm test:e2e --grep "user can sign in with valid credentials"` passes
- [ ] `pnpm test:e2e auth` passes with all auth tests passing
- [ ] `dev-integration-tests.yml` workflow passes in GitHub Actions
- [ ] No new timeout errors appear in E2E tests
- [ ] No regressions in other test files

## Notes

### Related Issues & Context

- **Issue #992** (CLOSED): "E2E Test Infrastructure Systemic Architecture Problems" - Established the timeout policy this fix implements
- **Issue #1034**: This diagnosis issue - Identified the specific timeout mismatch
- **Issue #928** (CLOSED): Similar auth timeout issue fixed by React Query hydration improvements

### Timeline & History

The test timeout issue has been a recurring problem:
1. Test was originally written with 30s timeout
2. Auth operations grew more complex (React Query hydration, Turnstile)
3. Timeout became too short, causing false failures
4. Issue #992 established the fix approach: use config-managed timeouts
5. This fix implements the Issue #992 recommendation

### Implementation Notes

- The `TestConfigManager.getTimeout()` method is used throughout the codebase (see auth.po.ts:494, 508)
- CI environment gets 60s, local gets 45s - this is intentional for different network/hardware conditions
- The retry intervals in testConfig already support the extended timeout (up to 35s)
- No changes needed to the retry logic in `loginAsUser()` - it already works correctly with extended timeouts

### Future Considerations

After this fix is deployed, monitor for:
- Auth test completion times (should be 5-15s, with retries up to 45s)
- If auth consistently takes >30s, investigate root cause (network, server performance, etc.)
- Consider Phase 2 improvements from Issue #992: API-based auth without UI interaction

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1034*
