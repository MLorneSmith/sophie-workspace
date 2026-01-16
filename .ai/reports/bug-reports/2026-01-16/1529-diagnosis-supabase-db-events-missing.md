# Bug Diagnosis: Supabase Database Events Not Appearing in UI + Potential DB Setup Timing Issue

**ID**: ISSUE-pending
**Created**: 2026-01-16T17:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI is not displaying Supabase database events (capacity check, reset, migration, seed) in the "Recent Events" section despite the implementation of issue #1522 (event emitter) and #1526 (WebSocket routing). Additionally, there are concerns about whether the Supabase database tables are being created at all in the sandbox project.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: 18+
- **Database**: Supabase (remote sandbox project: kdjbbhjgogqywtlctlzq)
- **Run ID**: run-mkh4tnhc-cast
- **Spec ID**: 1362

## Reproduction Steps

1. Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI during first 5 minutes
3. Check "Recent Events" section - no database events appear
4. Check Supabase dashboard for project kdjbbhjgogqywtlctlzq - tables may not be created

## Expected Behavior

During the first 2-5 minutes of orchestration:
1. Database capacity check events should appear (📊)
2. Database reset events should appear (🔄)
3. Migration events should appear (📦)
4. Seeding events should appear (🌱)
5. Verification events should appear (🔍)

## Actual Behavior

1. No database events appear in the UI during startup
2. Sandboxes start working on features (at ~5m mark, 3 sandboxes running)
3. Supabase tables may not be created (user reports tables not existing)

## Diagnostic Data

### Log Analysis

From `.ai/alpha/logs/run-mkh4tnhc-cast/`:

**sbx-a.log:**
```
Started: 2026-01-16T17:11:56.086Z
[PTY] Sending command: run-claude "/alpha:implement 1367"
```

**sbx-b.log:**
```
Started: 2026-01-16T17:11:56.067Z
[PTY] Sending command: run-claude "/alpha:implement 1373"
```

**sbx-c.log:**
```
Started: 2026-01-16T17:11:56.073Z
[PTY] Sending command: run-claude "/alpha:implement 1376"
```

All three sandboxes started essentially simultaneously at ~17:11:56Z, with features being implemented.

### Progress File Analysis

From `.ai/alpha/progress/overall-progress.json`:
```json
{
  "specId": 1362,
  "status": "in_progress",
  "initiativesCompleted": 0,
  "initiativesTotal": 4,
  "featuresCompleted": 0,
  "featuresTotal": 13,
  "lastCheckpoint": "2026-01-16T17:13:36.884Z"
}
```

Individual sandbox progress files show sandboxes actively working on features with recent heartbeats.

### Event Server Analysis

The event server is NOT currently running:
```bash
$ curl -s http://localhost:9000/health
Event server not running
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The database events are being emitted via `emitOrchestratorEvent()` but there appear to be TWO separate issues:

### Issue 1: Database Operations May Be Skipped Entirely

Looking at `orchestrator.ts` lines 936-957:

```typescript
// Check sandbox database capacity
if (!options.dryRun && process.env.SUPABASE_SANDBOX_DB_URL) {
  log("\n📊 Checking sandbox database...");
  const hasCapacity = await checkDatabaseCapacity(options.ui);
  // ...

  // Reset sandbox database
  if (!options.skipDbReset) {
    try {
      await resetSandboxDatabase(options.ui);
    } catch (error) {
      // ...
    }
  }
}
```

The database reset happens **BEFORE sandbox creation** (lines 999-1056). The seeding happens **AFTER first sandbox creation** (lines 1014-1037):

```typescript
// Seed database via first sandbox
if (
  !options.skipDbReset &&
  !options.skipDbSeed &&
  process.env.SUPABASE_SANDBOX_DB_URL
) {
  const alreadySeeded = await isDatabaseSeeded();
  if (alreadySeeded) {
    log("   ℹ️ Database already seeded, skipping seeding step");
  } else {
    const seedSuccess = await seedSandboxDatabase(
      firstInstance.sandbox,
      options.ui,
    );
    // ...
  }
}
```

### Issue 2: Event Server Startup vs Database Operations Timing

Looking at `orchestrator.ts` lines 828-835:

```typescript
// Start Event Server for real-time streaming (before UI)
let orchestratorUrl: string | null = null;
if (options.ui && !options.dryRun) {
  orchestratorUrl = await startEventServer(projectRoot, log);
  // Set orchestrator URL for sandbox environment injection
  setOrchestratorUrl(orchestratorUrl ?? undefined);
}
```

The event server starts **BEFORE** the database operations. This is correct. However, there's a potential race condition:

1. Event server starts at line 832
2. Database capacity check at line 938 emits `db_capacity_check` event
3. The event is sent via HTTP POST to `http://localhost:9000/api/events`

The `emitOrchestratorEvent()` function at `event-emitter.ts:72-97` uses fire-and-forget:

```typescript
fetch(EVENT_SERVER_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(event),
}).catch(() => {
  // Silently ignore errors - event server may not be running
});
```

