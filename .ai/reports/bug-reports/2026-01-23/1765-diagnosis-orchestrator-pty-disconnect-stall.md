# Bug Diagnosis: Orchestrator PTY Disconnect Causes Manifest Stall

**ID**: ISSUE-1765
**Created**: 2026-01-23T16:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator gets stuck when a PTY connection to an E2B sandbox disconnects or times out after the sandbox completes a feature. The sandbox writes a `status: "completed"` progress file, but the orchestrator's `ptyHandle.wait()` never returns, leaving the manifest in an `in_progress` state indefinitely. This blocks dependent features from starting.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development (local)
- **Node Version**: 20.x
- **E2B SDK**: Latest
- **Last Working**: Feature started at 16:05, sandbox completed by ~16:33

## Reproduction Steps

1. Run the spec orchestrator: `tsx spec-orchestrator.ts 1692`
2. Let multiple features run across sandboxes
3. Feature `S1692.I4.F1` completes on sbx-b (progress file shows `status: "completed"`)
4. PTY connection drops or `ptyHandle.wait()` hangs indefinitely
5. Orchestrator never processes the completion - manifest stays `in_progress`
6. Dependent features (S1692.I4.F2, S1692.I4.F3, S1692.I5.*) remain blocked
7. Other sandboxes (sbx-c) show "Waiting for dependencies" indefinitely

## Expected Behavior

When a sandbox completes a feature:
1. The PTY command should return with exit code
2. `runFeatureImplementation()` should process the result
3. Manifest should be updated to `status: "completed"`
4. Dependent features should become available for other sandboxes

## Actual Behavior

1. Sandbox completes feature and writes `status: "completed"` to progress file
2. PTY connection hangs - `ptyHandle.wait()` never returns
3. Manifest stays at `status: "in_progress"`, `tasks_completed: 0`
4. Stuck detection doesn't trigger because `sandbox.status === "busy"`
5. Other sandboxes wait indefinitely for dependencies

## Diagnostic Data

### Progress File Evidence (sbx-b-progress.json)
```json
{
  "sandbox_id": "io8df50ga976xbsuajcg6",
  "feature": {
    "issue_number": "S1692.I4.F1",
    "title": "Cal.com Foundation & Provider Setup"
  },
  "completed_tasks": [
    "S1692.I4.F1.T1", "S1692.I4.F1.T2", "S1692.I4.F1.T3",
    "S1692.I4.F1.T4", "S1692.I4.F1.T5", "S1692.I4.F1.T6", "S1692.I4.F1.T7"
  ],
  "status": "completed",
  "phase": "completed",
  "last_heartbeat": "2026-01-23T16:33:14.103175Z",
  "last_commit": "784785c"
}
```

### Manifest State (spec-manifest.json)
```json
{
  "id": "S1692.I4.F1",
  "title": "Cal.com Foundation & Provider Setup",
  "status": "in_progress",           // <-- STALE
  "tasks_completed": 0,               // <-- NOT UPDATED
  "assigned_sandbox": "sbx-b",
  "assigned_at": 1769185319863
}
```

### Overall Progress Timing Discrepancy
- Sandbox last heartbeat: `2026-01-23T16:33:14Z`
- Orchestrator last checkpoint: `2026-01-23T16:28:02Z` (5 minutes earlier!)

### Sandbox sbx-c Waiting State
```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (6 features blocked)",
  "blocked_by": ["S1692.I4.F2", "S1692.I4.F3", "S1692.I5.F1"]
}
```

## Error Stack Traces

No explicit error - the issue is a silent hang in `ptyHandle.wait()` which has no error event.

## Related Code

### Affected Files:
- `.ai/alpha/scripts/lib/feature.ts:496` - `ptyHandle.wait()` call that hangs
- `.ai/alpha/scripts/lib/orchestrator.ts:900-952` - Stuck detection that doesn't catch this case
- `.ai/alpha/scripts/lib/work-queue.ts:59-157` - Feature assignment blocked by stale manifest

### PTY Wait Location (feature.ts:495-499)
```typescript
log(`   │   ⏳ [PTY_WAIT] ${instance.label}: Waiting for PTY to complete...`);
executionResult = await ptyHandle.wait();  // <-- HANGS HERE

log(`   │   ✅ [PTY_DONE] ${instance.label}: PTY completed (exitCode=${executionResult.exitCode})`);
```

### Stuck Detection (orchestrator.ts:928-932)
```typescript
if (
    tasksRemaining > 0 &&
    sandbox.status !== "busy" &&      // <-- PROBLEM: status IS "busy"
    assignedDuration > STUCK_TASK_THRESHOLD_MS
) {
```

