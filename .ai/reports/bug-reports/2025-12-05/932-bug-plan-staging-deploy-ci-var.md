# Bug Fix: Add NEXT_PUBLIC_CI to Staging Deploy Workflow

**Related Diagnosis**: #931
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `NEXT_PUBLIC_CI` environment variable causes HTTPS URL validation to be enforced during CI builds
- **Fix Approach**: Add `NEXT_PUBLIC_CI: true` to the `test-full` job's environment block
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging deployment workflow fails during build because Next.js forces `NODE_ENV=production` during builds, which triggers HTTPS URL validation. The `NEXT_PUBLIC_CI` environment variable that would bypass this check is not set in the workflow.

For full details, see diagnosis issue #931.

### Solution Approaches Considered

#### Option 1: Add NEXT_PUBLIC_CI Environment Variable ⭐ RECOMMENDED

**Description**: Add `NEXT_PUBLIC_CI: true` to the `test-full` job's `env:` block in `.github/workflows/staging-deploy.yml`. This signals to the application that it's running in CI and bypasses HTTPS URL validation.

**Pros**:
- Minimal change (single line addition)
- Follows existing pattern used elsewhere in codebase (`next.config.mjs:64`, `billing-gateway-provider-factory.ts:20`)
- Properly signals CI environment to the application
- No changes to application code needed
- Works for test builds in CI regardless of URL protocol

**Cons**:
- None significant

**Risk Assessment**: low - This is the standard pattern for CI environments. The variable is already used in multiple places in the codebase.

**Complexity**: simple - Single environment variable addition

#### Option 2: Change NEXT_PUBLIC_SITE_URL to HTTPS

**Description**: Change `NEXT_PUBLIC_SITE_URL` from `http://localhost:3000` to `https://localhost:3000` or a staging URL.

**Pros**:
- Satisfies HTTPS validation without bypassing checks
- Closer to production configuration

**Cons**:
- HTTPS URLs for localhost don't make semantic sense for local test builds
- May require additional SSL certificate setup for localhost
- Doesn't address the underlying pattern that CI builds should bypass strict production validations
- Less flexible for different CI environments

**Why Not Chosen**: The NEXT_PUBLIC_CI flag is the proper way to signal CI environment. Using HTTPS for localhost test builds is not semantically correct.

#### Option 3: Modify Zod Schema Validation Logic

**Description**: Change the validation logic in `apps/web/config/app.config.ts` to be more permissive.

**Why Not Chosen**: The validation logic is correct - it should enforce HTTPS in production but allow HTTP in CI/test environments. Changing the schema would weaken security checks. The proper solution is to set the CI flag.

### Selected Solution: Add NEXT_PUBLIC_CI Environment Variable

**Justification**: This is the correct pattern for CI environments. The codebase already uses this flag in multiple places, and it properly signals to the application that strict production validations should be relaxed. It's minimal, safe, and follows established conventions.

**Technical Approach**:
- Add `NEXT_PUBLIC_CI: true` to the `env:` block in the `test-full` job
- This sets `process.env.NEXT_PUBLIC_CI = "true"` during the build
- The Zod schema refinement at `apps/web/config/app.config.ts:52-66` evaluates `isCI ?? !schema.production`
- Since `isCI = "true"` (truthy string), the condition returns `true` and skips HTTPS validation
- The HTTP URL `http://localhost:3000` is accepted

**Architecture Changes**: None - this is a configuration change only.

**Migration Strategy**: Not needed - this is additive only.

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Add `NEXT_PUBLIC_CI: true` to `test-full` job's `env:` block (after line 125)

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add NEXT_PUBLIC_CI Environment Variable

Add the environment variable to the `test-full` job in the staging deploy workflow.

- Open `.github/workflows/staging-deploy.yml`
- Locate the `test-full` job's `env:` block (lines 125-136)
- Add `NEXT_PUBLIC_CI: true` as the first environment variable (for visibility)
- Add a comment explaining its purpose

**Why this step first**: This is the core fix - no preparatory work needed.

#### Step 2: Validate YAML Syntax

Ensure the YAML file is still valid after the change.

- Run `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/staging-deploy.yml'))"` to validate syntax
- Verify no parsing errors

#### Step 3: Commit Changes

Create a properly formatted commit.

- Stage the workflow file
- Commit with conventional commit format referencing issue #931
- Push to dev branch

#### Step 4: Test on Staging

Trigger the staging deployment to verify the fix.

- Force push dev to staging branch
- Monitor the workflow run
- Verify the `test-full` job's "Build application" step succeeds
- Verify the full workflow completes successfully

