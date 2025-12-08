# Bug Diagnosis: Quiz multi-answer questions not being detected

**ID**: ISSUE-944
**Created**: 2025-12-05T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Quizzes with multiple correct answers are not being properly detected as multi-answer questions in the UI. The seed data (.mdoc files) contains `questiontype: multi-answer` but this field is discarded during seed conversion and never stored in the database, causing all questions to be treated as single-answer by default.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Browser**: N/A (data issue)
- **Node Version**: 20.x
- **Database**: PostgreSQL (via Payload CMS)
- **Last Working**: Never worked (design gap)

## Reproduction Steps

1. Navigate to a lesson with a quiz containing multi-answer questions (e.g., "Standard Graphs Quiz" question 4: "What chart types best communicates the 'Deviation' relationship?")
2. Observe that the quiz displays radio buttons (single-select) instead of checkboxes (multi-select)
3. Attempting to select multiple answers is not possible

## Expected Behavior

Questions with multiple correct answers should display checkboxes and allow users to select all correct answers. The UI should show "Select all that apply" hint.

## Actual Behavior

All quiz questions display radio buttons (single-answer) regardless of how many correct answers exist in the seed data.

## Diagnostic Data

### Seed Data Analysis

The `.mdoc` source files contain the `questiontype` field:

**File**: `apps/payload/src/seed/seed-data-raw/quizzes/basic-graphs-quiz.mdoc:45-57`
```yaml
- question: What chart types best communicates the 'Deviation' relationship?
    answers:
      - answer: Line Charts
        correct: true
      - answer: Bar Charts
        correct: true
    questiontype: multi-answer  # <-- Field exists in source!
```

### Converter Analysis

**File**: `apps/payload/src/seed/seed-conversion/converters/quiz-questions-converter.ts:68-80`
```typescript
const quizQuestion: Partial<QuizQuestion> = {
  _ref: questionSlug,
  id: questionId,
  question: question.question,
  type: "multiple_choice",  // <-- Always hardcoded, questiontype is discarded!
  questionSlug: questionSlug,
  options: question.answers.map((answer) => ({
    text: answer.answer,
    isCorrect: answer.correct,
  })),
  // NOTE: No questiontype field included!
};
```

### Generated JSON Analysis

**File**: `apps/payload/src/seed/seed-data/quiz-questions.json`
- Contains `type: "multiple_choice"` for all questions
- Contains `isCorrect: true` on multiple options for multi-answer questions
- Does NOT contain `questiontype` field

### Payload Schema Analysis

**File**: `apps/payload/src/collections/QuizQuestions.ts:26-34`
```typescript
{
  name: "type",
  type: "select",
  options: [
    { label: "Multiple Choice", value: "multiple_choice" },
  ],
  defaultValue: "multiple_choice",
  required: true,
},
// NOTE: No questiontype field in schema!
```

### Component Analysis

**File**: `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx:216-229`
```typescript
const isMultiAnswerQuestion = (question: QuizQuestion): boolean => {
  // Check if the question type is multi-answer
  if (question?.questiontype === "multi-answer") {  // <-- Looks for questiontype
    return true;
  }

  // Fallback: Count correct options
  const correctOptions = (question?.options || []).filter(
    (option: QuizOption) => option?.isCorrect,
  );

  return correctOptions.length > 1;  // <-- This IS working!
};
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `questiontype` field from seed data is discarded during conversion and the Payload schema doesn't include this field, BUT the QuizComponent has a working fallback that detects multi-answer questions by counting `isCorrect: true` options.

**Detailed Explanation**:

The issue has THREE parts:

1. **Seed data has questiontype** (`basic-graphs-quiz.mdoc:57`): Source files correctly mark questions as `multi-answer`

2. **Converter discards questiontype** (`quiz-questions-converter.ts:72`): The conversion process reads `questiontype` but never outputs it, always setting `type: "multiple_choice"` instead

3. **Payload schema lacks questiontype** (`QuizQuestions.ts:26-34`): Even if the converter outputted it, the database schema doesn't have this field

**HOWEVER**, the QuizComponent (`QuizComponent.tsx:223-228`) has a **working fallback** that counts how many options have `isCorrect: true`. If more than one option is correct, it treats the question as multi-answer.

**The BUG**: The fallback works correctly in the code, but the seed data in `quiz-questions.json` shows only ONE `isCorrect: true` per question for some multi-answer questions! Let me re-verify...

Actually, checking `quiz-questions.json:179-199`:
```json
{
  "question": "What chart types best communicates the 'Deviation' relationship?",
  "options": [
    { "text": "Line Charts", "isCorrect": true },
    { "text": "Bar Charts", "isCorrect": true }
  ]
}
```

The data IS correct with multiple `isCorrect: true`. The fallback SHOULD work.

**REVISED ROOT CAUSE**: The data flow from Payload CMS to the QuizComponent may not be preserving the `isCorrect` field correctly, OR there's a rendering issue. The component logic is correct and the seed data is correct.

### How This Causes the Observed Behavior

The component checks `question?.questiontype === "multi-answer"` first (always false because field doesn't exist), then falls back to counting correct options. If the fallback isn't working in production, it's likely:

1. The `isCorrect` field isn't being populated when fetched from Payload CMS
2. The data transformation between Payload and the component strips `isCorrect`

### Confidence Level

**Confidence**: High (for the schema/conversion gap) / Medium (for why the fallback doesn't work)

**Reasoning**: The code path is clear - the `questiontype` field is definitely missing. However, the fallback mechanism should work if `isCorrect` data is present. Need to verify runtime data to confirm if the issue is data-at-rest vs data-at-runtime.

## Fix Approach (High-Level)

**Option 1 (Quick Fix - Recommended)**: Trust the existing fallback mechanism
- Verify that `isCorrect` field is being fetched and passed to QuizComponent correctly
- Debug the data flow from Payload CMS -> API -> QuizComponent
- No schema changes needed if fallback works

**Option 2 (Proper Fix)**: Add `questiontype` field to the schema
1. Add `questiontype` field to `QuizQuestions.ts` schema (single-answer | multi-answer)
2. Update `quiz-questions-converter.ts` to output `questiontype` from source mdoc
3. Re-run seed conversion and database migration
4. Update `payload-types.ts` via typegen

**Option 3 (Hybrid)**: Keep fallback + add explicit field for clarity
- Implement Option 2 AND keep the fallback for backward compatibility

## Diagnosis Determination

This is primarily a **DATA/SCHEMA issue** - the explicit `questiontype` field is missing from the Payload schema and seed conversion pipeline. However, the component code already has a working fallback mechanism.

The immediate action should be to verify why the fallback isn't working in runtime - check if `isCorrect` values are being preserved through the Payload CMS -> Frontend data flow.

## Additional Context

### Files Affected
- `apps/payload/src/collections/QuizQuestions.ts` - Missing `questiontype` field
- `apps/payload/src/seed/seed-conversion/converters/quiz-questions-converter.ts:72` - Discards `questiontype`
- `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx` - Has correct fallback logic

### Quizzes with Multi-Answer Questions (from seed data)
- `basic-graphs-quiz.mdoc` - Question 4 (Deviation relationship)
- `performance-quiz.mdoc` - Questions 1, 2, 3
- `structure-quiz.mdoc` - Questions 2, 3

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Glob, Read*
