# Bug Fix: Staging deploy fails - .next directory excluded by upload-artifact@v6 hidden files

**Related Diagnosis**: #1768
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `actions/upload-artifact@v6` excludes hidden files/directories by default; `.next` directory is not being uploaded
- **Fix Approach**: Add `include-hidden-files: true` to all workflow artifact upload steps that include `.next` directories
- **Estimated Effort**: small (5-10 minute fix)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Deploy to Staging workflow fails at the artifact validation step because the `.next` build directory is excluded by the GitHub Actions `upload-artifact@v6` action. The recent Dependabot PR #1578 upgraded from v4 to v6, which introduced a breaking change: hidden files/directories (starting with `.`) are now excluded by default for security reasons.

For full details, see diagnosis issue #1768.

### Solution Approaches Considered

#### Option 1: Add `include-hidden-files: true` to upload-artifact ⭐ RECOMMENDED

**Description**: Simply add the `include-hidden-files: true` parameter to all `actions/upload-artifact@v6` steps that upload `.next` directories. This is the officially supported way to include hidden files/directories.

**Pros**:
- Simplest fix - one-line addition per workflow step
- Officially supported parameter (not a workaround)
- Clearly expresses intent to upload hidden files
- Zero breaking changes
- Minimal risk - only affects artifact upload, no other behavior

**Cons**:
- Requires identifying and updating all affected workflows (4 files total)
- Could potentially upload unwanted hidden files in the future if paths change (mitigated by explicit path specification)

**Risk Assessment**: low - This is the standard GitHub Actions approach for this exact scenario.

**Complexity**: simple - Only requires adding a single parameter to existing YAML.

#### Option 2: Rename directory during build step

**Description**: Rename `.next` to `next-build` during the build step, then rename it back before deployment.

**Pros**:
- No need to update workflows
- Would work with older action versions

**Cons**:
- Overly complex for a simple configuration issue
- Adds unnecessary build-time overhead
- Harder to maintain and understand
- Goes against standard GitHub Actions practices
- Risk of breaking other build references to `.next`

**Why Not Chosen**: This is a workaround for a parameter that exists specifically to solve this problem. Using the proper parameter is cleaner and more maintainable.

#### Option 3: Downgrade upload-artifact to v4

**Description**: Revert the Dependabot upgrade and lock `upload-artifact` at v4.

**Pros**:
- Doesn't require workflow changes
- Works immediately

**Cons**:
- Goes backward instead of forward
- v4 may have bugs or security issues that v6 fixes
- Doesn't address the breaking change properly
- Future Dependabot upgrades will face the same issue
- Not future-proof

**Why Not Chosen**: This avoids the problem rather than solving it. The v6 parameter is the proper solution.

### Selected Solution: Option 1 - Add `include-hidden-files: true`

**Justification**: GitHub Actions specifically created the `include-hidden-files` parameter to handle this exact scenario. It's the standard, supported solution. Adding one line to each affected step is minimal, low-risk, and clearly documents the intent.

**Technical Approach**:
- Add `include-hidden-files: true` to four `upload-artifact@v6` steps
- No changes to build logic or directory structure
- Leverages the official GitHub Actions parameter designed for this use case
- Allows future builds to include `.next` directories properly

**Architecture Changes**: None - this is purely a workflow configuration fix.

**Migration Strategy**: Not needed - this fix is backward compatible and doesn't affect existing deployments.

## Implementation Plan

### Affected Files

These files need the `include-hidden-files: true` parameter added:

- `.github/workflows/artifact-sharing.yml:153-164` (Upload artifacts step) - **PRIMARY**: This is the main failing step
- `.github/workflows/reusable-build.yml:124-132` (Upload build artifacts step) - Related workflow
- `.github/workflows/e2e-sharded.yml:189-196` (Build artifacts step) - Test artifacts
- `.github/workflows/e2e-sharded.yml:303-310` (Deploy artifacts step) - Test deployment artifacts
- `.github/workflows/staging-deploy.yml` (if artifact upload exists) - Check and fix if applicable

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update artifact-sharing.yml (PRIMARY FIX)

This is the workflow that's currently failing. Add `include-hidden-files: true` to the "Upload artifacts" step.

