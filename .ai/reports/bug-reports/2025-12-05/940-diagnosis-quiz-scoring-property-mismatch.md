# Bug Diagnosis: Quiz scoring always shows 0 correct answers due to property name mismatch

**ID**: ISSUE-940
**Created**: 2025-12-05T10:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Quiz scoring logic always reports 0 correct answers because the QuizComponent.tsx uses `iscorrect` (lowercase) to check answer correctness, but the Payload CMS data returns `isCorrect` (camelCase). This property name mismatch causes all correctness checks to fail since `option.iscorrect` is always `undefined`.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development
- **Browser**: All browsers affected
- **Node Version**: v20+
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - may have never worked correctly

## Reproduction Steps

1. Navigate to any lesson with a quiz (e.g., "The Why: Next Steps")
2. Answer all quiz questions correctly
3. Click "Finish Quiz"
4. Observe the Quiz Summary page

## Expected Behavior

Quiz Summary should display "4 of 4 (100%)" when all questions are answered correctly, with a "Congratulations!" message.

## Actual Behavior

Quiz Summary displays "0 of 4 (0%)" regardless of answers selected. The quiz always shows as failed because no answers are ever counted as correct.

## Diagnostic Data

### Code Analysis

**Interface Definition (QuizComponent.tsx:28-31)**:
```typescript
interface QuizOption {
	text: string;
	iscorrect: boolean;  // <-- lowercase "iscorrect"
}
```

**Payload CMS Schema (QuizQuestions.ts:48-62)**:
```typescript
{
  name: "options",
  type: "array",
  fields: [
    { name: "text", type: "text", required: true },
    { name: "isCorrect", type: "checkbox", defaultValue: false },  // <-- camelCase "isCorrect"
  ],
}
```

**Generated TypeScript Types (payload-types.ts:700-704)**:
```typescript
options: {
  text: string;
  isCorrect?: boolean | null;  // <-- camelCase "isCorrect"
  id?: string | null;
}[];
```

### Scoring Logic Failure Points

The scoring logic in `handleNextQuestion()` checks `option.iscorrect` but the actual data has `option.isCorrect`:

**Line 292-293** (multi-answer check):
```typescript
if (option.iscorrect === true && !selectedOptionIndices.includes(optIndex)) {
  allCorrectSelected = false;
}
```

**Line 300-301** (multi-answer check):
```typescript
if (option.iscorrect === false && selectedOptionIndices.includes(optIndex)) {
  noIncorrectSelected = false;
}
```

**Line 316** (single-answer check):
```typescript
if (selectedOption && selectedOption.iscorrect === true) {
  correctAnswers++;
}
```

### Root Cause Trace

1. Payload CMS defines `isCorrect` (camelCase) in `QuizQuestions.ts:58`
2. TypeScript types are generated with `isCorrect` in `payload-types.ts:702`
3. QuizComponent.tsx defines its interface with `iscorrect` (lowercase) at line 30
4. All correctness checks use `iscorrect` which is `undefined` on the actual data
5. Result: `undefined === true` is always `false`, so no answers are ever correct

## Error Stack Traces

No runtime errors occur - this is a silent logic failure due to property name mismatch.

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx` - Lines 30, 224, 292, 300, 316
  - `apps/payload/src/collections/QuizQuestions.ts` - Line 58 (defines correct property name)
  - `apps/payload/payload-types.ts` - Line 702 (generated types)

- **Recent Changes**: No recent changes to this file specifically related to the property name

- **Suspected Functions**:
  - `handleNextQuestion()` in QuizComponent.tsx (lines 265-337)
  - `isMultiAnswerQuestion()` in QuizComponent.tsx (lines 216-229)

## Related Issues & Context

### Similar Symptoms
- No directly related issues found

### Historical Context
- Issue #478 (CLOSED): "Seed data format mismatch: Quiz/Survey question options field structure incompatibility" - May have been related to similar schema mismatches

## Root Cause Analysis

### Identified Root Cause

**Summary**: Property name case mismatch between QuizComponent interface (`iscorrect`) and Payload CMS schema (`isCorrect`).

**Detailed Explanation**:
The QuizComponent.tsx file defines a `QuizOption` interface with property `iscorrect` (all lowercase), but the actual data coming from Payload CMS uses `isCorrect` (camelCase). JavaScript/TypeScript is case-sensitive, so when the scoring logic checks `option.iscorrect`, it accesses an undefined property instead of the actual `option.isCorrect` value.

This causes the condition `option.iscorrect === true` to evaluate as `undefined === true`, which is always `false`. As a result, no answers are ever counted as correct.

**Supporting Evidence**:
- Payload CMS schema in `QuizQuestions.ts:58`: `name: "isCorrect"`
- Generated types in `payload-types.ts:702`: `isCorrect?: boolean | null`
- QuizComponent interface in `QuizComponent.tsx:30`: `iscorrect: boolean`
- Test file uses `iscorrect` as well, which is why tests may pass (they use mock data matching the interface)

### How This Causes the Observed Behavior

1. User answers quiz questions
2. User clicks "Finish Quiz"
3. `handleNextQuestion()` iterates through each question
4. For each option, it checks `option.iscorrect === true`
5. Since `iscorrect` is undefined (the actual property is `isCorrect`), this check fails
6. `correctAnswers` counter stays at 0
7. Quiz Summary displays "0 of 4 (0%)"

### Confidence Level

**Confidence**: High

**Reasoning**: The property name mismatch is clearly visible in the code. The Payload CMS schema and generated types use `isCorrect`, while the QuizComponent uses `iscorrect`. This is a definitive code bug, not a behavioral or configuration issue.

## Fix Approach (High-Level)

Change all occurrences of `iscorrect` in `QuizComponent.tsx` to `isCorrect` to match the Payload CMS schema:
1. Update the `QuizOption` interface (line 30): `iscorrect` -> `isCorrect`
2. Update the `isMultiAnswerQuestion` function (line 224): `option?.iscorrect` -> `option?.isCorrect`
3. Update the scoring logic in `handleNextQuestion`:
   - Line 292: `option.iscorrect` -> `option.isCorrect`
   - Line 300: `option.iscorrect` -> `option.isCorrect`
   - Line 316: `selectedOption.iscorrect` -> `selectedOption.isCorrect`
4. Update the test file to use `isCorrect` to match production data structure

## Diagnosis Determination

This is a clear case of property name case mismatch. The fix is straightforward - update the QuizComponent to use `isCorrect` (camelCase) to match the Payload CMS schema. This is a high-priority bug as it completely breaks quiz functionality.

## Additional Context

- The `.fixed.tsx` version of the component uses `isCorrect` (correct casing), suggesting someone may have noticed this issue before but the fix was never applied to the main component.
- Test file (`QuizComponent.test.tsx`) uses `iscorrect` in its mock data, which is why tests may appear to pass despite the bug.

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Glob, Bash (git log, gh issue list)*
