# Bug Fix: Alpha Orchestrator UI Event Limit Not Applied

**Related Diagnosis**: #1585
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Duplicate hook calls to event_reporter.py writing each event twice, and display limit set to 3 instead of 6
- **Fix Approach**: Remove redundant hook call from implement.md and update display limit to 6
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI sandbox columns display up to 12 events instead of the expected 6 due to: (1) duplicate hook calls writing each event twice to progress files, and (2) the display limit being set to 3 instead of 6.

For full details, see diagnosis issue #1585.

### Solution Approaches Considered

#### Option 1: Remove Redundant Hook + Update Display Limit ⭐ RECOMMENDED

**Description**: Remove the duplicate `event_reporter.py` call from `implement.md` PostToolUse hook (lines 7-12) since `task_progress_stream.py` already handles event reporting when `ORCHESTRATOR_URL` is set. Also update `SandboxColumn.tsx` to display 6 events instead of 3.

**Pros**:
- Surgical fix addressing both root causes
- No architecture changes needed
- Zero performance impact
- Eliminates waste (duplicate event processing)
- Simple to implement and test
- Fixes the duplication at the source

**Cons**:
- Requires understanding hook execution order
- Need to verify task_progress_stream.py covers all cases

**Risk Assessment**: low - This is a configuration change that removes redundancy. The event reporting functionality remains intact through task_progress_stream.py. If ORCHESTRATOR_URL is not set (local dev), events won't be reported, but that's already the current behavior for task_progress_stream.py.

**Complexity**: simple - Remove 6 lines from implement.md, change one number in SandboxColumn.tsx, update one comment.

#### Option 2: Add Deduplication Logic to event_reporter.py

**Description**: Keep both hook calls but add deduplication logic in `event_reporter.py` to detect and skip duplicate writes within a short time window.

**Pros**:
- Defensive approach that handles duplicates regardless of source
- Could catch duplicates from other sources
- Keeps existing hook structure

**Cons**:
- More complex implementation (need timing/hashing logic)
- Adds runtime overhead on every event
- Doesn't address the root waste (still calling reporter twice)
- Harder to maintain
- Requires shared state or file-based deduplication

**Why Not Chosen**: This treats the symptom rather than the cause. The duplicate hook calls waste CPU cycles even if we deduplicate. It's architecturally cleaner to eliminate the redundancy.

#### Option 3: Consolidate All Event Reporting into One Hook Script

**Description**: Create a new unified event reporting hook that handles all event types, replacing both `event_reporter.py` and `task_progress_stream.py`.

**Pros**:
- Single source of truth for event reporting
- Could optimize event batching
- Cleaner architecture long-term

**Cons**:
- Much larger scope (requires refactoring multiple hooks)
- Higher risk of breaking existing functionality
- Over-engineering for this specific bug
- Would delay the fix significantly

**Why Not Chosen**: This is a good long-term refactoring but overkill for fixing the immediate bug. The recommended approach (Option 1) solves the problem with minimal risk.

### Selected Solution: Remove Redundant Hook + Update Display Limit

**Justification**: Option 1 is the optimal fix because it:
1. Addresses both root causes with minimal code changes
2. Eliminates wasteful duplicate processing
3. Has zero performance risk (removing work is always safe)
4. Maintains existing functionality through task_progress_stream.py
5. Is easy to test and verify
6. Has a trivial rollback path if needed

**Technical Approach**:
- Remove lines 7-12 from `.claude/commands/alpha/implement.md` (the PostToolUse hook calling event_reporter.py directly)
- Update line 293 in `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` from `slice(0, 3)` to `slice(0, 6)`
- Update the comment on line 289 from "capped to 3 items" to "capped to 6 items"
- Verify `task_progress_stream.py` continues to call `event_reporter.py` when ORCHESTRATOR_URL is set

**Architecture Changes**: None - we're removing redundancy, not changing architecture.

**Migration Strategy**: Not needed - this is a code-only fix with no data migration.

