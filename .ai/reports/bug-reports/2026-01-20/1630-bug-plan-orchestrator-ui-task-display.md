# Bug Fix: Orchestrator UI Task Display Inconsistency

**Related Diagnosis**: #1629 (REQUIRED)
**Severity**: low
**Bug Type**: ui
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `task_progress.py` hook only sets `current_task.id` when todo content matches a "T#" pattern, leaving it undefined for other task descriptions
- **Fix Approach**: Improve `task_progress.py` ID extraction with fallback ID generation + UI defensive rendering
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator UI displays task information inconsistently across sandbox columns. Some tasks show a spinner with "T#" (e.g., "T1"), others show the full semantic ID without a spinner (e.g., "S1607.I4.F1.T1"), and some show only a spinner with no ID at all.

The root cause is that `task_progress.py` only sets `current_task.id` when the todo content matches a "T#" or "[T#]" pattern. When tasks don't have this pattern (like "Load feature context and tasks.json"), the ID is never set, and the UI renders it as empty.

For full details, see diagnosis issue #1629.

### Solution Approaches Considered

#### Option 1: Improve `task_progress.py` ID extraction ⭐ RECOMMENDED

**Description**: Enhance the `task_progress.py` hook to:
1. Try existing pattern matching (T#, [T#])
2. If that fails, extract ID from `activeForm` field using the same pattern
3. If still no match, generate a placeholder ID based on todo index or content hash
4. Additionally, add defensive rendering in the UI to handle undefined IDs gracefully

**Pros**:
- Fixes the data source rather than masking the issue in UI
- Ensures progress file always has meaningful task IDs
- Minimal changes to existing pattern matching logic
- Addresses both sources of task IDs (hook and implement command)

**Cons**:
- Requires understanding both `task_progress.py` and `useProgressPoller.ts` data transformation
- Placeholder IDs might be less meaningful than actual task IDs

**Risk Assessment**: low - Changes are isolated to ID extraction logic with clear fallback behavior

**Complexity**: simple - Pattern matching logic with straightforward fallback

#### Option 2: Make UI handle undefined ID gracefully

**Description**: Update `SandboxColumn.tsx` to check if `id` is undefined and display the task name instead.

**Pros**:
- Minimal code change (just defensive null check)
- Shows meaningful task name when ID is missing

**Cons**:
- Doesn't fix the underlying data inconsistency issue
- Masks the root cause rather than solving it
- Different display states still persist (some IDs, some names)

**Why Not Chosen**: This approach only masks the symptom. The real issue is that task IDs aren't being captured consistently in the progress file. The UI fix alone won't help if downstream tools rely on having IDs in the progress data.

#### Option 3: Ensure `/alpha:implement` always writes task ID

**Description**: Modify the `alpha:implement` command to always include task ID from tasks.json when writing progress updates.

**Pros**:
- Uses authoritative source (tasks.json) rather than pattern matching
- Guarantees complete ID information

**Cons**:
- Requires changes to implement command workflow
- Doesn't fix IDs from the `task_progress.py` hook path
- More complex to implement

**Why Not Chosen**: While this would help with implement-generated progress, it doesn't fix the hook-based progress updates. A combined approach (Options 1 + defensive UI) is more complete.

### Selected Solution: Improve ID Extraction + Defensive UI Rendering

**Justification**: This approach:
1. Fixes the data consistency issue at the source (progress file always has meaningful IDs)
2. Adds defensive UI rendering as safety net
3. Is simple to implement with minimal code changes
4. Addresses both hook-based and implement-based task tracking
5. Maintains low risk by using fallback logic only when necessary

**Technical Approach**:

1. **Enhance `task_progress.py` ID extraction**:
   - Keep existing pattern matching for "T#" and "[T#]"
   - Add fallback to extract ID from `activeForm` field (if available)
   - If still no match, generate placeholder ID from todo index or task name hash
   - Ensure `current_task.id` is always set

2. **Add defensive rendering in `SandboxColumn.tsx`**:
   - Check if `currentTask.id` is defined before rendering
   - Show task name or "Working..." placeholder if ID is missing
   - Prevents blank displays even if hook doesn't set ID

3. **Improve type safety in `useProgressPoller.ts`**:
   - Ensure ID field mapping handles undefined values
   - Add fallback for missing ID in progress data transformation

## Implementation Plan

### Affected Files

- `.claude/hooks/task_progress.py` - Enhance ID extraction logic (lines 77-101)
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Add defensive ID rendering (lines 236-254)
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Ensure safe ID mapping (lines 359-371)

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Enhance task_progress.py ID extraction

Update the task ID extraction logic to use multiple fallback strategies:
- First: Try pattern matching on `content` field (existing behavior)
- Second: Try pattern matching on `activeForm` field (new fallback)
- Third: Generate placeholder ID from todo metadata
- Always ensure `current_task.id` is set before writing progress

**Why this step first**: This is the core fix that addresses the root cause. Must be implemented before UI changes.

**Subtasks**:
- Add function to extract task ID from multiple sources
- Implement fallback ID generation (index-based or hash-based)
- Update progress file writing to always include ID
- Test with various todo content formats

#### Step 2: Add defensive ID rendering in SandboxColumn.tsx

Add null/undefined checks before rendering task ID:
- Check if `currentTask.id` exists before rendering
- Show task name or "Working..." when ID is missing
- Maintain spinner display for in_progress status regardless of ID

**Why this step second**: Provides safety net UI rendering as backup to the hook fix.

**Subtasks**:
- Add conditional rendering based on ID existence
- Choose fallback text (task name or placeholder)
- Test rendering with and without ID values
- Ensure spinner displays correctly in all cases

#### Step 3: Improve ID mapping in useProgressPoller.ts

Ensure task ID field is safely mapped from progress data:
- Add fallback handling in TaskInfo type transformation
- Ensure undefined IDs don't break data transformations
- Add logging for debugging ID extraction issues

**Why this step third**: Ensures data pipeline handles edge cases properly.

**Subtasks**:
- Review and update TaskInfo type mapping
- Add fallback for missing ID field
- Add debug logging for ID extraction
- Test data transformation with various progress formats

#### Step 4: Add comprehensive tests

Create tests to verify the fix:
- Unit test: ID extraction with various todo formats
- Unit test: ID rendering with undefined values
- Integration test: Full progress update flow
- Regression test: Verify spinner still shows during in_progress

**Subtasks**:
- Create unit tests for ID extraction logic
- Create component tests for SandboxColumn rendering
- Add integration tests for progress polling
- Update existing tests if needed

#### Step 5: Manual testing and validation

Run the orchestrator and verify consistent task display:
- Run spec orchestrator with S1607 (or similar)
- Verify all tasks show consistent ID display
- Verify spinner animates for in_progress tasks
- Check progress file contains IDs for all tasks

**Why this step last**: Validates the complete fix before considering it done.

**Subtasks**:
- Set up orchestrator with test spec
- Monitor sandbox columns during execution
- Inspect progress file for ID consistency
- Verify no regressions in other UI elements

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ ID extraction from "T1: Task name" format
- ✅ ID extraction from "[T1] Task name" format
- ✅ ID extraction from `activeForm` field when content pattern fails
- ✅ Fallback ID generation when no pattern matches
- ✅ Task ID always present in progress file
- ✅ Regression test: Spinner displays for in_progress tasks

**Test files**:
- `.claude/hooks/test_task_progress.py` - ID extraction tests
- `.ai/alpha/scripts/ui/components/__tests__/SandboxColumn.spec.tsx` - Rendering tests

### Integration Tests

- ✅ Progress update flow: TodoWrite → task_progress.py → progress file → UI
- ✅ Handling of mixed task ID sources (hook + implement command)
- ✅ Multiple sandboxes with concurrent task updates

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/integration-progress.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator: `npx tsx .ai/alpha/scripts/spec-orchestrator.ts --spec-id S1607 --ui`
- [ ] Verify all tasks display with consistent IDs (no blank IDs)
- [ ] Verify spinner animates for in_progress tasks
- [ ] Verify tasks complete and spinner stops
- [ ] Inspect `.initiative-progress.json` - all tasks should have `id` field
- [ ] Test with multiple concurrent sandboxes
- [ ] Verify no new console errors or warnings
- [ ] Check that task names display correctly in all cases

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **ID extraction changes produce unexpected IDs**: Fallback ID generation might not match expected formats
   - **Likelihood**: low - Using todo index or content hash is deterministic
   - **Impact**: low - Placeholder IDs are better than missing IDs
   - **Mitigation**: Log extracted IDs, add comprehensive tests, validate against real task names

2. **Performance impact from ID extraction logic**: Adding multiple fallback checks might slow down hook execution
   - **Likelihood**: low - Pattern matching is fast, only runs once per task
   - **Impact**: low - Progress updates are not performance-critical
   - **Mitigation**: Profile hook execution, keep fallback logic simple

3. **Data format changes break downstream consumers**: If other tools rely on specific progress file format
   - **Likelihood**: low - Only adding ID field that should already exist
   - **Impact**: low - Change is additive, existing fields unchanged
   - **Mitigation**: Check for any code consuming `.initiative-progress.json`, update if needed

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.claude/hooks/task_progress.py` to original pattern matching only
2. Remove defensive ID checks from `SandboxColumn.tsx`
3. Redeploy orchestrator
4. Tasks will display with blank IDs for non-matching patterns, but orchestrator will still function

**Monitoring** (if needed):
- Monitor for missing or placeholder IDs in progress files
- Watch for any console errors in orchestrator UI during execution
- Alert if more than 10% of tasks show placeholder IDs (indicates pattern matching needs improvement)

## Performance Impact

**Expected Impact**: none

The changes are minimal:
- ID extraction adds one or two extra pattern checks (negligible)
- UI rendering adds a null check (negligible)
- No data structure changes
- No additional API calls or database queries

**Performance Testing**:
- Measure hook execution time before/after (should be <1ms difference)
- Verify UI render time unchanged (components rerender same number of times)

## Security Considerations

**Security Impact**: none

- No input validation changes needed (todo content already validated)
- No auth/permissions changes
- No new data exposure

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator and observe UI
npx tsx .ai/alpha/scripts/spec-orchestrator.ts --spec-id S1607 --ui

# Monitor progress file for missing IDs
watch -n 1 'cat .initiative-progress.json | jq .current_task'
```

**Expected Result**: Some tasks show `"id": null` or missing `id` field entirely

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run unit tests for task progress
pnpm --filter @kit/ui test task_progress

# Run integration tests
pnpm --filter @kit/ui test integration-progress

# Manual verification
npx tsx .ai/alpha/scripts/spec-orchestrator.ts --spec-id S1607 --ui

# Inspect progress file
cat .initiative-progress.json | jq '.current_task | {id, name, status}'
```

**Expected Result**:
- All validation commands succeed
- Progress file consistently shows `id` field for all tasks
- UI displays all task IDs (no blank IDs)
- Spinner animates for in_progress tasks

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific focus on orchestrator UI tests
pnpm --filter @kit/ui test --grep "SandboxColumn|useProgressPoller"

# Visual inspection of orchestrator UI
npx tsx .ai/alpha/scripts/spec-orchestrator.ts --spec-id S1607 --ui
# Manually verify: no visual regressions, all elements render correctly
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependencies

- Uses existing pattern matching libraries
- Uses existing React components (no new UI libraries)

## Database Changes

**No database changes required**

The fix only affects in-memory progress tracking and UI rendering. No database schema or migrations needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps required
- Changes are isolated to orchestrator tooling
- Can be deployed independently
- No backwards compatibility concerns

**Feature flags needed**: no

**Backwards compatibility**: maintained

Changes are additive:
- `task_progress.py` always sets ID (previously sometimes missing)
- `SandboxColumn.tsx` handles undefined ID (previously crashed/rendered blank)
- No breaking changes to data structures or APIs

## Success Criteria

The fix is complete when:
- [ ] `task_progress.py` always sets `current_task.id` for all tasks
- [ ] `SandboxColumn.tsx` renders ID consistently for all tasks
- [ ] Progress file inspection shows ID field for all tasks
- [ ] UI shows spinner + ID (not blank) for in_progress tasks
- [ ] All validation commands pass (typecheck, lint, tests)
- [ ] Zero regressions in orchestrator functionality
- [ ] Manual testing checklist complete
- [ ] No new console errors or warnings

## Notes

**Historical Context**: This is a newly identified issue in the Alpha workflow UI. The inconsistency arises because task progress data comes from two sources:
1. PostToolUse hooks (heartbeat.py, task_progress.py) - triggered by Claude Code tool calls
2. Direct writes from /alpha:implement - writes authoritative data from tasks.json

These two sources have different knowledge about task IDs, causing the inconsistent display.

**Related Documentation**:
- Alpha orchestrator implementation: `.ai/alpha/scripts/spec-orchestrator.ts`
- Task progress hook: `.claude/hooks/task_progress.py`
- UI components: `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1629*
