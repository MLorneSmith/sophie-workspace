# Bug Fix: Staging E2E Shards Port Mismatch (3001 vs 3000)

**Related Diagnosis**: #947
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `PLAYWRIGHT_BASE_URL` environment variable in test-shards job causes Playwright to use default port 3001 while application runs on port 3000
- **Fix Approach**: Add `PLAYWRIGHT_BASE_URL: http://localhost:3000` to test-shards job environment
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The newly implemented sharded E2E tests in `staging-deploy.yml` are failing with `net::ERR_CONNECTION_REFUSED` errors. All 9 test shards fail because Playwright tests try to connect to `http://localhost:3001/` but the application is started on port `3000`.

**Root cause**: The test-shards job (lines 182-286 in staging-deploy.yml) starts the application on port 3000 but does not set the `PLAYWRIGHT_BASE_URL` environment variable. Playwright then defaults to port 3001 (from `apps/e2e/playwright.config.ts`), creating a port mismatch.

For full details, see diagnosis issue #947.

### Solution Approaches Considered

#### Option 1: Set PLAYWRIGHT_BASE_URL Environment Variable ⭐ RECOMMENDED

**Description**: Add the `PLAYWRIGHT_BASE_URL: http://localhost:3000` environment variable to the test-shards job env section. This tells Playwright exactly which port the application is running on.

**Pros**:
- Simplest fix (one-line change)
- Explicit and clear intent
- No changes to application startup or Playwright config
- Aligns with how other workflows handle this (e.g., ci patterns)
- Easy to debug (env var is visible in logs)
- Zero risk of side effects

**Cons**:
- None

**Risk Assessment**: Low - This is a pure configuration change with no code modification.

**Complexity**: Simple - Add environment variable to job configuration.

#### Option 2: Change Playwright Default Configuration

**Description**: Update the default baseURL in `apps/e2e/playwright.config.ts` to use port 3000 instead of 3001.

**Why Not Chosen**:
- More invasive than necessary
- Port 3001 might be the correct default for other workflows (local development with specific setup)
- Changes shared configuration that affects all E2E test runs
- Harder to trace why the change was made
- Less explicit about intent

#### Option 3: Update Test Startup Script

**Description**: Modify the test startup script to explicitly handle port configuration.

**Why Not Chosen**:
- Unnecessary complexity
- Environment variables are the standard way to configure port in workflows
- Would require changes to multiple files
- Higher maintenance burden

### Selected Solution: Set PLAYWRIGHT_BASE_URL Environment Variable

**Justification**: This is the minimal, explicit fix that directly addresses the root cause. Environment variables are the standard way to configure applications in CI workflows. The fix is completely non-invasive, low-risk, and follows CI/CD best practices.

**Technical Approach**:
- Add `PLAYWRIGHT_BASE_URL: http://localhost:3000` to the test-shards job environment (around line 206)
- The Playwright configuration files already check for this env var first (before defaults)
- No other changes needed

**Architecture Changes**: None

**Migration Strategy**: N/A - This is a pure configuration fix.

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Add environment variable to test-shards job

### New Files

None needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add PLAYWRIGHT_BASE_URL to test-shards job environment

Add the environment variable to the test-shards job (around line 206 in staging-deploy.yml):

```yaml
env:
  PLAYWRIGHT_BASE_URL: http://localhost:3000
  # ... other env vars
```

**Why this step first**: This is the only code change needed to fix the bug.

**Specific subtasks**:
- Locate the test-shards job definition (line 182-286)
- Find the env section (lines 197-206)
- Add `PLAYWRIGHT_BASE_URL: http://localhost:3000`

#### Step 2: Verify the workflow change

- Ensure the YAML syntax is valid
- Confirm indentation matches surrounding env variables
- Verify the change makes logical sense in context

#### Step 3: Test the fix

The fix will be automatically tested when the workflow runs:

- Push changes to staging branch
- Workflow triggers staging-deploy.yml
- test-shards job should now successfully connect to the application
- All E2E tests should pass (or fail for other reasons, not connection refused)

#### Step 4: Validation

- Run type check and linting (workflow files may have linters)
- Verify no other workflows need the same fix
- Check if `e2e-sharded.yml` has similar patterns to learn from

