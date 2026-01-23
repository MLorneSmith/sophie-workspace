# Bug Fix: E2E Sharded Tests WebServer Timeout

**Related Diagnosis**: #1583
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Next.js dev server hangs when starting with cached production build artifacts from Setup Test Server job
- **Fix Approach**: Change webServer config to use production server (`next start`) instead of dev server (`next dev`)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E Tests (Sharded) workflow caches production build artifacts (`.next/`) from the Setup Test Server job, but then tries to start a dev server (`next dev --turbo`) in shard jobs. The dev server cannot properly initialize with incompatible cached production artifacts, causing it to hang indefinitely until Playwright's 120-second timeout.

For full details, see diagnosis issue #1583.

### Solution Approaches Considered

#### Option 1: Use Production Server (next start) ⭐ RECOMMENDED

**Description**: Change the webServer config in all Playwright configs to use `next start` (production server) instead of `next dev` (development server). Since the Setup Test Server job already builds the application, we can simply run the production server.

**Pros**:
- Uses the existing production build - no rebuilding needed
- Production server starts instantly (no compilation)
- Matches the workflow architecture (build once, test many times)
- More efficient - faster startup, lower resource usage
- Closer to production environment
- Zero risk of dev/prod build conflicts
- Already has `start:test` script available (`NODE_ENV=test next start`)

**Cons**:
- Dev server features (hot reload, better error messages) not available (but not needed for tests)
- Slight difference from local dev testing (but tests should work in both)

**Risk Assessment**: low - production server is stable, well-tested, and designed for CI environments

**Complexity**: simple - change one command in config files, update workflow env vars

#### Option 2: Clear .next Before Starting Dev Server

**Description**: Add a step to each shard job to remove the `.next` directory before Playwright starts the dev server.

**Pros**:
- Keeps dev server behavior (better debugging if tests fail)
- Solves the conflict directly

**Cons**:
- Requires additional workflow step in each shard
- Dev server must compile on every shard (slow - 2-3 minutes each)
- Wastes the cached build from Setup Test Server job
- Higher resource usage (12 shards × 2-3 min compilation = 24-36 min extra)
- Doesn't leverage workflow optimization (build once, test many)

**Why Not Chosen**: Inefficient - throws away the cached build that was specifically created to speed up tests.

#### Option 3: Don't Cache .next Directory

**Description**: Remove `apps/web/.next` from the cache path in Setup Test Server job, forcing each shard to build independently.

**Pros**:
- Avoids dev/prod conflict entirely
- Each shard has fresh build

**Cons**:
- Massive inefficiency - 12 shards each running full build
- Total build time: 12 × 3 minutes = 36 minutes of compilation
- Higher costs (more CPU time)
- Slower feedback loops
- Defeats the purpose of the Setup Test Server job

**Why Not Chosen**: Completely defeats the workflow optimization. The Setup Test Server job exists specifically to build once and share artifacts.

#### Option 4: Increase Timeout and Add Debug Logging

**Description**: Increase webServer timeout to 300 seconds and add verbose logging to understand what's blocking.

**Pros**:
- Might reveal additional information about the hang

