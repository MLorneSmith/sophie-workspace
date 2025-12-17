# Bug Fix: Payload CMS E2E tests timeout without executing

**Related Diagnosis**: #1135 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Playwright multi-project configuration lacks `--project=payload` flag, causing all projects to run concurrent global setup
- **Fix Approach**: Add `--project=payload` flag to all Payload test commands in `apps/e2e/package.json`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Payload CMS E2E test shard 7 (and related tests) hang indefinitely during test execution. The test command does not specify `--project=payload`, causing Playwright to run global setup for ALL configured projects (chromium + payload) concurrently. This creates authentication file race conditions and deadlocks test execution, causing the process to timeout after 1203 seconds with 0 tests completed.

For full details, see diagnosis issue #1135.

### Solution Approaches Considered

#### Option 1: Add `--project=payload` flag to test commands ⭐ RECOMMENDED

**Description**: Modify `apps/e2e/package.json` test commands to explicitly specify `--project=payload` for all Payload-related test shards and groups. This tells Playwright to only run the payload project, preventing concurrent global setup runs and race conditions.

**Pros**:
- Surgical fix with minimal changes (3 lines in package.json)
- Aligns with Playwright's multi-project architecture and best practices
- No code changes required, only configuration
- Prevents race conditions on authentication state files
- Consistent with existing chromium project pattern
- Low risk - only affects test execution configuration

**Cons**:
- None identified; this is the intended pattern for multi-project setups

**Risk Assessment**: low - Configuration change only, no code logic modifications

**Complexity**: simple - Single flag addition

#### Option 2: Refactor global setup to avoid race conditions (Alternative)

**Description**: Modify `apps/e2e/global-setup.ts` to use file locking or project-specific authentication state directories to prevent race conditions without specifying projects.

**Why Not Chosen**: Adds unnecessary complexity and doesn't follow Playwright best practices. The configuration-based approach (Option 1) is the standard solution for multi-project setups. Adding file locking/logic is overengineering when Playwright already provides `--project` flag for this exact scenario.

#### Option 3: Separate test files per project (Alternative)

**Description**: Create separate test execution commands for each project with different test file directories.

**Why Not Chosen**: Would require restructuring test organization and creating duplicate configurations. The flag-based approach is cleaner, uses Playwright's built-in capabilities, and maintains current file structure.

### Selected Solution: Add `--project=payload` flag to test commands

**Justification**: This is the Playwright-recommended approach for multi-project configurations. The diagnosis clearly identified the root cause: missing `--project=payload` flag causes concurrent global setup execution and authentication file conflicts. The fix is minimal, low-risk, and aligns with how the chromium project already works in the configuration.

**Technical Approach**:
- Add `--project=payload` flag to `test:shard7` command
- Add `--project=payload` flag to `test:shard8` command
- Add `--project=payload` flag to `test:group:payload` command
- These three commands are the only ones that should run Payload tests (verified by diagnosis)
- The flag ensures only the "payload" project in `playwright.config.ts` runs, preventing chromium project setup from running

**Architecture Changes**: None - this is purely a configuration fix within existing architecture

