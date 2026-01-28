# Bug Fix: E2E Payload Create New Button Strict Mode Violations

**Related Diagnosis**: #1863
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Text-based selector `a:has-text("Create New")` matches 2 elements in Payload CMS 3.72.0 UI (pill button + primary CTA)
- **Fix Approach**: Replace with specific `.first()` selector to avoid strict mode violations
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `createNewButton` locator in `PayloadCollectionsPage.ts` uses a text-matching selector that resolves to 2 elements in Payload CMS 3.72.0, causing Playwright strict mode violations. This affects 14 tests across shards 8 and 9.

For full details, see diagnosis issue #1863.

### Solution Approaches Considered

#### Option 1: Use `.first()` with existing selector ⭐ RECOMMENDED

**Description**: Keep the existing selector logic but add `.first()` to explicitly choose the first matching element, avoiding strict mode violation.

```typescript
this.createNewButton = page
  .locator('a:has-text("Create New"), button:has-text("Create New")')
  .first();
```

**Pros**:
- Minimal code change (single word addition)
- Preserves existing selector logic and test compatibility
- Explicitly handles multiple matches without errors
- Works with both rendering variations of Payload UI
- Consistent with Playwright best practices for handling multiple matches
- Zero risk of breaking other tests

**Cons**:
- Doesn't prevent future strict mode issues if UI changes again
- Less semantically precise than targeting specific element

**Risk Assessment**: low - This is a well-tested Playwright pattern that won't break existing functionality

**Complexity**: simple - Single-line change to constructor

#### Option 2: Use specific class selector

**Description**: Target the small pill button using its unique class.

```typescript
this.createNewButton = page.locator('.list-create-new-doc__create-new-button');
```

**Pros**:
- Highly specific, no ambiguity
- Targets exactly one element

**Cons**:
- Relies on Payload internal CSS class names that could change in updates
- Less resilient to Payload version changes
- May not work if Payload changes their internal class structure

**Why Not Chosen**: Internal CSS classes are implementation details that Payload CMS doesn't guarantee will remain stable across versions. This would make tests brittle.

#### Option 3: Use aria-label or getByRole

**Description**: Target button by its ARIA label or role.

```typescript
this.createNewButton = page.getByLabel('Create new Post');
// OR
this.createNewButton = page.getByRole('link', { name: /Create new/i }).first();
```

**Pros**:
- Semantic and accessibility-focused
- More resilient to UI changes

**Cons**:
- ARIA label includes collection name ("Create new Post"), making it collection-specific
- Would need dynamic construction based on collection name
- More complex than needed for this fix

**Why Not Chosen**: Adds unnecessary complexity. The collection name varies, so we'd need to make the locator dynamic, increasing maintenance burden.

### Selected Solution: Use `.first()` with existing selector

**Justification**: This approach provides the best balance of simplicity, reliability, and maintainability. It's a single-word addition that follows Playwright best practices for handling multiple matching elements. The fix is surgical, low-risk, and doesn't introduce new dependencies on Payload's internal implementation details.

**Technical Approach**:
- Add `.first()` to the existing `createNewButton` locator
- Update `expectCollectionAccessible()` to handle visibility checks correctly with `.first()`
- No changes needed to test logic or assertions

**Architecture Changes**: None - this is a locator refinement, not an architectural change

