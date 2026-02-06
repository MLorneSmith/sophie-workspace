# Implementation Report: Centralize Feature Status Transitions

**Issue:** #1955
**Branch:** `chore/centralized-state-transitions`
**Commit:** `3594ec97e`
**Date:** 2026-02-06

## Summary

Replaced 20+ distributed `feature.status = "string"` mutations across 7 files and 11 `initiative.status = "string"` mutations across 5 files with centralized transition functions in `feature-transitions.ts`.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `feature-transitions.ts` | Created | Centralized state machine (256 lines) |
| `feature-transitions.spec.ts` | Created | 24 tests for all transition paths |
| `feature.ts` | Modified | 6 mutations → `transitionFeatureStatus()` |
| `health.ts` | Modified | 2 mutations → `transitionFeatureStatus()` |
| `work-loop.ts` | Modified | 4 mutations → centralized functions |
| `work-queue.ts` | Modified | 5 mutations → centralized functions |
| `deadlock-handler.ts` | Modified | 7 mutations → centralized functions |
| `orchestrator.ts` | Modified | Debug mode loops → centralized functions |
| `index.ts` | Modified | Updated exports |
| `state-machine.ts` | Deleted (stub) | Dead code replaced |
| `heartbeat-monitor.ts` | Deleted (stub) | Dead code never integrated |
| `recovery-manager.ts` | Deleted (stub) | Dead code never integrated |
| 3 dead code test files | Replaced | Skip stubs |
| `orchestrator-deadlock-detection.spec.ts` | Modified | Updated API calls |
| `work-loop-promise-timeout.spec.ts` | Modified | Added transition mock |

**Stats:** 17 files, +868/-2,702 lines

## Design Decisions

### 1. Valid Transition Map

```
pending      → in_progress, failed
in_progress  → pending, completed, failed
completed    → (terminal - no transitions out)
failed       → pending, in_progress
blocked      → (rejected, remapped to failed)
```

### 2. "blocked" Status Rejection

Any transition TO "blocked" is remapped to "failed" with a console warning. This fixes #1952 where a GPT agent set `feature.status = "blocked"` creating an unrecoverable state.

### 3. Caller-Managed retry_count

`retry_count` is NOT auto-incremented in `transitionFeatureStatus()`. Callers increment explicitly because:
- Not all `→ failed` transitions should increment (e.g., health check failures)
- Auto-increment caused double-counting when callers also incremented
- Three specific paths increment: promise timeout retry, sandbox death retry, deadlock handler reset

### 4. Assignment Field Clearing

`assigned_sandbox` and `assigned_at` are cleared on both `→ pending` AND `→ failed` transitions, matching the original behavior across all call sites.

### 5. Batch Operation Support

`skipSave` and `skipInitiativeCascade` options prevent redundant I/O during batch operations (e.g., orchestrator debug mode processing all features).

## Bugs Fixed by This Refactoring

| Issue | Description | How Fixed |
|-------|-------------|-----------|
| #1952 | GPT agent "blocked" status creates unrecoverable state | Reject "blocked", remap to "failed" |
| #1777, #1782, #1786 | Various state corruption bugs | Validated transitions prevent invalid states |
| #1841, #1858, #1938, #1948 | Inconsistent state management | Single source of truth for all transitions |

## Validation Results

- **Tests:** 546 passed, 3 skipped (dead code stubs)
- **TypeScript:** Clean compilation (`npx tsc --noEmit`)
- **Grep verification:** Zero direct status mutations outside `feature-transitions.ts` and test files
- **Lint/Format:** Pass with only non-null assertion warnings in tests
