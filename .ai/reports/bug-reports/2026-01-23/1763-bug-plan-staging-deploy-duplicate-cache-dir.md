# Bug Fix: Staging deploy fails with duplicate --cache-dir argument

**Fix Plan Issue**: #1763
**Related Diagnosis**: #1762
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `--cache-dir=.turbo` argument is passed twice to Turbo CLI - once in package.json build script and again in artifact-sharing.yml workflow
- **Fix Approach**: Remove duplicate `--cache-dir=.turbo` from artifact-sharing.yml workflow
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Deploy to Staging workflow fails because the `--cache-dir=.turbo` flag is duplicated when artifact-sharing.yml calls `pnpm build --cache-dir=.turbo`, which expands the package.json build script that already contains `--cache-dir=.turbo`.

For full details, see diagnosis issue #1762.

### Solution Approaches Considered

#### Option 1: Remove --cache-dir from workflow ⭐ RECOMMENDED

**Description**: Remove `--cache-dir=.turbo` from `.github/workflows/artifact-sharing.yml` line 126, changing `pnpm build --cache-dir=.turbo` to `pnpm build`. The package.json build script already includes the flag.

**Pros**:
- Simplest fix - single line change
- Follows principle of single source of truth (package.json)
- Consistent with how other workflows call build
- Zero risk of breaking anything else

**Cons**:
- None

**Risk Assessment**: low - This is a surgical fix that simply removes a duplicate argument. The build will work exactly as intended since package.json already has the flag.

**Complexity**: simple - One line change in a workflow file.

#### Option 2: Remove --cache-dir from package.json and pass it in workflows

**Description**: Remove `--cache-dir=.turbo` from package.json build script and pass it explicitly in all workflows that need it.

**Pros**:
- Gives workflows explicit control over cache directory
- More flexible if different environments need different cache dirs

**Cons**:
- Requires changes to multiple workflows (staging-deploy.yml, production-deploy.yml, pr-validation.yml, etc.)
- More complex - need to audit all workflow files
- Higher risk of missing a workflow
- Goes against DRY principle

**Why Not Chosen**: Much more complex with higher risk and no real benefit. The package.json build script is the canonical location for build configuration.

#### Option 3: Use build:raw script in workflow

**Description**: Change artifact-sharing.yml to use `pnpm build:raw --cache-dir=.turbo` instead. The project already has a `build:raw` script that doesn't use the wrapper.

**Pros**:
- Gives workflow explicit control
- Avoids the build-wrapper if that's needed

**Cons**:
- More complex than just fixing the duplicate
- Bypasses the build-wrapper statusline tracking
- Inconsistent with local development build process

**Why Not Chosen**: Adds unnecessary complexity. The build-wrapper is intentional and provides statusline tracking benefits. No reason to bypass it.

### Selected Solution: Option 1 - Remove --cache-dir from workflow

**Justification**: This is the simplest, lowest-risk fix that addresses the root cause directly. The package.json build script is the single source of truth for how to build the application, and workflows should just invoke it without duplicating configuration.

**Technical Approach**:
- Remove the `--cache-dir=.turbo` argument from line 126 of `.github/workflows/artifact-sharing.yml`
- The build will work correctly because package.json already includes this flag
- No other changes needed

**Architecture Changes** (if any):
- None - this maintains the existing architecture where package.json defines the canonical build command