**Cons**:
- Doesn't fix the underlying issue
- Just makes tests wait longer before failing
- May still timeout (we don't know how long the hang lasts)
- Wastes CI time waiting for inevitable failure

**Why Not Chosen**: Treats symptom, not cause. Even with more time, the dev server may never become ready.

### Selected Solution: Use Production Server (next start)

**Justification**: This approach perfectly aligns with the workflow architecture. The Setup Test Server job builds the application specifically to share artifacts across shards. Using the production server leverages this build, starts instantly, and eliminates the dev/prod conflict entirely. It's the most efficient, lowest risk, and architecturally correct solution.

**Technical Approach**:
- Change webServer `command` from `pnpm --filter web dev:test` to `pnpm --filter web start:test`
- Update Playwright configs: `playwright.smoke.config.ts`, `playwright.auth.config.ts`, `playwright.billing.config.ts`, `playwright.config.ts`
- Keep all other webServer settings (ports, timeouts, etc.) unchanged
- Production server respects `NODE_ENV=test` from `start:test` script
- Server starts in 1-2 seconds instead of 120+ seconds

**Architecture Changes**: None - this is purely a configuration change. No code modifications needed.

**Migration Strategy**: Not applicable - this is a workflow configuration change only.

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.smoke.config.ts:51-59` - Change webServer command to `pnpm --filter web start:test`
- `apps/e2e/playwright.auth.config.ts` - Change webServer command to `pnpm --filter web start:test` (if exists)
- `apps/e2e/playwright.billing.config.ts` - Change webServer command to `pnpm --filter web start:test` (if exists)
- `apps/e2e/playwright.config.ts:198-222` - Change webServer command to `pnpm --filter web start:test`
- `.github/workflows/e2e-sharded.yml:132-134` - Update comments to reflect production server usage

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Main Playwright Config

Update `apps/e2e/playwright.config.ts` to use production server.

- Read the current webServer configuration (lines 198-222)
- Change `command: "pnpm --filter web dev:test"` to `command: "pnpm --filter web start:test"`
- Verify all other settings remain the same (url, timeout, etc.)
- Add comment explaining why production server is used

**Why this step first**: Main config is used by most shards (3-9). Fixing this unblocks the majority of tests.

#### Step 2: Update Smoke Tests Config

Update `apps/e2e/playwright.smoke.config.ts` to use production server.

- Read current webServer configuration (lines 51-59)
- Change `command: "pnpm --filter web dev:test"` to `command: "pnpm --filter web start:test"`
- Verify url remains `http://localhost:3001`
- Add comment explaining production server usage

**Why this step**: Shard 1 (smoke tests) is the fastest validation. Quick feedback loop.

#### Step 3: Update Auth Tests Config

Update `apps/e2e/playwright.auth.config.ts` to use production server.

- Read current webServer configuration
- Change command to `pnpm --filter web start:test`
- Verify settings match other configs

**Why this step**: Shard 2 (auth tests) validates authentication flows. Essential functionality.

#### Step 4: Update Billing Tests Config

Update `apps/e2e/playwright.billing.config.ts` to use production server (if file exists).

- Check if file exists
- Read current webServer configuration
- Change command to `pnpm --filter web start:test`
- Verify settings consistent with other configs

**Why this step**: Shards 10-11 test billing flows.

#### Step 5: Update Workflow Comments

Update `.github/workflows/e2e-sharded.yml` comments to reflect production server usage.

- Update comment at line 132-134 explaining server startup approach
- Document that production server is used (not dev server)
- Explain why this matches the workflow architecture

**Why this step**: Keep documentation in sync with implementation.

#### Step 6: Testing & Validation

Run comprehensive validation to ensure fix works.

- Run typecheck to ensure no TypeScript errors
- Run local E2E test with production server to verify behavior
- Trigger workflow run to validate in CI
- Monitor shard execution for successful completion

**Why this step**: Validate the fix works before considering it complete.

## Testing Strategy

### Unit Tests

No unit tests needed - this is configuration-only change. No code changes to test.

### Integration Tests

No integration tests needed - the E2E workflow itself validates this change.

### E2E Tests

The E2E Tests (Sharded) workflow will serve as the primary validation:

**Test files**:
- All test specs across all 12 shards will validate that production server is running correctly

**Validation scenarios**:
- ✅ Shard 1 (smoke tests) - Basic navigation works
- ✅ Shard 2 (auth tests) - Authentication flows work
- ✅ Shards 3-6 (account/admin/a11y/healthcheck) - All features work
- ✅ Shards 7-9 (Payload tests) - CMS operations work
- ✅ Shards 10-11 (billing tests) - Payment flows work
- ✅ Shards 12+ (team/config tests) - Team features work

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm typecheck` - No TypeScript errors in config files
- [ ] Run `pnpm build` - Build succeeds
- [ ] Local testing: Build app with `pnpm --filter web build`
- [ ] Local testing: Start production server with `pnpm --filter web start:test`
- [ ] Local testing: Run `pnpm --filter web-e2e test:shard1` - Smoke tests pass
- [ ] Local testing: Verify production server serves pages correctly
- [ ] CI testing: Trigger E2E Tests (Sharded) workflow manually on dev branch
- [ ] CI testing: Verify setup-server job still works
- [ ] CI testing: Verify at least 3 shards pass (1, 2, 3)
- [ ] CI testing: Check logs show production server starting quickly
- [ ] CI testing: No timeout errors in logs
- [ ] Monitor: Check first 3 workflow runs complete successfully with <10min total time

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Production server behavior differs from dev server**: Tests may behave differently
   - **Likelihood**: low (tests should work in both environments)
   - **Impact**: medium (some tests might need adjustment)
   - **Mitigation**: Run full test suite locally with production server before deploying; monitor first few CI runs

2. **Production build missing dev-only features**: If tests rely on dev server features
   - **Likelihood**: very low (E2E tests don't use hot reload or dev overlays)
   - **Impact**: low (tests would fail, easy to identify)
   - **Mitigation**: Review test failures if they occur; production builds include all necessary runtime code

3. **Environment variable differences**: Production mode may handle env vars differently
   - **Likelihood**: very low (using `NODE_ENV=test` via `start:test` script)
   - **Impact**: low (env vars explicitly set in workflow)
   - **Mitigation**: Workflow sets all required env vars explicitly

**Rollback Plan**:

If this fix causes issues:
1. Revert commits changing Playwright configs
2. Change `command` back to `pnpm --filter web dev:test`
3. Push to dev branch
4. Tests will return to previous state (timing out, but rollback is simple)

**Monitoring**:
- Watch first 3 E2E workflow runs for consistent success
- Check shard completion times (should be faster - instant server startup)
- Verify no new error patterns in logs
- Monitor for any test failures related to production vs dev behavior

## Performance Impact

**Expected Impact**: significant improvement (positive)

Using production server instead of dev server:
- **Server startup**: 1-2 seconds (vs 120+ seconds timeout)
- **Per-shard overhead reduction**: ~118 seconds saved
- **Total workflow time reduction**: Potentially 5-10 minutes faster
- **Resource usage**: Lower (no compilation per shard)
- **First test execution**: Immediate (vs waiting for dev compilation)

**Performance Testing**:
- Compare shard completion times before/after fix
- Expected: Shards complete 2-3 minutes faster each
- Expected: First tests run immediately (no server startup delay)
- Monitor total workflow duration

## Security Considerations

**Security Impact**: none

The production server:
- Runs on localhost:3001 within CI runner (same as dev server)
- Not exposed to external network
- Uses same credentials and environment variables
- Test environment isolated per runner
- No changes to auth/access control
- No new attack surface

**Security checklist**:
- ✅ No new secrets exposed
- ✅ No credential changes
- ✅ Test environment properly isolated
- ✅ No changes to security policies

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current failing workflow
gh run view 21141407892 --repo MLorneSmith/2025slideheroes --json jobs --jq '.jobs[] | "\(.name): \(.conclusion // .status)"'

# Should show multiple shard failures with timeout errors
gh run view 21141407892 --repo MLorneSmith/2025slideheroes --log | grep "Timed out waiting"
```

**Expected Result**: Logs show "Timed out waiting 120000ms from config.webServer" - bug reproduces.

### After Fix (Bug Should Be Resolved)

```bash
# Type check - ensure config files have no TS errors
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build application (required for production server)
pnpm --filter web build

# Start production server locally to verify it works
pnpm --filter web start:test &
sleep 5
curl http://localhost:3001 | grep -q "html" && echo "✓ Server is responding"
pkill -f "next start"

# Run local smoke test with production server
pnpm --filter web build  # Ensure build exists
pnpm --filter web-e2e test:shard1

# Trigger workflow manually after pushing fix
gh workflow run "E2E Tests (Sharded)" --ref dev

# Wait and check workflow status
sleep 300  # Wait 5 minutes for first shards
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json databaseId --jq '.[0].databaseId' | \
  xargs -I {} gh run view {} --json jobs --jq '.jobs[] | "\(.name): \(.conclusion // .status)"'

# Verify logs show quick server startup (not timeout)
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json databaseId --jq '.[0].databaseId' | \
  xargs -I {} gh run view {} --log | grep -E "(webServer|Starting|ready)" | head -20
```

**Expected Result**:
- `pnpm typecheck` passes
- `pnpm build` succeeds
- Production server starts and responds on port 3001
- Local smoke test passes
- Workflow logs show server starts quickly
- At least 3 shards pass tests
- No timeout errors

### Regression Prevention

```bash
# Ensure other workflows still work
gh workflow run "E2E Smart Tests" --ref dev
gh workflow run "PR Validation" --ref dev

# Verify dev-integration-tests still works (uses deployed env, not local server)
gh run list --workflow="Dev Integration Tests" --limit 3 --json conclusion
```

**Expected Result**: Other workflows continue to work normally.

## Dependencies

**No new dependencies required**

This is a configuration-only change using existing Next.js production server.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a workflow configuration change only - no code deployed to production.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - all existing tests continue to work

**CI/CD Impact**: Positive - faster test execution, lower resource usage

## Success Criteria

The fix is complete when:
- [ ] All Playwright config files updated with `start:test` command
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] Local smoke test with production server passes
- [ ] E2E Tests (Sharded) workflow runs successfully
- [ ] At least 3 shards pass tests (1, 2, 3 recommended)
- [ ] No timeout errors in logs
- [ ] Server starts in <5 seconds (vs 120s timeout before)
- [ ] Setup Test Server job still passes
- [ ] Zero regressions (other workflows unaffected)
- [ ] Shard completion times improved (2-3 min faster per shard)

