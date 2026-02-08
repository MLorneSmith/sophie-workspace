# Bug Diagnosis: Alpha Orchestrator Progress Count Mismatch & UI Hang

**ID**: ISSUE-1699
**Created**: 2026-01-21T16:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI displays inconsistent task completion counts and experienced a UI update hang during execution. Specifically:
1. Sandbox sbx-b showed 4/4 tasks completed for S1692.I1.F3, but Overall Progress showed only 3/104 tasks completed
2. The UI stopped updating at approximately 14m 24s (15:52 UTC), despite the orchestrator process still running

## Environment

- **Application Version**: dev branch, commit 2b598f0b1
- **Environment**: development
- **Node Version**: v22.16.0
- **Run ID**: run-mko6totl-xdvr
- **Spec**: S1692 (user dashboard)

## Reproduction Steps

1. Run the Alpha Orchestrator with `tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --force-unlock`
2. Observe the UI as sandboxes implement features
3. When sandbox sbx-b completes feature S1692.I1.F3 (4 tasks), note that:
   - sbx-b column shows "4/4 tasks completed"
   - Overall Progress section shows only "3/104 tasks" or similar low count
4. At approximately 14m 24s, the UI stops updating entirely

## Expected Behavior

1. When a sandbox completes 4 tasks for a feature, the Overall Progress should immediately reflect those 4 additional tasks
2. The UI should continue updating as long as the orchestrator is running and sandboxes are active

## Actual Behavior

1. Task counts are inconsistent between sandbox column display and Overall Progress
2. UI updates stopped at 14m 24s (15:52:51 UTC) even though:
   - Orchestrator process is still running (PID 365572, 365583)
   - Sandboxes sbx-a and sbx-c continued writing idle progress until 16:00+ UTC
   - sbx-b started a new feature (S1692.I1.F4) but progress file stopped updating

## Diagnostic Data

### Progress File Analysis

**sbx-b-progress.json** (last modified 10:52 local / 15:52 UTC):
```json
{
  "sandbox_id": "inizfelzm83dd6qhr2e9f",
  "feature": { "issue_number": "S1692.I1.F4", "title": "Skeleton Loading States" },
  "status": "running",
  "completed_tasks": [],
  "last_heartbeat": "2026-01-21T15:52:51.504727Z"
}
```

**sbx-a-progress.json** (last modified 11:00 local):
```json
{
  "status": "idle",
  "last_heartbeat": "2026-01-21T16:00:11.875Z",
  "waiting_reason": "Waiting for dependencies (15 features blocked)"
}
```

**overall-progress.json** (last modified 10:52 local):
```json
{
  "tasksCompleted": 11,
  "tasksTotal": 104,
  "featuresCompleted": 3
}
```

### Log File Analysis

**sbx-b.log** ends abruptly at line 72:
```
[PTY] Creating PTY session at 2026-01-21T15:52:41.435Z
[PTY] PTY created with PID 3248
[PTY] Sending command: run-claude "/alpha:implement S1692.I1.F4"
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement S1692.I1.F4
```

No further output after "Running Claude Code with prompt: /alpha:implement S1692.I1.F4" - the PTY output stream stopped writing.

### File Timestamps

