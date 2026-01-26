# Bug Fix: Staging E2E Tests Port Mismatch (3001 vs 3000)

**Related Diagnosis**: #1779
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Staging workflow expects app on port 3000 but `start:test` starts it on port 3001 (commit `4637ce72e`)
- **Fix Approach**: Update `.github/workflows/staging-deploy.yml` to use port 3001 consistently (4 line changes)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Commit `4637ce72e` changed `apps/web/package.json` to start the test server on port 3001 to align with Playwright's default expectations. However, the staging deployment workflow (`.github/workflows/staging-deploy.yml`) was not updated and still expects the app on port 3000. This causes all E2E test shards to timeout (60 seconds) waiting for a server that's running on the wrong port.

For full details, see diagnosis issue #1779.

### Solution Approaches Considered

#### Option 1: Update Workflow to Port 3001 ⭐ RECOMMENDED

**Description**: Modify the staging workflow to use port 3001 consistently throughout:
- Update `NEXT_PUBLIC_SITE_URL` env variable
- Update `PLAYWRIGHT_BASE_URL` env variable
- Update Stripe CLI webhook forwarding URL
- Update wait-on command to check port 3001

**Pros**:
- Aligns workflow with Playwright's default port expectations (port 3001)
- Keeps the intentional change from commit `4637ce72e` (which said "Playwright configs expect port 3001")
- Maintains consistency with local development environment expectations
- Minimal changes (4 lines in one file)
- Does not affect `package.json` or local test setup

