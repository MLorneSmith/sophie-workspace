# Bug Diagnosis: Alpha Orchestrator Missing DB Events and Database Not Created

**ID**: ISSUE-pending
**Created**: 2026-01-16T20:30:00.000Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Autonomous Coding workflow is failing to display Supabase database events in the UI's "Recent Events" section, and the remote Supabase database in `slideheroes-alpha-sandbox` is not being created or seeded. Sandboxes are running tasks but the database infrastructure that should be set up in the first 5 minutes never happens.

## Environment

- **Application Version**: dev branch (commit e70db2e3b)
- **Environment**: development
- **Node Version**: Node.js (tsx runner)
- **Database**: PostgreSQL via Supabase (remote sandbox: kdjbbhjgogqywtlctlzq)
- **Python Version**: python3 (missing FastAPI packages)
- **Last Working**: Unknown

## Reproduction Steps

1. Run the Alpha Orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
2. Wait for the UI to display and show "Connecting to sandboxes..."
3. Observe the "Recent Events" section - it shows "No events yet..."
4. Wait 5+ minutes for sandboxes to start working on tasks
5. Check the "Recent Events" section - still shows "No events yet..."
6. Query the remote Supabase database - shows 0 tables in public schema

## Expected Behavior

According to the documented timeline:
- **~5s**: `db_capacity_check` and `db_capacity_ok` events should appear
- **~30-60s**: `db_reset_start`, `db_reset_complete`, `db_migration_start`, `db_migration_complete`, `db_verify` events should appear
- **~2-5min**: `db_seed_start`, `db_seed_complete`, `db_verify` events should appear

The Supabase remote database should have tables created after migrations and seed data after seeding.

## Actual Behavior

- No database events appear in the UI at any point
- The remote Supabase database remains empty (0 public tables)
- Sandboxes successfully start and work on feature tasks
- The progress files show active sandbox work

## Diagnostic Data

### Python Environment Check
```
$ python3 -c "import fastapi, uvicorn; print('OK')"
Traceback (most recent call last):
  File "<string>", line 1, in <module>
ModuleNotFoundError: No module named 'fastapi'
```

### Database State Verification
```
$ PGPASSWORD="***" psql -h aws-0-us-west-2.pooler.supabase.com -p 5432 \
    -U postgres.kdjbbhjgogqywtlctlzq -d postgres \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
     0
```

### Sandbox Progress Files
Sandboxes are actively running:
- `sbx-a-progress.json`: Feature #1367, Task T1 in progress
- `sbx-b-progress.json`: Feature #1373, Task T4 starting (3 tasks completed)
- `sbx-c-progress.json`: Feature #1376, executing phase

### Environment Variables
The Supabase sandbox configuration is properly set in `.env`:
- `SUPABASE_SANDBOX_PROJECT_REF`: Configured
- `SUPABASE_SANDBOX_URL`: Configured
- `SUPABASE_SANDBOX_DB_URL`: Configured
- `SUPABASE_ACCESS_TOKEN`: Configured

## Error Stack Traces

No explicit error stack traces - failures are silent due to fire-and-forget pattern.

## Related Code

### Affected Files:
- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration logic
- `.ai/alpha/scripts/lib/event-emitter.ts` - Event emission (fire-and-forget)
- `.ai/alpha/scripts/lib/database.ts` - Database operations
- `.ai/alpha/scripts/event-server.py` - Python event server (requires FastAPI)
- `.ai/alpha/scripts/ui/index.tsx` - UI event handling

### Recent Changes:
Related GitHub issues that were implemented:
- #1522, #1526, #1530, #1533, #1540 (event system implementation)

### Suspected Functions:
- `startEventServer()` in `orchestrator.ts:102-177` - Fails silently when Python packages missing
- `emitOrchestratorEvent()` in `event-emitter.ts:72-96` - Silently catches network errors
- `resetSandboxDatabase()` in `database.ts:144-272` - Uses `psql` which may fail silently

## Related Issues & Context

