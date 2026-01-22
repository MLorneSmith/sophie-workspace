# Bug Diagnosis: Orchestrator Completion Phase Issues

**ID**: ISSUE-pending
**Created**: 2026-01-22T15:44:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator completion phase has two issues: (A) the dev server fails to start on the review sandbox, and (B) sandboxes are not properly killed/managed, leaving 2 running sandboxes when only 1 (or a fresh review sandbox) should remain.

## Environment

- **Application Version**: N/A (internal tooling)
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: N/A (new feature)

## Reproduction Steps

1. Run the orchestrator on spec S0000 (debug spec): `tsx spec-orchestrator.ts 0`
2. Wait for spec completion (2 trivial tasks)
3. Observe the completion screen

## Expected Behavior

1. All three original sandboxes (sbx-a, sbx-b, sbx-c) should be killed
2. A fresh review sandbox should be created
3. The dev server should start successfully on the review sandbox
4. The `reviewUrls` should show the review sandbox with working dev server

## Actual Behavior

1. Only sandboxes sbx-b and sbx-c are killed (lines 1538-1546)
2. sbx-a (implementation sandbox) is kept alive
3. A review sandbox IS created (idsqugtnet75i5gftvdw6)
4. Dev server fails to start within 60s timeout
5. `reviewUrls` shows `"devServer": "(failed to start)"`
6. The manifest still contains 3 sandbox IDs including killed ones
7. Two sandboxes remain running: sbx-a and the review sandbox

## Diagnostic Data

### Progress Files Analysis

**overall-progress.json**:
```json
{
  "status": "completed",
  "reviewUrls": [
    {
      "label": "sbx-a",
      "vscode": "https://8080-iyj2pc643339pby3jw3md.e2b.app",
      "devServer": "(failed to start)"
    }
  ]
}
```

Note: The label shows "sbx-a" instead of "sbx-review", indicating the code fell back to the implementation sandbox after the review sandbox dev server failed.

**spec-manifest.json sandbox section**:
```json
{
  "sandbox_ids": [
    "iyj2pc643339pby3jw3md",  // sbx-a - still running
    "i3u1rg66tevwc3kutncwi",  // sbx-b - killed but still in manifest
    "i1pnumgfi4vs8vbtqcgzi"   // sbx-c - killed but still in manifest
  ],
  "branch_name": "alpha/spec-S0",
  "created_at": "2026-01-22T15:34:28.188Z"
}
```

### E2B Sandbox State

```
Running sandboxes:
iyj2pc643339pby3jw3md - sbx-a (implementation) - Started 10:34:10 AM
idsqugtnet75i5gftvdw6 - review sandbox - Started 10:38:23 AM
```

Two sandboxes running when user expected one clean review sandbox.

## Error Stack Traces

No explicit errors - the dev server simply times out:
- `startDevServer()` polls for 60 attempts × 1 second = 60s
- Wrapped in 90-second `withTimeout()`
- Falls back to `"(failed to start)"` in reviewUrls

## Related Code

**Affected Files**:
- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1520-1660) - completion phase logic
- `.ai/alpha/scripts/lib/sandbox.ts` - `createReviewSandbox()` and `startDevServer()`

**Suspected Functions**:
1. Completion phase sandbox management (lines 1534-1546)
2. `startDevServer()` timeout configuration
3. Manifest cleanup for killed sandbox IDs

## Root Cause Analysis

### Issue A: Dev Server Fails to Start

**Summary**: The dev server startup is timing out on both the review sandbox and implementation sandbox.

**Detailed Explanation**:
The `startDevServer()` function (sandbox.ts:560-602) fires a background `start-dev` command and polls the dev server URL via HTTP HEAD request. The issue is that for a fresh review sandbox:

1. The `start-dev` script (likely runs `pnpm dev`) needs significant startup time
2. Next.js 16 with Turbopack has a long cold-start on first run
3. The 60-second polling (60 attempts × 1000ms) is insufficient for fresh sandbox
4. When this fails, it falls back to implementation sandbox (sbx-a) which also fails

**Supporting Evidence**:
- `overall-progress.json` shows `"devServer": "(failed to start)"`
- The label is "sbx-a" not "sbx-review", indicating review sandbox creation succeeded but dev server failed
- Review sandbox WAS created (idsqugtnet75i5gftvdw6 exists and is running)
- Two sandboxes still running proves both were kept alive

