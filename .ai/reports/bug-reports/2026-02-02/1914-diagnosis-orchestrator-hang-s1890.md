# Bug Diagnosis: Alpha Orchestrator Hangs at 25:46 on S1890 Due to Circular Feature Dependency

**ID**: ISSUE-1914
**Created**: 2026-02-02T18:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator hung indefinitely at 25 minutes 46 seconds while implementing S1890 (User Dashboard). All three sandboxes transitioned to idle state waiting for dependencies that can never be satisfied due to a **circular self-dependency** on feature S1890.I5.F2 (Presentation Outline Table) - the feature depends on itself in its dependency list.

## Environment

- **Application Version**: dev branch (commit 31a6e8bb7)
- **Environment**: Development (E2B sandboxes)
- **Node Version**: v22.x (E2B default)
- **Database**: N/A (no DB features in blocked path)
- **Last Working**: Prior S1815 spec ran successfully

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1890`
2. Orchestrator starts successfully, creates 3 sandboxes
3. Features S1890.I1.F1 through S1890.I6.F3 complete normally
4. Feature S1890.I5.F1 (Quick Actions Panel) gets stuck and is marked with error
5. Feature S1890.I5.F2 (Presentation Outline Table) cannot start due to self-dependency
6. All I7 (Empty States & Polish) features are blocked by S1890.I5.F2
7. All 3 sandboxes transition to idle state
8. Orchestrator hangs indefinitely waiting for features that can never complete

## Expected Behavior

1. Orchestrator should detect circular dependency during manifest generation or work assignment
2. Circular dependencies should be flagged as an error with clear message
3. Orchestrator should not hang - should either fail fast or skip the problematic feature chain

## Actual Behavior

1. Orchestrator accepts the circular dependency without validation
2. S1890.I5.F2 can never be picked up because it depends on itself
3. All downstream features (I7.F1-F5) are blocked forever
4. Sandboxes report "Waiting for dependencies (6 features blocked)"
5. Work loop continues indefinitely checking for available features

## Diagnostic Data

### spec-manifest.json Feature Dependency (Root Cause)

```json
{
  "id": "S1890.I5.F2",
  "title": "Presentation Outline Table",
  "status": "pending",
  "dependencies": [
    "S1890.I1.F1",   // OK - completed
    "S1890.I2.F1",   // OK - completed
    "S1890.I2.F2",   // OK - completed
    "S1890.I5.F1",   // OK - but has error "Stuck: 7 tasks remaining"
    "S1890.I5.F2"    // ⛔ CIRCULAR: Feature depends on ITSELF!
  ]
}
```

### Progress File Evidence

```json
// sbx-a-progress.json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (6 features blocked)",
  "blocked_by": [
    "S1890.I5.F2",   // The self-referential feature
    "S1890.I7.F1",   // Blocked by I5.F2
    "S1890.I7.F2"    // Blocked by I5.F2
  ]
}
```

### Feature Status Summary

| Feature | Status | Issue |
|---------|--------|-------|
| S1890.I1.F1-F3 | ✅ completed | - |
| S1890.I2.F1-F3 | ✅ completed | - |
| S1890.I3.F1-F3 | ✅ completed | - |
| S1890.I4.F1-F3 | ✅ completed | - |
| S1890.I5.F1 | ❌ completed* | Has error "Stuck: 7 tasks remaining" but marked completed |
| **S1890.I5.F2** | ⏳ pending | **BLOCKED BY ITSELF** |
| S1890.I6.F1-F3 | ✅ completed | - |
| S1890.I7.F1-F5 | ⏳ pending | Blocked by S1890.I5.F2 |

### Log Evidence

```
[PTY] Feature still running with recent heartbeat, continuing wait (iteration N)
...
# All sandboxes eventually report:
waiting_reason: "Waiting for dependencies (6 features blocked)"
blocked_by: ["S1890.I5.F2", ...]
```

## Error Stack Traces

No stack traces - the orchestrator doesn't crash, it hangs in an infinite loop checking for available features.

## Related Code

- **Affected Files**:
  - `.ai/alpha/specs/S1890-Spec-user-dashboard/spec-manifest.json` - Contains circular dependency
  - `.ai/alpha/scripts/lib/work-queue.ts:150-175` - Dependency checking logic (doesn't detect cycles)
  - `.ai/alpha/scripts/lib/work-loop.ts:440-485` - Main loop (continues forever)
  - `.ai/alpha/scripts/generate-spec-manifest.ts` - Manifest generation (doesn't validate cycles)

- **Recent Changes**: Feature decomposition for S1890.I5 (PR unknown) introduced the self-dependency

- **Suspected Functions**:
  - `getNextAvailableFeature()` - Loops through features checking dependencies
  - `handleIdleState()` - Returns false when blocked features exist, continuing loop
  - `generateSpecManifest()` - Should validate dependency graph

## Related Issues & Context

### Similar Symptoms

- #1777: Deadlock detection (existing feature, but doesn't cover self-dependency)
- #1782: Phantom completion detection (different issue)
- #1841: Promise timeout detection (different issue)

### Historical Context

The orchestrator has sophisticated deadlock detection for failed features blocking initiative completion, but lacks validation for **circular dependencies at the feature level** during manifest generation.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Feature S1890.I5.F2 has a circular self-dependency (`"S1890.I5.F2"` in its own dependencies array) which was introduced during feature decomposition and not caught during manifest generation.

**Detailed Explanation**:

The issue originates in the **feature decomposition** stage (likely `/alpha:feature-decompose`). The `feature.md` file for S1890.I5.F2 shows dependencies:

```markdown
### Blocked By
- S1890.I1.F1: Dashboard Page Layout (needs grid container)
- S1890.I2.F1: Dashboard Types (needs type definitions for submissions)
- S1890.I2.F2: Dashboard Data Loader (needs building_blocks_submissions data)
- S1890.I5.F1: Quick Actions Panel (F2 is lower priority, implement after F1)
```

The markdown file is **correct** - it lists 4 dependencies. However, when `generate-spec-manifest.ts` parsed these dependencies, it incorrectly added S1890.I5.F2 to its own dependency list. This suggests a bug in the dependency resolution logic during manifest generation.

**Supporting Evidence**:

1. `feature.md` has 4 dependencies (no self-reference)
2. `spec-manifest.json` has 5 dependencies (includes self-reference)
3. `tasks.json` validation passes (internal task deps are correct)
4. All 3 sandboxes report S1890.I5.F2 as blocking

### How This Causes the Observed Behavior

1. Manifest generation adds S1890.I5.F2 to its own dependencies
2. Work loop calls `getNextAvailableFeature()` which checks if all deps are complete
3. S1890.I5.F2 depends on S1890.I5.F2 (itself), which is "pending"
4. Feature is never available because its dependency (itself) is never "completed"
5. S1890.I7.F1-F5 all depend on S1890.I5.F2, so they're blocked too
6. Work loop finds no available features, sandboxes go idle
7. `handleIdleState()` sees blocked features exist, returns false (continue)
8. Loop repeats forever

### Confidence Level

**Confidence**: High

**Reasoning**:
- The circular dependency is visible in `spec-manifest.json`
- The feature.md source file does NOT have the self-dependency
- All sandboxes are blocked waiting for the same feature
- The work queue code has no cycle detection
- Fixing the manifest manually would immediately unblock the chain

## Fix Approach (High-Level)

**Immediate Fix (S1890 specific)**:
1. Remove `"S1890.I5.F2"` from its own dependencies array in `spec-manifest.json`
2. Re-run orchestrator to continue

**Root Cause Fix (prevent recurrence)**:
1. Add cycle detection to `generate-spec-manifest.ts` during dependency resolution
2. Add validation in `getNextAvailableFeature()` or work loop to detect and report self-dependencies
3. Add pre-flight check in orchestrator startup to validate no circular dependencies exist

**Recommended validation code location**: `.ai/alpha/scripts/lib/manifest.ts` or a new `validation.ts` module

## Diagnosis Determination

The orchestrator hang at 25:46 was caused by a **circular self-dependency** where feature S1890.I5.F2 depends on itself. This was introduced during manifest generation and not caught by any validation. The work loop continues indefinitely because:

1. The feature can never become "completed" (it's waiting on itself)
2. The deadlock detection only handles failed features blocking initiatives, not self-references
3. The idle state handler keeps returning false because blocked features exist

**Secondary Issue**: S1890.I5.F1 (Quick Actions Panel) also has an error state ("Stuck: 7 tasks remaining but sandbox idle for 62s") but is incorrectly marked as `completed` in the manifest with `tasks_completed: 4` and `task_count: 7`. This is a separate bug where a stuck feature was marked complete despite not finishing all tasks. This doesn't cause the hang but should be investigated.

## Additional Context

**Workaround for immediate resume**:
```bash
# Edit spec-manifest.json and remove "S1890.I5.F2" from its own dependencies
# Then resume:
tsx .ai/alpha/scripts/spec-orchestrator.ts 1890
```

**Prevention recommendations**:
1. Add dependency cycle detection during `/alpha:feature-decompose`
2. Add manifest validation during `/alpha:task-decompose`
3. Add pre-flight check in orchestrator for circular dependencies
4. Consider adding timeout for "no progress" condition in work loop

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (manifest, logs, progress files, feature.md, tasks.json), Glob (file discovery)*