## Implementation Plan

### Affected Files

- `.claude/commands/alpha/implement.md` - Remove lines 7-12 (redundant PostToolUse hook for event_reporter.py)
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Change line 293 from `slice(0, 3)` to `slice(0, 6)` and update comment on line 289

### New Files

**No new files required**

### Step-by-Step Tasks

#### Step 1: Remove redundant hook from implement.md

Remove the duplicate event reporting hook to eliminate duplicate writes.

- Read `.claude/commands/alpha/implement.md`
- Remove lines 7-12 (the PostToolUse hook with matcher "" that calls event_reporter.py)
- Keep lines 13-17 (the PostToolUse hook with matcher "TodoWrite" that calls task_progress_stream.py)
- Verify the file parses correctly (YAML syntax)

**Why this step first**: This stops the duplication at its source. Once removed, new events won't be duplicated (though existing progress files will still have duplicates until they naturally rotate out).

#### Step 2: Update display limit to 6 events

Change the SandboxColumn component to display 6 events instead of 3.

- Read `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`
- Change line 293 from `{state.recentOutput.slice(0, 3).map((line) => (` to `{state.recentOutput.slice(0, 6).map((line) => (`
- Update comment on line 289 from `{/* Recent Output Lines (from log file) - capped to 3 items for UI space */}` to `{/* Recent Output Lines (from log file) - capped to 6 items for UI space */}`

#### Step 3: Add regression tests

Add tests to prevent this bug from recurring.

- Add test to `.ai/alpha/scripts/ui/__tests__/SandboxColumn.spec.ts` verifying that when more than 6 events exist, only 6 are displayed
- Update existing test "limits recent output to 3 lines" (line 225) to "limits recent output to 6 lines" with 8 input events

#### Step 4: Clean up existing duplicate progress files (optional)

