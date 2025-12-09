# Bug Fix: Course progress bar fails to update due to getCourseBySlug called with UUID instead of slug

**Related Diagnosis**: #1029
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `getCourseBySlug(data.courseId)` called with UUID instead of slug in server-actions.ts line 183
- **Fix Approach**: Create new `getCourseById()` function and use it instead of `getCourseBySlug()`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The course progress bar displays "0 of 23 lessons completed" even after lessons are marked complete. When a lesson is completed, `updateLessonProgressAction()` calls `getCourseBySlug(data.courseId)` with a course UUID (like `"123e4567-e89b-12d3-a456-426614174000"`), but `getCourseBySlug()` queries by slug (like `"decks-for-decision-makers"`). This query always fails, silently skipping course progress calculations.

For full details, see diagnosis issue #1029.

### Solution Approaches Considered

#### Option 1: Create getCourseById() function ⭐ RECOMMENDED

**Description**: Create a new function that queries the Payload CMS by course ID instead of slug. This matches the actual data being passed.

**Pros**:
- Surgical fix - only adds necessary function
- Directly solves the problem at the source
- Minimal code changes (add function + change one line)
- Follows existing pattern (similar to `getCourseBySlug`)
- Easy to test and verify
- No side effects or breaking changes

**Cons**:
- Adds one more function to the API module (minimal concern)

**Risk Assessment**: low - straightforward function addition, no dependencies changed

**Complexity**: simple - one-liner function that mirrors `getCourseBySlug`

#### Option 2: Pass course slug instead of UUID

**Description**: Modify the code to extract and pass the course slug from the lesson object instead of the ID.

**Why Not Chosen**:
- More complex - requires examining lesson.course object structure
- Multiple points of failure (extracting wrong value)
- Breaks abstraction - server actions shouldn't need to know about course slugs
- Higher risk of edge cases

#### Option 3: Cache course lookups

**Description**: Store course data in a lookup cache to avoid repeated API calls.

**Why Not Chosen**:
- Over-engineering for current need
- Adds complexity and maintenance burden
- Current performance is acceptable
- Premature optimization

### Selected Solution: Create getCourseById() function

**Justification**:
This is the most straightforward, lowest-risk fix. The bug is a simple parameter type mismatch - `getCourseBySlug()` expects a slug but receives a UUID. Creating `getCourseById()` restores the correct behavior with minimal code changes and no architectural impact.

**Technical Approach**:
1. In `packages/cms/payload/src/api/course.ts`, add new function:
   ```typescript
   export async function getCourseById(id: string, ...) {
       return callPayloadAPI(
           `courses/${id}?depth=1`,
           {},
           supabaseClient,
       );
   }
   ```

2. In `apps/web/app/home/(user)/course/_lib/server/server-actions.ts` line 183, change:
   ```typescript
   // BEFORE
   const courseData = await getCourseBySlug(data.courseId);

   // AFTER
   const courseData = await getCourseById(data.courseId);
   ```

3. Import the new function in server-actions.ts

**Architecture Changes**: None - adding a complementary function, no existing code is modified except the one call site.

**Migration Strategy**: None needed - this is a bug fix, not a feature change. Existing course progress data is correct.

## Implementation Plan

### Affected Files

List files that need modification:
- `packages/cms/payload/src/api/course.ts` - Add `getCourseById()` function
- `packages/cms/payload/src/api/index.ts` - Export new function (if using barrel exports)
- `apps/web/app/home/(user)/course/_lib/server/server-actions.ts:183` - Change `getCourseBySlug()` to `getCourseById()`

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create the getCourseById() function

Create a new API function in Payload CMS package that queries by ID.

- In `packages/cms/payload/src/api/course.ts`, add after `getCourseBySlug()`:

```typescript
/**
 * Get a course by ID
 * @param id The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export async function getCourseById(
	id: string,
	_options = {},
	supabaseClient?: SupabaseClient,
) {
	return callPayloadAPI(
		`courses/${id}?depth=1`,
		{},
		supabaseClient,
	);
}
```

- Verify the function signature matches other API functions
- Ensure JSDoc comment follows project conventions

**Why this step first**: Foundation - the new function must exist before it can be used.

#### Step 2: Update exports (if using barrel exports)

- Check `packages/cms/payload/src/api/index.ts` (or main export file)
- If it exports functions from `course.ts`, verify `getCourseById` is included
- If no barrel export, this step is skipped

#### Step 3: Update server-actions to use new function

Replace the bug on line 183:

- In `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`:
  - Line 1-10: Verify import includes `getCourseById`
  - Line 180-184: Change from `getCourseBySlug(data.courseId)` to `getCourseById(data.courseId)`
  - Add comment explaining the fix if needed

#### Step 4: Add regression test

Create a test to prevent this bug from reoccurring:

- In `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`:
  - Add test case: "updateLessonProgressAction should correctly fetch course by ID"
  - Test that `getCourseById()` is called with the courseId UUID
  - Verify course progress is calculated and updated
  - Mock Payload API response to return valid course data

#### Step 5: Run validation commands

Execute commands to verify the fix:

