# Bug Diagnosis: Alpha orchestrator UI crash — truncate() receives undefined from GPT agent progress file

**ID**: ISSUE-pending
**Created**: 2026-02-11T18:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator crashes with `Cannot read properties of undefined (reading 'length')` in the Ink UI's `truncate()` function when rendering sandbox progress. The GPT/Codex agent writes `.initiative-progress.json` with a `current_task` object that is missing the `name` field. The progress data mapping layer (`useProgressPoller.ts`) passes this `undefined` value through to the UI component (`SandboxColumn.tsx`) without validation, causing the crash. Additionally, harmless `completed -> completed` transition warnings appear because multiple code paths attempt to finalize already-completed features.

## Environment

- **Application Version**: dev branch, commit 011c587c9
- **Environment**: development (local orchestrator + E2B sandboxes)
- **Node Version**: v22.x
- **Provider**: GPT/Codex (via `--provider gpt`)
- **Spec**: S2045 (user dashboard)
- **Last Working**: Unknown (first run with GPT provider after template migration)

## Reproduction Steps

1. Run the orchestrator with GPT provider: `tsx spec-orchestrator.ts 2045 --provider gpt`
2. Wait for GPT/Codex agent to start processing features in sandboxes
3. When the agent writes `.initiative-progress.json` with a `current_task` object missing the `name` field, the UI crashes
4. The orchestrator exits with the stack trace shown below

## Expected Behavior

The UI should render gracefully even when progress data from the sandbox agent is incomplete or malformed, displaying fallback text like "Working..." for missing fields.

## Actual Behavior

The orchestrator crashes with:
```
ERROR  Cannot read properties of undefined (reading 'length')
```

Additionally, harmless transition warnings appear:
```
[TRANSITION_WARN] Invalid feature transition: S2045.I3.F3 completed -> completed (reason: feature completion finalization). Ignoring.
[TRANSITION_WARN] Invalid feature transition: S2045.I2.F2 completed -> completed (reason: feature completion finalization). Ignoring.
```

## Diagnostic Data

### Console Output
```
ERROR  Cannot read properties of undefined (reading 'length')

 .ai/alpha/scripts/ui/components/SandboxColumn.tsx:70:10

 67:  * Truncate text with ellipsis
 68:  */
 69: function truncate(str: string, maxLen: number): string {
 70:   if (str.length <= maxLen) return str;
 71:   return `${str.substring(0, maxLen - 3)}...`;
 72: }
```

### Progress File Analysis

The crash occurs when the GPT agent writes `.initiative-progress.json` with a `current_task` object
that has an `id` and `status` but is missing `name`:

```json
{
  "current_task": {
    "id": "S2045.I4.F4.T2",
    "status": "in_progress"
    // "name" field is MISSING — GPT agent didn't include it
  }
}
```

The TypeScript type `SandboxProgressFile.current_task` declares `name: string` as required,
but this is only compile-time enforcement — at runtime, JSON from the sandbox is unvalidated.

### Run Context

- Run ID: `run-mlibjhzn-69qd`
- 3 sandboxes (sbx-a, sbx-b, sbx-c)
- 14/14 features completed before crash (crash occurred during completion phase UI render)
- Overall status: "completing"

## Error Stack Traces
```
- truncate (.ai/alpha/scripts/ui/components/SandboxColumn.tsx:70:10)
- SandboxColumnImpl (.ai/alpha/scripts/ui/components/SandboxColumn.tsx:262:13)
- renderWithHooks (react-reconciler)
- updateFunctionComponent (react-reconciler)
- updateSimpleMemoComponent (react-reconciler)
- beginWork (react-reconciler)
- performUnitOfWork (react-reconciler)
- workLoopSync (react-reconciler)
- renderRootSync (react-reconciler)
- performWorkOnRoot (react-reconciler)
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (crash site)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` (data mapping layer)
- **Recent Changes**: Commits 011c587c9, 893c5cf1b (race condition fixes)
- **Suspected Functions**:
  - `truncate()` at SandboxColumn.tsx:69-72 — no null/undefined guard
  - `progressToSandboxState()` at useProgressPoller.ts:303-440 — no defensive defaults for `name`/`title`

## Related Issues & Context

### Direct Predecessors
- #1927 (CLOSED): "Alpha Orchestrator Ink UI Crash with raw number rendering" — Same pattern: UI component receives unexpected data from progress file and crashes
- #1431 (CLOSED): "Alpha Orchestrator Recurring Issues" — Output and rendering issues

### GPT Provider Issues
- #1937 (CLOSED): "S1918 Alpha Orchestrator GPT Provider Multiple Issues" — GPT agent writes non-standard progress data
- #1952 (CLOSED): "S1918 Orchestrator Deadlock - 'blocked' Status Creates Unrecoverable State" — GPT agent wrote invalid status value
- #2048 (CLOSED): "S2045 GPT Agent Writes 'context_limit' Status Causing Retry Loop" — GPT agent wrote non-standard status
- #2059 (CLOSED): "Alpha orchestrator false completion with GPT" — GPT agent compliance issues

