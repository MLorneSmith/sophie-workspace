# Bug Diagnosis: Intentional Test Failures Causing CI False Negatives in Shard 6

**ID**: ISSUE-20251119-intentional-test-shard
**Created**: 2025-11-19T14:30:00Z
**Reporter**: Claude Code Diagnosis System
**Severity**: high
**Status**: new
**Type**: configuration

## Summary

The test suite includes intentional failure tests (`test-configuration-verification.spec.ts`) in **Shard 6** alongside real tests (`healthcheck.spec.ts`). When these intentional failures execute, the entire shard fails with `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, causing the CI workflow (`e2e-sharded.yml`) to mark Shard 6 as a false negative. This causes:

1. **False failure signal** - Developers see "E2E tests failed" when only config verification tests failed
2. **Confusing CI reports** - No distinction between real failures and intentional verification failures
3. **Workflow blockage** - `fail-fast: false` allows other shards to run, but the overall result is "failed"
4. **Maintenance burden** - Developers must manually inspect logs to determine if real tests actually failed

## Environment

- **Application Version**: 1.0.0
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: v20.x (per e2e-sharded.yml)
- **Package**: web-e2e@1.0.0
- **Last Tested**: 2025-11-19
- **Branch**: dev
- **Last Commit**: 7a7d6531 "test: update test execution reports for 2025-11-18"

## Reproduction Steps

1. Run the full E2E test suite locally: `cd apps/e2e && pnpm playwright test`
2. Observe Shard 6 execution: `pnpm test:shard6`
3. See 3 intentional failures from `test-configuration-verification.spec.ts`
4. See overall result: ❌ FAILED with `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`
5. In CI, check `.github/workflows/e2e-sharded.yml` - Shard 6 reports as failed

**OR trigger via CI:**

1. Create a PR or push to dev branch
2. GitHub Actions runs E2E tests (e2e-sharded.yml)
3. Shard 6 executes: 9 passed, 3 failed (intentional)
4. Entire workflow reports as "failed"

## Expected Behavior

- Configuration verification tests should run without blocking the overall test result
- Real test failures should be clearly distinguished from intentional verification failures
- CI reports should accurately reflect whether actual functionality tests passed
- Developers should not need to manually inspect logs to understand test results

## Actual Behavior

- Shard 6 always fails because it contains 3 intentional failures in `test-configuration-verification.spec.ts`
- Playwright exits with non-zero status (failures detected)
- pnpm propagates this as `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`
- GitHub Actions marks the entire shard job as failed
- CI report shows ❌ even though real tests (healthcheck, auth, etc.) passed
- Developers must read detailed logs to confirm: "3 failed (intentional) ✓, 9 passed ✓"

## Diagnostic Data

### Test Output from Recent Run

```
> web-e2e@1.0.0 test:shard6 /home/msmith/projects/2025slideheroes/apps/e2e
> playwright test tests/test-configuration-verification.spec.ts tests/healthcheck.spec.ts -- --reporter=dot --retries=0

3 failed
  9 passed (6.7s)

ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard6: `playwright test tests/test-configuration-verification.spec.ts tests/healthcheck.spec.ts -- --reporter=dot --retries=0`
Exit status 1
```

### Failed Tests (Intentional)

From `/tmp/test-output.log`:
```
  1) [chromium] › tests/test-configuration-verification.spec.ts:17:6 › Test 2: Intentional FAILURE
     Error: expect(received).toBe(expected) // Object.is equality

  2) [chromium] › tests/test-configuration-verification.spec.ts:25:6 › Test 4: Another intentional FAILURE
     Error: This test throws an error intentionally

  3) [chromium] › tests/test-configuration-verification.spec.ts:38:7 › Test 7: Nested intentional FAILURE
     Error: expect(received).toBe(expected) // Object.is equality
```

### Shard Configuration

From `apps/e2e/package.json` (line 27):
```json
"test:shard6": "playwright test tests/test-configuration-verification.spec.ts tests/healthcheck.spec.ts"
```

This command includes:
- **Configuration verification file** (`test-configuration-verification.spec.ts`) - Contains 3 intentional failures for testing framework configuration
- **Real health check tests** (`healthcheck.spec.ts`) - Actual functional tests that should pass

### Test File Analysis

From `apps/e2e/tests/test-configuration-verification.spec.ts`:
```typescript
/**
 * Test file to verify that Playwright continues running all tests despite failures.
 * This file contains intentional failures to test the configuration from Issue #275.
 *
 * Expected behavior: ALL 11 tests should run, regardless of failures.
 * - 8 tests should PASS
 * - 3 tests should FAIL (intentionally - Tests 2, 4, and 7)
 */

test("Test 2: Intentional FAILURE", async () => {
  expect(true).toBe(false); // This will fail
});

test("Test 4: Another intentional FAILURE", async () => {
  throw new Error("This test throws an error intentionally");
});

test("Test 7: Nested intentional FAILURE", async () => {
  expect("fail").toBe("pass"); // This will fail
});
```

**Purpose**: These are verification tests to ensure the test framework continues executing even when tests fail (Issue #275).

### CI Workflow Configuration

From `.github/workflows/e2e-sharded.yml` (lines 175-182):
```yaml
- name: Run E2E tests for shard ${{ matrix.shard }}
  run: |
    echo "🚀 Running E2E test shard ${{ matrix.shard }} of 9"
    pnpm --filter web-e2e test:shard${{ matrix.shard }}
  timeout-minutes: 15
  continue-on-error: false
