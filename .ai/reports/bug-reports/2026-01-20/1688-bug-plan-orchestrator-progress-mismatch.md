# Bug Fix: Alpha Orchestrator Progress UI Mismatch and Stall Detection

**Related Diagnosis**: #1686 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Dual source of truth between manifest-based overall progress and sandbox-specific progress files, combined with fallback task ID generation and missing stall detection logic
- **Fix Approach**: Unified progress calculation, remove fallback ID generation, fix task total calculation, add stuck task detection
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator UI exhibits multiple interrelated progress tracking issues:

1. **Progress Bar Mismatch**: Overall Progress shows 101/101 tasks completed while individual sandbox shows 18/19 or 5/19, indicating a calculation mismatch between two sources of truth (manifest vs sandbox progress files)

2. **Misleading Task IDs**: Events reference non-existent Task IDs like "T21" due to fallback ID generation when tasks lack explicit IDs

3. **Inconsistent Task Totals**: The `tasksTotal` calculation doesn't account for pending tasks, resulting in incomplete progress tracking

4. **Sandbox Stall Without Recovery**: Sandbox-a completed Task T4 with `current_task: null` but never picked up Task T5 (which had satisfied dependencies), causing the feature to hang indefinitely without error

For full details, see diagnosis issue #1686.

### Solution Approaches Considered

#### Option 1: Unified Progress State from Manifest ⭐ RECOMMENDED

**Description**: Make the manifest the single source of truth for progress. Update `writeOverallProgress()` to include pending tasks from in-progress features (not just completed ones). Simplify sandbox progress aggregation to use manifest state as the baseline.

**Pros**:
- Eliminates dual source of truth problem
- Manifest is already authoritative for feature/initiative state
- Easier to reason about overall system state
- Fix is surgical and localized to `manifest.ts` and `useProgressPoller.ts`

**Cons**:
- Requires understanding manifest structure across the codebase
- May need to trace how `tasks_completed` field gets populated in manifest

**Risk Assessment**: medium - Changes only observation/aggregation, not core orchestration logic

**Complexity**: moderate - Involves understanding how manifest tasks are tracked

#### Option 2: Sandbox as Primary Source with Periodic Manifest Sync

**Description**: Keep sandbox progress files as real-time source of truth, but periodically sync back to manifest. Have `writeOverallProgress()` read directly from sandbox progress files instead of manifest.

**Pros**:
- Real-time progress tracking
- Sandbox state is always fresh

**Cons**:
- Adds complexity with sync logic
- Requires coordination between multiple write points
- Higher risk of race conditions
- More invasive changes to core orchestration flow

**Why Not Chosen**: Option 1 is simpler and aligns with existing architecture where manifest is authoritative.

#### Option 3: Event-Based Progress Updates

**Description**: Emit structured events from orchestrator that flow through a central progress aggregator, eliminating both dual sources.

**Pros**:
- Most elegant long-term solution
- Proper event-driven architecture

**Cons**:
- Significant refactoring required
- Too complex for a bug fix (would be a rewrite)
- High implementation risk

**Why Not Chosen**: Out of scope for bug fix. Better as separate architectural improvement.

### Selected Solution: Unified Progress State from Manifest

**Justification**: This approach fixes all four issues with minimal changes:
- Issue A (mismatch) - Fixed by including in-progress task counts in manifest calculation
- Issue B (Task T21) - Fixed by ensuring all tasks have valid IDs before events
- Issue C (101/101 vs 18/19) - Fixed by accounting for pending tasks
- Issue D (stall) - Fixed by adding stuck task detection in orchestrator

The manifest is already the system's authoritative state store. Making progress calculation fully manifest-based aligns with existing architecture and eliminates the root cause of most issues.

**Technical Approach**:

1. **In `manifest.ts:writeOverallProgress()`**:
   - Expand task count calculation to include `tasks_completed` from **all** features (both completed and in-progress)
   - Keep the manifest as the single source of truth
   - Preserve the existing defensive capping logic

2. **In `useProgressPoller.ts:progressToSandboxState()`**:
   - Remove the fallback ID generation (`T${completedCount + 1}`)
   - Use "Unknown" for tasks without explicit IDs, or skip event generation
   - Read `tasksTotal` from manifest's feature definition instead of inferring from state

3. **In `orchestrator.ts`**:
   - Add stuck task detection loop that runs after each feature assignment
   - Detect: feature has pending tasks but sandbox has `current_task: null`
   - Action: Re-query available tasks for that sandbox or log diagnostic info

4. **In `work-queue.ts` (if needed)**:
   - Ensure task dependency resolution properly checks for satisfied dependencies
   - Verify stuck tasks get picked up on next work-queue check

