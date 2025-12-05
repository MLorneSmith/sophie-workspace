# Bug Fix: Staging Deploy Fails Due to Missing Environment Variables

**Related Diagnosis**: #929 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `test-full` job in `.github/workflows/staging-deploy.yml` is missing three required environment variables (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER`) that are validated at module load time by Zod schemas.
- **Fix Approach**: Add the missing environment variables to the `env:` block in the `test-full` job with appropriate test values.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging deployment workflow fails at the "Build application" step because three required environment variables are not defined. These variables are validated by Zod schemas in `account-invitations-dispatcher.service.ts` and `otp-email.service.ts` during the Next.js build process, causing the build to fail immediately with validation errors.

For full details, see diagnosis issue #929.

### Solution Approaches Considered

#### Option 1: Add Missing Environment Variables to test-full Job ⭐ RECOMMENDED

**Description**: Add the three missing environment variables (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER`) directly to the `env:` block in the `test-full` job with appropriate test values.

**Pros**:
- Simple one-line fix per variable (3 lines total)
- Minimal code change with no risk of unintended side effects
- Consistent with how other workflow jobs define environment variables
- Test values are appropriate for CI/CD environment
- Immediately resolves the build failure

**Cons**:
- None significant

**Risk Assessment**: low - Adding environment variables is a safe operation with no side effects

**Complexity**: simple - Just adding three environment variable definitions

#### Option 2: Source from Workflow Secrets/Variables

**Description**: Store these values in GitHub secrets/variables and reference them in the workflow using `${{ secrets.X }}` or `${{ vars.X }}` syntax.

**Pros**:
- Centralized configuration management
- Easier to update values across all workflows
- More secure for sensitive values

**Cons**:
- More configuration overhead
- For test values that don't need to be secrets, this is over-engineering
- These are not sensitive values (they're test URLs and product names)
- Adds complexity without benefit for CI test environment

**Why Not Chosen**: The values needed are not sensitive (test URLs, product names) and are specific to the test environment. Storing test configuration in secrets adds unnecessary complexity. Inline values are appropriate here.

#### Option 3: Use Template or Configuration File

**Description**: Create a shared configuration file that multiple jobs can reference to avoid duplication.

**Pros**:
- Single source of truth for environment configuration
- Easier maintenance if values change

**Cons**:
- YAML doesn't support environment variable interpolation from files
- Would require a custom script to load and export variables
- Significantly more complex for minimal benefit
- Project pattern is to define env vars directly in job blocks

**Why Not Chosen**: GitHub Actions workflows don't support shared environment configuration files. The current approach of defining env vars per job is the standard pattern.

### Selected Solution: Add Missing Environment Variables to test-full Job

**Justification**: This is the simplest, most direct solution that follows GitHub Actions best practices. The three values are not sensitive and are appropriate for a CI/CD test environment. Adding them directly to the job's `env:` block is consistent with how other environment variables are defined in the workflow.

**Technical Approach**:
- Add `NEXT_PUBLIC_SITE_URL` with value `http://localhost:3000` (standard local dev/test value)
- Add `NEXT_PUBLIC_PRODUCT_NAME` with value `SlideHeroes` (product name for test environment)
- Add `EMAIL_SENDER` with value `noreply@slideheroes.com` (noreply email for test environment)

These values are appropriate for the CI/CD test environment and match the patterns used in local development.

**Architecture Changes**: None - this is purely configuration

**Migration Strategy**: Not needed - this is a straightforward addition with no data or code migration

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Add three environment variables to the `test-full` job's `env:` block (lines 125-132)

### New Files

None

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Missing Environment Variables

Edit the `test-full` job's `env:` block to include the three missing variables:

- Add `NEXT_PUBLIC_SITE_URL: http://localhost:3000`
- Add `NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes`
- Add `EMAIL_SENDER: noreply@slideheroes.com`

Insert them after the existing `DO_NOT_TRACK: 1` line (line 132) to maintain consistency with the current structure.

**Why this step first**: This is the only change needed to fix the bug. All downstream steps depend on this being correct.

#### Step 2: Validate Workflow Syntax

- Run `pnpm exec @github/super-linter` or similar to validate YAML syntax (if available)
- Or manually verify YAML indentation is correct and matches existing variables

#### Step 3: Verify Fix Works

- Trigger the staging deployment workflow by pushing to the staging branch
- Monitor the "Full Test Suite" job to confirm it no longer fails at the "Build application" step
- Verify all subsequent jobs complete successfully

**Why this step last**: Need to ensure the fix actually resolves the issue before considering the fix complete.

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration change.

### Integration Tests

No integration tests needed - the fix will be validated by the workflow running successfully.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Workflow YAML is valid (no syntax errors)
- [ ] Environment variables are properly indented and formatted
- [ ] Trigger a test run of staging deployment (push to staging branch)
- [ ] Verify "Full Test Suite" job completes "Build application" step without errors
- [ ] Verify subsequent workflow jobs execute successfully
- [ ] Confirm E2E test suite runs without environment variable errors
- [ ] Check that no other workflow jobs are negatively affected

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect Environment Variable Format**: Using wrong format in YAML
   - **Likelihood**: low
   - **Impact**: workflow failure (same as current)
   - **Mitigation**: Use existing environment variables in same job as reference for correct format

2. **Wrong Test Values**: Using values that don't match what services expect
   - **Likelihood**: low
   - **Impact**: test failures during build or runtime
   - **Mitigation**: Values are standard test/local values already used in development; extracted from diagnosis which examined the schemas

3. **Accidental Duplicate Variables**: Adding variables that already exist elsewhere
   - **Likelihood**: very low
   - **Impact**: one overrides the other (YAML allows duplicates, last one wins)
   - **Mitigation**: Search workflow file to verify no duplicates exist; checked during file review

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit to `.github/workflows/staging-deploy.yml`
2. The workflow will return to previous behavior (build failure)
3. No data or state changes to roll back; safe to revert at any time

**Monitoring**: None required - this is a workflow configuration fix with no runtime implications

## Performance Impact

**Expected Impact**: none

This change only adds environment variable definitions. No performance impact on build time or test execution.

## Security Considerations

**Security Impact**: low

These environment variables are test/CI configuration values:
- `NEXT_PUBLIC_SITE_URL: http://localhost:3000` - localhost URL, publicly visible in workflow
- `NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes` - product name, not sensitive
- `EMAIL_SENDER: noreply@slideheroes.com` - noreply email, not sensitive

None of these are secrets or sensitive information. They are appropriate for a CI/CD environment and are already referenced in documentation.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug reproduces when the staging-deploy workflow runs:

```bash
# Check workflow run from GitHub Actions
# Visit: https://github.com/MLorneSmith/2025slideheroes/actions/runs/19972690271
# Expected: "Build application" step fails with ZodError for missing environment variables
```

**Expected Result**: Build fails with error message showing missing `siteURL`, `productName`, and `emailSender`

### After Fix (Bug Should Be Resolved)

```bash
# Validate workflow YAML syntax
pnpm exec prettier --write --parser=yaml .github/workflows/staging-deploy.yml

# Commit and push to staging branch
git add .github/workflows/staging-deploy.yml
git commit -m "fix(ci): add missing environment variables to staging deployment workflow"
git push origin staging

# Monitor workflow execution
# Visit: https://github.com/MLorneSmith/2025slideheroes/actions
# Expected: Full Test Suite job completes successfully with no environment variable errors
```

**Expected Result**:
- Workflow runs without YAML syntax errors
- "Build application" step completes successfully
- Full Test Suite job runs to completion
- All E2E tests execute without environment variable validation errors

### Regression Prevention

```bash
# After workflow succeeds, verify:
# 1. Workflow completed all jobs successfully
# 2. "Build application" step in test-full job has no errors
# 3. E2E tests ran and reported results (no build-time failures)
# 4. No other workflow jobs were negatively affected
```

## Dependencies

### New Dependencies

No new dependencies required

### Existing Workflow Dependencies

This fix depends on existing workflow infrastructure:
- GitHub Actions runner with Node.js environment
- pnpm and turbo for build
- Supabase and Stripe services already configured in workflow

## Database Changes

No database changes required

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes

## Success Criteria

The fix is complete when:
- [ ] Environment variables are added to `.github/workflows/staging-deploy.yml`
- [ ] YAML syntax is valid (no formatting errors)
- [ ] Staging deployment workflow executes successfully on next push to staging
- [ ] "Build application" step in test-full job completes without environment variable errors
- [ ] All subsequent workflow jobs complete successfully
- [ ] Zero regressions in other workflows or deployments

## Notes

- Values are extracted from the diagnosis issue (#929) which identified the missing variables
- The test values (`http://localhost:3000`, `SlideHeroes`, `noreply@slideheroes.com`) match patterns already used in local development configuration
- These variables are validated at module load time by Zod schemas, so they must be present during the build step
- The fix is minimal and low-risk, affecting only CI/CD configuration with no impact on production code

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #929*
