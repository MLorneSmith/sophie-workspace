# Bug Diagnosis: Event Server 'fetch failed' Error at Orchestrator Startup

**ID**: ISSUE-pending
**Created**: 2026-01-19T14:45:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: error

## Summary

When starting the Alpha Spec Orchestrator, the console displays the warning message `⚠️ Failed to emit event to event server: fetch failed`. This occurs during database capacity checks when the event emitter tries to send events to a server that hasn't been started yet.

## Environment

- **Application Version**: dev branch (commit f6a778fcc)
- **Environment**: development
- **Node Version**: (standard project version)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A - This is expected behavior, not a regression

## Reproduction Steps

1. Run the orchestrator without the `--ui` flag:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
   ```
2. Observe the console output during database capacity check
3. See the warning: `⚠️ Failed to emit event to event server: fetch failed`

## Expected Behavior

In non-UI mode, the orchestrator should either:
1. Not attempt to emit events to the event server since it's not started
2. OR silently swallow the error since events are not needed in non-UI mode

## Actual Behavior

The event emitter attempts to send events to `http://localhost:9000/api/events` even when running in non-UI mode, which results in a `fetch failed` error that is logged to the console.

## Diagnostic Data

### Console Output
```
⚠️ Failed to emit event to event server: fetch failed
```

### Network Analysis
The error occurs because:
- The event server (`event-server.py`) is only started when `options.ui` is true (line 945-949 of orchestrator.ts)
- However, database operations emit events via `emitOrchestratorEvent()` regardless of UI mode
- The event emitter on line 87-101 of `event-emitter.ts` attempts a fetch to `http://localhost:9000/api/events`
- Since the server isn't running, fetch fails with "fetch failed"

### Code Flow Analysis

1. **orchestrator.ts:1056-1058**: Database capacity check is called
   ```typescript
   if (!options.dryRun && process.env.SUPABASE_SANDBOX_DB_URL) {
       log("\n📊 Checking sandbox database...");
       const hasCapacity = await checkDatabaseCapacity(options.ui);
   ```

2. **database.ts:70**: Event is emitted
   ```typescript
   emitOrchestratorEvent("db_capacity_check", "Checking database capacity...");
   ```

3. **event-emitter.ts:87-101**: Event emission with error handling
   ```typescript
   fetch(EVENT_SERVER_URL, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(event),
   }).catch((err) => {
       // In non-UI mode (ORCHESTRATOR_UI_ENABLED not set), log the error
       if (!process.env.ORCHESTRATOR_UI_ENABLED) {
           console.error(`⚠️ Failed to emit event to event server: ${err instanceof Error ? err.message : String(err)}`);
       }
   });
   ```

4. **Key Issue**: The event server is only started when `options.ui` is true (line 945), but `ORCHESTRATOR_UI_ENABLED` environment variable is not being set, causing the error to be logged.

## Error Stack Traces
```
The error doesn't produce a stack trace - it's a simple fetch failure message from the catch handler.
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/event-emitter.ts:87-101` (error logging logic)
  - `.ai/alpha/scripts/lib/database.ts:70-110` (calls emitOrchestratorEvent)
  - `.ai/alpha/scripts/lib/orchestrator.ts:945-949` (event server startup condition)
  - `.ai/alpha/scripts/config/constants.ts:93` (EVENT_SERVER_PORT = 9000)
- **Recent Changes**: None directly related - this is existing behavior
- **Suspected Functions**: `emitOrchestratorEvent()` in `event-emitter.ts`

## Related Issues & Context

### Similar Symptoms
- N/A - This appears to be the first report of this issue

### Historical Context
The event system was added to provide real-time visibility into orchestrator operations via a WebSocket-based UI dashboard. The error logging was intentionally added in non-UI mode to help with debugging, but it creates confusing output when the user doesn't intend to use the UI.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The event emitter attempts to send events to the event server in ALL modes, but the event server is only started in UI mode. The error is logged because `ORCHESTRATOR_UI_ENABLED` is not set.

**Detailed Explanation**:

The root cause is a **design mismatch** between two systems:

1. **Event Emission (event-emitter.ts)**: Events are emitted unconditionally from database operations. The error handling uses `ORCHESTRATOR_UI_ENABLED` environment variable to decide whether to log errors.

2. **Event Server Startup (orchestrator.ts)**: The event server is only started when `options.ui` is true, but this does NOT set `ORCHESTRATOR_UI_ENABLED`.

3. **The Gap**: There's no mechanism to prevent event emission in non-UI mode OR to silence the error logs when running without UI.

The code at `event-emitter.ts:96` checks:
```typescript
if (!process.env.ORCHESTRATOR_UI_ENABLED) {
    console.error(`⚠️ Failed to emit event...`);
}
```

But `ORCHESTRATOR_UI_ENABLED` is never set anywhere in the codebase - it's not set in `orchestrator.ts` when UI mode is enabled.

**Supporting Evidence**:
- `event-emitter.ts:96`: Checks for `ORCHESTRATOR_UI_ENABLED` but this env var is never set
- `orchestrator.ts:945-949`: Event server only starts if `options.ui && !options.dryRun`
- `database.ts:70`: Emits events unconditionally during capacity check
- Grep search confirms `ORCHESTRATOR_UI_ENABLED` is only referenced, never assigned

### How This Causes the Observed Behavior

1. User runs orchestrator without `--ui` flag → `options.ui = false`
2. Event server is NOT started (orchestrator.ts:945 condition fails)
3. Database capacity check runs (orchestrator.ts:1056-1058)
4. `emitOrchestratorEvent()` is called (database.ts:70)
5. Fetch to `http://localhost:9000/api/events` fails (server not running)
6. Error caught, `ORCHESTRATOR_UI_ENABLED` not set → error logged
7. User sees confusing warning message

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clearly traceable
- The environment variable check is explicit
- The condition for starting the event server is explicit
- Grep confirms the env var is never set anywhere

## Fix Approach (High-Level)

Two possible approaches (in order of preference):

**Option 1: Set the environment variable when UI is enabled**
Add to orchestrator.ts after UI mode is determined:
```typescript
if (options.ui) {
    process.env.ORCHESTRATOR_UI_ENABLED = "true";
}
```

**Option 2: Pass uiEnabled flag to event emitter**
Modify `emitOrchestratorEvent()` to accept a `uiEnabled` parameter and only attempt emission when UI is enabled.

**Option 3: Check if event server is running before emitting**
Add a quick health check before emission, but this adds latency and complexity.

Option 1 is simplest and requires minimal code changes.

## Diagnosis Determination

This is a **low-severity cosmetic issue** - the orchestrator continues to function correctly despite the warning. The event emission uses fire-and-forget pattern, so the failure doesn't block any operations.

The fix is straightforward: set `ORCHESTRATOR_UI_ENABLED=true` when `options.ui` is true, before any database operations begin.

## Additional Context

- The warning only appears in non-UI mode (when running without `--ui` flag)
- The orchestrator works correctly - this is purely a console noise issue
- The event system is designed for real-time UI updates, so it's not needed in CLI-only mode

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, TodoWrite, Bash*
