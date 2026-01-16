# Bug Fix: Supabase Database Events Not Appearing in UI + DB Setup Timing Issues

**Related Diagnosis**: #1529 (REQUIRED)
**Severity**: high
**Bug Type**: bug (timing/race condition + verification)
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Timing race condition where database events are emitted before WebSocket client connects; fire-and-forget pattern silently drops events. Secondary issue: no verification that database migrations were applied.
- **Fix Approach**: Multi-layer fix: (1) Event buffering with replay, (2) WebSocket connection confirmation, (3) Explicit DB verification, (4) Verbose error logging
- **Estimated Effort**: medium (6-8 hours)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Despite implementing #1522 (event emitter) and #1526 (WebSocket routing), database setup events are not appearing in the UI dashboard during orchestrator startup. Additionally, database tables may not be created if migrations fail silently.

The root cause is a timing race condition:
1. Orchestrator emits database events immediately after event server startup
2. UI WebSocket client may not be connected yet
3. `emitOrchestratorEvent()` uses fire-and-forget with silent error handling
4. Events are silently dropped if event server or WebSocket client isn't ready

Secondary issue: Database reset/migration functions don't verify that tables were actually created, so silent failures go undetected.

For full details, see diagnosis issue #1529.

### Solution Approaches Considered

#### Option 1: Multi-Layer Fix with Event Buffering + DB Verification ⭐ RECOMMENDED

**Description**: Implement three complementary fixes:
1. **Event Buffering**: Event server remembers events and replays them to newly connected WebSocket clients
2. **WebSocket Connection Confirmation**: Wait for UI to confirm connection before emitting critical events
3. **Database Verification**: Add explicit checks that tables exist after migrations
4. **Verbose Error Logging**: Replace silent error handling with detailed logging

**Pros**:
- Addresses root cause (timing race condition) systematically
- Adds visibility through verbose logging
- Verifies database operations actually succeed
- Non-blocking - all fixes use async patterns
- Minimal risk - additive changes only
- Comprehensive solution that handles multiple failure modes

**Cons**:
- Requires coordination between orchestrator and UI
- More complex than single-point fix
- Additional database queries for verification
- Slight latency added (verification checks)

**Risk Assessment**: medium - Multiple moving parts, but all well-isolated
**Complexity**: moderate - 3 coordinated subsystems

#### Option 2: Simple Event Buffering Only

**Description**: Only add event buffering to event server. When UI WebSocket connects, replay last 100 events.

**Pros**:
- Simple implementation (~50 lines)
- Solves timing race condition
- Low risk

**Cons**:
- Doesn't address silent database failures
- Still uses fire-and-forget HTTP POST (events may be lost)
- Doesn't improve error visibility
- Doesn't verify database operations
- Incomplete solution

**Why Not Chosen**: Doesn't fully address the root cause. The diagnosis identified TWO separate issues: (1) event timing and (2) database operation verification. This option only fixes one.

#### Option 3: Event Persistence with Database

**Description**: Store events in a persistent database and query recent events on UI startup.

**Pros**:
- Events never lost
- Full audit trail
- Can query by type/timestamp

**Cons**:
- Over-engineered for this use case
- Adds database overhead
- More complex deployment (new table)
- Significant development time
- Not necessary for in-memory events

**Why Not Chosen**: Adds complexity without clear benefit. Event buffering in memory is sufficient since events are temporary operational data, not critical user data. No business requirement for event persistence.

#### Option 4: Synchronous Event Emission with Blocking

**Description**: Make event emission synchronous and wait for server acknowledgment before proceeding.

**Pros**:
- Guarantees events are delivered
- No lost events

**Cons**:
- Blocks orchestrator operations (unacceptable)
- Turns critical path into blocking I/O
- Poor user experience (UI freezes waiting for events)
- Against design principles (fire-and-forget for side effects)

**Why Not Chosen**: Violates fundamental architecture where side effects (events) never block main operations. Database setup is already time-consuming; adding blocking event delivery makes it worse.

