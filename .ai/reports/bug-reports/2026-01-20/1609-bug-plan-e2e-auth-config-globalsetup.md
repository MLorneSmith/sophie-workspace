# Bug Fix: E2E Auth Config Missing globalSetup Causes Test User Creation Failure

**Related Diagnosis**: #1608 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `playwright.auth.config.ts` lacks the `globalSetup` configuration that creates test users before auth tests run
- **Fix Approach**: Add `globalSetup: "./global-setup.ts"` to `playwright.auth.config.ts` to create test users before authentication tests execute
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The e2e-sharded workflow fails on authentication tests (shard 2) because `playwright.auth.config.ts` doesn't have a `globalSetup` configuration. After each shard runs `supabase db reset --no-seed`, the test users don't exist, causing authentication failures with the error "The credentials entered are invalid".

The main `playwright.config.ts` correctly includes `globalSetup: "./global-setup.ts"` (line 72), but the auth-specific configuration file `playwright.auth.config.ts` is missing this critical setting.

For full details, see diagnosis issue #1608.

### Solution Approaches Considered

#### Option 1: Add globalSetup to playwright.auth.config.ts ⭐ RECOMMENDED

**Description**: Add the same `globalSetup: "./global-setup.ts"` configuration to `playwright.auth.config.ts` that already exists in `playwright.config.ts`. This ensures test users are created before auth tests run.

**Pros**:
- Minimal change (single line addition)
- Directly mirrors the working pattern in main config
- Maintains consistency across all Playwright configurations
- Reuses battle-tested `global-setup.ts` logic
- Zero risk of introducing new behavior

**Cons**:
- None identified

**Risk Assessment**: low - This is a straightforward configuration addition with no code logic changes.

**Complexity**: simple - One-line addition to config file.

#### Option 2: Create auth-specific global setup

**Description**: Create a separate `auth-global-setup.ts` that only calls `setupTestUsers()` without other setup logic.

**Why Not Chosen**: Over-engineered for this issue. The existing `global-setup.ts` is already optimized for auth tests and reusing it is simpler and more maintainable than duplicating its logic.

### Selected Solution: Add globalSetup to playwright.auth.config.ts

**Justification**: This is the simplest, most direct fix. The `global-setup.ts` file already handles test user creation correctly (as evidenced by it working in `playwright.config.ts`). Adding the same configuration to `playwright.auth.config.ts` ensures auth tests run with proper test data, matching the pattern already established in the main configuration.

**Technical Approach**:
- Add `globalSetup: "./global-setup.ts"` to the Playwright config export in `playwright.auth.config.ts`
- Place it after the `fullyParallel: false` line to maintain consistency with `playwright.config.ts` ordering
- No other changes needed - the existing `global-setup.ts` already has all necessary logic

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.auth.config.ts` - Add globalSetup configuration (line 14 area)

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update playwright.auth.config.ts configuration

Add the `globalSetup` property to the config export.

- Open `apps/e2e/playwright.auth.config.ts`
- After the `fullyParallel: false,` line (line 16), add a new line: `globalSetup: "./global-setup.ts",`
- This matches the pattern in `playwright.config.ts` line 72

**Why this step first**: This is the core fix that enables test user creation. Without this configuration, the global setup won't run before auth tests.

## Testing Strategy

### Regression Test: Original Bug Reproduction

Test that the fix resolves the original authentication failure:

```bash
# Run shard 2 (auth tests) locally to verify test users are created
pnpm --filter e2e test:shard2

# Tests should pass without "credentials invalid" errors
# Authentication tests should be able to sign in as test@slideheroes.com
```

### Validation Commands

#### Before Fix (Bug Should Reproduce)

```bash
# This demonstrates the bug - tests fail with credential errors
pnpm --filter e2e playwright test tests/authentication/ --config=playwright.auth.config.ts
```

**Expected Result**: Tests fail with "Sorry, we could not authenticate you - The credentials entered are invalid"

#### After Fix (Bug Should Be Resolved)

```bash
# Type check (should already pass)
pnpm typecheck

# Lint (should already pass)
pnpm lint

# Run auth tests with the updated config
pnpm --filter e2e playwright test tests/authentication/ --config=playwright.auth.config.ts
```

**Expected Result**:
- All auth tests pass
- Global setup runs and creates test users (visible in logs)
- No credential validation errors
- Test users exist in database after setup

### Regression Prevention

```bash
# Run all shards to ensure no regressions
pnpm --filter e2e test:shard1  # Smoke tests (should pass)
pnpm --filter e2e test:shard2  # Auth tests (should pass with fix)
pnpm --filter e2e test:shard3  # Account tests (should pass)
# ... other shards

# Or run the full test suite
pnpm --filter e2e test
```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended Side Effects**: Adding globalSetup might slow down auth tests slightly
   - **Likelihood**: low
   - **Impact**: low (tests might take 2-3 seconds longer for setup)
   - **Mitigation**: Monitor test execution time in CI; this is acceptable overhead for ensuring correct setup

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a configuration-only change that doesn't affect runtime behavior.

**Feature flags needed**: No

**Backwards compatibility**: maintained - This fix doesn't change any APIs or behavior, just ensures proper setup runs.

## Success Criteria

The fix is complete when:
- [ ] `playwright.auth.config.ts` includes `globalSetup: "./global-setup.ts"`
- [ ] Shard 2 (auth tests) passes in CI without credential errors
- [ ] Test users are created before auth tests run
- [ ] No regression in other test shards
- [ ] Code review approved (if applicable)

## Notes

This fix directly addresses the root cause identified in #1603 (similar issue) where the same `globalSetup` was missing. The solution follows the exact same pattern that fixed authentication in the main Playwright config.

The `global-setup.ts` file already contains all necessary logic:
- Health checks (ensures Supabase/Next.js are available)
- Test user creation via `setupTestUsers()`
- Browser state storage in `.auth/` directory
- Cookie handling for Docker compatibility

No modifications to `global-setup.ts` are needed.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1608*
