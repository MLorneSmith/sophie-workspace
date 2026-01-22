# Bug Diagnosis: E2E Sharded Workflow Failure - Stale Commit Before Fix

**ID**: ISSUE-1683
**Created**: 2026-01-21T00:45:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: regression

## Summary

The E2E sharded workflow (run 21192175989) failed with `Command "tsx" not found` error, but this is NOT a new bug. The failure occurred on an old commit (`a80def076`) that predates the fix implemented in Issue #1679. The currently queued workflow runs (21192395891 and 21192545873) are using commits that include the fix and should pass.

## Environment

- **Application Version**: commit a80def0760e11d6d71c8c454bfb3ce37c129f21e (old/stale)
- **Environment**: CI (GitHub Actions with RunsOn)
- **Node Version**: 20
- **pnpm Version**: 10.14.0
- **Last Working**: Current dev branch (546a9cab4) has the fix

## Reproduction Steps

1. Open PR #1578 (dependabot github-actions update)
2. The workflow ran on commit `a80def076` which is based on dev BEFORE the fix in #1679
3. The workflow fails at "Wait for Supabase health" step with tsx not found

## Expected Behavior

The E2E sharded workflow should pass with the command `pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts`.

## Actual Behavior

The workflow failed because it ran on commit `a80def076` which still had the old command `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`.

## Diagnostic Data

### Workflow Run Analysis

| Run ID | Status | headSha | Has Fix? | Workflow Command |
|--------|--------|---------|----------|------------------|
| 21192175989 | **failure** | `a80def076...` | NO | `pnpm exec tsx apps/e2e/...` |
| 21192395891 | queued | `546a9cab4...` | YES | `pnpm --filter web-e2e exec tsx tests/...` |
| 21192545873 | queued | `c16d4896e...` | YES | `pnpm --filter web-e2e exec tsx tests/...` |

### Commit Timeline

```
a80def076 - chore(deps): bump the github-actions group with 4 updates  <-- OLD, used by failed run
          ↓
b2b1b03d9 - fix(ci): use pnpm exec instead of npx for tsx in E2E workflow (Issue #1676)
          ↓
f76971730 - fix(tooling): remove GitHub issue creation from task-decomposer
          ↓
c3e783da1 - fix(ci): use pnpm --filter for tsx execution in e2e workflow (Issue #1679)  <-- THE FIX
          ↓
546a9cab4 - fix(e2e): scope health checks to local Supabase workflows only (Issue #1681)
          ↓
c16d4896e - chore(deps): bump github-actions (REBASED onto dev with fix)  <-- NEW, queued
```

### Console Output
```
Setup Test Server	Wait for Supabase health	pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts
Setup Test Server	Wait for Supabase health	undefined
Setup Test Server	Wait for Supabase health	 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found
Setup Test Server	Wait for Supabase health
Setup Test Server	Wait for Supabase health	Did you mean "pnpm exec tsc"?
Setup Test Server	Wait for Supabase health	##[error]Process completed with exit code 254.
```

### Verification of Fix in Current Code

The current dev branch (546a9cab4) and the rebased dependabot branch (c16d4896e) both have the correct command:

```yaml
# Line 102 in .github/workflows/e2e-sharded.yml
pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts
```

## Error Stack Traces
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found
Did you mean "pnpm exec tsc"?
Process completed with exit code 254.
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (line 102)
- **Recent Changes**: Fix applied in commit c3e783da1 (Issue #1679)
- **Suspected Functions**: N/A - this is a workflow configuration issue

## Related Issues & Context

### Direct Predecessors (Fix Chain)
- #1657 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails - ts-node Not Found" - Initial fix attempt (incomplete)
- #1659 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails - tsx Not Available as Dependency" - Added tsx dependency
- #1676 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails - npx tsx Incompatible with pnpm" - Changed npx to pnpm exec
- #1679 (CLOSED): "Bug Fix: E2E Sharded Workflow - Fix tsx Execution with pnpm --filter" - Final correct fix

### Historical Context

The tsx migration has been a chain of incremental fixes:
1. #1657: Changed `ts-node` to `tsx` but used `npx tsx` (incompatible with pnpm)
2. #1659: Added tsx as devDependency to apps/e2e
3. #1676: Changed `npx tsx` to `pnpm exec tsx` (wrong workspace context)
4. #1679: Changed to `pnpm --filter web-e2e exec tsx` (correct fix)

The failed workflow run was on a commit made BEFORE #1679 was merged.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The workflow failure is NOT a new bug - it ran on a stale commit (`a80def076`) that predates the fix in Issue #1679.

**Detailed Explanation**:
The dependabot PR #1578 was created with a commit (`a80def076`) based on the dev branch at that point in time. However, the dev branch subsequently received the fix in commit `c3e783da1`. When the workflow ran, it used the old commit that still had `pnpm exec tsx apps/e2e/...` instead of the fixed `pnpm --filter web-e2e exec tsx tests/...`.

The dependabot branch has since been rebased (new commit `c16d4896e`) which now includes the fix.

**Supporting Evidence**:
- Git log shows `a80def076` parent is `b2b1b03d9` which is BEFORE the fix commit `c3e783da1`
- Workflow file at `a80def076` shows: `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`
- Workflow file at `c16d4896e` shows: `pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts`
- Currently queued runs use commits with the fix

### How This Causes the Observed Behavior

1. Dependabot created PR #1578 based on dev at commit `b2b1b03d9`
2. The workflow ran on commit `a80def076` which includes `b2b1b03d9`'s workflow file
3. That workflow file has `pnpm exec tsx` which fails because tsx is in a nested workspace
4. Meanwhile, dev received the fix in `c3e783da1`
5. The dependabot branch was rebased to include the fix
6. New workflow runs will use the fixed version

### Confidence Level

**Confidence**: High

**Reasoning**:
- Git history clearly shows the fix commit came after the failed run's commit
- Both currently queued runs are on commits that have the correct workflow command
- The workflow file contents at each commit were verified

## Fix Approach (High-Level)

**No fix needed** - the currently queued workflow runs (21192395891 and 21192545873) are already using commits that include the fix from Issue #1679. Simply wait for these runs to complete - they should pass.

If they fail for a different reason, that would be a new bug requiring separate diagnosis.

## Diagnosis Determination

This is a FALSE ALARM - the workflow failure was on a stale commit that predates the fix. The fix from Issue #1679 is already in place and the currently queued workflow runs should succeed.

**Action**: Monitor the queued workflow runs (21192395891 and 21192545873) to confirm they pass. No code changes required.

## Additional Context

The dependabot PR was rebased at some point, which is why:
- The failed run used commit `a80def076` (OLD)
- The current PR head is commit `c16d4896e` (NEW, includes fix)

This is normal GitHub/dependabot behavior - when base branch changes significantly, dependabot rebases the PR.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git show, git log, Bash*
