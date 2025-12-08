# Bug Fix: E2E Test Infrastructure Systemic Architecture Problems

**Related Diagnosis**: #991 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: complex

## Quick Reference

- **Root Cause**: Five interconnected architectural problems causing cascading test failures instead of isolated bugs
- **Fix Approach**: Phase 1 (Stabilization): Remove aggressive process killing and implement JSON reporter; Phase 2 (Architecture): API-based auth, decouple global setup, add health checks
- **Estimated Effort**: large
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test infrastructure exhibits systemic failures across issues #974, #977, #981, #984, #985, #987, #989, #990. Previous "fixes" treated symptoms by incrementally increasing timeouts (5s → 15s), but failures persist. Root cause analysis revealed 5 interconnected architectural problems:

1. **Auth Timeout Escalation** - UI-based auth through login form instead of API, causing timeouts despite increasing limits
2. **Global Setup Cascading Failures** - Monolithic setup fails for one user type, cascades to all 24+ tests needing that state
3. **Aggressive Timeout Killing** - Test runner kills processes on ANY timeout message, destabilizing Next.js server with `net::ERR_EMPTY_RESPONSE`
4. **Payload Auth State Mismatch** - Tests depend on external Payload server state with no isolation
5. **Flaky Test Result Parsing** - Fragile stdout string parsing reports "0 tests" when tests actually ran

For full details, see diagnosis issue #991.

### Solution Approaches Considered

#### Option 1: Incremental Timeout Increases + Minor Fixes ⭐ LIKELY EXPECTED BUT NOT RECOMMENDED

**Description**: Continue the pattern of increasing timeouts, add minor improvements to parser

**Pros**:
- Minimal immediate changes to existing code
- Tests might pass for a few days
- Low disruption to current workflows

**Cons**:
- Same pattern as #987-990 that didn't work
- Root causes remain unaddressed
- Failures will inevitably return as system grows
- Wasting engineering time on temporary band-aids

**Risk Assessment**: high - Will fail again within days

**Complexity**: simple but ineffective

#### Option 2: Emergency Stabilization + Phased Architecture Overhaul ⭐ RECOMMENDED

**Description**: Immediate fixes to stabilize CI (Phase 1: 4-6 hours), then methodical architecture improvements (Phase 2: 2-3 days)

**Phase 1 (Stabilization - 4-6 hours)**:
- Remove aggressive process killing - let Playwright retry mechanism work
- Replace fragile stdout parsing with JSON reporter
- Add server health checks before each shard
- Set reasonable timeout ceiling (cap at 30s max, not 15s→∞)

**Phase 2 (Architecture - 2-3 days)**:
- API-based auth in global setup using Supabase client directly
- Decouple Payload auth from Supabase auth setup
- Implement test isolation with afterEach cleanup
- Health check gates for dependent services

**Pros**:
- Phase 1 stabilizes CI within hours, immediate ROI
- Phase 2 addresses root causes systematically
- Eliminates future recurring failures
- Provides framework for maintaining test reliability
- Isolates problems (if Payload fails, Supabase tests still run)
- Measurable improvements at each phase

**Cons**:
- More upfront engineering effort (Phase 1+2)
- Requires careful execution to avoid regressions
- Need to validate each phase before proceeding

**Risk Assessment**: medium - Well-defined phases with rollback options at each step

**Complexity**: complex but necessary and sustainable

#### Option 3: Complete Rewrite from Scratch

**Description**: Start over with new Playwright setup, ignore existing test code

**Pros**:
- Theoretically clean slate

**Cons**:
- Loses all existing test coverage (200+ tests)
- Extremely high risk - months of rework
- No business value during transition
- Unnecessary waste of existing test infrastructure

**Why Not Chosen**: Option 2 achieves similar benefits with 10x less risk and maintains existing test value

### Selected Solution: Option 2 - Emergency Stabilization + Phased Architecture Overhaul

**Justification**:

