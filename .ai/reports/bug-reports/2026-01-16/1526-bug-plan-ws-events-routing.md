# Bug Fix: WebSocket DB Events Not Displayed in UI EventLog

**Issue**: #1526
**Related Diagnosis**: #1525 (REQUIRED)
**Severity**: medium
**Bug Type**: bug (incomplete feature)
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: WebSocket event handler filters out orchestrator events and doesn't route them to EventLog
- **Fix Approach**: Add orchestrator event conversion and route to EventLog state
- **Estimated Effort**: small (2-3 hours)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Issue #1522 added event emission from the orchestrator but didn't complete the UI integration. WebSocket events are received but filtered out by `handleWebSocketEvent()` (line 134 in `index.tsx`) which only accepts `post_tool_use` events. Additionally, this handler only updates `realtimeOutput` for sandbox columns, not `state.events` which feeds the EventLog component.

For full details, see diagnosis issue #1525.

### Solution Approaches Considered

#### Option 1: Add Orchestrator Event Converter to UI State ⭐ RECOMMENDED

**Description**: Create a separate state for orchestrator WebSocket events that converts them to `OrchestratorEvent` format and merges them into the events array displayed by EventLog. This maintains architectural separation between sandbox tool events (realtimeOutput) and orchestrator operation events (EventLog).

**Pros**:
- Clean separation of concerns (sandbox events vs orchestrator events)
- Maintains existing WebSocket event flow unchanged for sandbox events
- Type-safe conversion from `WebSocketEvent` to `OrchestratorEvent`
- Easy to test independently
- No breaking changes to existing components
- Follows React best practices with proper state management

**Cons**:
- Adds another state variable to manage
- Slight memory overhead for duplicate event storage (negligible - max 100 events)
- Requires mapping logic to convert event types

**Risk Assessment**: low - Additive changes only, no modifications to existing event flows

**Complexity**: simple - ~100 lines of new code, straightforward state management and mapping logic

#### Option 2: Modify handleWebSocketEvent to Route All Events

**Description**: Change `handleWebSocketEvent` to process both tool events (for realtimeOutput) and orchestrator events (for state.events), eliminating the filter at line 134 and adding conditional logic to route events to appropriate destinations.

**Pros**:
- Single event handler for all WebSocket events
- No additional state variables needed
- Centralized event processing logic

**Cons**:
- Mixes concerns (sandbox real-time output + orchestrator events)
- More complex conditional logic in one handler
- Harder to test independently
- Increases coupling between different event types
- Risk of breaking existing sandbox event handling

**Why Not Chosen**: Violates separation of concerns. The current architecture cleanly separates sandbox tool events from orchestrator events. Mixing them in one handler creates unnecessary coupling and makes the code harder to understand and maintain.

#### Option 3: Modify useProgressPoller to Inject WebSocket Events

**Description**: Pass WebSocket events as a prop to `useProgressPoller` and merge them with progress-file-generated events inside the hook.

**Pros**:
- Events unified at the source (useProgressPoller)
- Single source of truth for all events

**Cons**:
- Breaks separation between file-based polling and WebSocket streaming
- useProgressPoller becomes dependent on WebSocket infrastructure
- Harder to test (requires mocking WebSocket events in poller tests)
- Architectural inconsistency - poller should only handle file-based state
- More invasive changes to well-tested code

**Why Not Chosen**: Over-engineered solution that creates architectural inconsistency. The progress poller should remain focused on file-based state polling. WebSocket events are a separate real-time channel and should be managed separately.

### Selected Solution: Add Orchestrator Event Converter to UI State

**Justification**: This approach maintains architectural clarity by keeping sandbox events and orchestrator events in separate channels while merging them at the display layer. It's additive (no risk to existing functionality), simple to implement, and easy to test. The separation of concerns makes the code more maintainable long-term.

**Technical Approach**:
- Add new state variable `orchestratorEvents` in OrchestratorApp component
- Create `handleOrchestratorEvent` callback to convert `WebSocketEvent` to `OrchestratorEvent`
- Add event type mapping for db_* events to orchestrator events
- Merge orchestratorEvents with state.events when passing to EventLog
- Keep existing `handleWebSocketEvent` unchanged for sandbox tool events

**Architecture Changes**:
- No breaking changes to existing architecture
- Extends the existing dual-channel approach (file polling + WebSocket streaming)
- Orchestrator events flow: WebSocket → handleOrchestratorEvent → orchestratorEvents state → merged with state.events → EventLog

