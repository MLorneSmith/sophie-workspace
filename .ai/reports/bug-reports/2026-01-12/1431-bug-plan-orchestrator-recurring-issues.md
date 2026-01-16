# Bug Fix: Alpha Orchestrator Recurring Issues (Output, Sandbox, Assignment)

**Related Diagnosis**: #1430 (closed)
**Fix Issue**: #1431
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Error field not cleared on feature re-assignment causes race condition where multiple sandboxes claim same feature; E2B stdout buffering prevents real-time output display
- **Fix Approach**: Clear error field on assignment + make inconsistent state handler time-aware + enhance progress polling to show task status instead of relying on stdout
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The orchestrator has three issues: (A) UI output freezes after startup messages due to E2B stdout buffering, (B) excessive sandboxes created, and (C) multiple sandboxes assigned to same feature. The root cause for B & C is that the `error` field persists through re-assignment, causing the inconsistent state handler to reset actively-assigned features, creating a race condition loop.

For full details, see diagnosis issue #1430.

### Solution Approaches Considered

#### Option 1: Surgical Fix - Clear Error Field + Time-Aware Handler ⭐ RECOMMENDED

**Description**:
- Add `feature.error = undefined;` when assigning features (1 line change)
- Make inconsistent state handler only trigger after 60 seconds (prevents premature resets)
- Display task progress from `.initiative-progress.json` instead of relying on stdout (UI already polls this file)

**Pros**:
- Minimal code changes (3 locations, ~10 lines total)
- Fixes root cause directly
- Low risk - changes are isolated and testable
- Doesn't require architectural changes
- UI enhancement uses existing polling mechanism
- Backwards compatible

**Cons**:
- Doesn't address E2B stdout buffering limitation (works around it instead)
- Time-based handler may still have edge cases

**Risk Assessment**: Low - Changes are surgical and affect only feature assignment logic. The error field clearing is a simple state cleanup that should have been there originally.

**Complexity**: Moderate - Requires careful handling of race conditions and timing logic, but the implementation is straightforward.

#### Option 2: Remove Error Field Entirely

**Description**:
- Remove the `error` field from the feature state model
- Use `status: "failed"` alone to track failures
- Store error details in separate tracking structure or logs

**Pros**:
- Eliminates entire class of bugs related to error field persistence
- Cleaner state model
- Forces proper state transitions

**Cons**:
- Requires changes throughout the codebase (10+ files)
- Migration needed for existing manifests
- Loss of error context in manifest (valuable for debugging)
- High risk of introducing new bugs
- Much larger effort (days vs hours)

**Why Not Chosen**: Too much refactoring for the problem at hand. The error field is useful for debugging - we just need to manage its lifecycle properly.

#### Option 3: Implement Distributed Locking

**Description**:
- Use a lock file or atomic file operations to prevent race conditions
- Each sandbox must acquire lock before claiming a feature
- Release lock after assignment completes

**Pros**:
- Prevents all race conditions
- More robust for distributed systems

**Cons**:
- Overkill for local file-based manifest
- Adds complexity and potential deadlocks
- Doesn't address the root cause (error field persistence)
- Performance overhead