#### Step 5: Validation

Confirm the fix resolves the issue completely.

- Check workflow logs show `NEXT_PUBLIC_CI: true` in environment
- Verify build succeeds without HTTPS URL errors
- Confirm no regressions in other workflow jobs
- Verify staging deployment completes end-to-end

## Testing Strategy

### Unit Tests

No unit tests needed - this is a CI configuration change.

### Integration Tests

The staging workflow itself serves as the integration test.

### E2E Tests

The E2E tests run as part of the staging workflow and will validate the fix.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (staging deploy should fail without NEXT_PUBLIC_CI)
- [ ] Apply fix and push to staging
- [ ] Verify `test-full` job shows `NEXT_PUBLIC_CI: true` in env dump
- [ ] Verify "Build application" step completes successfully
- [ ] Verify no HTTPS URL validation errors in logs
- [ ] Verify full staging deploy completes successfully
- [ ] Verify web app deploys to Vercel staging
- [ ] Verify Payload CMS deploys to Vercel staging
- [ ] Check that all subsequent jobs (smoke tests, security scans, etc.) complete

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **YAML Syntax Error**: Malformed YAML could break the workflow
   - **Likelihood**: low
   - **Impact**: medium (workflow would fail to start)
   - **Mitigation**: Validate YAML syntax before committing. GitHub also validates on push.

2. **Unintended Side Effects**: Setting NEXT_PUBLIC_CI might affect other parts of the build
   - **Likelihood**: low
   - **Impact**: low (flag is already used elsewhere safely)
   - **Mitigation**: Review all usages of NEXT_PUBLIC_CI in codebase (already done - used in 3 places consistently)

**Rollback Plan**:

If this fix causes issues in staging deployment:
1. Revert the commit: `git revert <commit-sha>`
2. Push revert to dev and staging
3. Investigate any unexpected behavior
4. Re-evaluate solution approach

**Monitoring**:
- Monitor staging workflow runs after the fix
- Watch for any new errors related to CI environment detection
- Verify no degradation in test coverage or reliability

## Performance Impact

**Expected Impact**: none

No performance implications - this only affects build-time configuration validation.

**Performance Testing**: Not applicable.

## Security Considerations

**Security Impact**: none

This change relaxes HTTPS validation **only during CI builds**, which is appropriate. Production builds and runtime behavior are unaffected.

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger staging deploy without the fix
git push origin dev:staging --force

# Monitor workflow - should fail at "Build application" step
gh run watch
```

**Expected Result**: Build fails with HTTPS URL validation error.

### After Fix (Bug Should Be Resolved)

```bash
# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/staging-deploy.yml'))"

# Commit and push fix
git add .github/workflows/staging-deploy.yml
git commit -m "fix(ci): add NEXT_PUBLIC_CI to staging deploy test-full job"
git push origin dev

# Trigger staging deploy
git push origin dev:staging --force

# Monitor workflow - should succeed
gh run watch
```

**Expected Result**:
- YAML validation succeeds
- Staging workflow runs successfully
- Build application step completes without errors
- Full deployment completes to Vercel staging

### Regression Prevention

```bash
# Verify workflow file is valid
yamllint .github/workflows/staging-deploy.yml

# Check for any uncommitted changes
git status

# Verify dev branch is clean
git diff --stat
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a workflow configuration change that takes effect on next push to staging.

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is additive only, doesn't change existing behavior.

## Success Criteria

The fix is complete when:
- [x] `NEXT_PUBLIC_CI: true` added to staging-deploy.yml
- [ ] YAML syntax is valid
- [ ] Workflow runs successfully on staging
- [ ] Build application step completes without HTTPS errors
- [ ] Full staging deployment completes end-to-end
- [ ] No regressions in other workflow jobs
- [ ] Web and Payload apps deploy to Vercel staging

## Notes

**Pattern Consistency**: This fix aligns with the existing pattern used in:
- `apps/web/next.config.mjs:64` - Uses `NEXT_PUBLIC_CI` to skip strict checks
- `packages/billing/gateway/src/server/services/billing-gateway/billing-gateway-provider-factory.ts:20` - Uses `NEXT_PUBLIC_CI` to use mock provider

**Why NEXT_PUBLIC_CI**: The `NEXT_PUBLIC_` prefix makes this variable available in both server and client code during build. While this particular usage is server-side only, using the public prefix ensures consistency and allows the flag to be checked anywhere in the build process.

**Alternative Considered**: We could have used a non-public `CI` variable, but `NEXT_PUBLIC_CI` is the established pattern in this codebase.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #931*
