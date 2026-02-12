# Bug Diagnosis: Orchestrator Zod validation rejects null progress fields, causing full data loss

**ID**: ISSUE-pending
**Created**: 2026-02-12T09:35:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator's Zod validation schemas use `.optional()` for fields in GPT-written progress files, but GPT/Codex agents write `"field": null` (JSON standard for absent values). Zod's `.optional()` accepts `undefined` but rejects `null`, causing `safeParseProgress()` to fail validation and replace the **entire** progress object with defaults. This silently destroys completed task counts, heartbeat timestamps, status, and phase data on every poll cycle where any null field appears.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development (E2B sandbox orchestration)
- **Node Version**: 22.x
- **Last Working**: Partially working (12/14 features completed on S2045)

## Reproduction Steps

1. Run orchestrator with GPT provider: `tsx spec-orchestrator.ts 2045 --provider gpt`
2. GPT agent writes progress file with `"current_task": null` between tasks
3. Orchestrator polls progress file every 30 seconds
4. `safeParseProgress()` rejects the entire object due to `current_task: null`
5. All progress data replaced with defaults (empty completed_tasks, no heartbeat, etc.)

## Expected Behavior

A null `current_task` field should be treated as absent (equivalent to omitting the field). All other progress data in the same JSON object should be preserved.

## Actual Behavior

The entire progress object is replaced with defaults:
- `completed_tasks` becomes `[]` (actual count lost)
- `last_heartbeat` becomes `""` (stall detection breaks)
- `status` becomes `"in_progress"` (could mask completion)
- `context_usage_percent` becomes `undefined`

Console output: `[VALIDATION_WARN] progressPolling: current_task: Invalid input: expected object, received null`

## Diagnostic Data

### Console Output
```
[VALIDATION_WARN] progressPolling: current_task: Invalid input: expected object, received null
```

### Root Cause Code Path
```
GPT writes {"current_task": null, "completed_tasks": ["T1","T2"], ...}
  → JSON.parse() produces { current_task: null }
  → SandboxProgressSchema.safeParse() fails (null !== undefined for .optional())
  → safeParseProgress() fallback: schema.parse({}) returns ALL defaults
  → completed_tasks = [], last_heartbeat = "", status = "in_progress"
  → Real progress data silently destroyed
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/schemas/progress.schema.ts` (root cause)
  - `.ai/alpha/scripts/lib/progress.ts` (calls safeParseProgress at line 326)
  - `.ai/alpha/scripts/lib/health.ts` (calls safeParseProgress at line 119)
  - `.ai/alpha/scripts/lib/progress-file.ts` (calls safeParseProgress at line 157)
- **Recent Changes**: Feature #2066 added Zod validation but missed the null case
- **Suspected Functions**: `safeParseProgress()`, `SandboxProgressSchema`

## Related Issues & Context

### Direct Predecessors
- #2066 (CLOSED): "Add Zod runtime validation at orchestrator I/O boundaries" - Introduced the schemas that have this gap
- #2065 (OPEN): "UI crash from truncate() undefined" - Same family: GPT writes unexpected data

### Same Pattern (GPT agent non-compliance)
- #1927: Ink UI crash from raw number rendering
- #1937: GPT provider multiple issues
- #1952: GPT writes "blocked" status -> deadlock
- #2048: GPT writes "context_limit" status
- #2060: False completion with GPT (50% threshold too permissive)
- #2064: Infinite retry loop prevents completion phase

### Historical Context
There have been **20+ bug fixes in 3 weeks** related to GPT agent non-compliance. The recurring pattern is that GPT/Codex does not follow the progress file contract. The Zod validation (#2066) was the correct architectural response, but used `.optional()` instead of `.nullish()` for JSON data where `null` is the standard representation of "absent."

## Root Cause Analysis

### Identified Root Cause

**Summary**: Zod `.optional()` rejects JSON `null` values, but GPT agents write `null` for absent fields. The fallback in `safeParseProgress()` replaces the entire object with defaults, causing silent data loss.

**Detailed Explanation**:
- `JSON.parse('{"current_task": null}')` produces `{ current_task: null }`
- Zod `.optional()` accepts `undefined` but NOT `null`
- `SandboxProgressSchema.safeParse()` returns `{ success: false }` for the whole object
- `safeParseProgress()` catches this and returns `schema.parse({})` - ALL defaults
- Every other field in the progress object (completed_tasks, heartbeat, status) is silently discarded

**Supporting Evidence**:
- Error message: `[VALIDATION_WARN] progressPolling: current_task: Invalid input: expected object, received null`
- Code reference: `progress.schema.ts:92` - `current_task: SandboxProgressCurrentTaskSchema.optional()`
- Code reference: `progress.schema.ts:252` - fallback `schema.parse({})` replaces all data

### How This Causes the Observed Behavior

1. GPT writes valid progress with `current_task: null` (between tasks)
2. Zod rejects the entire object due to the null field
3. Fallback returns empty defaults: `{ completed_tasks: [], status: "in_progress", ... }`
4. Orchestrator sees "no tasks completed" and "in progress" - masking actual progress
5. Health checks and stall detection operate on incorrect data

### Confidence Level

**Confidence**: High

**Reasoning**: The error message directly names the field and the type mismatch. The Zod behavior with `.optional()` vs null is well-documented. The fallback path in `safeParseProgress` is deterministic. New test cases confirm the fix works.

## Fix Applied

Added `stripNullValues()` preprocessing in `safeParseProgress()` that converts top-level null values to undefined before Zod validation. This handles ALL null fields from GPT agents in one place, without needing to change every schema field.

**Why preprocessing instead of `.nullish()` on each field**:
- Catches ALL null fields, not just the ones we explicitly change
- Single change in one function (less risk of missing fields)
- Doesn't alter schema semantics (optional still means optional)
- Matches JSON semantics where null is equivalent to absent

**Files Modified**:
- `.ai/alpha/scripts/lib/schemas/progress.schema.ts` - Added `stripNullValues()` and preprocessing in `safeParseProgress()`
- `.ai/alpha/scripts/lib/__tests__/progress-schema.spec.ts` - Added 2 test cases

**Test Results**: 628 tests pass (27 in progress-schema.spec.ts, including 2 new ones)

## Broader Assessment

The orchestrator has accumulated **20+ bug fixes in 3 weeks**, almost all caused by the same root pattern: **GPT/Codex agents don't follow the progress file contract**. The fixes have been reactive (whack-a-mole) rather than structural.

**Three remaining open issues**:
1. **#2064** (HIGH): Infinite retry loop - work queue doesn't enforce max retries
2. **#2065** (HIGH): UI crash from missing name field (partially addressed by #2066)
3. **#2060** (HIGH): False completion - 50% threshold too permissive for GPT

**Structural observation**: The current S2045 run achieved 12/14 features (86%) with GPT as provider. This is significantly better than S1918 (33%). The Zod validation and status remapping have helped, but there are still gaps in the retry and completion logic.

## Additional Context

The S2045 run is currently stalled at 12/14 features:
- S2045.I4.F2: "in_progress" with retry_count 2 (assigned to sbx-a and sbx-b simultaneously - possible race)
- S2045.I4.F4: "pending" (blocked by S2045.I4.F2)
- 3 initiatives fully completed, 1 partially complete

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (git log, gh issue), Glob*
