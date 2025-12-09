# Bug Fix: update-test-user script marks wrong lessons (array index vs lesson_number mismatch)

**Related Diagnosis**: #1023
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Script compares array position (1-based index) against `--range` parameter instead of comparing actual lesson numbers
- **Fix Approach**: Replace `lessonIndex` (array position) with `lesson.lesson_number` in the range comparison
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `update-test-user-progress.ts` script determines which lessons to mark complete by comparing an array index against the `--range` parameter. Since lesson numbers don't start at 1 and have gaps, this causes the wrong lessons to be marked:

- `--range 6-28` should mark lessons with `lesson_number` 6-28 complete
- Currently marks lessons at array positions 6-28, which corresponds to `lesson_number` 12-31

**Example**:
- Array index 0 → lesson_number 6
- Array index 5 → lesson_number 12 (bug: should be lesson_number 6)
- Array index 22 → lesson_number 28
- Array index 27 → lesson_number 31 (bug: should be lesson_number 28)

For full details, see diagnosis issue #1023.

### Solution Approaches Considered

#### Option 1: Compare lesson_number instead of array index ⭐ RECOMMENDED

**Description**: Replace the array index comparison with `lesson.lesson_number` to match the semantic meaning of the `--range` parameter.

**Pros**:
- Fixes the core bug with minimal code change (1 variable change)
- Matches user intent: `--range 6-28` means "mark lessons 6 through 28"
- No changes to command-line interface or documentation
- Maintains backward compatibility with existing usage

**Cons**:
- None significant

**Risk Assessment**: low - The fix is surgical and directly addresses the root cause

**Complexity**: simple - One-line variable substitution

#### Option 2: Update CLI documentation to explain current behavior

**Description**: Document that `--range` uses array indices, not lesson numbers, and update the help text accordingly.

**Why Not Chosen**: This documents the bug rather than fixing it. Users expect `--range 6-28` to mark lessons 6-28, not to use 1-based array indices.

### Selected Solution: Compare lesson_number instead of array index

**Justification**: The fix directly addresses the root cause with a minimal one-line change. The diagnostic identified the exact problem: comparing `const lessonIndex = i + 1` against the range parameter. Since lesson numbers don't start at 1 and have gaps, this comparison produces incorrect results. Using `lesson.lesson_number` instead makes the code semantically correct and matches user expectations.

**Technical Approach**:
- On line 361, change from: `const lessonIndex = i + 1;` and use `lessonIndex` in comparisons
- To: Extract `const lessonNum = parseInt(String(lesson.lesson_number), 10);` and use `lessonNum` in comparisons
- The comparison condition (line 364) will then correctly filter by actual lesson numbers
- All logging and display logic already references `lesson.lesson_number`, so the fix aligns the filter logic with the rest of the code

**Architecture Changes**: None - this is a bug fix in a utility script

**Migration Strategy**: Not needed - this is a tool script, not a data migration

## Implementation Plan

### Affected Files

- `scripts/testing/update-test-user-progress.ts` - Fix the range comparison logic to use `lesson.lesson_number` instead of array index

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Fix the range comparison logic

Modify the lesson filtering loop in `scripts/testing/update-test-user-progress.ts`:

- Line 361: Remove the `lessonIndex = i + 1` variable
- Line 364: Replace the comparison to use `lesson.lesson_number` instead of `lessonIndex`
- Keep the rest of the loop logic unchanged (all logging and progress updates are already correct)

**Why this step first**: This is the only code change needed. Once this is fixed, the script will filter the correct lessons.

#### Step 2: Add unit tests to prevent regression

Add tests for the lesson filtering logic:

- Test that `--range 6-28` marks lessons with lesson_number 6-28 (not array indices 6-28)
- Test edge cases: `--range 1-1` (single lesson), `--range 1-28` (all lessons)
- Test with gaps in lesson numbers (which is the current dataset structure)
- Mock the Payload API response to ensure tests run without external dependencies

**Test file**: `scripts/testing/__tests__/update-test-user-progress.test.ts`

#### Step 3: Manual verification

Execute the script with the default range and verify:

- Confirm the correct lessons are marked complete
- Review the output summary to confirm lesson numbers
- Query the database to verify the `lesson_progress` records

#### Step 4: Validation

Run all validation commands to ensure no regressions.

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ Filtering logic with numeric lesson_numbers
- ✅ Filtering logic with string lesson_numbers (both should work due to `parseInt`)
- ✅ Range boundary conditions (start=1, end=28)
- ✅ Single lesson range (`--range 5-5`)
- ✅ Edge case: lesson numbers with gaps (6, 8, 9, 10, etc.)
- ✅ Regression test: `--range 6-28` marks exactly lessons 6-28, not 12-31

**Test file**: `scripts/testing/__tests__/update-test-user-progress.test.ts`

Sample test structure:
```typescript
describe('update-test-user-progress filtering logic', () => {
  it('should mark lessons with lesson_number 6-28, not array indices 6-28', () => {
    const lessons = [
      { id: '1', lesson_number: 6, title: 'Lesson 1' },
      { id: '2', lesson_number: 8, title: 'Lesson 2' },
      { id: '3', lesson_number: 9, title: 'Lesson 3' },
      // ... more lessons
    ];

    const filtered = lessons.filter(lesson => {
      const lessonNum = parseInt(String(lesson.lesson_number), 10);
      return lessonNum >= 6 && lessonNum <= 28;
    });

    expect(filtered).toHaveLength(expected_count);
    expect(filtered.every(l => l.lesson_number >= 6 && l.lesson_number <= 28)).toBe(true);
  });

  it('should work with single lesson range', () => {
    // Test --range 10-10 marks only lesson_number 10
  });

  it('should work with string lesson_numbers', () => {
    // Test that parseInt handles string lesson numbers
  });
});
```

