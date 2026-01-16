# Bug Diagnosis: WebSocket DB Events Not Displayed in UI EventLog

**ID**: ISSUE-1525
**Created**: 2026-01-16T17:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Despite implementing Issue #1522 (Orchestrator Database Setup Events Missing from UI), database operation events emitted by the orchestrator are not appearing in the "Recent Events" section of the UI dashboard. The event emitter is correctly sending events to the event server, but the UI's WebSocket event handler filters them out before they can be displayed.

## Environment

- **Application Version**: Alpha Orchestrator (development)
- **Environment**: development
- **Node Version**: 18+
- **Database**: Supabase (remote sandbox)
- **Last Working**: N/A (feature incomplete)

## Reproduction Steps

1. Start the orchestrator with UI: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI dashboard during database initialization (~first 2 minutes)
3. Look at the "Recent Events" section
4. Expected: DB events like "Checking database capacity...", "Resetting sandbox database...", etc.
5. Actual: No DB events appear; only sandbox task events appear later

## Expected Behavior

Database operation events (capacity check, reset, migrations, seeding) should appear in the "Recent Events" section of the UI dashboard in real-time, with appropriate icons and colors as defined in Issue #1522.

## Actual Behavior

The "Recent Events" section shows "No events yet..." during database operations. Events only start appearing when sandboxes begin working on features (task_start, task_complete events from the progress poller).

## Diagnostic Data

### Code Analysis

**Event Flow Architecture:**
1. `event-emitter.ts` emits events via HTTP POST to `http://localhost:9000/api/events`
2. `event-server.py` receives events and broadcasts via WebSocket
3. UI `useEventStream` hook receives events from `ws://localhost:9000/ws`
4. UI `handleWebSocketEvent` processes events
5. `EventLog` component displays events from `state.events`

**Root Cause Location:**

File: `.ai/alpha/scripts/ui/index.tsx`, lines 127-149

```typescript
// Handle incoming WebSocket event - update real-time output
const handleWebSocketEvent = useCallback(
  (event: WebSocketEvent) => {
    const sandboxId = event.sandbox_id;
    if (!sandboxId) return;

    // Skip non-tool events (heartbeats, etc.)
    if (event.event_type !== "post_tool_use") return;  // <-- BUG: Filters out ALL DB events!

    const displayText = formatEventForDisplay(event);
    if (!displayText) return;

    setRealtimeOutput((prev) => {
      // ... updates realtimeOutput state for sandbox columns
    });
  },
  [formatEventForDisplay],
);
```

**Problem 1:** The `handleWebSocketEvent` function filters out all events except `post_tool_use`. Database events have types like `db_reset_start`, `db_capacity_check`, etc. - all are discarded.

**Problem 2:** The `handleWebSocketEvent` function only updates `realtimeOutput` state (used for sandbox column real-time output), NOT the `state.events` array that feeds the `EventLog` component.

**Problem 3:** The `EventLog` component receives events from `state.events` (line 56 of OrchestratorUI.tsx):
```typescript
<EventLog events={state.events} />
```

But `state.events` comes from `useProgressPoller`, which generates events from **state changes in progress files**, NOT from WebSocket events.

### Event Type Mismatch

The orchestrator emits events with `event_type` values like:
- `db_capacity_check`
- `db_capacity_ok`
- `db_reset_start`
- `db_reset_complete`
- `db_seed_start`
- `db_seed_complete`

But `handleWebSocketEvent` only accepts:
- `post_tool_use` (line 134)

### Database Operations Timing

Database operations occur at orchestrator startup:
1. Lines 936-956: Check capacity, reset database
2. Lines 1002-1011: Create first sandbox
3. Lines 1014-1037: Seed database via first sandbox

This happens within the first ~2-5 minutes, before sandboxes start working on features.

## Error Stack Traces

No errors - events are silently filtered out.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/index.tsx` (handleWebSocketEvent filter)
  - `.ai/alpha/scripts/ui/components/EventLog.tsx` (displays state.events)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` (generates state.events)
  - `.ai/alpha/scripts/lib/event-emitter.ts` (emits events correctly)

- **Recent Changes**: Issue #1522 added event emission but did not connect WebSocket events to EventLog

- **Suspected Functions**:
  - `handleWebSocketEvent()` in index.tsx
  - `generateEvents()` in useProgressPoller.ts

