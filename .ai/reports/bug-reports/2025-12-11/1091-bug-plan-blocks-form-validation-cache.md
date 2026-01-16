# Bug Fix: Multi-Step Form Validation Errors and Missing List Refresh

**Related Diagnosis**: #1090 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: (1) Validation runs before form state updates complete and errors persist via "touched fields" tracking; (2) React Query cache not invalidated when new presentation created
- **Fix Approach**: (1) Defer validation to blur events and clear errors optimistically on value change; (2) Add cache invalidation via `useQueryClient` after successful submission
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The multi-step blocks form has two interconnected issues affecting user experience:

1. **False Validation Errors**: "This field is required" errors display on valid selections because validation runs before form state updates complete, and error state persists since fields are marked as "touched" immediately
2. **Stale Cache After Submission**: After successfully creating a presentation, the dropdown on `/home/ai` shows old data because React Query's cache is never invalidated

For full details, see diagnosis issue #1090.

### Solution Approaches Considered

#### Option 1: Optimistic Validation with Deferred Error Clearing ⭐ RECOMMENDED

**Description**: Clear validation errors optimistically when field value changes (non-empty), only show errors on blur or submission. Mark fields as touched on blur, not on change.

**Pros**:
- Eliminates false error messages immediately when user provides input
- Preserves validation feedback for empty/invalid submissions
- Minimal state changes, follows react-hook-form patterns
- Works with all field types (select, text, multiple choice)

**Cons**:
- Requires tracking separate "touched on blur" state
- Slightly more code than current approach
- Need to adjust error display logic in template

**Risk Assessment**: low - Changes only validation timing and error display logic, no business logic affected

**Complexity**: simple - Pure state management change

#### Option 2: Validate on Blur Only

**Description**: Move validation from onChange to onBlur events entirely, preventing validation from running while user is interacting.

**Pros**:
- Simplest conceptually - validation only on blur
- Eliminates timing issues with form state updates
- Users see immediate feedback after leaving field

**Cons**:
- Users get no feedback while typing/selecting
- May feel less responsive than current UX
- Requires separate blur handlers for all input types

**Why Not Chosen**: Less user-friendly; option 1 provides better UX with real-time feedback

#### Option 3: Defer All Validation Until Submission

**Description**: Only validate when form is submitted, show no field-level errors until submission attempt.

**Pros**:
- No timing issues, all validation happens once
- Cleanest logic flow
- No touched field tracking needed

**Cons**:
- Poor UX: no feedback until submission attempt
- Users may make same mistake multiple times
- Inconsistent with modern form patterns

**Why Not Chosen**: Worse user experience than other options

### Selected Solution: Optimistic Validation with Deferred Error Clearing + React Query Cache Invalidation

**Justification**:

For Issue 1: The optimistic approach is best because:
- Clears errors immediately when user provides input (positive feedback)
- Only shows errors when truly needed (blur or submission)
- Avoids touching field immediately, preventing false error display
- Uses standard form validation patterns (touch on blur)

For Issue 2: React Query cache invalidation via `useQueryClient` is best because:
- Server actions can't directly invalidate client caches (architectural separation)
- Using `useQueryClient` in component gives full control over invalidation timing
- Follows React Query best practices for mutations + query cache coordination
- No need to modify server action logic or create new API patterns

**Technical Approach**:

**For Issue 1 - Validation Errors**:
- Modify `BlocksFormContext.validateField` to clear errors when value is non-empty
- Track "blur touch" separately from "interaction touch"
- Only display errors if field was touched via blur (not just via change)
- Keep validation logic for submission checks

**For Issue 2 - Cache Invalidation**:
- Add `useQueryClient` hook to `EditPresentationCombobox` or wrapper component
- Call `queryClient.invalidateQueries({ queryKey: ["building-blocks-titles"] })` after successful form submission
- Use `useEffect` to trigger invalidation based on success state
- Ensure cache refetch happens immediately after redirect

**Architecture Changes** (if any):
- BlocksFormContext: Add `touchedFieldsOnBlur` Set to track blur touches separately
- BlocksForm: Update error display condition to check blur-touched fields
- AIWorkspaceDashboard or parent: Wrap submission flow to invalidate React Query cache