**Why Not Chosen**: Over-engineered solution. The atomic save in `assignFeatureToSandbox()` (added in #1429) is sufficient. We just need proper state cleanup.

### Selected Solution: Surgical Fix - Clear Error Field + Time-Aware Handler

**Justification**: This approach fixes the root cause with minimal changes, low risk, and maintains backwards compatibility. It addresses the error field persistence directly while adding safeguards against premature state resets. The UI enhancement leverages existing infrastructure (progress file polling) to work around E2B's stdout buffering limitation.

**Technical Approach**:
- **Error Clearing**: Add `feature.error = undefined;` in `assignFeatureToSandbox()` after setting status/sandbox/timestamp
- **Time-Aware Handler**: Modify `getNextAvailableFeature()` to only reset inconsistent state if it's been >60 seconds since assignment
- **UI Enhancement**: Display current task from progress file instead of only recent stdout lines (already being polled)

**Architecture Changes**: None - all changes work within existing architecture

**Migration Strategy**: Not needed - changes are backwards compatible

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/work-queue.ts` - Clear error field on assignment (line ~177), modify inconsistent state handler (lines ~66-74)
- `.ai/alpha/scripts/ui/components/SandboxPanel.tsx` - Display task progress from progress file instead of only recent output

### New Files

None required - all changes are modifications to existing files.

### Step-by-Step Tasks

#### Step 1: Fix Error Field Persistence (Root Cause)

Clear the error field when assigning a feature to prevent inconsistent state detection on actively-assigned features.

- Open `.ai/alpha/scripts/lib/work-queue.ts`
- Find `assignFeatureToSandbox()` function (around line 144)
- After the lines that set `status`, `assigned_sandbox`, and `assigned_at` (around line 173-176)
- Add: `feature.error = undefined;`
- Add comment: `// Clear any previous error - this is a fresh assignment`

**Why this step first**: This is the root cause fix. Without clearing the error field, the race condition will continue to occur.

#### Step 2: Make Inconsistent State Handler Time-Aware

Prevent the handler from resetting features that were just assigned (within last 60 seconds).

- In same file (`.ai/alpha/scripts/lib/work-queue.ts`)
- Find the inconsistent state handler in `getNextAvailableFeature()` (around line 66-74)
- Wrap the reset logic in a time check:
  ```typescript
  if (feature.status === "in_progress" && feature.error) {
    // Only reset if this state has persisted for >60 seconds
    // Recent assignments may legitimately have stale error field momentarily
    const timeSinceAssignment = feature.assigned_at ? now - feature.assigned_at : Infinity;
    if (timeSinceAssignment > 60_000) {  // 60 seconds
      console.log(`🔧 Fixing inconsistent state: #${feature.id}...`);
      feature.status = "failed";
      feature.assigned_sandbox = undefined;
      feature.assigned_at = undefined;
    }
  }
  ```

**Why this step second**: Provides defense-in-depth. Even if step 1 misses an edge case, this prevents premature resets.

#### Step 3: Enhance UI Output Display

Work around E2B stdout buffering by showing task progress from the progress file.

- Open `.ai/alpha/scripts/ui/components/SandboxPanel.tsx`
- Find the output rendering section (displays `recent_output`)
- Enhance to show current task prominently:
  ```typescript
  // Show current task status if available (more reliable than stdout)
  {progress.current_task && (
    <Box marginBottom={1}>
      <Text color="cyan">
        {progress.current_task.status === "in_progress" ? "⚙️" : "⏳"}
        {progress.current_task.id}: {progress.current_task.name}
      </Text>
    </Box>
  )}

  // Then show recent output below (if any)
  {progress.recent_output && progress.recent_output.length > 0 && (
    <Box flexDirection="column">
      <Text dimColor>Output:</Text>
      {progress.recent_output.slice(-5).map((line, i) => (
        <Text key={i} dimColor>{truncate(line, 50)}</Text>
      ))}
    </Box>
  )}
  ```

**Why this step third**: This is a UI enhancement that improves visibility but doesn't fix the core race condition. Safe to do after critical fixes.

#### Step 4: Add Regression Tests

Ensure the race condition cannot reoccur.

- Create test file: `.ai/alpha/scripts/lib/__tests__/work-queue.spec.ts`
- Add unit test for error field clearing:
  ```typescript
  test('assignFeatureToSandbox clears previous error', () => {
    const feature = {
      id: 1367,
      status: 'pending',
      error: 'Previous error message',
      // ... other fields
    };

    assignFeatureToSandbox(feature, 'sbx-a', manifest);

    expect(feature.error).toBeUndefined();
    expect(feature.status).toBe('in_progress');
  });
  ```
- Add test for time-aware inconsistent state handler:
  ```typescript
  test('inconsistent state handler respects time window', () => {
    const recentAssignment = {
      id: 1367,
      status: 'in_progress',
      error: 'Some error',
      assigned_at: Date.now() - 30_000, // 30 seconds ago
      // ...
    };

    const oldAssignment = {
      id: 1368,
      status: 'in_progress',
      error: 'Some error',
      assigned_at: Date.now() - 120_000, // 2 minutes ago
      // ...
    };

    // Recent assignment should NOT be reset
    const feature1 = getNextAvailableFeature({...manifest, feature_queue: [recentAssignment]});
    expect(feature1).toBeNull(); // Still in inconsistent state

    // Old assignment SHOULD be reset and returned
    const feature2 = getNextAvailableFeature({...manifest, feature_queue: [oldAssignment]});
    expect(feature2?.id).toBe(1368);
    expect(feature2?.status).toBe('failed');
  });
  ```

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Manually test the orchestrator with the original spec that exhibited the bug
- Monitor for 10+ minutes to ensure no race conditions occur
- Verify UI shows task progress during execution
- Check that only 3 sandboxes are created and maintained

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ Error field is cleared when feature is assigned
- ✅ Time-aware inconsistent state handler respects 60-second window
- ✅ Old inconsistent states (>60s) are properly reset
- ✅ Recent inconsistent states (<60s) are left alone
- ✅ Regression test: Multiple sandboxes cannot claim same feature

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/work-queue.spec.ts` - Work queue logic and race condition prevention

### Integration Tests

