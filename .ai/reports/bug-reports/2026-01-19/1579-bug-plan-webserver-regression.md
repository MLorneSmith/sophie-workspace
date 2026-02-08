# Bug Fix: dev-integration-tests workflow webServer regression

**Related Diagnosis**: #1571
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Commit 3f9292a8d removed conditional webServer configuration, causing Playwright to unconditionally start local servers even in deployed environment tests
- **Fix Approach**: Restore conditional webServer behavior by detecting deployed environments via PLAYWRIGHT_BASE_URL
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests` GitHub Actions workflow tests against deployed Vercel environments where servers are already running. After commit 3f9292a8d, `playwright.config.ts` was modified to unconditionally configure `webServer` with both web and payload server startup commands.

When Playwright attempts to start these local servers in the CI environment where the base URL points to a deployed Vercel environment (e.g., `https://dev.slideheroes.com`), the server processes exit immediately because:
1. The ports (3001, 3021) are already in use or unreachable
2. The local environment doesn't have necessary dependencies running (local Supabase, etc.)
3. Playwright detects the process exited early and fails the test run

This is a regression—the code previously had conditional logic that disabled webServer for deployed environments.

### Solution Approaches Considered

#### Option 1: Conditional webServer by Environment Detection ⭐ RECOMMENDED

**Description**: Detect if tests are running against a deployed environment (via PLAYWRIGHT_BASE_URL or similar) and conditionally disable webServer configuration.

**Pros**:
- Minimal change—just 1-2 lines of logic
- No breaking changes
- Explicitly handles both local and deployed scenarios
- Clear intent in the code
- Follows the original design pattern before the regression

**Cons**:
- Requires environment variable convention to be established

**Risk Assessment**: low - the condition is straightforward and well-tested in the old code

**Complexity**: simple - 2-3 lines of conditional logic

#### Option 2: Remove webServer Configuration Entirely

**Description**: Delete the webServer configuration and rely on external script to start servers before tests.

**Pros**:
- Simplifies playwright.config.ts
- Makes it purely a test config, not responsible for server startup

**Cons**:
- Requires coordinating with CI workflows
- Local developers would need separate setup script
- Less convenient for local E2E testing
- Breaks existing developer workflow

**Why Not Chosen**: Requires broader changes and decreases developer experience for local testing.

#### Option 3: Use Environment-Specific Config Files

**Description**: Create separate playwright.config.local.ts and playwright.config.ci.ts files.

**Pros**:
- Explicit separation of concerns
- Very clear intent

**Cons**:
- Duplicates configuration
- More complex to maintain
- Harder to debug when configs diverge
- Additional CLI flag needed to select config

**Why Not Chosen**: Over-engineering for a simple conditional.

### Selected Solution: Conditional webServer by Environment Detection

**Justification**: This approach restores the original working pattern, is minimal, has zero breaking changes, and is the most pragmatic solution. The code previously had this logic—we're simply restoring it.