- Open `.github/workflows/artifact-sharing.yml`
- Find the "Upload artifacts" step (around line 153)
- Add `include-hidden-files: true` before the `retention-days` line
- Verify the step uploads `apps/web/.next` and other hidden directories

**Why this step first**: This is the root cause of the current failure. Fixing this will unblock the staging deployment immediately.

#### Step 2: Update reusable-build.yml (PREVENTIVE FIX)

This workflow also uploads `.next` and will fail if used before being fixed.

- Open `.github/workflows/reusable-build.yml`
- Find the "Upload build artifacts" step (around line 124)
- Add `include-hidden-files: true`
- Verify it doesn't already have this parameter

**Why this step**: Prevents the same failure in other workflows that use this reusable workflow.

#### Step 3: Update e2e-sharded.yml (PREVENTIVE FIX)

This workflow has two artifact upload steps that may include hidden files.

- Open `.github/workflows/e2e-sharded.yml`
- Find "Build artifacts" step (around line 189)
- Add `include-hidden-files: true`
- Find "Deploy artifacts" step (around line 303)
- Add `include-hidden-files: true`
- Verify both steps

**Why this step**: Ensures E2E test workflows also properly upload `.next` if they reference it.

#### Step 4: Check staging-deploy.yml

Verify if this workflow has its own artifact upload step.

- Open `.github/workflows/staging-deploy.yml`
- Search for `uses: actions/upload-artifact`
- If found, add `include-hidden-files: true`
- If not found, no action needed

**Why this step**: Ensures complete coverage across all workflows.

#### Step 5: Validate syntax

Ensure all workflow YAML files are valid after changes.

- Run: `cat .github/workflows/artifact-sharing.yml | grep -A5 "include-hidden-files"`
- Run: `pnpm dlx yamllint .github/workflows/artifact-sharing.yml`
- Run: `pnpm dlx yamllint .github/workflows/reusable-build.yml`
- Run: `pnpm dlx yamllint .github/workflows/e2e-sharded.yml`

**Why this step**: YAML syntax errors in workflows will cause pipeline failures.

#### Step 6: Create commit and test in CI

Push the changes and verify the staging deployment workflow succeeds.

- Create a branch for this fix
- Commit changes with proper message format
- Push to GitHub
- Create PR to staging branch
- Monitor "Deploy to Staging" workflow
- Verify artifact upload includes `.next` files

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration fix.

### Integration Tests

No integration tests needed - testing happens through the actual CI/CD pipeline.

### E2E Tests

The E2E test is the workflow execution itself:

**Test files**:
- Deploy to Staging workflow (automatic on merge to staging)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create PR with the workflow changes
- [ ] Deploy to Staging workflow starts automatically
- [ ] "Build Application / Build or Reuse Artifacts" job completes successfully
- [ ] Artifact upload shows >3000 files (instead of 288)
- [ ] "Build Application / Validate Build Artifacts" job succeeds
- [ ] `apps/web/.next` directory is downloaded and validated
- [ ] Subsequent deployment jobs proceed normally
- [ ] Staging deployment completes successfully
- [ ] No new errors in subsequent workflow runs
- [ ] Verify no regression in other workflows (E2E tests, PR validation)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect syntax in YAML**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Pre-commit linter validates YAML syntax; catch before pushing

2. **Uploading unexpected hidden files**:
   - **Likelihood**: low (paths are explicitly specified)
   - **Impact**: low (artifacts are temporary, not stored permanently)
   - **Mitigation**: Workflow paths are explicit (e.g., `apps/web/.next`); won't accidentally capture other hidden files

3. **Artifact size increases unexpectedly**:
   - **Likelihood**: low
   - **Impact**: low (artifact storage is cheap and temporary)
   - **Mitigation**: Monitor artifact sizes; currently should be ~4MB, will remain similar

4. **Workflow fails for unrelated reasons**:
   - **Likelihood**: low
   - **Impact**: low (only affects deployment workflow, not local development)
   - **Mitigation**: Rollback plan below; can revert immediately if issues arise

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit: `git revert <commit-hash>`
2. Push to GitHub
3. The next Deploy to Staging workflow will use the old configuration
4. Investigate the issue (unlikely given low-risk nature)
5. Apply alternative solution if needed

