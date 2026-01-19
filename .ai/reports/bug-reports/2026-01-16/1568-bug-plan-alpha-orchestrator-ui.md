# Bug Fix: Alpha Orchestrator UI - Multiple Issues (Flicker, Event Growth, Recovery State, Feature Cycling, Dev Server)

**Related Diagnosis**: #1567 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Causes**:
  1. Dual timer pattern (5s poll + 5s heartbeat) causing re-render storms
  2. Unbounded event list growth with duplicate entries
  3. Stale sandbox ID mapping never cleared on restart
  4. Preemptive restart terminating long-running Claude Code sessions
  5. Fire-and-forget dev server startup without health check

- **Fix Approach**: Implement 5 targeted fixes addressing each root cause separately while maintaining backward compatibility
- **Estimated Effort**: large
- **Breaking Changes**: no

## Solution Design

### Problem Recap

During Spec #1362 orchestration run, multiple UI and functional issues emerged:
1. Progress bars flicker during updates
2. Event lists grow to 30+ items before resetting
3. Sandbox recovery UI shows stale red status despite recovery
4. Feature 1375 executed 4 times due to premature termination
5. Dev server URL returns "Connection refused on port 3000"

For full details, see diagnosis issue #1567.

### Solution Approaches Considered

#### Option 1: Atomic Fix - Address Each Issue Independently ⭐ RECOMMENDED

**Description**: Create 5 targeted, surgical fixes:
1. Debounce re-renders + stabilize tasksTotal
2. Add display limit to recentOutput mapping
3. Clean stale sandbox IDs + emit restart events
4. Increase SANDBOX_MAX_AGE_MS timeout
5. Add port health check before returning URL

**Pros**:
- Each fix is isolated and testable independently
- Lower risk of unintended side effects
- Changes are minimal and focused
- Easy to roll back individual fixes if needed
- Can be deployed in phases
- Clear cause-effect relationship for debugging

**Cons**:
- Requires 5 separate commits
- More testing permutations needed
- No architectural refactoring (technical debt remains)
- May require follow-up optimization later

**Risk Assessment**: low-medium - Each fix is isolated and thoroughly tested before integration
**Complexity**: moderate - Fixes vary in complexity but each is well-scoped

#### Option 2: Comprehensive Refactor - Redesign State Management

**Description**: Refactor entire UI state management layer using unified state machine:
- Central event bus for all updates
- Single source of truth for sandbox state
- Eliminate polling/streaming duality
- Consolidate timers into single coordinated loop

**Pros**:
- Long-term architectural improvement
- Eliminates multiple timing issues at once
- Better separation of concerns
- Easier to test and maintain

**Cons**:
- High complexity and risk
- Requires extensive testing
- Could break existing functionality
- Difficult to rollback
- Time-consuming implementation
- Overkill for current scope

**Why Not Chosen**: While appealing architecturally, this is over-engineering for the immediate bug fix. Risk/reward unfavorable given the isolated nature of each bug. Better approach: fix bugs now, plan architectural refactor as separate initiative.

#### Option 3: Quick Hacks - Minimal Code Changes

**Description**: Apply minimal patches without addressing root causes:
- Increase poll interval to reduce re-renders
- Filter out duplicate events in UI layer only
- Reset progress file on restart
- Increase timeout arbitrarily
- Ignore dev server startup failures

**Pros**:
- Fastest to implement
- Minimal code changes

**Cons**:
- Doesn't fix root causes
- May mask symptoms without solving problems
- Creates technical debt
- Issues could resurface
- Unprofessional quality

**Why Not Chosen**: This violates best practices. Root cause fixes are necessary for long-term stability. The diagnosis identified specific, addressable causes that deserve proper fixes.

### Selected Solution: Atomic Fix - Address Each Issue Independently

**Justification**:
This approach balances speed, safety, and quality. Each root cause has been clearly identified with evidence. By fixing them independently:
- We can test each fix thoroughly
- Risk is compartmentalized
- We avoid introducing new issues through over-ambitious refactoring
- The codebase remains understandable and maintainable
- All fixes can ship independently if needed

The fixes are not interdependent and don't require synchronized changes.

**Technical Approach**:

1. **Progress Bar Flicker Fix**:
   - Stabilize `tasksTotal` to not depend on `current_task` presence
   - Add memoization to prevent unnecessary re-renders in ProgressBar
   - Debounce heartbeat updates from 1s to 5s (already attempted, need stronger debouncing)

