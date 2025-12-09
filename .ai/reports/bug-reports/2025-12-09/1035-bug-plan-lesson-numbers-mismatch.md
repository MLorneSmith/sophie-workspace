# Bug Fix: REQUIRED_LESSON_NUMBERS configuration uses outdated numbering scheme

**Related Diagnosis**: #1033 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `REQUIRED_LESSON_NUMBERS` array contains outdated lesson numbers ("101", "103", etc.) that don't match current database lesson numbers (6-29)
- **Fix Approach**: Update the configuration array to match actual lesson numbers from the seeded database
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The course progress bar displays "0 of 23 lessons completed" despite users completing lessons. This is because the `includes()` check in the progress calculation fails - the config has outdated lesson numbers like "101" and "103" while the database contains lesson numbers 6-29. When a user completes lesson 6, the system checks if "6" is in the array ["101", "103", ...] and it fails.

For full details, see diagnosis issue #1033.

### Solution Approaches Considered

#### Option 1: Update REQUIRED_LESSON_NUMBERS array ⭐ RECOMMENDED

**Description**: Replace the hardcoded array with the correct lesson numbers (6, 8-29) that match the current seeded data. This is a simple configuration update that directly addresses the root cause.

**Pros**:
- Simplest fix with minimal code changes
- Directly addresses root cause identified in diagnosis
- No database schema changes needed
- No performance impact
- Takes 5 minutes to implement

**Cons**:
- Manual configuration is brittle - if lessons are added/removed, config must be updated manually
- No automated sync between database and configuration

**Risk Assessment**: low - Configuration value change, easily reversible, existing tests cover this scenario

**Complexity**: simple - Single array value update, no logic changes

#### Option 2: Query lesson numbers from database dynamically

**Description**: Load `REQUIRED_LESSON_NUMBERS` from the database at runtime instead of hardcoding, automatically staying in sync with actual lessons.

**Pros**:
- Future-proof - automatically adapts to lesson additions/removals
- Single source of truth in database
- More maintainable long-term

**Cons**:
- Adds runtime database query where static config is simpler
- Requires refactoring of how config is accessed
- More complex than necessary for current issue
- May impact performance if called frequently

**Why Not Chosen**: Over-engineered for the immediate problem. The lesson structure is stable and unlikely to change frequently. A simple config update is appropriate here. If lesson management becomes dynamic in the future, this can be revisited.

#### Option 3: Derive from lesson table at build time

**Description**: Generate the config file from the database during the build process.

**Pros**:
- Keeps static config while staying in sync with DB
- No runtime queries

**Cons**:
- Adds build complexity
- Requires database connection during build
- Harder to debug config mismatches

**Why Not Chosen**: Unnecessary complexity. A manual configuration update and documented comment about where these numbers come from is sufficient.

### Selected Solution: Update REQUIRED_LESSON_NUMBERS array

**Justification**: This is the simplest, most direct fix that immediately resolves the bug. The lesson structure is stable (lessons 6-29 are required, 30-31 are post-completion). A clear comment explaining the lesson numbering scheme will prevent future confusion.