This approach provides immediate stability (Phase 1) while systematically addressing root causes (Phase 2). The phased approach allows us to:
1. Stop firefighting within hours (Phase 1 prevents process killing + parsing errors)
2. Validate improvements without major disruption (Phase 1 only)
3. Incrementally improve architecture (Phase 2 changes one layer at a time)
4. Maintain test coverage throughout (never lose existing tests)
5. Rollback safely if needed at phase boundaries

This is fundamentally different from Option 1 (which failed 4 times) and more practical than Option 3 (full rewrite).

**Technical Approach**:

**Phase 1 - Stabilization** (4-6 hours):
1. Replace process killing logic with graceful Playwright retries
2. Implement JSON reporter instead of stdout parsing
3. Add health check gates for Supabase + Next.js + Payload
4. Cap timeouts at 30s max (prevent endless escalation)

**Phase 2 - Architecture** (2-3 days):
1. Auth via Supabase API directly (eliminates UI form bottleneck)
2. Split global setup by auth type with independent failures
3. Add per-test cleanup to isolate state
4. Add health check validation before each shard

**Architecture Changes** (if any):

- **Global Setup**: Add retry logic for auth failures with independent recovery per user type
- **Test Runner**: Replace stdout parsing with structured JSON output
- **Process Management**: Remove aggressive killing, rely on Playwright's timeout + retry mechanism
- **Health Checks**: New utilities to validate server health before test execution

**Migration Strategy** (if needed):

- Phase 1: In-place modifications, backward compatible
- Phase 2: Global setup refactoring is internal, no test code changes
- No database migrations or schema changes required
- Existing tests continue to run unchanged

## Implementation Plan

### Affected Files

**Core Infrastructure Files**:
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (lines 1164-1187) - Remove aggressive process killing, implement JSON reporter
- `apps/e2e/global-setup.ts` - API-based auth, independent auth state setup, health checks
- `apps/e2e/tests/authentication/auth.po.ts` - Remove UI-based auth, add API-based auth helpers
- `apps/e2e/tests/utils/test-config.ts` - Review timeout config, set reasonable limits

**Supporting Files**:
- `apps/e2e/playwright.config.ts` - Verify reporter configuration, add health checks
- `apps/e2e/tests/utils/` - Add health check utilities (new file)
- `apps/e2e/tests/utils/e2e-validation.ts` - Expand validation checks

### New Files

If new files are needed:
- `apps/e2e/tests/utils/server-health-check.ts` - Health check utilities for Supabase, Next.js, Payload
- Possibly: `apps/e2e/global-setup-v2.ts` as backup during Phase 2 refactoring

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order, top to bottom. Phase 1 and Phase 2 are sequential phases - Phase 1 must stabilize before starting Phase 2.

#### Phase 1: Emergency Stabilization (4-6 hours)

#### Step 1.1: Analyze and Document Process Killing Logic

Examine the current aggressive process killing implementation:

- Read `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` lines 1164-1187
- Understand the condition that triggers killing (any "timeout" message in output)
- Document all places where processes are killed
- Identify what "timeout messages" trigger the killing (too broad?)

**Why this step first**: Must understand exactly what we're removing before removing it

#### Step 1.2: Remove Aggressive Process Killing

Replace the aggressive killing logic with graceful retry:

- Comment out or remove the lines that call `kill()` on timeout messages
- Replace with: Log the timeout and let Playwright's retry mechanism handle it
- Verify that Playwright config already has `retries: 1` and proper timeout settings
- Keep process cleanup for intentional shutdown, remove timeout-triggered cleanup

**Expected behavior after**:
- Server stays alive during test execution
- Tests use Playwright's built-in retry (1 attempt max)
- No `net::ERR_EMPTY_RESPONSE` from aggressive killing
- Timeout messages logged but not triggering process termination

#### Step 1.3: Implement JSON Reporter

Replace fragile stdout parsing with structured JSON output:

- Add `--reporter=json` to playwright command in test runner
- Create JSON parser that reads Playwright's JSON report output
- Extract: total tests, passed, failed, skipped from JSON (not stdout string matching)
- Output shard results using JSON structure instead of string parsing
- Handle JSON parsing errors gracefully with fallback to "unknown"

**Expected behavior after**:
- Reports accurately show "120 tests" instead of "0 tests"
- No more string-match failures on timeout messages
- Reliable shard completion detection