**Architecture Changes**: None required. All changes are internal to existing modules.

**Migration Strategy**: Not needed - this is a pure bug fix with no data model changes.

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/web/supabase/migrations/` - No changes (no database schema changes)
- `.ai/alpha/scripts/lib/manifest.ts:writeOverallProgress()` - Update task count calculation to include in-progress features
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:progressToSandboxState()` - Remove fallback task ID generation, fix tasksTotal
- `.ai/alpha/scripts/lib/orchestrator.ts` - Add stuck task detection
- `.ai/alpha/scripts/lib/work-queue.ts` - Verify task pickup logic (read-only review)

### New Files

No new files required for this fix.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Overall Progress Calculation in manifest.ts

Update `writeOverallProgress()` to include tasks from in-progress features in addition to completed features.

- Read current task counting logic (lines 833-835)
- Modify to sum `tasks_completed` from **all** features (not just completed ones)
- Keep defensive capping logic to prevent > 100% scenarios
- Add inline comment explaining the change

**Why this step first**: This is the root cause of the mismatch. Fixing it provides immediate correctness.

#### Step 2: Fix Task ID Generation in useProgressPoller.ts

Remove fallback task ID generation that creates misleading "T21" references.

- Locate fallback ID logic (line 364)
- Remove `|| \`T${completedCount + 1}\`` fallback
- Use explicit task ID or "Unknown" if missing
- Consider logging a warning when tasks lack IDs for diagnostic purposes

**Why this step second**: Eliminates the T21 problem and prevents event confusion.

#### Step 3: Fix tasksTotal Calculation in useProgressPoller.ts

Update the calculation to account for pending tasks from the manifest.

- Current logic: `tasksCompleted + failedCount + (progress.current_task ? 1 : 0)` (lines 391-394)
- This misses pending tasks in the feature
- Need to read the feature's total task count from manifest if available
- Fall back to current calculation if manifest data unavailable
- Preserve the "stabilize to prevent flicker" logic

**Why this step third**: Fixes the 18/19 vs 5/19 discrepancy.

#### Step 4: Add Stuck Task Detection in orchestrator.ts

Add detection for sandboxes with no current work but features have pending tasks.

- After work assignment loop in main orchestrator loop
- Check each feature in manifest for: `status === "in_progress" && uncompletedTasks > 0`
- Check sandbox assigned to feature: `currentTask === null`
- Log diagnostic info or trigger re-assignment
- Consider adding to retry/backoff logic if needed

**Why this step fourth**: Prevents indefinite stalls when task pickup fails.

#### Step 5: Add/Update Tests

Add/update tests to prevent regressions on these specific issues.

- Test: Overall progress includes in-progress feature tasks
- Test: Task IDs are always present (no fallback generation)
- Test: tasksTotal increases when new tasks discovered
- Test: Stuck task detection triggers when appropriate
- Test: End-to-end orchestrator run completes without stalling

**Validation**: All tests pass, no new failures introduced.

#### Step 6: Validation

Run all validation commands to ensure fixes are correct.

