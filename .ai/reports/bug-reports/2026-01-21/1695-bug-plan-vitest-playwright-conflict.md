# Bug Fix: Vitest Test File in Playwright Directory Causes CI Failure

**Related Diagnosis**: #1694
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Vitest test file (`supabase-health.spec.ts`) placed in Playwright's testDir with no exclusion pattern
- **Fix Approach**: Add testIgnore pattern in playwright.config.ts to exclude setup directory spec files
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

A Vitest unit test file (`supabase-health.spec.ts`) was added to `apps/e2e/tests/setup/` directory, which is under Playwright's `testDir: "./tests"`. Playwright discovers this `.spec.ts` file and tries to run it as a Playwright test, but it imports from `vitest` (ESM-only library) which cannot be loaded via CommonJS require(), causing the entire test suite to crash.

For full details, see diagnosis issue #1694.

### Solution Approaches Considered

#### Option 1: Add testIgnore Pattern in playwright.config.ts ⭐ RECOMMENDED

**Description**: Modify the `testIgnore` array in `playwright.config.ts` to exclude `.spec.ts` files in the `tests/setup/` directory using a regex pattern.

**Pros**:
- Minimal change (one-line modification to array)
- Keeps related files together (health check utility and tests in same location)
- Establishes clear convention for future Vitest tests in E2E package
- Zero risk of breaking anything else
- Immediate fix with no side effects
- Follows existing pattern (already excludes `.setup.ts` files)

**Cons**:
- Vitest tests mixed with Playwright tests (but isolated by pattern)
- Requires discipline to maintain convention

**Risk Assessment**: Low - Simple regex pattern change that only affects test discovery

**Complexity**: Simple - One-line change

#### Option 2: Move File Outside Playwright's testDir

**Description**: Create a separate directory (e.g., `apps/e2e/unit-tests/` or `apps/e2e/__tests__/`) for Vitest tests, move the test file there.

**Pros**:
- Clear separation between Playwright and Vitest tests
- Could establish future pattern for unit tests
- Physically organizes tests by framework

**Cons**:
- Requires moving/reorganizing files
- Creates new directory structure to maintain
- More changes (move file, update import paths if needed)
- Higher complexity than necessary
- File separation makes related code harder to find

**Why Not Chosen**: Overkill for a single test file. The testIgnore pattern is simpler, faster, and sufficient.

#### Option 3: Convert to Playwright Test Format

**Description**: Rewrite `supabase-health.spec.ts` to use Playwright's testing framework instead of Vitest.

**Pros**:
- Unified testing framework
- No exclusion patterns needed
- File can stay in current location

**Cons**:
- Rewrites working unit tests unnecessarily
- Vitest is better suited for unit tests with mocking
- Playwright tests are slower and more integration-focused
- Loses vi.mock() functionality
- Defeats purpose of having unit tests vs E2E tests
- Time wasteful (test logic is already correct)

**Why Not Chosen**: The existing Vitest tests are appropriate and working. This would be unnecessary refactoring.

### Selected Solution: Add testIgnore Pattern in playwright.config.ts

**Justification**: This approach is:
1. **Surgical** - One-line change that fixes the exact problem
2. **Safe** - No risk of breaking anything; only affects test discovery
3. **Fast** - Can be implemented and deployed immediately
4. **Maintainable** - Sets clear pattern for future Vitest tests
5. **Minimal** - Least disruptive to existing code and project structure
6. **Correct** - Directly addresses the root cause

**Technical Approach**:
- Modify the `testIgnore` array in `playwright.config.ts` (line 81 in chromium project config)
- Add regex pattern `/tests\/setup\/.*\.spec\.ts/` to exclude spec files in setup directory
- This pattern explicitly excludes Vitest test files while preserving other setup files

**Architecture Changes**: None - Pure configuration change

**Migration Strategy**: Not needed - Configuration change takes effect immediately on next test run

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Add testIgnore pattern for setup directory spec files

### New Files

No new files needed

### Step-by-Step Tasks

#### Step 1: Update Playwright Configuration

Modify `apps/e2e/playwright.config.ts` to add the exclusion pattern.

- Open file at line 44-54 where `testIgnore` is defined
- Add regex pattern `/tests\/setup\/.*\.spec\.ts/` to the `testIgnore` array for the chromium project
- Verify pattern syntax is correct (must be regex pattern, not string)

**Why this step first**: This is the only change needed to fix the bug

#### Step 2: Verify the Fix Works

Validate that Playwright no longer attempts to load the Vitest test file.

- Run `pnpm --filter web-e2e playwright test --grep @integration` locally to verify no errors
- Verify the global setup completes successfully without vitest import errors
- Check that regular Playwright tests can still run

#### Step 3: Validate No Regressions

Ensure no other tests are affected.

- Run full E2E test suite: `pnpm --filter web-e2e test:integration`
- Verify all existing Playwright tests still run
- Verify no test files are accidentally excluded

