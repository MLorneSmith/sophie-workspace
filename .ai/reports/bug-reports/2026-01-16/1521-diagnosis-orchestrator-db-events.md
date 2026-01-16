# Bug Diagnosis: Orchestrator Database Setup Events Missing from UI

**ID**: ISSUE-1521
**Created**: 2026-01-16T16:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When the Alpha Spec Orchestrator runs database setup steps (capacity check, schema reset, migration push, and Payload seeding), there is no feedback displayed in the UI's "Recent Events" section. The database operations use `console.log()` calls that are suppressed when UI mode is enabled, but no events are sent to the event server for real-time streaming to the dashboard.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL via Supabase
- **Last Working**: N/A - Never implemented

## Reproduction Steps

1. Run the orchestrator with UI enabled: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Watch the UI dashboard as it starts up
3. Observe the "Recent Events" section during database initialization
4. Notice that no events appear for database capacity check, reset, migrations, or seeding

## Expected Behavior

The UI should display events in the "Recent Events" section showing:
- "Checking database capacity..." / "Database capacity OK: 45.2MB / 500MB"
- "Resetting sandbox database..."
- "Database schema reset complete"
- "Applying base migrations..."
- "Base migrations applied"
- "Running Payload migrations..."
- "Payload migrations complete"
- "Running Payload seeding..."
- "Payload seeding complete"
- "Verified: 5 user(s) seeded"

## Actual Behavior

When UI mode is enabled (`options.ui = true`), the database operations in `database.ts` use a conditional logger that suppresses all output:

```typescript
function createLogger(uiEnabled: boolean) {
    return {
        log: (...args: unknown[]) => {
            if (!uiEnabled) console.log(...args);  // <-- suppressed when UI enabled
        },
        // ...
    };
}
```

No events are sent to the WebSocket event server (`/api/events`) for real-time streaming. The UI only receives events from hooks running inside E2B sandboxes via Claude Code's PostToolUse hook, not from the orchestrator itself.

## Diagnostic Data

### Console Output
```
When UI is disabled (--no-ui), full database output is visible:
📊 Checking sandbox database...
   📊 Sandbox database size: 45.2MB / 500MB
🔄 Resetting sandbox database...
   ✅ Database schema reset
   📦 Applying base migrations...
   ✅ Base migrations applied
🌱 Seeding sandbox database...
   📦 Running Payload migrations...
   ✅ Payload migrations complete
   🌱 Running Payload seeding...
   ✅ Payload seeding complete
   🔍 Verifying seeded data...
   ✅ Verified: 5 user(s) seeded

When UI is enabled, all the above is suppressed and NO events appear in the dashboard.
```

### Architecture Analysis

The event streaming system has two separate paths:

1. **Sandbox Events (working)**: E2B sandboxes → Claude Code hooks → HTTP POST to event-server.py → WebSocket → UI
2. **Orchestrator Events (missing)**: orchestrator.ts/database.ts → ???

There is no mechanism for the orchestrator itself to send events to the event server.

### Affected Files

- `.ai/alpha/scripts/lib/database.ts` - Database operations use suppressed console.log
- `.ai/alpha/scripts/lib/orchestrator.ts` - Calls database functions, doesn't emit events
- `.ai/alpha/scripts/lib/sandbox.ts` - Also uses suppressed logging during setup
- `.ai/alpha/scripts/event-server.py` - Has POST /api/events endpoint but orchestrator doesn't use it

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator lacks a mechanism to emit events to the event server; database operations only use console.log which is deliberately suppressed in UI mode.

**Detailed Explanation**:
The UI event streaming system was designed for Claude Code hooks running inside E2B sandboxes to send events via HTTP POST to the event server. However, the orchestrator itself (running locally) has no integration with this event system. When the orchestrator performs database operations, it uses a conditional logger that completely suppresses output in UI mode to prevent interfering with the Ink-based dashboard.

The architecture has a gap: while sandbox-side events are captured via hooks, orchestrator-side events (database setup, sandbox creation, health checks) have no pathway to the UI except through the progress files which are polled, not streamed in real-time.

**Supporting Evidence**:
- Code reference: `.ai/alpha/scripts/lib/database.ts:32-45` - createLogger suppresses output when uiEnabled is true
- Code reference: `.ai/alpha/scripts/lib/orchestrator.ts:935-957` - Database operations called with `options.ui` passed through
- Code reference: `.ai/alpha/scripts/event-server.py:162-197` - POST endpoint exists but no orchestrator code calls it
- Progress file analysis shows no database events captured in sandbox progress files

### How This Causes the Observed Behavior

1. User starts orchestrator with UI enabled
2. Orchestrator calls `checkDatabaseCapacity(options.ui)` → `createLogger(true)` → logs suppressed
3. Orchestrator calls `resetSandboxDatabase(options.ui)` → logs suppressed
4. Orchestrator calls `seedSandboxDatabase(sandbox, options.ui)` → logs suppressed
5. No HTTP POST calls are made to event server
6. UI dashboard receives no database-related events
7. User sees empty "Recent Events" during the entire database setup phase

### Confidence Level

**Confidence**: High

**Reasoning**: The code clearly shows:
1. Conditional logger suppresses all output when `uiEnabled=true`
2. No HTTP/fetch calls to the event server from orchestrator code
3. Event server only receives events from sandbox-side hooks
4. The gap in architecture is evident from the code flow

## Fix Approach (High-Level)

Create an orchestrator event emitter utility that sends events to the local event server via HTTP POST. Integrate this into database.ts and other orchestrator modules to emit events for key operations:

```typescript
// Proposed: .ai/alpha/scripts/lib/event-emitter.ts
async function emitOrchestratorEvent(event: {
    event_type: string;
    message: string;
    sandbox_id?: string;
    details?: Record<string, unknown>;
}): Promise<void> {
    const url = `http://localhost:${EVENT_SERVER_PORT}/api/events`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sandbox_id: event.sandbox_id || 'orchestrator',
            event_type: event.event_type,
            timestamp: new Date().toISOString(),
            ...event
        })
    });
}
```

Then update database.ts to call this for key operations, alongside the existing console.log calls.

## Diagnosis Determination

The root cause is a missing architectural component: the orchestrator has no integration with the event streaming system. Database setup logs are deliberately suppressed in UI mode but there is no alternative pathway to communicate these events to the dashboard. This is a feature gap rather than a regression - the event streaming was designed for sandbox-side hooks but never extended to orchestrator-side operations.

## Additional Context

- The event server is started before sandbox creation in `orchestrate()` at line 831-834
- The WebSocket connection is established and working for sandbox events
- The fix should be non-breaking: orchestrator events can use a special `sandbox_id` like "orchestrator" to distinguish from sandbox events
- UI event icons/colors may need extension for orchestrator event types (db_reset, db_seed, migration_sync, etc.)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, code analysis*
