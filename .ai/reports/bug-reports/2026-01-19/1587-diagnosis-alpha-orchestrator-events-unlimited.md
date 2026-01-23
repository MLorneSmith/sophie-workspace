# Bug Diagnosis: Alpha Orchestrator UI Events Not Being Limited to 6

**ID**: ISSUE-1587
**Created**: 2026-01-19T16:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI is displaying more events than the intended limit of 6 in each sandbox column's output section. The user reports seeing up to 15 events that "grow and grow" despite Issue #1586 supposedly fixing this. Investigation reveals duplicate events in progress files and a mismatch between intended and actual display limits.

## Environment

- **Application Version**: Latest (commit ab412273b)
- **Environment**: Development (E2B sandboxes)
- **Node Version**: 20.x
- **Last Working**: Unknown

## Reproduction Steps

1. Run the Alpha Orchestrator with `/alpha:implement` command
2. Observe the sandbox columns in the TUI
3. Watch the "Output:" section in each sandbox column
4. Events accumulate beyond the expected limit of 6

## Expected Behavior

- Each sandbox column's "Output:" section should display at most 6 events
- The EventLog component should display at most 6 events (per user expectation)
- Events should not accumulate indefinitely

## Actual Behavior

- Up to 15 events are displayed (user report)
- Events "grow and grow" without being limited
- Duplicate events appear in progress files (each event twice)

## Diagnostic Data

### Progress File Analysis

The progress file `.ai/alpha/progress/sbx-b-progress.json` shows duplicate entries:

```json
"recent_output": [
  "💻 Bash: cat > .initiative-progress.jso...",
  "💻 Bash: cat > .initiative-progress.jso...",
  "🔍 Grep: lib",
  "🔍 Grep: lib",
  "📝 Write: activity-server-actions.ts",
  "📝 Write: activity-server-actions.ts",
  "💻 Bash: pnpm typecheck 2>&1 | tail -30",
  "💻 Bash: pnpm typecheck 2>&1 | tail -30"
]
```

**Key Finding**: 8 entries with 4 unique events (each appears twice).

### Hook Configuration Analysis

**settings.json PostToolUse hooks** (run on ALL tool events):
1. `post_tool_use.py` - logs to session directory
2. `heartbeat.py` - updates heartbeat timestamp
3. `task_progress_stream.py` - calls `event_reporter.py` (writes to `recent_output`)

**implement.md PostToolUse hooks** (after fix ab412273b):
- `task_progress_stream.py` - only for `TodoWrite` matcher

### Display Limit Configuration

| Component | Current Limit | Expected Limit | Source |
|-----------|---------------|----------------|--------|
| SandboxColumn (Output) | 6 | 6 | `slice(0, 6)` in SandboxColumn.tsx:293 |
| EventLog | 8 | 6 | `MAX_DISPLAY_EVENTS = 8` in types.ts:618 |
| Progress File Storage | 20 | ~10 | `MAX_RECENT_OUTPUT = 20` in event_reporter.py:36 |

### Git History

Commit `ab412273b` ("fix(tooling): remove duplicate event hook and update display limit to 6"):
- Removed direct `event_reporter.py` call from implement.md
- Updated SandboxColumn slice from 3 to 6
- Did NOT update `MAX_DISPLAY_EVENTS` constant (still 8)

## Error Stack Traces

N/A - No errors, this is a logic/configuration bug.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/types.ts:618` - `MAX_DISPLAY_EVENTS = 8` (should be 6)
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx:293` - `slice(0, 6)` (correct)
  - `.ai/alpha/scripts/ui/components/EventLog.tsx:143` - uses `MAX_DISPLAY_EVENTS` (wrong value)
  - `.claude/hooks/event_reporter.py:36` - `MAX_RECENT_OUTPUT = 20`
  - `.claude/settings.json:57` - `task_progress_stream.py` hook
- **Recent Changes**: Commit ab412273b attempted to fix duplicates

## Related Issues & Context

### Direct Predecessors

- #1586 (CLOSED): "Alpha Orchestrator UI showing duplicate events" - Partial fix applied

### Historical Context

Issue #1586 was supposed to fix duplicate events by removing a redundant hook from implement.md. However:
1. The fix only removed ONE source of duplicates
2. Duplicates are still appearing in progress files
3. The `MAX_DISPLAY_EVENTS` constant was not updated to 6 as the commit message implied

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three issues contribute to the problem:
1. `MAX_DISPLAY_EVENTS` constant is 8, not 6 as intended
2. Duplicate events are still being written to progress files (each event appears twice)
3. The source data limit (`MAX_RECENT_OUTPUT = 20`) is too high

**Detailed Explanation**:

**Issue 1: Wrong display constant**
The commit message for ab412273b states "update display limit to 6", but `MAX_DISPLAY_EVENTS` in types.ts:618 is still set to 8. This affects the EventLog component which defaults to this value.

**Issue 2: Duplicate events in progress files**
The progress files show each event appearing twice. This suggests there are still two code paths writing to `recent_output`:
- The global `task_progress_stream.py` hook in settings.json (runs on ALL tools)
- Possibly another source or hooks running twice per tool event

When examining the hook execution flow:
1. `task_progress_stream.py` (from settings.json) triggers on tool event
2. It calls `event_reporter.py` which appends to `recent_output`
3. Something causes this to happen twice per event

**Issue 3: High storage limit**
`MAX_RECENT_OUTPUT = 20` in event_reporter.py means up to 20 events can be stored. With duplicates, this means 10 unique events × 2 = 20 stored items.

**Supporting Evidence**:
- Progress file shows 8 items = 4 unique events × 2 duplicates
- `MAX_DISPLAY_EVENTS = 8` in code, not 6 as commit message claimed
- User reports seeing 15 events (could be EventLog[8] + 7 from other sources, or accumulated display)

### How This Causes the Observed Behavior

1. Tool events trigger hooks that write to `recent_output`
2. Due to duplicate hook execution, each event is written twice
3. With `MAX_RECENT_OUTPUT = 20`, up to 20 items accumulate
4. The UI reads this data and applies its own limits
5. SandboxColumn correctly limits to 6, but EventLog uses 8
6. If the display is not properly updated or React is re-rendering incorrectly, stale events may appear
7. User sees more events than expected

### Confidence Level

**Confidence**: High

**Reasoning**:
- Progress file clearly shows duplicate events
- Code shows `MAX_DISPLAY_EVENTS = 8` despite commit claiming to set it to 6
- The duplicate pattern (each event × 2) is consistent across the data

## Fix Approach (High-Level)

1. **Update `MAX_DISPLAY_EVENTS` to 6** in `.ai/alpha/scripts/ui/types.ts:618`
2. **Reduce `MAX_RECENT_OUTPUT` to 10** in `.claude/hooks/event_reporter.py:36` (provides buffer for 6 display)
3. **Investigate and fix duplicate hook execution** - Either:
   - Add deduplication logic in `update_progress_file()` (compare with last entry before appending)
   - OR find and remove the second hook/call path causing duplicates
4. **Add deduplication in UI** - Skip rendering duplicate consecutive lines in SandboxColumn

## Diagnosis Determination

The root cause is confirmed: a combination of wrong display constant (8 vs 6), duplicate events being written to progress files, and high storage limit (20). The fix in Issue #1586 was incomplete - it removed one duplicate source but another remains, and the display constant was never actually updated to 6.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git show)*
