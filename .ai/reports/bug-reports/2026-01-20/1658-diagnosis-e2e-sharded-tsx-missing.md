# Bug Diagnosis: E2E Sharded Workflow Fails - tsx Not Available as Dependency

**ID**: ISSUE-1658
**Created**: 2026-01-20T23:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow consistently fails in the "Wait for Supabase health" step with error `sh: 1: tsx: not found`. This occurs because `tsx` is not a dependency of `apps/e2e` or the root `package.json`, and pnpm's strict hoisting prevents the command from finding it. The previous "fix" (Issue #1657, commit 8f9324d9d) incorrectly changed `ts-node` to `tsx` without adding `tsx` as a dependency.

## Environment

- **Application Version**: 2.13.1
- **Environment**: GitHub Actions CI (RunsOn runners)
- **Node Version**: 20.10.0
- **pnpm Version**: 10.14.0
- **Last Working**: Never (this step has never successfully executed)

## Reproduction Steps

1. Push changes to `dev` branch or create a PR targeting it
2. E2E sharded workflow triggers
3. Setup Test Server job starts
4. After Supabase starts, "Wait for Supabase health" step runs
5. `npx tsx apps/e2e/tests/setup/supabase-health.ts` executes
6. Workflow fails with `sh: 1: tsx: not found`

## Expected Behavior

The `npx tsx` command should find and execute `tsx` to run the TypeScript health check script.

## Actual Behavior

The command fails with `sh: 1: tsx: not found` because:
1. `tsx` is not in `node_modules/.bin` at the root level
2. `npx` fails to download/resolve the package
3. The shell attempts to run `tsx` directly and fails

## Diagnostic Data

### Console Output
```
Setup Test Server	Wait for Supabase health	2026-01-20T23:20:02.6196139Z 🏥 Running enhanced Supabase health checks with exponential backoff...
Setup Test Server	Wait for Supabase health	2026-01-20T23:20:02.6197049Z See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes
Setup Test Server	Wait for Supabase health	2026-01-20T23:20:06.3147926Z sh: 1: tsx: not found
Setup Test Server	Wait for Supabase health	2026-01-20T23:20:06.3251337Z ##[error]Process completed with exit code 127.
```

### Dependency Analysis
```
# tsx is ONLY found in these packages:
apps/payload/package.json:90:     "tsx": "^4.21.0",
scripts/package.json:18:     "tsx": "^4.21.0",

# tsx is NOT in:
- apps/e2e/package.json (where the health check script lives)
- package.json (root)
```

### Workflow Configuration (line 100-102)
```yaml
- name: Wait for Supabase health
  run: |
    echo "🏥 Running enhanced Supabase health checks with exponential backoff..."
    echo "See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes"
    # Use tsx to run the TypeScript health check script (faster than ts-node, no tsconfig needed)
    # This provides multi-stage verification: PostgreSQL -> PostgREST -> Kong API
    npx tsx apps/e2e/tests/setup/supabase-health.ts
```

## Error Stack Traces
```
sh: 1: tsx: not found
##[error]Process completed with exit code 127
```

Exit code 127 indicates "command not found" in bash/sh.

## Related Code

- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (line 102)
  - `apps/e2e/tests/setup/supabase-health.ts` (the script to run)
  - `apps/e2e/package.json` (missing tsx dependency)

- **Recent Changes**:
  - Commit 8f9324d9d (2026-01-20): "fix(ci): replace ts-node with tsx in E2E sharded workflow"
  - This commit changed the command but didn't add tsx as a dependency

- **The Health Check Script**:
  - Location: `apps/e2e/tests/setup/supabase-health.ts`
  - Imports: `pg` (PostgreSQL client)
  - Purpose: Multi-stage health verification (PostgreSQL → PostgREST → Kong)

## Related Issues & Context

### Direct Predecessors
- #1657 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails - ts-node Not Found in CI" - Same problem, incomplete fix
- #1655 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow Fails - ts-node Not Found in CI" - Original diagnosis

### Related Infrastructure Issues
- #1642 (CLOSED): "Bug Fix: E2E Sharded Workflow Dual Failure Modes" - Added the health check script
- #1641: Diagnosis that led to adding the TypeScript health check script