**If the event server fails to start or takes longer than expected, all database events are silently dropped.**

### Issue 3: WebSocket Events Not Being Received

Even if events are sent to the event server, they may not reach the UI because:

1. The UI connects via WebSocket at `ws://localhost:9000/ws`
2. The `useEventStream` hook receives events and calls `handleIncomingEvent`
3. `handleOrchestratorEvent` processes events where `sandbox_id === "orchestrator"`

Looking at `event-emitter.ts:77-83`:

```typescript
const event: OrchestratorEmittedEvent = {
  sandbox_id: "orchestrator",
  event_type: eventType,
  timestamp: new Date().toISOString(),
  message,
  ...(details && { details }),
};
```

The event structure looks correct. However, checking `event-server.py:162-197`, the server expects events with these required fields:
- `sandbox_id`
- `event_type`

The events should be accepted. The issue is likely that the events are being sent but:
1. The event server isn't started in time
2. OR the WebSocket client hasn't connected yet when events are emitted
3. OR there's a network issue

### Issue 4: Database Tables Not Created

The user reports "The supabase tables have not been created in the slideheroes-alpha-sandbox project". This suggests:

1. `resetSandboxDatabase()` may have failed silently
2. OR `supabase db push --db-url` didn't apply migrations
3. OR the seeding step was skipped due to `isDatabaseSeeded()` returning true

From `database.ts:464-480`:

```typescript
export async function isDatabaseSeeded(): Promise<boolean> {
  const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
  if (!dbUrl) {
    return false;
  }

  try {
    // Check if payload.users table exists and has data
    const result = execSync(
      `psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
      { encoding: "utf-8" },
    );
    const count = parseInt(result.trim(), 10);
    return count > 0;
  } catch {
    return false;
  }
}
```

If `payload.users` doesn't exist, the query would fail and return false. But if there's leftover data from a previous run, it might return true and skip seeding.

### Supporting Evidence

1. **Logs show immediate sandbox work**: All three sandboxes started at ~17:11:56Z, immediately working on features
2. **No database error messages**: No error logs visible in the console output
3. **Event server not running now**: The server was likely running during orchestration but stopped with the process
4. **Tables missing**: User reports tables not created in Supabase project

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The event emitter and WebSocket routing code appears correct based on #1522 and #1526
- The most likely root cause is a timing issue where events are emitted before the WebSocket client connects
- The database tables not being created is a separate but related issue that needs investigation

## Fix Approach (High-Level)

### For DB Events Not Appearing:

1. **Add event buffering**: The event server should buffer events and replay them to newly connected WebSocket clients (it already sends `initial_events` but may not have received any events yet)

2. **Ensure synchronous event server startup**: Wait for the event server to be fully ready before proceeding with database operations

3. **Add WebSocket connection confirmation**: Wait for UI WebSocket connection before emitting events

### For Database Tables Not Created:

1. **Add verbose logging for DB operations**: Remove the silent error handling in database operations
2. **Verify psql availability**: Ensure psql is available on the orchestrator machine
3. **Add explicit verification step**: After migrations, verify tables exist before proceeding

## Diagnosis Determination

The root cause appears to be a **timing/race condition** between:
1. Event server startup
2. Database operation events being emitted
3. WebSocket client connection to receive events

Additionally, there may be a separate issue with database migrations not being applied correctly, causing the tables to not exist in the sandbox Supabase project.

**Key Finding**: The event emitter uses fire-and-forget HTTP POSTs with silent error handling. If anything fails in the chain (event server not ready, network issue, etc.), events are silently dropped with no indication of failure.

## Additional Context

### Relevant Issues
- #1522: Implemented event emitter (CLOSED)
- #1526: Implemented WebSocket routing (CLOSED)
- #1521: Original diagnosis for missing events
- #1525: Diagnosis for WebSocket routing issues

### Key Files
- `.ai/alpha/scripts/lib/event-emitter.ts` - Fire-and-forget event emission
- `.ai/alpha/scripts/lib/database.ts` - Database operations with event emission
- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration flow
- `.ai/alpha/scripts/event-server.py` - Event server (HTTP + WebSocket)
- `.ai/alpha/scripts/ui/index.tsx` - UI event handling

### Answers to Specific Questions

**Q: Should the supabase dB be reset and seeded within the first 5 minutes?**

**A: YES.** Based on the orchestrator code:
1. Database capacity check happens immediately after lock acquisition (before sandbox creation)
2. Database reset happens right after capacity check
3. First sandbox creation happens after reset
4. Database seeding happens immediately after first sandbox creation
5. Other sandboxes are created with 60-second stagger delays

The entire database setup sequence should complete within **2-3 minutes** of orchestration start:
- Capacity check: ~5 seconds
- Reset + migrations: ~30-60 seconds
- First sandbox creation: ~30-60 seconds
- Seeding: ~2-5 minutes

By the 5-minute mark, all database operations should be complete.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Glob*
