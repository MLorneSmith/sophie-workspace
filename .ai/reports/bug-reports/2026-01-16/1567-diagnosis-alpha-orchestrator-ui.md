# Bug Diagnosis: Alpha Orchestrator UI Issues

**ID**: ISSUE-1567
**Created**: 2026-01-16T22:00:00.000Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Multiple UI and functionality issues in the Alpha Spec Orchestrator system, including progress bar flicker, unbounded event list growth, sandbox recovery state not properly reflected in UI, feature cycling behavior in sandbox-c, and dev server not accessible at completion.

## Environment

- **Application Version**: dev branch (commit 7ef5cf68b)
- **Environment**: development
- **Node Version**: Node.js (E2B sandbox)
- **Database**: Supabase (sandbox)
- **Last Working**: N/A (first major run observed)

## Reproduction Steps

1. Run the Alpha Spec Orchestrator with `tsx spec-orchestrator.ts 1362`
2. Observe the UI dashboard during execution
3. Watch for progress bar flicker, growing event lists, sandbox state inconsistencies
4. Wait for completion and try to access the dev server URL

## Expected Behavior

1. Progress bars should update smoothly without visual flicker
2. Event lists should be limited to a manageable size (e.g., 10 lines max)
3. Sandbox columns should accurately reflect sandbox health status, including recovery
4. Features should be executed once and not cycled multiple times
5. Dev server should be accessible at the review URL upon completion

## Actual Behavior

1. Progress bars flicker during updates
2. Event lists grow unbounded to 30+ lines before resetting per feature
3. Sandbox-c showed red (stalled) status at 32m 45s with 6m 45s heartbeat despite E2B dashboard showing recovery
4. Sandbox-c cycled through feature 1375 multiple times near the end
5. Dev server URL returns "Closed Port Error - Connection refused on port 3000"

## Diagnostic Data

### Log Analysis (sbx-c.log)

```
Lines 159-264: Feature 1375 implementation shows multiple execution cycles:
- First attempt at 21:25:39 - "Terminated" (line 162)
- Second attempt at 21:32:21 - starts new session
- Third attempt at 21:32:41 - "Terminated" again (line 191)
- Fourth attempt at 21:33:19 - completes successfully (line 264)
```

### Progress File Analysis

**sbx-c-progress.json** at completion:
```json
{
  "sandbox_id": "iao92u64gam5uf2p8ddh6",
  "feature": {"issue_number": 1375, "title": "Activity Feed Component"},
  "status": "running",  // <-- Still shows "running" not "completed"
  "phase": "executing",
  "last_heartbeat": "2026-01-16T21:27:15.292377Z", // 24+ min old at completion
  "recent_output": [duplicate entries showing same tools twice]
}
```

**overall-progress.json** at completion:
```json
{
  "status": "completed",
  "featuresCompleted": 13,
  "featuresTotal": 13,
  "reviewUrls": [{
    "label": "sbx-a",
    "devServer": "https://3000-izy38sua6h8hpk5yifd3j.e2b.app"  // Port 3000 not responding
  }]
}
```

## Error Stack Traces

No explicit errors in logs. The issues are behavioral/state management problems.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Progress bar rendering
  - `.ai/alpha/scripts/ui/components/EventLog.tsx` - Event list display
  - `.ai/alpha/scripts/ui/index.tsx` - Event handling and state management
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Sandbox state updates
  - `.ai/alpha/scripts/lib/sandbox.ts` - Dev server startup
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Feature assignment logic

## Root Cause Analysis

### Issue 1: Progress Bar Flicker

**Root Cause**: The `useRealtimeHeartbeat` hook in `SandboxColumn.tsx:120-151` updates every 5 seconds, and the `useProgressPoller` hook polls every 5 seconds (`POLL_INTERVAL_MS = 5000`). When both timers fire close together, it causes multiple rapid re-renders. Additionally, the task count calculation in `progressToSandboxState` (`useProgressPoller.ts:386-390`) uses a formula that can fluctuate:

```typescript
const tasksTotal =
  tasksCompleted +
  (progress.failed_tasks?.length ?? 0) +
  (progress.current_task ? 1 : 0);
```

When `current_task` transitions from non-null to null between polls, `tasksTotal` briefly drops, causing progress bar visual jumps.

**Supporting Evidence**: The `sandboxStateEqual` function in `useProgressPoller.ts:18-77` does attempt to prevent unnecessary re-renders, but the heartbeat timer operates independently and causes renders even when sandbox data hasn't changed.