#### Step 5: Document the fix

- Add comment in the workflow file explaining why this env var is needed
- Update any internal documentation about CI/CD setup

## Testing Strategy

### Unit Tests

No unit tests applicable - this is a CI configuration change.

### Integration Tests

No code-level integration tests needed.

### E2E Tests

The fix will be validated by the next workflow run:

- All 9 test shards should successfully connect to `http://localhost:3000`
- No more `net::ERR_CONNECTION_REFUSED` errors
- Tests will pass/fail based on actual test conditions, not connection issues

**Manual Testing Checklist**:

- [ ] Commit workflow change
- [ ] Push to staging branch
- [ ] Wait for staging-deploy.yml workflow to run
- [ ] Verify all test-shards jobs complete without connection errors
- [ ] Check that error messages have changed (should see test failures, not connection refused)
- [ ] Verify test reports show actual test results, not connection issues
- [ ] Confirm no new errors introduced

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **YAML Syntax Error**: Indentation or formatting mistake could break the workflow
   - **Likelihood**: Low (simple one-line change)
   - **Impact**: Medium (workflow fails to parse)
   - **Mitigation**: Review indentation carefully; match surrounding env vars exactly

2. **Wrong Port**: If port 3001 is actually correct in some scenario
   - **Likelihood**: Very Low (diagnosis clearly shows port 3000)
   - **Impact**: High (tests still fail)
   - **Mitigation**: Confirmed from wait-on command and app startup in same job

3. **Application Not Listening on 3000**: Unexpected change to app startup
   - **Likelihood**: Very Low (unchanged from current state)
   - **Impact**: High (tests fail for different reason)
   - **Mitigation**: Check if app startup commands have changed

**Rollback Plan**:

If this change causes issues:
1. Remove the `PLAYWRIGHT_BASE_URL: http://localhost:3000` line from test-shards job
2. Push the change to staging
3. Investigate whether the application port has changed

**Monitoring** (if needed):

- Watch for `net::ERR_CONNECTION_REFUSED` errors in test-shards job logs
- Monitor test failure rates to ensure we don't introduce new issues
- Verify that all test shards complete successfully

## Performance Impact

**Expected Impact**: None

No performance implications from adding an environment variable.

## Security Considerations

**Security Impact**: None

This change has no security implications - it's purely a configuration fix for an internal CI workflow.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug is only visible in the CI workflow. To see it:

```bash
# View the latest staging-deploy.yml workflow run
gh run list --workflow=staging-deploy.yml --repo slideheroes/2025slideheroes --limit 1

# Check the test-shards job logs for connection refused errors
gh run view <run-id> --repo slideheroes/2025slideheroes --log
```

**Expected Result**: Logs show `Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/`

### After Fix (Bug Should Be Resolved)

```bash
# After pushing the fix to staging and workflow runs
# Check that test-shards jobs complete without connection errors

gh run list --workflow=staging-deploy.yml --repo slideheroes/2025slideheroes --limit 1

# View test results (should see actual test failures or passes, not connection errors)
gh run view <run-id> --repo slideheroes/2025slideheroes --log
```

**Expected Result**:
- All test-shards jobs reach actual test execution
- No "net::ERR_CONNECTION_REFUSED" errors
- Test results show actual Playwright test outcomes

## Dependencies

### New Dependencies

None - This is a pure configuration change.

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None - This is a workflow configuration change, not an application change.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - No changes to application behavior.

## Success Criteria

The fix is complete when:
- [ ] PLAYWRIGHT_BASE_URL environment variable added to test-shards job
- [ ] YAML syntax is valid (matches indentation of surrounding variables)
- [ ] Next staging-deploy.yml workflow run completes without connection errors
- [ ] All test-shards jobs successfully connect to the application
- [ ] E2E tests execute and report actual test results
- [ ] No net::ERR_CONNECTION_REFUSED errors appear in logs

## Notes

This is a simple configuration bug introduced in commit a74b18a69 when implementing sharded E2E tests. The fix aligns with how CI/CD best practices handle port configuration and matches patterns used in other workflows like `e2e-sharded.yml`.

The root cause was that the test-shards job was modeled after `e2e-sharded.yml` but missed this specific environment variable configuration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #947*
