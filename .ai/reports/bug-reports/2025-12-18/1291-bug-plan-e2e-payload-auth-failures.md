# Bug Fix: E2E Payload Auth Tests Fail - Multiple Root Causes (NODE_ENV, ENOENT, Rendering)

**Related Diagnosis**: #1290
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Three compounding issues - NODE_ENV not set in test controller, execSync ENOENT error in Playwright worker context, Payload CMS login page renders blank
- **Fix Approach**: Set NODE_ENV=test in spawn environment, fix or suppress execSync shell path issues, investigate Payload rendering errors
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Shard 7 (Payload Auth tests) fails with three cascading issues:

1. **NODE_ENV Not Set**: The test controller (`e2e-test-runner.cjs`) spawns Playwright tests without setting `NODE_ENV=test`, causing pre-flight validation to fail
2. **execSync ENOENT Error**: `supabase-config-loader.ts` calls `execSync("npx supabase status --output json")` in Playwright worker context, which fails with `spawnSync /bin/sh ENOENT` because `/bin/sh` doesn't exist in certain environments (Docker workers, older Node versions)
3. **Payload CMS Rendering Failure**: Login page returns HTTP 200 but React fails to hydrate - screenshot shows blank white page with "N 8 Issues" badge, indicating JavaScript initialization errors

### Solution Approaches Considered

#### Option 1: Set NODE_ENV + Use Shell Path Override + Async Config Loading ⭐ RECOMMENDED

**Description**: Fix all three issues comprehensively:
1. Set `NODE_ENV=test` in test controller's spawn environment
2. Use absolute shell path `/bin/bash` instead of `/bin/sh` in execSync calls
3. Implement graceful error handling for execSync with timeout and fallback
4. Investigate Payload rendering by checking Next.js build warnings

**Pros**:
- Fixes root cause of NODE_ENV validation failure immediately
- Solves execSync ENOENT by using more reliable shell path detection
- Maintains backward compatibility with existing config loading
- Minimal code changes, low risk
- All three issues addressed with surgical fixes

**Cons**:
- Requires testing on different environments (Docker, CI, WSL)
- Shell path detection may vary across systems

**Risk Assessment**: low - NODE_ENV setting is standard practice, shell path handling already has fallback

**Complexity**: moderate - three related but distinct fixes needed

#### Option 2: Async Config Loading with Worker-Safe Approach

**Description**: Completely rewrite config loading to be async and worker-safe:
1. Load Supabase config at test setup time (before workers spawn)
2. Pass config via environment variables to worker processes
3. Remove execSync from supabase-config-loader entirely

**Pros**:
- Eliminates ENOENT issue completely (no execSync in workers)
- Cleaner architecture - config loaded once at setup
- Better performance - no repeated shell calls

**Cons**:
- More invasive refactoring
- Requires changes to global-setup.ts and multiple test files
- Higher risk of regressions
- More testing needed

**Why Not Chosen**: Option 1 achieves same goal with less code change and lower risk

#### Option 3: Skip Supabase Config Loader for Payload Tests

**Description**: Use only fallback values for Payload tests, skip dynamic config loading

**Pros**:
- Simplest fix - just skip one function call

**Cons**:
- Ignores root cause
- Payload tests may fail if Supabase port is non-standard
- Masks the underlying issue for other test suites

**Why Not Chosen**: Option 1 fixes the actual problem instead of hiding it

### Selected Solution: Set NODE_ENV + Fix execSync + Investigate Payload Rendering

**Justification**: This approach directly addresses all three root causes with minimal code changes, maintains backward compatibility, and provides clear diagnostic improvements. NODE_ENV fixing unblocks validation, execSync fix unblocks config loading in worker contexts, and Payload investigation identifies UI-layer issues.

**Technical Approach**:

1. **NODE_ENV Setting** (e2e-test-runner.cjs:662-673)
   - Already partially implemented - sets `NODE_ENV: "test"` in web server spawn
   - **Issue**: Payload tests spawn with different command structure
   - **Fix**: Ensure NODE_ENV=test is set for ALL test process spawns

2. **execSync Shell Path** (supabase-config-loader.ts:106)
   - Current: `execSync("npx supabase status --output json", { ... })`
   - **Issue**: Uses implicit `/bin/sh` which may not exist in Playwright workers or some Docker images
   - **Fix**: Use explicit shell path with fallback, or wrap in try-catch with graceful degradation

3. **Payload CMS Rendering** (apps/e2e/tests/payload/payload-auth.spec.ts)
   - **Issue**: Screenshot shows blank page with JavaScript errors
   - **Fix**: Check Next.js build warnings, validate Payload config, check for hydration mismatches

**Architecture Changes** (if any):
- No architectural changes needed - fixes are localized to three files

