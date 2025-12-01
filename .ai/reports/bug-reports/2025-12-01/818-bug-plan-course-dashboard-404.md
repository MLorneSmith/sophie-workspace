# Bug Fix: Course Dashboard Fails to Load Lessons - Payload API 404 Error

**Related Diagnosis**: #817 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Payload CMS API endpoint names use underscores (`course_lessons`) but collection slugs are hyphenated (`course-lessons`)
- **Fix Approach**: Update four API endpoint calls to use correct hyphenated slugs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The course dashboard at `/home/course` fails to display lesson information because API calls in `packages/cms/payload/src/api/course.ts` use underscore-separated endpoint names while Payload CMS collections use hyphen-separated slugs. This causes 404 errors for all lesson-related and quiz-related API calls.

**Collection Slugs (Correct)**:
- `course-lessons` (not `course_lessons`)
- `course-quizzes` (not `course_quizzes`)
- `quiz-questions` (not `quiz_questions`)

For full details, see diagnosis issue #817.

### Solution Approaches Considered

#### Option 1: Update API Endpoint Names ⭐ RECOMMENDED

**Description**: Replace underscore-separated endpoint names with hyphen-separated names in the API wrapper functions to match Payload CMS collection slugs.

**Pros**:
- One-line fixes in 4 locations
- No architectural changes required
- Zero breaking changes
- Minimal risk of unintended side effects
- Immediate fix for the problem

**Cons**:
- None identified

**Risk Assessment**: low - Direct string replacement in API calls with no complex logic changes

**Complexity**: simple - Straightforward find-and-replace with verification

#### Option 2: Create a Slug Mapping Layer (Rejected)

**Description**: Add a slug normalization layer that automatically converts underscores to hyphens.

**Why Not Chosen**: Over-engineering for a simple naming convention error. A mapping layer would add complexity without benefit when the fix is just updating four strings.

#### Option 3: Update Payload Collections to Use Underscores (Rejected)

**Description**: Change collection slugs to match the API calls.

**Why Not Chosen**: Payload CMS uses hyphens consistently across all other collections (Downloads, Private, SurveyQuestions, etc.). Changing these three collections would break consistency and require database migrations.

### Selected Solution: Update API Endpoint Names

**Justification**: This is the correct and simplest solution. Payload CMS collections use hyphen-separated slugs as standard convention. The API wrapper simply needs to match this convention. No other code depends on these specific endpoint names being underscored.

**Technical Approach**:
- Replace `course_lessons` with `course-lessons` in `getCourseLessons()` (line 57)
- Replace `course_lessons` with `course-lessons` in `getLessonBySlug()` (line 76)
- Replace `course_quizzes` with `course-quizzes` in `getQuiz()` (line 161)
- Replace `quiz_questions` with `quiz-questions` in `getQuiz()` (line 203)

**Architecture Changes**: None - this is a naming convention fix only

**Migration Strategy**: Not needed - this is a bug fix with no data migration

## Implementation Plan

### Affected Files

- `packages/cms/payload/src/api/course.ts` - Contains all four API endpoint calls that need fixing

### New Files

None needed

### Step-by-Step Tasks

#### Step 1: Update API Endpoint Names

Replace underscore-separated endpoint names with hyphenated equivalents in `packages/cms/payload/src/api/course.ts`:

- Line 57: `course_lessons` → `course-lessons` in `getCourseLessons()`
- Line 76: `course_lessons` → `course-lessons` in `getLessonBySlug()`
- Line 161: `course_quizzes` → `course-quizzes` in `getQuiz()`
- Line 203: `quiz_questions` → `quiz-questions` in `getQuiz()`

**Why this step first**: These are the direct cause of the 404 errors. Fixing these endpoint names will immediately resolve the bug.

#### Step 2: Verify Payload Collection Slugs

Confirm that the hyphenated endpoint names match actual Payload CMS collection slugs:

- Verify `course-lessons` is the slug in `apps/payload/src/collections/CourseLessons.ts`
- Verify `course-quizzes` is the slug in `apps/payload/src/collections/CourseQuizzes.ts`
- Verify `quiz-questions` is the slug in `apps/payload/src/collections/QuizQuestions.ts`

**Expected**: All three collections should have their respective hyphenated slugs.

#### Step 3: Type Check and Format

- Run `pnpm typecheck` to ensure no type errors are introduced
- Run `pnpm format:fix` to maintain code style consistency
- Run `pnpm lint:fix` to address any linting issues

#### Step 4: Manual Testing

Test the fix manually before running automated tests:

- Start development server: `pnpm dev`
- Log in as any user
- Navigate to `/home/course`
- Verify course dashboard loads without errors
- Check server console for any 404 errors (should be none)
- Verify lessons are displayed with completion status

#### Step 5: Run Test Suite

Execute automated test suite to ensure no regressions:

- Run `pnpm test:unit` to verify unit tests pass
- Run `pnpm test:e2e` if course-related E2E tests exist
- Monitor for any new failures

#### Step 6: Final Validation

