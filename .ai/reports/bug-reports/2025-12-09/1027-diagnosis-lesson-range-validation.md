# Bug Diagnosis: update-test-user script skips lessons 26-28 due to incorrect range validation

**ID**: ISSUE-1027
**Created**: 2025-12-09T19:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The `update-test-user-progress.ts` script incorrectly skips lessons 26, 27, and 28 when using the default range of `6-28`. The bug is caused by comparing the range end (a `lesson_number` value) against the total count of lessons instead of comparing against the maximum `lesson_number` in the dataset.

## Environment

- **Application Version**: dev branch (commit b1d176a68)
- **Environment**: development
- **Node Version**: Current project version
- **Database**: Supabase (PostgreSQL)
- **Last Working**: Unknown (logic error may have existed since implementation)

## Reproduction Steps

1. Ensure Payload CMS is running with seeded course data
2. Run `pnpm --filter testing-scripts update-test-user`
3. Observe the output shows lessons 26, 27, 28 being skipped as "outside range"

## Expected Behavior

With range `6-28`, lessons with `lesson_number` values 6 through 28 should be marked as complete.

## Actual Behavior

Lessons 26, 27, and 28 are skipped with the message "outside range" despite being within the requested range of 6-28. The script outputs:

```
Warning: Range end (28) exceeds total lessons (25). Adjusting to 25.
...
Skipping lesson 26: Standard Graphs - outside range
Skipping lesson 27: Specialist Graphs - outside range
Skipping lesson 28: Preparation and Practice - outside range
```

## Diagnostic Data

### Console Output

```
========================================
  Course Progress Update Script
========================================
  User:  test1@slideheroes.com
  Range: Lessons 6-28
========================================

[UPDATE_TEST_USER_PROGRESS-INFO] Found 25 lessons
[UPDATE_TEST_USER_PROGRESS-INFO] Marking lesson 6 as complete: Welcome to DDM
...
[UPDATE_TEST_USER_PROGRESS-INFO] Marking lesson 25 as complete: Tables vs. Graphs
[UPDATE_TEST_USER_PROGRESS-INFO] Skipping lesson 26: Standard Graphs - outside range
[UPDATE_TEST_USER_PROGRESS-INFO] Skipping lesson 27: Specialist Graphs - outside range
[UPDATE_TEST_USER_PROGRESS-INFO] Skipping lesson 28: Preparation and Practice - outside range
...

========================================
  Summary
========================================
  Range: Lessons 6-25
  Total lessons in course: 25
  Lessons marked complete: 19
  Lessons skipped: 6
========================================

Warning: Range end (28) exceeds total lessons (25). Adjusting to 25.
```

### Root Cause Code Analysis

The bug is in `scripts/testing/update-test-user-progress.ts` lines 343-350:

```typescript
// Validate range against available lessons
const totalLessons = lessonsData.length;  // This is 25 (COUNT of lessons)
if (RANGE_END > totalLessons) {           // Compares 28 > 25 ❌ WRONG
    console.error(
        `Warning: Range end (${RANGE_END}) exceeds total lessons (${totalLessons}). Adjusting to ${totalLessons}.`,
    );
}

const effectiveRangeEnd = Math.min(RANGE_END, totalLessons);  // Sets to 25 ❌ WRONG
```

And the filtering logic at line 363:

```typescript
if (lessonNumber < RANGE_START || lessonNumber > effectiveRangeEnd) {
    // lessonNumber 26 > effectiveRangeEnd 25 → SKIPPED (incorrectly)
```

**The Problem**: The code compares `RANGE_END` (a `lesson_number` value like 28) against `totalLessons` (the count of lessons, 25). These are semantically different values:

- `lesson_number` values in the dataset: 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
- Count of lessons: 25
- Min lesson_number: 6
- Max lesson_number: 31

## Related Code

- **Affected Files**:
  - `scripts/testing/update-test-user-progress.ts` (lines 343-350, 363)
- **Recent Changes**: Commit cc2eb3d9e (fix: replace hardcoded course ID with dynamic lookup)
- **Suspected Functions**: Range validation logic in `main()`

## Related Issues & Context

No directly related issues found.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The script incorrectly compares the user-provided `RANGE_END` (a `lesson_number` value) against the count of lessons instead of the maximum `lesson_number` in the dataset.

**Detailed Explanation**:
The variable naming and logic conflates two different concepts:
1. `totalLessons` = `lessonsData.length` = 25 (the count of lesson records)
2. `RANGE_END` = 28 (a `lesson_number` value from the CLI argument)

The comparison `RANGE_END > totalLessons` (28 > 25) evaluates to true, so the code "adjusts" the range to 25. But 25 is a count, not a lesson number. When the filtering loop later checks `lessonNumber > effectiveRangeEnd` (26 > 25), it incorrectly skips lessons 26, 27, and 28 because their `lesson_number` values exceed 25.

**Supporting Evidence**:
- Log shows: `Warning: Range end (28) exceeds total lessons (25). Adjusting to 25.`
- Lessons with `lesson_number` 26, 27, 28 exist in the dataset but are skipped
- The documentation in the script (lines 14-16) states the range uses "actual lesson_number values from the database"

### How This Causes the Observed Behavior

1. User requests range 6-28 (lesson numbers)
2. Script fetches 25 lessons with lesson_numbers 6, 8, 9...31
3. Script compares 28 > 25 (count) → true
4. Script sets `effectiveRangeEnd = 25`
5. Loop iterates lessons, comparing each `lesson_number` against 25
6. Lessons with `lesson_number` 26, 27, 28 are > 25, so they're skipped
7. Only 19 lessons (6 through 25) are marked complete instead of 22

### Confidence Level

**Confidence**: High

**Reasoning**: The logic error is clearly visible in the code, and the log output directly confirms this behavior. The comparison between semantically different values (count vs. lesson_number) is the definitive root cause.

## Fix Approach (High-Level)

Replace the validation logic to compare against the maximum `lesson_number` in the dataset instead of the count:

```typescript
// Get the actual min and max lesson numbers from the data
const lessonNumbers = lessonsData.map(l => parseInt(String(l.lesson_number), 10));
const minLessonNumber = Math.min(...lessonNumbers);
const maxLessonNumber = Math.max(...lessonNumbers);

// Validate range against actual lesson numbers
if (RANGE_END > maxLessonNumber) {
    console.warn(`Warning: Range end (${RANGE_END}) exceeds max lesson number (${maxLessonNumber}). Adjusting.`);
}

const effectiveRangeEnd = Math.min(RANGE_END, maxLessonNumber);
```

## Diagnosis Determination

The root cause is definitively identified: incorrect comparison of semantically different values (lesson count vs. lesson_number). The fix is straightforward - compare against the maximum lesson_number instead of the count.

## Additional Context

The script documentation correctly states that the range uses "actual lesson_number values from the database" (line 16), but the implementation doesn't honor this. The lesson_number values are non-contiguous (skipping from 6 to 8, for example) which further demonstrates that count and lesson_number are different concepts.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (update-test-user-progress.ts), log analysis*
