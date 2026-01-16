# Bug Fix: Alpha Event Streaming UI Output Not Updating

**Related Diagnosis**: #1436
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: `update_recent_output.py` hook is missing from `/alpha:implement` slash command's YAML frontmatter hooks AND has architectural mismatch (tries to access local filesystem from sandbox)
- **Fix Approach**: Remove broken fallback mechanism and ensure the primary event streaming path (HTTP POST → Event Server → WebSocket) works correctly
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI displays stale output in sandbox columns. The `recent_output` field only contains initial 2 lines from sandbox startup and never updates with real-time tool activity, making it impossible to monitor Claude Code execution progress.

Two root causes identified:
1. **Missing hook registration** - `update_recent_output.py` not in implement.md YAML hooks (only in local .claude/settings.json)
2. **Architectural mismatch** - Hook designed to run locally but tries to update files in local filesystem when sandboxes have isolated filesystems

For full details, see diagnosis issue #1436.

### Solution Approaches Considered

#### Option 1: Fix the Primary Event Streaming Path ⭐ RECOMMENDED

**Description**: The original implementation intends for `event_reporter.py` hook to POST events to an event server, which broadcasts via WebSocket to the UI. This is the correct architecture. Fix this path instead of trying to make a local progress file fallback work.

**Pros**:
- Aligns with the intended architecture from feature plan #1433
- `event_reporter.py` IS properly registered in slash command hooks
- Provides true real-time updates via WebSocket (no polling delay)
- Cleaner separation: hooks in sandbox → HTTP events → event server → WebSocket broadcast
- No filesystem access issues across sandbox boundaries
- More scalable for future enhancements

**Cons**:
- Requires verifying the event server is receiving/processing events correctly
- WebSocket integration in UI needs validation
- More moving parts to debug initially

**Risk Assessment**: medium - The infrastructure is already in place, just needs verification and potential fixes

**Complexity**: moderate - Involves debugging event flow, WebSocket connection, and UI state management

#### Option 2: Fix the Fallback Progress File Path Approach

**Description**: Move the progress file updates from sandbox hooks to the orchestrator's event server. Event server receives HTTP POST events, writes them to local progress files instead of WebSocket broadcasting.

**Pros**:
- Preserves current UI polling mechanism (lower change risk)
- Simpler WebSocket implementation (just events, not UI updates)
- Doesn't require UI to handle WebSocket subscriptions

**Cons**:
- More polling overhead (UI polls every 2 seconds)
- Doesn't fix root cause of `update_recent_output.py` hook design
- Still requires `update_recent_output.py` to be removed/replaced
- Polling introduces artificial delay in showing updates
- Event server becomes a passthrough instead of active broadcaster

**Why Not Chosen**: This approach works around the problem rather than fixing it. The event streaming feature was specifically designed to provide real-time updates via WebSocket, and the polling mechanism is a temporary fallback.

#### Option 3: Register and Fix update_recent_output.py Hook

**Description**: Register `update_recent_output.py` in implement.md hooks AND fix it to handle sandbox filesystem isolation.

**Pros**:
- Provides progress file updates as redundant mechanism
- Allows offline progress tracking

**Cons**:
- Hook can't access orchestrator's local filesystem from sandbox
- Would need to use external communication (HTTP/WebSocket) anyway
- Creates duplicate event streams (both HTTP POST and progress file writes)
- Adds complexity without clear benefit

**Why Not Chosen**: This approach doesn't solve the fundamental architectural issue. The hook would still need to communicate via HTTP/WebSocket to update the orchestrator's files, which makes it essentially a duplicate of what `event_reporter.py` already does.

### Selected Solution: Fix the Primary Event Streaming Path

**Justification**:
The event streaming architecture is correct - it separates concerns properly (hooks in sandbox, event broadcasting on orchestrator). The bug isn't in the architecture but in the implementation. By verifying and fixing the event flow from hooks → HTTP POST → event server → WebSocket → UI, we achieve the intended real-time updates without the complexity of cross-filesystem hooks.

This approach:
1. Leverages existing infrastructure
2. Maintains clean separation of concerns
3. Provides true real-time updates (no polling)
4. Aligns with the feature plan design
5. Doesn't require changing hook registration or architecture

**Technical Approach**:

