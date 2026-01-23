# Bug Fix: Initiative Dependencies Not Enforced at Feature Level in Alpha Orchestrator

**Related Diagnosis**: #1627 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Initiative-level dependencies are defined in `spec-manifest.json` but never propagated to feature-level dependencies during manifest generation
- **Fix Approach**: Propagate initiative dependencies to features during manifest generation in `generateSpecManifest()`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator's work queue assigns features to sandboxes based on feature-level dependencies. However, when generating the manifest, initiative-level dependencies are stored at the initiative level but not propagated to the features within dependent initiatives. This causes features from dependent initiatives to be marked as immediately available, resulting in concurrent execution of features that should be sequential.

For full details, see diagnosis issue #1627.

### Solution Approaches Considered

#### Option 1: Propagate Initiative Dependencies to Features ⭐ RECOMMENDED

**Description**: After building the initiatives list in `generateSpecManifest()`, iterate through each feature and prepend its parent initiative's dependencies to the feature's `dependencies` array. This ensures the work queue respects the hierarchy: features wait for all features in prerequisite initiatives to complete.

**Pros**:
- Minimal code change (10-15 lines)
- Maintains clean separation: work queue uses only feature dependencies
- Reuses existing work queue logic without modification
- Easy to understand and maintain
- No risk of breaking existing functionality

**Cons**:
- None identified (this is the correct architectural fix)

**Risk Assessment**: low - Single function change, no architectural impact, tested by existing manifest generation

**Complexity**: simple - Straightforward array manipulation with standard loop

#### Option 2: Enhance Work Queue Dependency Logic

**Description**: Modify the work queue to look up initiative-level dependencies and check them when evaluating feature readiness.

**Pros**:
- Could handle dynamic dependency scenarios (if needed in future)

**Cons**:
- More complex logic in hot path (work queue runs frequently)
- Requires RPC/lookup call to fetch initiative data for each feature
- Introduces potential performance overhead
- Deviates from manifest-driven approach

**Why Not Chosen**: Adds unnecessary complexity and performance overhead. The manifest should be the single source of truth for the work queue.

#### Option 3: Store Both Initiative and Feature Dependencies

**Description**: Create a separate `initiativeDependencies` field at the feature level that the work queue checks.

**Pros**:
- Preserves distinction between direct and inherited dependencies

**Cons**:
- Adds complexity without benefit (work queue checks both?)
- Increases manifest size
- More confusing to maintainers

**Why Not Chosen**: The simple propagation approach is cleaner and easier to understand.

### Selected Solution: Propagate Initiative Dependencies to Features

**Justification**: This is the most elegant fix that aligns with the existing architecture. The manifest is the authoritative source for the work queue. By propagating dependencies during generation, we ensure the manifest is complete and self-contained, allowing the work queue to operate with zero changes. This is a one-function fix with no cascading changes.

**Technical Approach**:
- In `manifest.ts`, after generating the `initiatives` array
- Iterate through `initiatives` to identify all parent initiatives of each feature
- For each feature, prepend parent initiative dependencies to feature dependencies
- Result: features inherit their initiative's dependency constraints
- Work queue processes feature dependencies as before (no changes needed)

**Architecture Changes** (if any):
- None - this is an internal fix to the manifest generation
- Work queue behavior changes but the code doesn't change
- Features will correctly wait for prerequisite initiatives

**Migration Strategy** (if needed):
- Not applicable - this is a bug fix, not a breaking change
- Previous manifests were incorrect; new ones are correct

## Implementation Plan

### Affected Files

- `tools/spec-orchestrator/manifest.ts` - Add dependency propagation logic in `generateSpecManifest()`
- `.ai/alpha/specs/S1607-Spec-user-dashboard/spec-manifest.json` - Will be regenerated with correct dependencies
- Tests: `tools/spec-orchestrator/manifest.test.ts` (if exists) or new test file

### New Files

- `tools/spec-orchestrator/manifest.test.ts` - Unit tests for dependency propagation (if not already existing)

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Read Current Manifest Generation Code

<describe what this step accomplishes>

- Read `tools/spec-orchestrator/manifest.ts` to understand current implementation
- Identify the `generateSpecManifest()` function
- Locate where `initiatives` array is built
- Understand current feature structure

**Why this step first**: Need to understand the exact location and format before making changes

#### Step 2: Implement Dependency Propagation Logic

<describe what this step accomplishes>

After the initiatives are built in `generateSpecManifest()`, add logic to propagate dependencies:

```typescript
// Propagate initiative-level dependencies to features
for (const initiative of manifest.initiatives) {
  for (const feature of initiative.features) {
    if (initiative.dependencies && initiative.dependencies.length > 0) {
      // Prepend initiative dependencies to feature dependencies
      feature.dependencies = [
        ...initiative.dependencies,
        ...(feature.dependencies || [])
      ];
    }
  }
}
```