- TypeScript type checking
- Code formatting and linting
- Unit tests for progress calculation
- Manual orchestrator run (if E2B setup available)

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `writeOverallProgress()` includes tasks from in-progress features
- ✅ `progressToSandboxState()` doesn't generate fallback task IDs
- ✅ `tasksTotal` calculation accounts for pending tasks
- ✅ Stuck task detection identifies blocked features correctly
- ✅ Task dependency resolution properly checks satisfied dependencies

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/manifest.test.ts` - Progress calculation tests
- `.ai/alpha/scripts/ui/hooks/__tests__/useProgressPoller.test.ts` - State conversion tests
- `.ai/alpha/scripts/lib/__tests__/orchestrator.test.ts` - Stuck detection tests

### Integration Tests

- Run full orchestrator cycle with test spec
- Verify progress numbers remain consistent throughout
- Verify no task ID generation errors in events
- Verify feature completion triggers properly
- Verify stalled features are detected and handled

### E2E Tests

- If Playwright/E2E testing available, verify UI displays correct progress
- Verify progress bars match actual task counts
- Verify no stalls during typical feature implementation

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create test spec with 3-5 initiatives and 10-15 features
- [ ] Run orchestrator and observe progress tracking
- [ ] Verify Overall Progress count == sum of individual task counts
- [ ] Observe that no "T21" or other phantom task IDs appear in events
- [ ] Verify progress bars show reasonable X/Y task counts
- [ ] Verify all features complete without stalling
- [ ] Check logs for any "Unknown" task ID warnings
- [ ] Verify completion screen appears when all features done
- [ ] No console errors or warnings related to progress

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Manifest State Lag**: Progress counts are now based on manifest state rather than real-time sandbox files
   - **Likelihood**: low
   - **Impact**: medium (counts may lag behind sandbox activity by a poll interval)
   - **Mitigation**: This is acceptable - manifest is authoritative. Manifest gets updated when features complete, not continuously. This is the correct behavior.

2. **Incomplete Task Information**: Removing fallback ID generation may expose missing task ID bugs elsewhere
   - **Likelihood**: medium
   - **Impact**: low (will show "Unknown" instead of phantom ID)
   - **Mitigation**: Add logging to detect tasks without IDs, fix at source

3. **tasksTotal Fluctuation**: Changing how tasksTotal is calculated could affect UI stability
   - **Likelihood**: low
   - **Impact**: low (flicker in progress bar display)
   - **Mitigation**: Preserve existing "stabilize to prevent flicker" logic

4. **Stuck Task Detection False Positives**: Detection logic might incorrectly flag features as stuck
   - **Likelihood**: low (dependencies are well-structured)
   - **Impact**: medium (could trigger unnecessary recovery)
   - **Mitigation**: Start with logging only, add manual verification before auto-recovery

**Rollback Plan**:

If this fix causes issues in production:

1. Revert changes to `manifest.ts:writeOverallProgress()` to previous task counting logic
2. Revert changes to `useProgressPoller.ts` to restore fallback ID generation
3. Disable stuck task detection in orchestrator.ts
4. Rebuild and restart orchestrator
5. Verify progress tracking returns to previous behavior (even if imperfect)

**Monitoring** (if needed):
- Monitor orchestrator logs for "Unknown task ID" warnings (indicates missing task metadata)
- Track feature completion times for unexplained delays
- Alert if overall progress doesn't reach 100% within expected timeframe

## Performance Impact

**Expected Impact**: none

Changes are localized to progress calculation and state aggregation logic. No algorithmic changes to core orchestration. Performance should be identical or slightly improved (fewer fallback ID generations).

## Security Considerations

No security implications. Changes are limited to progress tracking and UI state management. No external APIs, data exposure, or privilege escalation concerns.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with test spec
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1656

# Observe progress UI:
# - Note if Overall Progress shows 101/101 while sandbox shows 18/19
# - Check for "T21" or other phantom task IDs in logs
# - Watch if sandbox-a stalls with heartbeat timeout
```

**Expected Result**: Bug manifests as described - progress mismatch, phantom task IDs, stalling

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if test files exist)
pnpm test --filter @kit/alpha

# Manual verification
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1656

# Verify fixes:
# - Overall Progress count matches sum of individual task counts
# - No "T21" or phantom task IDs in logs
# - All features complete without stalling
# - Completion screen appears when done
```

**Expected Result**: All commands succeed, bug is resolved, progress tracking is accurate throughout orchestrator run.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run orchestrator multiple times with different spec sizes
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1656
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1657
# ... verify consistent behavior across runs

# Check logs for any new error patterns
grep -E "(error|Error|ERROR)" .ai/logs/run-*.log | head -20
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (purely internal logic changes)

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Bug no longer reproduces (progress counts are consistent)
- [ ] No phantom task IDs (T21) generated in logs
- [ ] Sandbox stalling is detected and resolved
- [ ] All unit tests pass
- [ ] Manual testing checklist all items checked
- [ ] Code review approved
- [ ] No performance degradation
- [ ] No new console errors or warnings

## Notes

**Key Implementation Details**:

1. **Manifest Task Tracking**: The manifest's `feature_queue` contains feature entries with `tasks_completed` field. This is updated when features complete. The fix makes this the authoritative source instead of trying to infer from sandbox progress files.

2. **Task Dependency Resolution**: Task T5 in the diagnosis has dependencies on T1, T2, T4. Verify that the dependency resolution in `work-queue.ts` properly evaluates these before marking a task as eligible for pickup.

3. **Progress File Polling**: The UI polls both `overall-progress.json` and `sbx-*-progress.json` files. The fixes ensure these are consistent by making them derived from the same manifest source.

4. **Stall Detection Strategy**: The stuck task detector should run after each work assignment cycle. It checks if any feature is in-progress with pending tasks but no sandbox is working on those tasks.

**Related Documentation**:
- Alpha Orchestrator Overview: `.ai/alpha/scripts/README.md`
- Manifest Structure: `.ai/alpha/scripts/lib/manifest.ts`
- Work Queue Logic: `.ai/alpha/scripts/lib/work-queue.ts`

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1686*