**Root Cause**: `startDevServer()` timeout is insufficient for Next.js cold start on fresh E2B sandbox.

### Issue B: Sandbox Cleanup Not Complete

**Summary**: The orchestrator doesn't kill all sandboxes at completion, and doesn't clean up manifest.sandbox_ids.

**Detailed Explanation**:
Looking at the completion phase code (orchestrator.ts:1534-1546):

```typescript
// Keep implementation sandbox (sbx-a) available for code inspection via VS Code
const implementationInstance = instances[0];
const otherInstances = instances.slice(1);

// Kill non-primary implementation sandboxes (sbx-b, sbx-c, etc.)
for (const instance of otherInstances) {
  try {
    log(`${instance.label}: Stopping (partial code only)...`);
    await instance.sandbox.kill();
  } catch {
    // Ignore
  }
}
```

**Problems identified**:

1. **sbx-a is intentionally kept alive** for "code inspection via VS Code" - this is by design, not a bug
2. **Review sandbox is created but never tracked** - `createReviewSandbox()` returns a `Sandbox` object but it's never added to the `instances` array or manifest
3. **Manifest sandbox_ids not cleaned up** - killed sandboxes (sbx-b, sbx-c) remain in `manifest.sandbox.sandbox_ids`
4. **Review sandbox ID not recorded** - if the review sandbox starts successfully, its ID is never saved to the manifest

**Supporting Evidence**:
- spec-manifest.json still has 3 sandbox IDs including killed ones
- Review sandbox `idsqugtnet75i5gftvdw6` is NOT in the manifest
- E2B shows 2 running sandboxes: sbx-a and the review sandbox

**Root Cause**: The completion phase has design issues:
1. Manifest cleanup is missing after killing sbx-b/sbx-c
2. Review sandbox is not tracked in the manifest
3. The user's expectation ("all three killed, one new review") doesn't match the current design ("keep sbx-a, kill b/c, create review")

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code flow is clearly traceable
- The E2B sandbox list confirms the state matches the code behavior
- The manifest shows the exact IDs that were created
- The progress files confirm dev server failure

## Fix Approach (High-Level)

### Issue A Fix: Increase Dev Server Startup Timeout

1. Increase `maxAttempts` in `startDevServer()` call from 60 to 120 (2 minutes)
2. Or increase the outer `withTimeout()` from 90000 to 180000 ms
3. Consider adding a "warming" step before polling (give Next.js time to compile)

### Issue B Fix: Clean Up Sandbox State at Completion

1. After killing sbx-b/sbx-c, remove their IDs from `manifest.sandbox.sandbox_ids`
2. Track the review sandbox ID in the manifest (add to sandbox_ids or a new field)
3. Clarify the design: either kill ALL sandboxes and create fresh review, OR keep sbx-a + review

**Alternative Design** (user's expected behavior):
1. Kill ALL three implementation sandboxes (sbx-a, sbx-b, sbx-c)
2. Create ONE fresh review sandbox
3. Start dev server on review sandbox
4. Update manifest with only the review sandbox ID
5. Display review sandbox URLs

This would be cleaner and match the user's mental model.

## Diagnosis Determination

Two distinct issues identified in the orchestrator completion phase:

**Issue A**: Dev server fails to start due to insufficient timeout for Next.js cold-start on fresh E2B sandbox. The 60-second polling window is too short for a full Next.js build + startup cycle.

**Issue B**: Sandbox state management is incomplete:
- Killed sandbox IDs remain in the manifest
- Review sandbox is not tracked
- The actual behavior (keep sbx-a, create review sandbox) may not match user expectations (kill all, create fresh review)

## Additional Context

The S0000 debug spec was designed to test the completion phase with minimal tasks. The issues became visible because:
1. The debug spec completed quickly (2 trivial file creation tasks)
2. No actual code changes = dev server can start faster than with real features
3. Yet the dev server STILL failed, indicating the timeout is too aggressive

This suggests real spec completions with actual code changes would fail even more consistently.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (orchestrator.ts, sandbox.ts, progress files, manifest), Bash (e2b sandbox list), Glob*