### Pattern Recognition
This is the **21st+ issue** related to the E2E sharded workflow. The workflow has had a cascade of configuration problems:
1. Missing environment variables (#1637, #1636, #1625, #1626)
2. Password mismatches (#1639, #1638)
3. JWT key issues (#1621, #1615)
4. Supabase health check timing (#1642, #1641, #1632, #1631)
5. Build configuration (#1565, #1564, #1598)
6. WebServer timeouts (#1584, #1583, #1570, #1569)
7. **Now: Missing TypeScript runner dependency**

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `tsx` package is not a dependency of `apps/e2e` or the root `package.json`, causing `npx tsx` to fail in CI.

**Detailed Explanation**:

1. **pnpm's Strict Hoisting**: pnpm uses strict dependency hoisting by default. This means packages are only available in `node_modules/.bin` if they are direct dependencies of the package or its ancestors in the workspace.

2. **tsx Location**: `tsx` is only declared as a dependency in:
   - `apps/payload/package.json`
   - `scripts/package.json`

3. **Execution Context**: The workflow runs `npx tsx` from the repository root. Since `tsx` is not in the root `package.json` or `apps/e2e/package.json` (where the script lives), it's not available.

4. **npx Fallback Failure**: When `npx` can't find a package locally, it attempts to download it from npm. This appears to fail silently, leading npx to try running `tsx` as a direct command, which produces the `sh: 1: tsx: not found` error.

5. **Previous "Fix" Was Incomplete**: Commit 8f9324d9d changed `npx ts-node --project apps/e2e/tsconfig.json` to `npx tsx`, but:
   - Neither `ts-node` nor `tsx` were ever dependencies in the right location
   - The fix just changed which package is missing, not the underlying problem

**Supporting Evidence**:
```bash
# Grep for tsx in package.json files
$ grep -r '"tsx"' **/package.json
apps/payload/package.json:     "tsx": "^4.21.0",
scripts/package.json:     "tsx": "^4.21.0",

# apps/e2e/package.json does NOT contain tsx
# Root package.json does NOT contain tsx
```

### How This Causes the Observed Behavior

1. Workflow starts → Supabase starts successfully
2. "Wait for Supabase health" step runs `npx tsx apps/e2e/tests/setup/supabase-health.ts`
3. npx looks for tsx in `node_modules/.bin` → not found
4. npx tries to download tsx from npm → fails (possibly network/timeout)
5. npx falls back to running `tsx` directly → shell can't find it
6. Shell returns exit code 127 ("command not found")
7. Workflow fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message `sh: 1: tsx: not found` is unambiguous
- Grep confirms tsx is not a dependency in the correct locations
- The same pattern occurred with ts-node before (Issue #1655/#1657)
- This is a straightforward dependency resolution issue

## Fix Approach (High-Level)

Two recommended approaches:

**Option A (Preferred)**: Add tsx as a devDependency to `apps/e2e/package.json`:
```json
"devDependencies": {
  "tsx": "^4.21.0",
  // ... existing deps
}
```

**Option B**: Add tsx to root `package.json` devDependencies to make it available everywhere.

**Option C (Alternative)**: Rewrite `supabase-health.ts` in pure JavaScript to avoid needing a TypeScript runner entirely. This would be more robust but requires more effort.

After adding the dependency:
1. Run `pnpm install` to update lockfile
2. Commit both `package.json` and `pnpm-lock.yaml`
3. Push and verify workflow passes

## Diagnosis Determination

The root cause is definitively identified: **tsx is not a dependency in `apps/e2e/package.json` or root `package.json`**, causing `npx tsx` to fail.

The previous fix (Issue #1657) was incomplete - it changed the tool from ts-node to tsx but didn't add tsx as a dependency. This is a simple configuration oversight.

## Additional Context

### Why npx Fails to Download

In CI environments, `npx` may fail to download packages for several reasons:
1. Network timeouts or rate limiting
2. npm registry connectivity issues
3. Race conditions during parallel job startup
4. CI runner restrictions on package downloads

The safest approach is to always have required tools as explicit dependencies rather than relying on npx's download capability.

### Workflow Complexity

This E2E sharded workflow has had 20+ issues. Consider a more comprehensive review to:
1. Document all required dependencies upfront
2. Add a dependency verification step at workflow start
3. Consider simplifying the health check approach

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, grep, read*