#### Step 4: Validation

Run all validation commands to ensure the fix is complete.

- Type check passes
- Linting passes
- Tests can run without errors

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration fix

### Integration Tests

The existing Vitest tests in `supabase-health.spec.ts` already have comprehensive unit test coverage:
- PostgreSQL health check with exponential backoff
- PostgREST API check with timeout
- Kong API Gateway retries
- Edge cases: timeouts, connection failures, max attempts

These tests should continue to run independently via Vitest (not picked up by Playwright)

### E2E Tests

No E2E tests needed - Playwright integration tests will validate the fix

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter web-e2e playwright test --grep @integration` locally
  - Should NOT see "Vitest cannot be imported" error
  - Global setup should complete successfully
  - Tests should discover and run properly
- [ ] Verify dev-integration-tests.yml workflow no longer fails with Vitest error
- [ ] Run full test suite: `pnpm --filter web-e2e test` and verify all tests pass
- [ ] Run `pnpm typecheck` - should pass with no errors
- [ ] Run `pnpm lint` - should pass with no errors
- [ ] Run `pnpm format` - should pass with no errors

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Regex Pattern Too Broad**: Pattern excludes unintended files
   - **Likelihood**: Low (pattern is specific: `/tests\/setup\/.*\.spec\.ts/`)
   - **Impact**: Low (only affects test discovery)
   - **Mitigation**: Use specific regex pattern, test locally before committing

2. **Other Setup Files Affected**: Pattern breaks other setup configuration
   - **Likelihood**: Very Low (regex only targets `.spec.ts` files)
   - **Impact**: Low (only test discovery affected)
   - **Mitigation**: Pattern only excludes `.spec.ts`, not `.ts` files

3. **Vitest Tests Not Running**: The unit tests might not run at all
   - **Likelihood**: Low (Vitest tests are in file with `vitest` import, not affected by Playwright config)
   - **Impact**: Medium (unit tests wouldn't be executed)
   - **Mitigation**: Verify Vitest tests still run via separate test command if needed

**Rollback Plan**:

If this fix causes issues:
1. Remove the regex pattern from `testIgnore` in playwright.config.ts
2. Revert commit: `git revert <commit-hash>`
3. Return to previous state

**Monitoring** (if needed):

- Monitor dev-integration-tests.yml workflow on next run - should not show Vitest import errors
- Verify all Playwright tests still execute properly

## Performance Impact

**Expected Impact**: None

The change is configuration-only. It removes a file from Playwright's test discovery but adds no processing overhead. In fact, it should slightly improve performance by not attempting to load and parse an incompatible test file.

**Performance Testing**: Not needed - configuration change doesn't affect runtime performance

## Security Considerations

**Security Impact**: None

This is a test configuration change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce Locally)

If you run Playwright locally before applying this fix:

```bash
# This would fail with Vitest import error before fix
pnpm --filter web-e2e playwright test --grep @integration
```

**Expected Result**: Error about "Vitest cannot be imported in a CommonJS module"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run integration tests (should NOT see Vitest error)
pnpm --filter web-e2e test:integration

# Run full E2E test suite
pnpm --filter web-e2e test

# Verify the CI workflow passes
# (dev-integration-tests.yml should no longer fail with Vitest error)
```

**Expected Result**: All commands succeed, no Vitest import errors, dev-integration-tests.yml workflow succeeds

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify no Playwright tests were accidentally excluded
pnpm --filter web-e2e playwright test --list | grep -c "spec"
```

## Dependencies

**No new dependencies required**

This is a pure configuration change using existing technologies.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Very Low

**Special deployment steps**: None

This is a configuration fix that takes effect immediately on the next test run. No deployment steps needed.

**Feature flags needed**: No

**Backwards compatibility**: Maintained

The change only affects test discovery. Existing tests continue to work as before.

## Success Criteria

The fix is complete when:
- [ ] Playwright config updated with testIgnore pattern
- [ ] dev-integration-tests.yml workflow passes without Vitest error
- [ ] All Playwright tests continue to run successfully
- [ ] Type check passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Code formatted correctly: `pnpm format`
- [ ] Zero regressions in test suite
- [ ] Vitest tests still run (via Vitest runner, not Playwright)

## Notes

**Implementation Notes**:
- The regex pattern `/tests\/setup\/.*\.spec\.ts/` is specific enough to avoid false positives
- This pattern excludes only `.spec.ts` files in the `tests/setup/` directory
- Other files in setup directory remain unaffected
- This establishes a clear convention: Vitest unit tests use `.spec.ts` suffix in setup directory

**Related Context**:
- Commit 426546f43 introduced the problematic Vitest test file
- Issues #1684 and #1691 were the precursor fixes that prompted this change
- The health check utility (`supabase-health.ts`) is correct; only the test file location/discovery is problematic
- The Playwright config already has similar exclusion patterns for `.setup.ts` files

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1694*