### Direct Predecessors
- #1522: Event streaming infrastructure
- #1526: Database event types
- #1530: Event UI components
- #1533: WebSocket connection handling
- #1540: UI event display

### Infrastructure Issues
The event server depends on Python packages not installed locally.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The event server fails to start because the required Python packages (`fastapi`, `uvicorn`) are not installed, causing all database events to be silently dropped.

**Detailed Explanation**:

The event flow has a critical failure point:

1. **Event Server Startup Failure**: The `startEventServer()` function in `orchestrator.ts:102-177` spawns `python3 .ai/alpha/scripts/event-server.py`. This Python script requires `fastapi` and `uvicorn` packages (lines 31-38 of `event-server.py`). When these packages are not installed, the script exits immediately with an import error.

2. **Startup Detection Bypass**: The startup code waits for the string "Starting Alpha Event Server" to appear in stdout (line 140-144). Since the Python process exits before printing this, the 10-second timeout is triggered (line 134-136), and `startEventServer()` returns `null` instead of the URL.

3. **Silent Event Dropping**: With `orchestratorUrl = null`, the UI is started with `eventStreamEnabled: false` (line 917), disabling WebSocket connections. However, events are still emitted via HTTP POST in `emitOrchestratorEvent()` (lines 87-96 of `event-emitter.ts`). These POST requests fail with "connection refused" because no server is listening on port 9000. The errors are silently caught (line 93: `.catch(() => {})`).

4. **Database Operations Uncertainty**: The database operations in `database.ts` use `execSync` with `psql` commands. If `psql` is available but misconfigured, or if network issues occur, errors may also be silently handled. The database showing 0 tables suggests the reset/migration operations never ran successfully.

**Code Path**:
```
orchestrator.ts:876  → startEventServer() tries to start Python server
event-server.py:36   → import fastapi (FAILS - module not found)
orchestrator.ts:134  → 10 second timeout triggers
orchestrator.ts:173  → catch returns null
orchestrator.ts:986  → checkDatabaseCapacity() runs
event-emitter.ts:87  → fetch() POST to port 9000 (no server)
event-emitter.ts:93  → .catch() swallows error silently
```

**Supporting Evidence**:
1. Python package check confirms `fastapi` is not installed
2. Database query confirms 0 public tables (migrations never ran)
3. Sandbox progress files show tasks running (orchestrator proceeded past DB setup)
4. No events appear in UI despite sandboxes being active

### How This Causes the Observed Behavior

1. Event server fails to start → `orchestratorUrl = null`
2. UI connects with WebSocket disabled → Cannot receive events
3. Events are emitted but dropped → No visibility in UI
4. Database operations may fail silently → DB remains empty
5. Orchestrator continues to create sandboxes → Work proceeds without DB

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct Python import test confirms missing `fastapi` package
- Database query confirms 0 tables
- Code analysis shows silent error handling patterns
- All symptoms align with the "event server not running" scenario

## Fix Approach (High-Level)

Two immediate fixes are needed:

1. **Install Python dependencies**: Create a `requirements.txt` or add installation step for `fastapi`, `uvicorn`, and `websockets` packages

2. **Add startup validation**: Before starting the orchestrator, verify that:
   - Python packages are installed
   - Event server can start successfully
   - Database connection is valid

Optional improvements:
- Make event server startup failure non-silent (log warning)
- Add health check before proceeding with DB operations
- Consider bundling the event server as a Node.js service instead of Python

## Diagnosis Determination

The root cause is confirmed: **Missing Python packages (`fastapi`, `uvicorn`) prevent the event server from starting, causing all orchestrator events to be silently dropped.** This is compounded by fire-and-forget error handling that makes the failure invisible.

The database not being created/seeded is a secondary effect - either the database operations are also failing silently, or they ran but their completion events were never visible to confirm success.

## Additional Context

The Alpha workflow documentation and code reference implementation issues #1522, #1526, #1530, #1533, and #1540 as completed, but the actual deployment environment lacks the Python dependencies required for the event server.

---
*Generated by Claude Debug Assistant*
*Tools Used: Python package check, PostgreSQL query, file reads, grep searches, code analysis*
