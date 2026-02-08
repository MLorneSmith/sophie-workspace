# Bug Fix: E2E Sharded Workflow Fails - npx tsx Incompatible with pnpm

**Related Diagnosis**: #1674 (REQUIRED)
**Severity**: high
**Bug Type**: ci
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The E2E sharded workflow uses `npx tsx` which is incompatible with pnpm's dependency resolution. `npx` looks for packages in npm's cache/global installations, not in pnpm's workspace-local node_modules.
- **Fix Approach**: Replace `npx tsx` with `pnpm exec tsx` in the GitHub Actions workflow
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails at the "Wait for Supabase health" step with `sh: 1: tsx: not found`. While Issue #1659 added `tsx` as a devDependency to `apps/e2e/package.json`, the workflow uses `npx tsx` which is fundamentally incompatible with pnpm's package management approach.

**Root cause**: pnpm uses a content-addressable store with symlinks, not npm's hoisting model. `npx` doesn't traverse pnpm workspace structure and fails to find packages in the pnpm store.

For full details, see diagnosis issue #1674.

### Solution Approaches Considered

#### Option 1: Replace `npx tsx` with `pnpm exec tsx` ⭐ RECOMMENDED

**Description**: Use `pnpm exec` to run commands against packages installed in the workspace. This leverages pnpm's native package execution model.

**Pros**:
- Simplest fix - one-line change
- Directly integrates with pnpm's workspace model
- No additional dependencies needed
- `pnpm exec` is a pnpm native feature, guaranteed to work
- Follows pnpm best practices for CI/CD environments

**Cons**:
- Requires understanding pnpm's execution model
- Minimal downside

**Risk Assessment**: low - This is a well-documented pnpm pattern with no side effects

**Complexity**: simple - Single line change in workflow YAML

#### Option 2: Use npm instead of pnpm

**Description**: Configure the workflow to use npm instead of pnpm for running tools.

**Why Not Chosen**: This contradicts the project's choice to use pnpm as the package manager. It would introduce maintenance burden and inconsistency.

#### Option 3: Global tsx installation

**Description**: Install tsx globally in the CI environment before running.

**Why Not Chosen**: Unreliable in CI (depends on CI environment), harder to maintain, less reproducible than workspace-based approaches.

### Selected Solution: Replace `npx tsx` with `pnpm exec tsx`

**Justification**: This is the simplest, most robust solution that aligns with pnpm best practices. It requires only a single line change and directly leverages pnpm's native execution model, which is guaranteed to work in any pnpm workspace setup.

**Technical Approach**:
- Replace `npx tsx` with `pnpm exec tsx` at line 102 of `.github/workflows/e2e-sharded.yml`
- `pnpm exec` runs a command from the workspace's installed packages
- Resolves packages through pnpm's symlink structure, not npm's global cache
- Works identically in local development and CI environments

**Architecture Changes**: None - This is purely a workflow syntax change

**Migration Strategy**: No migration needed - This is a one-time fix with no backwards compatibility concerns

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` (line 102) - Change `npx tsx` to `pnpm exec tsx`

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update the workflow file

Update `.github/workflows/e2e-sharded.yml` line 102:

- Open the file and locate the "Wait for Supabase health" step
- Find: `npx tsx apps/e2e/tests/setup/supabase-health.ts`
- Replace with: `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`

**Why this step first**: This is the core fix that resolves the root cause

#### Step 2: Verify the workflow syntax

- Ensure the YAML is valid by reviewing the line visually
- No additional syntax validation needed - this is a simple command substitution

#### Step 3: Test the fix

- Push a change to the `dev` branch that triggers the E2E sharded workflow
- Monitor the "Setup Test Server" job to confirm the "Wait for Supabase health" step succeeds
- Verify that `pnpm exec tsx` successfully finds and executes the tsx command

**Why this step**: Confirms the fix resolves the original issue in the CI environment

#### Step 4: Verify no regressions

- Check that the entire E2E test suite runs to completion
- Ensure no new errors are introduced by the workflow change

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push to `dev` branch to trigger E2E sharded workflow
- [ ] Monitor GitHub Actions for workflow execution
- [ ] Confirm "Setup Test Server" job completes without errors
- [ ] Verify "Wait for Supabase health" step outputs successful execution
- [ ] Confirm entire E2E test suite runs to completion
- [ ] Check for any new error messages in workflow logs

### Regression Testing

- [ ] Verify other workflow steps still execute correctly
- [ ] Ensure test sharding still works as expected
- [ ] Confirm no changes to test execution or results

### No Additional Tests Needed

The fix is a simple one-line YAML change with no code logic changes. No unit, integration, or E2E tests are required beyond verifying the workflow executes successfully.

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **pnpm version compatibility**: Different pnpm versions might behave differently with `pnpm exec`
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: `pnpm exec` is stable across versions. It's the standard pattern for running workspace tools in pnpm projects.

2. **Environment differences**: Local development vs CI environment might execute differently
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: `pnpm exec` works identically in both environments - this is the whole point of using it

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the change: Replace `pnpm exec tsx` back to `npx tsx`
2. Investigate alternative solutions if needed
3. No data loss or configuration changes are involved

**Monitoring** (if needed):

None required - This is a low-risk infrastructure change that either works or doesn't.

## Performance Impact

**Expected Impact**: none

No performance implications. The change is purely about command execution, not computation.

## Security Considerations

**Security Impact**: none

This is a purely internal workflow change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

To confirm the bug exists:
1. Push to `dev` branch
2. Watch GitHub Actions workflow execution
3. Look for error: `sh: 1: tsx: not found` in "Wait for Supabase health" step

**Expected Result**: Workflow fails with `tsx: not found` error

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow YAML syntax (local validation)
# You can use yamllint or just review the file manually

# Trigger workflow via git push
git push origin dev

# Monitor GitHub Actions:
# - Setup Test Server job should complete successfully
# - Wait for Supabase health step should execute without errors
# - Full E2E test suite should run to completion
```

**Expected Result**:
- Workflow completes successfully
- No `tsx: not found` errors
- E2E tests execute normally

### Regression Prevention

```bash
# No additional regression tests needed for a one-line YAML change
# The workflow itself serves as the validation that the fix works
```

## Dependencies

No new dependencies required. The `tsx` package is already listed in `apps/e2e/package.json` from issue #1659.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

This is a workflow file change only - it affects CI/CD execution, not application deployment.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The change is backwards compatible and doesn't affect any deployed code.

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/e2e-sharded.yml` line 102 updated to use `pnpm exec tsx`
- [ ] GitHub Actions workflow executes successfully on next push to `dev`
- [ ] "Setup Test Server" job completes without errors
- [ ] "Wait for Supabase health" step finds and executes tsx command
- [ ] E2E test suite runs to completion
- [ ] No new errors introduced

## Notes

This fix is part of a chain of related issues:
1. #1655/#1657: Replaced `ts-node` with `tsx`
2. #1658/#1659: Added `tsx` as devDependency
3. **#1674**: Fix incompatibility with `npx` and `pnpm`

The previous fixes addressed the wrong root cause (missing dependency) when the real issue was the execution method incompatibility. This fix addresses the actual problem.

**pnpm + npx incompatibility** is a well-documented issue in the pnpm documentation:
- pnpm uses content-addressable store with symlinks
- `npx` looks for packages in npm cache and global installations
- `pnpm exec` is the correct way to run workspace tools in pnpm projects

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1674*
