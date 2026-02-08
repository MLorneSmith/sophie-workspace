# Bug Fix: Alpha Orchestrator UI Events Not Limited to 6

**Related Diagnosis**: #1587 (REQUIRED)
**GitHub Issue**: #1588
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Wrong display constant (8 vs 6), duplicate events in progress files, high storage limit (20)
- **Fix Approach**: Update constants, add deduplication in event_reporter.py, verify UI rendering
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI displays more than 6 events per sandbox column despite Issue #1586's fix. Root cause analysis reveals: (1) `MAX_DISPLAY_EVENTS = 8` instead of 6, (2) duplicate events written to progress files (each event × 2), and (3) `MAX_RECENT_OUTPUT = 20` allows excessive accumulation.

For full details, see diagnosis issue #1587.

### Solution Approaches Considered

#### Option 1: Comprehensive Fix - Constants + Deduplication ⭐ RECOMMENDED

**Description**: Fix all three root causes simultaneously - update display constant to 6, add deduplication logic in `event_reporter.py` to prevent consecutive duplicates, and reduce storage limit to 10.

**Pros**:
- Addresses all identified root causes completely
- Prevents duplicates at the source (event_reporter.py)
- Reduces memory footprint (20 → 10 storage limit)
- No UI changes required (display logic already correct in SandboxColumn)
- Surgical changes with minimal risk

**Cons**:
- Requires changes in two files (types.ts and event_reporter.py)
- Deduplication adds small overhead per event write

**Risk Assessment**: low - Changes are isolated, well-defined, and easily testable. Deduplication is a simple comparison check.

**Complexity**: simple - Three straightforward changes: update constant, add if-check for duplicates, reduce storage limit.

#### Option 2: UI-Only Fix - Display Filtering

**Description**: Leave constants as-is, add deduplication logic in UI components (SandboxColumn and EventLog) to filter consecutive duplicate lines before rendering.

**Pros**:
- No changes to hook infrastructure
- Keeps existing storage behavior
- Simpler from hooks perspective

**Cons**:
- Doesn't fix root cause (duplicates still written to files)
- Wastes storage on duplicate data (8 items for 4 events)
- Higher memory usage in progress files
- Doesn't fix wrong constant (MAX_DISPLAY_EVENTS = 8)
- Band-aid solution that doesn't address underlying issue

**Why Not Chosen**: This is a band-aid that treats symptoms rather than fixing root causes. Duplicates would still consume storage and bandwidth, and the wrong constant would remain.

#### Option 3: Hook Debugging - Find Second Call Source

**Description**: Deep-dive investigation to find why hooks fire twice per event, then remove the second call path entirely.

**Pros**:
- Would eliminate duplicates at the source
- Most "correct" solution architecturally

**Cons**:
- High investigation time with uncertain outcome
- May involve complex hook execution flow analysis
- Could take hours to identify the exact call path
- Risk of breaking hook infrastructure
- Constants would still need updating

**Why Not Chosen**: Over-engineered for the problem scope. The deduplication approach (Option 1) achieves the same result with surgical precision and minimal risk. Investigating hook execution flow is time-intensive with uncertain payoff.

### Selected Solution: Comprehensive Fix - Constants + Deduplication

**Justification**: This approach fixes all identified root causes with minimal changes, low risk, and clear benefits. It's surgical (three specific changes), addresses the problem at the source (event_reporter.py deduplication), and includes the constant corrections that were missed in #1586.

**Technical Approach**:
- Update `MAX_DISPLAY_EVENTS` from 8 to 6 (aligns with commit ab412273b intent)
- Add deduplication check in `update_progress_file()` - compare new event with last entry before appending
- Reduce `MAX_RECENT_OUTPUT` from 20 to 10 (provides 67% buffer over display limit)

**Architecture Changes** (if any):
None - these are configuration and logic refinements within existing architecture.

**Migration Strategy** (if needed):
Not needed - changes take effect immediately. Existing progress files will naturally rotate old duplicates out as new events arrive.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/ui/types.ts:618` - Update `MAX_DISPLAY_EVENTS` from 8 to 6 (align with intended display limit)
- `.claude/hooks/event_reporter.py:36` - Reduce `MAX_RECENT_OUTPUT` from 20 to 10 (prevent excessive accumulation)
- `.claude/hooks/event_reporter.py:159-160` - Add deduplication check before appending to `recent_output` array

### New Files

**No new files required**

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update MAX_DISPLAY_EVENTS constant

Fix the display constant that was missed in commit ab412273b.

- Open `.ai/alpha/scripts/ui/types.ts`
- Locate line 618: `export const MAX_DISPLAY_EVENTS = 8;`
- Change to: `export const MAX_DISPLAY_EVENTS = 6;`
- Add comment explaining: `// Display limit for EventLog (aligned with SandboxColumn limit)`

