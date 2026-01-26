# Bug Fix: Staging E2E Tests Fail - Port 3001 Already in Use (Server Double-Start)

**Related Diagnosis**: #1830
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: staging-deploy.yml explicitly starts the web server (lines 333-345), then Playwright tries to start it again with `reuseExistingServer: false`
- **Fix Approach**: Remove explicit server startup from staging-deploy.yml and let Playwright handle it (matching e2e-sharded.yml pattern)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging deploy workflow has a critical flaw: it explicitly starts the Next.js web server on port 3001 in the "Start Stripe CLI and application" step, then the E2E test runner (Playwright) attempts to start the server again because its `webServer` configuration has `reuseExistingServer: false` (the default in CI environments).

This results in the port conflict error: `Error: http://localhost:3001 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.`

All 12 E2E shard jobs fail with this same error, preventing the entire staging validation phase from completing.

For full details, see diagnosis issue #1830.

### Solution Approaches Considered

#### Option 1: Remove Explicit Server Startup from staging-deploy.yml ⭐ RECOMMENDED

**Description**: Delete the "Start Stripe CLI and application" step from staging-deploy.yml (lines 333-345) and let Playwright's `webServer` configuration start the server automatically. This matches the working pattern in `e2e-sharded.yml`.

**Pros**:
- Simplest solution with minimal code changes
- Matches the established e2e-sharded.yml pattern that works correctly
- Eliminates server startup duplication
- No changes to Playwright configuration needed
- Consistent with how E2E tests are designed to run

**Cons**:
- Removes explicit control over server startup timing
- Requires trust that Playwright's webServer config is correct (it is)

**Risk Assessment**: low - This is the proven pattern already used in e2e-sharded.yml

**Complexity**: simple - One file modification, remove ~12 lines

#### Option 2: Set reuseExistingServer:true in Playwright Config

**Description**: Change `reuseExistingServer: false` to `reuseExistingServer: true` when running in CI to allow reusing the already-started server.

**Pros**:
- Keeps explicit server startup in workflow
- Playwright reuses the existing server

**Cons**:
- More complex - requires conditional logic in playwright config
- Doesn't match the pattern used in e2e-sharded.yml
- Adds environment variable checks
- If server startup fails for any reason, Playwright won't catch it

**Why Not Chosen**: The project already has a working pattern (e2e-sharded.yml) that doesn't do explicit server startup. Following established patterns is better than creating alternative approaches.

#### Option 3: Start Server in a Background Process

**Description**: Use `nohup` to start the server in background before running tests, but this is essentially what Playwright's webServer config already does.

**Why Not Chosen**: Playwright's webServer configuration already handles this correctly in e2e-sharded.yml. Duplicating this logic adds complexity without benefit.

### Selected Solution: Remove Explicit Server Startup

**Justification**: The e2e-sharded.yml workflow demonstrates that letting Playwright manage server startup works correctly. The staging-deploy.yml added explicit server startup that conflicts with Playwright's design. Removing it aligns with established patterns and eliminates the double-start problem in one simple change.

**Technical Approach**:
- Remove the "Start Stripe CLI and application" step (lines 333-345) from staging-deploy.yml
- Keep the Stripe CLI startup if needed for API mocking, but only if separate from the web server startup
- Verify that Playwright's global-setup.ts handles any necessary environment setup (database seeding, etc.)
- Let Playwright's webServer config start the Next.js dev server

**Architecture Changes**: None - this aligns with existing architecture

**Migration Strategy**: Direct removal - no data migration needed, just workflow change

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Remove explicit server startup (lines 333-345)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Examine Current Implementation

Understand what's happening in both workflows to ensure safe removal.

- Read `.github/workflows/staging-deploy.yml` to identify the exact lines to remove (lines 333-345: "Start Stripe CLI and application" step)
- Verify that `e2e-sharded.yml` does NOT have explicit server startup
- Confirm that `playwright.smoke.config.ts` has webServer configuration
- Document findings

**Why this step first**: We need to understand the current state before making changes to ensure we're removing the right code.

#### Step 2: Remove the Explicit Server Startup Step

Remove the problematic step from staging-deploy.yml that's causing the port conflict.

- Delete the "Start Stripe CLI and application" step (lines 333-345) from staging-deploy.yml
- This includes the `run: pnpm --filter web dev:test &` command that starts the server on port 3001
- Keep any Stripe CLI startup if it's needed separately for payment testing

**Why this step second**: Once we remove the duplicate startup, Playwright can start the server cleanly without conflicts.

#### Step 3: Verify Playwright Configuration

Ensure Playwright's configuration will handle server startup correctly.

- Verify that `apps/e2e/playwright.smoke.config.ts` has a webServer configuration block
- Confirm that webServer is configured to start the dev server
- Check that `process.env.GITHUB_ACTIONS` logic is in place to disable reuseExistingServer in CI
- No changes needed - just verification

**Why this step third**: Confirms that Playwright is ready to take over server management after our removal.

#### Step 4: Test the Fix

Validate that the fix works in the staging deploy workflow.

