# Bug Fix: Alpha Orchestrator Task Tracking Mismatch

**Related Diagnosis**: #1704 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Three-way data model mismatch between tasks.json task IDs, TodoWrite internal task breakdown, and progress file tracking
- **Fix Approach**: Align `/alpha:implement` to use semantic task IDs from tasks.json in TodoWrite items
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator shows 0% progress despite significant work being completed because of a fundamental mismatch between three components:

1. **tasks.json** defines canonical tasks with semantic IDs: `S1692.I1.F1.T1`, `S1692.I1.F1.T2`, `S1692.I1.F1.T3`
2. **/alpha:implement** creates TodoWrite items with its OWN internal task breakdown: `T1`, `T2`, ..., `T6` (different structure)
3. **task_progress.py hook** extracts task IDs from TodoWrite, resulting in non-matching IDs
4. **progress.ts** expects `completed_tasks` array to contain task IDs from tasks.json, but it remains empty

For full details, see diagnosis issue #1704.

### Solution Approaches Considered

#### Option 1: Use Semantic Task IDs in TodoWrite Items ⭐ RECOMMENDED

**Description**: Modify `/alpha:implement` to use the semantic task IDs from tasks.json when creating TodoWrite items, so IDs flow through the entire tracking chain consistently.

**Pros**:
- Single source of truth: task IDs are always from tasks.json
- Progress tracking becomes straightforward: TodoWrite completion → IDs match → completed_tasks populates correctly
- No changes needed to progress.ts or task_progress.py hooks
- Task IDs are semantically meaningful and traceable
- Easier to resume interrupted implementations with `--resume-from=S1692.I1.F1.T2`

**Cons**:
- Requires modifying implement.md to read tasks.json and map its IDs
- Slightly more complexity in the implement command
- Task IDs are longer (semantic format vs simple T1, T2)

**Risk Assessment**: low - TodoWrite is just a display/tracking mechanism; changing IDs won't break functionality
**Complexity**: simple - straightforward mapping from tasks.json IDs to TodoWrite content

#### Option 2: Map TodoWrite IDs to tasks.json in Progress Hook

**Description**: Keep /alpha:implement using T1-T6, but enhance task_progress.py to intelligently map TodoWrite task IDs to tasks.json semantic IDs based on task order/name matching.

**Pros**:
- Minimal changes to implement.md
- Preserves short, readable T1-T6 IDs in TodoWrite
- Progress hook does the translation work

**Cons**:
- Fragile: name/order matching could break with minor changes
- Adds complexity to task_progress.py for mapping logic
- Progress tracking becomes dependent on task name matching
- Harder to maintain and debug

**Why Not Chosen**: Option 1 is simpler and more reliable. The semantic IDs should flow through the system consistently.

#### Option 3: Separate "Internal Tasks" from "Feature Tasks"

**Description**: Keep two task lists: tasks.json for feature requirements + implement.md for internal subtasks. Progress tracks both separately.

**Cons**:
- Increases complexity significantly
- Creates duplication and potential inconsistency
- Still requires mapping between the two systems
- Feature completion logic becomes complicated

**Why Not Chosen**: Overengineered solution that creates more problems than it solves.

### Selected Solution: Use Semantic Task IDs in TodoWrite Items

**Justification**: This is the simplest, most maintainable solution. By using task IDs from tasks.json in TodoWrite items, we create a single source of truth for task identification. The progress tracking becomes straightforward: TodoWrite completions update → hook extracts matching IDs → completed_tasks array populates → UI shows correct progress.

**Technical Approach**:

1. In `/alpha:implement` Phase 1 (Load Context):
   - After loading tasks.json, read all tasks with their semantic IDs
   - Build a mapping: `T1 → S1692.I1.F1.T1`, `T2 → S1692.I1.F1.T2`, etc.

2. When creating TodoWrite items:
   - Use semantic IDs from tasks.json as the primary identifier
   - Format: `[S1692.I1.F1.T1] Task description` or similar
   - Preserve task sequencing and names from tasks.json

3. In task_progress.py hook:
   - Update `extract_task_id()` to recognize semantic ID format
   - Extract IDs like `S1692.I1.F1.T1` (in addition to current `T1` format)
   - Populate `completed_tasks` array with matched semantic IDs

4. In progress.ts:
   - No changes needed if hook updates work correctly
   - completed_tasks will now contain meaningful IDs that match tasks.json

**Architecture Changes**:
- Minimal: Only affects how TodoWrite items are formatted
- No changes to progress.ts or orchestrator logic
- Progress hook enhancement is backward-compatible

**Migration Strategy**:
- N/A: No existing data migration needed
- This is a new system, no legacy state to handle

## Implementation Plan

### Affected Files

List files that need modification:

