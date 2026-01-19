# Bug Diagnosis: Alpha Orchestrator Review Sandbox Dev Server Failure - Dependencies Not Installed

**ID**: ISSUE-pending
**Created**: 2026-01-19T18:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

After implementing issue #1590 (fresh review sandbox for dev server), the dev server still fails to start on the review sandbox. The root cause is that `createReviewSandbox()` does not run `pnpm install` after checking out the branch because `node_modules` already exists in the E2B template. When the template was built from the `dev` branch but the review sandbox checks out a feature branch (e.g., `alpha/spec-1362`) with different dependencies, the dependencies are mismatched.

## Environment

- **Application Version**: dev branch
- **Environment**: development (E2B sandbox)
- **Node Version**: 20.x
- **Run ID**: run-mkldbq8z-anrg
- **Spec ID**: 1362
- **Review Sandbox ID**: ih2rdkgd9m9i679qzcrod
- **Template Alias**: slideheroes-claude-agent-dev

## Reproduction Steps

1. Build E2B template from `dev` branch (dependencies pre-installed)
2. Run Alpha Orchestrator for a spec: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
3. Wait for all features to complete (13 features, 110 tasks)
4. Observe the completion screen - review sandbox is created
5. Dev server fails to start within 60 seconds

## Expected Behavior

The review sandbox should:
1. Checkout the feature branch (`alpha/spec-1362`)
2. Run `pnpm install --frozen-lockfile` to sync dependencies with the branch's lockfile
3. Start the dev server successfully within 60 seconds

## Actual Behavior

The review sandbox:
1. Checkouts the feature branch correctly
2. Skips `pnpm install` because `node_modules` directory already exists
3. Dependencies may be mismatched with the branch's pnpm-lock.yaml
4. Dev server fails to start (likely due to missing or wrong dependencies)

```
Dev Server: (failed to start)
```

The `overall-progress.json` confirms:
```json
{
  "reviewUrls": [
    {
      "label": "sbx-review",
      "vscode": "https://8080-ih2rdkgd9m9i679qzcrod.e2b.app",
      "devServer": "(failed to start)"
    }
  ]
}
```

## Diagnostic Data

### Code Analysis

**File**: `.ai/alpha/scripts/lib/sandbox.ts` (lines 534-546)

```typescript
// Verify dependencies
const checkResult = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
  { timeoutMs: 10000 },
);

if (checkResult.stdout.trim() === "missing") {
  log("   Installing dependencies...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
    { timeoutMs: 600000 },
  );
}
```

**Issue**: This check only verifies if `node_modules` exists, not if the installed dependencies match the current lockfile. Since the E2B template has pre-installed dependencies, `node_modules` always exists, so `pnpm install` is never run after branch checkout.

### pnpm Behavior Research

According to pnpm documentation and research:
- `pnpm install --frozen-lockfile` checks if installed dependencies match the lockfile
- When already synced, it completes in **<1 second** (headless mode)
- When different, it re-links packages from the store (fast if cached)
- **Should always run after branch checkout** to ensure dependency consistency

### start-dev Script

**File**: `packages/e2b/e2b-template/template.ts` (lines 159-164)

```bash
#!/bin/bash
cd /home/user/project
echo "Starting dev server on port 3000..."
pnpm dev &
echo "Dev server starting on port 3000 (may take 10-30 seconds to compile)"
```

The `pnpm dev` command runs `turbo dev --parallel` which starts both web (port 3000) and payload (port 3020) servers. This requires all dependencies to be correctly installed.

## Error Stack Traces

No stack trace available - this is a startup failure, not an exception. The dev server simply doesn't respond to health checks within the 60-second timeout.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts` (`createReviewSandbox()` function, lines 492-562)
  - `.ai/alpha/scripts/lib/orchestrator.ts` (review sandbox creation, lines 1250-1310)
  - `packages/e2b/e2b-template/template.ts` (`start-dev` script)

- **Recent Changes**:
  - Issue #1590 implemented `createReviewSandbox()` - fresh sandbox for review
  - Issue #1589 diagnosed the original timeout issue

- **Related Functions**:
  - `createSandbox()` - Has the same dependency check issue but works because implementation runs on template's branch
  - `startDevServer()` - Health check function with 60-second timeout

## Related Issues & Context

### Direct Predecessors
- #1589 (CLOSED): "Alpha Orchestrator Dev Server Startup Timeout" - Original diagnosis
- #1590 (CLOSED): "Fresh Sandbox for Review" - Implemented fix that introduced this regression

