# Bug Fix: Orchestrator Database Setup Events Missing from UI

**Plan Issue**: #1522
**Related Diagnosis**: #1521
**Severity**: medium
**Bug Type**: bug (feature gap)
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Orchestrator lacks event emitter to send database operations to event server; console logging is suppressed in UI mode
- **Fix Approach**: Create lightweight event emitter utility and integrate it into database operations
- **Estimated Effort**: small (2-3 hours)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The orchestrator performs critical database setup (capacity check, reset, migrations, seeding) but provides zero visual feedback in the UI dashboard. The logger suppresses output in UI mode, and there's no alternative pathway to communicate events to the WebSocket-based event streaming system.

For full details, see diagnosis issue #1521.

### Solution Approaches Considered

#### Option 1: Lightweight Event Emitter with HTTP POST ⭐ RECOMMENDED

**Description**: Create a minimal event emitter utility that sends HTTP POST requests to the local event server. Integrate it into database.ts and other orchestrator modules to emit events for key operations alongside existing log statements.

**Pros**:
- Minimal code changes (single new file + integration points)
- Reuses existing event server infrastructure
- Non-blocking - uses fire-and-forget HTTP POSTs
- Easy to test - can mock HTTP calls
- Graceful degradation - if event server is down, orchestrator continues
- Aligns with existing sandbox event architecture

**Cons**:
- Requires orchestrator URL to be available before database operations
- Adds HTTP dependency (but fetch is native in Node.js 18+)
- Slight overhead for HTTP calls (but non-blocking and minimal)

**Risk Assessment**: low - HTTP POST is simple, non-critical path, graceful failure handling

**Complexity**: simple - ~50 lines of new code, straightforward integration

#### Option 2: Direct UI State Updates via Shared Progress File

**Description**: Write database operation events directly to a special orchestrator progress file that the UI poller reads alongside sandbox progress files.

**Pros**:
- No network calls required
- Fits existing file-based polling pattern
- No dependency on event server being started

**Cons**:
- Polling delay (5 second intervals) means delayed feedback
- Doesn't leverage real-time WebSocket streaming
- Creates parallel system to event streaming (architectural inconsistency)
- UI needs new logic to read orchestrator-specific progress file
- More complex UI changes required

**Why Not Chosen**: Introduces architectural inconsistency. The event streaming system is designed for real-time updates; using file polling for orchestrator events undermines this design and creates a slower, less responsive user experience.

#### Option 3: Console Output Capture and Forwarding

**Description**: Capture suppressed console.log output and forward it to the event server post-facto.

**Pros**:
- Minimal changes to existing logging code

**Cons**:
- Complex implementation (requires console patching or stream interception)
- Introduces fragility (console capture can break with Node.js updates)
- Still requires event emitter mechanism anyway
- Doesn't solve the core problem (no event emission)

**Why Not Chosen**: Over-engineered solution that adds complexity without clear benefits. Option 1 is simpler and more maintainable.

### Selected Solution: Lightweight Event Emitter with HTTP POST

**Justification**: This approach reuses existing infrastructure (event server), maintains architectural consistency (all events flow through the same system), is simple to implement, and provides real-time feedback. The graceful degradation ensures the orchestrator never blocks on event emission.