2. **Event List Growth Fix**:
   - Cap `recentOutput.map()` to max 3-5 items in SandboxColumn display
   - Add deduplication by creating a Set to track displayed lines
   - Apply same limit in UI layer consistently

3. **Sandbox Recovery State Fix**:
   - Clear old entries from `sandboxIdToLabelRef` when new sandbox created
   - Write "sandbox_restarted" marker to progress file on restart
   - Add WebSocket event emission for sandbox restarts

4. **Feature Cycling Fix**:
   - Increase `SANDBOX_MAX_AGE_MS` from 50 min to 60 min
   - Add check for features "almost done" before preemptive restart
   - Implement graceful shutdown that waits for current task completion

5. **Dev Server Access Fix**:
   - Add port health check loop in `startDevServer` (max 30 attempts, 1s intervals)
   - Log clear error if dev server doesn't start
   - Fail gracefully with actionable error message

**Architecture Changes**:
- Minor: Add a few utility functions for state cleaning and health checks
- No API changes
- No data structure changes (backward compatible)
- All changes are additive or localized

**Migration Strategy**:
No migration needed - all fixes are backward compatible and don't affect data structures.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Debounce heartbeat updates, cap recentOutput display
- `.ai/alpha/scripts/ui/components/ProgressBar.tsx` - Add memoization
- `.ai/alpha/scripts/ui/index.tsx` - Clear stale sandbox IDs, add deduplication
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Stabilize tasksTotal calculation
- `.ai/alpha/scripts/lib/sandbox.ts` - Add port health check in startDevServer
- `.ai/alpha/scripts/lib/orchestrator.ts` - Increase SANDBOX_MAX_AGE_MS, emit restart events, add graceful shutdown

### New Files

None - all fixes are modifications to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute these in order. They are interdependent on shared infrastructure (e.g., health check utility).

#### Step 1: Add Health Check Utility Functions

- Create `.ai/alpha/scripts/lib/health.ts` with:
  - `isPortOpen(port: number, maxAttempts?: number): Promise<boolean>`
  - `waitForPort(port: number, timeoutMs?: number): Promise<boolean>`
- Add exports to `.ai/alpha/scripts/lib/index.ts`
- Add tests in `.ai/alpha/scripts/lib/__tests__/health.spec.ts`

**Why this step first**: Dev server health check depends on this utility. It's also useful for other health-related operations in the orchestrator.

#### Step 2: Fix Dev Server Not Accessible (startDevServer)

In `.ai/alpha/scripts/lib/sandbox.ts`:

- Modify `startDevServer` to:
  - Start dev server (existing code)
  - Call `await waitForPort(DEV_SERVER_PORT, 30000)` before returning URL
  - Throw clear error if port doesn't respond: "Dev server failed to start on port 3000"
- Add logging for dev server startup attempts
- Keep 30-second wait as fallback

**Testing**:
- Manual: Start orchestrator, observe dev server starts correctly
- Manual: Check that error message is clear if port fails
- Verify existing dev server URL logic still works

#### Step 3: Fix Progress Bar Flicker (ProgressBar + useProgressPoller)

In `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts`:

- Modify `progressToSandboxState` function (line 304):
  - Instead of: `tasksTotal = tasksCompleted + failedCount + (currentTask ? 1 : 0)`
  - Use: `tasksTotal = previousState?.tasksTotal ?? (tasksCompleted + failedCount + (currentTask ? 1 : 0))`
  - This preserves tasksTotal across updates unless it increases (new task discovered)

In `.ai/alpha/scripts/ui/components/ProgressBar.tsx`:

- Wrap component in `React.memo()` with custom comparison:
  ```typescript
  export const ProgressBar = React.memo(ProgressBarImpl, (prev, next) => {
    return (
      prev.current === next.current &&
      prev.total === next.total &&
      prev.width === next.width &&
      prev.filledColor === next.filledColor
    );
  });
  ```

In `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`:

- Modify `useRealtimeHeartbeat` hook (line 120):
  - Change update interval from 5s to 10s (reduce flicker)
  - Add debounce delay of 500ms when lastHeartbeat changes

**Testing**:
- Manual: Watch dashboard during orchestration - progress bars should update smoothly
- Manual: Verify task count doesn't jump around
- Automated: Add unit test that tasksTotal doesn't decrease unexpectedly

#### Step 4: Fix Unbounded Event List (SandboxColumn + index.tsx)

In `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`:

- At line 284-293 where `recentOutput` is mapped:
  - Change to: `state.recentOutput?.slice(0, 3).map((line) => ...)`
  - Add comment: "Limit display to 3 most recent items for UI space"

