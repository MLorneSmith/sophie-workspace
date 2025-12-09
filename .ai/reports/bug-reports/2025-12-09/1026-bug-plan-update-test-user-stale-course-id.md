# Bug Fix: update-test-user script fails with stale course ID

**Related Diagnosis**: #1025 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Hardcoded course UUID doesn't match dynamically-generated UUID in database after resets
- **Fix Approach**: Dynamically look up course ID by title at script startup
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `update-test-user` script uses a hardcoded course ID (`e64f4913-a5b0-42b2-958c-f0c39a254e39`) that becomes stale after database resets when Payload CMS generates new UUIDs. The actual course ID in the database is `aa17d72a-32d1-4113-b90a-188e9981bd81`. This causes the script to fail with "No lessons found for the course" because it queries with the wrong course ID.

For full details, see diagnosis issue #1025.

### Solution Approaches Considered

#### Option 1: Dynamic Course ID Lookup from Payload CMS ⭐ RECOMMENDED

**Description**: When the script starts, fetch the course ID by title from the Payload CMS API (`/api/courses` endpoint) instead of using a hardcoded UUID. This ensures the script always uses the current course ID regardless of database resets.

**Pros**:
- Aligns with existing architecture (script already uses Payload CMS API for lessons)
- Single source of truth from the API (no need to manage Supabase fallback)
- Simplest implementation - just add one API call at startup
- Leverages existing `fetch` mechanism already in the script
- Most resilient - if Payload is running, the script will work