**Migration Strategy**: N/A - This is additive functionality with no backward compatibility concerns.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/index.tsx` - Add orchestrator event handler and state
- `.ai/alpha/scripts/ui/types.ts` - Add helper type for event type mapping (if needed)

### New Files

None required - all changes are additions to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Orchestrator Event State and Handler

Add state management for orchestrator WebSocket events in the OrchestratorApp component.

- Add new state variable `orchestratorEvents` in OrchestratorApp (similar to `realtimeOutput` state)
- Create `handleOrchestratorEvent` callback that:
  - Checks if `event.sandbox_id === "orchestrator"` (identifies orchestrator events)
  - Maps `WebSocketEvent` format to `OrchestratorEvent` format
  - Converts WebSocket `event_type` to `OrchestratorEventType` (e.g., `db_reset_start` → `db_reset_start`)
  - Generates unique event ID and timestamp
  - Adds event to `orchestratorEvents` state (keeping last 100)
- Register `handleOrchestratorEvent` as a second callback on `useEventStream` using onEvent option

**Why this step first**: Foundation for capturing orchestrator events - must be in place before modifying event display.

#### Step 2: Merge Orchestrator Events into EventLog Display

Combine orchestrator events with progress-poller events for display.

- In OrchestratorApp, create `enhancedState` memo that merges events:
  - Take `state.events` from useProgressPoller (existing sandbox state events)
  - Merge with `orchestratorEvents` from WebSocket
  - Sort by timestamp (newest first)
  - Limit to MAX_DISPLAY_EVENTS (already defined constant)
- Pass `enhancedState` to OrchestratorUI component instead of raw `state`
- No changes needed to EventLog component (already handles `OrchestratorEvent[]`)

**Why this step second**: Connects the new orchestrator events to the display layer.

#### Step 3: Add Event Type Mapping Utility

Create a helper function to safely map WebSocket event types to OrchestratorEventTypes.

- Add `mapWebSocketToOrchestratorEventType()` function in index.tsx
- Map known event types (db_capacity_check, db_reset_start, etc.)
- Return event_type as-is if it matches a valid `OrchestratorEventType`
- Log warning and return `error` type for unknown event types
- Use this function in `handleOrchestratorEvent`

**Why this step third**: Ensures type safety and prevents runtime errors from unexpected event types.

#### Step 4: Handle Special Case - Sandbox Tool Events with orchestrator sandbox_id

Update the event routing logic to prevent conflicts.

- Modify `handleWebSocketEvent` to skip events where `sandbox_id === "orchestrator"`
- These events should only be processed by `handleOrchestratorEvent`
- Add comment explaining the routing logic

**Why this step fourth**: Ensures clean separation - orchestrator events never reach sandbox tool handler.

#### Step 5: Add Unit Tests

Add comprehensive tests for the new event routing logic.

- Create `.ai/alpha/scripts/ui/__tests__/orchestrator-events.spec.tsx`
- Test `handleOrchestratorEvent` conversion logic:
  - Converts WebSocketEvent to OrchestratorEvent correctly
  - Maps event types properly
  - Generates unique IDs and timestamps
  - Limits event array to max size
- Test event merging logic:
  - Merges orchestrator and poller events
  - Sorts by timestamp
  - Handles empty arrays
- Mock useEventStream and verify events are routed correctly

**Why this step fifth**: Ensures reliability and prevents regressions.

#### Step 6: Manual Testing and Validation

Verify the complete event flow works end-to-end.

- Run orchestrator with UI: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Observe "Recent Events" during database setup (first 2-5 minutes)
- Verify all db_* events appear with correct icons and colors
- Verify events are in correct chronological order
- Verify sandbox events still appear correctly after DB events
- Check that all validation commands pass

**Why this step last**: Final verification before considering the fix complete.

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ `handleOrchestratorEvent` converts WebSocketEvent to OrchestratorEvent
- ✅ Event type mapping works for all db_* event types
- ✅ Unknown event types are handled gracefully
- ✅ Events are limited to max array size (last 100)
- ✅ Event merging produces correct sorted order
- ✅ Orchestrator events don't reach sandbox tool handler
- ✅ Regression test: Sandbox tool events still work correctly

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/orchestrator-events.spec.tsx` - Orchestrator event routing tests

### Integration Tests

