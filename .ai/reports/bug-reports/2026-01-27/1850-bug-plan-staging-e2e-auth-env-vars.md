# Bug Fix: Staging E2E Tests Failing Due to Missing NEXT_PUBLIC_AUTH_PASSWORD Environment Variable

**Related Diagnosis**: #1849 (CLOSED)
**Bug Fix Issue**: #1850
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `NEXT_PUBLIC_AUTH_PASSWORD` environment variable missing from test-setup job build step in staging-deploy.yml and e2e-sharded.yml workflows
- **Fix Approach**: Add missing `NEXT_PUBLIC_AUTH_*` environment variables to CI workflow build environment configuration
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging-deploy and e2e-sharded workflows' E2E tests are failing because password authentication form fields are not rendered on sign-in/sign-up pages. This is a regression caused by missing environment variables during the application build step. Since `NEXT_PUBLIC_*` variables are baked into the client bundle at build time, the password authentication provider gets disabled, resulting in sign-up/sign-in pages that only show OAuth buttons without email/password form fields.

For full details, see diagnosis issue #1849.

### Solution Approaches Considered

#### Option 1: Add Environment Variables to Workflow Env Blocks ⭐ RECOMMENDED

**Description**: Add `NEXT_PUBLIC_AUTH_PASSWORD`, `NEXT_PUBLIC_AUTH_MAGIC_LINK`, and `NEXT_PUBLIC_AUTH_OTP` environment variables to the build job's env block in both staging-deploy.yml and e2e-sharded.yml workflows.

