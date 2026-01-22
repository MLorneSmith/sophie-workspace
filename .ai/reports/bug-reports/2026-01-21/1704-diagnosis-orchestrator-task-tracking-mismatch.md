# Bug Diagnosis: Alpha Orchestrator Task Tracking Mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-21T16:55:00Z
**Reporter**: system/user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator shows 0% progress after 12+ minutes of execution because task tracking is fundamentally broken. The `/alpha:implement` command uses TodoWrite items with simple IDs (T1, T2, T3...) while the orchestrator expects task completion tracking against semantic task IDs from tasks.json (S1692.I1.F1.T1, S1692.I1.F1.T2...). Additionally, the PTY output streaming stops after the initial "Running Claude Code" message, though the Claude session continues running and writing progress via hooks.

## Environment

- **Application Version**: Alpha Orchestrator v1.0
- **Environment**: development (E2B sandboxes)
- **Node Version**: v20+
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: Unknown (first comprehensive test of spec orchestrator)

## Reproduction Steps

1. Run the spec orchestrator: `pnpm orchestrator:spec --id S1692 --ui`
2. Wait for a feature to be assigned to sandbox sbx-a
3. Observe the UI showing 0/1 tasks, 0/19 features, 0/5 initiatives
4. Check `.ai/alpha/progress/sbx-a-progress.json` - shows `completed_tasks: []` even after 12+ minutes
5. Compare with actual TodoWrite progress showing "5/6 done" in recent output

## Expected Behavior

- Task progress should be tracked against the actual tasks in `tasks.json`
- Feature completion should reflect when all tasks in `tasks.json` are completed
- PTY output should stream continuously to the log file
- Progress bar should show actual percentage of completion

## Actual Behavior

- `completed_tasks: []` array is always empty despite work being done
- Progress shows 0% even after significant work completes
- PTY log file stopped receiving output after initial startup messages
- Task ID mismatch: progress reports `T6: "Validate and commit changes"` but tasks.json only has T1-T3 with different semantic IDs

## Diagnostic Data

### Progress File Analysis
```json
// .ai/alpha/progress/sbx-a-progress.json
{
  "current_task": {
    "id": "T6",  // BUG: Not a valid task ID from tasks.json
    "name": "Validate and commit changes",  // BUG: Not a task from tasks.json
    "status": "in_progress"
  },
  "current_group": {
    "tasks_completed": 0  // BUG: Always 0
  },
  "completed_tasks": [],  // BUG: Always empty
  "recent_output": [
    "📋 Todo: 4/6 done",
    "📋 Todo: 5/6 done"  // TodoWrite shows progress but not reflected in completed_tasks
  ]
}
```

### Tasks.json Structure
```json
// Expected task IDs from tasks.json
"tasks": [
  { "id": "S1692.I1.F1.T1", "name": "Test page structure with i18n keys" },
  { "id": "S1692.I1.F1.T2", "name": "Test metadata with exports" },
  { "id": "S1692.I1.F1.T3", "name": "Test type checking with manual verification" }
]
```

### Log File Analysis
```
// .ai/alpha/logs/run-mko90w4u-ugpo/sbx-a.log
[PTY] Creating PTY session at 2026-01-21T16:51:39.419Z
[PTY] PTY created with PID 752
[PTY] Sending command: run-claude "/alpha:implement S1692.I1.F1"
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement S1692.I1.F1
// NO FURTHER OUTPUT - PTY stopped streaming
```

### File Modification Timestamps
```
Log file:      2026-01-21 11:51:39 (stopped updating after startup)
Progress file: 2026-01-21 11:54:16 (continues updating via hooks)
```

## Error Stack Traces
No explicit errors - the system runs but tracking is broken.

## Related Code

- **Affected Files**:
  - `.claude/commands/alpha/implement.md` - Creates TodoWrite items with T1-T6 IDs
  - `.claude/hooks/task_progress.py` - Extracts task IDs from TodoWrite content
  - `.ai/alpha/scripts/lib/progress.ts` - Reads completed_tasks from sandbox progress
  - `.ai/alpha/scripts/lib/feature.ts` - Tracks tasks via PTY output and progress polling

- **Recent Changes**: Initial implementation of spec orchestrator system