**Confidence Level**: High - Code analysis directly shows the dual-timer pattern and fluctuating calculation.

### Issue 2: Unbounded Event List Growth

**Root Cause**: The `handleWebSocketEvent` function in `ui/index.tsx:251-276` adds events to `realtimeOutput` but the limit is applied differently than the EventLog display:

```typescript
// In handleWebSocketEvent (index.tsx:269-271):
const updated = [...existing, displayText].slice(-10);  // Limits to 10

// But in EventLogImpl (EventLog.tsx:145-148):
const recentEvents = useMemo(
  () => events.slice(0, maxEvents),  // maxEvents = MAX_DISPLAY_EVENTS = 8
  [events, maxEvents],
);
```

The `realtimeOutput` per-sandbox is limited to 10, but the merged `orchestratorEvents` in `enhancedState` (`index.tsx:376-378`) merges arrays without proper deduplication:

```typescript
const mergedEvents = [...orchestratorEvents, ...state.events]
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .slice(0, MAX_EVENTS);  // MAX_EVENTS = 100, but MAX_DISPLAY_EVENTS = 8
```

The display uses `MAX_DISPLAY_EVENTS = 8`, but the sandbox column's `recentOutput` display (`SandboxColumn.tsx:284-293`) renders ALL items in the array without a limit on the map:

```typescript
{state.recentOutput.map((line) => (
  <Text key={line} dimColor>
    {truncate(line, 28)}
  </Text>
))}
```

While limited to 10 for WebSocket events, polled `recent_output` from JSON progress files is sliced to 3 in the poller but the sandbox column displays whatever is in `recentOutput` without enforcing a display limit.

**Supporting Evidence**: The sbx-c progress file shows duplicate entries in `recent_output` array, suggesting events are being appended without proper deduplication.

**Confidence Level**: Medium - The architecture has multiple layers of limiting but they're not consistently applied. The duplication observed in `recent_output` suggests hook-level batching issues.

### Issue 3: Sandbox Recovery UI State Inconsistency

**Root Cause**: When a sandbox is restarted (in `orchestrator.ts:426-473` or `529-576`), the orchestrator updates the `SandboxInstance` object's properties directly:

```typescript
instance.sandbox = newInstance.sandbox;
instance.id = newInstance.id;
instance.status = "ready";
instance.currentFeature = null;
// ... etc
```

However, the **UI's sandbox ID to label mapping** (`sandboxIdToLabelRef` in `ui/index.tsx:91`) is built from progress files:

```typescript
useEffect(() => {
  for (const [label, sandbox] of state.sandboxes) {
    if (sandbox.sandboxId) {
      sandboxIdToLabelRef.current.set(sandbox.sandboxId, label);
    }
  }
}, [state.sandboxes]);
```

When a sandbox restarts with a new ID, the **old ID still remains in the map** - the effect only adds, never removes. WebSocket events from the NEW sandbox ID may not be routed to the correct column because the ID-to-label mapping is stale.

Additionally, the `computeHealthStatus` function in `SandboxColumn.tsx:42-63` uses the heartbeat from the progress file, which may not be updated immediately after sandbox restart. The progress file is only updated when the NEW sandbox begins writing to it.

**Supporting Evidence**:
- Log shows three different sandbox IDs for sbx-c: starts with one ID, then `iao92u64gam5uf2p8ddh6` (seen in progress file), but E2B dashboard showed a "new, third sandbox"
- Progress file at completion shows `last_heartbeat` from 21:27:15 (24+ minutes old) suggesting the file wasn't updated by the recovered sandbox

**Confidence Level**: High - The code shows the ID mapping is append-only and stale heartbeats in progress files directly cause incorrect health status display.

### Issue 4: Feature 1375 Cycling Multiple Times

**Root Cause**: Looking at `sbx-c.log`, feature 1375 was started at:
- 21:25:39 - "Terminated"
- 21:32:21 - starts (overlaps with 21:32:41 start)
- 21:32:41 - "Terminated"
- 21:33:19 - finally completes

The rapid succession of start times (21:32:21 and 21:32:41 are only 20 seconds apart) suggests the sandbox was being **preemptively restarted** due to age (see `getSandboxesNeedingRestart` in `sandbox.ts:413-430` and keepalive loop in `orchestrator.ts:494-578`).

When a sandbox is restarted, any in-progress feature is reset to "pending":