**Migration Strategy** (if needed):
- No migration needed - this is a pure bug fix

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/artifact-sharing.yml:126` - Remove `--cache-dir=.turbo` from the `pnpm build` command

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix the duplicate argument in artifact-sharing.yml

Modify the build command to remove the duplicate flag.

- Open `.github/workflows/artifact-sharing.yml`
- Navigate to line 126 in the "Build application" step
- Change `pnpm build --cache-dir=.turbo` to `pnpm build`
- Verify no other workflows have the same duplication pattern

**Why this step first**: This is the only required code change - it's the complete fix.

#### Step 2: Verify the fix with git diff

Confirm only the intended change was made.

- Run `git diff .github/workflows/artifact-sharing.yml`
- Verify only line 126 changed and it now reads `pnpm build`
- Verify no other unintended changes

#### Step 3: Test locally

Verify the build command works correctly.

- Run `pnpm build` locally to confirm it still works
- Verify it uses `.turbo` cache directory (from package.json)
- Confirm no error about duplicate arguments

#### Step 4: Validate workflow syntax

Ensure the workflow file is valid YAML and follows GitHub Actions syntax.

- Run `cat .github/workflows/artifact-sharing.yml | head -130 | tail -10` to view the changed section
- Verify YAML syntax is valid
- Confirm indentation is correct

#### Step 5: Create PR and test in CI

Push the fix and verify it works in the actual CI environment.

- Create a branch for the fix
- Commit the change with proper commit message format
- Push to GitHub
- Create PR to staging branch
- Monitor the Deploy to Staging workflow to confirm build succeeds

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration fix.

### Integration Tests

No integration tests needed - this is a workflow configuration fix.

### E2E Tests

No E2E tests needed - this is a workflow configuration fix.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [x] Local build verification: `pnpm build` succeeds
- [ ] Create PR to staging branch
- [ ] Verify Deploy to Staging workflow starts
- [ ] Verify "Build Application / Build or Reuse Artifacts" job succeeds
- [ ] Verify no error about duplicate `--cache-dir` argument
- [ ] Verify build artifacts are created and uploaded
- [ ] Verify subsequent deployment jobs proceed normally
- [ ] Check that Turbo cache is being used correctly
- [ ] Verify staging deployment completes successfully

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Build might fail for a different reason**: low
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The package.json build script is well-tested and used by all local development. This just removes a duplicate argument that was causing an error.

2. **Other workflows might have the same issue**: low
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Check other workflows during implementation. If found, fix them in the same PR.

**Rollback Plan**:

If this fix causes issues in CI (extremely unlikely):
1. Revert the commit
2. Re-add the `--cache-dir=.turbo` to the workflow
3. Investigate why the package.json flag isn't being respected

**Monitoring**:
- Watch the first Deploy to Staging run after this fix merges
- Confirm build succeeds and artifacts are created
- No ongoing monitoring needed after successful deployment

## Performance Impact

**Expected Impact**: none

This fix only removes a duplicate argument that was causing an immediate failure. There is zero performance impact - the build will work exactly the same as it was intended to work.

**Performance Testing**:
- Verify build time is normal (should be unchanged)
- Confirm Turbo cache is being used correctly

## Security Considerations

**Security Impact**: none

This is a pure configuration fix that removes a duplicate argument. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# The bug exists in CI, not locally
# To reproduce: push to staging branch and observe workflow failure
gh run list --repo slideheroes/2025slideheroes --workflow "Deploy to Staging" --limit 5
gh run view <failing-run-id> --log-failed | grep "cache-dir"
```

**Expected Result**: See error "the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times"

### After Fix (Bug Should Be Resolved)

```bash
# Validate workflow syntax
cat .github/workflows/artifact-sharing.yml | grep "pnpm build"

# Expected output should show: "pnpm build" (without --cache-dir)

# Test local build still works
pnpm build

# Verify it uses correct cache directory
ls -la .turbo/

# Push to staging and monitor workflow
gh workflow view "Deploy to Staging" --repo slideheroes/2025slideheroes
gh run watch <run-id>
```

**Expected Result**: All commands succeed, workflow builds successfully, no duplicate argument error.

### Regression Prevention

```bash
# Verify no similar issues in other workflows
grep -r "pnpm build --cache-dir" .github/workflows/

# Check if any other workflows have the same pattern
grep -r "pnpm.*--cache-dir" .github/workflows/ | grep -v "turbo.*--cache-dir"

# Verify package.json still has the flag
grep "\"build\":" package.json | grep "\-\-cache-dir"
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- This fix will naturally deploy when merged to staging
- No special steps needed
- The fix IS the deployment improvement

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [x] `.github/workflows/artifact-sharing.yml` line 126 changed from `pnpm build --cache-dir=.turbo` to `pnpm build`
- [ ] PR created and reviewed
- [ ] Deploy to Staging workflow runs successfully
- [ ] Build step completes without duplicate argument error
- [ ] Artifacts are created and uploaded correctly
- [ ] Deployment to staging completes successfully
- [ ] No regressions in other workflows

## Notes

**Why this bug existed**: This was a latent bug introduced in November 2025 when the build-wrapper was added to package.json with the `--cache-dir` flag, but the artifact-sharing.yml workflow (created in August 2025) already had the flag. The bug only surfaced when the workflow path that builds fresh artifacts (not reused) was executed.

**Similar issues to check**: During implementation, audit other workflows (production-deploy.yml, pr-validation.yml) to ensure they don't have similar duplicate arguments. They likely don't since they might use different build paths, but worth checking.

**Why Option 1 is best**: The package.json build script is the canonical way to build the application. All workflows should just call `pnpm build` without adding extra flags. This maintains consistency between local development and CI/CD.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1762*
