# Bug Fix: PR Validation Workflow Multiple Failures

**Related Diagnosis**: #1758 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Three distinct workflow configuration issues causing timeouts, security scan failure, and database setup error
- **Fix Approach**: Adjust job timeout, enable Aikido dependency scan with non-blocking status, fix Supabase database path
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The PR Validation workflow (`.github/workflows/pr-validation.yml`) is failing with three independent issues:

1. **Unit Tests timeout** - `test-unit` job exceeds 15-minute timeout after ~14 minutes of execution
2. **Aikido Security Scan error** - All three scan types disabled, causing "You must enable at least one of the scans" error
3. **Accessibility Tests database setup** - `supabase start` runs in wrong directory (`apps/e2e` instead of `apps/web`)

For full details, see diagnosis issue #1758.

### Solution Approaches Considered

#### Option 1: Increase timeout to 30 minutes ⭐ RECOMMENDED

**Description**: Increase `timeout-minutes: 15` to `timeout-minutes: 30` on `test-unit` job to allow uncached test execution to complete within available window.

**Pros**:
- Simple one-line change
- No impact on test execution or caching strategy
- Aligns with actual test execution time (14-15 min with 120 test tasks)
- Follows industry standard of 30-minute timeouts for comprehensive test suites

**Cons**:
- Workflow will take longer overall when tests do timeout
- No actual optimization of test execution speed

**Risk Assessment**: low - Merely extending timeout window doesn't introduce new failure modes.

**Complexity**: simple - Direct configuration change.

#### Option 2: Implement test parallelization or optimization

**Description**: Split tests into shards or optimize test suite to complete faster.

**Why Not Chosen**: Requires significant changes to test infrastructure. The current timeout is simply too conservative; test execution is working correctly. Better to fix the timeout than over-engineer a solution to a configuration problem.

### Selected Solution: Three Independent Fixes

**Justification**: Each issue is independent and unrelated. Fixing all three with minimal changes is the most pragmatic approach. No interdependencies between fixes.

**Technical Approach**:

1. **Timeout fix**: Increase `test-unit` job timeout from 15 to 30 minutes
   - Allows uncached test execution to complete
   - Standard timeout for comprehensive test suites

2. **Aikido fix**: Enable dependency scan and add non-blocking job-level error handling
   - Set `fail-on-dependency-scan: true`
   - Add `continue-on-error: true` at job level
   - Allows security scanning to run without blocking PR validation

3. **Supabase path fix**: Change working directory for Supabase commands
   - Change `cd apps/e2e` to `cd apps/web`
   - Point to correct Supabase configuration location

**Architecture Changes** (if any):
- None - All changes are workflow configuration only

**Migration Strategy** (if needed):
- Not applicable - No data or code migration needed

## Implementation Plan

### Affected Files

- `.github/workflows/pr-validation.yml` - Only file requiring changes

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Fix Unit Tests Timeout

Increase the job timeout to allow tests to complete.

- Open `.github/workflows/pr-validation.yml`
- Find `test-unit` job definition (line ~216)
- Change `timeout-minutes: 15` to `timeout-minutes: 30`

**Why this step first**: Timeout is most critical failure blocking all PR validation.

#### Step 2: Fix Aikido Security Scan Configuration

Enable dependency scanning and make job non-blocking.

- Find `aikido-security` job definition (line ~288)
- Change `fail-on-dependency-scan: false` to `fail-on-dependency-scan: true`
- Add `continue-on-error: true` at job level (after `if:` condition)

**Why this step**: Aikido requires at least one scan enabled; non-blocking status prevents blocking entire PR.

#### Step 3: Fix Accessibility Tests Database Setup

Correct the working directory for Supabase commands.

- Find `accessibility-test` job definition (line ~368)
- In "Set up E2E database for accessibility tests" step (line ~414)
- Change line `cd apps/e2e` to `cd apps/web`

**Why this step**: E2E tests need Supabase config from `apps/web`, not `apps/e2e`.

#### Step 4: Validation

- Run PR validation workflow to confirm all three fixes work
- Verify unit tests complete within 30 minutes
- Verify Aikido security scan runs without errors
- Verify accessibility tests database setup succeeds

## Testing Strategy

### Unit Tests

No new tests needed - workflow validation is the test.

### Integration Tests

None required.

### E2E Tests

None required.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create a new PR to `dev` branch with minor changes
- [ ] Verify `test-unit` job completes within timeout (should take ~14 minutes)
- [ ] Verify `aikido-security` job runs successfully and reports findings
- [ ] Verify `accessibility-test` job completes database setup successfully
- [ ] Verify PR status check passes all required jobs
- [ ] Verify no new failures introduced in other workflow jobs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Timeout still insufficient**: Tests still exceed 30 minutes
   - **Likelihood**: low (tests currently complete in ~14 minutes)
   - **Impact**: medium (PR validation would fail again)
   - **Mitigation**: Monitor first few runs; increase further if needed