**Technical Approach**:
- Replace the array values with actual lesson numbers: [6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
- Note: Lessons 7 is missing (no lesson with that number), and 30-31 are post-completion lessons
- Add clear comment documenting where these numbers come from (seeded lesson data)
- Update `TOTAL_REQUIRED_LESSONS` comment to reference the count (23)

**Architecture Changes**: None - This is purely a configuration value update.

**Migration Strategy**: No migration needed - purely a code change.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/lib/course/course-config.ts` - Update REQUIRED_LESSON_NUMBERS array with correct lesson numbers
- `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` - Uses the config (no changes needed, fix enables it to work correctly)
- `apps/web/app/home/(user)/course/_lib/server/server-actions.ts` - Uses the config (no changes needed)
- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Test file (may need updates if tests hardcode values)
- `scripts/testing/test-certificate-generation.ts` - Script uses the config (verify it works with fix)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update course-config.ts with correct lesson numbers

<describe what this step accomplishes>

- Open `apps/web/lib/course/course-config.ts`
- Replace the REQUIRED_LESSON_NUMBERS array with: [6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
- Update the JSDoc comment to reflect:
  - These are the current lesson numbers (no longer "101", "103", etc.)
  - Note that lesson 7 is skipped (no lesson exists with that number)
  - Lessons 30 and 31 are post-completion lessons shown after course completion
- Update TOTAL_REQUIRED_LESSONS comment to confirm it's 23 lessons

**Why this step first**: This is the direct fix for the root cause. Everything else depends on this being correct.

#### Step 2: Verify tests pass with updated config

<describe what this step accomplishes>

- Run the course-related tests to ensure the fix works:
  - `pnpm --filter web test:server apps/web/app/home/\(user\)/course/_lib/server/server-actions.test.ts`
- Verify tests pass with the new lesson numbers
- If tests fail, analyze the test expectations and understand why

#### Step 3: Manually test the course progress calculation

<describe what this step accomplishes>

- This is a critical manual verification step
- Navigate to the course page and complete a lesson
- Verify the progress bar now shows correct completion count instead of "0 of 23"
- Verify that after completing all 23 required lessons, the completion badge shows 100%

**Why this step**: Ensures the fix resolves the actual user-facing bug.

#### Step 4: Verify script usage is correct

- Check `scripts/testing/test-certificate-generation.ts` to ensure it works with updated config
- If the script was relying on specific lesson numbers, verify it still functions correctly
- Run the script if applicable to confirm no regressions

#### Step 5: Type check, lint, and format

- Run `pnpm typecheck` to ensure no TypeScript errors
- Run `pnpm lint:fix` to fix any linting issues
- Run `pnpm format:fix` to ensure code formatting is correct

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `TOTAL_REQUIRED_LESSONS` should equal 23
- ✅ Progress calculation with lesson numbers 6, 8-29
- ✅ Edge case: lesson 7 should not be included
- ✅ Edge case: lessons 30, 31 should not affect required count
- ✅ Regression test: Original bug should not reoccur (verify includes() check now works)

**Test files**:
- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Test progress calculation with updated config

### Integration Tests

No new integration tests needed - existing course tests cover the happy path.

### E2E Tests

If E2E tests exercise the course progress:
- Verify existing E2E tests pass with the updated config
- If tests hardcode lesson numbers, update them to match new config

**Test files**:
- `apps/e2e/tests/course.spec.ts` (if it exists) - Run full course flow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Open course dashboard page
- [ ] Progress bar shows "0 of 23" (before completing any lessons)
- [ ] Complete lesson 6 (first lesson)
- [ ] Refresh page
- [ ] Progress bar now shows "1 of 23"
- [ ] Complete a few more lessons (8, 9, 10)
- [ ] Refresh page
- [ ] Progress bar shows "4 of 23"
- [ ] Verify lesson 7 is not shown (doesn't exist)
- [ ] Complete all 23 required lessons
- [ ] Verify progress shows "23 of 23" and completion is 100%
- [ ] Verify post-completion lessons (30, 31) don't affect progress counter
- [ ] Verify no console errors related to progress calculation
- [ ] Test on different browsers if possible

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test expectations mismatch**: Existing tests may hardcode the old lesson numbers
   - **Likelihood**: medium
   - **Impact**: low (tests will fail obviously, easy to fix)
   - **Mitigation**: Run tests immediately after fix to catch discrepancies

2. **User data inconsistency**: Users who completed lessons using old config may see different progress
   - **Likelihood**: low (old config never worked, so no users have valid completion data)
   - **Impact**: low (progress will be accurate going forward)
   - **Mitigation**: This actually fixes the issue rather than creating one

3. **Script breakage**: `test-certificate-generation.ts` or other scripts may rely on specific numbers
   - **Likelihood**: low
   - **Impact**: medium (scripts may fail)
   - **Mitigation**: Verify scripts work with new numbers, update if needed

**Rollback Plan**:

If this fix causes issues:
1. Revert `apps/web/lib/course/course-config.ts` to original values
2. Run tests to confirm rollback
3. Investigate why fix caused issues (likely test expectations)
4. Implement proper fix addressing the root cause of the new issue

**Monitoring** (if needed):
- Monitor course completion metrics to ensure progress calculation is accurate
- Check for any error logs related to lesson progress after deploying fix

## Performance Impact

**Expected Impact**: none

No performance changes - this is purely a configuration value update. The includes() check performs the same operation with updated values.

## Security Considerations

No security implications - this is a simple configuration update with no authentication, authorization, or data access changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug cannot be easily reproduced in automated testing since the old config never matched any lessons. Manual testing is the only way to verify the bug (see Manual Testing Checklist above).

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run course tests
pnpm --filter web test:server apps/web/app/home/\(user\)/course/_lib/server/server-actions.test.ts

# Build to ensure no errors
pnpm build

# Manual verification
# Navigate to course page and complete a lesson - progress should now increment
```

**Expected Result**: All commands succeed, progress bar now shows correct completion counts.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check no TypeScript errors
pnpm typecheck
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

No database changes required - this is purely a configuration update.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a simple configuration change, no database migrations or complex deployments needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained - Users' completion data remains valid, this fix just makes the calculation work correctly.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Course progress bar displays correct completion count
- [ ] Progress increments correctly as lessons are completed
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Manual testing checklist completed
- [ ] Performance remains acceptable
- [ ] Code formatting and linting issues resolved

## Notes

**Implementation notes:**
- The lesson numbers 6-29 (excluding 7) come from the seeded lesson data in `apps/payload/src/seed/seed-data/course-lessons.json`
- Lessons 30 and 31 are post-completion lessons shown after the user completes the course
- The original config with lesson numbers like "101", "103" was from an older course design that was completely replaced
- This is likely caused by issue #1029 being only partially fixed by #1030 - the getLessonById was fixed but the config wasn't updated

**Related issues:**
- #1029 - Original diagnosis (partially addressed)
- #1030 - Fixed getLessonById issue but didn't address this root cause
- #1033 - Full diagnosis of this remaining issue

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1033*
