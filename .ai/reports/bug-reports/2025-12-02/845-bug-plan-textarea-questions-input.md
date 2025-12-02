# Bug Fix: Survey textarea questions render without editable input field

**Related Diagnosis**: #844
**Severity**: high
**Bug Type**: ui
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `QuestionCard` component missing type check for `textarea` question type, causing fallthrough to multiple choice handler
- **Fix Approach**: Add `textarea` type to the text field condition check
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Survey questions with type `textarea` in Payload CMS are rendering without an editable text area input field. The question text displays correctly, but users cannot enter a response because no input field is rendered. This makes affected surveys unusable since the "Next Question" button remains disabled until a response is provided.

Affects:
- "Three Quick Questions" survey: 2 of 3 questions (Q1 and Q3)
- "Course Feedback" survey: feedback-q4
- Any other surveys using open-ended textarea questions

For full details, see diagnosis issue #844.

### Solution Approaches Considered

#### Option 1: Add textarea to text_field condition ⭐ RECOMMENDED

**Description**: Modify the type check in `QuestionCard` to treat `textarea` the same as `text_field`, since both handle free-form text input through the same `TextFieldQuestion` component.

**Pros**:
- Minimal code change (one line)
- Reuses existing `TextFieldQuestion` component which already handles textarea input
- No new component creation needed
- Matches the existing pattern (component renders same UI for both types)
- Zero performance impact

**Cons**:
- None - this is the cleanest solution

**Risk Assessment**: low - Simple type check addition with no logic changes

**Complexity**: simple - Single line modification

#### Option 2: Create separate TextareaQuestion component

**Description**: Create a new dedicated component for textarea questions with customized rendering.

**Pros**:
- Separates concerns by question type
- Allows future customization specific to textarea

**Cons**:
- Over-engineered for this use case (both text_field and textarea use identical UI)
- Duplicates logic from TextFieldQuestion
- More code to maintain
- Adds unnecessary complexity

**Why Not Chosen**: Violates the principle of avoiding over-engineering. Since the UI is identical and both use the same Textarea component, creating a separate component adds maintenance burden without benefit.

#### Option 3: Map textarea to text_field in seed data

**Description**: Change the survey seed data to use `text_field` instead of `textarea` type.

**Pros**:
- Works around the issue without code changes

**Cons**:
- Hides the actual bug instead of fixing it
- Type definition allows `textarea` but implementation doesn't support it
- Next time someone uses `textarea` type, same bug reoccurs
- Maintenance issue: confusing why `textarea` type exists but isn't used

**Why Not Chosen**: Fixes the symptom, not the root cause. The schema explicitly allows `textarea` type, so the component should support it.

### Selected Solution: Add textarea to text_field condition

**Justification**: This is the most pragmatic fix. The `TextFieldQuestion` component already uses the `Textarea` component from shadcn/ui and handles free-form text input perfectly. Since both `text_field` and `textarea` questions render identical UI (a label, textarea input, and submit button), there's no reason to maintain separate component paths. A simple type check addition fixes the immediate issue while maintaining code clarity.

**Technical Approach**:
- Modify line 31 in `question-card.tsx` to check for both `text_field` and `textarea` types
- No logic changes needed
- Existing `TextFieldQuestion` component handles textarea rendering via the shadcn/ui `Textarea` component
- The component already imports and uses `Textarea` correctly

**Architecture Changes**: None - no architectural impact, purely a bug fix to existing logic

**Migration Strategy**: Not needed - fix is backward compatible and enables existing functionality

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/assessment/survey/_components/question-card.tsx` (lines 31-39) - Add textarea type check

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Fix the QuestionCard component type check

Update the type check condition on line 31 to include `textarea` type alongside `text_field`:

```typescript
// OLD:
if (question.type === "text_field") {
  return (
    <TextFieldQuestion
      question={question}
      onAnswer={onAnswer}
      isLoading={isLoading}
    />
  );
}

// NEW:
if (question.type === "text_field" || question.type === "textarea") {
  return (
    <TextFieldQuestion
      question={question}
      onAnswer={onAnswer}
      isLoading={isLoading}
    />
  );
}
```

**Why this step first**: This is the root cause of the bug and must be fixed before testing.

**Verification**: After this change, textarea questions should render the `TextFieldQuestion` component which displays a textarea input field.

#### Step 2: Verify the fix with manual testing

Navigate to the affected survey and verify:
1. Question text displays correctly
2. Textarea input field is now visible and editable
3. User can type a response in the textarea
4. "Next Question" button becomes enabled after entering text
5. Submitting the answer works correctly

**Test surveys**:
- "Three Quick Questions" survey (Q1 and Q3 should now work)
- "Course Feedback" survey (feedback-q4 should now work)

#### Step 3: Add unit tests for textarea type handling

Add test case to verify `textarea` type is handled correctly:

Create or update test file at `apps/web/app/home/(user)/assessment/survey/_components/__tests__/question-card.spec.ts`:

- Test that `question.type === "textarea"` renders `TextFieldQuestion` component
- Test that textarea input is visible and functional
- Verify "Next Question" button state matches textarea content

#### Step 4: Run validation commands

Execute full validation to ensure no regressions:

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if created)
pnpm test:unit apps/web

# Build
pnpm build

# E2E tests (if assessment tests exist)
pnpm test:e2e
```

#### Step 5: Manual end-to-end verification

Complete the full user journey:

1. Start at `/home/course/lessons/before-we-begin`
2. Navigate through the "Three Quick Questions" survey
3. Q1 (textarea): "Fill in the blank: After taking this course, I will be able to ________________________."
   - Verify textarea input is visible
   - Enter a response
   - Click "Next Question"