```typescript
// orchestrator.ts:510-517
const feature = manifest.feature_queue.find(
  (f) => f.assigned_sandbox === label && f.status === "in_progress",
);
if (feature) {
  feature.status = "pending";
  feature.assigned_sandbox = undefined;
  // ...
}
```

However, the **timeout for Claude Code execution** (`/alpha:implement`) can exceed the preemptive restart threshold. The log shows "Terminated" which is a SIGTERM sent to the Claude Code process when the sandbox restarts.

**Supporting Evidence**:
- `SANDBOX_MAX_AGE_MS` controls preemptive restart (default 50 minutes)
- Multiple "Terminated" entries in log followed by new PTY sessions
- The feature was assigned, terminated, re-assigned, terminated, re-assigned, and finally completed

**Confidence Level**: High - Log evidence clearly shows the termination/restart cycle, and code shows the preemptive restart logic resets features.

### Issue 5: Dev Server Not Accessible at Completion

**Root Cause**: The `startDevServer` function in `sandbox.ts:286-296` is a fire-and-forget operation:

```typescript
export async function startDevServer(sandbox: Sandbox): Promise<string> {
  sandbox.commands
    .run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
    .catch(() => { /* fire and forget */ });

  const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
  return `https://${devServerHost}`;
}
```

The orchestrator waits 30 seconds after starting (`orchestrator.ts:1211-1212`):
```typescript
log("   Waiting for dev server to start (30s)...");
await sleep(30000);
```

However, **the URL is returned immediately** without verifying the server actually started. The `start-dev` script may fail or take longer than 30 seconds, and there's no health check on the port before presenting the URL to the user.

Additionally, after a long orchestration run, the review sandbox (sbx-a) may have been restarted multiple times, and the final `git pull` operation (`orchestrator.ts:1175-1183`) may fail silently (only logs a warning), leaving the workspace in an inconsistent state where the dev server can't start properly.

**Supporting Evidence**:
- E2B error message: "Connection refused on port 3000"
- The `startDevServer` doesn't wait for the dev server to be ready
- The sandbox ID in the error (`izy38sua6h8hpk5yifd3j`) matches sbx-a's final ID

**Confidence Level**: High - The fire-and-forget pattern and lack of port health check directly explains why the URL may be invalid.

## Fix Approach (High-Level)

1. **Progress Bar Flicker**:
   - Stabilize `tasksTotal` calculation to not fluctuate based on `current_task` presence
   - Consider combining heartbeat and poll timers or debouncing re-renders
   - Use React.memo more aggressively with stable comparison functions

2. **Unbounded Event List**:
   - Add explicit display limit in `SandboxColumn.tsx` when mapping `recentOutput`
   - Add deduplication logic for `recent_output` items based on content hash
   - Ensure consistent limits are applied at all layers (10 for storage, 3-5 for display)

3. **Sandbox Recovery UI State**:
   - Clear old sandbox IDs from `sandboxIdToLabelRef` when new sandbox is created
   - Write a "sandbox_restarted" marker to progress file so UI can reset health timers
   - Consider emitting a WebSocket event from orchestrator when sandbox restarts

4. **Feature Cycling**:
   - Increase `SANDBOX_MAX_AGE_MS` to allow more headroom for long-running features
   - Add logic to check if a feature is "almost done" before triggering preemptive restart
   - Consider graceful shutdown that waits for current task to complete

5. **Dev Server Not Accessible**:
   - Add a port health check loop after `startDevServer` that polls until the port responds or times out
   - Log clear error if dev server fails to start within timeout
   - Consider starting dev server earlier in the process and keeping it running

## Diagnosis Determination

All five issues have been identified with specific root causes in the codebase:

1. **Progress Bar Flicker** - Dual timer pattern + fluctuating task count calculation
2. **Event List Growth** - Inconsistent display limits + lack of deduplication
3. **Sandbox Recovery UI** - Stale ID mapping + old heartbeat in progress files
4. **Feature Cycling** - Preemptive restart terminates long-running features
5. **Dev Server Inaccessible** - Fire-and-forget startup without health check

## Additional Context

The Alpha Orchestrator system is a complex multi-process architecture with:
- TypeScript orchestrator managing E2B sandboxes
- Python event server for WebSocket streaming
- Ink-based React TUI for dashboard
- Multiple async polling/streaming data sources

The issues are largely race conditions and timing-related bugs that emerge under real-world execution conditions with long-running features and sandbox restarts.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, code analysis*
