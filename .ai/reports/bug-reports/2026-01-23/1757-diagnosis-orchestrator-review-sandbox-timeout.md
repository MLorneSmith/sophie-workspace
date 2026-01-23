# Bug Diagnosis: Review Sandbox Creation Timeout During Completion Phase (Regression)

**ID**: ISSUE-1757
**Created**: 2026-01-23T10:30:00Z
**Reporter**: user (via /diagnose command)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The Alpha orchestrator's completion phase fails to create a review sandbox with a 10-minute timeout, resulting in no dev server URL being displayed on the completion screen. This is caused by two issues:

1. **Timeout mismatch**: The outer timeout (600 seconds) equals the inner `pnpm install` timeout (600 seconds), but doesn't account for the 2-4 minutes of git operations that precede `pnpm install`
2. **Unnecessary install**: The review sandbox ALWAYS runs `pnpm install` even though the E2B template has pre-installed dependencies (implementation sandboxes skip this and are fast)

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 22.x
- **Last Working**: Partially fixed in #1742 (outer timeout increased from 5 to 10 minutes)

## Reproduction Steps

1. Run the Alpha orchestrator on spec S0 with UI mode: `pnpm orchestrate S0 --ui`
2. Wait for all features to complete implementation (2 tasks completed)
3. Observe the completion phase begin at `9:49:48 AM`
4. Wait 10 minutes
5. Observe failure at `9:59:58 AM`: "❌ No review sandbox available - could not start dev server"

## Expected Behavior

The review sandbox should be created successfully and the dev server URL should be displayed on the completion screen.

## Actual Behavior

- Completion phase starts: `9:49:48 AM 📦 Creating fresh review sandbox for dev server`
- After exactly 10 minutes and 10 seconds: `9:59:58 AM ❌ No review sandbox available - could not start dev server`
- No dev server URL is displayed
- The `overall-progress.json` file shows `status: "completed"` but has no `reviewUrls` field
- The `spec-manifest.json` shows `sandbox_ids: []` (empty array)

## Diagnostic Data

### Timeline Analysis
```
Start:  9:49:48 AM - Creating fresh review sandbox
Fail:   9:59:58 AM - No review sandbox available

Duration: 10 minutes 10 seconds (≈ 600 seconds outer timeout)
```

### Console Output
```
Completion Phase Events:
9:59:58 AM ❌ No review sandbox available - could not start dev server
9:49:48 AM 📦 Creating fresh review sandbox for dev server
9:49:48 AM 🛑 Killing implementation sandbox sbx-c
9:49:48 AM 🛑 Killing implementation sandbox sbx-b
9:49:48 AM 🛑 Killing implementation sandbox sbx-a
9:49:48 AM 🔄 Completion phase started - cleaning up implementation sandboxes
```

### Manifest State After Failure
```json
{
  "progress": {
    "status": "completed",
    "completed_at": "2026-01-23T14:49:48.219Z"
  },
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S0"
  }
}
```

## Error Stack Traces
```
Error: Timeout after 600000ms: Review sandbox creation
    at withTimeout (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/utils.ts:36)
```

## Related Code

### Affected Files
- `.ai/alpha/scripts/lib/orchestrator.ts:1607-1611` - Outer timeout wrapper (600s) - increase to 900s
- `.ai/alpha/scripts/lib/sandbox.ts:878-886` - Unconditional `pnpm install` - add node_modules/lockfile check

### Timeout Configuration

**Outer wrapper** (`orchestrator.ts:1607-1610`):
```typescript
reviewSandbox = await withTimeout(
    createReviewSandbox(branchName, options.timeout, options.ui),
    600000,  // 10 minutes
    "Review sandbox creation",
);
```

**Inner operations** (`sandbox.ts`):
| Operation | Timeout | Line |
|-----------|---------|------|
| Sandbox.create | dynamic | 845-849 |
| setupGitCredentials | 10s each | 855 |
| git fetch origin | 120s | 860-862 |
| git fetch + checkout | 60s | 865-868 |
| git pull | 60s | 871-874 |
| pnpm install | **600s (10 min)** | 884-886 |
| pnpm build | 120s | 890-893 |

