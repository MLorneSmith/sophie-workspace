# Bug Fix: Alpha Orchestrator UI - Event Ordering and Dev Server Issues

**Related Diagnosis**: #1572 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**:
  1. Events appended (oldest-first) instead of prepended (newest-first) in `.ai/alpha/scripts/ui/index.tsx:266-278`
  2. Display limits inconsistently applied across event rendering layers
  3. Dev server startup is fire-and-forget without health verification in `.ai/alpha/scripts/lib/sandbox.ts:291-337`
- **Fix Approach**:
  1. Prepend events instead of appending to maintain newest-first ordering
  2. Ensure display shows most recent events first
  3. Add port health check loop before returning dev server URL
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI has three distinct issues affecting usability:

1. **Event ordering**: Events display in oldest-first order but should show newest-first (matching Recent Events section behavior)
2. **Event accumulation**: Sandbox columns accumulate 30+ lines of events instead of limiting to 10
3. **Dev server verification**: Dev server URL is returned even if the server isn't actually running, resulting in "Connection refused" errors when users click the URL

For full details, see diagnosis issue #1572.

### Solution Approaches Considered

#### Option 1: Event Queue Reversal ⭐ RECOMMENDED

**Description**: Prepend new events instead of appending, maintain newest-first ordering throughout the display pipeline, and ensure consistent 10-event limit at display layer.

**Pros**:
- Aligns with user expectation (newest events visible at top)
- Matches existing "Recent Events" section behavior
- Minimal code changes (3-4 lines per fix)
- Consistent with event display patterns in modern UIs

**Cons**:
- Requires changing append to prepend pattern
- Array index logic needs verification (displaying first N vs last N)

**Risk Assessment**: low - Simple array manipulation with immediate visual verification

**Complexity**: simple - Array operations only

#### Option 2: Complete Event Redesign (Alternative)

**Description**: Redesign the entire event pipeline with a dedicated event store using a fixed-size circular buffer implementation.

**Why Not Chosen**: Over-engineering for a simple ordering issue. The current event array structure works fine; it just needs the order reversed and a display limit enforced.

### Selected Solution: Event Queue Reversal + Dev Server Verification

**Justification**:
- Fixes root causes with surgical, minimal changes
- No architectural changes needed
- Dev server health check is critical for user experience
- All changes are isolated and testable

**Technical Approach**:
1. **Event ordering fix**: Change `[...existing, displayText]` to `[displayText, ...existing]` to prepend
2. **Event display**: Ensure `SandboxColumn.tsx` displays first N items (newest) instead of last N
3. **Dev server verification**: Add port health check loop that polls until port responds or timeout
4. **Event limit consistency**: Enforce limit at display layer (show max 10 events)

**Architecture Changes**: None - all fixes are localized to specific functions

**Migration Strategy**: N/A - no data migration needed

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/index.tsx` (lines 266-278) - Event appending logic
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (lines 293-301) - Event display
- `.ai/alpha/scripts/lib/sandbox.ts` (lines 286-296) - Dev server startup
- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1211-1212) - Dev server integration

### New Files

None - all fixes are localized modifications

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Event Prepending Logic

**Goal**: Change event accumulation to prepend instead of append for newest-first ordering

**Changes**:
- `.ai/alpha/scripts/ui/index.tsx:266-278`
  - Change: `const updated = [...existing, displayText]` to `const updated = [displayText, ...existing]`
  - Rationale: Prepend places newest event at index 0, maintaining newest-first ordering
  - Verify: The `.slice(-10)` already limits to last 10 items; with prepend, it limits to most recent 10

**Why this step first**: Event order is the core issue; fixes the ordering problem at the source

#### Step 2: Fix Event Display Order in SandboxColumn

**Goal**: Ensure SandboxColumn displays newest events first (top of list)

**Changes**:
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx:293-301`
  - Current: `{state.recentOutput.slice(0, 3).map(...)}`  (displays oldest 3)
  - New: Display first 3-5 items from the newest-first array, or keep as-is if already correct
  - Rationale: Verify that with prepending, the display naturally shows newest items first

**Why this step**: Ensures the UI layer displays the correct events after prepending

#### Step 3: Add Dev Server Port Health Check

**Goal**: Verify dev server is actually running before returning the URL

**Changes**:
- `.ai/alpha/scripts/lib/sandbox.ts` - Add health check function
  - Create `healthCheckPort()` async function that:
    - Attempts to connect to port 3000
    - Retries up to 30 times with 1-second intervals (30-second total timeout)
    - Returns true if connection succeeds, false if timeout
  - Modify `startDevServer()` to:
    - Call `healthCheckPort()` after starting the server
    - Throw error if port doesn't respond after timeout
    - Only return URL if health check passes
- `.ai/alpha/scripts/lib/orchestrator.ts:1211-1212`
  - Wrap dev server start in try-catch
  - Log clear error if dev server fails to start
  - Handle error gracefully (skip URL in results, show error message)

**Rationale**: Prevents returning broken URLs to users; ensures only working servers are presented

**Why this step**: Critical for user experience; broken links waste user time

#### Step 4: Add Tests for Event Ordering

**Goal**: Ensure events maintain newest-first order and respect size limits

**Tests**:
- Unit test for `handleWebSocketEvent` event ordering:
  - Add multiple events and verify newest is at index 0
  - Verify array is limited to 10 items max
  - Test deduplication (if enabled)

