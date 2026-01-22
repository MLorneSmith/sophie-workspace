# Bug Diagnosis: Review Sandbox Creation Timeout

**ID**: ISSUE-1739
**Created**: 2026-01-22T17:30:00Z
**Reporter**: User
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator's completion phase fails with "No review sandbox available - could not start dev server" because the `createReviewSandbox()` function times out. The outer timeout (5 minutes) is shorter than the internal `pnpm install` timeout (10 minutes), causing a timeout when dependencies take longer than expected to install on a fresh E2B sandbox.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v22.16.0
- **Database**: Supabase sandbox
- **Last Working**: N/A (new feature)

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 0000 --force-unlock --reset`
2. Wait for all features to complete (the debug spec has only 1 feature with 2 trivial tasks)
3. The orchestrator enters completion phase
4. Watch as the review sandbox creation times out after 5 minutes

## Expected Behavior

After feature implementation completes, the orchestrator should:
1. Kill all implementation sandboxes
2. Create a fresh review sandbox
3. Start the dev server on the review sandbox
4. Display the dev server URL for review

## Actual Behavior

1. Implementation sandboxes are killed
2. Review sandbox creation starts but times out after 5 minutes
3. `reviewSandbox` is `null`, leading to error message
4. No dev server URL is available for review

## Diagnostic Data

### Timeline Analysis
```
Feature completed at: 2026-01-22T17:22:32.455Z
Last checkpoint:      2026-01-22T17:27:44.562Z (5 min 12 sec later)
```

The 5 minute gap corresponds exactly to the `withTimeout(createReviewSandbox(...), 300000)` timeout.

### Manifest State
```json
{
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S0",
    "created_at": "2026-01-22T17:17:31.134Z"
  }
}
```

Note: `sandbox_ids` is empty because all implementation sandboxes were killed and the review sandbox was never successfully created.

### Console Output
```
12:27:44 [orchestrator] ❌ No review sandbox available - could not start dev server
```

## Error Stack Traces

Not available directly, but the error originates from the timeout in `withTimeout()`:

```typescript
// .ai/alpha/scripts/lib/orchestrator.ts:1594-1598
reviewSandbox = await withTimeout(
    createReviewSandbox(branchName, options.timeout, options.ui),
    300000,  // 5-minute timeout
    "Review sandbox creation",
);
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1580-1670)
  - `.ai/alpha/scripts/lib/sandbox.ts` (`createReviewSandbox` function)

- **Recent Changes**: Bug fix #1727 redesigned completion lifecycle

- **Suspected Functions**:
  - `createReviewSandbox()` in sandbox.ts
  - Completion phase logic in orchestrator.ts

## Related Issues & Context

### Same Component
- #1727: Bug fix for completion lifecycle redesign
- #1724: Bug fix for dev server startup timeout

### Similar Symptoms
- Timeout issues with sandbox operations

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `withTimeout()` wrapper for review sandbox creation (300 seconds / 5 minutes) is shorter than the internal `pnpm install` timeout (600 seconds / 10 minutes), causing premature timeout.

**Detailed Explanation**:

The `createReviewSandbox()` function performs these operations:
1. `Sandbox.create()` - Create E2B sandbox
2. `setupGitCredentials()` - Configure git
3. `git fetch origin` - 120s timeout
4. `git checkout` - 60s timeout
5. `git pull` - 60s timeout
6. `pnpm install --frozen-lockfile` - **600s (10 min) timeout**
7. `pnpm --filter @kit/shared build` - 120s timeout

The total could be: 120 + 60 + 60 + 600 + 120 = **960 seconds worst case**.

However, the outer `withTimeout()` is only 300 seconds (5 minutes). When `pnpm install` takes more than ~3-4 minutes (common on fresh E2B sandboxes that need to download all dependencies), the outer timeout fires before `pnpm install` completes.

**Supporting Evidence**:
- Timeline shows exactly 5 minutes between feature completion and the error
- The 5-minute delay matches the `withTimeout(..., 300000)` value
- `sandbox_ids` is empty, confirming the review sandbox was never added

### How This Causes the Observed Behavior

1. Feature implementation completes successfully
2. Orchestrator enters completion phase and kills all implementation sandboxes
3. Orchestrator starts `createReviewSandbox()` wrapped in 5-minute timeout
4. `pnpm install` takes longer than ~4 minutes
5. Outer timeout fires, rejecting the promise
6. `reviewSandbox` is set to `null` in the catch block
7. The conditional `if (reviewSandbox)` on line 1618 is false
8. The else branch on line 1664 logs "No review sandbox available"
9. Event emitter sends "dev_server_failed" event

### Confidence Level

**Confidence**: High

**Reasoning**: The timing evidence is conclusive - exactly 5 minutes elapsed between feature completion and the error, which matches the timeout value. The code path is clear and unambiguous.

## Fix Approach (High-Level)

Two options:

**Option 1 (Recommended)**: Increase the outer timeout to 10 minutes (600000ms) to match the internal `pnpm install` timeout:
```typescript
reviewSandbox = await withTimeout(
    createReviewSandbox(branchName, options.timeout, options.ui),
    600000,  // 10-minute timeout (was 300000)
    "Review sandbox creation",
);
```

**Option 2**: Add progress logging inside `createReviewSandbox()` to help diagnose which step is slow, and potentially optimize the slow steps (e.g., using cached node_modules in the E2B template).

## Diagnosis Determination

The root cause has been conclusively identified: timeout mismatch between outer wrapper (5 min) and internal operation (10 min). The fix is straightforward - increase the outer timeout.

## Additional Context

- The orchestrator is currently waiting at `uiManager.waitForExit()` (line 1726)
- The lock file is still held by PID 506891
- The implementation itself completed successfully - this is purely a completion phase issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, Glob*