- Type check
- Lint
- Run unit tests for affected files
- Manual verification

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getCourseById()` should query Payload API correctly
- ✅ `updateLessonProgressAction()` should call `getCourseById()` with courseId
- ✅ Course progress should be calculated after successful course lookup
- ✅ Regression test: Original bug (progress shows 0) should not reoccur

**Test files**:
- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Test `updateLessonProgressAction`
- `packages/cms/payload/src/api/course.test.ts` - Test `getCourseById` (if applicable)

### Integration Tests

No integration tests needed for this fix - it's a server action that interacts with Payload API which is mocked in tests.

### E2E Tests

Manual E2E verification:

- Navigate to `/home/course`
- Mark multiple lessons as complete
- Verify progress bar updates after each lesson
- Verify count increases correctly
- Return to course dashboard and refresh to verify persistence

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (progress bar stays at 0) - verify bug exists
- [ ] Apply fix code changes
- [ ] Run `pnpm typecheck` - should pass
- [ ] Run `pnpm lint` - should pass
- [ ] Run unit tests - should pass with new test
- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to `/home/course` - should show course with 0 lessons completed
- [ ] Complete first lesson (via quiz or "Mark as Completed")
- [ ] Verify progress bar updates to "1 of 23 lessons completed"
- [ ] Complete second lesson
- [ ] Verify progress bar updates to "2 of 23 lessons completed"
- [ ] Refresh page - verify count persists
- [ ] Check browser console - no new errors
- [ ] Return to course dashboard from lesson page - progress bar reflects completion

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **API endpoint format incompatibility**: The `courses/${id}` endpoint may not exist in Payload API
   - **Likelihood**: low - Payload CMS standard REST API includes direct resource access
   - **Impact**: medium - course lookups would fail
   - **Mitigation**: Verify Payload API documentation; test with existing course ID first

2. **UUID vs slug in unexpected places**: Other code might pass UUIDs to `getCourseBySlug()`
   - **Likelihood**: low - direct call in server-actions.ts is the only affected location
   - **Impact**: low - wouldn't affect this fix, already broken in those places
   - **Mitigation**: Leave as-is, can be addressed in separate refactoring

3. **Depth parameter mismatch**: The `?depth=1` parameter may not match what was expected before
   - **Likelihood**: low - consistent with `getCourseBySlug()`
   - **Impact**: low - depth=1 expands relationships, same behavior
   - **Mitigation**: None needed, this is intentional and correct

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `server-actions.ts` line 183 to use `getCourseBySlug()`
2. Remove `getCourseById()` function from `course.ts`
3. Redeploy
4. Course progress bars will revert to showing 0 (original bug) but no crashes

Note: Rollback is very unlikely - this is a targeted bug fix with low complexity.

**Monitoring** (if needed):
- Monitor for errors in lesson completion flow
- Check logs for "Course progress updated" messages (existing logging in server-actions.ts)
- Watch for 404/500 errors when fetching courses

## Performance Impact

**Expected Impact**: none

The new `getCourseById()` function has identical performance characteristics to `getCourseBySlug()` - single API call to Payload CMS with the same depth parameter.

**Performance Testing**:
- No performance testing needed - same operation, same performance

## Security Considerations

**Security Impact**: none

- No new endpoints exposed
- No permissions changes
- UUID is already known to the user (from lesson data)
- No privilege escalation or data access changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# The bug is silent - no error messages
# You must manually verify by:
# 1. Navigate to /home/course - observe "0 of 23 lessons completed"
# 2. Complete a lesson
# 3. Return to /home/course - still shows "0 of 23 lessons completed" (BUG)
```

**Expected Result**: Progress bar does not update after completing lessons

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for affected files
pnpm --filter web test:unit server-actions

# Build
pnpm build

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to /home/course - observe "0 of 23 lessons completed"
# 3. Complete a lesson
# 4. Return to /home/course - should show "1 of 23 lessons completed" (FIXED)
# 5. Complete more lessons - counter should increment correctly
# 6. Refresh page - progress should persist
```

**Expected Result**:
- All validation commands pass
- Bug is resolved: progress bar increments when lessons are completed
- Zero console errors
- Zero regressions

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify specific course-related functionality
pnpm --filter web test:unit course

# Manual check: Navigate through course flow
# - Complete lessons
# - Verify progress updates
# - Verify course completion flow works
```

## Dependencies

No new dependencies required - uses existing Payload CMS API infrastructure.

## Database Changes

No database changes required - bug fix only, no schema modifications.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - no breaking changes

## Success Criteria

The fix is complete when:
- [ ] `getCourseById()` function created in `packages/cms/payload/src/api/course.ts`
- [ ] `server-actions.ts` line 183 updated to use `getCourseById()`
- [ ] All TypeScript types check correctly (`pnpm typecheck` passes)
- [ ] All linting passes (`pnpm lint` passes)
- [ ] Unit tests pass (including new regression test)
- [ ] Manual testing confirms progress bar updates correctly
- [ ] No console errors appear during manual testing
- [ ] Progress persists after page refresh
- [ ] No regressions in other course functionality

## Notes

**Implementation Notes**:
- The fix is straightforward - one new function and one line changed
- Existing error logging in server-actions.ts (lines 191-243) will help diagnose if course lookup fails
- The bug was "silent" because failed course lookup just skips progress calculation rather than throwing an error
- Consider adding error handling in future refactoring to make silent failures more visible

**Related Context**:
- Diagnosis issue: #1029 contains full root cause analysis
- Similar API functions exist for other resources (getCourseBySlug, getCourseBySlug, getCourseLessons)
- The pattern is established: function name indicates query parameter (ById vs BySlug)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1029*