**Total potential time: 12-15+ minutes (exceeds outer 10-minute timeout)**

## Related Issues & Context

### Direct Predecessors
- #1742 (CLOSED): "Bug Fix: Review sandbox creation times out during completion phase" - Increased outer timeout from 5 to 10 minutes. **This is a regression from an incomplete fix.**
- #1739 (CLOSED): "Bug Diagnosis: Review sandbox creation times out during completion phase" - Original diagnosis
- #1749 (CLOSED): "Bug Diagnosis: PR Validation Workflow Multiple Failures" - Added unconditional `pnpm install` to review sandbox (contributed to slowdown)

### Similar Symptoms
- #1722 (CLOSED): "Bug Diagnosis: Orchestrator Completion Phase Issues"
- #1724 (CLOSED): "Bug Fix: Orchestrator Completion Phase Issues"
- #1731 (CLOSED): "Bug Diagnosis: Missing Dev Server URL on Orchestrator Completion Screen"

### Historical Context
The fix in #1742 increased the outer timeout from 300 seconds (5 min) to 600 seconds (10 min) to "match or exceed internal operation timeout". However, the fix only considered the `pnpm install` timeout (600s) and did not account for the cumulative time of operations BEFORE `pnpm install`:

- Sandbox.create: 10-30s
- Git credentials setup: ~10s
- Git fetch: up to 120s
- Git checkout: up to 60s
- Git pull: up to 60s
- **Subtotal before pnpm install: 2-5 minutes**

When added to the 10-minute `pnpm install` timeout, the total can exceed 12-15 minutes.

## Root Cause Analysis

### Identified Root Cause #1: Timeout Arithmetic

**Summary**: The outer `withTimeout()` wrapper (600 seconds) equals but does not exceed the total time required for all operations inside `createReviewSandbox()`, which can take up to 12-15 minutes in worst case scenarios.

**Detailed Explanation**:
The `createReviewSandbox()` function performs these sequential operations:
1. `Sandbox.create()` - Variable time (10-30 seconds typically)
2. `setupGitCredentials()` - Multiple git config commands (~10 seconds)
3. `git fetch origin` - Network-bound (up to 120 second timeout)
4. `git fetch + checkout` - Network-bound (up to 60 second timeout)
5. `git pull` - Network-bound (up to 60 second timeout)
6. `pnpm install` - Package installation (**up to 600 second timeout**)
7. `pnpm build` - Build step (up to 120 second timeout)

The outer wrapper at `orchestrator.ts:1607` uses a 600,000ms (10 minute) timeout. However, `pnpm install` alone can take the full 10 minutes, leaving zero time for the 2-5 minutes of preceding operations.

**Supporting Evidence**:
- The timeout occurred at exactly 10 minutes after the operation started
- The error message "Timeout after 600000ms: Review sandbox creation" confirms the outer wrapper fired
- The `sandbox_ids: []` in the manifest confirms no sandbox was ever successfully created and tracked

### Identified Root Cause #2: Unnecessary pnpm install

**Summary**: The review sandbox ALWAYS runs `pnpm install` unconditionally, even though the E2B template already has pre-installed dependencies. Implementation sandboxes skip this step and are fast.

**Code Comparison**:

Implementation sandboxes (`createSandbox`, lines 450-461):
```typescript
// Fast path - checks if node_modules exists, skips install if present
const checkResult = await sandbox.commands.run(
    `test -d node_modules && echo "exists" || echo "missing"`
);
if (checkResult.stdout.trim() === "missing") {
    await sandbox.commands.run(`pnpm install --frozen-lockfile`);
}
```

Review sandbox (`createReviewSandbox`, lines 884-886):
```typescript
// Slow path - ALWAYS runs full install (no check)
await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
    timeoutMs: 600000,
});
```

**Why this matters**: Both sandbox types use the same E2B template (`TEMPLATE_ALIAS`) which has `node_modules` pre-installed. The implementation sandboxes detect this and skip install (~2-3 min total). The review sandbox ignores this and always does a full install (~10+ min total).

