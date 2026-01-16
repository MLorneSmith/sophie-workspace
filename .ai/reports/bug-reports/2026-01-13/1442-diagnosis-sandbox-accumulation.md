# Bug Diagnosis: Alpha Orchestrator Creates New Sandboxes Without Killing Old Ones

**ID**: ISSUE-1442
**Created**: 2026-01-13T20:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator creates new E2B sandbox instances when sandboxes fail or expire, but does NOT kill the old sandbox instances in most code paths. This causes sandbox accumulation where the number of running E2B sandboxes exceeds the configured `sandboxCount` (default: 3). At 8 minutes elapsed, the user observed 6 sandboxes running instead of the expected 3.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 20.x
- **E2B Template**: slideheroes-claude-agent-dev
- **Last Working**: N/A (design bug)

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Wait for sandboxes to encounter issues (health check failures, keepalive expiration)
3. Observe that new sandboxes are created but old sandbox E2B instances continue running
4. Use E2B dashboard or `npx e2b sandbox list` to see accumulated sandbox instances

## Expected Behavior

When a sandbox fails or expires and a new one is created:
1. The old E2B sandbox instance should be explicitly killed (`sandbox.kill()`)
2. Only `sandboxCount` sandboxes should be running at any time
3. Sandbox IDs should be properly rotated in the manifest

## Actual Behavior

When a sandbox fails or expires:
1. A new sandbox is created via `createSandbox()`
2. The old E2B sandbox instance is NOT killed (except in preemptive restart path)
3. `manifest.sandbox.sandbox_ids` is updated but old sandbox keeps running
4. E2B resources accumulate, potentially hitting account limits

## Diagnostic Data

### Log Analysis

Log file timestamps show rapid sandbox creation:
```
sbx-a-2026-01-12T15-11-42-115Z.log  (initial)
sbx-a-2026-01-12T15-14-52-179Z.log  (+3 min - restart)
sbx-a-2026-01-12T15-15-27-977Z.log  (+35s - restart again!)
sbx-a-2026-01-12T15-18-32-047Z.log  (+3 min)
sbx-a-2026-01-12T15-19-02-926Z.log  (+30s)
```

In just 8 minutes (15:11 to 15:19), there were **15 sandbox instances created** across 3 sandbox labels (sbx-a, sbx-b, sbx-c), roughly 5 instances per label.

### Console Output
```
At 8m elapsed time we had 6 sandboxes running. Instead we should have only had the three sandboxes that we were using.
```

### Manifest Evidence

The manifest `sandbox_ids` array only stores 3 IDs (correctly updated), but the corresponding old E2B instances remain running:
```json
"sandbox": {
  "sandbox_ids": [
    "i6g2b7lvvr4q1kyea5pn8",
    "ia5ozho2tuc6hy5kzjequ",
    "i7z1a2jskdyv9omfp0vxj"
  ]
}
```

## Error Stack Traces

N/A - No errors thrown; this is a logic bug where cleanup is missing.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 366-593)
  - `.ai/alpha/scripts/lib/sandbox.ts` (createSandbox function)

- **Suspected Functions**:
  - Health check restart (orchestrator.ts:366-411) - **MISSING `sandbox.kill()`**
  - Keepalive expired restart (orchestrator.ts:527-594) - **MISSING `sandbox.kill()`**
  - Preemptive restart (orchestrator.ts:461-465) - **HAS `sandbox.kill()` - only correct path**

## Related Issues & Context

### Historical Context

This is a design bug introduced when the restart logic was implemented. The preemptive restart path (sandbox age > 50 min) correctly kills the old sandbox, but the other two paths (health check failure, keepalive expiration) do not.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The sandbox restart logic in `orchestrator.ts` creates new sandbox instances without killing the old E2B instances in two of three restart code paths.

**Detailed Explanation**:

The orchestrator has three code paths that create replacement sandboxes:

1. **Health Check Restart** (lines 366-411):
   ```typescript
   // Problem: Creates new sandbox without killing old one
   const newInstance = await createSandbox(
     manifest,
     instance.label,
     timeoutSeconds,
     uiEnabled,
   );
   // instance.sandbox (OLD) is never killed!
   instance.sandbox = newInstance.sandbox; // Just overwrites reference
   ```

2. **Keepalive Expired Restart** (lines 527-594):
   ```typescript
   // Same problem: Creates new sandbox without killing old one
   const newInstance = await createSandbox(
     manifest,
     label,
     timeoutSeconds,
     uiEnabled,
   );
   // No sandbox.kill() before creating new one
   ```

3. **Preemptive Restart** (lines 461-513):
   ```typescript
   // CORRECT: Kills old sandbox first
   try {
     await instance.sandbox.kill();  // <-- Proper cleanup
   } catch {
     // Ignore kill errors - sandbox may already be dead
   }
   const newInstance = await createSandbox(...);
   ```

The manifest cleanup for `sandbox_ids` is correctly implemented in all three paths - the bug is specifically that `sandbox.kill()` is not called.

**Supporting Evidence**:
- Log file timestamps show 5 restarts per sandbox label in 8 minutes
- User observed 6 running sandboxes when only 3 were expected
- Code inspection shows `sandbox.kill()` missing in 2 of 3 restart paths

### How This Causes the Observed Behavior

1. Health check runs every 30 seconds (`HEALTH_CHECK_INTERVAL_MS`)
2. If a sandbox is detected as "failed", a new sandbox is created
3. The old sandbox continues running on E2B until its timeout expires (1 hour)
4. Same for keepalive failures - new sandbox created, old one keeps running
5. Each restart adds +1 running sandbox, leading to accumulation
6. With health checks every 30s and potential failures, count grows rapidly

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code inspection shows the exact discrepancy between the three restart paths. The preemptive restart path explicitly kills the old sandbox while the other two do not. The log file evidence corroborates rapid sandbox creation without cleanup.

## Fix Approach (High-Level)

Add `await instance.sandbox.kill()` before creating new sandbox in:
1. Health check restart path (after line 376, before `createSandbox` call)
2. Keepalive expired restart path (after line 546, before `createSandbox` call)

Both should wrap the kill in try/catch like the preemptive restart does:
```typescript
try {
  await instance.sandbox.kill();
} catch {
  // Ignore kill errors - sandbox may already be dead
}
```

## Diagnosis Determination

**Root cause confirmed**: Missing `sandbox.kill()` calls in health check and keepalive expired restart paths cause E2B sandbox instances to accumulate beyond the configured sandbox count. The fix is straightforward - add explicit kill calls before creating replacement sandboxes, matching the pattern already used in the preemptive restart path.

## Additional Context

### E2B Resource Implications

Each uncleaned sandbox:
- Consumes E2B compute quota
- May hit account sandbox limits
- Costs money (E2B billing is time-based)
- Can cause "sandbox limit exceeded" errors

### Secondary Issue

The rapid restart frequency (15 sandboxes in 8 minutes) suggests health checks may be too aggressive or the detection criteria too sensitive. However, fixing the kill issue is the primary concern - even with some restarts, the sandbox count should remain at 3.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash (ls, head)*
