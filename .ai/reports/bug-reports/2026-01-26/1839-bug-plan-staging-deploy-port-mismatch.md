# Bug Fix: staging-deploy NEXT_PUBLIC_SITE_URL Port Mismatch

**Related Diagnosis**: #1838
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `NEXT_PUBLIC_SITE_URL` set to port 3000 during build but tests run app on port 3001
- **Fix Approach**: Change `NEXT_PUBLIC_SITE_URL` from `http://localhost:3000` to `http://localhost:3001` in test-setup job
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging-deploy workflow builds the application with `NEXT_PUBLIC_SITE_URL=http://localhost:3000` but runs E2E tests with the app on port 3001. Since `NEXT_PUBLIC_*` variables are baked into the client bundle at build time, auth components have the wrong URL embedded, causing form rendering failures.

For full details, see diagnosis issue #1838.

### Solution Approaches Considered

#### Option 1: Change Port to 3001 in test-setup Job ⭐ RECOMMENDED

**Description**: Update the `NEXT_PUBLIC_SITE_URL` environment variable in the test-setup job (line ~133 of staging-deploy.yml) from `http://localhost:3000` to `http://localhost:3001` to match the test runtime environment.

**Pros**:
- Minimal change (one line)
- Directly fixes the root cause
- Aligns with documented test architecture (E2E testing uses port 3001)
- Matches working e2e-sharded.yml pattern
- Zero risk of side effects

**Cons**:
- None identified

**Risk Assessment**: low - This is a simple configuration correction with no code changes

**Complexity**: simple - Single line change in YAML file

#### Option 2: Remove NEXT_PUBLIC_SITE_URL and Rely on .env.test

**Description**: Remove the `NEXT_PUBLIC_SITE_URL: http://localhost:3000` line from test-setup job entirely and let the build use `.env.test` which has the correct value (`http://localhost:3001`).