Integration test scenario:
- ✅ Orchestrator with 3 sandboxes and multiple features
- ✅ Simulate sandbox expiration during feature execution
- ✅ Verify feature is reassigned correctly with error cleared
- ✅ Verify no race conditions occur
- ✅ Verify sandbox count remains at 3

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts` - End-to-end orchestrator behavior

### E2E Tests

Not applicable - this is orchestrator-level infrastructure, not user-facing functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator with spec #1362: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Monitor for 10+ minutes
- [ ] Verify UI output shows task progress (not just frozen startup messages)
- [ ] Verify each sandbox works on different features
- [ ] Check sandbox count remains at 3 (run `ps aux | grep -c e2b`)
- [ ] Check manifest after run - no features should have both `in_progress` and `error` set
- [ ] Trigger sandbox expiration scenario (if possible) and verify clean reassignment
- [ ] Check logs directory - should see incremental task output in log files

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Edge case where error field needs to persist**: Low likelihood
   - **Likelihood**: Low
   - **Impact**: Low
   - **Mitigation**: Error information is still written to logs. Manifest only needs status for orchestration.

2. **60-second window too long or too short**: Medium likelihood
   - **Likelihood**: Medium
   - **Impact**: Low
   - **Mitigation**: Make the timeout configurable via constant. Start with 60s, adjust if needed based on real usage.

3. **UI changes break existing display logic**: Low likelihood
   - **Likelihood**: Low
   - **Impact**: Low
   - **Mitigation**: Changes are additive - showing task progress BEFORE recent output. Fallback to recent output if task info unavailable.

**Rollback Plan**:

If this fix causes issues:
1. Revert the 3 file changes (work-queue.ts and SandboxPanel.tsx)
2. Git commit message will make this easy: `git revert <commit-hash>`
3. Manifest files are backwards compatible - no migration needed

**Monitoring**:
- Monitor orchestrator runs for the next week
- Watch for any features stuck in `in_progress` state
- Alert if more than 3 sandboxes are created during a single run
- Check error logs for new race condition patterns

## Performance Impact

**Expected Impact**: None - minimal CPU/memory changes

The changes are pure logic fixes with no performance implications:
- Error field clearing: O(1) operation
- Time check: One timestamp comparison per feature evaluation
- UI enhancement: Already polling progress file, just displaying different data

**Performance Testing**: Not applicable - no performance-sensitive changes.

## Security Considerations

**Security Impact**: None

No security implications - this is internal orchestration logic. No external inputs, no authentication changes, no data exposure.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator - observe the race condition
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# After 5-10 minutes, check manifest for inconsistent state
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | \
  jq '.feature_queue[] | select(.status == "in_progress" and .error != null)'

# Expected: Should find features with both in_progress and error
```

**Expected Result**: Features will have both `status: "in_progress"` and `error: "..."`, indicating inconsistent state. UI output will be frozen at startup messages.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Unit tests
pnpm test .ai/alpha/scripts/lib/__tests__/work-queue.spec.ts

# Integration tests
pnpm test .ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts

# Build (verify no compilation errors)
pnpm build

# Manual verification - run orchestrator for 10 minutes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# After run, verify no inconsistent states exist
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | \
  jq '.feature_queue[] | select(.status == "in_progress" and .error != null)'

# Expected: Should return empty (no features with both in_progress and error)

# Verify sandbox count
ps aux | grep -c "e2b"  # Should be ~3 (plus grep process)

# Check UI progress files show task progress
cat .ai/alpha/progress/sbx-a-progress.json | jq '.current_task'
```

**Expected Result**: All commands succeed, no inconsistent states found, sandbox count remains at 3, UI shows task progress.

### Regression Prevention

```bash
# Run full orchestrator test suite
pnpm test .ai/alpha/scripts

# Check for any new race conditions
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 &
ORCH_PID=$!
sleep 300  # Let it run for 5 minutes
kill -0 $ORCH_PID && echo "Still running" || echo "Crashed"

# Verify manifest integrity
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | \
  jq '.feature_queue[] | select(.status == "in_progress") | .assigned_sandbox' | \
  sort | uniq -c
# Expected: Each feature assigned to at most one sandbox
```

## Dependencies

**No new dependencies required**

All changes use existing libraries and patterns.

## Database Changes

**No database changes required**

This is orchestrator infrastructure - no database modifications needed.

## Deployment Considerations

**Deployment Risk**: Low

This is a local orchestration script (not deployed to production). Changes affect development workflow only.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - manifest format unchanged

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Unit tests for error clearing and time-aware handler pass
- [ ] Integration tests pass
- [ ] Orchestrator runs for 10+ minutes without race conditions
- [ ] UI displays task progress (not just frozen output)
- [ ] Sandbox count remains at 3 throughout run
- [ ] Manifest has no features with both `in_progress` and `error` fields set
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Key Insights from Diagnosis**:
- The error field was set during sandbox expiration but never cleared on re-assignment
- The inconsistent state handler was too aggressive - it reset features immediately upon detecting `in_progress + error`
- E2B stdout buffering is a platform limitation - we work around it by relying on progress file polling

**Related Issues**:
- #1426 - Previous diagnosis of same issues
- #1427 - React import fix (unrelated)
- #1428 - Previous diagnosis (incomplete)
- #1429 - Previous fix attempt (missed error field clearing)

**Why This Fix Will Work**:
1. Addresses root cause directly (error field lifecycle)
2. Adds defense-in-depth (time-aware handler)
3. Improves UX (task progress display)
4. Minimal code changes reduce regression risk
5. Backwards compatible with existing manifests

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1430*
