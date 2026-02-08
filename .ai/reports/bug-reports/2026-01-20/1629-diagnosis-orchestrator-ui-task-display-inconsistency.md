# Bug Diagnosis: Orchestrator UI Task Display Inconsistency

**ID**: ISSUE-1629
**Created**: 2026-01-20T16:30:00.000Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator UI displays task information inconsistently across sandbox columns. Sometimes a spinner animation is shown with just "T#" next to it, while other times the full semantic ID (S###.I#.F#.T#) is displayed without the spinner. This inconsistency occurs because the task ID extraction logic in `task_progress.py` fails when todo content doesn't match expected patterns.

## Environment

- **Application Version**: Alpha orchestrator 1.0
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (not relevant)
- **Last Working**: N/A (inherent design issue)

## Reproduction Steps

1. Run the Alpha orchestrator with `npx tsx .ai/alpha/scripts/spec-orchestrator.ts --spec-id S1607 --ui`
2. Observe sandbox columns as tasks execute
3. Notice that some tasks show just "T#" with spinner (e.g., "T1", "T2")
4. Notice other tasks show full semantic ID without spinner (e.g., "S1607.I4.F1.T1")
5. Some tasks show only spinner with empty/no task ID

## Expected Behavior

All tasks should display consistently with:
- A spinner animation when the task status is `in_progress`
- The task ID (either short "T#" or full semantic ID) displayed consistently

## Actual Behavior

Three different display states are observed:

1. **Spinner + short ID (T#)**: When `task_progress.py` successfully extracts ID from todo content like "T1: Create component"
2. **Full semantic ID (S###.I#.F#.T#) without spinner**: When `/alpha:implement` writes progress with full task ID from tasks.json
3. **Spinner only (no ID)**: When todo content doesn't match any ID pattern (e.g., "Load feature context and tasks.json")

## Diagnostic Data

### Progress File Examples

**sbx-a-progress.json** - Missing task ID (causes spinner-only display):
```json
{
    "current_task": {
        "name": "Load feature context and tasks.json",
        "status": "in_progress",
        "started_at": "2026-01-20T16:27:57.546890Z"
    }
}
```

Note: No `id` field present because the task name doesn't contain a T# pattern.

**Expected format with ID**:
```json
{
    "current_task": {
        "id": "T1",
        "name": "Create dashboard component",
        "status": "in_progress",
        "started_at": "2026-01-20T16:27:57.546890Z"
    }
}
```

### Console Output
N/A (UI rendering issue)

### Network Analysis
N/A (local file-based progress)

### Database Analysis
N/A

### Performance Metrics
N/A

### Screenshots
N/A

## Error Stack Traces
N/A (no errors, just visual inconsistency)

## Related Code

**Affected Files**:
- `.claude/hooks/task_progress.py:77-101` - Task ID extraction logic
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx:236-254` - Task display rendering
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:359-371` - Progress data transformation

**Recent Changes**: None (inherent design issue)

**Suspected Functions**:
- `task_progress.py:main()` - ID extraction from todo content
- `SandboxColumn.tsx:SandboxColumnImpl` - Rendering with undefined ID

## Related Issues & Context

### Direct Predecessors
None found

### Related Infrastructure Issues
None found

### Similar Symptoms
None found

### Same Component
None found

### Historical Context
This is a newly identified issue in the Alpha workflow UI implementation.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `task_progress.py` hook only sets `current_task.id` when the todo content matches a "T#" or "[T#]" pattern, leaving it undefined for other task descriptions. The UI then renders undefined as empty.

**Detailed Explanation**:

1. **Data Source Conflict**: Task progress data comes from two sources:
   - **`/alpha:implement` command**: Writes full semantic IDs (S1607.I4.F1.T1) directly to progress file
   - **`task_progress.py` hook**: Extracts IDs from `TodoWrite` content using pattern matching

2. **Pattern Matching Limitation** (`.claude/hooks/task_progress.py:77-101`):
   ```python
   # Try to extract task ID from content (e.g., "T1: Task name" or "[T1] Task name")
   task_id = None
   for prefix in ['T', '[T']:
       if prefix in content:
           # extraction logic...
           if task_id:
               progress['current_task']['id'] = task_id
   ```
   When todo content is "Load feature context and tasks.json", no T# pattern is found, so `id` is never set.

3. **UI Rendering** (`.ai/alpha/scripts/ui/components/SandboxColumn.tsx:236-244`):
   ```typescript
   {state.currentTask && (
       <Box>
           {state.currentTask.status === "in_progress" && (
               <Spinner type="dots" />
           )}
           <Text color="yellow">{state.currentTask.id}</Text>  // undefined renders as empty
       </Box>
   )}
   ```
   The spinner shows (status is `in_progress`), but `id` is undefined, so nothing displays next to it.

**Supporting Evidence**:
- `sbx-a-progress.json` shows `current_task` without `id` field
- `task_progress.py` only sets ID conditionally (line 100-101)
- UI renders `undefined` task IDs as empty strings

### How This Causes the Observed Behavior

1. User runs `/alpha:implement S1607.I4.F1`
2. Implementation begins, creates initial todos like "Load feature context and tasks.json"
3. `task_progress.py` hook fires on `TodoWrite`, fails to extract ID (no T# pattern)
4. Progress file written without `current_task.id`
5. UI polls progress, transforms to `TaskInfo` with `id: undefined`
6. `SandboxColumn` renders spinner (status=in_progress) + empty ID
7. Later, when actual T# tasks start, IDs appear correctly
8. Sometimes `/alpha:implement` writes full semantic IDs directly, skipping the hook's pattern matching

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence in progress file (missing ID field)
- Clear code path in `task_progress.py` that conditionally sets ID
- UI code explicitly renders `currentTask.id` which can be undefined
- Consistent with observed symptoms (intermittent ID display)

## Fix Approach (High-Level)

Two approaches to fix this:

**Option A: Improve `task_progress.py` ID extraction** (Recommended)
1. Add fallback ID generation when pattern matching fails (e.g., "task-{index}" or use activeForm content hash)
2. Or always set a placeholder ID when task is in progress

**Option B: Make UI handle undefined ID gracefully**
1. In `SandboxColumn.tsx`, check if `id` is undefined before rendering
2. Show task name or "Working..." placeholder when ID is missing

**Option C: Ensure `/alpha:implement` always writes task ID**
1. Modify the implement command to always include task ID in progress updates
2. This provides authoritative IDs from the source (tasks.json)

Option A or C is preferred as it fixes the data source rather than masking the issue in the UI.

## Diagnosis Determination

Root cause is confirmed: The `task_progress.py` hook's conditional ID extraction leaves `current_task.id` undefined when todo content doesn't contain a T# pattern. This is a straightforward data consistency issue that can be fixed by ensuring IDs are always populated or by handling missing IDs gracefully in the UI.

## Additional Context

The Alpha workflow has two paths that write to `.initiative-progress.json`:
1. **PostToolUse hooks** (heartbeat.py, task_progress.py) - triggered by Claude Code tool calls
2. **Direct writes from /alpha:implement** - writes authoritative data from tasks.json

The inconsistency arises because these two sources have different knowledge about task IDs. The implement command has the full task context, while the hooks only see todo content strings.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep*