If desired, clean duplicates from existing progress files (though they'll naturally rotate out).

- This is optional - duplicates will naturally be replaced as new events come in
- If cleaning: read each progress file, deduplicate consecutive identical entries, write back
- Skip if not critical (duplication stops after Step 1)

#### Step 5: Validation

Run all validation commands and verify the fix works.

- Run `pnpm typecheck` - must pass
- Run `pnpm lint` - must pass
- Run `pnpm format` - must pass
- Run unit tests for SandboxColumn component
- Manually test by running orchestrator and observing sandbox columns
- Verify events no longer duplicate in progress files
- Verify exactly 6 events display (not 3, not 12)

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ SandboxColumn displays exactly 6 events when 8+ are provided
- ✅ SandboxColumn displays all events when fewer than 6 exist
- ✅ Regression test: Events are not duplicated in display (consecutive identical events should display as one)

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/SandboxColumn.spec.ts` - Update "limits recent output to 3 lines" test to verify 6-event limit

### Integration Tests

Integration test to verify hook behavior:
- ✅ Verify task_progress_stream.py calls event_reporter.py when ORCHESTRATOR_URL is set
- ✅ Verify event_reporter.py is NOT called twice for the same event
- ✅ Verify recent_output in progress files does not contain consecutive duplicates after fix

**Test files**:
- `.claude/hooks/__tests__/test_hook_integration.py` - New integration test (optional, can be manual)

### E2E Tests

Not needed - this is a UI display fix with no user journey impact.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>`
- [ ] Observe sandbox columns during execution
- [ ] Verify "Output:" section shows exactly 6 events (not 3, not 12)
- [ ] Check progress files (`.ai/alpha/progress/sbx-*-progress.json`) after some tools run
- [ ] Verify no consecutive duplicate entries in `recent_output` array
- [ ] Let orchestrator run for a while to accumulate events
- [ ] Confirm display stays at 6 events maximum
- [ ] Verify events shown are the 6 most recent (newest first)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Event reporting stops working entirely**
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: We're only removing the redundant call. `task_progress_stream.py` continues to call `event_reporter.py` when ORCHESTRATOR_URL is set (which it always is in E2B sandboxes). We'll verify this in testing.

2. **Display shows wrong number of events**
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: This is a simple constant change (3 → 6). Unit tests will catch any issues. Visual inspection during manual testing will confirm.

3. **Existing progress files retain duplicates**
   - **Likelihood**: high
   - **Impact**: low
   - **Mitigation**: This is expected and acceptable. Duplicates will naturally rotate out as new events replace old ones (MAX_RECENT_OUTPUT=20 limit). Optionally run cleanup script if immediate cleanup is desired.

**Rollback Plan**:

If this fix causes issues:
1. Revert `.claude/commands/alpha/implement.md` - restore lines 7-12
2. Revert `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - change back to `slice(0, 3)`
3. Restart any running orchestrator instances
4. Progress files will self-heal on next run

**Monitoring**:
- After deploying, monitor first orchestrator run
- Check progress files for duplicates
- Verify UI displays correct count
- Watch for any errors in event_reporter.py logs

## Performance Impact

**Expected Impact**: minimal improvement

Removing the redundant hook call eliminates ~50% of event_reporter.py executions, reducing CPU usage slightly. The change from displaying 3 to 6 events has negligible rendering cost.

**Performance Testing**:
- Monitor orchestrator execution time before/after
- Expected: no measurable difference (savings are in microseconds per event)

## Security Considerations

**Security Impact**: none

No security implications - this is a UI display fix and event deduplication.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# After some tools execute, check progress file
cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output'

# Observe UI - events in "Output:" section should show duplicates and exceed 6
```

**Expected Result**: Progress file shows consecutive duplicates, UI may show up to 12 events.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for SandboxColumn
pnpm --filter @slideheroes/alpha-scripts vitest run ui/__tests__/SandboxColumn.spec.ts

# Build (if TypeScript compilation needed)
pnpm --filter @slideheroes/alpha-scripts build

# Manual verification - start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>

# After running, check progress file
cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output | length'
cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output'

# Verify no consecutive duplicates and UI shows max 6 events
```

**Expected Result**: All commands succeed, no duplicates in progress files, UI displays exactly 6 events.

### Regression Prevention

```bash
# Run full test suite for alpha-scripts
pnpm --filter @slideheroes/alpha-scripts vitest run

# Verify hook configuration is valid YAML
cat .claude/commands/alpha/implement.md | head -30

# Additional verification - ensure task_progress_stream.py still exists and works
python3 .claude/hooks/task_progress_stream.py < /dev/null || echo "Hook should exit cleanly with no input"
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps required
- Changes are code-only (config file + UI component)
- No database migrations needed
- No environment variable changes needed

**Feature flags needed**: no

**Backwards compatibility**: maintained - this fix is fully backwards compatible

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] No consecutive duplicate entries appear in progress files after fix
- [ ] SandboxColumn displays exactly 6 events when 6+ exist
- [ ] SandboxColumn displays all events when fewer than 6 exist
- [ ] Unit tests pass (updated test for 6-event limit)
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)
- [ ] Zero regressions detected

## Notes

**Implementation Notes**:
- The fix is intentionally minimal to reduce risk
- Existing progress files may retain duplicates until natural rotation (acceptable)
- The deduplication only applies going forward (new events won't duplicate)
- If immediate cleanup of existing duplicates is desired, an optional Step 4 can clean progress files, but this is not required

**Why 6 Events?**:
- User explicitly requested 6 events
- 6 provides good visibility without cluttering the UI
- Previous attempts used 3 (too few) and code allowed up to 20 (too many with duplicates)
- 6 is the sweet spot for the current terminal layout

**Related Documentation**:
- Diagnosis report: `.ai/reports/bug-reports/2026-01-19/1585-diagnosis-alpha-ui-event-limit.md`
- Previous fix attempts: #1568 (fixed ordering, didn't address duplication)
- Related issues: #1572 (event ordering)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1585*