In `.ai/alpha/scripts/ui/index.tsx`:

- In `handleWebSocketEvent` function (line 266-272):
  - Add deduplication using Set:
    ```typescript
    const updated = [...existing, displayText]
      .filter((item, idx, arr) => arr.indexOf(item) === idx) // Remove duplicates
      .slice(-10); // Keep last 10 unique items
    ```
  - This ensures no duplicate tool entries

**Testing**:
- Manual: Watch event list during feature execution - should stay under 10 items
- Manual: Verify no duplicate entries in output
- Verify display limit doesn't affect internal storage (10 items stored, 3 displayed)

#### Step 5: Fix Sandbox Recovery UI State (index.tsx + orchestrator.ts)

In `.ai/alpha/scripts/ui/index.tsx`:

- Modify sandbox ID to label mapping cleanup (around line 340-345):
  - Add effect to clean up old IDs when sandboxes change:
    ```typescript
    useEffect(() => {
      // Remove IDs that are no longer in current sandboxes
      const currentIds = new Set(state.sandboxes.keys().map(label => state.sandboxes.get(label)?.sandboxId).filter(Boolean));
      for (const [id] of sandboxIdToLabelRef.current) {
        if (!currentIds.has(id)) {
          sandboxIdToLabelRef.current.delete(id);
        }
      }
    }, [state.sandboxes]);
    ```

In `.ai/alpha/scripts/lib/orchestrator.ts`:

- When creating new sandbox after restart (lines 437, 533, 622):
  - Add: `manifest.sandbox.restart_count = (manifest.sandbox.restart_count ?? 0) + 1`
  - This creates a marker that the sandbox was restarted

- In event server connection, emit "sandbox_restarted" event when old sandbox ID is replaced

**Testing**:
- Manual: Trigger sandbox restart (age-based or health-check based)
- Verify UI shows correct health status after restart
- Verify stale IDs are cleaned from mapping
- Verify new sandbox takes over correctly

#### Step 6: Fix Feature Cycling (orchestrator.ts)

In `.ai/alpha/scripts/lib/orchestrator.ts`:

- Modify `SANDBOX_MAX_AGE_MS` (or create config):
  - Current: 50 min (3000000 ms)
  - Change to: 60 min (3600000 ms)
  - Add comment: "Allow up to 60 minutes for long-running features"