### Selected Solution: Multi-Layer Fix with Event Buffering + DB Verification

**Justification**:
This approach is the most comprehensive. It addresses both root causes identified in the diagnosis:
1. Event timing race condition (via buffering + connection confirmation)
2. Silent database failures (via verification + verbose logging)

The fix is surgical and additive - all changes are isolated and don't modify existing business logic. The three subsystems work independently so failures in one don't cascade.

**Technical Approach**:

**Layer 1: Event Buffering (Event Server)**
- Event server already buffers events in memory (deque with max 1000)
- When WebSocket client connects, replay initial batch of recent events (already implemented)
- The problem: WebSocket client might connect AFTER events are emitted but BEFORE replay
- Solution: Extend initial event batch replay logic to be more aggressive

**Layer 2: WebSocket Connection Confirmation (UI)**
- Add a "ready" message from UI to event server after connection
- Orchestrator waits for this confirmation before emitting critical DB events
- Non-blocking - orchestrator doesn't wait (uses async monitoring)
- Event server notifies orchestrator when UI is ready

**Layer 3: Database Verification (Orchestrator)**
- After each migration step, verify tables exist
- After seeding, verify seed data exists
- Add explicit checks using SQL queries
- Fail fast with clear error messages

**Layer 4: Verbose Error Logging (Orchestrator)**
- Replace all `catch() { }` with proper error handling
- Log all database operation failures
- Emit error events to UI for visibility

**Architecture Changes**:
- Event server: Add tracking of connected UI clients (already done)
- Event server: Add "ui_ready" message type
- Orchestrator: Add database verification queries after migrations
- Orchestrator: Replace silent error catches with logging
- No changes to existing event emission logic (backward compatible)

**Migration Strategy**: N/A - This is additive functionality with no breaking changes

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/database.ts` - Add verification checks and verbose logging
- `.ai/alpha/scripts/lib/orchestrator.ts` - Wait for UI ready signal, handle new verification logic
- `.ai/alpha/scripts/event-server.py` - Add UI ready signal tracking
- `.ai/alpha/scripts/ui/index.tsx` - Send ready signal after WebSocket connection

### New Files

- `.ai/alpha/scripts/lib/__tests__/db-verification.spec.ts` - Test database verification logic
- `.ai/alpha/scripts/lib/__tests__/event-replay.spec.ts` - Test event buffering/replay

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Database Verification Utilities

Add verification functions to check that database operations succeeded.

- Create function `verifyTablesExist(dbUrl: string, tableNames: string[]): Promise<boolean>`
  - Execute SQL query: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`
  - Return true if all expected tables exist
  - Log table count for debugging

- Create function `verifySeededData(dbUrl: string): Promise<boolean>`
  - Execute SQL query: `SELECT COUNT(*) FROM payload.users`
  - Return true if at least one user exists
  - Log user count

- Add these to `database.ts` after `isDatabaseSeeded()` function

**Why this step first**: Foundation for all verification - must exist before integration points use it

#### Step 2: Integrate Verification into Database Operations

Modify database functions to call verification after operations complete.

- Modify `resetSandboxDatabase()`:
  - After `supabase db push` completes (line 192), call `verifyTablesExist()`
  - If verification fails, log error and emit `db_verify_failed` event
  - Don't block - continue anyway but log clearly

- Modify `seedSandboxDatabase()`:
  - After seeding completes (line 275), call `verifySeededData()`
  - Log verification result (successful or warns if no data)
  - Emit `db_verify` event with user count from verification

- Modify all `catch()` blocks:
  - Replace `catch { }` with `catch (err) { error(...) }`
  - Log full error details including message and stack
  - Emit `db_operation_failed` event with error message

**Why this step second**: Connects verification to actual operations

#### Step 3: Add UI Ready Signal Support to Event Server

Modify event server to track when UI is ready.

- In `event-server.py`, add new state variable `ui_ready` (boolean, default false)