**Migration Strategy** (if needed):
- None required - changes are backward compatible

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Ensure NODE_ENV=test is set in all spawned test processes
- `apps/e2e/tests/utils/supabase-config-loader.ts` - Fix execSync shell path handling with fallback mechanism
- `apps/e2e/tests/utils/e2e-validation.ts` - Add validation for shell availability (optional improvement)
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Add diagnostic logging for rendering failures

### New Files

None needed - all fixes are localized modifications

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix NODE_ENV Setting in Test Controller

Fix the root cause of validation failure by ensuring NODE_ENV=test is set for all test process spawns.

- Read `e2e-test-runner.cjs` around line 1156-1174 (process spawn section)
- Verify NODE_ENV=test is already set in env object
- If missing, add NODE_ENV: "test" to the env object
- If set, verify it propagates to Playwright subprocess correctly
- Test by running `/test 7` and checking for NODE_ENV validation error

**Why this step first**: Validation failure blocks ALL subsequent test setup - fixing it unblocks the rest of the pipeline

#### Step 2: Fix execSync Shell Path Issue in Supabase Config Loader

Solve the ENOENT error by handling shell path robustly.

- Read `supabase-config-loader.ts` around line 106
- Change execSync call to use explicit shell option
- Add try-catch with graceful fallback to FALLBACK_CONFIG
- Consider: Use `/bin/bash` instead of default shell, or wrap entire call in try-catch
- Approach: `execSync("npx supabase status --output json", { shell: "/bin/bash", ... })`
- Test by running config loader directly in a worker context

**Why this step**: Prevents ENOENT errors from blocking Supabase config initialization

#### Step 3: Add Error Handling for Worker Contexts

Improve robustness by detecting and handling worker context limitations.

- Add check in supabase-config-loader.ts for worker context
- If in worker context, prefer FALLBACK_CONFIG over execSync
- Add console.warn when fallback is used due to worker detection
- Document the limitation in code comments

**Why this step**: Prevents future ENOENT issues in different worker contexts

#### Step 4: Investigate Payload CMS Rendering

Diagnose why Payload login page renders blank.

- Run `/test 7` and capture the failure
- Check for JavaScript errors in test output or screenshots
- Review Payload Next.js build warnings during test server startup
- Check if Payload editor config is loading correctly
- Verify Lexical editor block types are registered

**Why this step**: Addresses the third root cause - blank page rendering

#### Step 5: Add Diagnostic Logging

Improve observability for future debugging.

- Add NODE_ENV log statement in test controller spawn
- Add shell path detection logging in supabase-config-loader
- Add Payload server startup logs to capture build warnings
- Log validation results clearly for each check

**Why this step**: Makes future failures easier to diagnose

#### Step 6: Run Complete Test Suite

Validate that fixes don't introduce regressions.

- Run `/test 7` multiple times to ensure consistency
- Run `/test 1 6 12` (smoke/config tests) to verify no regressions
- Run full test suite if resources allow
- Check that NODE_ENV validation passes
- Verify Payload login form renders and is interactive

**Why this step**: Ensures fixes work and don't break other tests

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ NODE_ENV validation - should pass when NODE_ENV=test
- ✅ Supabase config loading - should use fallback when execSync fails
- ✅ Shell path detection - should handle missing /bin/sh gracefully
- ✅ Error handling - should not crash when npx command fails
- ✅ Fallback config - should be used when CLI unavailable

**Test files**:
- `apps/e2e/tests/utils/supabase-config-loader.test.ts` - Test config loading with various shell environments

### Integration Tests

No additional integration tests needed - E2E tests themselves validate the fixes

### E2E Tests