1. **Verify HTTP event posting** - Confirm `event_reporter.py` hook in sandbox can POST to event server
2. **Verify event server reception** - Confirm event server receives POST events
3. **Verify WebSocket broadcasting** - Confirm event server broadcasts events via WebSocket
4. **Fix UI WebSocket listener** - Ensure UI properly subscribes and processes events
5. **Remove broken fallback** - Delete or disable `update_recent_output.py` hook
6. **Test end-to-end** - Verify tool activities appear in UI output in real-time

**Architecture Changes**:

The event streaming architecture is sound:
```
E2B Sandbox (Claude Code)
  ↓
PostToolUse hooks (event_reporter.py)
  ↓
HTTP POST to Event Server (ORCHESTRATOR_URL/api/events)
  ↓
Event Server (FastAPI on orchestrator)
  ↓
WebSocket broadcast to UI clients
  ↓
UI SandboxColumn component receives tool activity events
  ↓
UI updates recent_output with new activities
```

No architectural changes needed - just fix the implementation details along this path.

## Implementation Plan

### Affected Files

- `.claude/commands/alpha/implement.md` - YAML frontmatter hooks (NO CHANGE, `event_reporter.py` already registered)
- `.claude/hooks/event_reporter.py` - Verify POST to event server
- `.ai/alpha/scripts/event-server.ts` - Verify event reception and WebSocket broadcast
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Add/fix WebSocket listener
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Verify it displays WebSocket events
- `.claude/hooks/update_recent_output.py` - Delete or move to .bak (broken, won't be used)
- `.claude/settings.json` - Remove or comment out `update_recent_output.py` hook (local development only)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Event Reporter Hook Works in Sandbox

Verify that `event_reporter.py` hook is functioning correctly in the E2B sandbox:

- Check that hook is registered in `/alpha:implement` YAML frontmatter (it is at line 11-13)
- Verify ORCHESTRATOR_URL environment variable is set and passed to sandboxes
- Add debug logging to `event_reporter.py` to confirm it's being called
- Verify HTTP POST requests are being sent (check event server logs)

**Why this step first**: We need to confirm the event source (hooks) is working before debugging downstream components.

#### Step 2: Verify Event Server Receives Events

Confirm the event server is receiving HTTP POST events from sandboxes:

- Check `.ai/alpha/scripts/event-server.ts` has `/api/events` endpoint
- Verify endpoint is receiving POST requests from `event_reporter.py`
- Add logging to show events received (tool name, timestamp, etc.)
- Verify event schema matches what hooks are sending
- Check that event server is broadcasting to WebSocket clients

**Why this step**: Verify the orchestrator-side infrastructure is working correctly.

#### Step 3: Verify WebSocket Broadcasting

Confirm event server broadcasts events to connected UI clients:

- Check WebSocket server is listening on correct port
- Verify it accepts client connections
- Verify events are broadcast to all connected clients
- Check WebSocket message format

#### Step 4: Fix UI WebSocket Integration

Update the UI to properly receive and display WebSocket events:

- Modify `useProgressPoller.ts` to include WebSocket listener
- Create new hook `useEventStream.ts` if needed for WebSocket subscription
- Update `SandboxColumn.tsx` to display events from WebSocket in real-time
- Ensure `recent_output` array is updated with new tool activities

**Key changes**:
- Connect to event server WebSocket on component mount
- Subscribe to events for current sandbox
- Update `recent_output` state when new events arrive
- Maintain last N lines for display
- Unsubscribe on unmount

#### Step 5: Remove Broken Fallback Mechanism

Clean up the broken `update_recent_output.py` hook:

- Delete or rename `.claude/hooks/update_recent_output.py` to `.bak`
- Remove hook registration from `.claude/settings.json` (lines 60-64)
- This prevents confusion and removes dead code

**Why remove**: The hook was never working in sandboxes and won't be used with the WebSocket approach. Removing it clarifies that the event streaming path is the primary mechanism.

#### Step 6: Test End-to-End

Verify the complete event streaming pipeline works:

- Start orchestrator with UI enabled
- Run a feature implementation
- Watch UI output section update in real-time with tool activity
- Verify tool names and files are displayed correctly
- Check that output updates within 2-3 seconds of tool execution

**Manual test checklist**:
- [ ] Orchestrator starts without errors
- [ ] Event server is listening and accepting connections
- [ ] UI successfully connects to WebSocket
- [ ] First tool activity appears in output within 3 seconds
- [ ] Subsequent tool activities appear promptly
- [ ] Output section updates in real-time (no 30+ second delays)
- [ ] Multiple sandboxes show independent output streams
- [ ] No WebSocket connection errors in browser console
- [ ] No event server errors in logs

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ Event reporter hook formats events correctly
- ✅ Event server receives and parses POST events
- ✅ Event schema validation
- ✅ WebSocket message broadcasting
- ✅ UI properly subscribes to WebSocket events
- ✅ Regression test: Stale progress files don't block WebSocket updates

**Test files**:
- `.ai/alpha/scripts/__tests__/event-reporter.spec.ts` - Hook functionality
- `.ai/alpha/scripts/__tests__/event-server.spec.ts` - Event reception and broadcasting
- `.ai/alpha/scripts/ui/__tests__/useEventStream.spec.ts` - WebSocket hook

### Integration Tests

Test the complete event flow:
- Hook sends event → Server receives → WebSocket broadcasts → UI updates

**Test files**:
- `.ai/alpha/scripts/__tests__/event-streaming-integration.spec.ts`

### E2E Tests (if UI-focused)

Not strictly necessary for this bug fix (internal monitoring), but could add:
- Test that sandbox column shows real-time output updates
- Verify output appears within 3 seconds of tool execution

### Manual Testing Checklist

Execute these before marking bug as fixed:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
- [ ] Observe Event Server log shows it started and listening
- [ ] Watch UI dashboard open
- [ ] Click "Run" to start feature implementation
- [ ] Verify sandbox columns show initial authentication message
- [ ] Wait 5-10 seconds, verify tool activities start appearing in "Output:" section
- [ ] Examples: "📖 Read: dashboard.types.ts", "✏️ Edit: dashboard-skeleton.tsx", "💻 Bash: pnpm typecheck"
- [ ] Watch output update continuously throughout feature implementation
- [ ] Verify no gaps in output (no 30+ second freezes)
- [ ] Run a second feature to verify independent output streams
- [ ] Stop orchestrator, verify no hanging processes
- [ ] Check browser console - no WebSocket connection errors
- [ ] Check server logs - no event processing errors

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Event Server Not Receiving Events**: `event_reporter.py` may not be able to POST to event server
   - **Likelihood**: medium (network isolation in E2B possible)
   - **Impact**: high (no events flow through system)
   - **Mitigation**:
     - Verify ORCHESTRATOR_URL is set and correct in sandbox
     - Check network connectivity from sandbox to orchestrator
     - Add retry logic to POST requests with backoff
     - Add logging to debug POST failures

2. **WebSocket Connection Drops**: UI may lose WebSocket connection during long feature runs
   - **Likelihood**: low (should be stable)
   - **Impact**: medium (output stops updating mid-run)
   - **Mitigation**:
     - Implement WebSocket reconnection logic with exponential backoff
     - Add connection status indicator in UI
     - Log connection state changes
     - Queue events during disconnection, replay on reconnect

3. **Event Server Crashes**: Event server may crash under load or due to bugs
   - **Likelihood**: low (simple HTTP/WebSocket server)
   - **Impact**: high (complete loss of event streaming)
   - **Mitigation**:
     - Add process monitoring/restart logic to orchestrator
     - Add error handling for unrecoverable states
     - Log server errors with context

4. **UI State Explosion**: Storing all events in memory may cause memory issues
   - **Likelihood**: low (last N lines only)
   - **Impact**: low (browser would be slow, not crash)
   - **Mitigation**:
     - Keep only last 20-50 lines in state
     - Use virtual scrolling if displaying longer history
     - Clear old events periodically

**Rollback Plan**:

If event streaming causes issues in production:
1. Disable event streaming in orchestrator (environment variable)
2. Fall back to progress file polling (no real-time updates, but functional)
3. Restart orchestrator instances
4. Continue using orchestrator with polling until WebSocket bugs are fixed

## Performance Impact

**Expected Impact**: minimal to positive

- Event streaming moves away from polling (every 2 seconds) to push-based (near instant)
- Reduces HTTP requests from polling
- Reduces CPU usage on orchestrator
- Slightly increases memory usage for WebSocket connections (negligible)

**Performance Testing**:
- Measure event latency: time from tool execution to event appearing in UI
- Target: < 3 seconds (includes HTTP POST, server processing, WebSocket broadcast)
- Measure memory usage with 10+ concurrent sandboxes
- Verify no performance degradation vs. polling approach

## Security Considerations

**Security Impact**: low

- Event reporter hook POSTs to orchestrator via ORCHESTRATOR_URL environment variable
- WebSocket connection is same-origin (UI and server on same machine)
- Events contain only tool execution metadata (no sensitive data)

**Security measures** (if not already present):
- Validate event structure to prevent injection
- Limit WebSocket connections to same-origin
- Consider HTTPS/WSS for remote deployments (future)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui

# Observe:
# - Sandbox "Output:" shows only 2 initial lines
# - Never updates with tool activities
# - Remains frozen for entire feature run
```

**Expected Result**: Output section shows stale "Using OAuth authentication..." and "Running Claude Code with..." lines only.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Build
pnpm build

# Run orchestrator with UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui

# Manually verify in browser:
# - UI connects to event server WebSocket
# - Output section updates in real-time with tool activities
# - Tool activities appear within 3 seconds
# - Output updates continuously throughout feature run
# - Multiple sandboxes show independent output
```

**Expected Result**:
- All validation commands pass
- Bug is resolved: output section updates in real-time
- WebSocket events flow correctly from hooks → server → UI
- No console errors in browser
- No errors in event server logs

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Check event server is healthy
# (implementation detail test)
tsx .ai/alpha/scripts/event-server.ts --healthcheck

# Verify hook registration (should see event_reporter.py in hooks)
grep -r "event_reporter" .claude/commands/alpha/implement.md

# Verify update_recent_output.py is removed/disabled
if grep -q "update_recent_output" .claude/settings.json; then
  echo "ERROR: update_recent_output.py still registered in settings.json"
  exit 1
fi
```

## Dependencies

### New Dependencies

No new dependencies required. The implementation uses existing `ws` (WebSocket) library which should already be in package.json.

**If missing, install**:
```bash
pnpm add ws
```

### No Other External Dependencies

The event server and UI WebSocket integration use Node.js built-in capabilities and existing libraries.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Ensure ORCHESTRATOR_URL environment variable is set when running in production
- For remote deployments, use WSS (WebSocket Secure) instead of WS
- Update event server certificate configuration if using WSS

**Feature flags needed**: no

**Backwards compatibility**: maintained
- Existing progress file polling still works as fallback
- WebSocket is opt-in enhancement
- No breaking changes to APIs

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (output updates in real-time)
- [ ] Event reporter hook successfully POSTs to event server
- [ ] Event server successfully broadcasts via WebSocket
- [ ] UI successfully receives and displays WebSocket events
- [ ] No console errors in browser (WebSocket connection issues)
- [ ] No server errors in event server logs
- [ ] Manual testing checklist complete
- [ ] End-to-end latency < 3 seconds
- [ ] Multiple concurrent sandboxes work independently
- [ ] `update_recent_output.py` hook is removed/disabled
- [ ] Code review approved

## Notes

### Investigation Checklist

When implementing, verify these details:

1. **Event Server**
   - [ ] Is it listening on the correct port?
   - [ ] Is it receiving POST events from `event_reporter.py`?
   - [ ] Is it broadcasting received events to WebSocket clients?
   - [ ] What's the event schema (structure/format)?

2. **Event Reporter Hook**
   - [ ] Is ORCHESTRATOR_URL environment variable set in sandboxes?
   - [ ] Is the hook being called for each tool execution?
   - [ ] Is the HTTP POST succeeding (check HTTP status codes)?
   - [ ] What happens if POST fails (retry, drop, log)?

3. **UI WebSocket Integration**
   - [ ] Is the UI connecting to event server WebSocket?
   - [ ] Is the connection remaining open throughout feature run?
   - [ ] Is the UI properly handling incoming WebSocket events?
   - [ ] How are events being formatted for display?

### Related Documentation

- **Feature Plan (Event Streaming)**: `.ai/reports/feature-reports/2026-01-13/1433-feature-plan-alpha-event-streaming.md`
- **Diagnosis Issue**: #1436
- **Event Reporter Hook**: `.claude/hooks/event_reporter.py`
- **Orchestrator Architecture**: `.ai/alpha/docs/alpha-implementation-system.md`

### Implementation Notes

The event streaming system was designed with this exact architecture in mind. The implementation likely just needs:
1. Verify event server is properly set up and receiving events
2. Verify WebSocket broadcasting is working
3. Fix/add WebSocket listener in UI

The hard work (hook registration in slash command, environment variables, event schema) should already be done from the feature implementation.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1436*