```

**Issue**: `continue-on-error: false` means any test failure (including intentional ones) fails the shard job.

Shard matrix includes all 9 shards including shard 6:
```yaml
matrix:
  shard: [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

All other shards (1-5, 7-9) contain only real tests and pass cleanly.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Configuration verification tests with intentional failures are bundled with real tests in the same shard, causing the entire shard to be marked as failed in CI, despite real tests passing.

**Detailed Explanation**:

The root cause has three components:

1. **Test File Co-location Issue** (Primary):
   - `test-configuration-verification.spec.ts` and `healthcheck.spec.ts` are defined in the same shard (Shard 6)
   - Playwright executes both files as a single test group
   - When verification file's intentional failures occur, Playwright marks the entire shard as failed
   - Exit code is non-zero (failure detected)

2. **CI Exit Code Handling** (Secondary):
   - `apps/e2e/package.json` line 27: `test:shard6` runs both files in one command
   - Playwright's exit behavior: exits with non-zero code if ANY test fails
   - pnpm propagates this exit code as `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`
   - GitHub Actions CI marks the step as failed: `continue-on-error: false`

3. **Lack of Test Filtering** (Contributing):
   - No mechanism to exclude intentional failures from overall pass/fail metrics
   - No separate reporter for configuration tests
   - No test tags to filter out verification tests in CI reporting

**Code References**:
- **Shard definition**: `apps/e2e/package.json:27`
- **Test file**: `apps/e2e/tests/test-configuration-verification.spec.ts:1-81` (contains intentional failures)
- **CI configuration**: `.github/workflows/e2e-sharded.yml:175-182` (no filtering/exclusion logic)
- **E2E runner**: `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (treats all shard failures equally)

### How This Causes the Observed Behavior

```
User runs: pnpm test:shard6
  ↓
Playwright executes 2 files:
  1. test-configuration-verification.spec.ts (11 tests: 8 pass, 3 fail INTENTIONALLY)
  2. healthcheck.spec.ts (tests pass)
  ↓
Playwright sees: 3 failures + 9 passes
  ↓
Playwright exits with code: 1 (indicates failures exist)
  ↓
pnpm propagates: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
  ↓
CI (GitHub Actions) sees: non-zero exit code
  ↓
CI marks shard job: FAILED ❌
  ↓
Developers see: "E2E tests failed"
  ↓
Must manually inspect logs to find: "3 failed (intentional) but real tests passed"
```

### Confidence Level

**Confidence**: High (95%)

**Reasoning**:
- ✅ Direct evidence: Shard 6 always fails with same 3 test names in every run
- ✅ Root cause clearly identified: Intentional test failures in shared shard
- ✅ CI configuration reviewed: No filtering or exclusion mechanism
- ✅ Test file purpose documented: Comments explicitly state tests are intentional failures
- ✅ Exit code flow traced: Playwright → pnpm → GitHub Actions verified
- ✅ Reproducible: Issue occurs in every test run (deterministic, not flaky)

Not 100% confidence only because there's a theoretical possibility of some other mechanism affecting shard 6 specifically, but evidence strongly points to the intentional failures as the root cause.

## Fix Approach (High-Level)

Move the intentional test failures to a **separate, isolated shard (Shard 11)** that is **not part of the CI failure reporting**. This approach:

1. Keeps configuration verification tests for local development
2. Removes false negatives from CI results
3. Allows the shard to fail without blocking the workflow
4. Preserves the ability to test framework configuration

Alternative approaches:
- Use `@skip` tag to disable verification tests in CI
- Create custom reporter that excludes these tests from exit code calculation
- Rename and reorganize as a separate test type (e.g., `tests/internal/configuration-verification.spec.ts`)

## Diagnosis Determination

**Root Cause Confirmed**: Configuration verification tests with intentional failures are executed in Shard 6 alongside real tests, causing the entire shard to report as failed in CI despite real tests passing.

**The issue is deterministic and reproducible**: Shard 6 fails in every run because `test-configuration-verification.spec.ts` always has 3 intentional failures.

**No information gaps**: All relevant code, configuration, and test data has been analyzed and verified.

## Additional Context

### Issue History

- **Issue #275**: Original issue that prompted creation of `test-configuration-verification.spec.ts` to verify Playwright continues executing tests despite failures
- **Purpose**: Ensure framework configuration allows tests to continue running after failures (which it does - 8/11 tests in that file pass)

### Impact Assessment

- **Frequency**: Every test run (deterministic)
- **Severity**: High - blocks accurate understanding of test results in CI
- **Blast Radius**: Affects Shard 6 only, but Shard 6 failure marks entire E2E test job as failed in some CI configurations
- **User Impact**: Developers see false failures, must investigate logs to confirm real tests passed

### Recommendation

Implement the "separate shard" approach as it:
- Is the cleanest solution
- Preserves test functionality
- Doesn't require complex reporter changes
- Keeps configuration verification in the suite without blocking CI reporting

---
*Generated by Claude Diagnosis Assistant on 2025-11-19*
*Tools Used: GitHub CLI, file analysis, test output parsing, CI workflow inspection*
*Confidence Level: High (95%)*
