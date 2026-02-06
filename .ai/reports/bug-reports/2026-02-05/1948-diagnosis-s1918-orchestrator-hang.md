# Bug Diagnosis: S1918 Orchestrator Hangs After 1h42m with GPT Provider

**ID**: ISSUE-1948
**Created**: 2026-02-05T20:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator hung indefinitely after 1 hour 42 minutes while implementing S1918 (User Dashboard) with the GPT provider. The orchestrator completed 12/18 features (66%) but entered an infinite idle loop because feature S1918.I2.F3 (Activity Aggregation) was stuck in `in_progress` status with no active sandbox working on it, and the deadlock detector does not recognize this state. Additionally, the spec decomposition has backwards dependencies in Initiative 6 (S1918.I6.F2 and F3 depend on F4) that would cause further blocking even if the immediate hang is resolved.

## Environment

- **Application Version**: dev branch, commit 0f407f126
- **Environment**: development (E2B sandboxes)
- **Node Version**: v22.x (E2B template)
- **Provider**: GPT (Codex) via `--provider gpt`
- **Run ID**: run-ml9o190d-xj6i
- **Sandboxes**: 3 (sbx-a, sbx-b, sbx-c)
- **Last Working**: N/A (first GPT run for S1918)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 1918 --provider gpt`
2. Orchestrator processes features I1.F1 through I5.F2 (12 features)
3. S1918.I2.F3 (Activity Aggregation) is assigned to sbx-a, fails repeatedly (retry_count reaches 2)
4. All 3 sandboxes enter `idle` / `waiting` state
5. Orchestrator loops indefinitely - never exits, never detects deadlock

## Expected Behavior

The orchestrator should detect that S1918.I2.F3 is stuck `in_progress` with no active sandbox, reset it to `pending` or `failed`, and either retry it or declare deadlock and exit gracefully.

## Actual Behavior

The orchestrator enters an infinite loop. All 3 sandbox progress files show `status: "idle"`, `phase: "waiting"`, `waiting_reason: "Waiting for dependencies (5 features blocked)"`. The orchestrator never terminates.

## Diagnostic Data

### Manifest State at Hang

```json
{
  "S1918.I2.F3": {
    "status": "in_progress",
    "retry_count": 2,
    "tasks_completed": 2,
    "task_count": 10,
    "assigned_sandbox": "sbx-a"
  },
  "S1918.I4.F4": { "status": "pending", "blocked_by": ["S1918.I2.F3"] },
  "S1918.I6.F1": { "status": "pending", "blocked_by": ["S1918.I4.F4", ...] },
  "S1918.I6.F2": { "status": "pending", "blocked_by": ["S1918.I6.F4"] },
  "S1918.I6.F3": { "status": "pending", "blocked_by": ["S1918.I6.F4"] },
  "S1918.I6.F4": { "status": "pending", "blocked_by": ["S1918.I1-I5 all"] }
}
```

### Sandbox Progress Files (All 3 Identical Pattern)

```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (5 features blocked)",
  "blocked_by": ["S1918.I4.F4", "S1918.I6.F1", "S1918.I6.F2"]
}
```

### Performance Data

- **Start time**: 2026-02-05T16:28:09Z
- **Last checkpoint**: 2026-02-05T18:06:10Z (1h38m in)
- **Features completed**: 12/18 (66%)
- **Tasks completed**: 66/136 (49%)
- **Sandbox restarts**: 3

### Log Evidence

- sbx-a.log: 172,126 lines (7.3MB) - primary worker
- sbx-b.log: 77,103 lines - completed I5.F2 (coaching sessions)
- sbx-c.log: 24,082 lines - completed I4.F2 (kanban summary)
- Last sbx-a activity on S1918.I2.F3: heartbeat at context_usage ~35%, 4/10 tasks in Group 1 completed

## Error Stack Traces

No stack traces - the orchestrator does not crash, it hangs silently in the main loop.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-loop.ts` (lines 447-493: mainLoop)
  - `.ai/alpha/scripts/lib/deadlock-handler.ts` (lines 264-405: detectAndHandleDeadlock)
  - `.ai/alpha/scripts/lib/work-queue.ts` (lines 65-193: getNextAvailableFeature)
