# Bug Diagnosis: E2E Sharded Workflow - pnpm exec tsx Not Found in Root Workspace

**ID**: ISSUE-pending
**Created**: 2026-01-20T19:15:00-05:00
**Reporter**: system (CI failure)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow fails with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found` because `pnpm exec tsx` runs at the root workspace level, but `tsx` is only installed as a devDependency in `apps/e2e/package.json`, not in the root `package.json`.

## Environment

- **Application Version**: dev branch, commit b2b1b03d9
- **Environment**: CI (GitHub Actions with RunsOn)
- **Node Version**: 20
- **pnpm Version**: 10.14.0
- **Database**: Supabase (PostgreSQL)
- **Last Working**: Never (issue chain started with ts-node → tsx migration)

## Reproduction Steps

1. Push to `dev` branch to trigger E2E sharded workflow
2. Workflow reaches "Wait for Supabase health" step
3. Step executes: `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`
4. Error: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found`

## Expected Behavior

The `pnpm exec tsx` command should find and execute the `tsx` package to run the Supabase health check TypeScript file.

## Actual Behavior

pnpm cannot find `tsx` because it's only installed in `apps/e2e` workspace, not in the root workspace. `pnpm exec` at root level only looks for binaries from root-level dependencies.

## Diagnostic Data

### Console Output
```
2026-01-21T00:09:30.6657980Z [36;1mpnpm exec tsx apps/e2e/tests/setup/supabase-health.ts[0m
2026-01-21T00:09:31.0099982Z  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found
2026-01-21T00:09:31.0100974Z Did you mean "pnpm exec tsc"?
2026-01-21T00:09:31.0277081Z ##[error]Process completed with exit code 254.
```

### Package Location Analysis
```
# tsx is in apps/e2e/package.json (line 70):
"devDependencies": {
  ...
  "tsx": "^4.21.0"
}

# tsx is NOT in root package.json
grep -E '"tsx"' package.json  # returns nothing
```

## Error Stack Traces
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found
Did you mean "pnpm exec tsc"?
Process completed with exit code 254
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (line 102)
  - `apps/e2e/package.json` (tsx dependency location)
  - `package.json` (missing tsx at root)
- **Recent Changes**:
  - b2b1b03d9: Changed `npx tsx` to `pnpm exec tsx` (partial fix from #1676)
  - 5fd56a462: Added tsx to apps/e2e devDependencies (#1659)
  - 8f9324d9d: Replaced ts-node with tsx (#1657)
- **Suspected Functions**: pnpm workspace binary resolution

## Related Issues & Context

### Direct Predecessors
- #1674 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow - npx tsx Incompatible with pnpm" - Identified npx/pnpm incompatibility, but fix was incomplete
- #1676 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails - npx tsx Incompatible with pnpm" - Implemented fix using `pnpm exec`, but didn't account for workspace context

### Infrastructure Issues
- #1657: Replaced ts-node with tsx (first step in migration chain)
- #1659: Added tsx as devDependency to apps/e2e (not sufficient)
- #1658: Diagnosis for tsx missing dependency

### Historical Context
This is the third iteration of fixing the tsx execution issue:
1. #1657: Replaced ts-node with tsx, used `npx tsx`
2. #1659: Added tsx to e2e package when npx couldn't find it
3. #1676: Changed to `pnpm exec tsx` when npx still failed
4. **NOW**: `pnpm exec` at root can't find tsx in nested workspace

## Root Cause Analysis

### Identified Root Cause

**Summary**: `pnpm exec` at the root workspace level cannot find binaries from nested workspace packages.

**Detailed Explanation**:
In pnpm workspaces, `pnpm exec <command>` only searches for binaries in:
1. The current package's `node_modules/.bin/`
2. The root workspace's `node_modules/.bin/`

When running `pnpm exec tsx` from the repository root (which is the default in GitHub Actions), pnpm looks for `tsx` in the root `node_modules/.bin/`. Since `tsx` is only installed in `apps/e2e/package.json`, it exists in `apps/e2e/node_modules/.bin/tsx` but NOT in the root `node_modules/.bin/tsx`.

**Supporting Evidence**:
- Error message: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found`
- `tsx` is in `apps/e2e/package.json` devDependencies (line 70)
- `tsx` is NOT in root `package.json` (confirmed via grep)
- pnpm suggests `tsc` as alternative (which IS in root via TypeScript)

### How This Causes the Observed Behavior

1. GitHub Actions runs the workflow from repository root
2. Workflow step executes: `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`
3. pnpm searches for `tsx` binary in root `node_modules/.bin/`
4. `tsx` is not found (only exists in `apps/e2e/node_modules/.bin/`)
5. pnpm returns error code 254 with "Command not found"
6. Step fails, skipping Supabase health check
7. Subsequent steps are skipped, workflow fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly states "Command 'tsx' not found"
- Verified tsx is in apps/e2e but not in root
- pnpm workspace behavior is well-documented
- Same pattern would fail locally with `pnpm exec tsx` from root

## Fix Approach (High-Level)

Two viable options:

**Option 1 (Recommended)**: Use `pnpm --filter web-e2e exec tsx` to run the command in the context of the e2e workspace where tsx is installed.

```yaml
# Change from:
pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts

# To:
pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts
```

**Option 2**: Add `tsx` to root `package.json` devDependencies to make it available at the root level. This is less targeted but simpler.

```bash
pnpm add -D tsx -w  # -w adds to root workspace
```

Option 1 is preferred as it keeps tsx scoped to where it's needed (e2e tests).

## Diagnosis Determination

The root cause is definitively identified: `pnpm exec` cannot find workspace-scoped binaries when run from the root. The fix requires either running the command in the correct workspace context (--filter) or making tsx available at the root level.

## Additional Context

This completes the tsx migration diagnosis chain:
- ts-node → tsx migration started the chain
- Each fix addressed one layer but revealed the next
- This diagnosis addresses the final layer: pnpm workspace scoping

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run view, issue list), grep, read*
