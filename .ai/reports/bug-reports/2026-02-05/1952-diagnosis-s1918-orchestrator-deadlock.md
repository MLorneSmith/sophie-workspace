# Bug Diagnosis: S1918 Orchestrator Deadlock - "blocked" Status Creates Unrecoverable State

**ID**: ISSUE-1952
**Created**: 2026-02-05T23:30:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator hung after 1h18m during S1918 implementation (GPT/Codex provider). The root cause is a **feature status value of `"blocked"` that is not handled by any recovery mechanism in the orchestrator**. When the GPT agent writes `status: "blocked"` to the progress file (`.initiative-progress.json`), the orchestrator faithfully propagates this status to the feature in the manifest. However, "blocked" features are invisible to the work loop's completion check, deadlock detector, phantom completion recovery, and orphaned feature detection. This creates an unrecoverable deadlock where all sandboxes idle forever.

A secondary issue is that the **spec decomposition is over-specified** with 18 features, 136 tasks, and 250+ estimated sequential hours, creating excessive dependency chains that amplify any single-feature failure.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: Development (E2B sandboxes)
- **Node Version**: v22.x
- **Provider**: GPT/Codex (gpt-5.2-codex via OpenAI Codex v0.94.0)
- **Run ID**: run-ml9xg59b-fhgb
- **Spec**: S1918 (User Dashboard)
- **Duration before hang**: ~1h18m (started 20:51, last checkpoint 22:05)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 1918 --provider gpt`
2. Wait for features to execute
3. When GPT agent writes `status: "blocked"` to `.initiative-progress.json` for any feature
4. The orchestrator propagates `"blocked"` to `spec-manifest.json`
5. All recovery systems fail to detect the inconsistent state
6. Sandboxes idle, no deadlock detected, orchestrator hangs indefinitely

## Expected Behavior

When a feature has all tasks completed (`tasks_completed === task_count`), the orchestrator should mark it as `"completed"` regardless of what the agent's progress file says. Features that are dependencies of other features should be properly tracked and recovered.

## Actual Behavior

Feature S1918.I1.F2 (Responsive Grid Layout) has `status: "blocked"` with `tasks_completed: 5/5` (all tasks done). This creates a cascading deadlock:

```
S1918.I1.F2 (blocked, 5/5 tasks done) ← ROOT CAUSE
  → S1918.I1.F3 can't start (depends on F2)
  → Initiative I1 can't complete
  → S1918.I2.F1 blocked (depends on I1)
  → S1918.I2.F2 blocked (depends on I1 + F1)
  → S1918.I3.F1, F2 blocked (depends on I2.F2)
  → S1918.I4.F1-F4 blocked (depends on I2.F2)
  → S1918.I6.F1-F4 blocked (depends on I3, I4, I5)
  = 12 features permanently blocked
```

Two sandboxes (sbx-b, sbx-c) sit idle with `waiting_reason: "Waiting for dependencies (12 features blocked)"`.

## Diagnostic Data

### Manifest State

```json
// S1918.I1.F2 - THE BLOCKING FEATURE
{
  "id": "S1918.I1.F2",
  "status": "blocked",        // ← BUG: should be "completed"
  "tasks_completed": 5,       // ← ALL TASKS DONE
  "task_count": 5,
  "dependencies": ["S1918.I1.F1"]  // F1 is completed
}

// Initiative I1 incorrectly claims completed
{
  "id": "S1918.I1",
  "status": "completed",      // ← INCONSISTENT: F2 blocked, F3 pending
  "features_completed": 3,    // ← WRONG: only F1 is truly completed
  "feature_count": 3
}
```

### Progress Files (at time of hang)

sbx-b and sbx-c both idle:
```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (12 features blocked)",
  "blocked_by": ["S1918.I1.F3", "S1918.I2.F2", "S1918.I3.F1"]
}
```

### Log Evidence

All three sandboxes used GPT/Codex (gpt-5.2-codex):
- sbx-a: Completed S1918.I5.F1 (Cal.com API Client) - worked but slow
- sbx-b: Completed S1918.I5.F2 (Coaching Sessions Widget) - PTY timeout recovered via progress file
- sbx-c: Completed S1918.I2.F3 (Activity Aggregation) - PTY timeout recovered via progress file
- S1918.I1.F2 completed all tasks but was marked "blocked" by the agent

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts:698-701` - Propagates "blocked" status from progress file
  - `.ai/alpha/scripts/lib/work-queue.ts:550` - Phantom detection only checks `in_progress`
  - `.ai/alpha/scripts/lib/work-loop.ts:450-455` - Work loop excludes "blocked" from workable
  - `.ai/alpha/scripts/lib/deadlock-handler.ts:316` - No orphan check for "blocked" features
- **Recent Changes**: S1918.I5.F1 retry_count: 3 suggests instability during execution

## Related Issues & Context

### Direct Predecessors

- Bug fix #1782: Phantom completion detection (same class of bug but only for `in_progress`)
- Bug fix #1948: Orphaned in_progress features (same pattern, missing "blocked")
- Bug fix #1938: Completion validation (strengthened evidence requirements)

### Similar Symptoms

- Bug fix #1777: Deadlock detection (same idle-all-sandboxes pattern)
- Bug fix #1858: Failed feature retry (similar recovery gap)

### Historical Context