## Related Issues & Context

### Direct Predecessors

- #1521 (CLOSED): "Bug Diagnosis: Orchestrator Database Setup Events Missing from UI" - Original diagnosis
- #1522 (CLOSED): "Bug Fix: Orchestrator Database Setup Events Missing from UI" - Implemented event emitter but incomplete integration

### Similar Symptoms

The implementation of #1522 added:
1. Event emitter utility (`event-emitter.ts`) ✓
2. Event emission calls in `database.ts` ✓
3. New event types in UI types ✓
4. Icons/colors in EventLog ✓

But it **did not** add:
5. Integration of WebSocket events into the EventLog's event source

### Historical Context

This is a follow-on bug from #1522's implementation. The fix added the plumbing for events but didn't complete the integration to display them.

## Root Cause Analysis

### Identified Root Cause

**Summary**: WebSocket events are filtered out by `handleWebSocketEvent()` and never added to `state.events` which feeds the EventLog component.

**Detailed Explanation**:

The issue has two parts:

1. **Filter Problem**: `handleWebSocketEvent()` at line 134 checks `if (event.event_type !== "post_tool_use") return;` - this discards all database events since they have types like `db_reset_start`, not `post_tool_use`.

2. **Routing Problem**: Even if the filter was fixed, the function only updates `realtimeOutput` (for sandbox column display), NOT `state.events` (for EventLog display). The EventLog receives events from `generateEvents()` in useProgressPoller, which only creates events based on progress file state changes.

**Supporting Evidence**:
- Code at `.ai/alpha/scripts/ui/index.tsx:134` shows explicit filter
- Code at `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx:56` shows EventLog receives `state.events`
- Code at `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:496-699` shows `generateEvents()` only creates events from sandbox state changes
- EventLog types at `.ai/alpha/scripts/ui/types.ts:200-226` include db_* event types (added by #1522) but they're never used

### How This Causes the Observed Behavior

1. Orchestrator starts, calls `checkDatabaseCapacity()`, `resetSandboxDatabase()`, `seedSandboxDatabase()`
2. Each function emits events via `emitOrchestratorEvent()` to event server
3. Event server broadcasts events via WebSocket
4. UI receives events in `useEventStream` hook
5. `handleWebSocketEvent` callback is called for each event
6. Line 134 checks `event_type !== "post_tool_use"` and returns early
7. DB events are discarded, never reach EventLog
8. User sees "No events yet..." during database operations

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is clear and the filter at line 134 explicitly rejects all non-tool events. The architecture shows events need to flow into `state.events` but WebSocket events only flow into `realtimeOutput`. This is a straightforward code analysis with no ambiguity.

## Fix Approach (High-Level)

Two changes needed:

1. **Remove/modify the filter** in `handleWebSocketEvent()` to allow db_* event types to pass through

2. **Add WebSocket events to state.events**: Either:
   - Modify `handleWebSocketEvent` to also add orchestrator events to a new state that gets merged into `state.events`
   - Or create a separate handler for orchestrator events that adds them directly to the events array
   - Or merge WebSocket events into the `useProgressPoller` event stream

The cleanest approach is likely to:
- Keep `handleWebSocketEvent` for sandbox tool events (realtimeOutput)
- Add a new handler for orchestrator events (db_*, etc.) that converts them to `OrchestratorEvent` format and adds them to a separate state array
- Merge this array with `state.events` for EventLog display

## Diagnosis Determination

**Root cause confirmed**: The implementation in #1522 created the event emission pipeline but did not complete the UI integration. Specifically:
1. Events are emitted correctly from orchestrator
2. Events are received correctly by WebSocket client
3. Events are filtered out by `handleWebSocketEvent()` before processing
4. Even without the filter, events would not reach EventLog due to incorrect routing

The fix requires modifying the UI to properly route orchestrator WebSocket events to the EventLog component's data source.

## Additional Context

**Design Note**: The current architecture separates sandbox events (for realtimeOutput) from orchestrator events (for EventLog). The WebSocket currently only feeds sandbox events. A proper fix should maintain this separation while adding a parallel path for orchestrator events to the EventLog.

**Database Seeding Status**: Based on the logs showing sandboxes starting features, the database seeding IS occurring - it's just not visible in the UI. The user's concern about "supabase tables not being created" is likely a misunderstanding - the tables are created but the events aren't displayed.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue view)*
