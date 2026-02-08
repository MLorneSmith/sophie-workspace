# Bug Diagnosis: Missing Dev Server URL on Orchestrator Completion Screen

**ID**: ISSUE-1731
**Created**: 2026-01-22T16:45:00.000Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When the Alpha Orchestrator completes spec implementation and displays the completion screen, the dev server URL is missing. The completion screen should show a clickable link to the dev server so users can review the implementation, but this link is not appearing.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Prior to issue #1727 fix (completion phase redesign)

## Reproduction Steps

1. Run the Alpha Orchestrator on a spec (e.g., S0000)
2. Wait for all features to complete implementation
3. Observe the completion screen appears
4. Notice that the dev server URL is missing from the completion display

## Expected Behavior

The completion screen should display:
- VS Code URL for the review sandbox
- Dev Server URL for accessing the running Next.js application
- Both URLs should be clickable/copyable for easy access

## Actual Behavior

The completion screen appears with no review URLs. The `overall-progress.json` file is missing the `reviewUrls` field entirely. The UI has no dev server link to display.

## Diagnostic Data

### Manifest State
```json
{
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S0",
    "created_at": "2026-01-22T16:27:25.401Z"
  }
}
```
Note: `sandbox_ids` is empty, indicating no active sandboxes remain.

### Overall Progress File
```json
{
  "specId": "S0",
  "status": "completed",
  ...
  "runId": "run-mkpo01eq-afk6"
}
```
Note: `reviewUrls` field is completely missing.

### Timing Analysis
- `completed_at`: 2026-01-22T16:31:54.559Z
- `last_checkpoint`: 2026-01-22T16:32:57.100Z
- Delta: ~63 seconds (consistent with 60-second timeout expiration + cleanup)

## Error Stack Traces

No explicit error - the timeout is caught and logged as:
```
⚠️ Failed to create review sandbox: Review sandbox creation timed out after 60s
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1593-1598)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 831-881)
- **Recent Changes**: Issue #1727 redesigned the completion phase to kill all implementation sandboxes and create a fresh review sandbox
- **Suspected Functions**:
  - `orchestrate()` completion phase (lines 1528-1707)
  - `createReviewSandbox()` (sandbox.ts:831-881)

## Related Issues & Context

### Direct Predecessors
- #1727 (CLOSED): "Orchestrator completion phase redesign" - This issue introduced the review sandbox creation approach that has the timeout issue

### Related Infrastructure Issues
- #1720: "Orchestrator completion phase issues" - Related to completion phase behavior

### Same Component
- All issues related to completion phase and review sandbox handling

## Root Cause Analysis

### Identified Root Cause

**Summary**: The review sandbox creation is wrapped in a 60-second timeout, but the actual `createReviewSandbox()` function performs operations that require significantly more time.

**Detailed Explanation**:

In `orchestrator.ts` lines 1593-1598:
```typescript
reviewSandbox = await withTimeout(
    createReviewSandbox(branchName, options.timeout, options.ui),
    60000,  // 60 seconds!
    "Review sandbox creation",
);
```

But `createReviewSandbox()` in `sandbox.ts` performs these sequential operations:
1. `Sandbox.create()` - E2B sandbox creation (variable, 10-30s typically)
2. `git fetch origin` - Network operation (15-30s, has 120s inner timeout)
3. `git checkout` - Branch switch (5-10s, has 60s inner timeout)
4. `git pull` - Pull latest commits (5-15s, has 60s inner timeout)
5. `pnpm install --frozen-lockfile` - Dependency sync (1-60s, has 600s inner timeout!)

The total realistic time is 40-150+ seconds, but the outer timeout is only 60 seconds.

When the timeout expires:
1. The `withTimeout` wrapper throws an error
2. The catch block at line 1608 logs a warning but sets `reviewSandbox = null`
3. Since `reviewSandbox` is null, no dev server is started (line 1617 check fails)
4. `reviewUrls` array remains empty
5. `saveManifest(manifest, reviewUrls, runId)` writes empty/missing reviewUrls
6. UI completion screen has nothing to display

**Supporting Evidence**:
- Timing analysis: 63s between completion and checkpoint (timeout was hit)
- `sandbox_ids` is empty (review sandbox never tracked)
- `reviewUrls` missing from `overall-progress.json`
- Code path analysis confirms the timeout mismatch

### How This Causes the Observed Behavior

1. Orchestrator reaches completion phase with all features done
2. All implementation sandboxes are killed (as per #1727 fix)
3. `createReviewSandbox()` is called with 60s outer timeout
4. Operations inside `createReviewSandbox()` exceed 60s (especially if pnpm needs to sync)
5. `withTimeout` throws timeout error
6. `reviewSandbox` remains null
7. Dev server startup is skipped (line 1617 `if (reviewSandbox)` is false)
8. `reviewUrls` is empty when `saveManifest` is called
9. Completion UI receives no URLs to display

### Confidence Level

**Confidence**: High

**Reasoning**:
- The timing analysis (63s delta) strongly correlates with a 60s timeout being hit
- The code path analysis clearly shows the timeout mismatch
- The empty `sandbox_ids` and missing `reviewUrls` are consistent with this hypothesis
- No other code path could result in this specific state

## Fix Approach (High-Level)

Increase the timeout for `createReviewSandbox()` from 60 seconds to 300 seconds (5 minutes) to allow sufficient time for:
- E2B sandbox creation
- Git operations
- Dependency installation

The fix is a one-line change in `orchestrator.ts` line 1594:
```typescript
// Before
60000,  // 60 seconds
// After
300000, // 300 seconds (5 minutes)
```

Additionally, consider adding progress logging inside `createReviewSandbox()` so users can see what's happening during the potentially long wait.

## Diagnosis Determination

The root cause is definitively identified: a 60-second timeout on an operation that typically requires 40-150+ seconds. The fix is straightforward - increase the timeout to accommodate the actual operation duration.

## Additional Context

The #1727 fix was correct in its approach (creating a fresh review sandbox instead of reusing a resource-exhausted implementation sandbox), but the timeout value chosen was too aggressive. The previous implementation likely worked because it reused an existing sandbox rather than creating a new one.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (log inspection)*