#### Step 1.4: Add Basic Health Checks (Pre-Execution)

Create health check utilities:

- Create `apps/e2e/tests/utils/server-health-check.ts` with functions:
  - `checkSupabaseHealth()` - Simple GET to Supabase health endpoint
  - `checkNextJsHealth()` - GET to application baseURL, check for 200/3xx
  - `checkPayloadHealth()` (optional for Phase 2) - GET to Payload admin URL
- Add logging: "✅ Supabase healthy", "❌ Supabase unhealthy - cannot proceed"
- Make health checks async, timeout after 5 seconds per check
- Don't fail on first health check (warning only, let tests attempt anyway)

**Expected behavior after**:
- Test runner logs server health before each shard
- Early warning if infrastructure is unhealthy
- Basis for Phase 2 gate-based skipping

#### Step 1.5: Cap Timeout Escalation

Set reasonable timeout limits:

- Review `apps/e2e/tests/utils/test-config.ts` and `playwright.config.ts`
- Ensure auth timeout is set to maximum 15s (not 30s or higher)
- Add comment: "DO NOT increase this further - root cause is UI-based auth, not timeout"
- Verify: `navigationTimeout`, `timeout`, and `expect.timeout` are documented with their purpose

**Expected behavior after**:
- Clear policy: no more timeout increases
- Prevents future similar escalations

#### Step 1.6: Validate Phase 1 Changes

Test that Phase 1 stabilization works:

