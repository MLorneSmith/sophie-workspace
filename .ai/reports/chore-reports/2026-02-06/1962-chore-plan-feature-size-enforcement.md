# Chore: Enforce max 12 tasks per feature in Alpha task decomposition

## Chore Description

The Alpha Spec Orchestrator assessment identified that features with too many tasks cause sandbox timeouts and cascading failures. S1918 had features with up to 19 tasks (I6.F3), contributing to the 33% completion rate. Industry evidence (SWE-bench, Devin, Cursor, PARC) consistently shows that work units should be capped at 5-12 tasks for reliable autonomous execution.

Currently, **no validation enforces task count limits** anywhere in the pipeline:
- The `alpha-task-decomposer` agent has complexity-based "target steps" guidance (e.g., LOW=3-6, STANDARD=6-12) but no hard enforcement
- `validate-tasks-json.sh` validates task fields, m=1 compliance, hours range, and dependencies -- but not task count
- `tasks.schema.json` has no `maxItems` constraint on the tasks array
- `manifest.ts` reads `tasks.length` but doesn't validate it
- The orchestrator pre-flight checks validate cycles but not feature size

This chore adds task count enforcement at 4 layers:
1. **JSON Schema** -- `maxItems: 12` on the tasks array (catches at decomposition time)
2. **Validation script** -- New check in `validate-tasks-json.sh` (catches at validation time)
3. **Agent prompt** -- Hard rule in `task-decomposer.md` (catches at generation time)
4. **Orchestrator pre-flight** -- Warning in `pre-flight.ts` (catches at run time)

**Source**: Assessment report recommendation in `.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md` (lines 151-154: "Max tasks per feature: 10 recommended, 12 hard maximum")

## Relevant Files

Use these files to resolve the chore:

- `.ai/alpha/templates/tasks.schema.json` (line 133-139) - JSON Schema for tasks.json. The `tasks` array has no `maxItems`. Add `maxItems: 12` and `minItems: 1`.
- `.ai/alpha/scripts/validate-tasks-json.sh` (line 102) - Shell validation script. Reads `TASK_COUNT` but doesn't check against limits. Add a new "Check 8: Task count limits" section.
- `.claude/agents/alpha/task-decomposer.md` (lines 238-246) - Agent definition with complexity/granularity table. The HIGH level (61-80 score) suggests 12-20 steps, which exceeds the hard max. Update table and add explicit enforcement rule.
- `.claude/commands/alpha/task-decompose.md` (line 746-754) - Task decompose orchestrator pre-completion checklist. Add task count validation step.
- `.ai/alpha/scripts/lib/pre-flight.ts` (line 328+) - Orchestrator pre-flight checks. Add `checkFeatureTaskCounts()` function that warns about oversized features.
- `.ai/alpha/scripts/lib/manifest.ts` (line 576) - Reads `tasksJson.tasks.length`. Add warning log if task count exceeds limit during manifest generation.

## Impact Analysis

This change adds validation gates at multiple layers of the task decomposition and execution pipeline. It does not change any runtime behavior of the orchestrator itself -- it only prevents oversized features from being created or warns when they exist.

### Dependencies Affected

- `alpha-task-decomposer` agent -- will produce fewer tasks per feature for complex features (splits into sub-features instead)
- `validate-tasks-json.sh` -- will reject tasks.json files with >12 tasks
- `tasks.schema.json` -- JSON Schema validators will flag violations
- `pre-flight.ts` -- orchestrator will warn but NOT block on oversized features (soft enforcement)
- No downstream code depends on task count being unlimited

### Risk Assessment

**Low Risk**:
- All enforcement is additive (new checks, not changing existing behavior)
- Orchestrator pre-flight uses warnings, not hard failures (graceful degradation)
- Schema `maxItems` only blocks at decomposition time, not at runtime
- Existing features with >12 tasks can still run (warning only at orchestrator level)
- No database changes, no runtime behavioral changes

### Backward Compatibility

