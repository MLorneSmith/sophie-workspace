# Bug Diagnosis: Alpha Orchestrator UI - Events List Not Limited to 6

**ID**: ISSUE-1585
**Created**: 2026-01-19T15:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI sandbox columns display an unbounded number of events (observed up to 12) instead of the expected limit of 6. The issue has two root causes: (1) duplicate events being written to the progress file, and (2) the display limit is set to 3 instead of 6.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Run ID**: run-mkl9s4gx-0nq9
- **Spec ID**: 1362

## Reproduction Steps

1. Run the Alpha Orchestrator with `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the sandbox columns during feature implementation
3. Watch the "Output:" section in each sandbox column
4. Events accumulate beyond 3-6 items, reaching 12+ in some columns

## Expected Behavior

- Events in each sandbox column should be limited to **6 items** (newest first)
- No duplicate entries should appear in the list

## Actual Behavior

- Events accumulate to 12+ items in sandbox columns
- Progress files contain duplicate entries (each event appears twice)
- Example from sbx-a-progress.json showing duplicates:
  ```json
  "recent_output": [
    "💻 Bash: TIMESTAMP=$(date -Iseconds)\\nca...",
    "💻 Bash: TIMESTAMP=$(date -Iseconds)\\nca...",  // duplicate
    "📖 Read: page.tsx",
    "📖 Read: page.tsx",  // duplicate
    ...
  ]
  ```

## Diagnostic Data

### Progress File Analysis

Current `recent_output` counts:
- sbx-a: 13 items
- sbx-b: 20 items
- sbx-c: 18 items

`MAX_RECENT_OUTPUT` in event_reporter.py is set to 20, which explains why files max at 20.

### Hook Configuration Analysis

**Root Cause 1: Duplicate Hook Calls**

Two hooks call `event_reporter.py` for the same events:

1. **implement.md PostToolUse hook** (lines 7-12):
   ```yaml
   PostToolUse:
     - matcher: ""
       hooks:
         - type: command
           command: "HOOK_EVENT_TYPE=post_tool_use python3 $CLAUDE_PROJECT_DIR/.claude/hooks/event_reporter.py || true"
   ```

2. **settings.json PostToolUse hook** runs `task_progress_stream.py` for ALL tools:
   ```json
   "PostToolUse": [{
     "matcher": "",
     "hooks": [
       { "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress_stream.py || true" }
     ]
   }]
   ```

3. **task_progress_stream.py** (lines 49-64) calls `event_reporter.py` when `ORCHESTRATOR_URL` is set:
   ```python
   orchestrator_url = os.environ.get("ORCHESTRATOR_URL")
   if orchestrator_url:
       subprocess.run([sys.executable, str(EVENT_REPORTER_SCRIPT)], ...)
   ```

4. **environment.ts** (lines 427-428) sets `ORCHESTRATOR_URL` for all sandboxes:
   ```typescript
   if (_orchestratorUrl) {
       envs.ORCHESTRATOR_URL = _orchestratorUrl;
   }
   ```

**Result**: Every PostToolUse event triggers `event_reporter.py` TWICE:
1. Once from implement.md hook
2. Once from task_progress_stream.py (because ORCHESTRATOR_URL is set)

### Display Limit Analysis

**Root Cause 2: Display Limit Set to 3, Not 6**

SandboxColumn.tsx (line 293):
```typescript
{state.recentOutput.slice(0, 3).map((line) => (
```

User requirement is 6 events, but code limits to 3.

### Related Code Locations

| File | Line | Issue |
|------|------|-------|
| `.claude/commands/alpha/implement.md` | 11 | Calls event_reporter.py for all PostToolUse |
| `.claude/hooks/task_progress_stream.py` | 49-64 | Also calls event_reporter.py when ORCHESTRATOR_URL set |
| `.ai/alpha/scripts/lib/environment.ts` | 427-428 | Sets ORCHESTRATOR_URL for sandboxes |
| `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` | 293 | `slice(0, 3)` limits to 3, should be 6 |
| `.claude/hooks/event_reporter.py` | 36 | `MAX_RECENT_OUTPUT = 20` |

## Related Issues & Context

### Direct Predecessors
- #1568 (CLOSED): "Alpha Orchestrator UI Issues" - Previous fix attempted to cap events to 3, but duplicates weren't addressed
- #1572 (OPEN): "Alpha Orchestrator UI - Event Ordering and Dev Server Issues" - Identified event accumulation issue

### Same Component
- #1567: "Alpha Orchestrator UI Diagnostic" - Related UI improvements

## Root Cause Analysis

### Identified Root Cause

**Summary**: Events are written twice to progress files due to redundant hook calls, and the display limit is set to 3 instead of the user-requested 6.

**Detailed Explanation**:
When a tool is used during `/alpha:implement`:
1. implement.md's PostToolUse hook calls `event_reporter.py` → writes to `recent_output`
2. settings.json's PostToolUse hook calls `task_progress_stream.py` → which detects `ORCHESTRATOR_URL` is set → calls `event_reporter.py` again → writes DUPLICATE to `recent_output`

This duplication, combined with the display limit being 3 instead of 6, creates confusion about how many events should be shown.

**Supporting Evidence**:
- Progress file sbx-a shows exact duplicate pairs: "📖 Read: page.tsx" appears twice consecutively
- `ORCHESTRATOR_URL` is set in `environment.ts` line 428
- User reports seeing 12 events (double the expected 6)

### How This Causes the Observed Behavior

1. Tool call occurs during /alpha:implement
2. implement.md hook fires → event_reporter.py writes event #1
3. settings.json hook fires → task_progress_stream.py → event_reporter.py writes event #2 (duplicate)
4. Over time, 6 unique events become 12 entries in progress file
5. Display should limit to 6, but shows up to 12 due to duplicates + limit being 3

### Confidence Level

**Confidence**: High

**Reasoning**:
- Duplicate entries are visible in progress file data
- Hook call chain is clearly traced through code
- ORCHESTRATOR_URL is confirmed set in environment.ts
- User's observation of "12 events" = 6 unique events × 2 duplicates

## Fix Approach (High-Level)

1. **Remove duplicate hook call**: Either:
   - Remove `event_reporter.py` from implement.md's PostToolUse (since task_progress_stream.py already handles it when ORCHESTRATOR_URL is set)
   - OR add deduplication to `event_reporter.py` before appending

2. **Update display limit to 6**: Change `SandboxColumn.tsx` line 293 from `slice(0, 3)` to `slice(0, 6)`

3. **Consider adjusting storage limit**: `MAX_RECENT_OUTPUT = 20` in event_reporter.py might be reduced to 12 (6 × 2 buffer)

## Diagnosis Determination

The issue is a combination of architectural duplication (two hook paths calling the same function) and a configuration mismatch (display limit 3 vs requirement 6). The fix is straightforward: remove the redundant hook and update the display limit constant.

## Additional Context

- Previous Issue #1568 fixed the display slice but didn't address the duplication
- The duplication only occurs when ORCHESTRATOR_URL is set (i.e., in E2B sandboxes)
- Local development may not exhibit this issue if ORCHESTRATOR_URL isn't set

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, Glob*