Integration tests for event flow:
- ✅ Orchestrator emits events with sandbox_id="orchestrator"
- ✅ Event server receives and broadcasts orchestrator events
- ✅ UI WebSocket client receives orchestrator events
- ✅ handleOrchestratorEvent is called for orchestrator events
- ✅ Events appear in EventLog component

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/event-flow-integration.spec.tsx` - End-to-end event flow testing

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
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
- [ ] Verify events have correct icons (📊, 🔄, ✅, 🌱, etc.)
- [ ] Verify events have correct colors (cyan, yellow, green)
- [ ] Verify sandbox events appear correctly after DB events (task_start, task_complete)
- [ ] Verify events are sorted by timestamp (newest first)
- [ ] Verify no duplicate events
- [ ] Verify no console errors or warnings
- [ ] Kill event server mid-run, verify orchestrator continues normally
- [ ] Restart event server, verify new events appear

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Event merge logic causes performance issues**:
   - **Likelihood**: low
   - **Impact**: low (slight UI lag)
   - **Mitigation**: Events are limited to 100 max; merge happens in useMemo with proper dependencies; React handles this efficiently

2. **Orchestrator events override sandbox events**:
   - **Likelihood**: low
   - **Impact**: medium (missing sandbox events)
   - **Mitigation**: Merge logic preserves all events from both sources; tests verify both event types appear

3. **WebSocket event type mapping breaks with new event types**:
   - **Likelihood**: low
   - **Impact**: low (unmapped events logged as errors)
   - **Mitigation**: Mapping function logs warnings for unknown types; defaults to `error` type so events still display

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `.ai/alpha/scripts/ui/index.tsx` (remove orchestrator event handler)
2. UI returns to original behavior (no orchestrator events in EventLog)
3. Database operations still work normally (events just not visible)

**Monitoring**:
- Watch for any UI performance degradation during orchestrator startup
- Monitor for duplicate events in EventLog
- Check for missing sandbox events after merge changes

## Performance Impact

**Expected Impact**: none (< 5ms per event)

Event merging happens in a memoized React component with proper dependencies. The merge operation is O(n) where n ≤ 100 (max events), which is negligible. Event conversion is O(1) per event.

**Performance Testing**:
- Measure time to render EventLog before/after fix (should be identical)
- Verify no unnecessary re-renders (use React DevTools Profiler)
- Confirm memo dependencies are correct

## Security Considerations

**Security Impact**: none

All changes are to local UI state management. No external network access, no new data sources, no changes to event server security model.

**Security Checklist**:
- ✅ No new external dependencies
- ✅ No new network calls
- ✅ No sensitive data in events (only status messages)
- ✅ Event server already validated (existing infrastructure)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe UI dashboard - no events during database setup
# (Events section will show "No events yet..." during DB operations)
```

**Expected Result**: No database events visible in "Recent Events" section during startup.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests
pnpm --filter @ai/alpha test .ai/alpha/scripts/ui/__tests__/orchestrator-events.spec.tsx

# Build UI (if separate build step exists)
pnpm --filter @ai/alpha build

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Watch UI dashboard - events should appear during database setup
```

**Expected Result**: All commands succeed, database events appear in UI dashboard in real-time.

### Regression Prevention

```bash
# Run full UI test suite to ensure no regressions
pnpm --filter @ai/alpha test

# Verify orchestrator still works without event server
# (kill event-server.py before starting orchestrator)
pkill -f event-server.py
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Should complete database setup without errors
```

## Dependencies

### New Dependencies

**No new dependencies required**

- Uses existing React hooks (useState, useCallback, useMemo)
- Uses existing UI types (OrchestratorEvent, WebSocketEvent)
- Uses existing event streaming infrastructure (useEventStream)

## Database Changes

**No database changes required**

This fix only affects UI event display, not database operations.

## Deployment Considerations

**Deployment Risk**: low

This is additive UI functionality with graceful degradation. If anything breaks, the UI falls back to existing behavior (no orchestrator events displayed).

**Special deployment steps**:
- None required - changes are local to UI components

**Feature flags needed**: no

**Backwards compatibility**: maintained (UI works with or without orchestrator events)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Database events appear in UI during orchestration startup
- [ ] Events have correct icons, colors, and messages (as defined in EventLog.tsx)
- [ ] Sandbox events continue to work correctly (no regressions)
- [ ] Events are sorted chronologically (newest first)
- [ ] No duplicate events displayed
- [ ] No performance degradation observed
- [ ] All unit tests pass
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Design Decision**: The chosen approach maintains the existing architectural pattern of separating sandbox events (from progress files + tool use) from orchestrator events (from WebSocket). This makes the code easier to understand and maintain, as each event source has a clear, dedicated path through the system.

**Event ID Generation**: Orchestrator events use format `orchestrator-${event_type}-${timestamp}` for unique IDs, which prevents collisions with sandbox event IDs (format: `feature-start-${id}-${timestamp}`).

**Type Safety**: The event type mapping function ensures that only valid `OrchestratorEventType` values reach the EventLog component, preventing runtime errors from unexpected event types from the WebSocket.

**Future Enhancement Opportunities**:
1. Add event filtering UI (show/hide event types)
2. Add event search/filtering by keyword
3. Add export events to JSON functionality
4. Add event time range selector (last hour, last day, etc.)
5. Add event grouping by sandbox or operation type

**Related Code**:
- Event streaming architecture: `.ai/alpha/scripts/event-server.py`
- Event types definition: `.ai/alpha/scripts/ui/types.ts`
- Event display: `.ai/alpha/scripts/ui/components/EventLog.tsx`
- Event emission: `.ai/alpha/scripts/lib/event-emitter.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1525*