- Existing tasks.json files with >12 tasks remain valid for orchestrator execution (warning only)
- `validate-tasks-json.sh` will fail for >12 tasks -- this is intentional (prevents creating new oversized features)
- The complexity granularity table change (HIGH: 12-20 -> 10-12) affects future decompositions only
- No migration needed for existing specs

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/feature-size-enforcement`
- [x] Identify all validation points (4 layers: schema, script, agent, pre-flight)
- [x] Review existing task counts in production specs (max observed: 12 in S1890.I4.F3)
- [x] Confirm no existing code depends on unlimited task counts
- [ ] No database or infrastructure changes needed

## Documentation Updates Required

- Update `task-decomposer.md` granularity table with corrected ranges
- Update `task-decompose.md` pre-completion checklist with task count validation
- Update `validate-tasks-json.sh` header comment to list the new check
- Update `CLAUDE.md` Alpha Workflow Validation Checklist to mention max 12 tasks per feature
- No user-facing documentation changes (internal tooling)

## Rollback Plan

1. Revert `maxItems: 12` from `tasks.schema.json` -- decomposer can create unlimited tasks again
2. Revert the new check in `validate-tasks-json.sh` -- validation passes for any count
3. Revert `pre-flight.ts` changes -- no warnings at orchestrator startup
4. Agent prompt changes in `task-decomposer.md` are soft guidance -- reverting just removes the instruction
5. No database or infrastructure rollback needed

## Step by Step Tasks

### Step 1: Add task count constraints to JSON Schema

- In `.ai/alpha/templates/tasks.schema.json`, update the `tasks` array definition (line 133-139):
  - Add `"minItems": 1` -- a feature must have at least 1 task
  - Add `"maxItems": 12` -- hard maximum of 12 tasks per feature
  - Add a `"description"` update noting the limit and rationale

### Step 2: Add task count validation to validate-tasks-json.sh

- In `.ai/alpha/scripts/validate-tasks-json.sh`, after the hours range check (line 202) and before the dependencies check (line 204), add a new "Check 7: Task count limits" (renumber existing Check 7 to Check 8):
  ```bash
  # Check 7: Task count limits (max 12 tasks per feature)
  MAX_TASKS=12
  if (( TASK_COUNT > MAX_TASKS )); then
      add_error "Task count ($TASK_COUNT) exceeds maximum ($MAX_TASKS). Split feature into smaller sub-features."
      set_check "task_count" "false"
  elif (( TASK_COUNT == 0 )); then
      add_error "Feature has 0 tasks"
      set_check "task_count" "false"
  else
      set_check "task_count" "true"
  fi
  ```
- Update the script header comment (lines 11-17) to list the new check
- Update the output JSON example in the header to include `"task_count": true`

### Step 3: Add task count warning in manifest generation

- In `.ai/alpha/scripts/lib/manifest.ts`, after line 576 (`const taskCount = tasksJson.tasks.length;`), add:
  ```typescript
  if (taskCount > 12) {
      log(`   ⚠️ Feature ${featureId} has ${taskCount} tasks (max recommended: 12). Consider splitting.`);
  }
  ```
- This is a warning only -- it doesn't block manifest generation. Features that already exist with >12 tasks should still be runnable.

### Step 4: Add feature task count validation in orchestrator pre-flight

- In `.ai/alpha/scripts/lib/pre-flight.ts`, add a new exported function `checkFeatureTaskCounts()`:
  ```typescript
  export function checkFeatureTaskCounts(
      manifest: SpecManifest,
      log: (...args: unknown[]) => void,
  ): { proceed: boolean; oversizedCount: number } {
      log("   Validating feature task counts...");
      const MAX_TASKS_PER_FEATURE = 12;
      let oversizedCount = 0;

      for (const feature of manifest.feature_queue) {
          if (feature.task_count > MAX_TASKS_PER_FEATURE) {
              log(`   ⚠️ Feature ${feature.id} has ${feature.task_count} tasks (max: ${MAX_TASKS_PER_FEATURE})`);
              oversizedCount++;
          }
      }

      if (oversizedCount > 0) {
          log(`   ⚠️ ${oversizedCount} feature(s) exceed ${MAX_TASKS_PER_FEATURE} tasks. Consider splitting.`);
      } else {
          log("   ✅ All features within task count limits");
      }

      // Warning only - don't block execution
      return { proceed: true, oversizedCount };
  }
  ```
- In `.ai/alpha/scripts/lib/orchestrator.ts`, call `checkFeatureTaskCounts(manifest, log)` after the dependency cycle check (~line 356) and before dry-run. This is a warning only, so `proceed` is always true.
- Export the function from `.ai/alpha/scripts/lib/index.ts`

### Step 5: Update task-decomposer agent granularity table

- In `.claude/agents/alpha/task-decomposer.md` (lines 238-246), update the granularity table:
  - Change HIGH (61-80) from `12-20` to `10-12`
  - Change MAXIMAL (81+) from `20+` to `12` (hard cap)
  - Add a note below the table:
    ```
    **Hard Maximum: 12 tasks per feature.** If complexity requires more than 12 tasks, the feature MUST be split into sub-features during feature decomposition (Step 3 of Alpha workflow). Do not create tasks.json files with more than 12 tasks.
    ```

- In the Phase 6: Validation section (lines 835+), add a new validation check "6. Task Count Check" between Testability and Verdict Determination:
  ```
  #### 6. Task Count Check

  - Total task count <= 12?
  - Task count within complexity target_steps range?

  **Score**:
  - 100%: Within limits
  - <100%: Exceeds 12 tasks → REJECTED (split feature required)
  ```

- Update the Verdict Determination (line 900) to include:
  ```
  - Task Count = 100% (must not exceed 12)
  ```

### Step 6: Update task-decompose orchestrator checklist

- In `.claude/commands/alpha/task-decompose.md`, in the Pre-Completion Checklist (lines 735-754), add a new checklist item:
  ```
  ### Task Count
  - [ ] No feature has more than 12 tasks
  - [ ] Task count aligns with complexity target_steps range
  - [ ] If >12 tasks needed, recommend splitting feature in `/alpha:feature-decompose`
  ```

### Step 7: Run validation commands

- Run all validation commands listed below to confirm zero regressions

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Typecheck the orchestrator scripts
cd .ai/alpha/scripts && npx tsc --noEmit

# Run all orchestrator unit tests
cd .ai/alpha/scripts && npx vitest run lib/__tests__/

# Verify schema has maxItems
grep -n "maxItems" .ai/alpha/templates/tasks.schema.json

# Verify validate-tasks-json.sh has task count check
grep -n "task_count\|MAX_TASKS" .ai/alpha/scripts/validate-tasks-json.sh

# Verify pre-flight has task count function
grep -n "checkFeatureTaskCounts\|MAX_TASKS_PER_FEATURE" .ai/alpha/scripts/lib/pre-flight.ts

# Verify manifest.ts has warning
grep -n "max recommended\|Consider splitting" .ai/alpha/scripts/lib/manifest.ts

# Verify orchestrator calls the new pre-flight check
grep -n "checkFeatureTaskCounts" .ai/alpha/scripts/lib/orchestrator.ts

# Verify agent granularity table was updated
grep -A5 "HIGH.*61" .claude/agents/alpha/task-decomposer.md

# Run validation script against an existing tasks.json (should pass for <=12 tasks)
.ai/alpha/scripts/validate-tasks-json.sh .ai/alpha/specs/S1890-Spec-user-dashboard/S1890.I1-Initiative-dashboard-foundation/S1890.I1.F1-Feature-dashboard-page-layout/tasks.json
```

## Notes

- **Recommended vs Hard Maximum**: The assessment recommends 10 tasks per feature with 12 as the hard maximum. This chore enforces the hard max (12) in validation and schema, while the agent prompt guidance steers toward 10. This provides a buffer without being overly restrictive.
- **Splitting strategy**: When a feature would exceed 12 tasks, the correct action is to go back to `/alpha:feature-decompose` and split the feature into 2 smaller features. The task decomposer should NOT silently merge tasks to fit the limit.
- **Existing specs are not affected**: The orchestrator pre-flight uses warnings, not hard blocks. S1918 features with >12 tasks will still run but with a visible warning.
- **The complexity granularity table change is the most impactful**: Changing HIGH from 12-20 to 10-12 and MAXIMAL from 20+ to 12 means the agent will produce fewer tasks for complex features. This is the primary behavioral change.
- **This chore is independent** of P1 (centralized state transitions), P2 (dead code removal), P3 (runtime status validation), Q2 (stagger reduction), and Phase support (#1961). Can be done in parallel with any of them.
