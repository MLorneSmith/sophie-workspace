# Bug Diagnosis: update-test-user script marks wrong lessons complete (array index vs lesson_number mismatch)

**ID**: ISSUE-1023
**Created**: 2025-12-09T12:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The `pnpm --filter testing-scripts update-test-user` script uses array index (1-based position in sorted lesson list) instead of `lesson_number` when determining which lessons to mark as complete. This causes a mismatch because lesson numbers in the course start at 6 (not 1) and have gaps (no lesson 7).

## Environment

- **Application Version**: dev branch @ 4c889c1e2
- **Environment**: development (local)
- **Node Version**: v22.x
- **Database**: PostgreSQL 15 (Supabase local)
- **Script**: `scripts/testing/update-test-user-progress.ts`

## Reproduction Steps

1. Run `pnpm --filter testing-scripts update-test-user` with default range `6-28`
2. Check lesson_progress in database
3. Observe that lessons 12-31 are marked complete instead of lessons 6-28

## Expected Behavior

When running with `--range 6-28`:
- Lessons with `lesson_number` 6, 8, 9, 10, 11, 12, ... 28 should be marked complete
- Lessons with `lesson_number` 29, 30, 31 should remain incomplete

## Actual Behavior

When running with `--range 6-28`:
- Lessons at array indices 6-28 are marked complete
- This corresponds to `lesson_number` 12-31 (because lesson_numbers start at 6, not 1)
- Lessons 6, 8, 9, 10, 11 remain incomplete (they are at indices 1-5)
- Lesson 29, 30, 31 are incorrectly marked complete (they are at indices 23-25)

## Diagnostic Data

### Lesson Index vs Lesson Number Mapping

```
array_index | lesson_number | title
------------+---------------+------------------------------------------
          1 |             6 | Welcome to DDM
          2 |             8 | Before we begin...
          3 |             9 | Presentation Tools & Course Resources
          4 |            10 | Our Process
          5 |            11 | The Who
          6 |            12 | The Why: Building the Introduction
          7 |            13 | The Why: Next Steps
          8 |            14 | Idea Generation
          9 |            15 | What is Structure?
         10 |            16 | Using Stories
         11 |            17 | Storyboards in Film
         12 |            18 | Storyboards in Presentations
         13 |            19 | Visual Perception and Communication
         14 |            20 | Overview of the Fundamental Elements of Design
         15 |            21 | The Fundamental Elements of Design in Detail
         16 |            22 | Gestalt Principles of Visual Perception
         17 |            23 | Slide Composition
         18 |            24 | Overview of Fact-based Persuasion
         19 |            25 | Tables vs. Graphs
         20 |            26 | Standard Graphs
         21 |            27 | Specialist Graphs
         22 |            28 | Preparation and Practice
         23 |            29 | Performance
         24 |            30 | Congratulations
         25 |            31 | Before you go...
```

### Current (Incorrect) Lesson Progress State

After running script with `--range 6-28`:
```
lesson_number | status
--------------+----------
            6 | INCOMPLETE  (should be COMPLETE)
            8 | INCOMPLETE  (should be COMPLETE)
            9 | INCOMPLETE  (should be COMPLETE)
           10 | INCOMPLETE  (should be COMPLETE)
           11 | INCOMPLETE  (should be COMPLETE)
           12 | COMPLETE
           ...
           28 | COMPLETE
           29 | COMPLETE    (should be INCOMPLETE)
           30 | COMPLETE    (should be INCOMPLETE)
           31 | COMPLETE    (should be INCOMPLETE)
```

## Error Stack Traces

No errors - the script executes successfully but produces incorrect results.

## Related Code

- **Affected Files**:
  - `scripts/testing/update-test-user-progress.ts`
- **Recent Changes**:
  - `4c889c1e2` - fix(tooling): update test progress script for current Payload CMS structure
  - `cd35c8263` - feat(tooling): add partial course progress utility with --user and --range args