### Historical Context
Issue #1590 was implemented to solve the dev server timeout by creating a fresh sandbox. However, the implementation did not account for the fact that the fresh sandbox template has dependencies pre-installed from a different branch.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `createReviewSandbox()` checks if `node_modules` exists but not if dependencies match the current branch's lockfile. Since E2B templates have pre-installed dependencies, `pnpm install` is never run after branch checkout.

**Detailed Explanation**:

1. **E2B Template Build Process**:
   - Template is built from `dev` branch
   - `pnpm install` is run during template build
   - Dependencies are cached in the template image

2. **Review Sandbox Creation**:
   - Fresh sandbox is created from template
   - Branch `alpha/spec-1362` is checked out
   - `node_modules` check passes (directory exists from template)
   - `pnpm install` is **skipped**

3. **Dependency Mismatch**:
   - The feature branch may have added/removed/updated dependencies
   - The installed dependencies don't match the branch's `pnpm-lock.yaml`
   - Dev server fails due to missing or incompatible dependencies

**Evidence**:

1. Code clearly shows conditional install based only on `node_modules` existence
2. pnpm documentation confirms lockfile matching is required after branch switch
3. Template is built from `dev` branch, not from the feature branch being reviewed

### How This Causes the Observed Behavior

1. Template created with `dev` branch dependencies
2. Review sandbox created from template
3. Feature branch `alpha/spec-1362` checked out (may have new dependencies)
4. `pnpm install` skipped because `node_modules` exists
5. `pnpm dev` (turbo) tries to run with potentially missing packages
6. Dev server fails to start or crashes
7. Health check times out after 60 seconds
8. UI shows "(failed to start)"

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and deterministic
- pnpm behavior is well-documented
- The same dependency check issue exists in `createSandbox()` but doesn't cause problems there because implementation sandboxes work on the template's base branch
- This is a regression introduced in #1590 - the fresh sandbox approach didn't account for cross-branch dependency differences

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Always run `pnpm install --frozen-lockfile` after branch checkout

```typescript
// In createReviewSandbox():
// After branch checkout, ALWAYS run pnpm install
log("   Syncing dependencies with branch lockfile...");
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
  { timeoutMs: 600000 },
);
```

**Rationale**:
- When dependencies are already synced: <1 second (headless mode)
- When different: re-links from store (fast with cache)
- Guarantees correct dependencies for any branch

**Option 2**: Hash-based lockfile comparison

```typescript
// Compare lockfile hash before and after checkout
const templateHash = await getLocfileHash(sandbox, "before checkout");
await checkoutBranch(sandbox, branchName);
const branchHash = await getLocfileHash(sandbox, "after checkout");

if (templateHash !== branchHash) {
  log("   Lockfile changed, installing dependencies...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
    { timeoutMs: 600000 },
  );
}
```

**Rationale**: Slightly more complex but avoids even the <1s overhead when not needed.

**Recommendation**: Option 1 - The simplicity and guaranteed correctness outweighs the minimal overhead. Even when synced, `pnpm install --frozen-lockfile` takes <1 second.

## Diagnosis Determination

The dev server failure on the review sandbox is caused by a regression in the #1590 implementation. The `createReviewSandbox()` function checks if `node_modules` exists but doesn't verify that the installed dependencies match the current branch's lockfile. Since E2B templates have pre-installed dependencies from the `dev` branch, `pnpm install` is never run after checking out a different feature branch.

The fix is straightforward: always run `pnpm install --frozen-lockfile` after branch checkout, regardless of whether `node_modules` exists. This adds <1 second overhead when dependencies are already synced, but guarantees correct dependencies for any branch.

## Additional Context

### Why This Wasn't Caught in Testing

The unit tests for `createReviewSandbox()` mock the E2B sandbox commands, so they don't actually test real dependency installation. The tests verify the function logic but not the E2B sandbox state.

### Why createSandbox() Doesn't Have This Issue

The implementation sandbox (`createSandbox()`) has the same dependency check, but it works because:
1. It creates a branch based on `dev` (template's branch) or an existing spec branch
2. If the spec branch exists, it was created from `dev` with the same base dependencies
3. New dependencies are installed during feature implementation when needed

The review sandbox is different because it checks out a branch that may have accumulated dependency changes across many features.

### Impact Assessment

**Severity**: Medium
- VS Code still works for code review
- User can manually run `pnpm install && pnpm dev` via VS Code terminal
- The error is clearly reported (not silent failure)
- Only affects post-completion review phase

---
*Generated by Claude Opus 4.5 Debug Assistant*
*Tools Used: Read, Glob, Grep, Task (perplexity-expert for pnpm research)*
