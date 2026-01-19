# Bug Fix: E2E Sharded Tests Fail - No Web Server Running

**Related Diagnosis**: #1569
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E shards don't start a web server before running tests; Playwright configs for individual shards lack `webServer` configuration
- **Fix Approach**: Add Playwright's `webServer` configuration to all Playwright configs, set `PLAYWRIGHT_SERVER_COMMAND` env var, or add explicit server startup step to workflow
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E Tests (Sharded) workflow fails on all test shards with `net::ERR_CONNECTION_REFUSED at http://localhost:3001/` because:

1. The e2e-shards job has no step to start the Next.js web application before running tests
2. Playwright configs used by individual shards (`playwright.smoke.config.ts`, `playwright.auth.config.ts`, `playwright.billing.config.ts`) don't have `webServer` configuration
3. The workflow sets `PLAYWRIGHT_WEB_COMMAND` but the main config expects `PLAYWRIGHT_SERVER_COMMAND` (wrong variable name)

For full details, see diagnosis issue #1569.

### Solution Approaches Considered

#### Option 1: Add `webServer` to All Playwright Configs ⭐ RECOMMENDED

**Description**: Update all Playwright configuration files to include the `webServer` property that automatically starts the Next.js server before tests run. Playwright handles startup, health checks, cleanup, and parallel server instances across shards.

**Pros**:
- Follows Playwright best practices (official recommended approach)
- Cleaner separation of concerns (config handles everything)
- Automatic server lifecycle management (startup, health checks, cleanup)
- Each shard gets its own independent server instance
- Works seamlessly with Playwright's shard mechanism
- Most maintainable long-term solution

**Cons**:
- Requires updating 4 config files (main + 3 alternates)
- Each config needs slightly different `command` based on project (web vs payload)
- Slight code duplication across configs

**Risk Assessment**: low - Playwright's `webServer` is battle-tested, used by thousands of projects

**Complexity**: simple - Copy-paste pattern with minor variations

#### Option 2: Use Correct Environment Variable in Workflow

**Description**: Rename `PLAYWRIGHT_WEB_COMMAND` to `PLAYWRIGHT_SERVER_COMMAND` in the workflow env section. The main `playwright.config.ts` already has conditional webServer logic that checks for this variable.

**Pros**:
- Minimal change (1 line in workflow)
- Uses existing main config's webServer logic
- Less duplication than Option 1

**Cons**:
- Doesn't help shards using alternate configs (smoke, auth, billing)
- Those shards would still fail because their configs have no `webServer`
- Only fixes shards 3-9 (accounting/admin/team-related)
- Incomplete fix

**Why Not Chosen**: Incomplete - only fixes some shards, leaves others broken. Would require combining with Option 1 anyway.

#### Option 3: Add Explicit Server Startup Step to Workflow

**Description**: Add a "Start web server" step before "Run E2E tests" in the e2e-shards job that manually starts the server and waits for it to be ready.

**Pros**:
- Clear and explicit (easy to debug)
- Works with any config
- Minimal config changes needed

**Cons**:
- Manual orchestration in YAML (more brittle)
- Server startup/cleanup logic duplicated in workflow
- Background process management is error-prone
- Multiple servers running on same port could conflict
- Requires careful signal handling for cleanup

**Why Not Chosen**: Over-engineered for CI. Playwright's built-in `webServer` is simpler and more reliable.

### Selected Solution: Add `webServer` to All Playwright Configs (Option 1)

**Justification**: This follows Playwright's official best practices and is the most maintainable approach. Each config becomes self-contained - the test command doesn't need to know about server setup. Playwright handles all the complexity (health checks, parallel instances, cleanup). This is the pattern used by thousands of projects and documented in official Playwright CI/CD guides.

