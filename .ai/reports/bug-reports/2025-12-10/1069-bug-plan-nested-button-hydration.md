# Bug Fix: Nested button hydration error in ScaleQuestion component

**Related Diagnosis**: #1068 (REQUIRED)
**Severity**: Medium
**Bug Type**: Regression
**Risk Level**: Low
**Complexity**: Simple

## Quick Reference

- **Root Cause**: ScaleQuestion wraps RadioGroupItem (which renders as `<button>`) in another `<button>`, creating invalid HTML nesting
- **Fix Approach**: Replace outer `<button>` wrapper with `<label>` element, leveraging the RadioGroupItemLabel component pattern
- **Estimated Effort**: Small
- **Breaking Changes**: No

## Solution Design

### Problem Recap

The ScaleQuestion component in the survey feature wraps each radio option in a `<button>` element (lines 58-78), which contains a `RadioGroupItem` component. Since `RadioGroupItem` renders as a Radix UI `<button>` internally, this creates invalid nested buttons (`<button><button></button></button>`), causing React hydration errors and HTML validation warnings.

For full details, see diagnosis issue #1068.

### Solution Approaches Considered

#### Option 1: Replace outer `<button>` with `<label>` ⭐ RECOMMENDED

**Description**: Replace the outer `<button>` wrapper with a semantic `<label>` element and leverage the existing `RadioGroupItemLabel` component pattern used in `plan-picker.tsx`.

**Pros**:
- Uses existing, proven pattern from the codebase (plan-picker.tsx)
- Produces valid, semantic HTML with no nesting violations
- Maintains all accessibility features (keyboard navigation, ARIA labels)
- Reduces code complexity
- RadioGroupItemLabel already handles hover states and selected styling
- Zero breaking changes

**Cons**:
- Requires understanding the RadioGroupItemLabel component interface
- Slight refactoring needed to move styles to the label component

**Risk Assessment**: Low - This pattern is already proven in production code

**Complexity**: Simple - straightforward element replacement

#### Option 2: Remove the outer button wrapper entirely

**Description**: Delete the outer `<button>` wrapper and rely on the RadioGroup's native interaction handling, moving onClick and keyboard handlers to the Label.

**Pros**:
- Simplest code change (just delete the wrapper)
- Maintains all functionality with less code

**Cons**:
- Loses the clickable area around the radio button (less user-friendly)
- Would require manual keyboard event handling on the Label
- Deviates from the pattern used elsewhere in the codebase
- Less consistent with existing implementations

**Why Not Chosen**: Option 1 provides better UX with clickable labels and aligns with existing codebase patterns.

#### Option 3: Use a div wrapper with role="button"

**Description**: Replace the `<button>` with a `<div>` and add `role="button"` for accessibility.

**Pros**:
- Removes HTML nesting issue

**Cons**:
- Non-semantic, requires additional ARIA attributes
- Not following HTML best practices
- More complex than using actual semantic elements
- Not the pattern used elsewhere in the codebase

**Why Not Chosen**: Using semantic `<label>` is more maintainable and aligns with project standards.

### Selected Solution: Replace outer `<button>` with `<label>` using RadioGroupItemLabel pattern

**Justification**: This approach uses the proven RadioGroupItemLabel pattern from plan-picker.tsx, which is already in production. It produces valid HTML, maintains all accessibility features, and requires minimal code changes. This solution is consistent with the codebase style and has demonstrated stability.