- **Suspected Functions**:
  - Lines 359-377 - the loop that determines which lessons to mark complete

### Problematic Code (lines 359-377)

```typescript
for (let i = 0; i < lessonsData.length; i++) {
    const lesson = lessonsData[i];
    const lessonIndex = i + 1; // 1-based index  <-- BUG: uses array position

    // Check if this lesson is within the range
    if (lessonIndex < RANGE_START || lessonIndex > effectiveRangeEnd) {  // <-- compares index to range
        skippedLessons.push(`${lesson.lesson_number}`);
        // ...skip logic
        continue;
    }
    // ...mark complete logic
}
```

The bug is on line 361-364: `lessonIndex` is the 1-based array position (1, 2, 3...), but `RANGE_START` and `RANGE_END` are expected by the user to be lesson numbers (6, 8, 9...).

## Related Issues & Context

### Same Component

This is a newly created script from commits `cd35c8263` and `4c889c1e2`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The script compares array index against the `--range` parameter, but users expect `--range` to refer to `lesson_number` values.

**Detailed Explanation**:
The script iterates through the lessons array (sorted by lesson_number) and uses `i + 1` as the "lesson index" for range comparison. However:
1. The course's `lesson_number` values start at 6, not 1
2. There is no lesson 7 (gap in numbering)
3. Users naturally expect `--range 6-28` to mean "lesson numbers 6 through 28"
4. The script interprets `--range 6-28` as "array positions 6 through 28"

**Supporting Evidence**:
- Database query shows lesson_numbers: 6, 8, 9, 10, 11, 12, ..., 31
- Script line 361: `const lessonIndex = i + 1;` - creates 1-based index from array position
- Script line 364: `if (lessonIndex < RANGE_START || lessonIndex > effectiveRangeEnd)` - compares against range
- Documentation (line 16): "Uses 1-based indexing (lesson 1 = index 1)" - confirms the design intent was index-based, but this contradicts user expectations

### How This Causes the Observed Behavior

1. User runs `--range 6-28` expecting lesson_numbers 6-28 to be complete
2. Script fetches 25 lessons sorted by lesson_number: [6, 8, 9, 10, 11, 12, ..., 31]
3. Script loops with `i` from 0-24, creating `lessonIndex` from 1-25
4. Range check `6 <= lessonIndex <= 28` matches indices 6-25
5. Array indices 6-25 correspond to lesson_numbers 12-31
6. Lessons 6, 8, 9, 10, 11 (indices 1-5) are skipped
7. Lessons 29, 30, 31 (indices 23-25) are incorrectly included

### Confidence Level

**Confidence**: High

**Reasoning**: Database queries confirm the exact mapping between array index and lesson_number. The code logic clearly shows the comparison uses array index. The resulting lesson_progress state matches exactly what the code would produce.

## Fix Approach (High-Level)

Change the script to compare against `lesson.lesson_number` instead of array index:

```typescript
// Current (buggy):
const lessonIndex = i + 1;
if (lessonIndex < RANGE_START || lessonIndex > effectiveRangeEnd) {

// Fixed:
const lessonNum = parseInt(String(lesson.lesson_number), 10);
if (lessonNum < RANGE_START || lessonNum > RANGE_END) {
```

Also update the documentation to clarify that `--range` refers to lesson numbers, not array indices.

## Diagnosis Determination

The root cause is definitively identified: the script uses array index (1-based position) for range comparison when it should use the actual `lesson_number` field from each lesson record. This is a logic bug introduced when the script was created, likely due to an assumption that lesson numbers would be sequential starting from 1.

## Additional Context

- The script documentation says "Uses 1-based indexing (lesson 1 = index 1)" which reveals the original design intent was index-based
- However, this is counter-intuitive for users who see `lesson_number` values in the UI
- The fix should change to use `lesson_number` and update documentation accordingly

---
*Generated by Claude Debug Assistant*
*Tools Used: psql database queries, code analysis*