**Pros**:
- Minimal change (3 lines per workflow)
- Directly fixes the root cause
- Aligns with existing pattern of explicit environment variables in CI
- No code changes needed
- CI configuration becomes self-documenting (shows what's needed for tests)
- Matches the `.env.test` configuration

**Cons**:
- Requires updating two separate workflow files
- Must remember to update if auth configuration logic changes

**Risk Assessment**: low - Simple YAML configuration change with no code impact

**Complexity**: simple - Three new environment variable lines in existing YAML structure

#### Option 2: Create Shared Environment Variables File

**Description**: Extract common CI environment variables into a separate YAML file that both workflows can reference, reducing duplication.

**Pros**:
- Single source of truth for environment variables
- Easier to maintain if many variables need updating
- Reduces duplication

**Cons**:
- Adds complexity for a simple fix
- GitHub Actions doesn't natively support reusing env blocks (would need custom action)
- Adds an extra file to maintain
- Over-engineering for this specific issue

**Why Not Chosen**: GitHub Actions doesn't have built-in env block reuse. While a custom action could be created, this would significantly overcomplicate a simple 3-line fix. The standard pattern in this codebase is explicit environment variables in each workflow.

#### Option 3: Rely Only on .env.test File

**Description**: Don't set variables explicitly in workflows, instead ensure `.env.test` is loaded during the build.

**Pros**:
- No YAML changes needed
- Simplest on paper

**Cons**:
- `.env.test` is gitignored and won't be available in CI
- Next.js doesn't automatically load `.env.test` unless explicitly configured
- Would require additional configuration changes
- Less explicit - harder to debug CI environment issues

**Why Not Chosen**: The `.env.test` file is gitignored for security reasons and won't be available in CI. This approach would require additional configuration that's more complex than the direct fix.

### Selected Solution: Add Environment Variables to Workflow Env Blocks

**Justification**: This is the simplest, most direct fix that addresses the root cause. It requires minimal changes (3 environment variable lines per workflow), has zero risk, requires no code changes, and follows the existing codebase pattern of explicit environment configuration in CI workflows. It's transparent and self-documenting.

**Technical Approach**:
- Add `NEXT_PUBLIC_AUTH_PASSWORD: 'true'` to the test-setup job env block in staging-deploy.yml
- Add `NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'` to the test-setup job env block in staging-deploy.yml
- Add `NEXT_PUBLIC_AUTH_OTP: 'false'` to the test-setup job env block in staging-deploy.yml
- Repeat the same changes in e2e-sharded.yml for the setup-server job's build step env

**Architecture Changes**: None - pure configuration fix

**Migration Strategy**: Not needed - configuration-only change with no data implications

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - test-setup job env block (lines 131-139)
- `.github/workflows/e2e-sharded.yml` - setup-server job build step env block (lines 174-185)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update staging-deploy.yml test-setup job

Update the env block in the test-setup job to add missing authentication configuration:

- Open `.github/workflows/staging-deploy.yml`
- Locate the `test-setup` job (line 119)
- Find the `env:` block (line 131)
- After the existing environment variables, add:
  ```yaml
  NEXT_PUBLIC_AUTH_PASSWORD: 'true'
  NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'
  NEXT_PUBLIC_AUTH_OTP: 'false'
  ```
- These should be added after `STRIPE_WEBHOOK_SECRET` and before the `steps:` section

**Why this step first**: This is the primary workflow file that was mentioned in the diagnosis

#### Step 2: Update e2e-sharded.yml setup-server job

Update the build step env configuration in the setup-server job:

- Open `.github/workflows/e2e-sharded.yml`
- Locate the `setup-server` job (line 65)
- Find the `Build application` step (line 169)
- Update the `env:` block to add:
  ```yaml
  NEXT_PUBLIC_AUTH_PASSWORD: 'true'
  NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'
  NEXT_PUBLIC_AUTH_OTP: 'false'
  ```
- Add these after the existing environment variables

**Why this step second**: The e2e-sharded workflow also had the same issue and needs the same fix

#### Step 3: Verify Both Workflows Have Consistent Configuration

Compare the authentication configuration in both workflows:

- Verify both have `NEXT_PUBLIC_AUTH_PASSWORD: 'true'`
- Verify both have `NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'`
- Verify both have `NEXT_PUBLIC_AUTH_OTP: 'false'`
- These should match the values in `.env.test.locked` (line 31-33)

**Why this step**: Ensures consistency and prevents future divergence

#### Step 4: Validate Syntax

Ensure YAML syntax is correct:

- Run a quick YAML validation on the modified files
- Check that indentation is consistent with surrounding lines (2-space indentation)
- Verify no trailing whitespace or syntax errors

**Why this step**: YAML syntax errors could break workflows

#### Step 5: Test the Fix

Trigger the workflows to verify the fix works:

- Push changes to a test branch
- Create a PR to the staging branch to trigger e2e-sharded workflow
- Wait for `setup-server` job to complete
- Verify the Build application step shows the correct auth environment variables
- Monitor test shards - they should now find the email form fields

**Why this step**: Confirms the fix resolves the issue

## Testing Strategy

### Unit Tests

Not applicable - this is a CI configuration change, not code changes.

### Integration Tests

Not applicable - configuration-only change.

### E2E Tests

The existing E2E test suite serves as the validation:

**Test files**:
- `apps/e2e/tests/authentication/*.spec.ts` - Auth tests that look for `[data-testid="sign-in-email"]` and `[data-testid="sign-up-email"]`
- `apps/e2e/tests/smoke/smoke.spec.ts` - Smoke tests covering sign-up flow

**Expected behavior after fix**:
- E2E tests should be able to locate the email form fields
- Tests should no longer timeout waiting for `[data-testid="sign-up-email"]`
- Form submission tests should proceed instead of failing

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push changes to test branch
- [ ] Create PR to staging branch
- [ ] Monitor e2e-sharded workflow execution
- [ ] Verify setup-server job completes successfully
- [ ] Check that `Build application` step shows new auth environment variables in logs
- [ ] Verify E2E Shard 1 (Smoke Tests) passes
- [ ] Verify E2E Shard 2 (Authentication Tests) passes
- [ ] Verify E2E Shard 3 (Account Tests) passes
- [ ] Check all 12 shards complete or execute E2E tests
- [ ] Verify no new test failures introduced
- [ ] Confirm staging-deploy workflow also works with the fix

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **YAML Syntax Error**: Incorrect indentation or syntax in modified env blocks
   - **Likelihood**: low (simple YAML structure, easy to verify)
   - **Impact**: medium (workflow would fail to execute)
   - **Mitigation**: Careful indentation matching surrounding code, YAML linting before commit

2. **Inconsistent Configuration**: The two workflows end up with different auth settings
   - **Likelihood**: very low (copy-paste pattern)
   - **Impact**: medium (e2e-sharded tests would work but staging-deploy wouldn't, or vice versa)
   - **Mitigation**: Step 3 validates consistency, code review catches differences

3. **Missing Other Environment Variables**: Could there be other missing variables?
   - **Likelihood**: low (diagnosis clearly identified the root cause)
   - **Impact**: low (any other issues would surface in test runs)
   - **Mitigation**: Monitor test execution after fix, address additional issues if found

**Rollback Plan**:

If this fix causes unexpected issues (extremely unlikely):

1. Revert the two modified workflow files to previous version
2. Push revert commit to dev/staging branch
3. Workflows will revert to previous behavior
4. No data or production impact

**Monitoring** (if needed):

After deploying the fix:
- Monitor next 3-5 staging-deploy and e2e-sharded workflow runs
- Watch for E2E test pass rates (should improve significantly)
- Check for any new environment variable-related errors in logs
- No production monitoring needed (doesn't affect production)

## Performance Impact

**Expected Impact**: none

Environment variables are loaded during workflow execution and build time - they have no runtime performance impact on the application.

## Security Considerations

**Security Impact**: none

- These are non-sensitive environment variables (auth method toggles: true/false)
- Values are public configuration, not secrets
- Only control which authentication methods are enabled in test environment
- No authentication credentials or API keys involved

Security review needed: no
Penetration testing needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger staging-deploy workflow
git push origin dev:staging

# Monitor workflow
gh run watch

# Check specific shard failure (example: Shard 2)
gh run view <run-id> --job <shard-2-job-id> --log

# Expected Result: Playwright error "element(s) not found" for data-testid="sign-up-email"
```

**Expected Result**: E2E tests fail with "element not found" errors for email form fields

### After Fix (Bug Should Be Resolved)

```bash
# Verify files are modified correctly
grep -n "NEXT_PUBLIC_AUTH_PASSWORD" .github/workflows/staging-deploy.yml
grep -n "NEXT_PUBLIC_AUTH_PASSWORD" .github/workflows/e2e-sharded.yml

# Expected output: Both files should show the new variables

# Trigger test workflows
git push origin dev:staging

# Monitor execution
gh run watch

# Verify test-setup job shows new environment variables
gh run view <run-id> --job <test-setup-job-id> --log | grep "NEXT_PUBLIC_AUTH"

# Check shard results
gh run view <run-id> --json conclusion

# Verify Playwright report shows form fields
# (can be viewed in GitHub Actions artifacts)
```

**Expected Result**: All validation commands succeed, E2E tests pass, form fields are found and rendered

### Regression Prevention

```bash
# Run a full workflow cycle
git push origin staging

# Verify all shards pass
gh run list --workflow=staging-deploy.yml --limit 1 | grep success

# Confirm no new environment variable errors
gh run view <latest-run-id> --log | grep -i "undefined.*NEXT_PUBLIC"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - this is a configuration-only change using existing build process

## Database Changes

**No database changes required** - configuration-only change

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a CI configuration change
- Fix takes effect immediately when merged
- No configuration reload or deployment needed

**Feature flags needed**: no

**Backwards compatibility**: maintained (no code changes)

## Success Criteria

The fix is complete when:
- [ ] Both workflow files have been updated with auth environment variables
- [ ] YAML syntax is valid in both files
- [ ] Environment variables match `.env.test.locked` configuration
- [ ] Code review approved (if required)
- [ ] Staging-deploy workflow triggered successfully
- [ ] E2E test shards 1-6 complete (or pass E2E tests)
- [ ] Test Playwright reports show email form fields present
- [ ] Zero new test failures introduced
- [ ] No environment variable-related errors in logs
- [ ] Diagnosis issue #1849 updated and closed

## Notes

### Why This Bug Happened

The `.env.test` file (which contains `NEXT_PUBLIC_AUTH_PASSWORD=true`) is gitignored for security reasons and isn't available in CI. When the CI/CD workflows were recently refactored to improve E2E testing, the new job environment blocks didn't explicitly include the auth configuration variables. The `build:test` script sets `NODE_ENV=test` but Next.js can't load a gitignored `.env.test` file, so the variables default to undefined.

### Pattern for Future Development

This bug reveals an important pattern: **All `NEXT_PUBLIC_*` variables needed at build time MUST be explicitly set in CI environment configurations** since `.env.*` files may be gitignored. Future CI changes should reference `.env.test.locked` (which IS committed) as the source of truth for required environment variables.

### Related Documentation

- **CI/CD Pipeline**: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- **Test Environment Config**: `apps/web/.env.test.locked` (reference for expected values)
- **Auth Configuration**: `apps/web/config/auth.config.ts` (reads these env vars)

### Related Issues

- #1839 - NEXT_PUBLIC_SITE_URL Port Mismatch (similar env var issue)
- #1826 - Missing Environment Variables in staging-deploy (predecessor issue)
- #1838 - Port Mismatch Diagnosis

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1849*