- Run `pnpm test:e2e --shard=1/12` locally (smoke test shard)
- Verify:
  - Process doesn't crash after timeout
  - JSON report shows correct test counts
  - Health checks run and report status
  - All tests complete (don't hang)
- Run full test suite on CI simulation (or single shard)
- Check logs: no "aggressively killing" messages, only health checks and test results

**Success criteria for Phase 1**:
- Shard completes successfully
- Test counts are accurate in reports
- No unexpected process crashes
- Health checks run without blocking tests

---

#### Phase 2: Architecture Improvements (2-3 days) - *Start only after Phase 1 validated*

#### Step 2.1: Implement API-Based Authentication in Global Setup

Replace UI-based login in `apps/e2e/global-setup.ts`:

- Currently: Uses Playwright to navigate login form, fill email/password, click submit
- Change to: Use Supabase JavaScript client directly to authenticate
- Code pattern:
  ```typescript
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  ```

- Benefits:
  - 3-5x faster (API call vs. browser UI automation)
  - No flakiness from UI timing issues
  - Direct validation of auth credentials
  - Works even if UI is broken

**Expected behavior after**:
- Global setup completes in <5 seconds per user (vs. current ~15-20s)
- Authentication never times out (API-based, not UI-dependent)
- Consistent auth state across all test runs

#### Step 2.2: Decouple Payload Auth from Supabase Auth Setup

Separate auth setup by service:

- Create separate initialization functions:
  - `createSupabaseAuthStates()` - Only Supabase API auth (required)
  - `createPayloadAuthStates()` (optional) - Only if Payload server is healthy
- Update global setup to:
  1. Create Supabase states (always)
  2. Check Payload health
  3. If healthy: create Payload states; if not: skip with warning
  4. Proceed with tests even if Payload setup fails

- Code pattern:
  ```typescript
  // Create Supabase auth states (required)
  await createSupabaseAuthStates();

  // Create Payload auth states (optional)
  const payloadHealthy = await checkPayloadHealth();
  if (payloadHealthy) {
    await createPayloadAuthStates();
  } else {
    console.warn("⚠️  Payload server unhealthy - skipping Payload auth setup");
  }
  ```

**Expected behavior after**:
- If Supabase works: 100% of tests can run
- If Payload fails: Supabase tests still run, Payload tests skip gracefully
- No cascade failure (one service down ≠ all tests fail)

#### Step 2.3: Add Per-Test State Cleanup

Implement `afterEach()` test cleanup:

- Add to test files (or shared test utility):
  ```typescript
  afterEach(async ({ page }) => {
    // Clear local storage (auth state)
    await page.evaluate(() => localStorage.clear());
    // Clear IndexedDB if used
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const dbs = [];
        const dbRequest = indexedDB.databases();
        dbRequest.then((result) => {
          result.forEach(({ name }) => {
            if (name) indexedDB.deleteDatabase(name);
          });
        });
      });
    });
    // Go to blank page to reset context
    await page.goto('about:blank');
  });
  ```

- Apply to all test files with browser state

**Expected behavior after**:
- Each test starts with clean state (no carryover from previous test)
- Prevents state-based test flakiness
- Tests can run in any order

#### Step 2.4: Add Health Check Gates (Pre-Shard)

Add health check validation before each shard:

- In test runner, before running each shard:
  ```typescript
  const supabaseHealthy = await checkSupabaseHealth();
  const nextJsHealthy = await checkNextJsHealth();

  if (!supabaseHealthy) {
    console.error("❌ Supabase unhealthy - cannot proceed");
    process.exit(1); // Fail fast
  }
  if (!nextJsHealthy) {
    console.warn("⚠️  Next.js unhealthy - tests may fail");
    // Continue but log warning
  }
  ```

- Prevents wasting time on failed infrastructure

**Expected behavior after**:
- Clear diagnostic output before each shard
- Fails fast if critical services down
- Logs health status for debugging

#### Step 2.5: Validate Phase 2 Changes

Comprehensive testing of Phase 2 improvements:

- Run full E2E suite on CI
- Verify:
  - All shards complete successfully
  - Test counts are accurate
  - No Payload-related failures cascade to other tests
  - Performance improved (auth faster, less timeouts)
  - Health checks run and report accurately
- Monitor for 24 hours on actual CI runs
- Check success rate (target: >95%)

**Success criteria for Phase 2**:
- Full test suite passes consistently
- Individual test counts accurate
- No timeout errors
- Auth setup completes in <5 seconds
- Payload failures don't block other tests

---

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Health check utilities return correct status (Supabase up/down, Next.js up/down)
- ✅ JSON reporter correctly parses test counts from Playwright output
- ✅ Process cleanup doesn't kill processes on normal exit
- ✅ Auth state creation via Supabase API succeeds with valid credentials
- ✅ Auth state creation via Supabase API fails with invalid credentials
- ✅ Timeout handling doesn't trigger process killing

**Test files**:
- `apps/e2e/tests/utils/__tests__/server-health-check.spec.ts` - Health check unit tests
- `apps/e2e/tests/utils/__tests__/auth-state-creation.spec.ts` - Auth state creation tests

### Integration Tests

Global setup integration tests:

- Verify global setup creates all required auth states
- Verify Supabase auth states work in actual browser
- Verify Payload auth states work (if Payload available)
- Verify cleanup between setup runs

**Test files**:
- `apps/e2e/global-setup.spec.ts` - Full global setup validation

### E2E Tests

Validate against real E2E test failures:

- Run authentication test suite (should pass with new API-based auth)
- Run smoke tests with all shards
- Run full test suite
- Verify no auth timeouts
- Verify accurate test counts in reports

**Test files**:
- All existing tests in `apps/e2e/tests/` should pass

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run single shard locally: `pnpm test:e2e --shard=1/12` - should complete in <3min
- [ ] Check local log output - should show health checks passing
- [ ] Check test report (JSON or HTML) - should show accurate test counts
- [ ] Run 2-3 shards sequentially - all should pass
- [ ] Simulate server failure: kill Supabase locally, run shard - should fail gracefully with clear message
- [ ] Check CI logs - should show health checks and no "aggressive killing" messages
- [ ] Monitor CI for 24 hours - target: zero E2E test failures
- [ ] Verify performance - auth setup should complete in <5s (not 15-20s)
- [ ] Test in different environment (local vs CI) - results should match

## Risk Assessment

**Overall Risk Level**: medium

Mitigations at each phase boundary allow us to proceed carefully without committing fully upfront.

**Potential Risks**:

1. **Risk: Phase 1 changes break existing test infrastructure**
   - **Likelihood**: medium (removing process killing is invasive)
   - **Impact**: high (all tests fail until reverted)
   - **Mitigation**:
     - Run Phase 1 on isolated branch first
     - Validate with single shard before full CI
     - Keep backup of original e2e-test-runner.cjs
     - Easy rollback: revert Phase 1 commits

2. **Risk: API-based auth in Phase 2 loses test coverage of actual UI login flow**
   - **Likelihood**: low (global setup is setup, not the actual test)
   - **Impact**: medium (won't catch UI auth flow bugs)
   - **Mitigation**:
     - Keep at least one authentication test that goes through UI flow
     - This test validates actual user experience
     - Global setup using API is acceptable (it's test infrastructure, not product)

3. **Risk: Health checks become bottleneck**
   - **Likelihood**: low (health checks are simple pings)
   - **Impact**: low (adds <1s per shard)
   - **Mitigation**:
     - Cache health check results for short duration
     - Skip health checks locally (too noisy during development)
     - Keep timeout short (5s max)

4. **Risk: Payload integration tests fail without Payload auth setup**
   - **Likelihood**: medium (Payload may be down during testing)
   - **Impact**: low (only Payload-specific tests affected)
   - **Mitigation**:
     - Mark Payload tests with `@skip` or `@requires-payload`
     - Document that Payload tests require Payload running
     - CI should handle: if Payload down, skip those tests

5. **Risk: Per-test cleanup (afterEach) doesn't clear all state**
   - **Likelihood**: low (clearing localStorage/IndexedDB is standard)
   - **Impact**: low (single test failures, not cascade)
   - **Mitigation**:
     - Run tests in isolation to validate cleanup works
     - Monitor for flaky tests post-deployment
     - Add additional cleanup for discovered state

**Rollback Plan**:

If this fix causes issues in production:

1. **Rollback Phase 1 only** (if Phase 2 not deployed):
   - Restore backup of e2e-test-runner.cjs from before Phase 1
   - Revert global setup changes (minimal in Phase 1)
   - Restart CI
   - Expected: Back to pre-fix state within 30 minutes

2. **Rollback Phase 2 only** (if deployed):
   - Revert global-setup.ts to Phase 1 version
   - Keep Phase 1 process killing removal (necessary for stability)
   - Tests may timeout but won't cascade fail
   - Expected: Reduced functionality but stable within 30 minutes

3. **Full rollback**:
   - Revert both phases completely
   - Back to current state
   - Expected: System operational within 1 hour

**Monitoring** (if needed):

- Monitor test success rate in CI (target: >95%)
- Monitor auth setup time (target: <5 seconds per shard)
- Monitor timeout errors (target: <5% of runs)
- Monitor process crashes (target: 0 unexpected crashes)
- Alert on: Any shard with >10% failure rate, auth timeout >10s, process crash

## Performance Impact

**Expected Impact**: significant improvement

**Before fix**:
- Auth setup: 15-20 seconds per shard (UI-based, with timeouts)
- Frequent timeouts causing retries and delays
- Failed shards due to process crashes
- Reporting delays due to stdout parsing

**After fix**:
- Auth setup: <5 seconds per shard (API-based, direct)
- No auth timeouts
- Stable process execution
- Immediate accurate reporting

**Performance Testing**:
- Measure auth setup time before/after Phase 1
- Measure full test suite execution time before/after Phase 2
- Target: 30% reduction in total test execution time

## Security Considerations

**No significant security implications**:

- Authentication method change (UI → API) is internal test infrastructure only
- No changes to production authentication code
- API-based auth uses same Supabase credentials as UI-based auth
- Payload auth already uses API under the hood
- Test data remains isolated in test database

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

Run a single E2E shard and observe the failures:

```bash
# Run single shard to see current failures
pnpm --filter e2e test:shard1

# Check for errors in output:
# - "timeout" in logs followed by process killing
# - "0 tests" reported but tests actually ran
# - Auth timeout errors
# - net::ERR_EMPTY_RESPONSE errors
```

**Expected Result**: One or more test failures, possibly showing:
- Auth timeout errors
- Test runner reporting 0 tests passed
- Process crashes in logs
- Slow auth setup (15+ seconds)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Test the infrastructure scripts (if unit tests added)
pnpm --filter e2e test:unit -- tests/utils/__tests__/server-health-check.spec.ts

# E2E tests - Phase 1 validation
pnpm --filter e2e test:shard1

# E2E tests - full suite
pnpm test:e2e

# Manual verification - check logs for:
pnpm --filter e2e test:shard1 2>&1 | grep -E "(✅|❌|Auth|Health)"

# Check report for accurate test counts
cat reports/testing/latest/execution-summary.json | jq '.shards[].results.total'
```

**Expected Result**:
- All commands succeed
- Shard 1 completes without errors
- Test counts are accurate in reports
- No timeout errors in logs
- Auth setup logs show <5 second completion
- Full test suite passes

### Regression Prevention

```bash
# Run full test suite multiple times to ensure stability
for i in {1..3}; do
  echo "Run $i..."
  pnpm test:e2e --reporter=json > reports/run-$i.json
  jq '.stats.expected' reports/run-$i.json
done

# Verify all runs report same test counts (no 0 tests errors)
# Verify no process crash messages in any run
# Verify all runs complete successfully
```

## Dependencies

### New Dependencies (if any)

No new npm/pnpm dependencies required.

**Tools/Utilities used**:
- Supabase JavaScript client (already in use)
- Playwright (already in use)
- Node.js fs/path modules (standard library)

**Dependencies added**: None

### Existing Dependencies

This fix relies on existing infrastructure:
- Supabase auth API (working correctly)
- Next.js application (working correctly)
- Payload CMS (optional, can be down)
- Playwright test runner (version 1.45+)

## Database Changes

**No database changes required**.

This fix is entirely in test infrastructure, not production code.

- No schema changes
- No migrations needed
- No data migrations
- Test data remains unchanged

## Deployment Considerations

**Deployment Risk**: low

This is test infrastructure only - no production code changes.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained
- Changes to test runner are internal only
- Existing tests continue to work unchanged
- Phase 1 removes problematic code (improvement, not addition)
- Phase 2 improves global setup without breaking tests

**Rollback strategy**: Simple git revert (see Risk Assessment section)

## Success Criteria

The fix is complete when:
- [ ] Phase 1 changes reduce aggressive process killing to zero
- [ ] JSON reporter accurately reports test counts (no "0 tests" errors)
- [ ] Health checks run and report status correctly
- [ ] Shard 1 completes successfully in <3 minutes
- [ ] All validation commands pass
- [ ] Full test suite runs with >95% success rate
- [ ] Auth setup completes in <5 seconds (Phase 2)
- [ ] No Payload failures cascade to other tests (Phase 2)
- [ ] Tests have clean state isolation (Phase 2)
- [ ] Zero unexpected process crashes
- [ ] No regression in test coverage or accuracy

## Notes

**Why This Fix Is Different From Previous Attempts**:

Previous "fixes" (#987-990) treated symptoms by increasing timeouts. This fix addresses root causes:

| Issue | Previous "Fix" | This Fix | Result |
|-------|-----------------|----------|--------|
| #987-990 | Increase timeout 5s→15s | Remove timeout-triggered killing | Tests don't hang after timeout |
| #985 | Make Payload optional | Split Supabase/Payload auth setup | Payload down ≠ all tests down |
| #977 | Add pattern to parser | Implement JSON reporter | Accurate test count reporting |
| Systemic | Incremental band-aids | Architecture redesign | Sustainable, prevents future failures |

**Why API-Based Auth**:

The current UI-based auth in `loginAsUser()` goes through:
1. Navigate to login page (slow, network dependent)
2. Fill email field (prone to timing issues)
3. Fill password field (prone to timing issues)
4. Click submit button (prone to timing issues)
5. Wait for redirect (slow, dependent on server)
6. Total: 10-20 seconds, very flaky

API-based auth via Supabase client:
1. Call `signInWithPassword()` API directly
2. Get session back
3. Inject into localStorage
4. Total: <1 second, deterministic

**This is not testing the UI** - that's what the actual authentication tests do. The global setup is test infrastructure, similar to database setup - it should be fast and reliable.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #991*
