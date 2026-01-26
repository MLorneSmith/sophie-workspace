# Bug Fix: Alpha Validation Workflow pnpm Version Mismatch

**Related Diagnosis**: #1818 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Workflow specifies `PNPM_VERSION: '10'` while `package.json` specifies `"packageManager": "pnpm@10.14.0"`
- **Fix Approach**: Update `PNPM_VERSION` environment variable to match exact version
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `alpha-validation` GitHub Actions workflow fails at the "Setup pnpm" step because the `pnpm/action-setup@v4` action enforces strict version matching. The workflow passes `version: '10'` to the action while `package.json` declares `pnpm@10.14.0`, causing `ERR_PNPM_BAD_PM_VERSION`.

For full details, see diagnosis issue #1818.

### Solution Approaches Considered

#### Option 1: Update Workflow Environment Variable ⭐ RECOMMENDED

**Description**: Change `PNPM_VERSION: '10'` to `PNPM_VERSION: '10.14.0'` in `.github/workflows/alpha-validation.yml` to match the exact version in `package.json`.

**Pros**:
- One-line fix - minimal change surface
- Aligns with all other workflows in the repo (pr-validation, e2e-smart, e2e-sharded, bundle-size-alert, security-weekly-scan)
- Maintains consistency across CI/CD pipeline
- No downstream changes needed
- Zero risk of introducing new issues

**Cons**:
- Requires maintenance if `package.json` version changes (but all other workflows already need this)

**Risk Assessment**: low - This is a configuration alignment fix with no code changes

**Complexity**: simple - One-line change

#### Option 2: Remove Version from Workflow, Rely on Package.json Only

**Description**: Remove the `version` parameter from the `pnpm/action-setup` action step, letting the action read version from `packageManager` field in `package.json`.

**Pros**:
- Single source of truth (package.json only)
- Reduces duplication

**Cons**:
- Inconsistent with project's established CI/CD pattern (all other 5 workflows explicitly set version)
- Could introduce unexpected behavior if action defaults change
- Requires modifying the action invocation, more intrusive than Option 1

**Why Not Chosen**: Goes against established project patterns. The repo already sets explicit versions in all other workflows. This workflow should follow the same pattern.

#### Option 3: Update Package.json to Use Major Version Only

**Description**: Change `package.json` from `"packageManager": "pnpm@10.14.0"` to `"packageManager": "pnpm@10"`.

**Pros**:
- Workflow wouldn't need changes

**Cons**:
- Reduces version specificity at the package manager level
- Could cause unexpected patch version changes
- Contradicts npm best practices for production reproducibility
- Would require changing package.json for just one workflow

**Why Not Chosen**: `package.json` is the source of truth for exact versions. Degrading it for CI/CD purposes is backwards.

### Selected Solution: Option 1

**Justification**: This approach is the simplest, lowest-risk fix that aligns with the project's established CI/CD patterns. All other workflows use explicit exact versions, and this workflow should match. The pnpm/action-setup action now requires exact version matching, so we must provide it.

**Technical Approach**:
- Change line 17 of `.github/workflows/alpha-validation.yml`
- Update `PNPM_VERSION: '10'` to `PNPM_VERSION: '10.14.0'`
- This matches the `packageManager` field in `package.json` exactly
- Aligns with other 5 workflows in the repo that use the same version variable

**Architecture Changes**: None

**Migration Strategy**: Not needed - this is a configuration-only fix

## Implementation Plan

### Affected Files

- `.github/workflows/alpha-validation.yml` - Change `PNPM_VERSION` environment variable to exact version

### New Files

None needed

### Step-by-Step Tasks

#### Step 1: Update Workflow Configuration

Update `.github/workflows/alpha-validation.yml` to use exact pnpm version.

- Change line 17 from `PNPM_VERSION: '10'` to `PNPM_VERSION: '10.14.0'`
- Verify syntax is correct (YAML indentation, quotes)
- Verify the version matches `package.json` line 87 exactly

**Why this step first**: This is the root cause fix. All other validation depends on this being correct.

#### Step 2: Validate Syntax

Ensure the YAML file is syntactically correct.

- Use `yamllint` or GitHub's YAML validation
- Verify the workflow can be parsed by GitHub Actions

#### Step 3: Test the Fix

Push to an `alpha/spec-*` branch and verify the workflow runs.

- Create a test commit or push existing code to `alpha/spec-S1815` branch
- Monitor the workflow run at https://github.com/MLorneSmith/2025slideheroes/actions
- Confirm "Setup pnpm" step succeeds (no more version mismatch error)
- Confirm "Type check", "Build" steps complete successfully

#### Step 4: Commit Changes

Create a commit for the workflow fix.

- Stage `.github/workflows/alpha-validation.yml`
- Commit with message: `fix(ci): align alpha-validation pnpm version with package.json`
- Push to `dev` or directly to `alpha/spec-S1815` depending on workflow

## Testing Strategy

### Unit Tests

Not applicable - this is a CI configuration change

### Integration Tests

Not applicable - this is a CI configuration change

### Manual Testing Checklist

Execute these tests to verify the fix:

- [ ] Verify `.github/workflows/alpha-validation.yml` syntax is valid (no red squiggles in editor)
- [ ] Push a commit to any `alpha/spec-*` branch
- [ ] Wait for workflow to trigger (should appear in Actions tab within 30s)
- [ ] Monitor "Setup pnpm" step:
  - [ ] Should NOT show "Error: Multiple versions of pnpm specified"
  - [ ] Should show "pnpm version X.X.X" in logs
  - [ ] Step should complete with green checkmark