**Technical Approach**:
- Detect deployed environments by checking if `PLAYWRIGHT_BASE_URL` starts with `https://`
- When deployed environment detected, set `webServer: undefined`
- When local environment (http://localhost:*), include full webServer configuration
- No changes needed to CI workflows or developer setup

**Architecture Changes** (if any):
- None - this is a restoration of conditional logic that existed before

**Migration Strategy** (if needed):
- N/A - no data or schema changes

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Add conditional webServer logic (lines 194-213)

### New Files

None

### Step-by-Step Tasks

#### Step 1: Add conditional webServer logic

Update lines 194-213 in `playwright.config.ts` to conditionally set webServer based on environment detection.

- Read the current webServer configuration to understand the complete setup
- Add environment detection at the top of the webServer assignment
- Check if PLAYWRIGHT_BASE_URL (or derived URL) is a deployed environment (starts with https://)
- Set webServer to undefined for deployed environments
- Keep full webServer array for local environments

**Why this step first**: This is the core fix that immediately resolves the regression.

#### Step 2: Test the fix locally

Ensure the configuration still works with local testing.

- Start local dev server: `pnpm dev`
- Run E2E tests locally: `pnpm --filter web-e2e test`
- Verify tests can still start local servers and run successfully

#### Step 3: Verify CI passes

Trigger test workflow against deployed environment to confirm the fix works.

- Wait for a dev deployment to complete
- The dev-integration-tests workflow should now pass without webServer errors
- Monitor for "Process from config.webServer exited early" errors (should not appear)

#### Step 4: Validation

- Run full test suite to ensure no regressions
- Verify both local (with webServer) and deployed (without webServer) scenarios work

## Testing Strategy

### Unit Tests

Not applicable - this is configuration logic, not runtime code.

### Integration Tests

Not applicable - this is configuration.

### E2E Tests

Existing E2E tests will validate both scenarios:
- Local E2E tests will use webServer configuration
- CI E2E tests against deployed environments will skip webServer

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run E2E tests locally: `pnpm --filter web-e2e test` - should pass with webServer active
- [ ] Verify local Playwright can reach http://localhost:3001 (web server)
- [ ] Verify local Playwright can reach http://localhost:3021 (payload server)
- [ ] Trigger dev branch push to start deployment and integration test workflow
- [ ] Verify dev-integration-tests workflow passes (no "webServer exited early" errors)
- [ ] Check that E2E tests run against deployed environment successfully

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Condition detection logic incorrect**: Base URL detection might miss some edge cases
   - **Likelihood**: low
   - **Impact**: medium (tests might fail again)
   - **Mitigation**: Use explicit environment variable as primary check, base URL as fallback. Test both local and deployed scenarios thoroughly.

2. **Breaking local development**: Developers might suddenly have webServer disabled locally
   - **Likelihood**: low (only if PLAYWRIGHT_BASE_URL is set to https://)
   - **Impact**: medium (E2E tests won't run without separate server)
   - **Mitigation**: Document that webServer is conditional. Developers setting PLAYWRIGHT_BASE_URL to deployed URL are intentional (advanced scenario).

**Rollback Plan**:

If this fix causes issues:
1. Revert commit with the fix: `git revert <fix-commit>`
2. Push to dev branch
3. Deploy to revert the fix in CI workflow

**Monitoring** (if needed):
- Monitor dev-integration-tests workflow runs for webServer errors
- Watch for test failures in E2E tests related to "localhost" not reachable
- Alert on any "webServer exited early" errors

## Performance Impact

**Expected Impact**: none

No performance implications - this is a configuration change that only affects when servers are started, not how tests execute.

## Security Considerations

**Security Impact**: none

No security implications - this only affects test server configuration, not production or sensitive data handling.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Looking at the current code, the bug reproduces when:
1. Deployed environment test runs: `PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com pnpm test:e2e`
2. GitHub Actions workflow: `dev-integration-tests` workflow should fail with "Process from config.webServer exited early"

**Expected Result**: Tests fail with error about webServer process exiting early.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Local E2E tests (should start webServer)
pnpm --filter web-e2e test

# Simulated deployed environment test (should NOT start webServer)
PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com pnpm --filter web-e2e test 2>&1 | grep -v "webServer exited"

# Build
pnpm build

# Manual verification: push to dev and wait for integration test workflow
# Workflow should complete without webServer errors
```

**Expected Result**: All commands succeed, webServer only starts for local environments, deployed environment tests run without server startup errors.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify E2E tests work locally
pnpm --filter web-e2e test

# Verify no TypeScript errors
pnpm typecheck
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- The fix is to configuration only
- Existing CI workflows can continue unchanged

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] playwright.config.ts includes conditional webServer logic
- [ ] Type checking passes
- [ ] Local E2E tests run successfully (webServer starts)
- [ ] Local E2E tests run with PLAYWRIGHT_BASE_URL set to https:// (webServer skipped)
- [ ] dev-integration-tests workflow runs without "webServer exited early" errors
- [ ] All existing E2E tests continue to pass
- [ ] Zero regressions in test execution

## Notes

This fix restores the conditional webServer logic that existed before commit 3f9292a8d. The original commit attempted to standardize server startup but didn't account for deployed environment tests that don't need local servers.

The key insight is that webServer configuration should be conditional:
- **Local testing** (PLAYWRIGHT_BASE_URL = http://localhost:*): Start local servers via webServer
- **Deployed testing** (PLAYWRIGHT_BASE_URL = https://...*): Skip webServer, connect to deployed environment

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1571*
