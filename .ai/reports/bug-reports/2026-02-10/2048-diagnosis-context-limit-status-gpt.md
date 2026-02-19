# Bug Diagnosis: GPT Agent Writes "context_limit" Status to Progress File, Causing Retry Loop

**ID**: ISSUE-pending
**Created**: 2026-02-10T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When the Alpha Orchestrator runs with `--provider gpt` (GPT-5.2-Codex), the GPT agent writes `"context_limit"` as the status value in `.initiative-progress.json` when it reaches context limits. This is not a recognized status in the orchestrator's `VALID_PROGRESS_STATUSES` set (`"in_progress"`, `"completed"`, `"failed"`), so it gets defaulted to `"in_progress"` by `validateProgressStatus()`. This causes the feature to be treated as still running, triggering infinite retries rather than being marked as a partial completion that needs a fresh session.

Additionally, there are **two other GPT-specific issues** compounding the problem discovered during this diagnosis.

## Environment

- **Application Version**: Alpha Orchestrator (post-refactor Issues #1955-1962)
- **Environment**: development (E2B sandboxes)
- **Node Version**: 22.x
- **Provider**: GPT-5.2-Codex via OpenAI Codex CLI v0.94.0
- **Spec**: S2045 (user dashboard)
- **Run ID**: run-mlfm93lj-pkim

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts S2045 --provider gpt`
2. Sandbox sbx-a picks up S2045.I1.F1, completes 4/5 tasks (T1-T4)
3. T5 (visual verification) fails because `agent-browser` is not installed in E2B sandbox
4. GPT agent writes `"status": "context_limit"` to `.initiative-progress.json`
5. PTY timeout fires, reads progress file, sees `"context_limit"` status
6. `validateProgressStatus("context_limit")` falls through to the default case, returns `"in_progress"`
7. The PTY wrapper thinks the feature is still running; returns `stillRunning: true`
8. Feature loop continues waiting, eventually times out
9. Feature marked as failed, gets retried - same cycle repeats (retry_count: 1 already)
10. `[STATUS_VALIDATION] Unknown progress status "context_limit" -> defaulting to "in_progress"` printed to console

## Expected Behavior

When the GPT agent writes `"context_limit"` to the progress file, the orchestrator should recognize this as "context window exhausted, exit cleanly" and treat the feature as a **partial completion** - the same way Claude handles the 60% context usage exit.

## Actual Behavior

The `"context_limit"` status is treated as unknown, defaulted to `"in_progress"`, and the feature enters a retry loop. The orchestrator prints `[STATUS_VALIDATION] Unknown progress status "context_limit" -> defaulting to "in_progress"` repeatedly during progress polling.

## Diagnostic Data

### Console Output
```
[STATUS_VALIDATION] Unknown progress status "context_limit" -> defaulting to "in_progress"
```
(Repeating every 30s during progress polling)

### Progress File (sbx-a)
```json
{
  "status": "context_limit",
  "phase": "executing",
  "completed_tasks": ["S2045.I1.F1.T1", "S2045.I1.F1.T2", "S2045.I1.F1.T3", "S2045.I1.F1.T4"],
  "failed_tasks": ["S2045.I1.F1.T5"],
  "context_usage_percent": 63
}
```

### Spec Manifest State
```json
{
  "id": "S2045.I1.F1",
  "status": "in_progress",
  "retry_count": 1,
  "tasks_completed": 0,
  "assigned_sandbox": "sbx-a"
}
```

### GPT Agent Recent Output (sbx-a)
```
**Blocking Item**
- `S2045.I1.F1.T5` requires `agent-browser`. The verification command failed because the tool is missing.
**Progress File**
- `.initiative-progress.json` updated with `context_limit` status and blockers.
```

### Secondary Issues Discovered

**Issue 2: GPT agent writes `"blocked"` to task status in tasks.json**
The GPT agent wrote `task.status = "blocked"` for T5 in tasks.json. While the orchestrator now handles `"blocked"` in the progress file (remapping to `"failed"` per #1952 fix), individual task statuses with `"blocked"` inside tasks.json are not validated by the orchestrator.

**Issue 3: GPT agent uses `git add -A` which deletes files on retry**
On the second attempt (retry), the GPT agent ran `git add -A` which staged the deletion of previously-committed files (`dashboard-grid.tsx`, etc.) because `git reset --hard FETCH_HEAD` wasn't restoring them correctly. The Codex sandbox's file tracking shows deletions of the very files created in the first attempt.

**Issue 4: `agent-browser` not installed in E2B template**
T5 (`visual_verification` task) fails because `agent-browser` is not available in the E2B sandbox. This is a sandbox template issue, not an orchestrator issue.

## Error Stack Traces
```
PTY timeout on sandbox ii8uyt2sjmfw3nkwismv7: Progress file indicates feature failed (status: failed)
```
(After `validateProgressStatus` remaps `"blocked"` progress file on first attempt to `"failed"`, then on second attempt sees `"context_limit"`)

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/progress-file.ts:43-63` (validateProgressStatus function)
  - `.ai/alpha/scripts/lib/progress.ts:327-329` (progress polling validation)
  - `.ai/alpha/scripts/lib/feature.ts:683-697` (completion status determination)
  - `.ai/alpha/scripts/lib/pty-wrapper.ts:236-244` (failed status check)
- **Recent Changes**: Issues #1955 (centralized transitions), #1957 (status validation)
- **Suspected Functions**: `validateProgressStatus()`, `attemptProgressFileRecovery()`

## Related Issues & Context

### Direct Predecessors
- #1952 (CLOSED): "Bug Diagnosis: S1918 Orchestrator Deadlock - 'blocked' Status Creates Unrecoverable State" - **Same class of bug**: GPT agent writes non-standard status to progress file. The fix for #1952 added `"blocked"` remapping, but didn't anticipate other non-standard statuses.
- #1957 (CLOSED): "Chore: Add runtime validation for progress file status values" - Implemented `validateProgressStatus()` with the default-to-`"in_progress"` fallback. This fallback is the wrong behavior for `"context_limit"`.

### Related Infrastructure Issues
- #1937 (CLOSED): "Bug Diagnosis: S1918 Alpha Orchestrator GPT Provider Multiple Issues" - Prior GPT-specific issues
- #1924 (CLOSED): "Bug Fix: GPT Provider Review Sandbox and Dev Server Failures"

### Historical Context
This is the **third instance** of the GPT agent writing non-standard values to the progress file (#1952 "blocked", now "context_limit"). The pattern is clear: GPT/Codex does not follow the exact status contract that Claude follows from `/alpha:implement`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The GPT/Codex agent writes `"context_limit"` as a progress file status value, which is not in the orchestrator's valid status set. The `validateProgressStatus()` function defaults unknown values to `"in_progress"` instead of recognizing `"context_limit"` as a terminal state.

**Detailed Explanation**:

The root cause is a **contract mismatch** between what the GPT agent writes and what the orchestrator expects.

1. The `/alpha:implement` command instructs the agent to "exit cleanly at 60% context usage" and update the progress file
2. Claude writes `"status": "completed"` or `"status": "in_progress"` per the contract
3. GPT/Codex interprets the context limit exit differently and writes `"status": "context_limit"` - a status the orchestrator doesn't recognize
4. `validateProgressStatus("context_limit")` hits the catch-all at line 60-63 of `progress-file.ts` and returns `"in_progress"`
5. The PTY wrapper in `attemptProgressFileRecovery()` sees `"in_progress"` with a recent heartbeat and returns `stillRunning: true`
6. The feature loop continues waiting, eventually timing out and retrying

**Supporting Evidence**:
- sbx-a progress file shows `"status": "context_limit"` with 4/5 tasks completed and 63% context usage
- Log line 3730: GPT explicitly writes `.initiative-progress.json updated with context_limit status`
- Console output: `[STATUS_VALIDATION] Unknown progress status "context_limit" -> defaulting to "in_progress"`
- `progress-file.ts:60-63`: The catch-all defaults to `"in_progress"` which is the worst possible default for a terminal status

### How This Causes the Observed Behavior

1. GPT agent completes 4/5 tasks for S2045.I1.F1, writes `"context_limit"` status
2. Progress polling reads file, validates status -> gets `"in_progress"`
3. PTY wait timeout fires -> reads progress file -> sees `"in_progress"` + recent heartbeat -> `stillRunning: true`
4. Feature loop retries the wait -> times out again -> feature marked "failed" (PTY error)
5. Feature gets retried (retry_count bumped to 1)
6. Second attempt: GPT agent sees previous work but the `git reset --hard` may have lost it -> same cycle
7. Net result: 0/14 features completed, orchestrator stuck

### Confidence Level

**Confidence**: High

**Reasoning**: Direct evidence in progress file, log output, and code trace showing the exact path from `"context_limit"` -> `"in_progress"` -> `stillRunning: true` -> retry loop. This is a verified code path, not speculation.

## Fix Approach (High-Level)

### Orchestrator Fix (2 changes)

1. **Add `"context_limit"` to the status remapping in `validateProgressStatus()`**: Remap `"context_limit"` -> `"completed"` (or a new `"partial"` status) since it indicates the agent finished as much as it could. The 4/5 tasks completed with 63% context usage is legitimate partial work that should be committed and the feature advanced.

2. **Change the default fallback from `"in_progress"` to `"failed"`**: The current catch-all of `"in_progress"` is the most dangerous possible default because it makes the orchestrator think the feature is still running. Defaulting to `"failed"` is safer - the feature will be retried rather than waiting forever.

### Spec/Decomposition Recommendation

3. **Remove or make `visual_verification` tasks optional for GPT provider**: T5 (`agent-browser` verification) will always fail in E2B sandboxes that don't have `agent-browser` installed. Either:
   - Skip `visual_verification` tasks when running with `--provider gpt`
   - Install `agent-browser` in the E2B template
   - Mark `visual_verification` tasks as `"optional": true` in the task schema

## Diagnosis Determination

The root cause is definitively identified: `validateProgressStatus()` treats the GPT-written `"context_limit"` status as `"in_progress"`, creating a retry loop. This is compounded by the `agent-browser` missing from the E2B template causing T5 to always fail.

The fix is a 2-line change in `progress-file.ts` plus a default fallback change. The spec decomposition should also be updated to handle the `agent-browser` dependency.

## Additional Context

- This is the third iteration of the same pattern: GPT agents don't follow the Claude-specific status contract
- The `VALID_PROGRESS_STATUSES` set should be expanded, or a more robust remapping table should be created
- Consider a `KNOWN_TERMINAL_STATUSES` and `KNOWN_ACTIVE_STATUSES` approach instead of a single valid set

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh CLI), Task (GitHub issue fetcher)*
