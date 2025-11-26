# Bug Fix: E2E Test Failures - Three Root Causes

**Related Diagnosis**: #682 (REQUIRED)
**Severity**: high
**Bug Type**: regression, integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Three distinct issues: (1) Payload CLI path hardcoded to non-existent `dist/` directory, (2) Playwright payment selector timeout in billing tests, (3) Supabase PostgreSQL connection/environment checks missing for E2E setup
- **Fix Approach**: (1) Update test CLI path to use `tsx` directly like npm scripts do, (2) Add wait conditions and increase timeout for Stripe iframe, (3) Add pre-flight database and environment validation to E2E setup
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E test suite shows 166 failures (46.1% failure rate) across 142 tests:
- **46 tests fail**: Payload CMS Extended - Tests hardcode path to `apps/payload/dist/seed/cli/index.js` which doesn't exist
- **31 tests fail**: Payload CMS - PostgreSQL connection refused (127.0.0.1:54322) or production environment check
- **2 tests fail**: Billing (User/Team) - Playwright selector timeout on payment element

Investigation revealed this is NOT a regression—the tests were written expecting compiled CLI output that was never built. The codebase uses `tsx` for in-memory transpilation instead.

For full details, see diagnosis issue #682.

### Solution Approaches Considered

#### Option 1: Export Compiled Payload CLI to dist/seed/cli/ ⚠️ NOT RECOMMENDED

**Description**: Build Payload seed-engine to compiled JavaScript and export to `apps/payload/dist/seed/cli/index.js`

**Pros**:
- Maintains current test approach without changes
- Could enable additional build-time optimizations

**Cons**:
- Requires new build script in Payload package
- Adds unnecessary build complexity
- Diverges from project's `tsx` pattern (used everywhere else)
- More maintenance burden
- Slower iteration during development

**Why Not Chosen**: Project already has a working `tsx` pattern in npm scripts (`seed:run`, `seed:dry`). Building a separate CLI distribution adds complexity when the simpler solution is to align tests with existing patterns.

#### Option 2: Update Tests to Use tsx (Direct Approach) ⭐ RECOMMENDED

**Description**: Update test files to use `pnpm tsx` instead of hardcoded `dist/seed/cli/index.js` path. This aligns with how npm scripts actually invoke the CLI.

**Pros**:
- Minimal code changes (1-2 lines per test file)
- Aligns with existing project patterns
- No new build steps required
- Uses the same approach as `package.json` scripts
- Lower maintenance burden
- Faster iteration

**Cons**:
- Tests now invoke via npm instead of direct Node

**Risk Assessment**: low - This is how the CLI is actually invoked in production scripts

**Complexity**: simple - Straightforward string replacement

#### Option 3: Create Minimal TypeScript Build Configuration

**Description**: Add a minimal `tsconfig.json` to `apps/payload/src/seed/seed-engine/` and build step

**Pros**:
- Could enable future CLI distribution

**Cons**:
- Unnecessary complexity
- More maintenance overhead
- Doesn't match project patterns

**Why Not Chosen**: Over-engineering. The `tsx` approach is simpler and already works.

### Selected Solution: Update Tests to Use tsx (Option 2)

**Justification**: This approach is the most pragmatic. The investigation revealed the tests were written incorrectly from the start—they expected a compiled CLI that was never built. The project uses `tsx` for TypeScript execution everywhere (seed scripts, CLI tools), so the tests should do the same. This is a 1-2 line fix per test file with zero architectural impact.

**Technical Approach**:

1. **Root Cause Analysis** (completed in diagnosis):
   - `apps/payload/dist/seed/cli/` directory never existed
   - No build script or tsconfig exists for compiling seed-engine
   - Tests were written expecting compiled output that was never created
   - `package.json` scripts use `tsx` (in-memory transpilation) which actually works

2. **Fix Implementation**:
   - Replace hardcoded paths in `apps/e2e/tests/payload/seeding.spec.ts` (line 25) and related files
   - Use `pnpm tsx` to execute TypeScript directly (same as npm scripts)
   - Add validation to ensure Supabase is running before Payload tests execute
   - Add proper wait conditions for Stripe payment element rendering