**Pros**:
- Follows DRY principle (don't repeat configuration)
- Reduces maintenance (fewer places to update)
- Matches e2e-sharded.yml approach (doesn't override NEXT_PUBLIC_SITE_URL)

**Cons**:
- Less explicit - requires understanding .env.test loading
- Relies on Next.js .env file precedence
- May be confusing to future maintainers who expect explicit CI config

**Why Not Chosen**: While this would work, being explicit in CI configuration is better for maintainability and debugging. CI configs should be self-documenting.

#### Option 3: Standardize on Port 3000 Everywhere

**Description**: Change all test infrastructure to use port 3000 instead of 3001.

**Why Not Chosen**: Port 3001 is the documented standard for E2E testing throughout the codebase (e2e-testing.md, docker-compose.test.yml, playwright configs). Changing this would require updates to multiple files (Docker configs, Playwright configs, .env.test, e2e-sharded.yml) and break the established dev (3000) vs test (3001) separation.

### Selected Solution: Change Port to 3001 in test-setup Job

**Justification**: This is the simplest, lowest-risk fix that directly addresses the root cause. It aligns the build-time environment variable with the runtime configuration, following the documented test architecture. The change is explicit and self-documenting in the CI configuration.

**Technical Approach**:
- Update single YAML line in staging-deploy.yml
- Change `NEXT_PUBLIC_SITE_URL: http://localhost:3000` to `NEXT_PUBLIC_SITE_URL: http://localhost:3001`
- No code changes, no test changes, no additional files

**Architecture Changes** (if any):
- None - this corrects an existing misconfiguration

**Migration Strategy** (if needed):
- Not needed - configuration-only change

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/staging-deploy.yml` - Update line ~133 to change `NEXT_PUBLIC_SITE_URL` from port 3000 to 3001 in test-setup job's env block

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update staging-deploy.yml Configuration

Update the test-setup job's environment configuration to use the correct port.

- Open `.github/workflows/staging-deploy.yml`
- Locate the `test-setup` job (around line 119)
- Find the `env:` block (around line 131)
- Change line ~133 from:
  ```yaml
  NEXT_PUBLIC_SITE_URL: http://localhost:3000
  ```
  to:
  ```yaml
  NEXT_PUBLIC_SITE_URL: http://localhost:3001
  ```

**Why this step first**: This is the only change needed - a single-line configuration fix.

#### Step 2: Verify Consistency Across Workflow

Confirm test-shards job already has correct configuration (it does).

- Check test-shards job `env:` block has `NEXT_PUBLIC_SITE_URL: http://localhost:3001` (line ~211)
- Check test-shards job has `PLAYWRIGHT_BASE_URL: http://localhost:3001` (line ~229)
- These are already correct - no changes needed

#### Step 3: Validate Against Documentation

Confirm the fix aligns with documented test architecture.

- Verify port 3001 matches `.env.test` configuration (✓ confirmed)
- Verify port 3001 matches e2e-testing.md documentation (✓ confirmed)
- Verify consistency with e2e-sharded.yml pattern (✓ confirmed)

#### Step 4: Test the Fix

Trigger staging-deploy workflow to verify E2E tests pass.

- Push change to a test branch
- Create PR to staging branch to trigger workflow
- Monitor E2E test shards (particularly shards 1, 2, 3 which were failing)
- Verify auth pages load correctly and form elements are found

#### Step 5: Validation

Run validation checks and merge fix.

- Confirm all E2E shards pass
- Verify zero regressions in other tests
- Merge to staging branch
- Update diagnosis issue #1838 with results

## Testing Strategy

### Unit Tests

No unit tests needed - this is a CI configuration change.

### Integration Tests

No integration tests needed - existing E2E tests will validate the fix.

### E2E Tests

The existing E2E test suite serves as the validation:

**Test files**:
- `apps/e2e/tests/smoke/smoke.spec.ts` - Shard 1 (was failing, should pass)
- `apps/e2e/tests/authentication/*.spec.ts` - Shard 2 (was failing, should pass)
- `apps/e2e/tests/account/*.spec.ts` - Shard 3 (was failing, should pass)
- All other shards - Should continue passing

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger staging-deploy workflow with the fix
- [ ] Monitor E2E Shard 1 (Smoke Tests) - should pass
- [ ] Monitor E2E Shard 2 (Auth Tests) - should pass
- [ ] Monitor E2E Shard 3 (Account Tests) - should pass
- [ ] Verify all 12 shards complete successfully
- [ ] Check test logs confirm `NEXT_PUBLIC_SITE_URL: http://localhost:3001` in build step
- [ ] Verify auth form elements are found (`[data-testid="sign-in-email"]`)
- [ ] Confirm zero new failures introduced

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect Port Change**: Changing to wrong port or making typo
   - **Likelihood**: low
   - **Impact**: medium (would continue failing tests)
   - **Mitigation**: Simple review of one-line change, automated E2E tests will catch any errors

2. **Unexpected Side Effects**: Other parts of build process depend on port 3000
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: Port 3000 is used for dev server, not test environment. Test environment should always use 3001 per documentation.

**Rollback Plan**:

If this fix causes issues (extremely unlikely):
1. Revert the single-line change back to port 3000
2. Push revert commit to staging
3. Investigate why port 3001 caused issues (would indicate larger problem)

**Monitoring** (if needed):
- Monitor staging-deploy workflow runs for the next 3-5 executions
- Watch for any new E2E test failures
- No production monitoring needed (doesn't affect production)

## Performance Impact

**Expected Impact**: none

No performance implications - this is a configuration correction that allows tests to run correctly. Build time and test execution time remain unchanged.

**Performance Testing**:
- Not applicable - configuration-only change

## Security Considerations

**Security Impact**: none

This fix corrects an environment variable used for build-time URL configuration in testing. No security implications as:
- Both ports (3000 and 3001) are localhost-only in CI
- No production configuration affected
- No authentication or authorization logic changed
- No data access patterns modified

Security review needed: no
Penetration testing needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger staging-deploy workflow
git push origin staging

# Check workflow run
gh run watch

# Expected: Shards 1, 2, 3 fail with "element not found" errors
gh run view --log-failed
```

**Expected Result**: E2E test failures on auth pages - form elements not found

### After Fix (Bug Should Be Resolved)

```bash
# Check the fix is in place
grep "NEXT_PUBLIC_SITE_URL" .github/workflows/staging-deploy.yml

# Expected output should show port 3001 in test-setup job:
# NEXT_PUBLIC_SITE_URL: http://localhost:3001

# Trigger staging-deploy workflow
git push origin staging

# Monitor workflow
gh run watch

# View results
gh run view --log

# All E2E shards should pass
gh run view --json conclusion
```

**Expected Result**: All E2E test shards pass, auth form elements found successfully

### Regression Prevention

```bash
# Confirm configuration consistency
grep -n "NEXT_PUBLIC_SITE_URL.*3001" .github/workflows/staging-deploy.yml
# Should show matches in both test-setup and test-shards jobs

# Confirm no references to port 3000 in test context
grep -n "localhost:3000" .github/workflows/staging-deploy.yml
# Should only appear in comments or non-test contexts, if at all

# Run full staging-deploy workflow
gh workflow run staging-deploy.yml --ref staging

# Verify all checks pass
gh run list --workflow=staging-deploy.yml --limit 1
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a CI configuration change
- Fix takes effect immediately when merged to staging branch
- Next staging-deploy workflow run will use corrected configuration

**Feature flags needed**: no

**Backwards compatibility**: maintained (no code changes)

## Success Criteria

The fix is complete when:
- [x] `NEXT_PUBLIC_SITE_URL` changed to `http://localhost:3001` in test-setup job
- [ ] Staging-deploy workflow triggered successfully
- [ ] E2E Shard 1 (Smoke Tests) passes
- [ ] E2E Shard 2 (Auth Tests) passes
- [ ] E2E Shard 3 (Account Tests) passes
- [ ] All 12 E2E shards complete successfully
- [ ] Zero new test failures introduced
- [ ] Build logs show correct port (3001) in `NEXT_PUBLIC_SITE_URL`
- [ ] Auth form elements successfully located in tests
- [ ] Diagnosis issue #1838 updated and closed

## Notes

### Why Port 3001?

From e2e-testing.md documentation:
> SlideHeroes uses separate application servers to enable parallel development and testing:
> - Dev Server: Port 3000 (host-based, pnpm dev)
> - Test Server: Port 3001 (Docker container, docker-compose.test.yml)

The test environment standardizes on port 3001 to avoid conflicts with local development servers and to match Docker container configurations.

### Working Example

The e2e-sharded.yml workflow does NOT override `NEXT_PUBLIC_SITE_URL` in its build step, allowing it to use the value from `.env.test` which correctly sets port 3001. This staging-deploy fix explicitly sets it to 3001 for clarity in CI configuration.

### Related Documentation

- **E2E Testing Architecture**: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- **CI/CD Pipeline**: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- **Environment Configuration**: `apps/web/.env.test` (has `NEXT_PUBLIC_SITE_URL=http://localhost:3001`)

### Links to Similar Fixes

- #1830, #1832 - Previous port 3001 configuration fixes in staging-deploy workflow

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1838*
