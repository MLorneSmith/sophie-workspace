# Bug Diagnosis: E2E Sharded Workflow Fails - npx tsx Incompatible with pnpm

**ID**: ISSUE-pending
**Created**: 2026-01-20T23:59:00Z
**Reporter**: system/CI
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow continues to fail with `sh: 1: tsx: not found` despite Issue #1659 adding tsx as a devDependency to `apps/e2e/package.json`. The root cause is that the workflow uses `npx tsx` which is incompatible with pnpm's dependency resolution. `npx` looks for packages in npm's cache and global installations, not in pnpm's store or workspace node_modules directories.

## Environment

- **Application Version**: dev branch (commit 5fd56a462)
- **Environment**: GitHub Actions CI (RunsOn self-hosted runners)
- **Node Version**: 20
- **pnpm Version**: 10.14.0
- **Runner**: runs-on-v2.2-ubuntu22-full-x64

## Reproduction Steps

1. Push any change to the `dev` branch that triggers the E2E sharded workflow
2. Observe the "Setup Test Server" job
3. "Wait for Supabase health" step fails with error: `sh: 1: tsx: not found`

## Expected Behavior

The `tsx` command should be found and execute the TypeScript health check script successfully.

## Actual Behavior

The workflow fails immediately with `sh: 1: tsx: not found` when trying to run `npx tsx apps/e2e/tests/setup/supabase-health.ts`.

## Diagnostic Data

### Console Output
```
Setup Test Server	Wait for Supabase health	2026-01-20T23:52:39.1468081Z 🏥 Running enhanced Supabase health checks with exponential backoff...
Setup Test Server	Wait for Supabase health	2026-01-20T23:52:39.1468968Z See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes
Setup Test Server	Wait for Supabase health	2026-01-20T23:52:42.6760218Z sh: 1: tsx: not found
Setup Test Server	Wait for Supabase health	2026-01-20T23:52:42.6865072Z ##[error]Process completed with exit code 127.
```

### Workflow Analysis

The failing command in `.github/workflows/e2e-sharded.yml` line 102:
```yaml
- name: Wait for Supabase health
  run: |
    echo "🏥 Running enhanced Supabase health checks with exponential backoff..."
    echo "See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes"
    # Use tsx to run the TypeScript health check script (faster than ts-node, no tsconfig needed)
    # This provides multi-stage verification: PostgreSQL -> PostgREST -> Kong API
    npx tsx apps/e2e/tests/setup/supabase-health.ts
```

### Root Cause Investigation

| Test | Result | Implication |
|------|--------|-------------|
| `pnpm --filter web-e2e exec which tsx` | `./node_modules/.bin/tsx` | tsx IS installed in the workspace |
| `npx tsx --version` (local) | Works | Local pnpm store has tsx cached |
| `npx tsx` (fresh CI runner) | Fails | CI has no npm cache, npx can't find package |

## Error Stack Traces

```
sh: 1: tsx: not found
##[error]Process completed with exit code 127
```

Exit code 127 indicates "command not found" - the shell could not locate the `tsx` executable.

## Related Code

- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml:102` - Uses `npx tsx` instead of pnpm-compatible command
  - `apps/e2e/package.json` - Has tsx as devDependency (correctly added in Issue #1659)

- **Recent Changes**:
  - Issue #1655: Diagnosed ts-node not found
  - Issue #1657: Fixed by replacing ts-node with tsx in workflow
  - Issue #1658: Diagnosed tsx not available as dependency
  - Issue #1659: Added tsx to apps/e2e/package.json devDependencies

- **Suspected Functions**: The `npx` command in the workflow, not tsx itself

## Related Issues & Context

### Direct Predecessors
- #1659 [CLOSED]: "Bug Fix: E2E Sharded Workflow Fails - tsx Not Available as Dependency" - Added tsx as devDependency, but didn't address npx incompatibility
- #1658 [CLOSED]: "Bug Diagnosis: E2E Sharded Workflow Fails - tsx Not Available as Dependency" - Diagnosed missing dependency, but missed the npx/pnpm incompatibility
- #1657 [CLOSED]: "Bug Fix: E2E Sharded Workflow Fails - ts-node Not Found in CI" - Replaced ts-node with tsx but used npx
- #1655 [CLOSED]: "Bug Diagnosis: E2E Sharded Workflow Fails - ts-node Not Found in CI" - Original diagnosis

### Historical Context
This is the **fourth issue** in a chain of related E2E sharded workflow failures:
1. #1655/#1657: ts-node not found → replaced with tsx
2. #1658/#1659: tsx not in dependencies → added to package.json
3. **This issue**: npx incompatible with pnpm → need to use pnpm exec

## Root Cause Analysis

### Identified Root Cause

**Summary**: The workflow uses `npx tsx` which is incompatible with pnpm because npx looks for packages in npm's cache and global installations, not in pnpm's workspace-local node_modules.

**Detailed Explanation**:

1. **pnpm strict hoisting**: pnpm uses a content-addressable store and symlinks packages into `node_modules/.pnpm`. It doesn't hoist packages the same way npm does.

2. **npx is npm-centric**: When npx runs, it:
   - Checks `./node_modules/.bin` (current directory)
   - Checks npm's global cache
   - If not found, attempts to install from npm registry

   However, in a pnpm workspace:
   - `tsx` is installed in `apps/e2e/node_modules/.bin/tsx`
   - Running `npx tsx` from the repo root doesn't find it because npx doesn't traverse pnpm workspace structure
   - The CI runner has no npm global cache, so npx fails

3. **Why it works locally but fails in CI**:
   - Local development machines often have tsx in the pnpm store from previous installs
   - Fresh CI runners start with empty npm caches
   - npx's automatic install feature requires npm registry access and may fail silently

**Supporting Evidence**:
- Error message: `sh: 1: tsx: not found` (not an npm/npx error, but a shell error)
- Exit code 127: Command not found
- tsx IS correctly installed in `apps/e2e/node_modules/.bin/tsx` as verified locally
- GitHub issue research confirms this is a known pnpm + npx incompatibility

Sources:
- [tsx: command not found when using pnpm - GitHub Issue #720](https://github.com/aws-amplify/amplify-backend/issues/720)
- [npx tsx not working - GitHub Issue #261](https://github.com/privatenumber/tsx/issues/261)

### How This Causes the Observed Behavior

1. Workflow runs `npx tsx apps/e2e/tests/setup/supabase-health.ts`
2. npx searches for tsx executable in npm locations (not pnpm workspace)
3. tsx not found in npm cache (fresh CI runner)
4. npx falls back to running `tsx` as a shell command
5. Shell can't find `tsx` in PATH
6. Shell returns exit code 127 with message "tsx: not found"

### Confidence Level

**Confidence**: High

**Reasoning**:
- This is a well-documented incompatibility between npx and pnpm
- The error message exactly matches the known failure mode
- Local testing confirms tsx is correctly installed in the workspace
- Multiple GitHub issues document the same problem with the same solution

## Fix Approach (High-Level)

Replace `npx tsx` with `pnpm exec tsx` in the workflow file. Two options:

**Option 1 - Direct pnpm exec**:
```yaml
pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts
```

**Option 2 - Filter to web-e2e workspace** (more explicit):
```yaml
pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts
```

Option 1 is preferred because `pnpm exec` from the repo root will find tsx if it's installed anywhere in the workspace.

## Diagnosis Determination

The root cause has been definitively identified: **npx is incompatible with pnpm's dependency resolution in CI environments**. The fix is straightforward - replace `npx tsx` with `pnpm exec tsx` in the workflow file at line 102.

This completes the chain of fixes:
1. ~~ts-node not found~~ → Use tsx instead ✅
2. ~~tsx not in dependencies~~ → Add to package.json ✅
3. **npx incompatible with pnpm** → Use pnpm exec instead (this fix)

## Additional Context

This is the same pattern that was used in Issue #1657, but that fix only changed `ts-node` to `tsx` without also changing `npx` to `pnpm exec`. The fix was incomplete.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue search), grep, read, web search*