4. Q2 (scale question): Verify normal operation
5. Q3 (textarea): Verify textarea input is visible and functional
6. Complete the survey successfully

## Testing Strategy

### Unit Tests

Add unit tests for QuestionCard component:

- ✅ Textarea question type renders TextFieldQuestion component
- ✅ Textarea input field is visible and editable
- ✅ "Next Question" button is disabled until text is entered
- ✅ "Next Question" button is enabled when text is present
- ✅ Submitting textarea answer calls onAnswer correctly
- ✅ Multiple choice questions still work (regression test)
- ✅ Scale questions still work (regression test)
- ✅ Text field questions still work (regression test)

**Test files**:
- `apps/web/app/home/(user)/assessment/survey/_components/__tests__/question-card.spec.ts`

### Integration Tests

Verify the complete survey flow with textarea questions:

**Test files**:
- `apps/web/app/home/(user)/assessment/survey/__tests__/survey-flow.integration.spec.ts`

### E2E Tests

Full user journey testing for textarea survey questions:

**Test files**:
- `apps/e2e/tests/assessment/survey.spec.ts` (if it exists, add textarea question scenario)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/course/lessons/before-we-begin`
- [ ] "Three Quick Questions" survey loads
- [ ] Q1 (textarea): Textarea input field is visible
- [ ] Q1: Can type in textarea field
- [ ] Q1: "Next Question" button is disabled until text entered
- [ ] Q1: "Next Question" button enabled after text entered
- [ ] Q1: Submit answer and verify it's saved
- [ ] Q2 (scale): Normal scale question works
- [ ] Q3 (textarea): Textarea input field is visible and functional
- [ ] Survey completion page displays all answers correctly
- [ ] No console errors related to question rendering
- [ ] No UI regressions in multiple choice or scale questions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended type matching**: Unlikely risk that the OR condition catches unexpected types
   - **Likelihood**: low (type is explicitly checked)
   - **Impact**: low (would render TextFieldQuestion which is safe)
   - **Mitigation**: Unit tests verify correct type handling for all question types

2. **Breaking changes to question flow**: Changing how textarea questions render
   - **Likelihood**: low (TextFieldQuestion already handles textarea inputs)
   - **Impact**: low (this is the expected behavior)
   - **Mitigation**: Manual testing of complete survey flow

3. **Regression in other question types**: Modifying QuestionCard logic
   - **Likelihood**: very low (only adding OR condition, not changing existing paths)
   - **Impact**: medium (would break survey functionality)
   - **Mitigation**: Regression tests for multiple_choice and scale types

**Rollback Plan**:

If this fix causes issues:

1. Revert the one-line change to question-card.tsx line 31
2. Redeploy the application
3. Textarea questions will return to current state (no input field)
4. Investigate root cause of any issues

**Monitoring** (optional):

This is a simple bug fix with minimal risk, so intensive monitoring is not required. However:
- Monitor survey completion rates for "Three Quick Questions"
- Watch error logs for any rendering errors in assessment component
- Alert if more than 5 survey submission failures occur

## Performance Impact

**Expected Impact**: none

This fix adds a single OR condition to a type check. No performance impact is measurable. The component renders the same UI as it would for `text_field` questions.

## Security Considerations

**Security Impact**: none

This fix:
- Does not expose any new data
- Does not bypass any validation
- Does not affect authentication or authorization
- Does not modify database queries
- Follows the same validation patterns as text_field questions

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to survey and observe Q1 has no textarea input
# Expected: Question text displays but no input field visible
# Expected: "Next Question" button is disabled
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
pnpm test:unit apps/web

# Build
pnpm build

# E2E tests (if assessment tests exist)
pnpm test:e2e

# Manual verification
# Navigate to /home/course/lessons/before-we-begin
# Verify Q1 textarea is visible and functional
# Verify Q3 textarea is visible and functional
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify all question types work:
# - Multiple choice questions
# - Scale questions
# - Text field questions
# - Textarea questions (newly fixed)
```

## Dependencies

**No new dependencies required**

The fix uses existing components:
- `TextFieldQuestion` component (already exists)
- `Textarea` from `@kit/ui/textarea` (already imported in TextFieldQuestion)
- All existing imports in QuestionCard remain valid

## Database Changes

**No database changes required**

- The `textarea` type already exists in the Payload CMS schema
- Survey questions with type `textarea` already exist in seed data
- No migrations needed
- No data transformation needed

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained

This fix is purely additive - it enables functionality that was defined in the schema but not implemented. No breaking changes to existing data or functionality.

## Success Criteria

The fix is complete when:
- [ ] One-line code change applied to question-card.tsx
- [ ] All TypeScript type checks pass (`pnpm typecheck`)
- [ ] All linting passes (`pnpm lint`)
- [ ] All formatting is correct (`pnpm format`)
- [ ] Unit tests pass (question-card and textarea scenarios)
- [ ] Build succeeds (`pnpm build`)
- [ ] Zero regressions in other question types
- [ ] Manual testing confirms textarea questions work end-to-end
- [ ] "Three Quick Questions" survey is fully functional
- [ ] No console errors or warnings
- [ ] Code review approved (if applicable)

## Notes

**Payload CMS Type Definition**: The schema already defines `textarea` as a valid question type alongside `text_field`, `scale`, and `multiple_choice`. This bug occurs because the component implementation missed this type, not because the data model was wrong.

**Component Reusability**: The `TextFieldQuestion` component is well-designed and handles any free-form text input scenario correctly. It uses the shadcn/ui `Textarea` component which is fully accessible and feature-complete, so no customization is needed for textarea questions.

**Why This Is A Simple Fix**: This is essentially a logic bug where the conditional statement was incomplete. Adding the missing type check completes the implementation that should have been there initially.

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #844*
