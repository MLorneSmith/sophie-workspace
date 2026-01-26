# Bug Diagnosis: Alpha Validation Workflow Fails with pnpm Version Mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-26T17:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

The `alpha-validation` GitHub Actions workflow fails during the "Setup pnpm" step because the `pnpm/action-setup@v4` action detects conflicting pnpm version specifications: the workflow specifies `PNPM_VERSION: '10'` while `package.json` specifies `"packageManager": "pnpm@10.14.0"`. This is a new stricter validation introduced in recent versions of the `pnpm/action-setup` action.

## Environment

- **Application Version**: 2.13.1
- **Environment**: GitHub Actions CI
- **Node Version**: 22
- **pnpm Version**: 10.14.0 (from package.json)
- **Workflow**: `.github/workflows/alpha-validation.yml`
- **Branch**: `alpha/spec-S1815`
- **Last Working**: Unknown (may be first run of this workflow against recent pnpm/action-setup updates)

## Reproduction Steps

1. Push changes to a branch matching pattern `alpha/spec-*`
2. `alpha-validation.yml` workflow triggers
3. Workflow fails at "Setup pnpm" step with version mismatch error

## Expected Behavior

The workflow should successfully install pnpm and proceed to run `pnpm install`, `pnpm typecheck`, and `pnpm build`.

## Actual Behavior

The workflow fails immediately at the "Setup pnpm" step with the error:

```
Error: Multiple versions of pnpm specified:
  - version 10 in the GitHub Action config with the key "version"
  - version pnpm@10.14.0 in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

## Diagnostic Data

### Console Output

```
Fresh-Clone Validation	Setup pnpm	2026-01-26T16:59:51.7085714Z Error: Multiple versions of pnpm specified:
Fresh-Clone Validation	Setup pnpm	2026-01-26T16:59:51.7087573Z   - version 10 in the GitHub Action config with the key "version"
Fresh-Clone Validation	Setup pnpm	2026-01-26T16:59:51.7087992Z   - version pnpm@10.14.0 in the package.json with the key "packageManager"
Fresh-Clone Validation	Setup pnpm	2026-01-26T16:59:51.7088418Z Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

### Workflow Configuration Analysis

**alpha-validation.yml (problematic):**
```yaml
env:
  PNPM_VERSION: '10'  # <-- Generic major version

steps:
  - name: Setup pnpm
    uses: pnpm/action-setup@v4
    with:
      version: ${{ env.PNPM_VERSION }}  # <-- Passes '10' to the action
```

**package.json:**
```json
{
  "packageManager": "pnpm@10.14.0"  // <-- Specific version
}
```

**Other workflows in repo (working):**
```yaml
# pr-validation.yml, e2e-smart.yml, e2e-sharded.yml, bundle-size-alert.yml, security-weekly-scan.yml
PNPM_VERSION: '10.14.0'  # <-- Match package.json exactly
```

### Network Analysis

N/A - This is a CI configuration issue, not a network problem.

### Database Analysis

N/A - Not database-related.

### Performance Metrics

N/A - Workflow fails before any meaningful execution.

## Error Stack Traces

```
at readTarget (/home/runner/_work/_actions/pnpm/action-setup/v4/dist/index.js:1:4977)
at runSelfInstaller (/home/runner/_work/_actions/pnpm/action-setup/v4/dist/index.js:1:4142)
at async install (/home/runner/_work/_actions/pnpm/action-setup/v4/dist/index.js:1:3154)
at async main (/home/runner/_work/_actions/pnpm/action-setup/v4/dist/index.js:1:445)
```

## Related Code

- **Affected Files**:
  - `.github/workflows/alpha-validation.yml:17` - `PNPM_VERSION: '10'`
  - `package.json:87` - `"packageManager": "pnpm@10.14.0"`
- **Recent Changes**: The `alpha-validation.yml` workflow was created with `PNPM_VERSION: '10'` (major version only) while all other workflows use `PNPM_VERSION: '10.14.0'` (exact version matching `package.json`)
- **Suspected Functions**: Line 17 in `alpha-validation.yml`

## Related Issues & Context

### Direct Predecessors

None found - this appears to be the first occurrence of this issue.

### Related Infrastructure Issues

None found.

### Similar Symptoms

None found in repository issues.

### Same Component

Other workflows in `.github/workflows/` that use pnpm setup do NOT have this issue because they specify the exact version `10.14.0`.

### Historical Context

The `pnpm/action-setup@v4` action introduced stricter version validation that fails when:
1. A `version` parameter is passed to the action AND
2. `package.json` contains a `packageManager` field AND
3. The versions don't match exactly

Previous versions of the action may have been more lenient, allowing `10` to match `10.14.0`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `alpha-validation.yml` workflow specifies `PNPM_VERSION: '10'` (major version only) while all other workflows and `package.json` specify the exact version `pnpm@10.14.0`.

**Detailed Explanation**:

The `pnpm/action-setup@v4` action now enforces strict version matching when both the action's `version` parameter and `package.json`'s `packageManager` field are present. The action interprets:
- Workflow input: `version: 10`
- package.json: `pnpm@10.14.0`

These are not considered equivalent, causing the action to fail with `ERR_PNPM_BAD_PM_VERSION`.

**Supporting Evidence**:

1. Error message explicitly states the mismatch:
   ```
   - version 10 in the GitHub Action config with the key "version"
   - version pnpm@10.14.0 in the package.json with the key "packageManager"
   ```

2. Line 17 of `alpha-validation.yml`:
   ```yaml
   PNPM_VERSION: '10'  # Should be '10.14.0'
   ```

3. Line 87 of `package.json`:
   ```json
   "packageManager": "pnpm@10.14.0"
   ```

4. Other workflows use exact version and work correctly:
   ```yaml
   # pr-validation.yml:37
   PNPM_VERSION: '10.14.0'
   ```

### How This Causes the Observed Behavior

1. User pushes to `alpha/spec-S1815` branch
2. `alpha-validation.yml` workflow triggers
3. Checkout step completes successfully
4. "Setup pnpm" step runs `pnpm/action-setup@v4`
5. Action reads `version: '10'` from workflow input
6. Action reads `packageManager: pnpm@10.14.0` from `package.json`
7. Action's `readTarget()` function compares versions
8. `'10' !== '10.14.0'` → action throws error
9. Workflow fails immediately, blocking all subsequent steps

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly identifies both version sources and their values
- The fix is trivially verifiable by comparing to other working workflows
- The `pnpm/action-setup` action's behavior is documented and deterministic

## Fix Approach (High-Level)

Change line 17 of `.github/workflows/alpha-validation.yml` from:
```yaml
PNPM_VERSION: '10'
```
to:
```yaml
PNPM_VERSION: '10.14.0'
```

This aligns with all other workflows in the repository and matches the `package.json` `packageManager` field exactly.

## Diagnosis Determination

**Root cause confirmed**: The `alpha-validation.yml` workflow file was created with a major-version-only pnpm specification (`'10'`) instead of the exact version (`'10.14.0'`) that matches `package.json` and all other workflows. This was likely an oversight during initial workflow creation, possibly copying from an older template that didn't require exact version matching.

The fix is a one-line change to align the version specification.

## Additional Context

- The Alpha orchestrator implementation (`spec-orchestrator.ts`) and the `/alpha:implement` command are working correctly in E2B sandboxes
- The workflow failure only affects the automated validation that runs when code is pushed to `alpha/spec-*` branches
- The S1815 spec implementation itself is progressing (0/17 features completed as of the current run)
- Once this workflow is fixed, the validation will run properly for future pushes to the alpha branch

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, Read, Grep*