- `.claude/commands/alpha/implement.md` - Modify Phase 1 to load task.json IDs and use them in TodoWrite items
- `.claude/hooks/task_progress.py` - Enhance `extract_task_id()` to recognize semantic task IDs (S#.I#.F#.T#)
- `.claude/hooks/task_progress_stream.py` - Mirror changes to task_progress.py if it exists (verify first)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Enhance task_progress.py to recognize semantic task IDs

<describe what this step accomplishes>

Update the `extract_task_id()` function to recognize and extract semantic task IDs in the format `S#.I#.F#.T#` in addition to simple `T#` IDs.

- Read current task_progress.py to understand the pattern matching logic
- Add new regex pattern for semantic IDs: `S\d+\.I\d+\.F\d+\.T\d+`
- Maintain backward compatibility with existing `T#` pattern
- Test pattern matching with both formats

**Why this step first**: The hook must be able to recognize semantic IDs before implement.md starts using them. Otherwise, the IDs won't be extracted correctly.

#### Step 2: Modify /alpha:implement to load tasks.json and use semantic IDs in TodoWrite

<describe what this step accomplishes>

Update Phase 1 (Load Context) of implement.md to read tasks.json and extract semantic task IDs, then use those IDs when creating TodoWrite items.

- Add step in Phase 1 to load and parse tasks.json after finding the feature directory
- Extract semantic IDs from tasks array: `[task.id for task in tasks]`
- Modify TodoWrite item creation to include semantic IDs in content: `[${semantic_id}] ${task_name}`
- Ensure task sequencing matches tasks.json order

**Why after Step 1**: We need the hook ready to parse the new IDs before implement.md starts generating them.

#### Step 3: Update task_progress.py to populate completed_tasks array

<describe what this step accomplishes>

Modify task_progress.py to actually populate the `completed_tasks` array when tasks transition to completed status.

- Track which TodoWrite items have status "completed"
- Extract task IDs from completed items using updated `extract_task_id()`
- Write completed task IDs to `completed_tasks` array in progress file
- Maintain chronological order of completion

**Why this step**: This is critical for progress calculation. Currently `completed_tasks` is always empty even though TodoWrite tracks completion.

#### Step 4: Add regression tests for task ID extraction

<describe what this step accomplishes>

Create unit tests to verify the task ID extraction works correctly for both semantic and simple formats.

- Test pattern matching for semantic IDs: `S1692.I1.F1.T1`
- Test pattern matching for simple IDs: `T1`, `T2`, etc.
- Test edge cases: nested brackets, malformed IDs, missing IDs
- Verify backward compatibility with existing log files

**Test files**:
- Create `.claude/hooks/__tests__/task_progress.spec.py` if not exists
- Add test_extract_task_id_semantic() - semantic ID extraction
- Add test_extract_task_id_simple() - simple ID extraction
- Add test_completed_tasks_population() - array population

#### Step 5: Validation and integration testing

<describe what this step accomplishes>

Test the fix end-to-end with actual feature implementation to ensure progress tracking works.

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test with actual feature implementation in sandbox
- Confirm progress bar updates correctly
- Confirm completed_tasks array populates as tasks complete

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Semantic task ID extraction: `extract_task_id("S1692.I1.F1.T1: Task name")`
- ✅ Simple ID extraction: `extract_task_id("[T1] Task name")`
- ✅ Completed tasks population: array updates when status changes to "completed"
- ✅ Edge case: malformed task ID in content should use fallback
- ✅ Edge case: nested brackets and special characters
- ✅ Backward compatibility: existing T# format still works

**Test files**:
- `.claude/hooks/__tests__/task_progress.spec.py` - Python unit tests for hook

### Integration Tests

Test the complete flow:
- Implement.md loads tasks.json and creates TodoWrite with semantic IDs
- Task_progress.py hook extracts semantic IDs from TodoWrite content
- Completed_tasks array populates as TodoWrite items complete
- Progress.ts reads completed_tasks and calculates progress correctly

**Test files**:
- `.ai/alpha/tests/feature-implementation.spec.ts` - End-to-end feature test

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Load feature with tasks.json (e.g., S1692.I1.F1)
- [ ] Verify TodoWrite items contain semantic task IDs in content
- [ ] Complete first task (mark as completed in TodoWrite)
- [ ] Check progress file: `completed_tasks` array should have 1 entry
- [ ] Verify progress bar shows 1/3 (33%) or appropriate percentage
- [ ] Complete remaining tasks one by one
- [ ] Verify progress bar updates correctly as tasks complete
- [ ] Verify UI orchestrator shows progress updates in real-time
- [ ] Check for any errors in task_progress.py logs
- [ ] Verify backward compatibility: existing T# format still works

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Pattern Matching Breaks Existing IDs**: If the new semantic ID pattern incorrectly matches or interferes with simple T# patterns
   - **Likelihood**: low
   - **Impact**: medium - progress tracking would fail
   - **Mitigation**: Carefully design regex to be non-overlapping; test both formats thoroughly

2. **Task ID Ordering Mismatch**: If tasks.json order doesn't match expected implementation order
   - **Likelihood**: medium
   - **Impact**: medium - progress tracking would show incorrect task as current
   - **Mitigation**: Implement validation that tasks.json is properly ordered; log current task info for debugging

3. **Incomplete Task Completion Tracking**: If some tasks don't properly mark as "completed" in TodoWrite
   - **Likelihood**: low
   - **Impact**: high - progress would appear stuck
   - **Mitigation**: Add debug logging for all TodoWrite status changes; ensure validate_task completion validation is working

4. **Progress File Corruption**: If completed_tasks array is malformed or not properly written
   - **Likelihood**: low
   - **Impact**: high - UI shows incorrect progress
   - **Mitigation**: Validate JSON structure before writing; use atomic file operations (already done with temp file rename)

**Rollback Plan**:

If this fix causes issues in production:

1. Revert changes to `.claude/commands/alpha/implement.md` to not use semantic IDs
2. Revert changes to `.claude/hooks/task_progress.py` to only extract T# format
3. This reverts to pre-fix behavior where progress tracking doesn't work, but implementation continues
4. Alternative: Set feature task count to 0 in UI to prevent progress display errors

**Monitoring** (if needed):
- Monitor `.initiative-progress.json` files for malformed `completed_tasks` arrays
- Watch for "T{idx}" fallback IDs (indicates pattern matching failed)
- Alert if progress file stops updating (heartbeat mechanism)

## Performance Impact

**Expected Impact**: none/minimal

No performance implications. This is purely a data model alignment fix:
- Same number of progress file I/O operations
- No additional database queries
- Pattern matching is O(1) per task ID

**Performance Testing**:
- Verify progress file write time doesn't exceed 10ms
- Confirm hook execution completes within 3s timeout

## Security Considerations

**Security Impact**: none

This change only affects internal task tracking within sandboxes. No security implications:
- Semantic IDs are not exposed to users
- No external API changes
- No authentication or authorization affected
- Progress files remain sandboxed

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator and observe 0% progress despite work
pnpm orchestrator:spec --id S1692 --ui

# Wait 5+ minutes, then check progress file
cat .ai/alpha/progress/sbx-a-progress.json

# Verify completed_tasks is empty while TodoWrite shows progress
```

**Expected Result**: `completed_tasks: []` despite TodoWrite showing "3/6 done" or similar

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Python tests (if added)
python -m pytest .claude/hooks/__tests__/task_progress.spec.py -v

# Integration test (if written)
pnpm test:alpha

# Manual verification: run orchestrator
pnpm orchestrator:spec --id S1692 --ui

# Wait 2-3 minutes, check progress file
cat .ai/alpha/progress/sbx-a-progress.json

# Verify completed_tasks array is populated
```

**Expected Result**:
- All commands succeed
- `completed_tasks` array populates as tasks complete
- Progress bar shows accurate percentage
- UI updates in real-time

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific regression tests for orchestrator
pnpm test:alpha

# Check for any new errors in progress tracking
grep -r "completed_tasks" .ai/alpha/progress/
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses existing Python standard library and project structure.

**Dependencies added**: None

OR

**No new dependencies required**

## Database Changes

**No database changes required** - This is purely application-layer task tracking.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - existing T# format still works

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces: `completed_tasks` array populates correctly
- [ ] All tests pass (unit, integration, Python)
- [ ] Zero regressions: existing T# format still works
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] Progress bar shows accurate percentages in UI
- [ ] Task tracking works end-to-end for multiple features

## Notes

**Key Implementation Details**:
- Semantic task ID format: `S{spec}.I{initiative}.F{feature}.T{task}` (e.g., `S1692.I1.F1.T1`)
- TodoWrite content format: `[S1692.I1.F1.T1] Task description` - bracket format ensures easy extraction
- Progress file structure remains unchanged; only `completed_tasks` array content changes
- Hook continues to use same file write mechanism (atomic temp file rename)

**Backward Compatibility**:
- Old logs with T# format will still parse correctly
- Progress files using T# format will still be recognized
- No breaking changes to orchestrator UI or progress.ts

**Related Documentation**:
- [Architecture Overview](./.ai/ai_docs/context-docs/development/architecture-overview.md) - Task system design
- [E2B Sandbox Infrastructure](./.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md) - Sandbox implementation context
- [Alpha Workflow](./.ai/ai_docs/context-docs/development/alpha-orchestrator.md) - Orchestrator architecture

---
*Generated by Claude Code Bug Fix Planning Assistant*
*Based on diagnosis: #1704*