**Migration Strategy** (if needed):
- No data migration needed
- No API changes
- Backward compatible with existing form data

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/(authenticated)/home/ai/blocks/_lib/client/blocks-form-context.tsx` - Add blur touch tracking and optimistic error clearing
- `apps/web/app/(authenticated)/home/ai/blocks/_components/blocks-form.tsx` - Update validation error display logic and blur handlers
- `apps/web/app/(authenticated)/home/ai/_components/edit-presentation-combobox.tsx` - Add cache invalidation on successful submission
- `apps/web/app/(authenticated)/home/ai/_lib/client/use-building-blocks-titles.ts` - Verify query key consistency (no changes likely needed)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Validation State Management

Update `BlocksFormContext.tsx` to track blur touches separately from interaction touches.

- Add new state: `const [touchedFieldsOnBlur, setTouchedFieldsOnBlur] = useState<Set<keyof FormData>>(new Set());`
- Update `validateField` function to clear errors when value is non-empty (optimistic clearing)
- Create new function `markFieldAsTouchedOnBlur` that marks field as touched only on blur
- Keep existing `setTouchedFields` for tracking interactions, but don't use it for error display
- Export both the blur-touched set and the blur marking function

**Why this step first**: Establishes the foundation for all error display changes

#### Step 2: Update Form Error Display Logic

Update `BlocksForm.tsx` to only show errors for blur-touched fields and add blur handlers.

- Update error display condition from `touchedFields.has(field)` to `touchedFieldsOnBlur.has(field)`
- Add `onBlur` handlers to all form inputs that call `markFieldAsTouchedOnBlur(field)`
- Ensure error display only shows for truly invalid fields (empty strings)
- Test that selecting a valid option clears any previous errors immediately

**Why this step second**: Builds on the state management to prevent false error display

#### Step 3: Add Cache Invalidation After Submission

Update `EditPresentationCombobox.tsx` to invalidate React Query cache after successful submission.

- Import `useQueryClient` from `@tanstack/react-query`
- Get reference to query client
- Create a callback function that invalidates `["building-blocks-titles"]` query key
- Pass this callback to the form component or use context to trigger after submission
- Ensure invalidation happens after form redirects to `/home/ai`

Alternatively, wrap the submission in `BlocksForm.tsx`:
- After successful submission, invalidate the cache before navigation
- Use `useQueryClient` directly in the form component
- Call `queryClient.invalidateQueries({ queryKey: ["building-blocks-titles"] })` on success

**Why this step third**: Ensures cache is invalidated before dropdown component loads

#### Step 4: Add/Update Tests

Create comprehensive test coverage for both fixes.

- Add unit test for `validateField` to verify errors clear on non-empty value
- Add unit test for blur touch tracking to verify fields marked as touched only on blur
- Add integration test for form validation flow (select → blur → no error)
- Add test for cache invalidation (submission success → cache cleared → query refetches)
- Add regression test for the original bug scenarios from diagnosis

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm both bugs are fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `validateField` clears errors when value becomes non-empty (optimistic clearing)
- ✅ `markFieldAsTouchedOnBlur` only marks field touched on blur events, not on change
- ✅ Error display only shows for blur-touched fields
- ✅ Cache invalidation is called with correct query key
- ✅ Multiple blur events don't duplicate in touched set
- ✅ Validation errors still appear for truly empty fields on submission
- ✅ Regression: selecting a valid option followed by blur shows no errors

**Test files**:
- `apps/web/app/(authenticated)/home/ai/blocks/_lib/client/__tests__/blocks-form-context.spec.ts` - Context validation and touch tracking
- `apps/web/app/(authenticated)/home/ai/blocks/_components/__tests__/blocks-form.spec.ts` - Error display logic and blur handling

### Integration Tests

Test the complete validation flow:
- Navigate to blocks form
- Select option from dropdown
- Verify no error message displays
- Blur to move focus away
- Verify no error message after blur
- Submit form successfully
- Verify redirect to `/home/ai`
- Verify cache is invalidated
- Verify new presentation appears in dropdown

**Test files**:
- `apps/e2e/tests/blocks-form-validation.spec.ts` - Multi-step form validation flow
- `apps/e2e/tests/blocks-form-cache-refresh.spec.ts` - Cache invalidation after submission

### E2E Tests

Execute these E2E test scenarios with Playwright:

- Complete blocks form end-to-end without validation errors
- Verify all selections work without false error messages
- Submit form and verify redirect
- Check that new presentation immediately appears in dropdown
- No manual page reload needed to see new presentation

**Test files**:
- `apps/e2e/tests/blocks-form-complete-flow.spec.ts` - Full user journey with validation and cache refresh

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai/blocks` and select presentation type - no error displays
- [ ] Select each field value on every step - no validation errors appear
- [ ] Blur from field after selection - still no error displays
- [ ] Leave field empty and blur - error message displays
- [ ] Type value to fill empty field - error disappears immediately (optimistic)
- [ ] Complete entire form and submit successfully
- [ ] After redirect to `/home/ai`, open dropdown - new presentation appears WITHOUT manual reload
- [ ] Multiple form submissions - new presentations appear each time without reload
- [ ] Try submitting with empty field - validation error displays
- [ ] Close and reopen browser - form works correctly on fresh load

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Blur Touch Tracking Completeness**: May miss some input types that have custom event handling
   - **Likelihood**: low
   - **Impact**: medium - Could result in validation errors not showing for some fields
   - **Mitigation**: Comprehensive testing of all field types (text inputs, selects, multiple choice, radio buttons). Audit all inputs in form to ensure blur handlers added.

