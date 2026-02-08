# Bug Diagnosis: E2E Sharded Workflow Fails - ts-node Not Found in CI

**ID**: ISSUE-1655
**Created**: 2026-01-20T23:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow fails immediately in the "Wait for Supabase health" step with error `sh: 1: ts-node: not found`. The enhanced Supabase health check TypeScript script (added in Issue #1642) uses `npx ts-node` to execute, but `ts-node` is not a dependency of the `apps/e2e` package where the script is located. This worked locally in testing because `ts-node` is hoisted in the pnpm workspace from `apps/payload`, but in CI the `npx` invocation fails because `ts-node` is not installed in the execution context.

## Environment

- **Application Version**: dev branch (commit 8403ad4a8)
- **Environment**: CI (GitHub Actions with RunsOn)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Before commit 8403ad4a8 (health check integration)

## Reproduction Steps

1. Push to dev branch or trigger E2E sharded workflow
2. Workflow reaches "Setup Test Server" job
3. "Wait for Supabase health" step executes `npx ts-node --project apps/e2e/tsconfig.json apps/e2e/tests/setup/supabase-health.ts`
4. Step fails with exit code 127: `ts-node: not found`

## Expected Behavior

The Supabase health check script should execute successfully, verifying PostgreSQL, PostgREST, and Kong API gateway are healthy before proceeding to the build step.

## Actual Behavior

The workflow fails immediately at line 102 of `e2e-sharded.yml`:
```
sh: 1: ts-node: not found
##[error]Process completed with exit code 127.
```

## Diagnostic Data

### Console Output
```
2026-01-20T23:03:04.9023095Z 🏥 Running enhanced Supabase health checks with exponential backoff...
2026-01-20T23:03:04.9024050Z See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes
2026-01-20T23:03:09.1380084Z sh: 1: ts-node: not found
2026-01-20T23:03:09.1507289Z ##[error]Process completed with exit code 127.
```

### Failed Job Details
```json
{
  "conclusion": "failure",
  "name": "Setup Test Server",
  "steps": [
    {
      "conclusion": "failure",
      "name": "Wait for Supabase health"
    }
  ]
}
```

### Package Dependency Analysis
```
# apps/e2e/package.json - NO ts-node dependency
# apps/payload/package.json - HAS ts-node: "^10.9.2"

# Local pnpm workspace shows ts-node only in payload:
$ pnpm ls ts-node --recursive
payload@3.70.0 /home/msmith/projects/2025slideheroes/apps/payload
devDependencies:
ts-node 10.9.2

# npx ts-node from root context fails:
$ npx ts-node --version
sh: 1: ts-node: not found
```

## Error Stack Traces
```
Exit code 127 indicates "command not found" in shell
No stack trace - execution fails before TypeScript code runs
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (line 102)
  - `apps/e2e/tests/setup/supabase-health.ts`
  - `apps/e2e/package.json` (missing ts-node dependency)
- **Recent Changes**:
  - `8403ad4a8` - ci: integrate RunsOn fixes and enhanced health checks into workflows
  - `426546f43` - fix(ci): fix E2E sharded workflow dual failures with RunsOn and health checks
- **Suspected Functions**: N/A - failure occurs before code execution

## Related Issues & Context

### Direct Predecessors
- #1642 (CLOSED): "Bug Fix: E2E Sharded Workflow Dual Failure Modes" - This fix introduced the TypeScript health check script
- #1641 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow Dual Failure Modes" - Diagnosis that led to #1642

### Related Infrastructure Issues
- #1632 (CLOSED): Health check variable timing issues
- #1631 (CLOSED): API health check uses unset SUPABASE_ANON_KEY
- #1595 (CLOSED): Supabase health check and startup issues
- #1594 (CLOSED): Supabase connection failures

### Same Component
- #1637 (CLOSED): Missing test user credentials
- #1639 (CLOSED): Test user password mismatch

### Historical Context
This is a regression introduced by the fix for Issue #1642. The fix added a TypeScript health check script that works locally but fails in CI due to missing `ts-node` dependency.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `npx ts-node` command in the workflow fails because `ts-node` is not a direct dependency of `apps/e2e` or the root workspace, and is not globally available in the CI runner.

**Detailed Explanation**:
1. Commit `426546f43` added `apps/e2e/tests/setup/supabase-health.ts` - a TypeScript script for multi-stage health verification
2. Commit `8403ad4a8` integrated this into the workflow at line 102: `npx ts-node --project apps/e2e/tsconfig.json apps/e2e/tests/setup/supabase-health.ts`
3. The script works locally because:
   - In development, pnpm hoists dependencies and `ts-node` from `apps/payload` may be accessible
   - The developer's machine may have `ts-node` globally installed
4. In CI, `npx ts-node` fails because:
   - `apps/e2e/package.json` has no `ts-node` dependency
   - Root `package.json` has no `ts-node` dependency
   - CI runners don't have `ts-node` globally installed
   - `npx` downloads from npm registry but `ts-node` was never cached/installed

**Supporting Evidence**:
- Error message: `sh: 1: ts-node: not found` (exit code 127)
- Line 102 of `.github/workflows/e2e-sharded.yml`: `npx ts-node --project apps/e2e/tsconfig.json apps/e2e/tests/setup/supabase-health.ts`
- `apps/e2e/package.json` contains no ts-node dependency
- Only `apps/payload/package.json` has `ts-node` as a devDependency

### How This Causes the Observed Behavior

1. Workflow starts "Setup Test Server" job
2. Dependencies are installed via `pnpm install`
3. Supabase starts successfully
4. "Wait for Supabase health" step runs
5. `npx ts-node` attempts to find/download ts-node
6. ts-node is not in node_modules and npx fails to resolve it
7. Shell returns exit code 127 (command not found)
8. Workflow job fails, blocking all subsequent steps

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message is explicit: "ts-node: not found"
- Package.json analysis confirms missing dependency
- Same pattern works locally with payload's ts-node but fails in isolated CI context
- Exit code 127 is definitively "command not found"

## Fix Approach (High-Level)

Three possible solutions (in order of recommendation):

1. **Use `tsx` instead of `ts-node`** - `tsx` is a faster, zero-config TypeScript executor that uses esbuild. Add it as a devDependency to `apps/e2e` and change the workflow command to `npx tsx apps/e2e/tests/setup/supabase-health.ts`. This is preferred because tsx is simpler and doesn't require tsconfig configuration.

2. **Add ts-node to apps/e2e** - Add `ts-node` and `typescript` as devDependencies to `apps/e2e/package.json`, ensuring it's available in CI.

3. **Use bash script instead** - Replace the TypeScript health check with a bash script using curl/pg_isready for health verification. This removes the TypeScript dependency but loses the structured logging and exponential backoff logic.

## Diagnosis Determination

The root cause is definitively identified: `ts-node` is not a dependency of the `apps/e2e` package, causing `npx ts-node` to fail in the CI environment where it cannot be resolved. The fix implemented in Issue #1642 works locally due to pnpm workspace hoisting or global installation, but fails in the isolated CI runner environment.

The recommended fix is to either:
1. Add `tsx` (preferred) or `ts-node` as a dependency to `apps/e2e`
2. Or convert the health check to a bash script to eliminate the TypeScript runtime dependency

## Additional Context

- The tests pass locally because the user's development environment likely has ts-node accessible (either via payload's dependency hoisting or global installation)
- Issues #1637, #1639, and #1642 were successfully implemented but this dependency issue was not caught during testing
- The workflow had 5 consecutive failures (runs 21190421980, 21189347158, 21178108810, 21083172267, 21081470085)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue list, git log, pnpm ls, grep, Read*