```
overall-progress.json: 10:52 (stopped updating)
sbx-b-progress.json:   10:52 (stopped updating)
sbx-a-progress.json:   11:00 (still updating)
sbx-c-progress.json:   11:00 (still updating)
spec-manifest.json:    10:52 (stopped updating)
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two separate but related bugs cause the progress mismatch and UI hang.

### Bug 1: Task Count Mismatch

**Detailed Explanation**:

The UI's task count calculation in `useProgressPoller.ts:875-915` has a logic flaw:

```typescript
// Line 887-889
if (sandbox.status === "busy") {
    inProgressTasks += sandbox.tasksCompleted;
}
```

The calculation only adds `tasksCompleted` from sandboxes with status "busy". When a feature completes:
1. The sandbox's `completed_tasks` array may not be updated in the progress file
2. The sandbox status changes from "busy" to "completed" or "ready"
3. The manifest's `tasksCompleted` isn't updated until `saveManifest()` is called

This creates a window where:
- The sandbox column (reading from sbx-b-progress.json) shows the feature completion
- The Overall Progress (calculating from overall-progress.json + busy sandbox tasks) doesn't include those tasks

**Supporting Evidence**:
- sbx-b-progress.json shows `"completed_tasks": []` despite displaying "4/4 completed" in the UI
- The progress file for sbx-b was last updated at 15:52:51, just 10 seconds after F4 started
- The hooks in the sandbox write to `.initiative-progress.json`, but `completed_tasks` array is only populated by the `/alpha:implement` command, not the heartbeat hooks

### Bug 2: UI Hang / Progress File Write Stoppage

**Detailed Explanation**:

The sbx-b PTY output stream stopped writing to the log file and the progress file stopped being updated. This occurred because:

1. **PTY Buffer Issue**: The Claude Code session in sbx-b started F4 at 15:52:41 but the PTY `onData` callback stopped receiving data after 15:52:51
2. **Progress Polling Disconnect**: The orchestrator's progress poller for sbx-b reads from the sandbox's `.initiative-progress.json` file. If the sandbox's Claude Code agent stalls without making tool calls, no heartbeat updates occur
3. **Log Stream Interruption**: The `logStream.write(data)` in `feature.ts:415` depends on PTY `onData` events, which stopped firing

**Why the PTY stopped receiving data** (CONFIRMED by E2B SDK research):

Based on research using context7-expert and perplexity-expert agents:

1. **PTY Default Timeout is 60 seconds** - The E2B SDK has a default PTY timeout of 60 seconds. Our PTY sessions do NOT set `timeout: 0`, so they auto-disconnect after 60 seconds of the PTY connection being open (not 60 seconds of inactivity).

2. **Known Open Issue #727** - GitHub issue "Certain commands not streaming full output" (OPEN as of May 2025) describes the exact symptoms we're experiencing: PTY `onData` callbacks stop firing mid-execution.

3. **Silent Disconnection is By Design** - E2B's PTY can disconnect without firing error events. This is intentional behavior - `pty.disconnect()` stops SDK event reception while keeping the process alive, but no error is raised.

4. **No Built-in Health Checks** - E2B SDK does NOT have built-in keepalive or heartbeat mechanisms for PTY sessions. Client-side monitoring is required.

5. **RPC/WebSocket Issues** - While many WebSocket issues were fixed in the Beta SDK (Sept 2024), the current PTY streaming issues persist per Issue #727 and #921.

**Supporting Evidence**:
- sbx-b.log ends with "Running Claude Code with prompt: /alpha:implement S1692.I1.F4" - no further output
- sbx-a and sbx-c continued updating until 16:00+ UTC, indicating the orchestrator itself was healthy
- The stall detection at `feature.ts:269-284` should have triggered after 5 minutes, but may not have fired due to the feature being marked as "in_progress" without heartbeat updates

### How This Causes the Observed Behavior

1. **Mismatch at 14m 30s**: When F3 completed on sbx-b:
   - Sandbox column correctly showed 4/4 from the Claude Code output summary
   - `completed_tasks` array in progress file was empty (hooks don't populate this)
   - Overall Progress calculated: `baseTasksCompleted` (from manifest) + `inProgressTasks` (from busy sandboxes)
   - Since F3 was complete, sbx-b status wasn't "busy", so its 4 tasks weren't counted

2. **UI Hang at 14m 24s**: When F4 started on sbx-b:
   - PTY created successfully (PID 3248)
   - Claude Code started but then PTY stream went silent
   - Progress poller got stale data (last_heartbeat from 15:52:51)
   - No new events to trigger UI re-renders
   - sbx-a/sbx-c continued updating (idle status), but sbx-b appeared frozen

### Confidence Level

**Confidence**: High

**Reasoning**:
1. File timestamps conclusively show sbx-b and manifest stopped updating at 15:52, while sbx-a/sbx-c continued to 16:00
2. Log file truncation proves PTY stream interruption
3. Code analysis of `useProgressPoller.ts:887-889` shows the exact condition causing mismatch
4. The hooks in `install-sandbox-hooks.sh` only update `last_heartbeat` and `last_tool`, not `completed_tasks`

## Fix Approach (High-Level)

### Bug 1 Fix: Task Count Calculation
The UI should read task counts directly from the manifest's `overall-progress.json` without adding in-progress tasks from sandbox files, OR the sandbox progress files should include accurate `completed_tasks` arrays populated by the `/alpha:implement` command.

Recommended: Modify `writeUIProgress()` in `progress.ts` to include the actual `completed_tasks` array from the sandbox's `.initiative-progress.json` file, not just rely on the manifest count.

### Bug 2 Fix: PTY Stream Reliability (CONFIRMED by E2B Research)

Based on E2B SDK documentation and community research, implement these fixes:

#### Critical Fix 1: Set PTY Timeout to 0

In `feature.ts` where PTY is created, add `timeout: 0` to prevent auto-disconnect:

```typescript
// Current (BROKEN):
const handle = await sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  onData: (data) => processData(data),
});