- [ ] Monitor subsequent steps:
  - [ ] "Setup Node.js" should complete successfully
  - [ ] "Install dependencies" should complete successfully
  - [ ] "Type check" should complete successfully
  - [ ] "Build" should complete successfully
- [ ] Verify entire workflow completes (green checkmark on workflow)
- [ ] Check that Alpha orchestrator can now run against this branch without validation blocking

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **YAML Syntax Error**: Introducing a typo could break the workflow entirely
   - **Likelihood**: low (simple one-line change)
   - **Impact**: high (workflow doesn't run)
   - **Mitigation**: Carefully review the change, use YAML linting before commit

2. **Version Mismatch**: Using a different version than intended
   - **Likelihood**: very low (copying from package.json)
   - **Impact**: medium (workflow still fails with version error)
   - **Mitigation**: Double-check version matches `package.json` exactly

3. **Workflow Behavior Changes**: pnpm 10.14.0 behaves differently than 10.x
   - **Likelihood**: very low (patch version in same minor)
   - **Impact**: low (would only affect existing tests/builds)
   - **Mitigation**: All other workflows already use 10.14.0, so behavior is known

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the commit: `git revert <commit-hash>`
2. Push the revert: `git push`
3. Wait for workflow to trigger again (should pick up the old version from package.json approach)
4. Investigate the actual failure reason

Since this is a configuration-only change with no code impact, rollback is straightforward.

**Monitoring**: None needed - this is a one-time configuration fix

## Performance Impact

**Expected Impact**: none

The pnpm version itself has no performance implications. This fix only removes a setup error that was blocking the entire workflow.

## Security Considerations

**Security Impact**: none

This is a configuration alignment fix with no security implications. It does not change:
- Authentication mechanisms
- Dependency installation
- Package validation
- Security scanning

## Validation Commands

### Before Fix (Bug Should Reproduce)

To verify the bug exists before applying the fix, examine the failed workflow run:
- Failed run: https://github.com/MLorneSmith/2025slideheroes/actions/runs/21366370100
- View "Setup pnpm" step logs
- Should show: "Error: Multiple versions of pnpm specified"

OR push to `alpha/spec-*` branch without the fix to reproduce locally.

**Expected Result**: Workflow fails at "Setup pnpm" with version mismatch error

### After Fix (Bug Should Be Resolved)

```bash
# Verify YAML syntax
yamllint .github/workflows/alpha-validation.yml

# OR use biome (project's default linter)
pnpm lint .github/workflows/alpha-validation.yml

# Push to test branch
git add .github/workflows/alpha-validation.yml
git commit -m "fix(ci): align alpha-validation pnpm version"
git push origin alpha/test-pnpm-fix

# Monitor GitHub Actions
# - Workflow should trigger automatically
# - "Setup pnpm" step should succeed
# - Subsequent steps should complete
# - Final status should be green checkmark
```

**Expected Result**: All validation commands pass, workflow completes successfully on `alpha/spec-*` branches

### Regression Prevention

Since this is a configuration-only change, no regression tests are needed. The existing workflow steps (TypeScript check, build) provide validation that nothing broke.

## Dependencies

### New Dependencies

None needed - this is a configuration change

### No new dependencies required

## Database Changes

**Migration needed**: no

No database changes required for this fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

This is a GitHub Actions workflow configuration change. It:
- Does not affect application code
- Does not require database migrations
- Does not affect deployed services
- Takes effect immediately upon merge

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix only changes the CI/CD workflow, not the application itself.

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/alpha-validation.yml` updated with `PNPM_VERSION: '10.14.0'`
- [ ] YAML syntax is valid (no yamllint errors)
- [ ] Commit created with appropriate message
- [ ] Changes pushed to repository
- [ ] Test push to `alpha/spec-*` branch triggers workflow
- [ ] Workflow "Setup pnpm" step completes successfully (no version error)
- [ ] Full workflow completes with all steps passing
- [ ] Manual testing checklist completed
- [ ] Alpha orchestrator can now validate against `alpha/spec-*` branches

## Notes

**Why the alpha-validation.yml workflow exists:**

The `alpha-validation.yml` workflow was created to provide automated CI validation for alpha feature implementation branches (`alpha/spec-*`). These branches are used by the Alpha Autonomous Coding workflow to implement complete features in parallel sandboxes.

**Why the version mismatch occurred:**

The workflow was likely created using a template or copy-paste from other workflows, but used a major-version-only specification (`'10'`) instead of the exact version (`'10.14.0'`). Recent versions of `pnpm/action-setup@v4` enforce strict version matching to prevent unexpected behavior.

**Why this matters:**

Without this fix, the alpha-validation workflow cannot run, blocking automated validation of feature implementations pushed to `alpha/spec-*` branches. The S1815 (User Dashboard) specification is currently blocked by this workflow failure.

**Comparison with other workflows:**

| Workflow | pnpm Version | Status |
|----------|--------------|--------|
| pr-validation.yml | 10.14.0 | ✅ Working |
| e2e-smart.yml | 10.14.0 | ✅ Working |
| e2e-sharded.yml | 10.14.0 | ✅ Working |
| bundle-size-alert.yml | 10.14.0 | ✅ Working |
| security-weekly-scan.yml | 10.14.0 | ✅ Working |
| alpha-validation.yml | 10 (WRONG) | ❌ Failing |

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1818*