**Why this step first**: This is the simplest change and aligns the codebase with the stated intent from #1586.

#### Step 2: Reduce MAX_RECENT_OUTPUT limit

Lower the storage limit to reduce memory footprint and accumulation.

- Open `.claude/hooks/event_reporter.py`
- Locate line 36: `MAX_RECENT_OUTPUT = 20  # Keep only last N output lines`
- Change to: `MAX_RECENT_OUTPUT = 10  # Keep only last N output lines`
- Update comment: `# Keep only last N output lines (provides buffer over 6-event display limit)`

#### Step 3: Add deduplication logic

Prevent consecutive duplicate events from being written to progress files.

- Open `.claude/hooks/event_reporter.py`
- Locate the `update_progress_file()` function (around line 130)
- Find the line that appends new output: `progress["recent_output"].append(new_output)` (line 160)
- **Before the append**, add deduplication check:

```python
# Deduplicate: skip if identical to last entry (prevents hook double-firing)
if progress["recent_output"] and progress["recent_output"][-1] == new_output:
    return True  # Already present, skip append
```

- This should be inserted between lines 159 and 160

**Implementation details**:
- Check if array is non-empty: `if progress["recent_output"]`
- Compare with last entry: `progress["recent_output"][-1] == new_output`
- Return early if duplicate to skip append

#### Step 4: Add unit test for deduplication

Verify the deduplication logic works correctly.

- Open `.claude/hooks/test_event_reporter.py`
- Add new test case `test_update_progress_file_deduplicates_consecutive_events`:

```python
def test_update_progress_file_deduplicates_consecutive_events(tmp_path):
    """Test that consecutive identical events are deduplicated."""
    progress_file = tmp_path / ".initiative-progress.json"
    progress_file.write_text(json.dumps({
        "recent_output": ["📖 Read: file1.ts"]
    }))

    with patch("event_reporter.find_progress_file", return_value=str(progress_file)):
        # Try to add the same event again
        result = update_progress_file("📖 Read: file1.ts")
        assert result is True  # Returns success

        # Verify it was NOT added (still only 1 entry)
        progress = json.loads(progress_file.read_text())
        assert len(progress["recent_output"]) == 1
        assert progress["recent_output"] == ["📖 Read: file1.ts"]

        # Add a DIFFERENT event - should be appended
        result = update_progress_file("💻 Bash: pnpm test")
        assert result is True

        progress = json.loads(progress_file.read_text())
        assert len(progress["recent_output"]) == 2
        assert progress["recent_output"] == [
            "📖 Read: file1.ts",
            "💻 Bash: pnpm test"
        ]
```

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Run unit test: `pytest .claude/hooks/test_event_reporter.py::test_update_progress_file_deduplicates_consecutive_events -v`
- Manually verify with Alpha Orchestrator UI
- Check progress files for duplicate patterns

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Deduplication: Consecutive identical events should be skipped
- ✅ Deduplication: Different events should still be appended
- ✅ Deduplication: Empty array should allow first event
- ✅ Edge case: Array rotation respects new MAX_RECENT_OUTPUT limit (10)
- ✅ Regression test: Original bug (events > 6) should not reoccur

**Test files**:
- `.claude/hooks/test_event_reporter.py` - Add `test_update_progress_file_deduplicates_consecutive_events`

### Integration Tests

**Not needed** - this is a pure hook + UI configuration fix with no integration points.

### E2E Tests

**Not needed** - UI behavior is already tested. This fix makes existing behavior work correctly.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Alpha Orchestrator: `/alpha:implement <feature-id>`
- [ ] Observe sandbox columns in TUI
- [ ] Verify "Output:" section shows at most 6 events
- [ ] Verify EventLog section shows at most 6 events
- [ ] Check progress files: no duplicate consecutive entries
- [ ] Let orchestrator run for 5+ minutes, verify events don't exceed 6
- [ ] Verify events rotate correctly (oldest disappear when limit reached)
- [ ] Check progress file size: `recent_output` array has ≤10 items

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Deduplication breaks legitimate consecutive events**: Edge case where user legitimately runs the same tool twice in a row
   - **Likelihood**: low - Unlikely in practice, and even if it happens, the event is still logged (just not displayed twice)
   - **Impact**: low - User might miss seeing a duplicate event, but the action still occurred
   - **Mitigation**: This is acceptable behavior - consecutive identical events are noise, not signal