- In preemptive restart loop (around line 499-507):
  - Before resetting feature to pending, check progress:
    ```typescript
    const feature = manifest.feature_queue.find(...);
    if (feature) {
      const tasksCompleted = feature.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = feature.tasks.length;
      const percentDone = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

      // If 80%+ done, give it more time instead of restarting
      if (percentDone >= 80) {
        log(`Feature #${feature.id} is 80% done, skipping preemptive restart`);
        continue; // Skip restart for this feature
      }
    }
    ```

- Add graceful shutdown attempt before forcing restart:
  ```typescript
  // Try to gracefully shutdown the current Claude Code session
  try {
    await instance.sandbox.commands.run('pkill -TERM run-claude', { timeoutMs: 5000 });
    await sleep(2000); // Wait for graceful shutdown
  } catch {
    // If graceful shutdown fails, proceed with restart
  }
  ```

**Testing**:
- Manual: Run a long feature and verify it doesn't get preemptively restarted at 50 min
- Manual: Verify features that are 80%+ done are given extra time
- Check logs to see graceful shutdown attempts
- Verify no duplicate feature executions

#### Step 7: Add Regression Tests

Create `.ai/alpha/scripts/ui/components/__tests__/orchestrator-ui-regressions.spec.ts`:

```typescript
describe('Orchestrator UI Regressions', () => {
  // Test 1: Progress bar shouldn't flicker on state updates
  test('progress bar remains stable during rapid updates', () => { ... });

  // Test 2: Event list shouldn't grow unbounded
  test('recent output capped at display limit', () => { ... });

  // Test 3: Sandbox ID mapping cleaned up
  test('stale sandbox IDs removed from mapping', () => { ... });

  // Test 4: Dev server returns error for unreachable port
  test('startDevServer throws error if port unreachable', () => { ... });
});
```

#### Step 8: Update Documentation

- Add comment in `orchestrator.ts` explaining the `SANDBOX_MAX_AGE_MS` value and why
- Document the preemptive restart logic with link to diagnosis #1567
- Add inline comments explaining debouncing in SandboxColumn
- Update README if user-facing behavior changes

#### Step 9: Validation and Verification

- Run `pnpm typecheck` - should pass with no errors
- Run `pnpm lint` - should pass
- Run `pnpm format:fix` - auto-format
- Run unit tests: `pnpm test:unit --filter .ai/alpha`
- Manual test: Run orchestrator with `--sandboxes 3` for 30+ minutes
- Observe:
  - No progress bar flicker
  - Event lists stay bounded
  - Sandbox recovery shows correct state
  - Dev server accessible at completion
  - No premature feature termination

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `sandboxStateEqual` function handles all state changes correctly
- ✅ `progressToSandboxState` preserves tasksTotal across updates
- ✅ `ProgressBar` doesn't re-render unnecessarily
- ✅ Heartbeat debouncing works correctly
- ✅ Sandbox ID cleanup removes only stale IDs
- ✅ Event deduplication removes exact duplicates
- ✅ `startDevServer` waits for port before returning
- ✅ Port health check times out appropriately
- ✅ Regression: Feature 1375 shouldn't execute multiple times
- ✅ Regression: Sandbox recovery should update state correctly
- ✅ Regression: Event list should cap at 10 items stored, 3 displayed

**Test files**:
- `.ai/alpha/scripts/ui/components/__tests__/progress-bar.spec.ts` - ProgressBar memoization
- `.ai/alpha/scripts/ui/hooks/__tests__/use-progress-poller.spec.ts` - tasksTotal stability
- `.ai/alpha/scripts/lib/__tests__/health.spec.ts` - Port health check
- `.ai/alpha/scripts/lib/__tests__/sandbox.spec.ts` - Dev server startup
- `.ai/alpha/scripts/ui/components/__tests__/orchestrator-ui-regressions.spec.ts` - All regressions

### Integration Tests

- Test sandbox restart → sandbox ID cleanup → new sandbox takes over
- Test feature preemptive restart → graceful shutdown → feature re-assignment
- Test event stream + polling data merging → no duplicates → bounded list

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with 3 sandboxes for 45+ minutes
- [ ] Observe progress bars - no flickering or jumping
- [ ] Observe event lists - stay under 10 items (3 displayed)
- [ ] Intentionally trigger sandbox restart (age-based)
- [ ] Verify restarted sandbox shows green/correct health status immediately
- [ ] Verify dev server URL is clickable and works at completion
- [ ] Verify feature isn't executed multiple times
- [ ] Check logs for graceful shutdown attempts
- [ ] Verify all 5 issues from #1567 are resolved
- [ ] Run full test suite - no regressions
- [ ] Build succeeds with no errors

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Debouncing Reduces Update Responsiveness**: Increasing poll interval or adding debounce might make UI feel sluggish
   - **Likelihood**: low
   - **Impact**: medium (UX regression)
   - **Mitigation**: Tune debounce values carefully; test with slow/fast sandboxes; revert to stricter timing if needed

2. **Increasing SANDBOX_MAX_AGE_MS Masks Real Issues**: Sandboxes that should restart might not
   - **Likelihood**: low
   - **Impact**: medium (feature might fail due to old sandbox state)
   - **Mitigation**: Monitor sandbox logs for state corruption; add health checks; have clear error messages

3. **Port Health Check Blocks on Bad Network**: If port is unreachable, health check loop might hang
   - **Likelihood**: low
   - **Impact**: high (orchestration blocked)
   - **Mitigation**: Strict timeout on each port check (1s); clear error messages; allow override flag

4. **Graceful Shutdown Hangs**: Trying to gracefully shutdown Claude Code might not work, blocking restart
   - **Likelihood**: medium
   - **Impact**: medium (restart delayed)
   - **Mitigation**: Timeout on graceful shutdown (5s); force kill after timeout; log all attempts

5. **Stale ID Cleanup Breaks Event Routing**: Removing IDs too aggressively might break WebSocket event routing
   - **Likelihood**: low
   - **Impact**: high (events sent to wrong sandbox)
   - **Mitigation**: Only remove IDs that are definitely stale; add safety checks; comprehensive testing

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the commits in reverse order (last fix first):
   ```bash
   git revert <feature-cycling-commit>
   git revert <sandbox-recovery-commit>
   git revert <event-list-commit>
   git revert <flicker-commit>
   git revert <dev-server-commit>
   git revert <health-utils-commit>
   ```

2. If specific fix is problematic, revert only that fix:
   - For flicker: Reduce debounce, revert tasksTotal logic
   - For events: Remove dedup logic, revert display cap
   - For recovery: Revert ID cleanup
   - For cycling: Revert SANDBOX_MAX_AGE_MS increase, remove graceful shutdown
   - For dev server: Revert port health check

3. Redeploy previous stable version

**Monitoring** (if needed):
- Monitor orchestration completion rate - should remain high
- Monitor sandbox restart frequency - should not increase
- Monitor dev server accessibility - should be 100%
- Check for any new error patterns in logs

## Performance Impact

**Expected Impact**: minimal

- **Debouncing**: May slightly reduce CPU usage from fewer re-renders (positive)
- **Memoization**: May slightly reduce React reconciliation overhead (positive)
- **Port health check**: Adds ~1-3 seconds to orchestration completion (acceptable)
- **Graceful shutdown**: Adds ~2-5 seconds to sandbox restart if triggered (acceptable)

**Performance Testing**:
- Run orchestrator with 3 sandboxes for 60+ minutes
- Measure:
  - UI frame rate (should remain 60fps)
  - Memory usage (should not increase over time)
  - Sandbox restart time (should be <10s)
  - Orchestration completion time (should not regress significantly)

## Security Considerations

**Security Impact**: none

No security implications for these fixes:
- Port health check uses localhost only
- No new external dependencies
- No credential handling changes
- All changes are internal UI/orchestration logic

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Bugs exist in current state
# 1. Run orchestrator and observe progress bar flicker
# 2. Watch event list grow to 30+ items
# 3. Trigger sandbox restart, observe stale state
# 4. Wait for completion, try to access dev server URL
```

