# Bug Diagnosis: Survey textarea questions render without editable input field

**ID**: ISSUE-pending
**Created**: 2025-12-02T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Survey questions with type `textarea` in the Payload CMS "Three Quick Questions" survey are rendering without an editable text area input. The question text displays correctly, but users cannot enter a response because no input field is rendered. This makes the survey unusable since the "Next Question" button is disabled until a response is provided.

## Environment

- **Application Version**: dev branch (commit 5dae1c5b6)
- **Environment**: development
- **Browser**: All browsers (frontend rendering issue)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - appears to be an original implementation gap

## Reproduction Steps

1. Navigate to `/home/course/lessons/before-we-begin`
2. The "Three Quick Questions" survey loads
3. Observe the first question: "Fill in the blank: After taking this course, I will be able to ________________________."
4. Note that the question text displays but NO textarea input field is visible
5. The "Next Question" button is disabled because no answer can be entered

## Expected Behavior

- A textarea input field should be rendered below the question text
- User should be able to type their response
- After entering text, the "Next Question" button should become enabled

## Actual Behavior

- Question text displays correctly
- NO input field is rendered for the user to type in
- "Next Question" button is disabled and cannot be clicked
- Survey is completely blocked at questions 1 and 3 (both are textarea type)

## Diagnostic Data

### Console Output
```
No console errors - the component renders without throwing exceptions.
Question data logged shows type: "textarea" being passed correctly.
```

### Network Analysis
```
Not applicable - this is a frontend rendering issue, not a data fetching problem.
Survey data loads successfully from Payload CMS with correct question types.
```

### Database Analysis
```sql
-- Survey questions seed data shows:
-- Question 1 (three-quick-questions-q1): type: "textarea"
-- Question 3 (three-quick-questions-q3): type: "textarea"

-- These are correctly stored and retrieved, but not rendered properly.
```

### Performance Metrics
```
Not applicable - not a performance issue.
```

## Error Stack Traces
```
No errors thrown - the component silently falls through to the wrong rendering path.
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/assessment/survey/_components/question-card.tsx` (primary - missing type check)
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/SurveyComponent.tsx` (secondary - hardcodes text_field)
  - `apps/payload/src/seed/seed-data/survey-questions.json` (data uses "textarea" type)
  - `packages/cms/types/src/payload-types.ts` (defines valid types)

- **Recent Changes**: No recent changes to these files caused the bug - this is an original implementation gap.

- **Suspected Functions**:
  - `QuestionCard` component at `question-card.tsx:31-49` - handles `text_field` and `scale` but not `textarea`

## Related Issues & Context

### Direct Predecessors
- No direct predecessors found for this specific issue.

### Related Infrastructure Issues
- #496 (CLOSED): "Seed Data Partial Success: Documentation and Survey-Questions Collections" - Related to survey data seeding but not this rendering bug.

### Similar Symptoms
- No similar symptoms found in issue tracker.

### Historical Context
This appears to be an original implementation gap where the `QuestionCard` component was not designed to handle all valid question types defined in the Payload schema.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `QuestionCard` component only handles `text_field` and `scale` question types, but the Payload schema defines `textarea` as a separate valid type that falls through to the multiple choice handler (which has no input field for free-form text).

**Detailed Explanation**:

1. **Type Definition**: The Payload CMS types at `packages/cms/types/src/payload-types.ts:706` define four valid question types:
   ```typescript
   type: 'multiple_choice' | 'text_field' | 'textarea' | 'scale';
   ```

2. **Seed Data**: The survey-questions.json seed data uses `type: "textarea"` for open-ended questions (lines 788, 825):
   ```json
   {
     "questionSlug": "three-quick-questions-q1",
     "text": "Fill in the blank: After taking this course, I will be able to ________________________.",
     "type": "textarea",
     ...
   }
   ```

3. **QuestionCard Type Handling**: The `QuestionCard` component at `question-card.tsx:31-49` only checks for two types:
   ```typescript
   if (question.type === "text_field") {  // Line 31
     return <TextFieldQuestion ... />;
   }
   if (question.type === "scale") {  // Line 41
     return <ScaleQuestion ... />;
   }
   // Default to multiple choice question  // Line 51
   ```

4. **The Gap**: When `question.type === "textarea"`, neither condition matches, so the code falls through to the default multiple choice handler (line 51+), which renders radio buttons instead of a text input. Since there are no options defined for textarea questions, the radio group renders empty with no way for users to provide input.

**Supporting Evidence**:
- `packages/cms/types/src/payload-types.ts:706` shows `textarea` is a valid type distinct from `text_field`
- `apps/payload/src/seed/seed-data/survey-questions.json:788,825` shows questions using `type: "textarea"`
- `apps/web/app/home/(user)/assessment/survey/_components/question-card.tsx:31-49` shows missing handling for `textarea` type
- The "Three Quick Questions" survey has 3 questions: Q1 (textarea), Q2 (scale), Q3 (textarea) - only Q2 would work

### How This Causes the Observed Behavior

1. User navigates to the "Before we begin" lesson
2. The `SurveyComponent` loads the "Three Quick Questions" survey from Payload CMS
3. Question 1 has `type: "textarea"` in the data
4. `QuestionCard` receives the question and checks type
5. `type === "text_field"` is false (it's "textarea", not "text_field")
6. `type === "scale"` is false
7. Code falls through to multiple choice rendering (line 51+)
8. Multiple choice renders RadioGroup with `question.options` - but textarea questions have no options
9. User sees question text but no input field and disabled submit button
10. Survey is blocked - user cannot proceed

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is deterministic and clearly documented in the source
- The type mismatch between schema (`textarea`) and handler (`text_field`) is explicit
- No complex state or race conditions involved
- The evidence directly shows the gap in the conditional logic

## Fix Approach (High-Level)

Add a check for `textarea` type in `QuestionCard` that renders the same `TextFieldQuestion` component (since both textarea and text_field should render a text input). The fix is a single conditional check:

```typescript
if (question.type === "text_field" || question.type === "textarea") {
  return <TextFieldQuestion ... />;
}
```

Alternatively, the Payload schema could be updated to consolidate `textarea` into `text_field`, but this would require database migration and seed data updates.

## Diagnosis Determination

The root cause is conclusively identified: The `QuestionCard` component at `question-card.tsx:31` checks only for `text_field` type but the Payload schema and seed data use `textarea` as a separate valid type. This causes textarea questions to fall through to the multiple choice handler, which renders no usable input for free-form text responses.

## Additional Context

This bug affects multiple surveys that use open-ended text questions:
- "Three Quick Questions" survey (2 of 3 questions affected)
- "Course Feedback" survey (feedback-q4 uses textarea)
- Potentially other surveys with open-ended questions

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue search)*