**Cons**:
- Contradicts previous fix (#948) which set everything to port 3000
- Requires understanding the previous decision context

**Risk Assessment**: Low - This is purely a configuration update with no code logic changes. The port change is transparent to the application.

**Complexity**: Simple - Straightforward text substitution of port numbers in one file.

#### Option 2: Revert `start:test` to Port 3000

**Description**: Change `apps/web/package.json` `start:test` script back to default port 3000:
```json
"start:test": "NODE_ENV=test next start"
```

**Pros**:
- Aligns with the previous fix (#948)
- Simpler mental model (consistent port everywhere)

**Cons**:
- Reverts the intentional change from commit `4637ce72e`
- The commit message stated "Playwright configs expect port 3001", suggesting this was the intended port
- May break local E2E testing if developers expect port 3001
- Requires reverting a deliberate change without understanding why it was made

**Why Not Chosen**: The commit `4637ce72e` was intentional and stated that Playwright expects port 3001. Reverting it would undo that decision without addressing the actual issue (the workflow not being updated). Also, reverting could cause the same problem to recur locally.

### Selected Solution: Update Workflow to Port 3001

**Justification**: This approach respects the intentional change made in commit `4637ce72e` while completing the coordination by updating the workflow. It aligns the workflow with the application's new configuration and Playwright's expectations. Since the application is already set to use port 3001, updating the workflow is the minimal, non-breaking fix.

**Technical Approach**:
- Replace all references to `localhost:3000` with `localhost:3001` in the test-shards job environment and steps
- Replace all references to `host.docker.internal:3000` with `host.docker.internal:3001` in the Stripe CLI configuration
- Ensure consistency across all 4 locations in the workflow

**Architecture Changes**: None - this is purely a configuration change with no architectural impact.

**Migration Strategy**: Not needed - this is a forward-facing fix with no data migration requirements.

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Update port references in test-shards job (lines 200, 210, 280, 287)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update Environment Variables in test-shards Job

Update lines 200 and 210 in `.github/workflows/staging-deploy.yml` to change port references:

- Line 200: `NEXT_PUBLIC_SITE_URL: http://localhost:3000` → `http://localhost:3001`
- Line 210: `PLAYWRIGHT_BASE_URL: http://localhost:3000` → `http://localhost:3001`

**Why this step first**: These environment variables are foundational - other steps depend on them being correct. Updating them first ensures consistency throughout the configuration.

#### Step 2: Update Stripe CLI Webhook URL

Update line 280 in the "Start Stripe CLI and application" step to forward to port 3001:

- Line 280: `--forward-to http://host.docker.internal:3000/api/billing/webhook` → `http://host.docker.internal:3001/api/billing/webhook`

**Why this order**: This ensures Stripe CLI forwards to the correct port where the app is actually listening.

#### Step 3: Update wait-on Command

Update line 287 to wait for the correct port:

- Line 287: `npx wait-on http://localhost:3000 -t 60000` → `npx wait-on http://localhost:3001 -t 60000`

**Why this order**: This is the final piece - the wait-on command must check the port where the app is actually listening (3001).

#### Step 4: Validate Changes

- [ ] Verify all 4 port references have been updated
- [ ] Ensure no other references to `:3000` exist in the test-shards job section
- [ ] Confirm syntax is correct (valid YAML)

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push changes to a test branch
- [ ] Trigger the "Deploy to Staging" workflow
- [ ] Monitor the E2E test shards jobs:
  - [ ] "Start Stripe CLI and application" step should succeed
  - [ ] wait-on should connect successfully (no timeout)
  - [ ] E2E tests should proceed to run (previously they never reached this point)
- [ ] Verify at least one shard completes the E2E tests successfully
- [ ] Verify workflow overall reaches the "test-aggregate" job (previously failed before this)

### Regression Prevention

```bash
# Verify the workflow file has valid YAML syntax
cat .github/workflows/staging-deploy.yml | grep -E "localhost:(3000|3001)" | wc -l
# Expected output: 4 (all should reference 3001)

# Verify Playwright tests can find the application
# This will be validated by the E2E tests running successfully in the next workflow run
```

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Typo in port number**: Configuration change contains typos
   - **Likelihood**: Low
   - **Impact**: High (workflow fails again)
   - **Mitigation**: Carefully review all 4 line changes; verify grep output shows correct port count

2. **Incomplete update**: Some port references missed
   - **Likelihood**: Low
   - **Impact**: Medium (partial failure)
   - **Mitigation**: Search for all `:3000` references in the file after making changes; verify only 0 remain in test-shards section

3. **Application still not accessible**: Other infrastructure issue prevents access
   - **Likelihood**: Very low (diagnosis clearly identified the port mismatch as root cause)
   - **Impact**: High (workflow still fails)
   - **Mitigation**: Review application startup logs in the workflow run; check Supabase health

**Rollback Plan**:

If this fix causes issues:
1. Revert the changes to `.github/workflows/staging-deploy.yml`
2. Return to the previous version (all `:3000` references)
3. The workflow will return to the original behavior (fail but at least with clear error messages)

Alternatively, if this reveals other issues:
1. The workflow will fail at a different step (not the "Start Stripe CLI and application" step)
2. That new error will be the real blocking issue to investigate

## Performance Impact

**Expected Impact**: None

This is a configuration-only change with no impact on performance. The application performance is identical whether it listens on port 3000 or 3001.

## Security Considerations

**Security Impact**: None

Port numbers are internal configuration and have no security implications. Both ports are on localhost and only accessible within the CI environment.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current workflow configuration
grep -n "localhost:300[01]" .github/workflows/staging-deploy.yml | grep -A5 "test-shards:"
```

**Expected Result**: Multiple lines showing `localhost:3000` in the test-shards section while `start:test` uses port 3001.

### After Fix (Bug Should Be Resolved)

```bash
# Type check (no changes to TypeScript code, but verify no syntax errors)
pnpm typecheck

# Lint (YAML file should have no issues)
pnpm lint

# Format (YAML should be properly formatted)
pnpm format

# Manual verification of workflow changes
grep -n "localhost:3001" .github/workflows/staging-deploy.yml | grep -C2 "test-shards:"
```

**Expected Result**:
- All validation commands pass
- 4 lines show `localhost:3001` in the test-shards section
- No lines show `localhost:3000` in test-shards section

### Regression Prevention

```bash
# Trigger a test workflow run
git push origin <test-branch>

# Monitor the deployment
gh run watch

# Verify E2E tests progress past the "Start Stripe CLI and application" step
gh run view <run-id> --log | grep -A5 "Start Stripe CLI"
```

**Expected Result**:
- The "Start Stripe CLI and application" step succeeds (no timeout)
- E2E test shards proceed to run tests
- Workflow progresses to the "test-aggregate" job (previously never reached)

## Dependencies

No new dependencies required. This is a pure configuration change.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required - this is a workflow configuration change that takes effect immediately on the next push to staging.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - this change only affects the staging workflow, no code changes affect production or local development.

## Success Criteria

The fix is complete when:
- [ ] All 4 port references in `.github/workflows/staging-deploy.yml` updated to `:3001`
- [ ] Workflow file has valid YAML syntax
- [ ] Next staging deployment starts successfully
- [ ] E2E test shards complete the "Start Stripe CLI and application" step
- [ ] wait-on command succeeds (no 60-second timeout)
- [ ] At least one E2E shard runs tests successfully
- [ ] Workflow reaches the test-aggregate job

## Notes

### Context from Related Issues

Issue #947 and #948 dealt with the opposite problem: the workflow was set to port 3001 (Playwright default), then the fix changed everything to port 3000. Now commit `4637ce72e` correctly identified that the application script should use port 3001. This fix completes that change by updating the workflow accordingly.

### Why Port 3001?

From commit `4637ce72e` message:
> The start:test script was missing the -p 3001 flag, causing the production server to start on the default port 3000 instead of port 3001 that Playwright configs expect.

This indicates Playwright has a default expectation of port 3001, making that the correct choice for test environments.

### Related Files for Reference

- Playwright config defaults: `apps/e2e/global-setup.ts:507` shows baseURL default is `:3001`
- Application script: `apps/web/package.json` line 17 shows `start:test` uses `-p 3001`
- Workflow file: `.github/workflows/staging-deploy.yml` test-shards job (lines 182-301)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1779*