**Test file**:
- `.ai/alpha/scripts/ui/__tests__/event-ordering.spec.ts`

**Why this step**: Prevents regressions; documents expected behavior

#### Step 5: Validation and Testing

**Goal**: Verify all fixes work correctly together

- Run orchestrator with spec 1362 again
- Observe:
  - Events display in newest-first order
  - Maximum 10 events visible per sandbox
  - Dev server URL is clickable and working
  - No console errors
- Verify no regressions in other UI elements

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Event prepending maintains newest-first order
- ✅ Events limited to 10 items maximum
- ✅ Deduplication works correctly
- ✅ Dev server health check returns true on successful port connection
- ✅ Dev server health check times out and returns false on port not responding
- ✅ Orchestrator handles dev server timeout gracefully

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/event-ordering.spec.ts` - Event order and limits
- `.ai/alpha/scripts/lib/__tests__/sandbox-health.spec.ts` - Port health check

### Integration Tests

- Run orchestrator with spec 1362 for one full cycle
- Verify all three issues are resolved

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-ui-integration.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe event display in sandbox columns during execution
- [ ] Verify events show newest at top (reverse chronological order)
- [ ] Verify event list stays under 10 items max
- [ ] Wait for orchestration completion
- [ ] Click dev server URL
- [ ] Verify dev server responds and loads successfully
- [ ] Check browser console for any JavaScript errors
- [ ] Verify no UI flicker or visual artifacts

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Event display regression**: Changing event order could break assumptions in other parts of code
   - **Likelihood**: low
   - **Impact**: medium (would need quick revert)
   - **Mitigation**: Tests verify expected ordering; code review before merge

2. **Health check timeout**: If dev server startup takes longer than 30 seconds
   - **Likelihood**: medium
   - **Impact**: medium (URL would be rejected even if server works)
   - **Mitigation**: Increase timeout to 60 seconds; log progress; allow retry logic

3. **Port connection issues**: Network/firewall could block port health check
   - **Likelihood**: low (running in same environment)
   - **Impact**: low (would only fail in edge cases)
   - **Mitigation**: Log connection attempt details; provide fallback

**Rollback Plan**:

If this fix causes issues in production:
1. Revert commits to `.ai/alpha/scripts/ui/index.tsx` and `SandboxColumn.tsx`
2. Remove health check additions from `sandbox.ts`
3. Redeploy orchestrator
4. Issues will regress to previous state (no data loss)

**Monitoring**:
- Monitor dev server startup success rate
- Alert if health check timeout is triggered >50% of the time
- Track event ordering complaints in logs

## Performance Impact

**Expected Impact**: minimal

- Event prepending: O(1) array prepend operation, minimal overhead
- Health check: Adds 30-second delay to orchestration completion, but only once per run
- Display rendering: No changes to React render cycle; same component re-renders

**Performance Testing**:
- Run two orchestration cycles and compare completion times
- Dev server health check adds one-time 30-second delay (acceptable)

## Security Considerations

**Security Impact**: none

- Event ordering: No security implications
- Health check: No security implications (local port check only)

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run orchestrator and observe issues
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected results:
# - Events accumulate to 30+ lines in sandbox columns
# - Events display in oldest-first order
# - Dev server URL shows "Connection refused" error
```

**Expected Result**: All three issues present and observable

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit scripts/ui/__tests__/event-ordering.spec.ts
pnpm test:unit scripts/lib/__tests__/sandbox-health.spec.ts

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# After completion:
# 1. Observe sandbox columns - max 10 events, newest-first order
# 2. Click dev server URL - should load successfully
# 3. Check browser console - no errors
```

**Expected Result**: All commands succeed, all three issues resolved, zero regressions.

### Regression Prevention

```bash
# Run full orchestrator test suite
pnpm test:unit scripts/__tests__

# Additional regression checks
# - Run with different spec numbers
# - Verify event display in different viewport sizes
# - Verify mobile responsiveness still works
```

## Dependencies

### New Dependencies

**No new dependencies required**

All fixes use existing libraries and APIs:
- React hooks for state management (already used)
- TypeScript for type safety (already in use)
- E2B SDK for port connection tests (already in use)

## Database Changes

**No database changes required**

- Event ordering is in-memory only
- Dev server URL is not persisted
- No schema changes needed

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a dev tool update, not production code
- Changes only affect orchestrator UI and internal sandbox management
- No user-facing production changes

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Events display in newest-first order in UI
- [ ] Event list limited to 10 items maximum
- [ ] Dev server URL is verified working before presentation to user
- [ ] All tests pass (unit, integration, manual)
- [ ] Zero regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Decision Trail**:
- Chose prepend over redesign: Simpler fix, less risk of regressions
- Chose 30-second health check timeout: Matches existing wait time in orchestrator
- Chose 1-second check interval: Balance between responsiveness and system load

**Related Issues**:
- #1567 (comprehensive UI diagnosis with additional issues)
- Related event ordering patterns used in React Query, Redux, and other state management libraries

**References**:
- E2B SDK docs: https://docs.e2b.dev/
- React hooks best practices: https://react.dev/reference/react/hooks
- Event queue patterns: Common in browser event systems, WebSocket handlers

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1572*