Confirm the fix is complete:

- Course dashboard loads successfully
- All lessons display with correct data
- Server console shows no 404 errors
- All tests pass
- Code formatting is correct

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getCourseLessons()` - verify correct endpoint is called
- ✅ `getLessonBySlug()` - verify correct endpoint is called
- ✅ `getQuiz()` - verify correct endpoint is called for quiz and questions
- ✅ Regression test: API calls use correct hyphenated endpoint names

**Test files**:
- `packages/cms/payload/src/api/__tests__/course.spec.ts` - test API endpoint construction

### Integration Tests

Test that the course dashboard page correctly fetches data:
- Verify course loading page correctly calls API functions
- Verify lessons populate on course dashboard
- Verify quiz data loads correctly

**Test files**:
- E2E tests for course dashboard if they exist

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start development server (`pnpm dev`)
- [ ] Log in as test user
- [ ] Navigate to `/home/course`
- [ ] Verify course title loads
- [ ] Verify lesson list displays (no 404 errors)
- [ ] Verify lesson completion status shows correctly
- [ ] Click on a lesson to verify quiz loads
- [ ] Check browser console - no 404 errors
- [ ] Check server console - no PAYLOAD-API-ERROR messages
- [ ] Test with multiple courses if available

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **String Replacement Error**: Accidentally changing other parts of the code
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Use targeted find-and-replace with verification before committing

2. **Payload Collection Slug Mismatch**: The hyphenated slugs might not be correct
   - **Likelihood**: low (already verified in diagnosis)
   - **Impact**: medium
   - **Mitigation**: Verify slug configuration in Payload collection files before committing

3. **Undetected API Calls**: Other files might also be using underscored endpoint names
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Search codebase for similar patterns (e.g., `course_` or `quiz_`) in API calls

**Rollback Plan**:

If this fix causes issues:
1. Revert the four line changes in `packages/cms/payload/src/api/course.ts`
2. Push the revert commit
3. The application will return to original state (course dashboard won't load)

**Monitoring** (if needed):
- Monitor course dashboard page loads post-deployment
- Watch for 404 errors in Sentry or application logs
- Alert on any PAYLOAD-API-ERROR messages

## Performance Impact

**Expected Impact**: none

This is a bug fix with no performance implications. The API calls will now succeed instead of returning 404 errors, which is a pure correction of existing functionality.

## Security Considerations

**Security Impact**: none

This fix does not introduce or change any security-related code. No authentication, authorization, or data validation changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Search for the underscore endpoint names (should find them)
grep -n "course_lessons\|course_quizzes\|quiz_questions" packages/cms/payload/src/api/course.ts

# Start dev server and navigate to /home/course
pnpm dev
# Then in browser: http://localhost:3000/home/course
# Expected: Course title loads, no lessons displayed, browser console shows 404 errors
```

**Expected Result**: Four matches found for underscore-separated endpoint names. Course dashboard loads partially but no lessons display.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit

# E2E tests (if applicable)
pnpm test:e2e

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to http://localhost:3000/home/course
# 3. Verify lessons load without 404 errors
# 4. Check server console - no PAYLOAD-API-ERROR messages
# 5. Check browser console - no 404 errors
```

**Expected Result**: All commands succeed, course dashboard loads with lessons, zero 404 errors in console.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Search to verify underscored endpoint names were updated
grep -n "course_lessons\|course_quizzes\|quiz_questions" packages/cms/payload/src/api/course.ts
# Expected: No matches (all updated to hyphenated)

# Check for other possible instances of same pattern
grep -r "course_\|quiz_" packages/cms/payload/src/api/ --include="*.ts"
# Review any matches to ensure no related issues exist
```

## Dependencies

### New Dependencies

None - this fix requires no new dependencies

## Database Changes

**Migration needed**: no

No database schema or migration changes required. This is a client-side API naming fix only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

This fix maintains backwards compatibility. The API calls will simply work correctly instead of returning 404 errors.

## Success Criteria

The fix is complete when:
- [ ] All four underscore endpoint names are replaced with hyphenated versions
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` is correct
- [ ] Manual testing shows course dashboard loads without 404 errors
- [ ] All unit tests pass
- [ ] All E2E tests pass (if applicable)
- [ ] Zero regressions detected
- [ ] Browser console shows no 404 errors for course/quiz API calls
- [ ] Server console shows no PAYLOAD-API-ERROR messages

## Notes

**Naming Convention**: Payload CMS uses hyphen-separated collection slugs as standard throughout the codebase (Downloads, Private, SurveyQuestions, etc.). This fix brings the API calls into alignment with that standard.

**Similar Issues**: Search the codebase for other API wrapper functions that might have similar naming convention issues. Consider adding a comment or documentation about the correct Payload CMS naming convention.

**Related Documentation**:
- Payload CMS Collections: `apps/payload/src/collections/*.ts`
- API Wrapper Functions: `packages/cms/payload/src/api/*.ts`
- Course Dashboard: `apps/web/app/home/course/page.tsx`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #817*