// Fixed:
const handle = await sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  onData: (data) => processData(data),
  timeout: 0  // CRITICAL: Disable 60-second default timeout
});
```

#### Critical Fix 2: Extend Sandbox Timeout After Connection

```typescript
// After connecting to sandbox
await sandbox.setTimeout(24 * 60 * 60 * 1000); // 24 hours max for Pro
```

#### Critical Fix 3: Implement Client-Side Activity Monitoring

```typescript
let lastActivity = Date.now();

const handle = await sandbox.pty.create({
  onData: (data) => {
    lastActivity = Date.now();  // Track activity
    processData(data);
  },
  timeout: 0
});

// Monitor for silent drops (every 30 seconds)
setInterval(async () => {
  const silentMs = Date.now() - lastActivity;

  // Check sandbox health
  const isRunning = await sandbox.isRunning();
  if (!isRunning) {
    handleSandboxDeath();
    return;
  }

  // If silent for 2+ minutes during active execution, verify PTY
  if (silentMs > 120000 && instance.status === 'busy') {
    const processes = await sandbox.commands.list();
    const ptyAlive = processes.some(p => p.pid === handle.pid);
    if (!ptyAlive) {
      handlePtyDeath();
    }
  }
}, 30000);
```

#### Critical Fix 4: Reconnection Strategy

If stream drops but sandbox is alive, use `commands.connect()` to reconnect:

```typescript
// List processes to find the PTY
const processes = await sandbox.commands.list();

// Reconnect with new callbacks
const handle = await sandbox.commands.connect(ptyPid, {
  timeout: 0,
  onStdout: (data) => processOutput(data),
  onStderr: (data) => processOutput(data)
});
```

#### Optional: Consider commands.run() for Non-Interactive Commands

E2B recommends `commands.run()` over PTY for non-interactive commands. However, our Claude Code execution requires interactive PTY for proper terminal handling.

### E2B GitHub Issues to Monitor

- **#727** - "Certain commands not streaming full output" (OPEN) - Directly matches our symptoms
- **#879** - "E2B is not honoring timeout" (OPEN)
- **#921** - "Peer closed connection without sending complete message body" (OPEN)

### Research Reports

- `.ai/reports/research-reports/2026-01-21/context7-e2b-pty-streaming-reliability.md`
- `.ai/reports/research-reports/2026-01-21/perplexity-e2b-pty-stream-reliability.md`

## Diagnosis Determination

Both issues stem from incomplete synchronization between:
1. What the sandbox's Claude Code agent knows (task completion)
2. What the orchestrator's progress files capture (heartbeat hooks only)
3. What the UI calculates (combining manifest + sandbox states)

The task count mismatch is a calculation bug in the UI layer.
The UI hang is a PTY stream reliability issue that bypassed stall detection.

## Additional Context

- The orchestrator was run with `--force-unlock` flag, suggesting potential previous stale lock state
- This is spec S1692 with 19 features and 104 tasks across 5 initiatives
- Three sandboxes (sbx-a, sbx-b, sbx-c) were in use

## Related Issues

Previous fix attempts:
- Issue #1688: "Fix for issue #1688: Use authoritative task count from current_group" - this was a partial fix in `useProgressPoller.ts:399-417` but didn't address the `completed_tasks` array population

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (ls -la, ps aux, wc -l, tail), Glob, Grep*
