# Bug Diagnosis: Alpha Event Streaming - Network Unreachable from E2B Sandboxes

**ID**: ISSUE-pending
**Created**: 2026-01-13T12:00:00Z
**Reporter**: User-reported/System Analysis
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The Alpha Orchestrator UI fails to update the "Output:" section of sandbox columns in real-time. The UI shows only the initial 2 lines ("Using OAuth authentication" and "Running Claude Code with...") but never displays subsequent tool activity. This is because the event streaming system's HTTP POST from E2B sandboxes to the local event server cannot reach `localhost:9000` from inside the sandbox.

## Environment

- **Application Version**: Dev branch
- **Environment**: Development (E2B sandboxes + local orchestrator)
- **Node Version**: 20.x
- **E2B SDK**: Latest
- **Event Server**: Python FastAPI (port 9000)
- **UI Framework**: Ink (React for CLI)

## Reproduction Steps

1. Start the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Wait for sandboxes to start and begin work
3. Observe the sandbox columns in the UI
4. Notice the "Output:" section shows only initial 2 lines and never updates

## Expected Behavior

The "Output:" section of each sandbox column should display real-time tool activity as Claude executes tools, showing entries like:
- `📖 Read: dashboard.types.ts`
- `📝 Write: loader.ts`
- `💻 Bash: pnpm typecheck`

## Actual Behavior

The "Output:" section shows only the initial startup lines and never updates:
```
Output:
Using OAuth authenticatio...
Running Claude Code with ...
```

## Diagnostic Data

### Architecture Analysis

The event streaming system has three components:

1. **Event Server** (local): `event-server.py` running on `localhost:9000`
2. **Event Reporter Hook** (sandbox): `event_reporter.py` in Claude Code hooks
3. **UI WebSocket Client** (local): `useEventStream.ts` connects to `ws://localhost:9000/ws`

### Network Analysis

**ROOT CAUSE IDENTIFIED**: The `ORCHESTRATOR_URL` environment variable is set to `http://localhost:9000` but the hooks run inside E2B sandboxes which have a completely separate network namespace.

From inside the E2B sandbox:
- `localhost:9000` refers to the sandbox's own localhost, not the orchestrator machine
- The orchestrator machine is NOT directly reachable from the sandbox
- E2B sandboxes run in isolated cloud VMs - they cannot reach the developer's local machine

### Code Path Analysis

1. **Orchestrator starts event server** (`orchestrator.ts:756-758`):
   ```typescript
   orchestratorUrl = await startEventServer(projectRoot, log);
   setOrchestratorUrl(orchestratorUrl ?? undefined);
   // Sets: http://localhost:9000
   ```

2. **Sandbox receives env var** (`environment.ts:228-230`):
   ```typescript
   if (_orchestratorUrl) {
     envs.ORCHESTRATOR_URL = _orchestratorUrl;
   }
   ```

3. **Hook tries to POST** (`event_reporter.py:32-37`):
   ```python
   def get_orchestrator_url() -> str | None:
       url = os.environ.get("ORCHESTRATOR_URL")  # Gets http://localhost:9000
       return url.rstrip("/") if url else None
   ```

4. **HTTP POST fails silently** (`event_reporter.py:107-139`):
   - POST to `http://localhost:9000/api/events` fails because localhost inside sandbox ≠ orchestrator
   - Hook catches all exceptions and exits with code 0 (silent failure by design)
   - No events reach the server

### Evidence from Progress Files

The progress files contain `recent_output: []` (empty arrays) when they should contain tool activity:

```json
// .ai/alpha/progress/sbx-a-progress.json
{
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
  // No tool activity entries ever added
}
```

These initial 2 lines come from the `onStdout` callback in `feature.ts:241-273`, not from the event streaming system.

### Why the Backup Path Also Fails

There are two potential sources for `recent_output`:

1. **Primary (Event Streaming)**: Events flow via HTTP POST → WebSocket → UI
   - **FAILS**: Network unreachable from sandbox

2. **Secondary (stdout callback)**: `feature.ts` captures stdout and writes to progress files
   - **PARTIAL**: Only captures startup banner, not tool activity
   - Tool activity is not printed to stdout by Claude Code CLI

## Related Issues & Context

### Direct Predecessors
- #1436 (OPEN): "Bug Diagnosis: Alpha Event Streaming UI Output Not Updating" - Previous diagnosis identified hook registration issue, but this goes deeper
- #1437 (OPEN): "Bug Fix: Alpha Event Streaming UI Output Not Updating" - Fix plan based on incomplete diagnosis