**Migration Strategy**: Not applicable - configuration change only, no data or code migration needed

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/package.json` - Add `--project=payload` flag to three test commands (lines 30, 31, and 45)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update package.json test commands

Modify `apps/e2e/package.json` to add `--project=payload` flag to Payload test commands:

- Update line 30: `test:shard7` command
- Update line 31: `test:shard8` command
- Update line 45: `test:group:payload` command

**Why this step first**: This is the only change required to fix the root cause. All other verification steps depend on this configuration being in place.

**Specific changes**:
```
Before: "playwright test --project=chromium tests/payload/payload-auth.spec.ts ..."
After:  "playwright test --project=payload tests/payload/payload-auth.spec.ts ..."
```

#### Step 2: Verify playwright.config.ts has payload project configured

Confirm that `apps/e2e/playwright.config.ts` has the "payload" project defined with correct settings:
- Project name matches exactly: `"payload"`
- Test match pattern correctly identifies payload tests
- Storage state points to correct auth file: `.auth/payload-admin.json`

**Why this step**: Ensures the project flag matches the configuration definition

#### Step 3: Add regression test prevention

Create a test or validation to ensure:
- Global setup only runs once per test shard
- No concurrent authentication state modifications
- Payload project tests complete without hanging

**Why this step**: Prevents this regression from reoccurring in future changes

#### Step 4: Validation

Run all modified test commands to verify they execute successfully:
- `pnpm test:shard7` should complete in < 3 minutes
- `pnpm test:shard8` should complete in < 3 minutes
- `pnpm test:group:payload` should complete in < 3 minutes
- No timeout errors after ~1203 seconds
- All tests execute and report results (pass/fail, not hang)

## Testing Strategy

### Unit Tests

No unit tests required - this is a configuration fix.

### Integration Tests

No new integration tests required.

### E2E Tests

**Validation of the fix**:
- ✅ Run `pnpm test:shard7` - tests execute and complete, no timeout
- ✅ Run `pnpm test:shard8` - tests execute and complete, no timeout
- ✅ Run `pnpm test:group:payload` - tests execute and complete, no timeout
- ✅ Global setup runs exactly once (verify from logs)
- ✅ No "TIMEOUT: Shard Payload CMS timed out after 1203s" error
- ✅ All Payload tests report results (pass/fail)

**Test files**:
- `apps/e2e/tests/payload/` - All existing Payload tests should pass

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify `apps/e2e/package.json` has `--project=payload` flag in 3 commands
- [ ] Run `/test` command and verify shard 7 completes without timeout
- [ ] Run `/test` command and verify shard 8 completes without timeout
- [ ] Run `pnpm test:group:payload` manually and verify completion
- [ ] Check test output logs show global setup runs once, not multiple times
- [ ] Verify no authentication file race condition errors
- [ ] Confirm all Payload tests execute and report results

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect project name**: If `--project=payload` doesn't match the project name in `playwright.config.ts`
   - **Likelihood**: low (project name is clearly defined as "payload" in config)
   - **Impact**: medium (tests would fail immediately, easy to detect)
   - **Mitigation**: Verify project name in playwright.config.ts matches exactly before deployment

2. **Breaking other test flows**: If other tests rely on payload tests running concurrently
   - **Likelihood**: low (payload tests are isolated in separate project)
   - **Impact**: low (shard structure will still work, just isolated to payload project)
   - **Mitigation**: Test all test commands after change

**Rollback Plan**:

If this fix causes issues:
1. Remove `--project=payload` flag from the three affected commands in `apps/e2e/package.json`
2. Revert to the previous `package.json` version using `git checkout apps/e2e/package.json`
3. All tests will revert to original behavior (hanging after 1203s)

**Monitoring** (if needed):
- Monitor shard 7 execution time (should be < 3 minutes after fix, was hanging at 1203s before)
- Monitor shard 8 execution time (should be < 3 minutes after fix)
- Watch for authentication state file conflicts in test logs

## Performance Impact

**Expected Impact**: significant improvement

Tests should now execute successfully instead of hanging. Estimated time reduction:
- **Before**: Hangs indefinitely, killed by 1203s timeout
- **After**: Should complete in < 3 minutes
- **Improvement**: ~99.96% reduction in execution time (from timeout death to real completion)

**Performance Testing**:
- Measure actual execution time of `test:shard7`, `test:shard8`, and `test:group:payload`
- Verify global setup runs only once in logs
- Confirm no race condition delays

## Security Considerations

No security implications. This is purely a test configuration change that prevents concurrent authentication state modifications, which actually improves test reliability and prevents potential race condition bugs.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 7 - will hang and timeout
timeout 1300s pnpm test:shard7 || echo "Timed out as expected"
```

**Expected Result**: Process times out after ~1203 seconds with "TIMEOUT: Shard Payload CMS timed out" message

### After Fix (Bug Should Be Resolved)

```bash
# Type check (verify no TypeScript issues)
pnpm typecheck

# Lint (verify configuration is valid)
pnpm lint

# Run shard 7
pnpm test:shard7

# Run shard 8
pnpm test:shard8

# Run payload group
pnpm test:group:payload

# Run full test suite (includes all shards)
pnpm test
```

**Expected Result**: All commands succeed, shard 7 and 8 complete in < 3 minutes, 0 timeouts, all tests execute and report results (pass or fail).

### Regression Prevention

```bash
# Run full test suite multiple times to verify no race conditions
for i in {1..3}; do
  echo "Run $i:"
  pnpm test:shard7
done

# Verify test outputs show consistent results
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

**Migration needed**: no

No database changes required. This is purely a test configuration fix.

## Deployment Considerations

**Deployment Risk**: very low

This change only affects the E2E test configuration in `apps/e2e/package.json`. No application code changes, no database changes, no server-side changes.

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - Change is entirely within test infrastructure

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/package.json` updated with `--project=payload` on 3 commands
- [ ] `pnpm test:shard7` completes in < 3 minutes (previously hung at 1203s)
- [ ] `pnpm test:shard8` completes in < 3 minutes
- [ ] `pnpm test:group:payload` completes in < 3 minutes
- [ ] All Payload tests execute and report results (not hang)
- [ ] Global setup only runs once per test session (verified in logs)
- [ ] No authentication file race condition errors
- [ ] Manual testing checklist passes
- [ ] Code review approved (if applicable)

## Notes

This is a straightforward configuration fix based on clear diagnosis. The root cause (missing `--project=payload` flag) was identified and the solution follows Playwright's official multi-project pattern.

**Related documentation**:
- Playwright multi-project docs: https://playwright.dev/docs/test-projects
- SlideHeroes E2E testing guide: `apps/e2e/CLAUDE.md`
- Diagnosis issue: #1135

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1135*