**Expected Result**: All 5 bugs reproduce as described in diagnosis #1567

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit --filter .ai/alpha/scripts

# Build
pnpm build

# Manual verification (with orchestrator running)
# 1. Observe smooth progress bars
# 2. Event list capped at displayed items
# 3. Sandbox recovery shows correct state
# 4. Dev server accessible at completion
# 5. No premature feature termination

# Run full orchestrator test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 \
  --sandboxes 3 \
  --timeout 3600 \
  # Run for 45-60 minutes, observe all fixes working
```

**Expected Result**: All commands succeed, bugs are resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Check for performance regressions
pnpm analyze

# Manual E2E test
pnpm test:e2e --filter web

# Additional regression checks
# 1. Verify no new console errors in orchestrator UI
# 2. Check sandbox log files for unexpected errors
# 3. Confirm all features completed without duplication
# 4. Verify event server still functioning correctly
```

## Dependencies

### New Dependencies

None - all fixes use existing dependencies and patterns in the codebase.

### Existing Dependencies Used

- `react`: Memoization, useEffect hooks
- `ink`: Terminal UI rendering
- `e2b-code-interpreter`: Sandbox management

## Database Changes

**No database changes required** - all fixes are in-memory state management and UI logic.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None required for these fixes
- Can be deployed as single PR
- Or deployed incrementally (one fix at a time)
- No configuration changes
- No data migrations
- Backward compatible

**Feature flags needed**: no

**Backwards compatibility**: maintained (all changes are internal)

## Success Criteria

The fix is complete when:
- [ ] All 5 issues from diagnosis #1567 are resolved
- [ ] All validation commands pass
- [ ] Unit tests pass with new regression tests
- [ ] Manual testing checklist complete
- [ ] No new console errors or warnings
- [ ] No performance regression observed
- [ ] Orchestration completes successfully with 3+ sandboxes
- [ ] Dev server accessible and clickable at completion
- [ ] Event lists stay bounded
- [ ] Progress bars smooth without flicker
- [ ] Features don't execute multiple times
- [ ] Sandbox recovery reflected correctly in UI
- [ ] Code review approved

## Notes

**Important Decisions**:
1. Chose atomic fixes over refactoring to minimize risk and timeline
2. Increased SANDBOX_MAX_AGE_MS conservatively (10 min increase) to avoid masking issues
3. Added graceful shutdown as courtesy, but robust enough to force restart if needed
4. Port health check uses same utility pattern as existing health checks in codebase

**Follow-up Tasks** (not part of this fix):
1. Consider architectural refactoring of state management as separate initiative
2. Add comprehensive logging for troubleshooting orchestration issues
3. Implement metrics collection for monitoring orchestrator health
4. Create dashboard for tracking orchestrator performance over time

**Related Issues**:
- Diagnosis: #1567
- Future: Architectural refactoring of Alpha Orchestrator state management

---
*Bug Fix Plan - Alpha Orchestrator UI Issues*
*Created: 2026-01-16*
*Based on diagnosis: #1567*
