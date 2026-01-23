# Bug Diagnosis: Sandbox restart doesn't update UI progress or reset created_at timestamp

**ID**: ISSUE-1712
**Created**: 2026-01-21T20:15:00.000Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When E2B sandboxes expire and are restarted by the orchestrator, the UI dashboard shows stale data with old heartbeat timestamps (25+ minutes old). This happens because: (1) the `manifest.sandbox.created_at` timestamp is never reset on sandbox restart, causing premature expiration detection, and (2) UI progress files are not written immediately after sandbox restart, leaving stale data visible to the dashboard.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: v22.x
- **E2B SDK**: @e2b/code-interpreter
- **Last Working**: N/A (design flaw)

## Reproduction Steps

1. Start the orchestrator with a spec that takes >60 minutes to complete
2. Observe sandboxes running normally for ~55 minutes
3. At ~60 minutes, sandboxes expire and are detected by keepalive check
4. Orchestrator creates new sandboxes (visible in E2B dashboard)
5. UI dashboard continues showing old sandbox IDs with stale heartbeats

## Expected Behavior

After sandbox restart:
1. `manifest.sandbox.created_at` should be reset to the new sandbox creation time
2. UI progress files should immediately show the new sandbox information
3. Dashboard should display fresh heartbeats from the new sandboxes

## Actual Behavior

After sandbox restart:
1. `manifest.sandbox.created_at` remains at original value (hours old)
2. UI progress files retain stale data until new Claude Code session starts writing
3. Dashboard shows heartbeats 25+ minutes old despite new sandboxes being active

## Diagnostic Data

### Progress File Analysis
```json
// sbx-a-progress.json - showing stale sandbox_id
{
  "sandbox_id": "iyno07v867pjdxh4t1vga",
  "last_heartbeat": "2026-01-21T20:08:05.397Z"
}

// sbx-b-progress.json - 8+ minutes stale heartbeat
{
  "sandbox_id": "i4s0fwqg1xaqfv5w6ewma",
  "last_heartbeat": "2026-01-21T20:00:16.496656Z"
}
```

### Manifest Analysis
```json
{
  "sandbox": {
    "sandbox_ids": ["igo4e19exv044gbk6oxb3", "iyno07v867pjdxh4t1vga", "i4s0fwqg1xaqfv5w6ewma"],
    "created_at": "2026-01-21T19:05:27.867Z",  // NEVER UPDATED - 63 min old
    "restart_count": 3  // Sandboxes HAVE been restarted
  }
}
```

## Error Stack Traces

N/A - No error thrown, silent data staleness

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts:527-528` - `created_at` never reset
  - `.ai/alpha/scripts/lib/orchestrator.ts:580-630` - Missing writeIdleProgress after restart
  - `.ai/alpha/scripts/lib/orchestrator.ts:665-720` - Missing writeIdleProgress after restart
  - `.ai/alpha/scripts/lib/progress.ts` - writeUIProgress/writeIdleProgress functions

- **Recent Changes**: N/A (design flaw from initial implementation)
- **Suspected Functions**:
  - `createSandbox()` - Sets created_at conditionally: `manifest.sandbox.created_at || new Date().toISOString()`
  - Keepalive interval restart handlers - Don't write UI progress after restart

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two bugs work together to cause stale UI: (1) `created_at` timestamp is never reset on sandbox restart, and (2) UI progress files are not updated immediately after restart.

**Detailed Explanation**:

**Bug 1: `created_at` never reset on restart**

In `sandbox.ts:527-528`:
```typescript
manifest.sandbox.created_at =
    manifest.sandbox.created_at || new Date().toISOString();
```

This only sets `created_at` if it's not already set. When sandboxes are restarted, the old timestamp persists. This means:
- `isSandboxExpired()` uses the original creation time
- After restart, sandboxes immediately appear "old" again
- Can cause cascading restart loops

**Bug 2: Missing UI progress write after restart**

In `orchestrator.ts`, after sandbox restart completes (~line 620 and ~line 716), the code:
1. Updates `instance.id`, `instance.status = "ready"`, etc.
2. Updates `manifest.sandbox.sandbox_ids`
3. Saves manifest
4. **Does NOT call `writeIdleProgress()` or `writeUIProgress()`**

The UI progress file is only written when:
- A feature is being implemented (via progress polling)
- No feature is available and sandbox is idle (in work loop)

After restart, the new sandbox typically gets assigned work immediately, so the work loop never sees it as "idle" - it goes straight to busy. The progress file isn't updated until the new Claude Code session starts writing progress, which can take minutes.

**Supporting Evidence**:
- `restart_count: 3` in manifest proves restarts occurred
- `created_at: "2026-01-21T19:05:27.867Z"` is 63+ minutes old despite restarts
- Progress files show different sandbox IDs but stale heartbeats
- E2B dashboard shows 3 new sandboxes but UI shows old data

### How This Causes the Observed Behavior

1. Initial sandboxes created at 19:05:27 with `created_at` set
2. Sandboxes work normally for ~60 minutes
3. At ~20:05, sandboxes hit 60-minute E2B limit and expire
4. Keepalive detects failure, creates new sandboxes
5. New sandbox IDs added to manifest, but `created_at` NOT reset
6. No `writeIdleProgress()` called - progress files still have old data
7. UI reads progress files, sees old sandbox IDs with stale heartbeats
8. User sees "heartbeat 25m ago" despite fresh sandboxes running

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Code clearly shows `created_at` uses `||` operator preventing reset
2. No `writeIdleProgress()` call exists after restart in keepalive handlers
3. Manifest data confirms `restart_count: 3` but `created_at` from 63 min ago
4. Progress files show mismatched data consistent with theory

## Fix Approach (High-Level)

1. **Reset `created_at` on restart**: In orchestrator's keepalive restart handlers (~line 620 and ~line 716), add:
   ```typescript
   manifest.sandbox.created_at = new Date().toISOString();
   ```

2. **Write UI progress immediately after restart**: After sandbox restart completes and before work assignment, call:
   ```typescript
   writeIdleProgress(instance.label, instance, "Sandbox restarted - ready for work");
   ```

3. **Consider updating `createSandbox()`**: Change the conditional set to always update for new sandboxes:
   ```typescript
   // In createSandbox(), track if this is a brand new creation vs reconnect
   manifest.sandbox.created_at = new Date().toISOString(); // Always update
   ```

## Diagnosis Determination

The root cause has been definitively identified as two design flaws in the sandbox restart flow:

1. **Timestamp preservation bug**: The conditional `||` operator in `created_at` assignment prevents timestamp reset on restart, causing the orchestrator to think restarted sandboxes are still 60+ minutes old.

2. **Missing UI update bug**: The restart handlers don't write to UI progress files, leaving stale data visible to the dashboard until new Claude Code sessions begin writing progress.

Both bugs are straightforward to fix with targeted code changes in the keepalive restart handlers.

## Additional Context

The bug becomes more severe in long-running orchestration sessions:
- After first restart, `created_at` is 60+ min old
- New sandboxes may be flagged for restart again immediately
- Can cause restart loops and wasted compute resources
- User cannot monitor actual progress during this period

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob for code analysis*