**Technical Approach**:
- Replace the `<button type="button">` wrapper with the `<RadioGroupItemLabel>` component
- Move the Radio checkbox and Label content inside RadioGroupItemLabel
- Update the className to use the label's built-in styling
- Keep the onClick handler for state management (RadioGroupItemLabel doesn't interfere)
- Maintain all keyboard navigation and accessibility features

**Architecture Changes** (if any):
- No architectural changes needed
- Leverages existing component that was already designed for this use case

**Migration Strategy** (if needed):
- No data migration needed
- No breaking API changes
- Backwards compatible - this is purely a rendering fix

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/home/(user)/assessment/survey/_components/scale-question.tsx` - Replace outer button wrapper with label element and RadioGroupItemLabel component

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update scale-question.tsx

Update the component to use the RadioGroupItemLabel pattern:

- Import `RadioGroupItemLabel` from `@kit/ui/radio-group`
- Replace the `<button>` wrapper (lines 58-78) with `<RadioGroupItemLabel>`
- Move `RadioGroupItem` and `Label` inside the label component
- Simplify styling by leveraging RadioGroupItemLabel's built-in classes
- Remove the `type="button"` attribute (no longer needed)
- Move onClick/onKeyDown to RadioGroupItem if needed, or rely on RadioGroupItemLabel's default behavior
- Keep the aria-label on RadioGroupItem for accessibility

**Why this step first**: This is the single code change needed to fix the HTML validation error and hydration issue.

#### Step 2: Add/update tests

Add regression tests to prevent this pattern from reoccurring:

- Add unit test to verify RadioGroupItem is not nested inside a button element
- Test that ScaleQuestion renders without hydration errors
- Test keyboard navigation (Enter, Space keys)
- Test accessibility (aria-labels present)

**Test files**:
- Create `scale-question.spec.ts` to test component rendering and interactions

#### Step 3: Validation

Ensure the fix is complete and working:

- Verify no console hydration errors
- Check browser DevTools HTML validation (no nested button errors)
- Test radio selection functionality
- Test keyboard navigation
- Verify styling matches original design
- Run full test suite

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ ScaleQuestion renders without nested button errors
- ✅ RadioGroupItem is properly nested inside a label, not a button
- ✅ Radio option selection works with mouse click
- ✅ Radio option selection works with Enter key
- ✅ Radio option selection works with Space key
- ✅ Aria-labels are present and correct
- ✅ Selected option visual feedback works
- ✅ Regression test: Original bug should not reoccur

**Test files**:
- `apps/web/app/home/(user)/assessment/survey/_components/scale-question.spec.ts` - Tests for component rendering, interaction, and accessibility

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/course/lessons/before-you-go` page
- [ ] Open browser DevTools Console
- [ ] Verify no React hydration error messages appear
- [ ] Verify no HTML validation errors about nested buttons
- [ ] Click on different radio options and verify they select correctly
- [ ] Use keyboard (Enter/Space) to select options
- [ ] Verify selected option has visual highlight (background color change)
- [ ] Verify submit button is disabled until option is selected
- [ ] Test in both light and dark modes
- [ ] Verify no layout shifts or styling issues

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Styling Mismatch**: The RadioGroupItemLabel component might apply different styles than the original button
   - **Likelihood**: Low
   - **Impact**: Low (styling can be easily adjusted via className prop)
   - **Mitigation**: Compare visual appearance side-by-side during testing; adjust className if needed

2. **Interaction Handler Incompatibility**: onClick/onKeyDown handlers on the button might not work the same way on a label
   - **Likelihood**: Very Low
   - **Impact**: Low (keyboard navigation is handled by Radix RadioGroup internally)
   - **Mitigation**: Test keyboard navigation thoroughly; RadioGroupItemLabel is designed for this pattern

3. **Regression in Other Components**: If other components use the same pattern, they might also need fixing
   - **Likelihood**: Low (searched codebase, only ScaleQuestion has this issue)
   - **Impact**: Medium (would need similar fixes)
   - **Mitigation**: Confirm with grep that no other components use nested buttons in radio groups

**Rollback Plan**:

If this fix causes issues:
1. Revert the changes in scale-question.tsx to the original button wrapper
2. Re-run tests to confirm no new issues
3. Document the issue for future investigation

**Monitoring** (if needed):
- Monitor console errors on survey pages for any new hydration errors
- Check user session analytics to ensure survey completion rates don't drop
- Watch for any accessibility complaint reports related to survey questions

## Performance Impact

**Expected Impact**: None

No performance impact expected. This is purely a rendering fix that replaces one HTML element with another semantically equivalent element.

## Security Considerations

**Security Impact**: None

No security implications. This is a rendering fix with no changes to data handling, validation, or authentication logic.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to the survey page
# Expected: Console shows hydration errors about nested buttons
# Expected: DevTools HTML validation shows nested button warnings
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit apps/web/app/home/\(user\)/assessment/survey/_components/scale-question.spec.ts

# E2E tests (if applicable)
pnpm test:e2e --grep "survey"

# Build
pnpm build

# Manual verification
# Navigate to /home/course/lessons/before-you-go
# Check console for any errors
# Test radio selection functionality
```

**Expected Result**: All commands succeed, no hydration errors, no HTML validation errors, radio buttons work correctly.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
# Verify no other components have nested button issues
grep -r "RadioGroupItem" apps/web --include="*.tsx" | grep -c "button"
```

## Dependencies

**No new dependencies required** - This fix uses existing components and imports.

## Database Changes

**No database changes required** - This is purely a rendering fix.

## Deployment Considerations

**Deployment Risk**: Very Low

**No special deployment steps needed**:
- This is a client-side rendering fix only
- No API changes
- No database migrations
- No environment variables affected
- No feature flags needed

**Backwards compatibility**: Fully maintained - no breaking changes.

## Success Criteria

The fix is complete when:
- [ ] No React hydration errors in console
- [ ] No HTML validation errors about nested buttons
- [ ] All radio selection functionality works correctly
- [ ] Keyboard navigation works (Enter/Space keys)
- [ ] Visual styling matches original design
- [ ] All tests pass (unit, E2E)
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete

## Notes

### Reference Implementations

The correct pattern for this component is already implemented in the codebase:
- **plan-picker.tsx** (lines 145-191 and 242-347) shows the correct way to use RadioGroupItem inside a label element
- The `RadioGroupItemLabel` component was specifically designed to wrap radio options in an accessible label

### Key Insights from Diagnosis

1. The RadioGroupItem component from Radix UI renders as a `<button>` element internally
2. HTML specification forbids nested buttons
3. The existing `RadioGroupItemLabel` component in radio-group.tsx provides the correct semantic structure
4. The plan-picker.tsx demonstrates this pattern in production use

### Why This Fix is Safe

1. The RadioGroupItemLabel component has been tested and proven in production (billing plan picker)
2. Radix UI RadioGroup handles all keyboard navigation internally
3. The fix is a pure rendering change with no logic modifications
4. No API or prop changes required
5. Fully backwards compatible with existing code

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1068*