- Run the staging deploy workflow (push to staging branch or manually trigger)
- Verify that all 12 E2E shard jobs start without port 3001 errors
- Confirm that the application server starts via Playwright's webServer config
- Verify that E2E tests run and complete successfully
- Check that no regressions appear in other workflow steps

**Why this step fourth**: We need to confirm the fix resolves the port conflict issue.

#### Step 5: Documentation and Verification

- Update any workflow comments if needed
- Run full validation commands (see Validation Commands section)
- Verify typecheck and lint pass
- Document the change in git history

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger staging-deploy workflow (push to staging branch)
- [ ] Verify E2E shard 1 starts without "port 3001 already in use" error
- [ ] Verify E2E shard 2 starts without error
- [ ] Verify all remaining shards complete without port errors
- [ ] Check that application loads correctly in tests
- [ ] Verify no 500 errors or startup failures
- [ ] Confirm test results are successful (tests may still fail, but no startup errors)

### Regression Prevention

```bash
# Verify the workflow syntax is valid
gh workflow view staging-deploy

# Check that no other steps depend on the removed step
git log --oneline --all -- .github/workflows/staging-deploy.yml | head -5
```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Playwright WebServer Doesn't Start Correctly**: Unlikely since it works in e2e-sharded.yml
   - **Likelihood**: low
   - **Impact**: medium (E2E tests would fail to run)
   - **Mitigation**: Verify playwright.smoke.config.ts has webServer config before removal

2. **Stripe CLI Dependency**: If Stripe CLI was needed for the explicit startup, tests might fail
   - **Likelihood**: low (Stripe is separate from web server startup)
   - **Impact**: medium (payment tests might fail)
   - **Mitigation**: Keep Stripe CLI startup if separate; check test results

3. **Environment Setup Skipped**: If the removed step did environment setup beyond starting the server
   - **Likelihood**: low (should be in global-setup.ts)
   - **Impact**: medium (tests might fail due to missing setup)
   - **Mitigation**: Verify global-setup.ts handles database seeding and env setup

**Rollback Plan**:

If this fix causes issues:

1. Revert the workflow file: `git revert <commit-hash>`
2. Restore the "Start Stripe CLI and application" step from git history
3. Push the revert and monitor staging-deploy workflow
4. Investigate why Playwright's webServer config isn't working
5. Consider Option 2 (reuseExistingServer:true) if needed

**Monitoring** (if needed):
- Monitor E2E shard job logs for startup errors after fix
- Watch for "port 3001" errors in job output
- Alert on E2E test failure rate changes

## Performance Impact

**Expected Impact**: none

No performance changes expected. This is a configuration fix, not a code optimization.

## Security Considerations

**Security Impact**: none

No security implications from this fix. We're just adjusting workflow automation.

## Validation Commands

### Before Fix (Bug Should Reproduce)

To reproduce the bug before applying fix:

```bash
# View the staging-deploy workflow
cat .github/workflows/staging-deploy.yml | grep -A 15 "Start Stripe CLI and application"

# This should show the explicit server startup that conflicts with Playwright
```

**Expected Result**: The "Start Stripe CLI and application" step exists and shows `pnpm --filter web dev:test &`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# View the fixed workflow
cat .github/workflows/staging-deploy.yml | grep -A 15 "Start Stripe CLI"

# Trigger staging deploy and check logs
gh workflow run staging-deploy.yml --ref staging
```

**Expected Result**:
- All commands succeed
- Workflow syntax is valid
- E2E shard jobs run without port 3001 errors
- Tests execute successfully

### Regression Prevention

```bash
# Verify workflow syntax
gh workflow view staging-deploy --repo MLorneSmith/2025slideheroes

# Compare with working e2e-sharded.yml pattern
diff <(grep -A 5 "webServer" .github/workflows/e2e-sharded.yml) \
     <(grep -A 5 "webServer" apps/e2e/playwright.smoke.config.ts)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix doesn't introduce any new npm packages or external dependencies.

## Database Changes

**No database changes required**

This is a workflow configuration fix with no database implications.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special deployment steps needed
- This is a GitHub Actions workflow change
- Change takes effect on next push to staging branch

**Feature flags needed**: no

**Backwards compatibility**: maintained

This change is internal to CI/CD and doesn't affect the deployed application.

## Success Criteria

The fix is complete when:
- [ ] The "Start Stripe CLI and application" step is removed from staging-deploy.yml
- [ ] Staging deploy workflow is triggered
- [ ] All 12 E2E shard jobs run without "port 3001 already in use" errors
- [ ] E2E tests complete execution (pass or fail based on test logic, not startup errors)
- [ ] No regressions in other workflow steps
- [ ] Code validation commands pass (typecheck, lint, format)

## Notes

This is a straightforward configuration fix addressing a pattern inconsistency. The e2e-sharded.yml workflow demonstrates that Playwright's webServer configuration handles server startup correctly without explicit workflow steps. The staging-deploy.yml was likely copied from a different workflow pattern and the redundant startup step was never removed, leading to this port conflict.

The fix aligns with the project's CI/CD patterns and eliminates technical debt in the workflow configuration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1830*
