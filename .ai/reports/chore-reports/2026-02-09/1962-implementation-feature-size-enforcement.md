# Chore #1962: Enforce max 12 tasks per feature - Implementation Report

## Summary

Successfully implemented task count enforcement at 4 validation layers in the Alpha Spec Orchestrator pipeline to prevent features with excessive task counts that cause sandbox timeouts and cascading failures.

## Changes Implemented

### 1. JSON Schema Constraints (`.ai/alpha/templates/tasks.schema.json`)
- Added `minItems: 1` - require at least 1 task
- Added `maxItems: 12` - hard maximum of 12 tasks per feature
- Updated description to explain the hard max

### 2. Validation Script (`.ai/alpha/scripts/validate-tasks-json.sh`)
- New Check 7: Task count limits with MAX_TASKS=12
- Reports error if task count exceeds 12: "Split feature into smaller sub-features"
- Renumbered existing Check 7 (Dependencies) to Check 8
- Updated script header comments to reflect new check

### 3. Manifest Generation (`.ai/alpha/scripts/lib/manifest.ts`)
- Added warning log when feature task count exceeds 12 during manifest generation
- Warning includes feature ID and recommendation to consider splitting

### 4. Orchestrator Pre-Flight (`.ai/alpha/scripts/lib/pre-flight.ts`)
- New function: `checkFeatureTaskCounts(manifest, log)`
- Iterates through feature queue checking MAX_TASKS_PER_FEATURE = 12
- Logs warning for each oversized feature (doesn't block execution)
- Exports new `FeatureTaskCountCheckResult` interface

### 5. Orchestrator Integration (`.ai/alpha/scripts/lib/orchestrator.ts`)
- Imports `checkFeatureTaskCounts` from pre-flight module
- Calls function after dependency cycle validation
- Non-blocking warning only (unlike cycle check which blocks)

### 6. Task Decomposer Agent (`.claude/agents/alpha/task-decomposer.md`)
- Updated complexity granularity table:
  - HIGH (61-80): Changed from `12-20` to `10-12`
  - MAXIMAL (81+): Changed from `20+` to `12`
- Added explicit hard max rule below table
- Added new "Task Count Check" to Phase 6 validation (Check 6)
- Updated Verdict Determination to include: "Task Count = 100% (must not exceed 12)"

### 7. Task Decompose Orchestrator (`.claude/commands/alpha/task-decompose.md`)
- Added new "Task Count" checklist section in Pre-Completion Checklist:
  - No feature has more than 12 tasks
  - Task count aligns with complexity target_steps range
  - If >12 tasks needed, recommend splitting feature

### 8. Exports (`.ai/alpha/scripts/lib/index.ts`)
- Exported `checkFeatureTaskCounts` function
- Exported `FeatureTaskCountCheckResult` type
- Updated pre-flight exports

## Validation Results

✅ **All validation commands passed:**

### TypeScript Compilation
```bash
cd .ai/alpha/scripts && npx tsc --noEmit
```
Result: No errors

### Unit Tests
```bash
cd .ai/alpha/scripts && npx vitest run lib/__tests__/
```
Result: 591 passed, 3 skipped (pre-existing dead code tests)

### Schema Validation
```bash
grep -n "maxItems" .ai/alpha/templates/tasks.schema.json
```
Result: ✅ maxItems: 12 present on line 137

### Script Validation
```bash
grep -n "task_count\|MAX_TASKS" .ai/alpha/scripts/validate-tasks-json.sh
```
Result: ✅ New Check 7 with MAX_TASKS=12 present

### Pre-Flight Validation
```bash
grep -n "checkFeatureTaskCounts\|MAX_TASKS_PER_FEATURE" .ai/alpha/scripts/lib/pre-flight.ts
```
Result: ✅ Function with MAX_TASKS_PER_FEATURE = 12 present

### Manifest Validation
```bash
grep -n "max recommended\|Consider splitting" .ai/alpha/scripts/lib/manifest.ts
```
Result: ✅ Warning for >12 tasks present

### Orchestrator Integration
```bash
grep -n "checkFeatureTaskCounts" .ai/alpha/scripts/lib/orchestrator.ts
```
Result: ✅ Function called on line 489

### Agent Granularity Table
```bash
grep -A5 "61-80" .claude/agents/alpha/task-decomposer.md
```
Result: ✅ HIGH: 10-12, MAXIMAL: 12

### Validation Script in Practice
```bash
.ai/alpha/scripts/validate-tasks-json.sh .ai/alpha/specs/S1890-Spec-user-dashboard/S1890.I1-Initiative-dashboard-foundation/S1890.I1.F1-Feature-dashboard-page-layout/tasks.json
```
Result: ✅ task_count: true for valid feature with ≤12 tasks

## Risk Assessment

- **Risk Level:** Low
- **Backward Compatibility:** ✅ Maintained
  - Existing features with >12 tasks can still run (warning only at orchestrator level)
  - Schema maxItems prevents new features from exceeding limit
  - validate-tasks-json.sh fails on new >12 task files (intentional)
- **Dependencies:** None (independent of other chores/features)
- **No Database Changes:** Pure validation/configuration updates

## Impact Analysis

**Positive:**
- Prevents sandbox timeouts from excessive task counts
- Catches oversizing early in decomposition (schema + agent validation)
- Multiple validation points (defense in depth)
- Soft orchestrator warnings don't block existing implementations

**Behavioral Changes:**
- Alpha Orchestrator will warn about features >12 tasks
- Task decomposer agent will produce max 12 tasks (changed HIGH/MAXIMAL levels)
- validate-tasks-json.sh will reject new >12 task files
- Manifest generation warns for oversized features

## Files Changed

| File | Changes | Lines |
|------|---------|-------|
| `.ai/alpha/templates/tasks.schema.json` | Added minItems, maxItems, updated description | +4, -1 |
| `.ai/alpha/scripts/validate-tasks-json.sh` | New Check 7, renumbered Check 7→8, updated header | +18, -1 |
| `.ai/alpha/scripts/lib/manifest.ts` | Added warning for >12 tasks | +4 |
| `.ai/alpha/scripts/lib/pre-flight.ts` | Added checkFeatureTaskCounts function | +51 |
| `.ai/alpha/scripts/lib/orchestrator.ts` | Import and call checkFeatureTaskCounts | +4 |
| `.ai/alpha/scripts/lib/index.ts` | Export new function and type | +3, -1 |
| `.claude/agents/alpha/task-decomposer.md` | Updated granularity table, added validation check | +16, -1 |
| `.claude/commands/alpha/task-decompose.md` | Added task count checklist items | +5 |

**Total: 8 files, 102 insertions(+), 6 deletions(-)**

## Commits

```
b0974e45c chore(tooling): enforce max 12 tasks per feature in Alpha task decomposition [agent: sdlc_implementor]
```

## Notes

- Recommendation from Alpha Orchestrator assessment report (lines 151-154)
- S1918 had features with up to 19 tasks, contributing to 33% completion rate
- Industry evidence (SWE-bench, Devin, Cursor) recommends 5-12 tasks per work unit
- Hard maximum of 12 allows buffer while preventing extreme cases
- Orchestrator pre-flight check is warning-only to maintain backward compatibility with existing specs

---

**Implementation Date:** 2026-02-09
**Implemented By:** Claude Code (sdlc_implementor)
**Status:** ✅ Complete