This is the third instance of an unrecognized feature status creating a deadlock. Previous fixes (#1782, #1948) addressed `in_progress` phantom completions and orphaned features, but the "blocked" status was never added to recovery checks. This is a systematic gap - every recovery mechanism was built assuming features would be in `pending`, `in_progress`, `completed`, or `failed` states, but `"blocked"` was added to the type system without updating the recovery logic.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `"blocked"` feature status is a valid type (`orchestrator.types.ts:86`) but has **zero recovery handlers** in the orchestrator. When the GPT agent writes `status: "blocked"` to the progress file, the feature enters an unrecoverable state.

**Detailed Explanation**:

The causal chain is:

1. **GPT agent writes `status: "blocked"` to `.initiative-progress.json`** - The agent (running in the sandbox) decides a feature is blocked (likely due to missing dependencies or import failures) and sets this status.

2. **`feature.ts:700-701` propagates `"blocked"` to the manifest** - When the feature implementation finishes, `runFeatureImplementation()` reads the progress file and sets `feature.status = "blocked"`.

3. **`work-loop.ts:450-455` ignores `"blocked"` features** - The `mainLoop()` filters `workableFeatures` for `pending | in_progress | failed` only. "Blocked" features are invisible.

4. **`work-queue.ts:550` ignores `"blocked"` in phantom detection** - `getPhantomCompletedFeatures()` only checks `status !== "in_progress"`, missing blocked features with all tasks done.

5. **`deadlock-handler.ts` has no handler for `"blocked"`** - The orphaned feature check (line 316) only looks for `in_progress`. The failed feature check (line 395) only looks for `failed`. No code path handles "blocked".

6. **`handleIdleState()` doesn't detect the problem** - When all sandboxes are idle, it checks for deadlock but finds no failed features, no phantom completions, and no orphaned features. It sees `retryableFeatures` (pending ones exist) but they all have unsatisfied dependencies.

7. **The loop continues forever** - Pending features blocked by dependencies → no work assigned → idle state → deadlock check passes → back to top → repeat infinitely.

**Supporting Evidence**:
- `spec-manifest.json`: Feature S1918.I1.F2 has `status: "blocked"`, `tasks_completed: 5`, `task_count: 5`
- Progress files: sbx-b and sbx-c both idle with `"Waiting for dependencies (12 features blocked)"`
- No error was logged because no recovery mechanism recognized the state
- The orchestrator ran for 1h18m in this ghost state

### How This Causes the Observed Behavior

1. S1918.I1.F2 completes all 5 tasks but the GPT agent writes "blocked" status
2. The orchestrator marks F2 as "blocked" instead of "completed"
3. F3 depends on F2 → can't start
4. Initiative I1 can't complete → I2, I3, I4, I6 all blocked
5. Only I5 features could run (they only depend on F1, which was completed)
6. After I5 completes, all remaining features are blocked
7. Sandboxes sit idle, deadlock detection finds no actionable state
8. Orchestrator hangs indefinitely

### Confidence Level

**Confidence**: High

**Reasoning**: The manifest state directly shows the problem - S1918.I1.F2 has `status: "blocked"` with all tasks completed. Code analysis confirms no recovery mechanism handles this status. The progress files confirm sandboxes were idle and waiting for dependencies. The causal chain from "blocked" status → dependency chain → total deadlock is deterministic and reproducible.

## Fix Approach (High-Level)

### Issue 1: Orchestrator Bug (Fix Required)

Three changes needed in the orchestrator:

1. **`feature.ts` (~line 698)**: Never allow agent-reported `"blocked"` to override a feature with all tasks completed. If `tasks_completed >= task_count`, force status to `"completed"` regardless of progress file.

2. **`work-queue.ts` `getPhantomCompletedFeatures()`**: Expand phantom detection from `status === "in_progress"` to also check `"blocked"` and `"pending"` features with all tasks done.

3. **`deadlock-handler.ts` `detectAndHandleDeadlock()`**: Add a check for features with status `"blocked"` that have all tasks completed. Recover them the same way phantom completions are recovered.

4. **`work-loop.ts` `mainLoop()`**: Add `"blocked"` to the `workableFeatures` filter so the main loop doesn't exit prematurely when blocked features exist that could be recovered.

### Issue 2: Spec Over-Decomposition (Recommendation)

The S1918 spec has **18 features and 136 tasks with 250+ estimated sequential hours**. This is far too large for a single orchestrator run:

- **Deep dependency chains** (6 initiatives, up to 7 dependencies per feature) amplify any single-feature failure
- **S1918.I6.F4 (E2E Test Suite)** alone has 14 tasks and 45 estimated hours - this is an entire initiative's worth of work in one feature
- **S1918.I6.F3 (Accessibility Compliance)** has 19 tasks and 25 hours

**Recommendation**: Limit specs to 8-10 features max, with no more than 3 initiative levels. Break S1918 into 2-3 smaller specs.

## Diagnosis Determination

The orchestrator hang is caused by a gap in the recovery logic where "blocked" feature status (set by the GPT agent) is not handled by any deadlock detection, phantom completion, or orphaned feature recovery mechanism. This creates an unrecoverable state where 12 downstream features are permanently blocked.

A secondary contributing factor is the excessive size and dependency depth of the S1918 spec, which ensures that a single feature's status corruption cascades to block the entire remaining workload.

## Additional Context

- The GPT/Codex provider may be more likely to set "blocked" status than Claude Code, as the implement.md command was designed for Claude's behavior
- S1918.I5.F1 had `retry_count: 3`, suggesting GPT needed multiple attempts for features
- Both sbx-b and sbx-c logs show PTY timeout recovery via progress file, suggesting GPT sessions run longer than expected
- The overall-progress.json shows 4 features completed of 18 (22%) before the deadlock

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash, Task (Explore agent)*