2. **MAX_DISPLAY_EVENTS change affects other components**: Other UI components might depend on the constant
   - **Likelihood**: low - Grep shows only EventLog and types.ts reference it
   - **Impact**: low - Components would just show 6 instead of 8 events (desired behavior)
   - **Mitigation**: Code review confirms only EventLog uses this constant

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the three changed lines:
   - `MAX_DISPLAY_EVENTS = 8` (types.ts:618)
   - `MAX_RECENT_OUTPUT = 20` (event_reporter.py:36)
   - Remove deduplication check (event_reporter.py:159-160)
2. Commit revert with message: `revert: rollback event limit fix due to [reason]`
3. Push to remote

**Monitoring** (if needed):
- Monitor Alpha Orchestrator sessions for 1-2 days
- Watch for user reports of missing events
- No specific metrics needed - this is a UI display fix

## Performance Impact

**Expected Impact**: minimal positive

The deduplication check adds one array access and one string comparison per event write. This is negligible overhead (~O(1) operation). The reduction in `MAX_RECENT_OUTPUT` from 20 to 10 reduces memory usage by 50% in progress files.

**Performance Testing**:
- Observe orchestrator performance - should be identical or slightly better (less data in progress files)
- No latency impact expected (changes are in file write path, not critical path)

## Security Considerations

**Security Impact**: none

This change only affects event display limits and deduplication logic. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator and observe duplicate events
# (Manual observation - no automated command)

# Check progress file for duplicates
cat .ai/alpha/progress/sbx-b-progress.json | jq '.recent_output'
# Should show duplicate entries like:
# ["💻 Bash: ...", "💻 Bash: ...", "🔍 Grep: ...", "🔍 Grep: ..."]

# Check MAX_DISPLAY_EVENTS constant
grep "MAX_DISPLAY_EVENTS = " .ai/alpha/scripts/ui/types.ts
# Should show: export const MAX_DISPLAY_EVENTS = 8;
```

**Expected Result**: Duplicates in progress files, constant set to 8.

### After Fix (Bug Should Be Resolved)

```bash
# Check MAX_DISPLAY_EVENTS constant updated
grep "MAX_DISPLAY_EVENTS = " .ai/alpha/scripts/ui/types.ts
# Should show: export const MAX_DISPLAY_EVENTS = 6;

# Check MAX_RECENT_OUTPUT reduced
grep "MAX_RECENT_OUTPUT = " .claude/hooks/event_reporter.py
# Should show: MAX_RECENT_OUTPUT = 10

# Check deduplication logic added
grep -A 2 "Deduplicate" .claude/hooks/event_reporter.py
# Should show the deduplication check

# Run unit test
pytest .claude/hooks/test_event_reporter.py::test_update_progress_file_deduplicates_consecutive_events -v

# Type check
pnpm typecheck

# Build
pnpm build

# Run orchestrator and verify
# - Progress files show no consecutive duplicates
# - UI shows at most 6 events per sandbox
# - Events rotate correctly
```

**Expected Result**: All commands succeed, constants updated, deduplication active, no duplicates in progress files, UI displays ≤6 events.

### Regression Prevention

```bash
# Run full Python test suite for hooks
pytest .claude/hooks/test_event_reporter.py -v

# Verify no TypeScript regressions
pnpm typecheck

# Build check
pnpm build
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - changes take effect immediately on next orchestrator run

**Feature flags needed**: no

**Backwards compatibility**: maintained - existing progress files will naturally rotate out old duplicates

## Success Criteria

The fix is complete when:
- [ ] `MAX_DISPLAY_EVENTS = 6` in types.ts
- [ ] `MAX_RECENT_OUTPUT = 10` in event_reporter.py
- [ ] Deduplication logic added and tested
- [ ] Unit test passes for deduplication
- [ ] All validation commands pass
- [ ] Manual testing confirms ≤6 events displayed
- [ ] Progress files show no consecutive duplicates
- [ ] Zero regressions detected

## Notes

**Why deduplication over finding hook call source:**

The diagnosis identified that hooks are firing twice per event, but investigating the exact call path could take hours with uncertain results. The deduplication approach:
- Solves the problem definitively (no duplicates regardless of call count)
- Is surgical and testable (simple if-check)
- Has negligible performance impact
- Works even if hooks fire 3+ times (future-proof)

**Constant alignment:**

Commit ab412273b claimed to "update display limit to 6" but only changed `SandboxColumn.tsx` slice from 3→6. It missed updating `MAX_DISPLAY_EVENTS` constant. This fix completes that work.

**Storage limit rationale:**

`MAX_RECENT_OUTPUT = 10` provides a 67% buffer over the 6-event display limit. This allows for:
- Some rotation before hitting display
- Headroom for different UI components
- Reasonable memory usage (10 strings vs 20)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1587*