**Test files**:
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Payload auth should complete successfully

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter web-e2e test:shard7` and verify NODE_ENV validation passes
- [ ] Check that Payload login page renders (not blank white page)
- [ ] Verify Payload login form is interactive and accepts input
- [ ] Test auth flow: enter credentials → click login → redirect to dashboard
- [ ] Verify supabase-config-loader doesn't log ENOENT errors
- [ ] Run shard 7 twice in quick succession - should be consistent both times
- [ ] Test on different environments: Windows WSL, GitHub Actions CI, macOS
- [ ] Check that other test shards (1, 2, 3, etc.) still pass (no regressions)
- [ ] Verify test timeout hasn't changed (shard 7 should complete within 5 minutes)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **NODE_ENV Propagation to Worker Processes**: If worker processes don't inherit parent environment correctly
   - **Likelihood**: low - Node.js spawn() inherits by default
   - **Impact**: medium - test would still fail with NODE_ENV validation error
   - **Mitigation**: Explicitly set NODE_ENV in spawn env object, verify via console.log in Playwright tests

2. **Shell Path Differences Across Environments**: /bin/bash may not exist on some systems
   - **Likelihood**: low - bash is standard on Linux/macOS/WSL
   - **Impact**: low - fallback config provides functional defaults
   - **Mitigation**: Use shell detection to choose between /bin/bash and /bin/sh, with final fallback

3. **Payload Rendering Issues May Be Unrelated**: Blank page could be caused by other factors
   - **Likelihood**: medium - could be config, build, or CSS issue
   - **Impact**: high - if rendering issue persists, tests still fail
   - **Mitigation**: Comprehensive diagnostics in Step 4, may require additional investigation

4. **Backward Compatibility**: Changing spawn env might affect other tests
   - **Likelihood**: low - NODE_ENV=test is appropriate for all test contexts
   - **Impact**: low - other tests may benefit from this fix
   - **Mitigation**: Run full test suite after changes, check for unexpected test behavior

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to e2e-test-runner.cjs (remove NODE_ENV setting if added)
2. Revert changes to supabase-config-loader.ts (remove shell path override)
3. Revert diagnostic logging changes
4. Create new GitHub issue documenting the specific problem encountered
5. Re-run `/test 7` to confirm rollback worked

**Monitoring** (if needed):
- Monitor shard 7 execution time - should remain <5 minutes
- Check for ENOENT errors in test output - should be eliminated
- Track NODE_ENV validation results - should always pass
- Monitor test flakiness - should not increase from fixes

## Performance Impact

**Expected Impact**: minimal

Details:
- NODE_ENV setting has no performance impact (environment variable assignment)
- execSync error handling may add <100ms when fallback is triggered (rare case)
- Diagnostic logging has negligible impact
- Overall test execution time should remain unchanged

**Performance Testing**:
- Run shard 7 five times and measure average execution time
- Compare before/after times to verify no regression
- Check that shell path handling doesn't add measurable overhead

## Security Considerations

**Security Impact**: none

Rationale:
- NODE_ENV=test is appropriate for test environments, not a security issue
- execSync is already being used in config loader with proper error handling
- Fallback to hardcoded demo credentials is acceptable in test environment (not production data)
- No new network calls or privilege escalation introduced

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 7 and watch it fail
pnpm --filter web-e2e test:shard7

# Expected result:
# - NODE_ENV validation fails with "NODE_ENV should be 'test' but is 'development'"
# - OR: spawnSync /bin/sh ENOENT errors in supabase-config-loader
# - OR: Payload login page renders blank with "N 8 Issues" badge
# - Tests timeout or fail to complete
```

**Expected Result**: Shard 7 fails with one or more of the above errors

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 7 multiple times
pnpm --filter web-e2e test:shard7
pnpm --filter web-e2e test:shard7  # Run again for consistency

# Run smoke tests to ensure no regressions
pnpm --filter web-e2e test:shard1

# Run other Payload tests
pnpm --filter web-e2e test:shard8
pnpm --filter web-e2e test:shard9

# Full E2E test suite (if resources available)
pnpm --filter web-e2e test
```

**Expected Result**: All commands succeed, shard 7 completes without NODE_ENV/ENOENT/rendering errors

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter web-e2e test

# Run specific test shards that could be affected:
# - Shard 7, 8, 9: Payload tests (most likely affected)
# - Shard 1, 6, 12: Smoke/config tests (validate environment)
# - All others: Ensure NODE_ENV=test doesn't break other tests
pnpm test
```

## Dependencies

### New Dependencies (if any)

None required - this fix uses existing dependencies

OR

**No new dependencies required**

## Database Changes

**Migration needed**: no

**No database changes required** - this is a test infrastructure fix, not a data model change

## Deployment Considerations

**Deployment Risk**: low

Special deployment steps:
- No special deployment needed - this is a test infrastructure fix only
- Changes are localized to test runner and utilities
- No production code affected

**Feature flags needed**: no

**Backwards compatibility**: maintained - all changes are backward compatible

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] NODE_ENV validation passes consistently
- [ ] Payload login page renders correctly (not blank)
- [ ] Shard 7 completes successfully (all tests pass or skip appropriately)
- [ ] No ENOENT errors in test output
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected in other test shards
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Key insights from diagnosis**:
- NODE_ENV=test is already partially set for web server in e2e-test-runner.cjs (line 669)
- The issue is that Playwright tests themselves don't inherit NODE_ENV properly
- execSync works fine in Node.js context but fails in Playwright worker context
- Supabase config loader already has graceful fallback mechanism in place

**Implementation approach**:
- Minimal changes needed - mostly fixes to existing code
- No new architecture or design patterns required
- Focus on robust error handling and proper environment variable propagation

**Related issues**:
- #1207: E2E Shard 6 Timeout - Mixed Test Types and Failing Payload Auth Tests
- #1135: Payload CMS E2E tests timeout without executing
- #1136: Bug Fix: Payload CMS E2E tests timeout without executing

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1290*