2. **Cache Invalidation Timing**: Invalidation might happen before component unmounts, causing race conditions
   - **Likelihood**: low
   - **Impact**: medium - Could result in stale cache still showing
   - **Mitigation**: Use `await queryClient.invalidateQueries()` to ensure invalidation completes. Verify cache is cleared before navigation or component render.

3. **Performance**: Excessive cache invalidations if form submitted multiple times quickly
   - **Likelihood**: low
   - **Impact**: low - Minor performance hit, queries refetch unnecessarily
   - **Mitigation**: Add debouncing or cooldown to invalidation if multiple submissions occur rapidly. Monitor query execution in React Query DevTools.

4. **Backward Compatibility**: Other components using the touched field state might break
   - **Likelihood**: low
   - **Impact**: medium - Could break other form components if they rely on old touched behavior
   - **Mitigation**: Search codebase for other uses of `touchedFields` from context. Update any other components using the context. Add comments documenting the change.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert commits that modify `BlocksFormContext.tsx` and `BlocksForm.tsx`
2. Revert commits that add cache invalidation to `EditPresentationCombobox.tsx`
3. Redeploy previous version
4. Users may experience original validation errors again temporarily
5. Investigate specific issue with updated implementation before retrying

**Monitoring** (if needed):
- Monitor form submission success rate - ensure it doesn't decrease
- Monitor React Query cache hit/miss ratio on presentation queries
- Alert if form validation errors increase unexpectedly
- Track cache invalidation call success/failure rates

## Performance Impact

**Expected Impact**: minimal - Negligible performance change

This fix has minimal performance impact:
- Validation logic changes don't add complexity or processing time
- Cache invalidation is a standard React Query operation (very fast)
- No additional network requests beyond the necessary refetch of presentations list
- Blur touch tracking uses Set operations (O(1) complexity)

**Performance Testing**:
- Form interaction time should be identical (submit time + validation time)
- Cache invalidation should complete in <10ms
- Subsequent query refetch happens only once after submission
- No performance regression in form rendering or validation

## Security Considerations

**Security Impact**: none

This fix doesn't introduce any security implications:
- Validation logic remains the same, just with different timing
- Cache invalidation doesn't bypass any security checks
- No new API endpoints or authentication changes
- No data exposure risks

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Navigate to blocks form and observe validation errors
# 1. Go to http://localhost:3000/home/ai/blocks
# 2. Select first option from presentation type dropdown
# 3. Observe: "This field is required" error appears despite valid selection
# This demonstrates Issue 1

# Complete form and check dropdown
# 1. Fill entire form and submit
# 2. Redirect to http://localhost:3000/home/ai
# 3. Open "Edit Existing Presentation" dropdown
# 4. Observe: New presentation is NOT in list
# 5. Manual page reload shows new presentation
# This demonstrates Issue 2
```

**Expected Result**: Both bugs are reproducible as described in diagnosis

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit blocks-form

# Integration tests
pnpm test:integration blocks-form

# E2E tests
pnpm test:e2e blocks-form

# Build
pnpm build

# Manual verification (see Manual Testing Checklist)
```

**Expected Result**: All commands succeed, both bugs are resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run form-related tests specifically
pnpm test --grep "form|validation|cache"

# E2E tests for affected features
pnpm test:e2e
```

## Dependencies

### New Dependencies

**No new dependencies required** - Uses existing TanStack Query and React APIs

## Database Changes

**No database changes required** - This is purely a frontend state management and caching fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special deployment steps needed
- Can be deployed as normal feature release
- No database migrations required
- No backend changes required
- Fully backward compatible

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking API or data structure changes

## Success Criteria

The fix is complete when:
- [ ] Validation errors don't appear on valid field selections
- [ ] Error messages clear immediately when user provides input
- [ ] Errors still display when submitting with empty fields
- [ ] New presentations appear in dropdown after form submission without manual reload
- [ ] All validation command tests pass
- [ ] Zero regressions detected in test suite
- [ ] All E2E tests pass
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Implementation Priority**: Fix Issue 2 (cache invalidation) first - it's simpler and lower risk, allowing validation fix to build on stable foundation.

**Related Issues**:
- Issue #1085 fixed a related "max update depth" error in blocks form
- This fix complements that by improving overall form validation reliability

**Documentation**: Update any existing form validation documentation to reflect the new "blur touch" pattern if such documentation exists.

**Commit Strategy**: Consider two separate commits:
1. First commit: Validation error fix (Issue 1)
2. Second commit: Cache invalidation fix (Issue 2)

This allows easier testing and review of each fix independently.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1090*