**Cons**:
- Requires Payload CMS to be running (but it's already required for lesson fetching)
- Slight startup delay for additional API call (negligible - ~100ms)

**Risk Assessment**: Low - Uses existing patterns and dependencies

**Complexity**: Simple - Single API call with error handling

#### Option 2: Query Course by Title from Supabase payload.courses Table

**Description**: Query the `payload.courses` table directly via Supabase to fetch the course ID by title. Replace the hardcoded constant with a database lookup.

**Pros**:
- Works even if Payload CMS is offline
- Direct database access is fast
- No additional API dependencies

**Cons**:
- Requires exposing `payload` schema through PostgREST (current setup doesn't do this)
- Would need to modify Supabase RLS policies or use admin client
- More complex error handling for database-level issues
- Creates dependency on internal Payload schema structure

**Why Not Chosen**: Option 1 is simpler and aligns better with the script's existing architecture. The script already depends on Payload CMS being available for the lesson fetching phase.

#### Option 3: Store Course ID in Configuration File

**Description**: Create a configuration file (e.g., `.env.test` or `.courses.json`) that maps course names to IDs, updated whenever the database is reset.

**Pros**:
- Works offline
- No API calls needed

**Cons**:
- Requires manual maintenance - developers must update the config after resets
- Prone to becoming stale (defeats the purpose of fixing the issue)
- Additional file to manage in the repository

**Why Not Chosen**: Doesn't solve the core problem - the configuration would become stale just like the hardcoded ID does now.

### Selected Solution: Dynamic Course ID Lookup from Payload CMS

**Justification**: Option 1 is the best choice because:

1. **Simplicity**: Single API call with minimal code changes
2. **Alignment**: Uses the same Payload CMS API already required by the script
3. **Resilience**: Works reliably as long as Payload is running (which is already required)
4. **Maintainability**: No configuration files to update; self-correcting after database resets
5. **Low Risk**: No changes to schema, RLS policies, or existing logic

**Technical Approach**:

1. Create a new async function `fetchCourseIdByTitle(payloadUrl, courseTitle)` that:
   - Makes a GET request to `${payloadUrl}/api/courses?where[title][equals]=${courseTitle}`
   - Parses the response to extract the course ID
   - Returns the ID or throws an error if not found

2. Call this function at the start of `main()` before fetching lessons, replacing the hardcoded `const COURSE_ID = "..."`

3. Update error messages to be clear about the missing course

4. Add logging to indicate which course ID was found (helps debugging)

**Architecture Changes**: None - purely additive, no existing code restructuring

**Migration Strategy**: None needed - backward compatible change

## Implementation Plan

### Affected Files

- `scripts/testing/update-test-user-progress.ts` - Add dynamic course ID lookup function and call it at startup

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Add Course ID Lookup Function

Add a new async function to fetch the course ID by title from Payload CMS:

```typescript
/**
 * Fetch course ID by course title from Payload CMS
 * @param payloadUrl The Payload CMS URL
 * @param courseTitle The course title to search for
 * @returns The course ID UUID
 */
async function fetchCourseIdByTitle(
  payloadUrl: string,
  courseTitle: string,
): Promise<string> {
  try {
    const response = await fetch(
      `${payloadUrl}/api/courses?where[title][equals]=${encodeURIComponent(courseTitle)}&limit=1`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }

    const data = (await response.json()) as { docs?: Array<{ id: string }> };
    const courses = data.docs || [];

    if (courses.length === 0) {
      throw new Error(
        `Course not found: "${courseTitle}". Available courses should be seeded in Payload CMS.`,
      );
    }

    const courseId = courses[0].id;
    logger.info(`Found course "${courseTitle}" with ID: ${courseId}`, {
      operation: "fetch_course_id",
      courseTitle,
      courseId,
    });

    return courseId;
  } catch (error) {
    logger.error(`Error fetching course ID for "${courseTitle}":`, {
      operation: "fetch_course_id",
      error,
      courseTitle,
    });
    throw error;
  }
}
```

**Why this step first**: Sets up the foundation for dynamic ID lookup. Must be defined before calling it in `main()`.

#### Step 2: Update main() to Use Dynamic Course ID

Replace the hardcoded course ID constant with a dynamic lookup:

- **Find**: Line 163: `const COURSE_ID = "e64f4913-a5b0-42b2-958c-f0c39a254e39";`
- **Replace with**: Move inside `main()` and call the new function:

```typescript
async function main() {
  try {
    // ... existing code ...

    // Get the user
    const user = await getUser(TEST_USER_EMAIL);
    const userId = user.id;

    // Dynamically fetch the course ID by title
    logger.info("Fetching course ID for 'Decks for Decision Makers'...");
    const COURSE_ID = await fetchCourseIdByTitle(
      payloadUrl,
      "Decks for Decision Makers",
    );

    // Get all lessons for the course from Payload CMS
    logger.info("Fetching course lessons from Payload CMS...");
    const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Why this step second**: Once the function is defined, integrate it into the main workflow at startup.

#### Step 3: Add Unit Tests

Create a test file to validate the course ID lookup:

**Test file**: `scripts/testing/__tests__/update-test-user-progress.test.ts`

Add tests for:

```typescript
describe('fetchCourseIdByTitle', () => {
  // Mock Payload CMS API
  // Test 1: Successfully fetch course ID
  it('should fetch course ID for "Decks for Decision Makers"', async () => {
    // Mock API response with correct format
    // Call function and verify returned ID matches expected UUID pattern
  });

  // Test 2: Handle missing course gracefully
  it('should throw error when course is not found', async () => {
    // Mock API response with empty docs array
    // Call function and verify error message is helpful
  });

  // Test 3: Handle API errors gracefully
  it('should throw error when Payload CMS API fails', async () => {
    // Mock API response with non-200 status
    // Call function and verify error is properly logged
  });

  // Test 4: Handle invalid course title
  it('should handle URL encoding of course title', async () => {
    // Use course title with special characters
    // Verify the URL is properly encoded
  });
});
```

**Why this step third**: Ensures the new function works correctly before integration testing.

#### Step 4: Run Integration Test

Execute the script against a fresh database to verify the fix:

```bash
# Reset the database (creates fresh course IDs)
pnpm supabase:web:reset

# Run the update-test-user script
pnpm --filter testing-scripts update-test-user

# Expected output:
# [INFO] Found course "Decks for Decision Makers" with ID: <new-uuid>
# [INFO] Successfully fetched <N> lessons from Payload CMS
# [INFO] Marked lesson X as complete: ...
# [SUCCESS] Successfully updated course progress
```

**Why this step fourth**: Validates the fix works end-to-end with a fresh database.

#### Step 5: Clean Up Fallback Query

Since we're now guaranteeing the course ID is correct before fetching lessons, we can simplify the `fetchLessonsFromPayload` function by removing the problematic Supabase fallback:

- **Find**: Lines 211-265 (the entire fallback logic)
- **Simplify**: Keep only the Payload CMS API call and throw a clear error if it fails

```typescript
async function fetchLessonsFromPayload(
  courseId: string,
): Promise<LessonData[]> {
  logger.info(
    `Fetching lessons from Payload CMS for course ID: ${courseId}...`,
  );

  try {
    const response = await fetch(
      `${payloadUrl}/api/course-lessons?where[course_id][equals]=${courseId}&sort=lesson_number&limit=100`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch lessons: ${response.statusText}`);
    }

    const data = (await response.json()) as { docs?: LessonData[] };
    const lessons = data.docs || [];

    logger.info(
      `Successfully fetched ${lessons.length} lessons from Payload CMS`,
      {
        operation: "fetch_lessons_payload",
        courseId,
        lessonCount: lessons.length,
      },
    );

    return lessons;
  } catch (error) {
    logger.error("Error fetching lessons from Payload CMS:", {
      operation: "fetch_lessons_payload",
      error,
      courseId,
    });
    throw new Error(
      `Failed to fetch lessons from Payload CMS for course ${courseId}. ` +
      `Ensure Payload CMS is running at ${payloadUrl} and the course ID is correct.`,
    );
  }
}
```

**Why this step fifth**: Removes unreliable fallback code that was causing confusion. The Supabase fallback never worked properly due to schema/column name issues, so removing it simplifies the code and prevents future confusion.

## Testing Strategy

### Unit Tests

Add unit tests for the new `fetchCourseIdByTitle` function:

- ✅ Successfully fetch course ID when course exists
- ✅ Throw helpful error when course is not found
- ✅ Throw helpful error when Payload CMS is unreachable
- ✅ Properly URL-encode course title with special characters
- ✅ Handle empty docs array in API response

**Test files**:
- `scripts/testing/__tests__/update-test-user-progress.test.ts`

### Integration Tests

Execute the full script against a fresh database:

- ✅ Script successfully runs after database reset
- ✅ Script finds the correct course ID (not hardcoded)
- ✅ Script marks the correct lesson range as complete
- ✅ Course progress is correctly updated with dynamic lesson count

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm supabase:web:reset` to get a fresh database with new UUIDs
- [ ] Run `pnpm --filter testing-scripts update-test-user`
- [ ] Verify script outputs the new course ID (should be different each reset)
- [ ] Verify script completes successfully without errors
- [ ] Verify lesson progress records were created in the database
- [ ] Verify course progress record shows correct completion percentage
- [ ] Run script again with `--range 1-10` to verify custom ranges work
- [ ] Run with different user: `--user test2@slideheroes.com` to verify multi-user support

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Payload CMS Offline**: The script now explicitly requires Payload CMS to be running to fetch the course ID
   - **Likelihood**: Medium (developers might start the script without starting Payload first)
   - **Impact**: Low (clear error message tells them to start Payload)
   - **Mitigation**: Add startup validation that checks Payload is reachable; add clear error message

2. **Course Title Changed in Seed Data**: If someone renames the course in Payload CMS seed data, the script won't find it
   - **Likelihood**: Low (course name is stable)
   - **Impact**: Medium (script fails with clear error)
   - **Mitigation**: Document the expected course title; add `--course-title` CLI option for flexibility

3. **API Response Format Change**: If Payload CMS API changes its response format, the script breaks
   - **Likelihood**: Very Low (established API format)
   - **Impact**: Medium (requires code update)
   - **Mitigation**: Type-safe response parsing with error handling already in place

**Rollback Plan**:

If this fix causes issues in production (unlikely for a test utility):
1. Revert to the hardcoded course ID (previous commit)
2. Manually update the hardcoded ID with the current course ID from the database
3. No database migrations needed - this is purely a script change

**Monitoring** (if needed):

For a test utility script, no production monitoring is needed. Developers will see errors immediately when running the script.

## Performance Impact

**Expected Impact**: Minimal

The fix adds one additional API call to Payload CMS at script startup (fetching the course). This is negligible:
- Payload CMS API typically responds in 50-100ms
- The script already requires Payload to be running for lesson fetching
- Total script execution time remains dominated by the lesson progress updates to Supabase

**Performance Testing**:
- Measure script startup time before and after (should be <150ms difference)
- Verify database query performance is unaffected

## Security Considerations

**Security Impact**: None

- No new external API calls beyond what's already used
- No new database queries with elevated privileges
- No changes to authentication or authorization
- The course title is hardcoded (not user input), so no injection risks
- Error messages don't expose sensitive information

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reset database to get new course ID
pnpm supabase:web:reset

# Run the script - should fail with "No lessons found"
pnpm --filter testing-scripts update-test-user
```

**Expected Result**: Script fails with error "No lessons found for the course"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Unit tests for the updated script
pnpm --filter testing-scripts test

# Integration test - run script after reset
pnpm supabase:web:reset
pnpm --filter testing-scripts update-test-user

# Verify the data was updated correctly
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres -c \
  "SELECT completion_percentage FROM public.course_progress WHERE user_id = (SELECT id FROM public.accounts WHERE email = 'test1@slideheroes.com') LIMIT 1;"
```

**Expected Result**:
- Type check passes
- Linting and formatting pass
- Unit tests pass
- Script completes successfully
- Database query shows course_progress record with correct completion_percentage

### Regression Prevention

```bash
# Run full test suite to ensure nothing else broke
pnpm test

# Run all scripts to verify other utilities still work
pnpm --filter testing-scripts list
```

## Dependencies

### New Dependencies

**No new dependencies required** - Uses existing `fetch` API and Supabase client already imported

## Database Changes

**No database changes required** - Schema and migrations remain unchanged. This is purely a script-level fix.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None - this is a test utility script, not production code

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no changes to external interfaces

## Success Criteria

The fix is complete when:

- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Unit tests pass for the new function
- [ ] Script runs successfully after a fresh database reset
- [ ] Script outputs the dynamically-fetched course ID (not hardcoded)
- [ ] Lesson progress records are created correctly
- [ ] Course progress is updated with correct completion percentage
- [ ] All manual testing checklist items are verified
- [ ] Zero regressions in other test utilities

## Notes

**Architecture Decision**: This fix prioritizes simplicity and maintainability over robustness. The script now has a hard dependency on Payload CMS being available, but this is acceptable because:
1. The script is a development utility, not production code
2. Payload CMS is already required to fetch lessons
3. Adding a fallback to Supabase would be complex due to schema exposure issues
4. Clear error messages guide developers when Payload is unavailable

**Future Enhancement**: Consider adding a `--course-title` CLI option to allow the script to work with different courses:
```bash
pnpm --filter testing-scripts update-test-user --course-title "Course Name"
```

This would make the script more flexible for future course additions without code changes.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1025*