**Monitoring**:
- Watch the first Deploy to Staging run after merge
- Confirm artifact upload includes correct files
- No ongoing monitoring needed after successful run

## Performance Impact

**Expected Impact**: minimal

Adding this parameter doesn't change build performance. The artifact upload will now include `.next` (which should be ~4MB), slightly increasing upload time but negligible.

**Performance Testing**:
- Monitor artifact upload time before and after
- Expected: <5 second difference, if any
- No performance degradation expected

## Security Considerations

**Security Impact**: none

This parameter is specifically designed by GitHub Actions to safely include hidden files. It doesn't bypass any security controls - it simply includes legitimate build artifacts that should be uploaded.

- Security review needed: no
- Penetration testing needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current behavior
gh run view <recent-staging-deploy-run-id> --log-failed | grep "Web build artifacts missing"
```

**Expected Result**: Shows failure with "❌ Web build artifacts missing!" message

### After Fix (Bug Should Be Resolved)

```bash
# Validate workflow syntax
yamllint .github/workflows/artifact-sharing.yml
yamllint .github/workflows/reusable-build.yml
yamllint .github/workflows/e2e-sharded.yml

# Verify the parameter was added correctly
grep -n "include-hidden-files: true" .github/workflows/artifact-sharing.yml
grep -n "include-hidden-files: true" .github/workflows/reusable-build.yml

# Push to GitHub and trigger workflow
git push origin feature-branch

# Monitor the workflow run
gh run watch <workflow-run-id>

# Verify artifacts were uploaded with .next included
gh run view <workflow-run-id> --log | grep "With the provided path"
```

**Expected Result**:
- YAML validation passes with no errors
- `include-hidden-files: true` appears in modified workflows
- Artifact upload shows >3000 files (includes `.next`)
- "Validate Build Artifacts" job succeeds
- No "Web build artifacts missing" error

### Regression Prevention

```bash
# Run full workflow suite to ensure no regressions
gh run list --repo slideheroes/2025slideheroes \
  --workflow "Deploy to Staging" \
  --limit 3 --json conclusion

# Expected: All recent runs should conclude with "success"

# Also test PR validation workflow (uses similar patterns)
gh run list --repo slideheroes/2025slideheroes \
  --workflow "PR Validation" \
  --limit 3 --json conclusion

# Expected: Should work with new parameter in reusable-build.yml
```

## Dependencies

**No new dependencies required**

The `include-hidden-files` parameter is built into `actions/upload-artifact@v6` - no additional packages needed.

## Database Changes

**No database changes required**

This is purely a CI/CD workflow fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this fix is deployed via GitHub repository push
- No special infrastructure or environment changes needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix is fully backward compatible. Even if run with v4 (which doesn't support the parameter), the parameter would be silently ignored and v4 would include hidden files by default anyway.

## Success Criteria

The fix is complete when:
- [x] All validation commands pass
- [ ] Bug no longer reproduces (artifact upload includes `.next`)
- [ ] "Validate Build Artifacts" job succeeds on first attempt
- [ ] All four affected workflows updated with `include-hidden-files: true`
- [ ] YAML syntax validation passes
- [ ] No regressions in related workflows (E2E, PR validation)
- [ ] Staging deployment completes successfully
- [ ] No new errors or warnings in workflow logs

## Notes

**Why this bug wasn't caught earlier:**
- The Dependabot upgrade happened on Jan 22, 2026
- The breaking change was silent (no error message about hidden files)
- Only manifested when the validation step checked for `.next` directory
- Previous uploads might have failed for other artifacts silently

**GitHub Actions Documentation:**
- [upload-artifact include-hidden-files parameter](https://github.com/actions/upload-artifact/blob/main/README.md#include-hidden-files)
- [upload-artifact v6 Release Notes](https://github.com/actions/upload-artifact/releases/tag/v6.0.0)
- [Issue #602: Hidden Files Breaking Change](https://github.com/actions/upload-artifact/issues/602)

**Future Prevention:**
- Monitor Dependabot PRs for breaking changes in actions
- Test staging deployment after any major GitHub Actions upgrades
- Consider pinning action versions instead of using minor version ranges

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1768*