**Technical Approach**:
- Add `webServer` property to `playwright.config.ts` (main config)
- Add `webServer` property to `playwright.smoke.config.ts`
- Add `webServer` property to `playwright.auth.config.ts`
- Add `webServer` property to `playwright.billing.config.ts`
- Each config uses appropriate command for its project (web or payload)
- Remove unused `PLAYWRIGHT_WEB_COMMAND` and `PLAYWRIGHT_PAYLOAD_COMMAND` env vars from workflow
- Set `PLAYWRIGHT_SERVER_COMMAND` env var as optional documentation/fallback

**Architecture Changes**: None - this is purely configuration. No code changes needed.

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Add webServer config with conditional env var handling
- `apps/e2e/playwright.smoke.config.ts` - Add webServer config
- `apps/e2e/playwright.auth.config.ts` - Add webServer config
- `apps/e2e/playwright.billing.config.ts` - Add webServer config (and check if it exists)
- `.github/workflows/e2e-sharded.yml` - Update/document env vars (optional)

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Main Playwright Config

Update `apps/e2e/playwright.config.ts` to add `webServer` configuration.

- Add `webServer` object at lines 192-201 (replace conditional undefined with actual config)
- Configure for web application on port 3001
- Set `reuseExistingServer: !process.env.CI` (start fresh in CI, reuse locally)
- Set `timeout: 120 * 1000` for build compilation
- Include stdout/stderr handling

**Why this step first**: Main config is used by most shards (3-9). Fixing this unblocks the majority of tests.

**Expected result**: Main config has webServer property that starts `pnpm --filter web dev:test` on port 3001.

#### Step 2: Update Smoke Tests Config

Update `apps/e2e/playwright.smoke.config.ts` to add webServer configuration for Shard 1.

- Add `webServer` property matching main config
- Same port (3001) and command
- Smoke tests don't require Payload, so use web-only config

**Why this step**: Shard 1 (smoke tests) is the fastest validation. Quick feedback loop.

**Expected result**: Smoke config starts web server before running smoke tests.

#### Step 3: Update Auth Tests Config

Update `apps/e2e/playwright.auth.config.ts` to add webServer configuration for Shard 2.

- Add `webServer` property matching main config
- Same port and command
- Auth tests don't require Payload

**Why this step**: Shard 2 (auth tests) validates authentication flows. Essential functionality.

**Expected result**: Auth config starts web server before running auth tests.

#### Step 4: Update Billing Tests Config

Update `apps/e2e/playwright.billing.config.ts` to add webServer configuration for Shards 10-11.

- First verify file exists (may be created or missing)
- Add `webServer` property if needed
- Same port and command as other configs
- Billing tests don't require Payload

**Why this step**: Shards 10-11 test user/team billing flows.

**Expected result**: Billing config starts web server before running billing tests.

#### Step 5: Verify Payload Shards Configuration

Verify Shards 7-9 (Payload tests) configuration in main `playwright.config.ts`.

- Check if Payload project config has separate `baseURL` (line 163-164: `http://localhost:3021`)
- Payload tests should use Payload's dev server, not web server
- Verify the main config's webServer doesn't interfere with Payload project
- Document any special handling needed

**Why this step**: Payload runs on a different port (3021 in dev:test mode). Ensure main webServer (port 3001) doesn't conflict.

**Expected result**: Payload project can coexist with web server config without conflicts.

#### Step 6: Workflow Cleanup (Optional)

Review `.github/workflows/e2e-sharded.yml` environment variables:

- `PLAYWRIGHT_WEB_COMMAND` - No longer used, can be removed or kept as documentation
- `PLAYWRIGHT_PAYLOAD_COMMAND` - No longer used, can be removed or kept as documentation
- `PLAYWRIGHT_SERVER_COMMAND` - Can be set if using Option 2 fallback (optional)

Document why these env vars are no longer needed now that `webServer` is in configs.

**Why this step**: Clean up unused configuration, document the change.

**Expected result**: Workflow is cleaner, no unused env vars causing confusion.

#### Step 7: Testing & Validation

Run comprehensive validation to ensure fix works.

- Run typecheck to ensure no TypeScript errors in config files
- Run local E2E tests to verify webServer starts correctly
- Run a single shard manually in CI to verify behavior
- Monitor first 3 complete workflow runs for stability