### Same Component
- #1727 (CLOSED): "Alpha Orchestrator Completion Phase Issues" — ANSI code truncation in same component
- #2063 (CLOSED): "Alpha orchestrator stale progress file race" — Progress file timing issues
- #2064 (OPEN): "Alpha orchestrator infinite retry loop" — Work loop completion issues

### Historical Context

This is the **5th instance** of the GPT/Codex agent writing non-conformant progress data that crashes or deadlocks the orchestrator (#1937, #1952, #2048, #2059, now this). The pattern is consistent:

1. The orchestrator defines a TypeScript interface for progress data (`SandboxProgressFile`)
2. TypeScript types provide compile-time safety but NO runtime validation
3. The GPT/Codex agent writes JSON that is structurally valid but missing required fields
4. The orchestrator trusts the data without runtime validation
5. The missing data propagates to the UI or state machine and causes a crash/deadlock

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `truncate()` function in `SandboxColumn.tsx` crashes because `state.currentTask.name` is `undefined` — the GPT agent wrote a `current_task` JSON object without the `name` field, and no runtime validation catches this at the I/O boundary.

**Detailed Explanation**:

The data flow is:

1. GPT/Codex agent writes `.initiative-progress.json` in the E2B sandbox
2. The progress poller reads the JSON and passes it to `progressToSandboxState()` (useProgressPoller.ts:303)
3. At line 370, `name: progress.current_task.name` copies the value directly — if missing in JSON, it's `undefined`
4. The `TaskInfo` object is created with `name: undefined` (TypeScript doesn't help at runtime)
5. `SandboxColumn.tsx:251` guards against `currentTask` being null, but not against `currentTask.name` being undefined
6. `truncate(undefined, 24)` crashes: `undefined.length` throws TypeError

**Supporting Evidence**:
- Stack trace: `SandboxColumn.tsx:262:13` → `truncate` at line 70
- Progress files show GPT agent data with varying field completeness
- The `SandboxProgressFile` type marks `name` as required, but JSON parsing provides no runtime enforcement
- 4 prior issues (#1937, #1952, #2048, #2059) demonstrate GPT agent non-compliance with expected data format

### How This Causes the Observed Behavior

1. Progress poller reads malformed JSON → creates TaskInfo with `name: undefined`
2. React component receives non-null `currentTask` → passes guard check
3. `truncate(state.currentTask.name, 24)` → `truncate(undefined, 24)` → `undefined.length` → TypeError
4. Error propagates through React reconciler → crashes the Ink UI
5. Process exits because React error boundary doesn't catch the render error

### Confidence Level

**Confidence**: High

**Reasoning**: The stack trace directly points to the crash location, the data flow is traced end-to-end, the same pattern has caused 4 prior bugs with the GPT agent, and the fix (adding null guards) is straightforward and proven.

## Fix Approach (High-Level)

Two-layer defense applied:

1. **Data mapping layer** (useProgressPoller.ts): Add defensive defaults for all fields read from untrusted JSON — `name || "Working..."`, `title || "Feature"`, `status || "in_progress"`
2. **UI layer** (SandboxColumn.tsx): Make `truncate()` and `stripAndTruncate()` accept `undefined | null` and return empty string

Both fixes have been implemented in this diagnosis session (see commits).

## Broader Assessment: Orchestrator Health

### Pattern Analysis

The Alpha orchestrator has accumulated **20+ bug fixes** since January 2026, with a recurring theme:

| Category | Issues | Pattern |
|----------|--------|---------|
| GPT agent non-compliance | #1937, #1952, #2048, #2059, this | Agent writes unexpected data, no runtime validation |
| Progress file races | #2062, #2063 | Async reads of shared mutable files without locking |
| False completions | #1940, #2060 | Insufficient evidence before marking features done |
| UI crashes | #1727, #1927, this | Untrusted data reaches render without guards |
| Work loop stalls | #1767, #1841, #2064 | Promise tracking and timeout recovery complexity |

### Root Problems

1. **No runtime validation at I/O boundaries**: The system trusts JSON from sandboxes (written by AI agents) using only TypeScript types. A Zod schema at the `readProgressFile` boundary would prevent 80% of these issues.

2. **Shared mutable state without concurrency control**: `spec-manifest.json` is read/written by multiple async processes. The transition system (#1955) helps but doesn't fully prevent races.

3. **GPT/Codex agent non-compliance**: The GPT agent consistently writes data that doesn't match the expected schema. This is fundamentally different from Claude Code which follows the `/alpha:implement` command precisely. Each new GPT run surfaces a new non-compliance issue.

### Recommendation

The most impactful improvement would be adding **Zod runtime validation** at the progress file read boundary (`readProgressFile` and `progressToSandboxState`). This would:
- Catch malformed data before it reaches the UI or state machine
- Provide clear error messages identifying which field is missing
- Allow graceful degradation (use defaults instead of crashing)
- Prevent the entire category of "GPT agent writes bad data" bugs

Estimated effort: ~2 hours to add Zod schemas for `SandboxProgressFile` and `OverallProgressFile`.

## Additional Context

The `completed -> completed` transition warnings are **harmless and expected** — they occur when PTY fallback recovery marks a feature completed, and later the feature finalization code path also attempts the same transition. The transition system correctly rejects the duplicate. No fix needed.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue list, tsc), Edit*