**Specific changes**:
- Add this logic after the initiatives list is fully constructed
- Ensure no duplicate dependencies (use Set if needed)
- Preserve existing feature dependencies (append, don't replace)

#### Step 3: Verify Implementation

<describe what this step accomplishes>

- Check that manifests are generated correctly
- Regenerate S1607 manifest: `tsx spec-orchestrator.ts S1607`
- Verify spec-manifest.json shows correct feature dependencies
- Compare before/after to confirm fix

**Verification example**:
```json
// Before: Feature has empty dependencies
{ "id": "S1607.I3.F1", "dependencies": [] }

// After: Feature inherits initiative dependencies
{ "id": "S1607.I3.F1", "dependencies": ["S1607.I1"] }
```

#### Step 4: Write Unit Tests

<describe what this step accomplishes>

Add tests to prevent regression:

- Test 1: Feature inherits single initiative dependency
- Test 2: Feature inherits multiple initiative dependencies
- Test 3: Feature keeps own dependencies + inherits initiative dependencies
- Test 4: Dependency order is correct (initiative deps first)
- Test 5: No duplicate dependencies in result

**Test file**: `tools/spec-orchestrator/manifest.test.ts`

#### Step 5: Validate with E2E Test

<describe what this step accomplishes>

Run the full orchestrator workflow to confirm correct behavior:

- Run orchestrator with S1607 spec on 3 sandboxes
- Verify features from I3 wait for I1 completion
- Check logs show correct sequencing
- No sandboxes should start I3 features before I1 completes

#### Step 6: Code Quality & Validation

- Run `pnpm typecheck`
- Run `pnpm lint`
- Run `pnpm format`
- All commands must pass

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Single initiative dependency propagation
- ✅ Multiple initiative dependencies propagation
- ✅ Preserving existing feature dependencies
- ✅ Dependency order (initiative deps first)
- ✅ No duplicate dependencies
- ✅ Empty dependencies handled correctly

**Test file**:
- `tools/spec-orchestrator/manifest.test.ts` - New or update existing tests

### Integration Tests

<if needed, describe integration test scenarios>

Run full manifest generation for existing specs:
- S1607: Verify all features in I2, I3, I4, I5 have S1607.I1 in their dependencies
- Verify no circular dependencies introduced
- Verify manifest is valid and complete

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Regenerate S1607 manifest with new code
- [ ] Verify spec-manifest.json has correct feature dependencies
- [ ] Run orchestrator with 3 sandboxes on S1607
- [ ] Confirm I3 features wait for I1 completion in logs
- [ ] Confirm no sandboxes work on I3 until I1 finishes
- [ ] Verify timestamps show correct sequencing
- [ ] Test with other specs if available
- [ ] Verify no performance regression

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Circular dependency creation**: If propagation isn't careful, could create cycles
   - **Likelihood**: low
   - **Impact**: high (would break entire orchestrator)
   - **Mitigation**: Inherit directly from parent initiative, don't add new dependencies

2. **Duplicate dependencies**: Features might end up with duplicate entries
   - **Likelihood**: medium
   - **Impact**: low (work queue handles duplicates gracefully)
   - **Mitigation**: Use Set to deduplicate before assigning

3. **Breaking existing manifests**: If old manifests relied on empty feature dependencies
   - **Likelihood**: low
   - **Impact**: low (manifests are regenerated fresh)
   - **Mitigation**: Regenerate all manifests after deploy

**Rollback Plan**:

If this fix causes issues:
1. Revert `manifest.ts` to previous version
2. Regenerate all affected manifests
3. Restart orchestrator processes
4. Monitor for correct feature assignment

**Monitoring** (if needed):
- Monitor orchestrator logs for feature assignment patterns
- Watch for any tasks failing due to unmet dependencies
- Alert if concurrent features appear from dependent initiatives

## Performance Impact

**Expected Impact**: none

This change adds a simple O(n) loop over features during manifest generation, which happens once at startup. No runtime performance impact on the work queue or feature execution.

**Performance Testing**:
- Time manifest generation before and after
- Should be <100ms difference on full spec

## Security Considerations

**Security Impact**: none

This is an internal orchestrator fix with no external API or security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Generate manifest with current (broken) code
cd /home/msmith/projects/2025slideheroes
tsx tools/spec-orchestrator/manifest.ts S1607

# Check manifest - I3 features should have empty dependencies
cat .ai/alpha/specs/S1607-Spec-user-dashboard/spec-manifest.json | jq '.initiatives[] | select(.id == "S1607.I3") | .features[0] | .dependencies'

# Result: [] (empty) - this is the bug
```

**Expected Result**: Features from I3 show `dependencies: []`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm test:unit tools/spec-orchestrator/manifest.test.ts

# Generate manifest with fixed code
tsx tools/spec-orchestrator/manifest.ts S1607

# Check manifest - I3 features should inherit I1 dependency
cat .ai/alpha/specs/S1607-Spec-user-dashboard/spec-manifest.json | jq '.initiatives[] | select(.id == "S1607.I3") | .features[0] | .dependencies'

# Result: ["S1607.I1"] - bug is fixed!

# Build and full test
pnpm build
```

**Expected Result**: All commands succeed, features show inherited dependencies, bug is resolved.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Verify no other manifests broke
tsx tools/spec-orchestrator/manifest.ts --all-specs

# Check all initiatives have correct dependencies propagated
find .ai/alpha/specs -name "spec-manifest.json" -exec jq '.initiatives[] | {id: .id, features: [.features[] | {id: .id, deps: .dependencies}]}' {} \;
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - This uses only existing imports in manifest.ts

## Database Changes

**No database changes required** - This is an orchestrator manifest fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Regenerate all active spec manifests after code deploy
- No downtime required
- Can be deployed during business hours

**Feature flags needed**: no

**Backwards compatibility**: maintained - Only affects newly generated manifests

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (features inherit initiative dependencies)
- [ ] All tests pass (unit, integration, manual)
- [ ] Zero regressions detected
- [ ] Feature dependencies in manifest match initiative structure
- [ ] Orchestrator logs show correct sequencing
- [ ] Code review approved (if applicable)

## Notes

**Key insight**: The architecture already supports hierarchical dependencies correctly in the work queue. This fix simply ensures the manifest accurately represents that hierarchy, allowing the existing work queue logic to work as intended.

**Related code patterns**:
- Similar dependency propagation patterns in feature decomposition
- Work queue already handles feature dependency checking correctly
- No changes needed to work queue, only manifest generation

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1627*