**Why this step**: Validate the fix works before considering it complete.

**Expected result**: All tests pass, webServer starts successfully, no connection refused errors.

## Testing Strategy

### Unit Tests

No unit tests needed - this is configuration-only change. No code changes to test.

### Integration Tests

No integration tests needed - the E2E workflow itself validates this change.

### E2E Tests

The E2E Tests (Sharded) workflow will serve as the primary validation:

**Test files**:
- All test specs across all 12 shards will validate that web server is running

**Validation scenarios**:
- ✅ Shard 1 (smoke tests) - `page.goto("/")` should work
- ✅ Shard 2 (auth tests) - `page.goto("/auth/sign-in")` should work
- ✅ Shards 3-6 (account/admin/a11y/healthcheck) - All navigation should work
- ✅ Shards 7-9 (Payload tests) - Should use Payload's port, not interfere
- ✅ Shards 10-11 (billing tests) - All navigation should work
- ✅ Shards 12+ (team/config tests) - All navigation should work

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm typecheck` - No TypeScript errors in config files
- [ ] Run `pnpm build` - Build succeeds with new configs
- [ ] Local testing: Run `pnpm --filter web-e2e test:shard1` locally - Smoke tests pass
- [ ] Local testing: Run `pnpm --filter web-e2e test:shard2` locally - Auth tests pass
- [ ] CI testing: Trigger E2E Tests (Sharded) workflow manually on dev branch
- [ ] CI testing: Verify setup-server job still works
- [ ] CI testing: Verify at least 3 shards pass (1, 2, 3)
- [ ] CI testing: Check logs confirm "webServer starting..." messages
- [ ] CI testing: No `ERR_CONNECTION_REFUSED` errors in logs
- [ ] Monitor: Check first 3 workflow runs complete successfully with <10min total time

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Port conflicts on shared runners**: Multiple servers trying to start on same port
   - **Likelihood**: low (RunsOn runner isolation should prevent this)
   - **Impact**: medium (shard would fail, not affecting other systems)
   - **Mitigation**: Each shard runs on a dedicated runner; Playwright's reuseExistingServer handles cleanup

2. **Incorrect server startup command**: If command doesn't match actual dev script
   - **Likelihood**: very low (using existing `pnpm --filter web dev:test` command)
   - **Impact**: medium (tests fail to connect)
   - **Mitigation**: Verify command works locally before deploying

3. **Payload tests interfere with web server**: Port or state conflicts
   - **Likelihood**: low (Payload uses separate port 3021)
   - **Impact**: medium (Payload tests fail)
   - **Mitigation**: Review Payload config in Step 5, ensure separate baseURL used

4. **Build timeout during server startup**: Complex build takes > 120 seconds
   - **Likelihood**: low (current build ~30-60 seconds)
   - **Impact**: low (can increase timeout)
   - **Mitigation**: Set timeout to 180s if needed; can be increased

**Rollback Plan**:

If this fix causes issues in production:
1. Revert commits to all Playwright config files
2. Push revert to dev branch
3. The workflow will continue using old configs (no server startup)
4. Bug remains unfixed but workflow returns to previous state

Note: Rollback is simpler than fix because we're just removing code, not breaking existing functionality.

**Monitoring**:

- Watch first 3 E2E workflow runs for consistent success
- Check for any new error patterns in logs (port conflicts, timeouts, etc.)
- Monitor setup-server job to ensure it still passes
- Verify shard completion times remain consistent (~5-10 min total)

## Performance Impact

**Expected Impact**: minimal to positive

Adding `webServer` configuration won't increase execution time because:
- Server starts in parallel with test initialization
- No additional overhead compared to manual startup
- Playwright caches server between runs locally (reuseExistingServer)
- In CI, fresh server each run (desired behavior)

**Performance Testing**:
- Compare shard completion times before/after fix
- Expected: Same or slightly faster (no extra manual steps)
- If slower, check: build command, port conflicts, network delays

## Security Considerations

**Security Impact**: none

The `webServer` configuration runs on localhost:3001 within the CI runner:
- Not exposed to external network
- Uses same credentials as current setup
- Test environment isolated per runner
- No changes to auth/access control

**Security checklist**:
- ✅ No new secrets exposed
- ✅ No credential changes
- ✅ Test environment properly isolated
- ✅ No changes to security policies

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger E2E Tests (Sharded) workflow manually
gh workflow run "E2E Tests (Sharded)" --ref dev

# Wait for workflow to start and check shard 1 logs
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json id --jq '.[0].id' | xargs -I {} gh run view {} --log | grep -A 5 "ERR_CONNECTION_REFUSED"
```