### Related Infrastructure Issues
- E2B sandbox networking is fundamentally isolated from local machine

## Root Cause Analysis

### Identified Root Cause

**Summary**: The event streaming system sends HTTP POSTs to `localhost:9000` from E2B sandboxes, but `localhost` inside a sandbox refers to the sandbox's own network, not the orchestrator machine. The events never reach the event server.

**Detailed Explanation**:

E2B sandboxes are cloud-hosted VMs with isolated network namespaces. When the orchestrator sets `ORCHESTRATOR_URL=http://localhost:9000` and passes it to the sandbox, the hook tries to POST to `localhost:9000` from inside the sandbox. However:

1. `localhost` inside the sandbox refers to the sandbox VM itself
2. The sandbox has no server running on port 9000
3. The connection times out or fails immediately
4. The hook catches all errors and exits silently (to avoid blocking Claude)

This is a fundamental architectural issue - the event server runs on the developer's local machine but needs to receive HTTP requests from cloud VMs that cannot reach it.

**Supporting Evidence**:
- `event_reporter.py:32-37`: Gets `ORCHESTRATOR_URL` which is set to `localhost:9000`
- `event_reporter.py:107-139`: POST fails because localhost in sandbox ≠ orchestrator
- Progress files show empty `recent_output` arrays after initialization
- Log files only contain stdout capture, no event data

### How This Causes the Observed Behavior

1. Orchestrator starts event server on `localhost:9000`
2. Orchestrator passes `ORCHESTRATOR_URL=http://localhost:9000` to sandbox env
3. Claude Code runs in sandbox, triggers `PostToolUse` hooks
4. `event_reporter.py` tries to POST to `localhost:9000` from inside sandbox
5. POST fails (localhost unreachable) - fails silently
6. Event server never receives events
7. WebSocket never broadcasts anything
8. UI `realtimeOutput` state stays empty
9. UI falls back to progress file polling
10. Progress files have empty `recent_output` (only stdout callback writes to them)
11. UI shows only initial 2 lines from stdout capture

### Confidence Level

**Confidence**: High

**Reasoning**:
- E2B documentation confirms sandboxes are isolated cloud VMs
- Network architecture makes localhost:9000 unreachable by design
- The hook's silent failure pattern explains why no errors are visible
- The stdout callback only captures 2 initial lines, matching observed behavior
- All evidence points to network unreachability as the root cause

## Fix Approach (High-Level)

Three potential approaches:

### Option A: Expose Event Server via ngrok/localtunnel (Quick Fix)
- Use a tunnel service to expose localhost:9000 to the internet
- Set `ORCHESTRATOR_URL` to the public tunnel URL
- Pros: Works with current architecture
- Cons: Requires external service, adds latency, potential security concerns

### Option B: Write Events to Progress Files in Sandbox (Recommended)
- Modify `event_reporter.py` to write events to `.initiative-progress.json` inside the sandbox
- Orchestrator already polls this file via `progress.ts`
- No network required - uses existing file-based progress mechanism
- Pros: Works within existing constraints, no external dependencies
- Cons: Slightly higher latency than WebSocket

### Option C: Use E2B's Port Forwarding
- E2B supports exposing sandbox ports to the internet
- Reverse the flow: sandbox runs event server, orchestrator connects to it
- Pros: True real-time, uses E2B's infrastructure
- Cons: More complex, requires architecture change

**Recommended**: Option B - it leverages the existing file polling mechanism that already works for heartbeats and progress, requires minimal code changes, and is guaranteed to work within E2B's architecture.

## Diagnosis Determination

The root cause has been definitively identified: **Network isolation between E2B sandboxes and the orchestrator's local machine prevents HTTP POST events from reaching the event server.**

The event streaming system was designed with the assumption that sandboxes could reach localhost, which is not the case with cloud-hosted E2B sandboxes. This is a fundamental architectural mismatch that requires changing how events are communicated from sandbox to orchestrator.

## Additional Context

### Previous Diagnosis (#1436) vs This Diagnosis

The previous diagnosis (#1436) identified that `update_recent_output.py` wasn't registered in the slash command hooks. While technically correct, this was a secondary issue. Even if that hook were registered:
1. It writes to `.ai/alpha/progress/` which doesn't exist in sandboxes
2. The primary `event_reporter.py` IS registered but can't reach the server

This diagnosis goes to the actual root cause: network unreachability between sandbox and orchestrator.

### Why the System Appeared to Work During Development

The event streaming system may have been developed and tested locally (without E2B), where localhost IS reachable. The issue only manifests when actually running in E2B sandboxes.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (for directory creation)*