- Add new WebSocket message handler for `"type": "ui_ready"`:
  ```python
  case "ui_ready":
      ui_ready = True
      # Broadcast confirmation
      await broadcast({"type": "ui_ready_confirmed", "timestamp": ...})
  ```

- Add endpoint `GET /api/ui-status` that returns `{"ui_ready": bool, "connected_clients": int}`

- Modify initial event batch reply to include `ui_ready` status

**Why this step third**: Infrastructure for UI-to-server communication

#### Step 4: Update Orchestrator to Wait for UI Ready

Modify orchestrator to coordinate with UI before emitting critical events.

- In `orchestrator.ts`, after starting event server (line 832):
  - Add new function `waitForUIReady(maxWait: number = 30000): Promise<boolean>`
  - Poll `http://localhost:9000/api/ui-status` every 500ms
  - Return true if UI becomes ready within maxWait
  - Return false if timeout (don't block orchestration)

- Call `waitForUIReady()` after event server starts:
  - If successful, log "UI ready, starting database operations"
  - If timeout, log warning "UI not ready, proceeding anyway" (non-blocking)

- This prevents events from being emitted before UI connects

**Why this step fourth**: Coordinates timing between UI and orchestrator

#### Step 5: Add Verification Calls to Database Operations

Update database operation error handling with detailed logging.

- In `database.ts`, modify `resetSandboxDatabase()`:
  - Replace line 203 `catch { warn(...) }` with full error logging
  - Add try-catch around migration verification call
  - Log migration verification results

- In `database.ts`, modify `seedSandboxDatabase()`:
  - Replace line 310 `catch (err)` with detailed error extraction
  - Add verification check after seed completes
  - Log seed verification results (user count)

- In `database.ts`, modify `isDatabaseSeeded()`:
  - Add explicit error handling instead of silent catch
  - Log any errors that occur during seeded check

**Why this step fifth**: Adds error visibility and verification

#### Step 6: Add UI Ready Signal Emission

Update UI to emit ready signal after WebSocket connects.

- In `index.tsx`, in the `useEventStream` hook or new hook:
  - After WebSocket connects (in `ws.onopen`), send message: `{"type": "ui_ready"}`
  - Wait for confirmation message `type: "ui_ready_confirmed"` (optional, for logging)
  - Log "UI ready signal sent to event server"

- Add this message send in `useEventStream` after connection confirms

**Why this step sixth**: Completes the coordination loop

#### Step 7: Add Unit Tests

Add comprehensive unit tests for new verification logic.

- Create `.ai/alpha/scripts/lib/__tests__/db-verification.spec.ts`:
  - Test `verifyTablesExist()` with mock database connection
  - Test successful verification (returns true)
  - Test failed verification (returns false)
  - Test connection error handling
  - Test SQL injection prevention

- Create tests for error logging:
  - Test that database errors are logged (not silent)
  - Test that verification failures are logged
  - Test event emission on errors

- Add integration test in `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts`:
  - Test `waitForUIReady()` success path
  - Test `waitForUIReady()` timeout path
  - Test that database operations wait for UI ready (or timeout gracefully)

**Why this step seventh**: Ensures reliability and prevents regressions

#### Step 8: Manual Testing and Validation

Verify the complete event flow works end-to-end.

- Run orchestrator with UI enabled: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Monitor:
  - Event server starts and listens on port 9000
  - UI connects and sends ready signal (~1 second)
  - Database operations begin immediately after
  - All events appear in UI in correct order
  - Database tables are created in Supabase
  - Verification logs appear (table count, user count)

- Check logs for verbose database operation messages

**Why this step last**: Final verification before release

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `verifyTablesExist()` returns true when tables exist
- ✅ `verifyTablesExist()` returns false when tables missing
- ✅ `verifySeededData()` counts users correctly
- ✅ `verifySeededData()` returns false when no data
- ✅ Database errors are logged (not silent)
- ✅ Event emitter still works if verification fails
- ✅ `waitForUIReady()` succeeds when UI connects
- ✅ `waitForUIReady()` times out gracefully
- ✅ Regression test: Event server still buffers events

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/db-verification.spec.ts` - Database verification logic
- `.ai/alpha/scripts/lib/__tests__/event-server-ui-ready.spec.ts` - UI ready signal handling
- Update `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - Orchestrator coordination

### Integration Tests

Integration tests for event flow:
- ✅ Database operations emit all expected events
- ✅ Verification failures are logged (don't block)
- ✅ UI receives database events in correct order
- ✅ UI receives verification results
- ✅ Event server buffers events for late-connecting UI
- ✅ Event server replays events to UI

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/db-events-integration.spec.ts` - End-to-end event flow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe event server starts successfully
- [ ] Observe UI connects within 1-2 seconds
- [ ] Observe UI sends ready signal (check event server logs)
- [ ] Verify database events appear in "Recent Events" section in order:
  1. "Checking database capacity..."
  2. "Database capacity OK: XMB / 500MB"
  3. "Resetting sandbox database..."
  4. "Database schema reset complete"
  5. "Verifying database tables..."
  6. "Verified: N table(s) created"
  7. "Running Payload migrations..."
  8. "Payload migrations complete"
  9. "Verifying seeded data..."
  10. "Running Payload seeding..."
  11. "Payload seeding complete"
  12. "Verified: N user(s) seeded"
- [ ] Verify all events have correct icons and colors
- [ ] Check console logs for verbose database operation messages
- [ ] Kill event server mid-run, verify orchestrator continues normally
- [ ] Restart event server, verify new events appear
- [ ] Verify in Supabase console that tables were created
- [ ] Verify in Supabase console that seed data exists
- [ ] Verify no new console errors or warnings
- [ ] Verify no performance degradation (events are non-blocking)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Database verification adds latency**:
   - **Likelihood**: medium (SQL queries are fast)
   - **Impact**: low (additional queries are <100ms)
   - **Mitigation**: Run verification in parallel with other operations; don't block on results

2. **WebSocket ready signal timing is unreliable**:
   - **Likelihood**: low (WebSocket connection is reliable)
   - **Impact**: medium (database operations may proceed without UI ready)
   - **Mitigation**: Timeout gracefully after 30 seconds; don't block orchestration

3. **Event server port 9000 unavailable**:
   - **Likelihood**: low (port check already exists)
   - **Impact**: low (graceful fallback)
   - **Mitigation**: Existing code already handles this (kills existing process)

4. **Verification queries fail (tables actually don't exist)**:
   - **Likelihood**: medium (if migrations failed)
   - **Impact**: medium (users won't know DB is broken)
   - **Mitigation**: Log clear error messages with stack trace

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to `database.ts` (remove verification calls and logging)
2. Revert changes to `orchestrator.ts` (remove UI ready wait logic)
3. Revert changes to `event-server.py` (remove UI ready signal handling)
4. Revert changes to `index.tsx` (remove UI ready emission)
5. Orchestrator returns to original behavior (no verification, no event timing coordination)
6. Database operations continue as before (with silent failures if migrations fail)

**Monitoring**:
- Monitor event server logs for verification failures
- Monitor for WebSocket connection failures
- Track database operation success/failure rates
- Alert if verification shows tables don't exist after migration

## Performance Impact

**Expected Impact**: minimal (<1 second added to startup)

- Verification queries: ~50ms each (2 queries = ~100ms)
- WebSocket ready signal: instant (already happening)
- Event emission: unchanged (fire-and-forget)
- Event buffering: instant (in-memory)

Total overhead: ~100ms + network latency, negligible compared to database migrations (30-60 seconds).

**Performance Testing**:
- Measure orchestrator startup time before/after fix (should be identical or faster due to better error detection)
- Verify no additional memory usage from event buffering
- Confirm verification queries don't block other operations

## Security Considerations

**Security Impact**: minimal

- No new external network calls
- Verification queries are read-only (no data modification)
- WebSocket messages contain no sensitive data
- Event server already running locally (no new attack surface)

**Security Checklist**:
- ✅ No external network calls
- ✅ No sensitive data in events or verification
- ✅ SQL queries use parameterized queries (prevent injection)
- ✅ Event server already hardened (existing code)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe UI dashboard - no events appear during first 5 minutes
# Check Supabase console - tables may not be created
# Logs show "Database reset complete" but no verification
```

**Expected Result**: No database events in UI, possible missing tables in Supabase

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests
pnpm --filter @ai/alpha test .ai/alpha/scripts/lib/__tests__/db-verification.spec.ts
pnpm --filter @ai/alpha test .ai/alpha/scripts/lib/__tests__/event-server-ui-ready.spec.ts

# Build
pnpm build

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Watch UI dashboard - events should appear during database setup
# Check console logs for verification messages
```

**Expected Result**: All commands succeed, database events appear in UI, verification logs visible, tables exist in Supabase

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify orchestrator works without event server
pkill -f event-server.py
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Should complete database setup without errors (graceful degradation)
```

## Dependencies

### New Dependencies

**No new dependencies required**

- Uses existing Node.js features (async/await, fetch)
- Uses existing Python features (asyncio)
- Uses existing Supabase client connection
- No new npm packages needed

## Database Changes

**No database changes required**

This fix only affects monitoring and verification of existing database operations, not the schema itself.

## Deployment Considerations

**Deployment Risk**: low

This is additive functionality with graceful degradation:
- If event server fails, orchestrator continues
- If verification fails, orchestrator continues (just logs issue)
- If UI doesn't send ready signal, orchestrator proceeds after timeout
- All changes are backward compatible

**Special deployment steps**:
- None required - all changes are local to orchestrator scripts

**Feature flags needed**: no

**Backwards compatibility**: fully maintained (orchestrator works with or without all new features)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Database events appear in UI during orchestrator startup
- [ ] Events appear in correct order with correct icons/colors
- [ ] Console logs show verification results (table counts, user counts)
- [ ] Database tables exist in Supabase after orchestration
- [ ] Seed data exists in Supabase after orchestration
- [ ] No database operation failures are silent (all logged)
- [ ] Orchestrator proceeds gracefully if UI doesn't send ready signal
- [ ] Orchestrator proceeds gracefully if event server is unavailable
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing checklist complete
- [ ] Zero regressions from existing functionality
- [ ] Code review approved

## Notes

**Design Decisions**:

1. **Non-blocking event emission**: Events are sent via fire-and-forget HTTP POST. Verification failures don't block orchestration. This is intentional - database setup is already time-consuming and critical operations shouldn't wait on side effects.

2. **Event buffering approach**: Rather than persisting events to disk/DB, we buffer in memory. Events are temporary operational data and don't need to survive process restarts. The memory buffer (deque with max 1000) is sufficient.

3. **WebSocket ready signal**: The UI sends a single "ready" signal after connecting. This is lightweight and doesn't add complexity to the WebSocket protocol. The orchestrator checks this signal but doesn't block on it (timeout after 30s).

4. **Graceful degradation**: All three layers (buffering, coordination, verification) work independently. If one fails, others still function. This makes the system resilient.

**Future Enhancements**:
1. Event persistence with replay from disk (if operational audit trail needed)
2. Real-time dashboard showing database operation progress
3. Automatic retry of failed migrations (with exponential backoff)
4. Alert system for database setup failures
5. Performance profiling of database operations

**Related Issues**:
- #1522: Event emitter implementation (completed)
- #1526: WebSocket routing (completed)
- #1521: Original diagnosis for missing events
- #1525: WebSocket routing diagnosis

**Key Files**:
- `.ai/alpha/scripts/lib/event-emitter.ts` - Fire-and-forget event emission
- `.ai/alpha/scripts/lib/database.ts` - Database operations with verification
- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration flow
- `.ai/alpha/scripts/event-server.py` - Event server with buffering
- `.ai/alpha/scripts/ui/index.tsx` - UI event handling and ready signal

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1529*