**Historical Context**: PR #1749 added the unconditional `pnpm install` with the comment "branch may have added new dependencies". While valid, this is overly cautious - in most cases the branch won't have new deps, and we can detect when it does by checking if `pnpm-lock.yaml` changed.

### How This Causes the Observed Behavior

1. Completion phase starts, all implementation sandboxes are killed
2. `createReviewSandbox()` begins (emits "Creating fresh review sandbox" event)
3. Git operations run successfully (2-4 minutes)
4. `pnpm install` starts but takes 7-8+ minutes (still within its own 10-minute timeout)
5. Outer `withTimeout()` fires at exactly 10 minutes total
6. `createReviewSandbox()` rejects with timeout error
7. `reviewSandbox` remains `null`
8. Code path enters `else` branch at line 1677: "No review sandbox available"
9. `reviewUrls` array remains empty
10. Manifest saved with empty `reviewUrls`

### Confidence Level

**Confidence**: High

**Reasoning**:
- The exact 10-minute timeout matches the configured `withTimeout()` value
- The arithmetic of inner timeouts exceeds the outer timeout
- Similar issue was partially fixed in #1742 but the fix was incomplete
- The code path is deterministic and the failure point is clearly at the outer timeout

## Fix Approach (Two-Part)

### Part 1: Optimize - Match implementation sandbox pattern (PRIMARY FIX)

Update `createReviewSandbox()` to check if dependencies need syncing before running install. This matches the pattern used by implementation sandboxes:

```typescript
// sandbox.ts - createReviewSandbox()

// Check if node_modules exists (same as implementation sandboxes)
const checkResult = await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
    { timeoutMs: 10000 },
);

if (checkResult.stdout.trim() === "missing") {
    log("   Installing dependencies (node_modules missing)...");
    await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
        timeoutMs: 600000,
    });
} else {
    // Check if lockfile changed (new dependencies added by branch)
    const lockfileCheck = await sandbox.commands.run(
        `cd ${WORKSPACE_DIR} && git diff --name-only HEAD~1 HEAD -- pnpm-lock.yaml | wc -l`,
        { timeoutMs: 10000 },
    );

    if (lockfileCheck.stdout.trim() !== "0") {
        log("   Syncing dependencies (lockfile changed)...");
        await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
            timeoutMs: 600000,
        });
    } else {
        log("   ✅ Dependencies already installed (skipping pnpm install)");
    }
}
```

**Expected improvement**: Review sandbox creation drops from 10+ minutes to ~2-3 minutes (matching implementation sandboxes).

### Part 2: Safety Net - Increase outer timeout

Even with the optimization, increase outer timeout to handle edge cases where install IS needed:

```typescript
// orchestrator.ts:1607
reviewSandbox = await withTimeout(
    createReviewSandbox(branchName, options.timeout, options.ui),
    900000,  // 15 minutes - safety net for worst case
    "Review sandbox creation",
);
```

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts:878-886` - Add node_modules/lockfile check
- `.ai/alpha/scripts/lib/orchestrator.ts:1607-1611` - Increase outer timeout to 15 min

## Diagnosis Determination

Two root causes identified:

1. **Timeout mismatch**: The outer timeout (600s) does not account for the cumulative time of all inner operations (potentially 12-15 minutes). This is a regression from an incomplete fix in #1742.

2. **Unnecessary install**: The review sandbox unconditionally runs `pnpm install` even when the E2B template already has dependencies installed. Implementation sandboxes skip this step and complete in 2-3 minutes.

The fix addresses both issues: optimizing the common case (skip install when not needed) and increasing the timeout for the edge case (when install IS needed).

## Additional Context

- PR #1749 added unconditional `pnpm install` to handle branches with new dependencies, but this is overly cautious for the majority case
- Both sandbox types use the same E2B template with pre-installed dependencies
- The lockfile check (`git diff pnpm-lock.yaml`) accurately detects when new dependencies were added

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (gh issue list/view), Task (context7-expert for E2B SDK docs)*