- **Suspected Functions**:
  - `extract_task_id()` in task_progress.py - Falls back to `T{idx}` for non-matching patterns
  - `runFeatureImplementation()` in feature.ts - PTY onData callback stops receiving data
  - TodoWrite generation in implement.md - Uses different IDs than tasks.json

## Related Issues & Context

### Direct Predecessors
- None found - this is a new system

### Related Infrastructure Issues
- #1699: E2B PTY timeout configuration (may be related to PTY output stopping)
- #1701: Alpha Orchestrator UI hang (similar PTY streaming issues)

### Historical Context
This appears to be the first comprehensive test of the Alpha orchestrator system with the full spec → initiative → feature → task pipeline.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three-way data model mismatch between tasks.json, TodoWrite items, and progress tracking.

**Detailed Explanation**:

1. **Task ID Mismatch (Primary Cause)**:
   - `tasks.json` defines tasks with semantic IDs: `S1692.I1.F1.T1`, `S1692.I1.F1.T2`, `S1692.I1.F1.T3`
   - `/alpha:implement` creates TodoWrite items with its OWN task breakdown: `T1: Verify structure`, `T2: Add tests`, ..., `T6: Validate and commit`
   - The hook `task_progress.py` extracts IDs using pattern matching, resulting in `T1`, `T2`, etc.
   - The orchestrator expects `completed_tasks` to match the task IDs from `tasks.json` for progress calculation

2. **completed_tasks Never Populated (Secondary Cause)**:
   - The `task_progress.py` hook writes `todo_summary` but never writes to `completed_tasks`
   - The progress polling in `progress.ts` reads `completed_tasks` from the sandbox's `.initiative-progress.json`
   - Since nothing writes to `completed_tasks`, it's always empty

3. **PTY Output Streaming Stops (Tertiary Cause)**:
   - The PTY `onData` callback stops receiving output after initial startup
   - The Claude session continues running (evidenced by ongoing hook activity)
   - This prevents real-time log capture and may mask errors

**Supporting Evidence**:
- Progress file shows `current_task.id: "T6"` which doesn't exist in tasks.json
- `completed_tasks: []` is always empty despite "5/6 done" in TodoWrite
- Log file modification time stopped at 11:51:39 but progress continues updating at 11:54:16

### How This Causes the Observed Behavior

1. Orchestrator starts feature implementation on sandbox
2. Claude Code creates TodoWrite items for its OWN internal task list (6 items)
3. Hook captures TodoWrite updates, extracts `T1`-`T6` IDs
4. Progress file shows `T6` as current task but `completed_tasks: []`
5. Orchestrator reads progress, sees 0 completed tasks
6. UI displays 0% progress despite significant work being done

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence in progress files shows the ID mismatch
- Code analysis confirms `completed_tasks` is never written to
- Log timestamps prove PTY output stopped while progress continued

## Fix Approach (High-Level)

1. **Align task tracking models**: Either:
   - Option A: Make `/alpha:implement` use task IDs from `tasks.json` in its TodoWrite items
   - Option B: Make `task_progress.py` track task completion based on TodoWrite status instead of ID matching

2. **Fix completed_tasks population**: Update `task_progress.py` to:
   - Track which TodoWrite items transition to "completed" status
   - Write completed task IDs to `completed_tasks` array

3. **Investigate PTY streaming**: Debug why `onData` stops receiving output after startup

## Diagnosis Determination

The root cause is a fundamental design mismatch between three components:
1. `tasks.json` - defines canonical task structure with semantic IDs
2. `/alpha:implement` - creates its own internal task breakdown via TodoWrite
3. Progress tracking - expects `completed_tasks` to match `tasks.json` IDs

This is not a simple bug but an integration gap in the Alpha workflow design.

## Additional Context

The Alpha workflow assumes:
- `tasks.json` provides the task list
- `/alpha:implement` executes those tasks
- Progress is tracked against `tasks.json` task IDs

But the implementation:
- `/alpha:implement` creates its OWN internal TodoWrite task list
- Progress hooks track TodoWrite items (not tasks.json tasks)
- Orchestrator expects completed_tasks to match tasks.json (which never happens)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, Grep*