**Expected Result**: Logs show `ERR_CONNECTION_REFUSED at http://localhost:3001/` - bug reproduces.

### After Fix (Bug Should Be Resolved)

```bash
# Type check - ensure config files have no TS errors
pnpm typecheck

# Build - ensure config doesn't break build
pnpm build

# Run local smoke test to verify webServer config works
cd apps/e2e
pnpm playwright test tests/smoke/smoke.spec.ts --config=playwright.smoke.config.ts

# Trigger workflow manually after pushing fix
gh workflow run "E2E Tests (Sharded)" --ref dev

# Wait and verify logs show successful connection
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json id --jq '.[0].id' | xargs -I {} gh run view {} --log | grep -E "(webServer|connection|localhost:3001|Starting)"

# Verify setup-server job still passes
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json id --jq '.[0].id' | xargs -I {} gh run view {} --json jobs --jq '.jobs[] | select(.name == "Setup Test Server") | .conclusion'
```

**Expected Result**:
- `pnpm typecheck` passes
- `pnpm build` succeeds
- Local smoke test connects successfully to localhost:3001
- Workflow logs show webServer starting
- Setup Test Server job conclusion is "success"
- At least 3 shards pass tests

### Regression Prevention

```bash
# Ensure other workflows still work
gh workflow run "E2E Smart Tests" --ref dev
gh workflow run "PR Validation" --ref dev

# Check that production workflows are unaffected
gh run list --workflow="Deploy to Production" --limit 3
```

**Expected Result**: Other workflows continue to work normally.

## Dependencies

**No new dependencies required**

This is a configuration-only change using existing tools (Playwright, Next.js, pnpm).

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a workflow configuration change only - no code deployed to production.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - all existing tests continue to work

## Success Criteria

The fix is complete when:
- [ ] All Playwright config files updated with `webServer` property
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] Local smoke test connects successfully to localhost:3001
- [ ] E2E Tests (Sharded) workflow runs successfully
- [ ] At least 3 shards pass tests (1, 2, 3 recommended)
- [ ] No `ERR_CONNECTION_REFUSED` errors in logs
- [ ] Setup Test Server job still passes
- [ ] No `ERR_CONNECTION_REFUSED` errors in any shard output
- [ ] Zero regressions (other workflows unaffected)
- [ ] Code review approved

## Notes

**Key Implementation Details**:
- Use `reuseExistingServer: !process.env.CI` to reuse servers locally for faster iteration
- Set `timeout: 120 * 1000` (2 minutes) to allow for slow builds
- Use `stdout: 'pipe'` and `stderr: 'pipe'` to capture output for debugging
- Each config uses appropriate `command` for its test suite (web vs payload)

**Why This Approach**:
- Follows Playwright's official documentation and best practices
- Used by thousands of projects in production
- Minimizes workflow complexity (move logic to configs)
- Self-contained configs (easier to maintain)
- Automatic lifecycle management (startup, health checks, cleanup)

**Testing Notes**:
- The webServer feature is built into Playwright, well-tested
- Only configuration needed is setting the right properties
- Payload tests should automatically work because they use different baseURL

**Documentation References**:
- Playwright webServer docs: https://playwright.dev/docs/test-webserver
- CI/CD best practices: See `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- E2E testing patterns: See `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1569*