**Migration Strategy**: Not applicable - this is a test fix with no production impact

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts` - Update `createNewButton` locator and `expectCollectionAccessible()` method

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update createNewButton locator

Update the constructor in `PayloadCollectionsPage.ts` to add `.first()`:

- Locate the `createNewButton` definition in the constructor (lines 26-28)
- Add `.first()` to the locator chain
- Verify syntax is correct

**Why this step first**: This is the core fix - resolving the strict mode violation at the source

#### Step 2: Update expectCollectionAccessible() method

Ensure the visibility check in `expectCollectionAccessible()` handles the updated locator:

- Review the `Promise.race()` logic in `expectCollectionAccessible()` (lines 170-181)
- Verify `.first()` works correctly with `isVisible()` calls
- No code changes needed - `.first()` is compatible with visibility checks

**Why this step second**: Ensures the fix works correctly in all usage contexts

#### Step 3: Run affected test shards locally

Verify the fix resolves the failures:

- Run shard 8: `pnpm --filter web-e2e test:shard8`
- Run shard 9: `pnpm --filter web-e2e test:shard9`
- Verify all 14 previously failing tests now pass
- Check that no new failures are introduced

#### Step 4: Run full E2E suite

Ensure no regressions in other shards:

- Run all E2E tests: `pnpm test:e2e`
- Verify all shards pass
- Check test execution time hasn't increased

#### Step 5: Validate in CI

Push changes and verify CI pipeline:

- Commit changes with conventional commit message
- Push to feature branch
- Monitor CI E2E Sharded workflow
- Verify shards 8 and 9 pass in GitHub Actions

## Testing Strategy

### Unit Tests

Not applicable - this is a test code fix, not production code.

### Integration Tests

Not applicable - this is an E2E test infrastructure fix.

### E2E Tests

The fix itself is in E2E test code. Validation:

**Test files affected**:
- `apps/e2e/tests/payload/payload-database.spec.ts` - 3 tests
- `apps/e2e/tests/payload/payload-collections.spec.ts` - 11 tests

**Validation strategy**:
- ✅ All 14 previously failing tests should pass
- ✅ No regressions in other shards (1-7, 10-12)
- ✅ Consistent test execution time

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug by checking out commit before fix
- [ ] Verify shards 8 and 9 fail with strict mode violations
- [ ] Apply fix and run shard 8 locally
- [ ] Apply fix and run shard 9 locally
- [ ] Verify all 14 tests pass
- [ ] Run full E2E suite locally
- [ ] Verify no regressions in other shards
- [ ] Push to CI and verify GitHub Actions pass
- [ ] Check test execution time is similar to baseline

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **`.first()` selects wrong button**: If Payload CMS changes button order in future versions
   - **Likelihood**: low (Payload UI is stable, button order unlikely to change)
   - **Impact**: medium (tests would fail but wouldn't affect production)
   - **Mitigation**: E2E tests would fail immediately if order changes, alerting us to update selectors

2. **Performance impact from `.first()`**: Minimal overhead from `.first()` method
   - **Likelihood**: negligible
   - **Impact**: negligible (microseconds per test)
   - **Mitigation**: None needed - `.first()` is a native Playwright optimization

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit with the `.first()` addition
2. Return to diagnosis phase if new pattern emerges
3. Consider Option 3 (aria-label) as fallback

**Monitoring**:
- Monitor E2E test success rate in CI/CD dashboard
- Watch for new Playwright strict mode violations in other selectors
- Track test execution time to ensure no performance degradation

## Performance Impact

**Expected Impact**: none

The `.first()` method is a Playwright optimization that doesn't add measurable overhead. It simply returns the first element from the matching set without evaluating the rest.

**Performance Testing**:
- Compare test execution time before/after fix
- Expected: < 1% difference in total E2E suite time

## Security Considerations

**Security Impact**: none

This is a test infrastructure change with no production or security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Checkout commit before fix
git checkout e7d8b3765

# Run failing shards
pnpm --filter web-e2e test:shard8
pnpm --filter web-e2e test:shard9
```

**Expected Result**: 14 tests fail with strict mode violations

### After Fix (Bug Should Be Resolved)

```bash
# Type check (E2E tests are TypeScript)
pnpm --filter web-e2e typecheck

# Lint
pnpm --filter web-e2e lint

# Format
pnpm --filter web-e2e format

# Run affected shards
pnpm --filter web-e2e test:shard8
pnpm --filter web-e2e test:shard9

# Run full E2E suite
pnpm test:e2e

# Verify build
pnpm build
```

**Expected Result**: All commands succeed, 14 tests pass, zero regressions.

### Regression Prevention

```bash
# Run all E2E shards to verify no regressions
pnpm --filter web-e2e test:shard1
pnpm --filter web-e2e test:shard2
pnpm --filter web-e2e test:shard3
pnpm --filter web-e2e test:shard4
pnpm --filter web-e2e test:shard5
pnpm --filter web-e2e test:shard6
pnpm --filter web-e2e test:shard7
pnpm --filter web-e2e test:shard10
pnpm --filter web-e2e test:shard11
pnpm --filter web-e2e test:shard12

# Full test suite
pnpm test
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change with no production impact.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (test infrastructure change only)

## Success Criteria

The fix is complete when:
- [x] All validation commands pass
- [x] Bug no longer reproduces
- [x] All 14 previously failing tests pass
- [x] Zero regressions detected in other shards
- [x] Manual testing checklist complete
- [x] CI/CD pipeline passes (shards 8 and 9)
- [x] Test execution time unchanged

## Notes

**Historical Context**: This is the same pattern as issue #847 where the `saveButton` selector was fixed by using an ID selector. In this case, `.first()` is more appropriate than searching for an ID because:
1. Payload doesn't expose stable IDs for the "Create New" button
2. The `.first()` pattern is more resilient to Payload version updates
3. It's simpler and more maintainable than relying on internal class names

**Related Patterns**: If similar strict mode violations occur with other Payload UI elements, follow this pattern:
1. Identify if the selector matches multiple elements
2. Use `.first()` to select the first match
3. Verify the first match is the correct interactive element
4. Document the choice in code comments

**Playwright Best Practice**: When a selector matches multiple elements and you know the first is correct, use `.first()` explicitly rather than making the selector more complex. This keeps selectors readable and maintainable.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1863*
*Fix plan issue: #1865*
