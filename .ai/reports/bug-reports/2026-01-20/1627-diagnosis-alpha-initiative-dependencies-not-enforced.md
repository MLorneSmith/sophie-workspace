# Bug Diagnosis: Initiative Dependencies Not Enforced at Feature Level

**ID**: PENDING (to be assigned)
**Created**: 2026-01-20T16:25:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator's work queue does not enforce initiative-level dependencies when assigning features. Features from initiatives that depend on other initiatives (e.g., I3 depends on I1) are being assigned to sandboxes concurrently with features from the prerequisite initiative, rather than waiting for the prerequisite initiative to complete.

## Environment

- **Application Version**: Alpha Implementation System (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: v22.x
- **Last Working**: Unknown (may have never worked correctly)

## Reproduction Steps

1. Create a spec with multiple initiatives where I2, I3, I4, I5 all depend on I1
2. Run the spec orchestrator with 3 sandboxes: `tsx spec-orchestrator.ts S1607`
3. Observe sandbox assignments in the logs

## Expected Behavior

When Initiative I2 has `dependencies: ["S1607.I1"]`, all features in I2 should wait until ALL features in I1 are completed before being assigned. The work queue should:
1. First assign all features from I1 (S1607.I1.F1, S1607.I1.F2, S1607.I1.F3)
2. Only after I1 is marked as "completed" should features from I2, I3, I4, I5 become available

## Actual Behavior

Features from I3 (S1607.I3.F1) were assigned to sandbox-c at the **same time** as features from I1 (S1607.I1.F1) were still being worked on by sandbox-a.

From the logs:
- **16:00:46** - sbx-a assigned S1607.I1.F1 (Initiative 1, Feature 1)
- **16:00:45** - sbx-b assigned S1607.I2.F1 (Initiative 2, Feature 1)
- **16:00:45** - sbx-c assigned S1607.I3.F1 (Initiative 3, Feature 1)

All three sandboxes started features from **different initiatives simultaneously**, despite I2 and I3 having `dependencies: ["S1607.I1"]` at the initiative level.

## Diagnostic Data

### Spec Manifest Configuration

Initiative dependencies ARE correctly defined in the manifest:

```json
{
  "id": "S1607.I2",
  "name": "progress visualization",
  "dependencies": ["S1607.I1"]
},
{
  "id": "S1607.I3",
  "name": "task activity",
  "dependencies": ["S1607.I1"]
},
{
  "id": "S1607.I4",
  "name": "quick actions",
  "dependencies": ["S1607.I1"]
},
{
  "id": "S1607.I5",
  "name": "coaching integration",
  "dependencies": ["S1607.I1"]
}
```

### Feature-Level Dependencies Missing

However, the **features within those initiatives have empty dependencies**:

```json
{
  "id": "S1607.I2.F1",
  "initiative_id": "S1607.I2",
  "dependencies": []  // <-- EMPTY! Should inherit from initiative
},
{
  "id": "S1607.I3.F1",
  "initiative_id": "S1607.I3",
  "dependencies": []  // <-- EMPTY! Should inherit from initiative
}
```

### Work Queue Logic Analysis

The `getNextAvailableFeature()` function in `work-queue.ts` checks dependencies:

```typescript
// Check if all dependencies are satisfied
const depsComplete = feature.dependencies.every((depId) => {
  // Check if it's a completed feature
  if (completedFeatureIds.has(depId)) {
    return true;
  }
  // Check if it's a completed initiative
  if (completedInitiativeIds.has(depId)) {
    return true;
  }
  return false;
});
```

This logic CAN handle initiative-level dependencies (`completedInitiativeIds`), but only if the **feature's `dependencies` array actually contains the initiative ID**.

### Root Cause

The **manifest generator** (`manifest.ts`) does NOT propagate initiative-level dependencies to feature-level dependencies. The `generateSpecManifest()` function:

1. Extracts initiative dependencies from `initiative.md` → stored in `initiatives[].dependencies`
2. Extracts feature dependencies from `feature.md` → stored in `feature_queue[].dependencies`
3. **Never cross-references** the two - features don't inherit their parent initiative's dependencies

Since the work queue checks `feature.dependencies` (which is empty), it passes the dependency check and assigns the feature immediately.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Initiative-level dependencies are not propagated to feature-level dependencies during manifest generation, causing the work queue to incorrectly allow features from dependent initiatives to run concurrently.

**Detailed Explanation**:
The manifest generator stores initiative dependencies in `initiative.dependencies` but never adds these to the `dependencies` array of features belonging to that initiative. When the work queue's `getNextAvailableFeature()` function checks if a feature can be assigned, it only looks at `feature.dependencies`, which is empty. The work queue DOES have code to check `completedInitiativeIds`, but this code path is never reached because `feature.dependencies` is empty and the loop exits early with `depsComplete = true`.

**Supporting Evidence**:
1. Log files show features from I2 and I3 starting at 16:00:45, same time as I1
2. spec-manifest.json shows `initiative.dependencies: ["S1607.I1"]` but `feature.dependencies: []`
3. Code analysis confirms no propagation logic exists in `generateSpecManifest()`

### How This Causes the Observed Behavior

1. User runs orchestrator for spec S1607
2. Manifest generator creates feature queue with empty `dependencies` arrays
3. Work queue's `getNextAvailableFeature()` is called for each sandbox
4. For S1607.I3.F1, it checks `feature.dependencies.every(...)` - empty array returns `true`
5. Feature is returned as available despite parent initiative I3 depending on I1
6. sbx-c starts working on I3.F1 while sbx-a is still on I1.F1

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code path analysis confirms the gap
- Log timestamps exactly match the expected incorrect behavior
- The manifest data structure clearly shows the missing propagation
- No other code path exists that could enforce initiative dependencies

## Fix Approach (High-Level)

Two possible fix approaches:

**Option A - Fix at Manifest Generation** (Recommended):
In `generateSpecManifest()`, after building the initiatives list, iterate through each feature and prepend its parent initiative's dependencies to the feature's dependencies array. This ensures the work queue's existing logic will work correctly.

**Option B - Fix at Work Queue**:
In `getNextAvailableFeature()`, before checking feature dependencies, look up the parent initiative and check if all initiative dependencies are complete. This is more complex and could miss edge cases.

Option A is simpler and more robust because it makes the dependency relationship explicit in the data structure.

## Diagnosis Determination

The root cause has been conclusively identified through code analysis and log correlation. Initiative-level dependencies are properly stored but never propagated to feature dependencies, causing the work queue to incorrectly mark dependent features as available for assignment.

## Additional Context

- This bug likely existed since the spec-level orchestrator was created
- The documentation in `alpha-implementation-system.md` describes the expected behavior (I2 waits for I1) but the implementation doesn't match
- All 5 initiatives in S1607 have dependencies on I1, so this affected 4/5 initiatives

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (spec-manifest.json, work-queue.ts, manifest.ts), Glob (logs, progress files)*