### Integration Tests

Add integration tests that:
- ✅ Test with real Supabase client and actual lesson data
- ✅ Verify that the correct lesson_progress records are created/updated
- ✅ Verify course_progress is calculated correctly

**Test file**: `scripts/testing/__tests__/update-test-user-progress.integration.test.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run with default range: `npx tsx scripts/testing/update-test-user-progress.ts`
  - Verify output shows lessons 6-28 marked complete (not 12-31)
  - Check the summary line: "Marked complete: 6, 8, 9, 10, ..." (should be lesson_numbers, not indices)
- [ ] Query the database: `SELECT * FROM lesson_progress WHERE user_id = '<test-user-id>' AND completed_at IS NOT NULL`
  - Verify lessons match the range parameter (6-28)
  - Count should be approximately 23 lessons (accounting for gaps)
- [ ] Run with single lesson: `npx tsx scripts/testing/update-test-user-progress.ts --range 10-10`
  - Verify only lesson_number 10 is marked complete
- [ ] Run with custom range: `npx tsx scripts/testing/update-test-user-progress.ts --range 1-5`
  - Verify only lessons 1-5 are marked (first 5 lessons in the course)
- [ ] Verify the course progress is calculated correctly
  - Formula: `completed_lessons / total_lessons * 100`
  - Should reflect the actual lesson_numbers marked, not array indices

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test environment data variance**: Different test databases might have different lesson structures
   - **Likelihood**: low (lessons are fetched dynamically from Payload)
   - **Impact**: low (script handles this gracefully with sorting and dynamic count)
   - **Mitigation**: Use both unit tests (mocked data) and integration tests (real data) to cover variations

2. **Payload API vs Supabase fallback differences**: Script attempts Payload API first, then Supabase as fallback
   - **Likelihood**: low (both queries use same `order by lesson_number`)
   - **Impact**: low (both paths will return same data)
   - **Mitigation**: Test both code paths during manual verification

**Rollback Plan**:

If the fix causes issues:
1. Revert the changes to `scripts/testing/update-test-user-progress.ts` (undo line 361/364 changes)
2. Re-run the script with the original buggy behavior (marks array indices instead of lesson_numbers)
3. Contact users if any test data was incorrectly marked

Note: This is a testing utility script, not production code, so the impact of a rollback is minimal.

## Performance Impact

**Expected Impact**: none

No performance impact expected. The fix uses the same sorting and comparison operations, just with the correct variable.

## Security Considerations

**Security Impact**: none

This is a testing utility script. No security implications from this fix.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify the bug exists by checking the script's comparison logic
grep -n "lessonIndex < RANGE_START" scripts/testing/update-test-user-progress.ts

# Run with default range and check output
pnpm --filter testing-scripts update-test-user --range 6-28

# Query database to verify wrong lessons are marked
# You should see lessons 12-31 marked (not 6-28)
```

**Expected Result**: Script marks lessons at array indices 6-28 (which are actually lesson_numbers 12-31)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Add and run unit tests (once implemented)
pnpm --filter testing-scripts test -- update-test-user-progress

# Manual test with real data
pnpm --filter testing-scripts update-test-user --range 6-28

# Query database to verify correct lessons are marked
# Should see lessons 6-8, 9, 10, ..., 28 marked
```

**Expected Result**: All commands succeed, script marks lessons 6-28, bug is resolved.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Test with various ranges to ensure robustness
pnpm --filter testing-scripts update-test-user --range 1-5
pnpm --filter testing-scripts update-test-user --range 10-20
pnpm --filter testing-scripts update-test-user --range 1-28
```

## Dependencies

### New Dependencies (if any)

None - this is a simple one-line fix to existing code.

## Database Changes

**No database changes required**

The fix only modifies the script logic for marking lessons complete. The database schema remains unchanged.

## Deployment Considerations

**Deployment Risk**: low

This is a development testing utility script. It doesn't affect production code or deployment pipelines.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained

The fix changes behavior to match user expectations (range means lesson_numbers, not array indices), but doesn't break the script interface.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Script correctly marks lessons by `lesson_number`, not array index
- [ ] Bug no longer reproduces with `--range 6-28` (marks lessons 6-28, not 12-31)
- [ ] Unit tests pass and cover the filtering logic
- [ ] Manual testing checklist complete
- [ ] Zero regressions in other scripts
- [ ] Code review approved (if applicable)

## Notes

- The script already sorts lessons by `lesson_number` (line 335-339), so the lessons array is in the correct order
- The logging already references `lesson.lesson_number`, confirming that's the intended semantic
- The fix is backward compatible because users expect lesson numbers, not array indices
- The test data uses lesson_numbers 6, 8, 9, 10, etc. (gaps exist), which is why array index comparison fails

---
_Generated by Bug Fix Planning Assistant_
_Based on diagnosis: #1023_