3. **Architecture Changes**: None - This aligns with existing patterns

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/seeding.spec.ts` (line 25) - Hardcoded CLI path, Payload environment checks missing
- `apps/e2e/tests/billing/user-billing.spec.ts` - Payment selector timeout
- `apps/e2e/tests/billing/team-billing.spec.ts` - Payment selector timeout
- `apps/e2e/global-setup.ts` - Add E2E environment pre-flight checks (NEW)
- `apps/e2e/tests/helpers/e2e-validation.ts` - Add validation utilities (NEW, optional)

### New Files

- None (minimal approach - fix existing files)

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add E2E Environment Pre-flight Validation

Create utilities to verify Supabase is running and E2E environment is properly configured.

- Create validation helper to check Supabase PostgreSQL connectivity
- Verify `NODE_ENV` is set to 'test' in E2E tests
- Add diagnostic logging if checks fail
- Create reusable validation utilities in E2E helpers

**Why this step first**: Prevents test failures due to missing infrastructure, makes root causes obvious

#### Step 2: Fix Payload CLI Path in Seeding Tests

Update `apps/e2e/tests/payload/seeding.spec.ts` to use `tsx` instead of hardcoded `dist/` path.

- Replace `"apps/payload/dist/seed/cli/index.js"` with `"apps/payload/src/seed/seed-engine/index.ts"`
- Update command execution to use `pnpm tsx` instead of `node`
- Add Supabase connectivity check before running Payload seeding
- Verify CLI paths and file existence with proper error messages

**Example transformation**:
```typescript
// BEFORE (broken)
const CLI_PATH = "apps/payload/dist/seed/cli/index.js";
await execAsync(`node ${CLI_PATH} seed --dry-run`);

// AFTER (working)
const CLI_PATH = "apps/payload/src/seed/seed-engine/index.ts";
await execAsync(`pnpm tsx ${CLI_PATH} --dry-run`);
```

#### Step 3: Fix Playwright Billing Selector Timeouts

Update billing tests to handle late iframe/modal rendering with proper wait conditions.

- Add explicit wait for Stripe payment iframe to load
- Increase selector timeout for payment element visibility check
- Implement retry logic with exponential backoff for payment modal
- Add robust selector strategy for dynamic payment elements

**Example pattern**:
```typescript
// Wait for Stripe iframe to be ready
await page.waitForFunction(
  () => document.querySelector('iframe[title*="Stripe"]') !== null,
  { timeout: 15000 }
);