2. **Aikido security scan false positives**: Enabling dependency scan generates too many warnings
   - **Likelihood**: medium (60+ HIGH vulns noted in diagnosis)
   - **Impact**: low (scan is non-blocking with `continue-on-error`)
   - **Mitigation**: Job won't block PRs; security findings can be triaged separately

3. **Accessibility tests still fail after database fix**: Other database setup issues remain
   - **Likelihood**: low (wrong path was clearly identified cause)
   - **Impact**: medium (E2E tests would still fail)
   - **Mitigation**: Accessibility tests already marked `continue-on-error`, won't block PRs

**Rollback Plan**:

If these fixes cause issues:

1. Revert timeout to 15 minutes if tests fail at 30 minutes (unlikely)
2. Set `continue-on-error: true` back to not present if Aikido scan breaks other functionality
3. Change `cd apps/web` back to `cd apps/e2e` if Supabase setup in wrong location

**Monitoring** (if needed):

- Monitor workflow run times for first 5 runs to confirm test suite completes within 30-minute window
- Verify no new Aikido security warnings are introduced by enabling dependency scan
- Check accessibility test pass rate increases after database setup fix

## Performance Impact

**Expected Impact**: none

These are configuration fixes with no code changes. No performance implications.

## Security Considerations

**Security Impact**: high (positive)

- Enabling Aikido dependency scan improves security visibility
- Scan findings can be reviewed and triaged separately
- Non-blocking status prevents over-blocking PR workflow while security issues are resolved

Security review: Not needed - Configuration change only.

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Create PR with changes to verify workflow runs and fails
gh pr create --draft --title "Test PR for workflow validation"

# Observe failures:
# 1. Unit Tests timeout after 15 minutes
# 2. Aikido Security Scan error: "You must enable at least one of the scans"
# 3. Accessibility Tests error on database setup
```

**Expected Result**: All three failures occur as documented in diagnosis.

### After Fix (All Should Pass)

```bash
# Verify workflow file syntax
yamllint .github/workflows/pr-validation.yml

# Create a test PR with minor changes
gh pr create --draft --title "Test workflow fix"

# Wait for workflow to complete
# Expected: All jobs complete successfully

# Specific validations:
# 1. test-unit job completes before 30-minute timeout (~14 min actual)
# 2. aikido-security job runs and completes (reports findings but doesn't block)
# 3. accessibility-test job completes database setup and runs tests
```

**Expected Result**: All three issues resolved, workflow runs successfully.

### Regression Prevention

```bash
# Run full workflow validation on PR to dev branch
gh pr create --title "Regression test: workflow fixes"

# Wait for complete workflow execution
# Verify all jobs pass:
# - lint ✅
# - typecheck ✅
# - test-unit ✅ (within 30 min timeout)
# - yaml-lint ✅
# - markdown-lint ✅
# - aikido-security ✅ (runs successfully)
# - accessibility-test ✅ (database setup succeeds)
# - docker-scan ✅
# - pr-status ✅

# No regressions expected
```

## Dependencies

### New Dependencies (if any)

None required.

## Database Changes

Not applicable - No database schema or migration changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - Workflow configuration changes are immediately active

**Feature flags needed**: no

**Backwards compatibility**: maintained - Changes are internal workflow configuration

## Success Criteria

The fix is complete when:

- [ ] All three bugs identified in diagnosis are resolved
- [ ] `test-unit` job completes within 30-minute timeout
- [ ] `aikido-security` job runs and completes (non-blocking)
- [ ] `accessibility-test` job sets up database successfully
- [ ] PR validation workflow passes all quality gates
- [ ] Zero regressions in other workflow jobs
- [ ] Code review approved (if applicable)

## Notes

**Related Issues**:
- #1750 (introduced Aikido with all scans disabled)
- #1748, #1756 (addressed other workflow issues)
- #1745 (original diagnosis)

**Workflow Configuration Details**:
- Unit tests: `pnpm test:coverage` with 120 test tasks across 11 projects
- Aikido plan: Free tier includes dependency scanning; SAST and IaC are paid features
- Accessibility tests: Currently marked `continue-on-error: true` (advisory only)

**Future Improvements** (not in scope):
- Implement test sharding to reduce execution time further
- Integrate test result caching to improve subsequent runs
- Upgrade Aikido to paid plan to enable SAST/IaC scanning
- Make accessibility tests blocking once stability improves

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1758*