## Related Issues & Context

### Similar Symptoms
- #1699, #1701: PTY timeout issues causing UI hangs
- #1688: Stuck feature detection improvements
- #1567: Sandbox recovery patterns

### Infrastructure Issues
- E2B PTY has a default 60-second timeout (fixed in feature.ts with `FEATURE_TIMEOUT_MS`)
- But PTY can still disconnect silently without error events

## Root Cause Analysis

### Identified Root Cause

**Summary**: PTY connection to E2B sandbox hangs indefinitely after feature completion, preventing manifest update and blocking dependent features.

**Detailed Explanation**:

The orchestrator uses E2B's PTY (pseudo-terminal) to run Claude Code sessions in sandboxes. The flow is:

1. Create PTY handle with `sandbox.pty.create()`
2. Send command with `sandbox.pty.sendInput()`
3. Wait for completion with `ptyHandle.wait()`

The sandbox successfully completes the feature and writes a `status: "completed"` progress file. However, the PTY connection between the orchestrator and sandbox can hang for several reasons:

1. **E2B PTY timeout**: Despite setting `timeoutMs: FEATURE_TIMEOUT_MS` (30 min), the PTY connection may still drop
2. **Network interruption**: WebSocket connection to E2B may be interrupted
3. **E2B sandbox expiration**: Sandbox approaching 60-minute lifetime may have degraded connectivity
4. **Silent disconnection**: PTY doesn't fire error events on some disconnect scenarios

When `ptyHandle.wait()` hangs:
- `runFeatureImplementation()` never returns
- Manifest never gets updated (`saveManifest()` at line 667 never runs)
- Orchestrator thinks sandbox is still "busy" (`instance.status === "busy"`)
- Stuck detection at line 928 checks `sandbox.status !== "busy"` - condition is FALSE
- Feature remains `in_progress` indefinitely
- Dependent features never become available

**Supporting Evidence**:
- Progress file shows `status: "completed"`, `last_heartbeat: 16:33:14`
- Manifest shows `status: "in_progress"`, `tasks_completed: 0`
- Orchestrator checkpoint is 5 minutes older than sandbox heartbeat
- sbx-c is stuck waiting for dependencies that can never unblock

### How This Causes the Observed Behavior

1. sbx-b completes S1692.I4.F1, writes progress file with `status: "completed"`
2. PTY connection hangs - `ptyHandle.wait()` never returns
3. Manifest stays `in_progress` with `tasks_completed: 0`
4. S1692.I4.F2 depends on S1692.I4.F1 being `completed`
5. getNextAvailableFeature() sees S1692.I4.F1 as `in_progress`, skips S1692.I4.F2
6. sbx-c gets "no available features" and writes idle progress
7. All Initiative 4 and 5 features remain blocked indefinitely

### Confidence Level

**Confidence**: High

**Reasoning**: The timing evidence (sandbox heartbeat 5 min newer than orchestrator checkpoint), the state discrepancy (progress file shows completed, manifest shows in_progress), and the code path analysis all point to the same root cause. The stuck detection explicitly doesn't fire because the sandbox status is "busy".

## Fix Approach (High-Level)

Two complementary fixes are needed:

1. **Progress-file-based completion detection**: In the work loop, poll the sandbox progress files directly. If a progress file shows `status: "completed"` but the manifest shows `in_progress`, force update the manifest and mark the sandbox as ready. This provides a fallback when PTY doesn't return.

2. **PTY timeout with recovery**: Add a wrapper around `ptyHandle.wait()` with a configurable timeout (e.g., 35 minutes). If the PTY doesn't return within the timeout but the progress file shows completion, treat it as successful and update the manifest.

Implementation location: Add progress-file polling fallback in `orchestrator.ts` work loop, around line 900-960 where stuck detection already exists.

## Diagnosis Determination

The root cause is confirmed: PTY connection hangs prevent manifest updates even when the sandbox completes successfully. The stuck detection mechanism at line 928-932 doesn't catch this because it requires `sandbox.status !== "busy"`, but the orchestrator never gets a chance to update the status when PTY hangs.

The fix requires implementing a progress-file-based fallback that can detect when a sandbox has completed work (via its progress file) even when the PTY connection is hung.

## Additional Context

This is a race condition between:
- Sandbox completing work and writing progress file
- PTY returning control to orchestrator

The sandbox side is working correctly. The issue is purely on the orchestrator side, specifically the reliance on PTY returning to trigger manifest updates.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash*