// Then check visibility
await expect(page.locator('[data-testid="payment-element"]')).toBeVisible({
  timeout: 20000
});
```

#### Step 4: Update Test Data Management for Payload Tests

Ensure E2E test database is properly seeded before Payload tests run.

- Verify test users exist in Supabase before Payload operations
- Add proper cleanup in `afterEach` to prevent test pollution
- Ensure Payload can connect to Supabase (not production safety issue)
- Add logging to help diagnose E2E environment issues

#### Step 5: Add Comprehensive Error Handling and Logging

Improve error messages and diagnostics for test failures.

- Add context to CLI execution errors (show full command and output)
- Log Supabase connection status at test start
- Capture DATABASE_NAME and connection details for debugging
- Create detailed error messages that guide troubleshooting

#### Step 6: Create and Run Validation Tests

Add unit tests to verify the fixes work correctly.

- Test Supabase connectivity validation
- Test Payload CLI execution with tsx
- Test billing selector detection
- Add regression test for original bug

#### Step 7: Run Full Test Suite and Verify

Execute comprehensive testing to confirm all fixes work.

- Run full E2E test suite: `pnpm test:e2e`
- Run specific test shards to verify fixes:
  - Payload CMS tests (46 failures → 0)
  - Payload Extended tests (31 failures → 0)
  - Billing tests (2 failures → 0)
- Verify zero regressions in other test shards
- Check test stability and pass rates

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Supabase connectivity validation
- ✅ CLI path resolution and verification
- ✅ Environment variable validation (NODE_ENV = 'test')
- ✅ Stripe iframe detection logic
- ✅ Error message formatting for diagnostics

**Test files**:
- `apps/e2e/tests/helpers/e2e-validation.spec.ts` - Environment validation tests

### Integration Tests

Payload seeding integration tests:
- ✅ Supabase must be running before test execution
- ✅ Payload CLI executes successfully with tsx
- ✅ Seed data is applied to database
- ✅ Test users are available for E2E tests

**Test files**:
- `apps/e2e/tests/payload/seeding.spec.ts` (updated)

### E2E Tests

Critical user journeys affected by these fixes:
- ✅ Smoke test for E2E environment readiness
- ✅ Payload test data seeding flow
- ✅ User billing checkout (payment element visibility)
- ✅ Team billing checkout (payment element visibility)
- ✅ Multiple test runs without data pollution

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start local Supabase: `pnpm supabase:web:start`
- [ ] Verify PostgreSQL is running: `psql -U postgres -c "SELECT VERSION();"`
- [ ] Reset database with seeding: `pnpm supabase:web:reset`
- [ ] Run Payload tests alone: `pnpm test:e2e -- tests/payload/`
- [ ] Run billing tests alone: `pnpm test:e2e -- tests/billing/`
- [ ] Run full E2E suite: `pnpm test:e2e`
- [ ] Verify no test pollution: Run suite twice, should pass both times
- [ ] Check test logs for proper error messages
- [ ] Verify Payload seed CLI executes correctly: `pnpm tsx apps/payload/src/seed/seed-engine/index.ts --dry-run`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Payload CLI May Have Different Behavior with tsx vs Node**: <2% likelihood
   - **Likelihood**: low
   - **Impact**: medium (would break seeding again)
   - **Mitigation**: Test locally before deploying. Payload scripts use tsx successfully, so this is unlikely.

2. **Supabase Connection Issues in CI Environment**: <5% likelihood
   - **Likelihood**: low
   - **Impact**: high (CI tests would still fail)
   - **Mitigation**: Use existing CI infrastructure. Supabase already runs in CI successfully for other tests.

3. **Stripe Payment Element May Have Race Condition Not Caught by Increased Timeout**: <3% likelihood
   - **Likelihood**: low
   - **Impact**: medium (billing tests still flaky)
   - **Mitigation**: Add explicit iframe wait conditions instead of just increasing timeout. Use `waitForFunction` to poll.

4. **Test Pollution from Improperly Cleaned Up Data**: <2% likelihood
   - **Likelihood**: low
   - **Impact**: medium (sporadic test failures)
   - **Mitigation**: Add proper cleanup in test suite. Tests already use unique data, so this is unlikely.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the tsx path change back to dist/ path (would require building the CLI)
2. Disable Payload tests temporarily while investigating
3. Increase Playwright timeouts further if billing tests still flake
4. Check Supabase/PostgreSQL health if connection errors appear

**Monitoring** (if needed):

- Monitor test pass rates for Payload and billing tests after deployment
- Watch for "PostgreSQL connection refused" errors in CI logs
- Alert if billing test failure rate increases above 5%

## Performance Impact

**Expected Impact**: minimal

Test execution time may improve slightly due to:
- Eliminated network timeouts for missing CLI path (direct execution)
- Faster CLI startup with tsx vs node + dist JS
- Early failure detection with pre-flight checks

Estimated improvement: ~5-10 seconds per test run (negligible at scale)

## Security Considerations

**Security Impact**: none

The fixes:
- Do not expose any secrets or API keys
- Use existing Supabase connection patterns (already secure)
- Do not change authentication mechanisms
- Add validation to prevent unsafe operations

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start local Supabase
pnpm supabase:web:start

# Run Payload tests (should fail with "not found" error)
pnpm test:e2e -- tests/payload/seeding.spec.ts

# Expected Result: 46 failures with "ENOENT" or "dist/seed/cli" not found errors
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (new validation tests)
pnpm test:unit -- e2e-validation

# E2E tests - Payload CMS (should fix 46 failures)
pnpm test:e2e -- tests/payload/seeding.spec.ts

# E2E tests - Billing (should fix 2 failures)
pnpm test:e2e -- tests/billing/

# Full E2E suite
pnpm test:e2e

# Expected Result: All commands succeed, 166 failures → 0, zero regressions.
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific checks for affected systems
pnpm test:e2e -- tests/payload/
pnpm test:e2e -- tests/billing/

# Run twice to verify no test pollution
pnpm test:e2e
pnpm test:e2e

# Expected: Both runs have identical pass rates
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Uses existing `tsx` and Playwright

### Existing Dependencies Used

- `tsx` - Already installed, used in package.json scripts
- `@playwright/test` - Already installed for E2E testing
- `supabase` - Already installed for database connectivity checks

## Database Changes

**No database changes required**

These are test infrastructure fixes, not schema changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - Changes are test-only

**Feature flags needed**: no

**Backwards compatibility**: maintained

Tests will work the same way once fixed. No breaking changes to existing test suite structure or API.

## Success Criteria

The fix is complete when:

- [ ] All 46 Payload seeding tests pass (fixed from 0% → 100%)
- [ ] All 31 Payload CMS environment tests pass (fixed from 0% → 100%)
- [ ] Both billing tests pass (fixed from 0% → 2 passing)
- [ ] Overall E2E pass rate improves from 26% → 95%+
- [ ] All validation commands pass
- [ ] Zero regressions in other test suites
- [ ] Full E2E suite runs in <30 minutes
- [ ] Tests pass consistently on second run (no pollution)
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] CI/CD passes with no test-related failures

## Notes

**Investigation Insights**:
- The Payload CLI was never built for distribution - this was a test writing error, not a codebase regression
- The project uses `tsx` everywhere for TypeScript execution, making it the natural choice
- Payload tests were broken from inception and may never have passed
- Billing test timeouts suggest a timing issue with Stripe iframe initialization, not a logic error

**Related Issues**:
- #662: E2E Tests Failing Due to Unseeded Database
- #661: E2E Test User Account Data Missing
- #657: Auth-Simple Test - Password Provider Not Enabled
- #562: Previous Payload seeding failures (31 tests - same number!)

**Test Execution Context**:
- Full test suite: 360 tests (248 unit + 142 e2e)
- Current pass rate: 194/360 (53.9%)
- Target pass rate: 340+/360 (94%+)
- Average execution time: ~16 minutes for E2E shard
- Total duration with all shards: ~16 minutes (parallel execution with 9 shards)

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #682*