**Technical Approach**:
- Create `event-emitter.ts` with single async function `emitOrchestratorEvent()`
- Use native `fetch()` for HTTP POST (available in Node.js 18+)
- Fire-and-forget pattern (don't await, catch errors silently)
- Use special sandbox_id "orchestrator" to distinguish from sandbox events
- Integrate emission calls into database.ts alongside existing log statements
- Add new event types to UI EventLog component

**Architecture Changes**:
- No breaking changes to existing architecture
- Extends event streaming system to support orchestrator-side events
- UI EventLog component enhanced to handle new event types

**Migration Strategy**: N/A - This is additive functionality with no backward compatibility concerns.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/event-emitter.ts` - New event emitter utility
- `.ai/alpha/scripts/lib/database.ts` - Integrate event emission for DB operations
- `.ai/alpha/scripts/lib/sandbox.ts` - Integrate event emission for sandbox creation (optional enhancement)
- `.ai/alpha/scripts/ui/types.ts` - Add new orchestrator event types
- `.ai/alpha/scripts/ui/components/EventLog.tsx` - Add icons/colors for new event types

### New Files

- `.ai/alpha/scripts/lib/event-emitter.ts` - HTTP-based event emitter for orchestrator operations

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Event Emitter Utility

Create the event emitter utility with HTTP POST to event server.

- Create `.ai/alpha/scripts/lib/event-emitter.ts`
- Implement `emitOrchestratorEvent()` function with:
  - HTTP POST to `http://localhost:${EVENT_SERVER_PORT}/api/events`
  - Fire-and-forget pattern (don't block on completion)
  - Silent error handling (orchestrator continues if event server is down)
  - Special `sandbox_id: "orchestrator"` to distinguish from sandbox events
  - Timestamp generation for events
- Import EVENT_SERVER_PORT from config
- Add type definitions for event structure

**Why this step first**: Foundation for all event emission - must be in place before integration.

#### Step 2: Integrate Events into Database Operations

Add event emission calls to all database operations in `database.ts`.

- Import `emitOrchestratorEvent` in `database.ts`
- Add event emission for `checkDatabaseCapacity()`:
  - Start event: "Checking database capacity..."
  - Success event: "Database capacity OK: XMB / 500MB"
  - Warning event: "Database near capacity: XMB / 500MB"
- Add event emission for `resetSandboxDatabase()`:
  - Start event: "Resetting sandbox database..."
  - Success event: "Database schema reset complete"
  - Migration event: "Applying base migrations..."
  - Migration success: "Base migrations applied"
- Add event emission for `seedSandboxDatabase()`:
  - Start event: "Running Payload migrations..."
  - Migration success: "Payload migrations complete"
  - Seed start: "Running Payload seeding..."
  - Seed success: "Payload seeding complete"
  - Verification: "Verified: N user(s) seeded"
- Ensure events are emitted alongside existing `log()` calls

**Why this step second**: Core functionality - database events are the primary use case.

#### Step 3: Add New Event Types to UI Types

Extend UI type definitions to support orchestrator event types.

- Add to `OrchestratorEventType` in `.ai/alpha/scripts/ui/types.ts`:
  - `db_capacity_check` - Database capacity check start
  - `db_capacity_ok` - Capacity within limits
  - `db_capacity_warning` - Nearing capacity limit
  - `db_reset_start` - Database reset initiated
  - `db_reset_complete` - Database reset finished
  - `db_migration_start` - Migration application started
  - `db_migration_complete` - Migrations applied
  - `db_seed_start` - Database seeding started
  - `db_seed_complete` - Seeding finished
  - `db_verify` - Verification of seeded data

**Why this step third**: UI types must be in place before updating event display components.

#### Step 4: Enhance EventLog Component with New Event Types

Add visual styling for new database event types.

- Update `EVENT_ICONS` in `EventLog.tsx`:
  - `db_capacity_check`: "📊"
  - `db_capacity_ok`: "✅"
  - `db_capacity_warning`: "⚠️"
  - `db_reset_start`: "🔄"
  - `db_reset_complete`: "✅"
  - `db_migration_start`: "📦"
  - `db_migration_complete`: "✅"
  - `db_seed_start`: "🌱"
  - `db_seed_complete`: "✅"
  - `db_verify`: "🔍"
- Update `EVENT_COLORS` in `EventLog.tsx`:
  - Capacity events: "cyan"
  - Reset events: "yellow" → "green"
  - Migration events: "cyan"
  - Seed events: "green"
  - Verification: "cyan"

**Why this step fourth**: Visual feedback for users - makes events recognizable and meaningful.

#### Step 5: Add Unit Tests

Add comprehensive unit tests for the event emitter.

- Create `.ai/alpha/scripts/lib/__tests__/event-emitter.spec.ts`
- Test successful event emission (mock fetch)
- Test graceful failure when event server is down
- Test event structure (sandbox_id, timestamp, event_type, message)
- Test concurrent event emission (multiple calls in quick succession)
- Verify no errors thrown on network failures

**Why this step fifth**: Ensures reliability and prevents regressions.

#### Step 6: Update Documentation

Document the new event emission capability.

- Update `.ai/alpha/docs/alpha-implementation-system.md`:
  - Add section on "Orchestrator Event Streaming"
  - Document event types and their meanings
  - Explain the event flow: orchestrator → event-server.py → WebSocket → UI
- Update inline code comments in `event-emitter.ts`
- Document graceful degradation behavior

**Why this step sixth**: Helps future maintainers understand the system.

#### Step 7: Manual Testing and Validation

Verify the complete event flow works end-to-end.

- Run orchestrator with UI enabled
- Observe events appearing in "Recent Events" during database setup
- Verify event timing and order
- Test with event server not running (graceful degradation)
- Confirm no performance impact or blocking behavior
- Check that all validation commands pass

**Why this step last**: Final verification before considering the fix complete.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Event emitter sends correct HTTP POST structure
- ✅ Event emitter handles fetch failures gracefully
- ✅ Event emitter doesn't throw errors on network issues
- ✅ Event structure includes all required fields (sandbox_id, event_type, timestamp, message)
- ✅ Concurrent event emission works correctly
- ✅ Regression test: Database operations complete even if event server is down

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/event-emitter.spec.ts` - Event emitter unit tests

### Integration Tests

Integration tests for event flow:
- ✅ Database operations emit events to event server
- ✅ Event server receives orchestrator events
- ✅ UI WebSocket client receives orchestrator events
- ✅ Events appear in EventLog component

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/database-event-integration.spec.ts` - End-to-end event flow testing

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator with UI enabled: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe "Recent Events" section during database initialization
- [ ] Verify events appear in correct order:
  1. "Checking database capacity..."
  2. "Database capacity OK: XMB / 500MB"
  3. "Resetting sandbox database..."
  4. "Database schema reset complete"
  5. "Applying base migrations..."
  6. "Base migrations applied"
  7. "Running Payload migrations..."
  8. "Payload migrations complete"
  9. "Running Payload seeding..."
  10. "Payload seeding complete"
  11. "Verified: N user(s) seeded"
- [ ] Verify events have correct icons and colors
- [ ] Kill event server mid-orchestration, verify orchestrator continues normally
- [ ] Restart event server, verify new events appear
- [ ] Check for any console errors or warnings
- [ ] Verify no performance degradation (events are non-blocking)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Event server not started before database operations**:
   - **Likelihood**: low
   - **Impact**: medium (no events displayed)
   - **Mitigation**: Event emitter has graceful error handling; orchestrator continues normally even if events fail

2. **Performance impact from HTTP calls**:
   - **Likelihood**: low
   - **Impact**: low (minimal delay)
   - **Mitigation**: Fire-and-forget pattern means no blocking; HTTP POST is fast (<10ms locally)

3. **Event spam overwhelming UI**:
   - **Likelihood**: low
   - **Impact**: low (cluttered UI)
   - **Mitigation**: Database operations are infrequent (only at startup); EventLog already has max event limits

**Rollback Plan**:

If this fix causes issues:
1. Remove event emission calls from `database.ts` (comment out `emitOrchestratorEvent()` lines)
2. Revert EventLog.tsx changes (remove new event types)
3. Delete `event-emitter.ts` file
4. Orchestrator returns to original behavior (no database events in UI)

**Monitoring**:
- Watch for any orchestrator startup delays (should be <5ms per event)
- Monitor event server logs for unusual traffic patterns
- Check for WebSocket connection issues in UI

## Performance Impact

**Expected Impact**: none (< 5ms total for all database events)

HTTP POST to localhost event server is extremely fast (<2ms per call). With ~10 database events at startup, total overhead is <20ms, which is negligible compared to database operations themselves (which take seconds to minutes).

**Performance Testing**:
- Measure orchestrator startup time before/after fix (should be identical)
- Verify no blocking behavior during event emission
- Confirm fire-and-forget pattern works as expected

## Security Considerations

**Security Impact**: none

Event emitter only communicates with local event server on localhost:9000. No external network access, no user data in events (only status messages).

**Security Checklist**:
- ✅ No external network calls
- ✅ No sensitive data in event messages
- ✅ Event server already running locally (no new attack surface)
- ✅ Graceful failure prevents denial-of-service scenarios

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe UI dashboard - no events during database setup
# (Events section will be empty during DB operations)
```

**Expected Result**: No database events visible in "Recent Events" section during startup.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm --filter @ai/alpha test .ai/alpha/scripts/lib/__tests__/event-emitter.spec.ts

# Build (if applicable)
pnpm build

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Watch UI dashboard - events should appear during database setup
```

**Expected Result**: All commands succeed, database events appear in UI dashboard in real-time.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify orchestrator still works without event server
# (kill event-server.py before starting orchestrator)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Should complete database setup without errors
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

- Uses native Node.js 18+ `fetch()` API
- Reuses existing EVENT_SERVER_PORT from config
- All HTTP handling is built-in

## Database Changes

**No database changes required**

This fix only affects event streaming, not database schema or data.

## Deployment Considerations

**Deployment Risk**: low

This is additive functionality with graceful degradation. If anything breaks, the orchestrator continues working without events.

**Special deployment steps**:
- None required - changes are local to orchestrator scripts

**Feature flags needed**: no

**Backwards compatibility**: maintained (orchestrator works with or without event server)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Database events appear in UI during orchestration startup
- [ ] Events have correct icons, colors, and messages
- [ ] Orchestrator continues normally if event server is down
- [ ] No performance degradation observed
- [ ] All unit tests pass
- [ ] Manual testing checklist complete
- [ ] Documentation updated
- [ ] Code review approved

## Notes

**Design Decision**: Fire-and-forget pattern for event emission ensures the orchestrator never blocks on event delivery. This is critical because database operations are time-sensitive, and we cannot afford delays or failures due to event server issues.

**Future Enhancement Opportunities**:
1. Extend event emission to sandbox creation/destruction events
2. Add orchestrator health check events
3. Include migration sync events for feature-level database changes
4. Add event buffering for offline resilience (if event server temporarily unavailable)

**Related Issues**:
- Event streaming architecture: `.ai/alpha/scripts/event-server.py`
- UI event display: `.ai/alpha/scripts/ui/components/EventLog.tsx`
- Database operations: `.ai/alpha/scripts/lib/database.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1521*
