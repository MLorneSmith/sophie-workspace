# Bug Diagnosis: Multi-Step Form Validation Errors and Missing List Refresh

**ID**: PENDING-DIAGNOSIS-blocks-form (awaiting GitHub issue creation)
**Created**: 2025-12-11T00:00:00Z
**Reporter**: User report
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/home/ai/blocks` multi-step form has two related bugs: (1) Field validation displays "This field is required" error messages even when fields are properly selected/filled, appearing on every step; (2) After form submission and redirect to `/home/ai`, the "Edit Existing Presentation" dropdown doesn't display the newly created presentation without a manual page reload.

## Environment

- **Application Version**: Latest (dev branch, commit 997087e02)
- **Environment**: development
- **Browser**: Any modern browser (issue is backend/state related)
- **Node Version**: v22.16.0
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown (newly reported)

## Reproduction Steps

### Issue 1: False Validation Errors

1. Navigate to `/home/ai/blocks`
2. Select a presentation type from the first question (e.g., "Sales Presentation")
3. Observe: "This field is required" error displays despite selection
4. Repeat on every subsequent step (title, audience, question_type, situation, etc.)
5. Even with valid input, error persists until field is marked as touched via blur event

### Issue 2: Missing Presentation in Dropdown After Submission

1. Complete the `/home/ai/blocks` form end-to-end
2. Click "Submit" button
3. Form is submitted successfully via `submitBuildingBlocksAction`
4. User is redirected to `/home/ai`
5. Open the "Edit Existing Presentation" dropdown
6. Observe: Newly created presentation is NOT in the list
7. Manually reload the page (F5)
8. Observe: Newly created presentation now appears in dropdown list

## Expected Behavior

### Issue 1
- When a field is selected or filled with valid input, no error message should be displayed
- Validation errors should only appear for truly empty/invalid fields
- Validation errors should clear when valid input is provided

### Issue 2
- After form submission completes successfully, the presentation dropdown should be automatically refreshed
- The newly created presentation should appear in the list without requiring a manual page reload
- Users should see real-time updates when new presentations are created

## Actual Behavior

### Issue 1
- Validation errors display immediately when fields are selected, even with valid input
- Errors persist across navigation through form steps
- Users cannot proceed because of false validation failures

### Issue 2
- After submission redirects to `/home/ai`, the dropdown cache is stale
- The dropdown shows old data without the newly created presentation
- Manual page reload is required to see new presentations

## Diagnostic Data

### Code Analysis - Issue 1 Root Cause

**BlocksFormContext.tsx (lines 101-123)** - `validateField` function:
```typescript
const validateField = (field: keyof FormData): boolean => {
  const value = formData[field];
  let isValid = true;
  const newErrors = { ...errors };

  if (!value || value.trim() === "") {
    newErrors[field] = "This field is required";
    isValid = false;
  } else {
    delete newErrors[field];
  }

  setErrors(newErrors);
  return isValid;
};
```

The validation logic treats ALL empty strings as invalid. However, the form's `touchedFields` tracking system attempts to hide errors when fields haven't been interacted with yet.

**BlocksForm.tsx (line 541)** - Error display logic:
```typescript
error={touchedFields.has(field) ? errors[field] : undefined}
```

**CRITICAL BUG**: When `handleSelectChange` is called (line 346-365), it:
1. Sets form data with selected value (line 351)
2. Marks field as touched (line 352)
3. Calls `validateField` (line 354)
4. Attempts to call `handleNext` (line 363)

The issue: `validateField` is called BEFORE the `currentPath` effect (BlocksFormContext.tsx:82-99) has updated the path based on the new presentation_type. The form's path changes AFTER validation due to the useEffect dependency on `formData.presentation_type`.

Timeline of Issue 1:
1. User selects presentation type
2. `handleSelectChange` validates immediately
3. Validation runs against OLD field data (because effect hasn't fired yet)
4. Since we're on the first question and just set presentation_type, validation may check presentation_type against old requirements
5. The `touchedFields` set now contains the field, so errors display even after moving to next question
6. The validation message persists because the field remains "touched" throughout the form lifetime

**Specific Problem**: In `MultipleChoiceQuestion` (lines 546-556) and `PresentationTypeQuestion` (lines 208-241), when a user clicks a button, the `onChange` fires, but validation is immediate (line 551 calls `validateField`). The error state gets set before the form context updates the path and question configuration.

### Code Analysis - Issue 2 Root Cause

**edit-presentation-combobox.tsx (lines 8-26)** uses React Query:
```typescript
export function EditPresentationCombobox() {
  const router = useRouter();
  const { data, isLoading } = useBuildingBlocksTitles();

  // Returns stale data when component loads
  const presentationOptions =
    data?.data?.map((item) => ({
      label: item.title,
      value: item.id,
    })) ?? [];

  return (
    <Combobox
      options={presentationOptions}
      placeholder="Select a presentation"
      isLoading={isLoading}
      onSelect={(value) => router.push(`/home/ai/canvas?id=${value}`)}
    />
  );
}
```

**use-building-blocks-titles.ts** (lines 7-16):
```typescript
export function useBuildingBlocksTitles() {
  const supabase = useSupabase();
  const { user } = useUserWorkspace();

  return useQuery({
    queryKey: ["building-blocks-titles", user.id],
    queryFn: () => getBuildingBlocksTitles(supabase, user.id),
    enabled: !!user.id,
  });
}
```

**Root Cause**: The React Query hook uses the query key `["building-blocks-titles", user.id]` with NO cache invalidation strategy. When the form submits:

1. `submitBuildingBlocksAction` creates a new presentation in Supabase
2. User is redirected to `/home/ai` (line 423 in BlocksForm.tsx)
3. `AIWorkspaceDashboard` component loads, which renders `EditPresentationCombobox`
4. The React Query hook executes with its cached query key
5. React Query sees a valid cached entry for `["building-blocks-titles", user.id]`
6. React Query returns the STALE cache without re-fetching
7. The dropdown shows old presentations because the cache was never invalidated

**Missing Invalidation**: The `submitBuildingBlocksAction` (lines 47-75 in submitBuildingBlocksAction.ts) has NO mechanism to tell React Query to invalidate the `["building-blocks-titles", user.id]` query cache.

**Default React Query Behavior**: By default, React Query keeps data cached for some time. Without explicit invalidation, the hook returns cached data even though the underlying database data has changed.

## Related Code

### Affected Files
- `BlocksForm.tsx` - Form component with validation display logic
- `BlocksFormContext.tsx` - Validation logic and state management
- `submitBuildingBlocksAction.ts` - Submission and data creation
- `edit-presentation-combobox.tsx` - Dropdown component using stale cache
- `use-building-blocks-titles.ts` - React Query hook without invalidation

### Recent Changes
- Commit d94663bc0: "fix(ui): refactor blocks form to use enhanceAction pattern" - May have introduced validation timing issues

## Root Cause Analysis

### Issue 1: Validation Errors Despite Valid Input

**Summary**: Validation runs before form state updates complete, and error state persists due to "touched fields" tracking.

**Detailed Explanation**:

The form uses a three-part validation system:
1. **errors** object - tracks which fields have validation errors
2. **touchedFields** Set - tracks which fields user has interacted with
3. **validateField** function - checks if field value is valid

The bug occurs because:
- When user selects a value, the input is immediately processed
- `validateField` is called synchronously, checking the CURRENT form state
- For select/multiple-choice fields, the user interaction path is:
  1. Click option → `onChange` fires → `setFormData` updates state
  2. Same event: `validateField` runs
  3. `setErrors` is called with error state
  4. Field is marked as touched
- The field remains in `touchedFields` for the entire form lifetime
- Subsequent renders display the error because `touchedFields.has(field)` is true
- The error was set during immediate validation, before the form context updated the path/question logic

For presentation_type specifically, the issue compounds because:
- Validation happens in `handleSelectChange` (line 354)
- The new path hasn't been calculated yet (effect will run next)
- But the error state persists because the field is now "touched"
- Even when moving to next question, the field remains touched globally

**Supporting Evidence**:
- BlocksFormContext line 106: `if (!value || value.trim() === "")` validates empty string
- BlocksForm line 541: `error={touchedFields.has(field) ? errors[field] : undefined}` shows error if touched
- BlocksForm line 552: `validateField(field)` called immediately on change
- Error message: "This field is required" matches line 107 in context

### Issue 2: Missing Presentations in Dropdown After Submission

**Summary**: React Query cache not invalidated when new presentation is created, so dropdown component shows stale data.

**Detailed Explanation**:

The data flow:
1. Form submission → `submitBuildingBlocksAction` runs server action
2. Action inserts new presentation in `building_blocks_submissions` table
3. Server action returns success
4. Client redirects to `/home/ai` using `router.push`
5. `/home/ai` page renders `AIWorkspaceDashboard`
6. Dashboard renders `EditPresentationCombobox`
7. `EditPresentationCombobox` uses `useBuildingBlocksTitles()` hook
8. Hook calls React Query with `queryKey: ["building-blocks-titles", user.id]`
9. **BUG**: React Query finds this key in its cache and returns cached data
10. Dropdown shows presentations from BEFORE the new one was created
11. Cache remains stale until: manual page reload, time-based stale time expires, or explicit invalidation

The root cause is architectural:
- **No cache invalidation strategy** in the submission flow
- React Query has no way to know the underlying data changed
- The query was cached when component first mounted
- Without `onSuccess` or other cache busting, stale data persists

The submission action has no mechanism to:
- Invalidate React Query cache
- Send cache invalidation signal to client
- Trigger query refetch
- Update client-side state

**Supporting Evidence**:
- submitBuildingBlocksAction.ts: No cache invalidation or client notification
- edit-presentation-combobox.tsx line 10: `useBuildingBlocksTitles()` has no explicit refetch trigger
- use-building-blocks-titles.ts line 11-15: React Query hook with no cache invalidation hooks
- React Query default behavior: keeps data cached until stale time or manual invalidation

### Confidence Level

**Confidence**: HIGH

**Reasoning**:
- Issue 1: Code path is clear and visible in validation logic. The `touchedFields` tracking and immediate validation on selection is the exact mechanism causing the error display
- Issue 2: React Query caching behavior is well-understood. The missing cache invalidation is the clear architectural gap. No invalidation mechanism exists in the code, confirming the root cause

Both issues have clear evidence in the code and are not speculative.

## Fix Approach (High-Level)

**Issue 1**: The validation error display should be more intelligent. Options:
- Only validate on blur (not on change) for select fields, OR
- Don't mark fields as "touched" until blur event, OR
- Clear validation errors when field value becomes non-empty (optimistic validation), OR
- Defer validation until form submission or after path update completes

**Issue 2**: Add cache invalidation strategy. Options:
- Return `queryKey` from server action and use `onSuccess` to invalidate cache, OR
- Add `useQueryClient` in component to manually invalidate on successful submission, OR
- Use React Query's `invalidateQueries` after form submission succeeds, OR
- Change stale time config to be shorter, allowing periodic refetches

## Additional Context

The form structure recently changed (commit d94663bc0) to use `enhanceAction` pattern. This refactoring may have introduced timing issues with validation synchronization.

---
*Generated by Claude Diagnosis Assistant*
*Tools Used: Glob (file pattern search), Read (source code analysis), Grep (code search), Bash (git/environment inspection)*