- **Recent Changes**: S1918 spec decomposition created Feb 3-5
- **Suspected Functions**:
  - `WorkLoop.mainLoop()` - infinite loop path
  - `WorkLoop.handleIdleState()` - fails to detect `in_progress` feature with dead sandbox
  - `detectAndHandleDeadlock()` - only checks `failed` features, misses `in_progress` orphans

## Related Issues & Context

### Direct Predecessors

- Bug fix #1841: Promise timeout detection - added `monitorPromiseAges()` to detect stuck promises
- Bug fix #1858: Reset feature for retry on sandbox death
- Bug fix #1782: Phantom completion recovery
- Bug fix #1777: Deadlock detection

### Similar Symptoms

- #1767: PTY timeout with progress file recovery
- #1688: Stuck task detection

### Historical Context

The orchestrator has been iteratively hardened with bug fixes (#1688, #1767, #1777, #1782, #1841, #1858) that each addressed specific failure modes. This bug represents a gap between these fixes: a feature stuck `in_progress` with `assigned_sandbox` set but the sandbox actually idle bypasses ALL existing detection mechanisms.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two root causes: (A) The orchestrator's deadlock detector only checks `failed` features, not `in_progress` features with dead/idle sandboxes, creating an infinite loop. (B) The S1918 spec has backwards dependencies in Initiative 6 where F2 and F3 depend on F4.

**Detailed Explanation**:

**Root Cause A - Orchestrator Bug (infinite idle loop):**

The `mainLoop()` in `work-loop.ts:447-493` has the following logic:

```
while (isRunning):
  1. Check workableFeatures (pending/in_progress/failed) → found 6 → don't exit
  2. assignWorkToIdleSandboxes() → no available features (all blocked) → nothing assigned
  3. activeWork.size === 0 → enter handleIdleState()
  4. detectAndHandleDeadlock():
     a. busySandboxes = 0 ✓ (all idle in memory)
     b. getNextAvailableFeature() = null ✓ (all blocked by deps)
     c. Check for phantom completions → none (S1918.I2.F3 has 2/10 tasks, not complete)
     d. Check failedFeatures → none (S1918.I2.F3 is "in_progress", not "failed")
     e. Return { shouldExit: false } ← THE BUG
  5. handleIdleState() finds retryableFeatures (pending features exist) → returns false
  6. continue → back to top of loop
  → INFINITE LOOP
```

The gap: When a feature is `in_progress` with `assigned_sandbox` set but the sandbox is actually idle (the promise resolved/errored but the feature wasn't properly transitioned to `completed` or `failed`), no mechanism detects it:

- `monitorPromiseAges()` only runs when `activeWork.size > 0` (line 476)
- `detectAndHandleDeadlock()` only checks `failed` features (line 314)
- `detectAndRecoverStuckTasks()` only runs when `activeWork.size > 0` (line 479)
- `recoverPhantomCompletions()` requires `tasks_completed >= task_count` (not the case here: 2/10)

The feature S1918.I2.F3 falls through all safety nets.

**Root Cause B - Spec Decomposition (backwards dependencies in I6):**

In the spec-manifest.json, Initiative 6 features have these dependencies:

```
S1918.I6.F1 (Loading Skeletons, priority 1)  → blocked by I4.F4 and all widget features
S1918.I6.F2 (Error Boundaries, priority 2)   → blocked by S1918.I6.F4 ← BACKWARDS
S1918.I6.F3 (Accessibility, priority 3)       → blocked by S1918.I6.F4 ← BACKWARDS
S1918.I6.F4 (E2E Test Suite, priority 4)      → blocked by ALL of I1-I5
```

F2 (Error Boundaries) and F3 (Accessibility) depend on F4 (E2E Test Suite). But F4 has the **highest** priority number in I6 (lower = higher priority). This means:
- F4 must complete before F2 and F3 can start
- But F4 depends on all 5 prior initiatives
- F2 and F3 could theoretically run in parallel with F4 but can't because of the dependency

This is a spec decomposition issue. Error boundaries and accessibility compliance should NOT depend on E2E tests. The dependency should be reversed: E2E tests should depend on error boundaries and accessibility being in place.

**Supporting Evidence**:

1. `spec-manifest.json` line 470-490: S1918.I6.F2 depends on `S1918.I6.F4`
2. `spec-manifest.json` line 500-516: S1918.I6.F3 depends on `S1918.I6.F4`
3. All 3 sandbox progress files show `status: "idle"` with `blocked_by: ["S1918.I4.F4", "S1918.I6.F1", "S1918.I6.F2"]`
4. `spec-manifest.json` line 236-255: S1918.I2.F3 has `status: "in_progress"`, `retry_count: 2`, `assigned_sandbox: "sbx-a"`
5. orchestrator-lock file shows PID 155989 still held

### How This Causes the Observed Behavior

1. GPT/Codex struggles with S1918.I2.F3 (Activity Aggregation) - a complex 10-task feature requiring queries across 4 tables. It completes only 2/10 tasks before timing out or failing.
2. The feature's promise resolves (via PTY timeout recovery), but the feature status remains `in_progress` in the manifest.
3. All sandboxes become idle. No new features can be assigned because everything remaining is blocked by S1918.I2.F3 or S1918.I4.F4 or the I6 backwards dependencies.
4. The main loop detects pending/in_progress features exist → doesn't exit.
5. The deadlock handler doesn't see `in_progress` as "failed" → doesn't retry or exit.
6. The orchestrator loops forever: checking, finding nothing to do, sleeping for HEALTH_CHECK_INTERVAL_MS, repeating.

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is deterministic. The manifest state, progress files, and work-loop logic all confirm this exact scenario. The `in_progress` feature with a dead sandbox bypasses every existing safety check.

## Fix Approach (High-Level)

**For Root Cause A (Orchestrator):**

Add an "orphaned in_progress feature" detection to `handleIdleState()` or `detectAndHandleDeadlock()`. When all sandboxes are idle and a feature is `in_progress` with `assigned_sandbox` set but that sandbox is not in the `busy` state, reset the feature to `pending` (or `failed` if retry limit reached). This is essentially the same pattern as `resetFeatureForRetryOnSandboxDeath()` but triggered from the idle state check rather than from a sandbox health check.

Specific change: In `detectAndHandleDeadlock()`, after checking for phantom completions and before checking for failed features, add a check for orphaned `in_progress` features where the assigned sandbox is idle.

**For Root Cause B (Spec Decomposition):**

Recommendation for the user: Reverse the dependency direction in I6:
- S1918.I6.F2 (Error Boundaries) should NOT depend on S1918.I6.F4 (E2E Tests)
- S1918.I6.F3 (Accessibility) should NOT depend on S1918.I6.F4 (E2E Tests)
- Instead, S1918.I6.F4 (E2E Tests) should depend on S1918.I6.F2 and S1918.I6.F3

This allows error boundaries and accessibility to run in parallel (or before) E2E tests, which is the correct logical order - you build the features first, then test them.

## Diagnosis Determination

The orchestrator hang after 1h42m has two distinct root causes:

1. **Bug in orchestrator deadlock detection** (fixable in code): Features stuck in `in_progress` with dead sandboxes are invisible to the deadlock handler, causing an infinite loop. This is a gap between existing bug fixes #1777, #1782, and #1858.

2. **Backwards dependencies in S1918 spec** (fixable in spec): I6.F2 and I6.F3 depend on I6.F4, which is logically backwards. Even with the orchestrator fix, the spec would be suboptimal because error boundaries and accessibility must wait for the E2E test suite.

The orchestrator bug is the direct cause of the hang. The spec dependency issue would cause suboptimal execution order but would not cause an infinite hang on its own.

## Additional Context

- The GPT provider (`gpt-5.2-codex`) is being used for the first time with this spec
- GPT/Codex shows multiple skill loading errors at startup (YAML parsing failures for Claude-specific skills in `.agents/skills/`)
- The S1918 spec has 18 features across 6 initiatives with 136 tasks total - this is a large spec
- S1918.I2.F3 (Activity Aggregation) is the most complex feature in I2, requiring queries across 4 database tables with transformation logic
- The `reasoning effort` shown in Codex startup is set to `none` - this may contribute to poor performance on complex tasks

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash (wc, mkdir)*