## Notes

**Key Implementation Details**:
- Use `start:test` script which runs `NODE_ENV=test next start`
- Production server requires existing build (provided by Setup Test Server job)
- Keep `timeout: 120 * 1000` (2 minutes) even though startup is instant (safety margin)
- Keep `reuseExistingServer: !process.env.CI` unchanged
- Server startup now takes 1-2 seconds instead of 120+ seconds

**Why This Approach**:
- Leverages the workflow architecture (build once, test many times)
- Eliminates dev/prod artifact conflict entirely
- Faster, more efficient, lower cost
- Closer to production environment (better test confidence)
- Matches CI best practices (use production builds)

**Production vs Dev Server**:
- Production server: Optimized, instant startup, production-like behavior
- Dev server: Hot reload (not needed), better errors (not critical for tests)
- Tests should work in both - if they don't, that's a test quality issue

**Workflow Architecture**:
```
Setup Test Server Job:
  └─ Build production artifacts → Cache

E2E Shard Jobs (12 parallel):
  ├─ Restore cached artifacts
  ├─ Start production server (1-2s) ← THE FIX
  └─ Run tests
```

**Documentation References**:
- Next.js production server: https://nextjs.org/docs/pages/api-reference/cli/next#production
- Playwright webServer: https://playwright.dev/docs/test-webserver
- CI/CD best practices: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1583*
