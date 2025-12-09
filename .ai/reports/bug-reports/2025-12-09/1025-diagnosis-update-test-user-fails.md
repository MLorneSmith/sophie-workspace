# Bug Diagnosis: update-test-user script fails with "No lessons found for the course"

**ID**: ISSUE-pending
**Created**: 2025-12-09T18:47:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The `pnpm --filter testing-scripts update-test-user` script fails because it uses a hardcoded course ID that doesn't match the actual course ID in the database after database resets/reseeding. Additionally, the Supabase fallback query uses incorrect column names.

## Environment

- **Application Version**: dev branch (commit 164571f3d)
- **Environment**: development
- **Node Version**: Current project version
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - likely worked before a database reset

## Reproduction Steps

1. Reset or reseed the local Supabase database
2. Run `pnpm --filter testing-scripts update-test-user`
3. Observe the error: "No lessons found for the course"

## Expected Behavior

The script should fetch lessons for the "Decks for Decision Makers" course and mark lessons 6-28 as complete for the test user.

## Actual Behavior

The script fails with two possible error paths:
1. If Payload CMS is not running: Connection refused, falls back to Supabase
2. Supabase fallback fails with: "Could not find the table 'public.course_lessons' in the schema cache"
3. If Payload CMS is running but wrong course ID: Returns 0 lessons, fails with "No lessons found for the course"

## Diagnostic Data

### Console Output
```
[UPDATE_TEST_USER_PROGRESS-INFO] Fetching lessons from Payload CMS for course ID: e64f4913-a5b0-42b2-958c-f0c39a254e39...
[UPDATE_TEST_USER_PROGRESS-INFO] Successfully fetched 0 lessons from Payload CMS
[UPDATE_TEST_USER_PROGRESS-ERROR] Error: operation=main error=No lessons found for the course
```

### Database Analysis

**Hardcoded Course ID in Script:**
```
e64f4913-a5b0-42b2-958c-f0c39a254e39
```

**Actual Course ID in Database:**
```sql
SELECT id, title FROM payload.courses;
-- Result:
-- aa17d72a-32d1-4113-b90a-188e9981bd81 | Decks for Decision Makers
```

**Column Name Mismatch:**
- Script queries: `course_id`
- Actual column: `course_id_id` (Payload CMS naming convention for relationships)

### Verification Query
```sql
SELECT id, lesson_number, title, course_id_id
FROM payload.course_lessons
WHERE course_id_id = 'aa17d72a-32d1-4113-b90a-188e9981bd81'
ORDER BY lesson_number LIMIT 5;
-- Returns 10+ lessons correctly
```

## Error Stack Traces

```
[UPDATE_TEST_USER_PROGRESS-ERROR] Error fetching lessons from Payload CMS:
  operation=fetch_lessons_payload
  error=request to http://localhost:3020/api/course-lessons?where[course_id][equals]=e64f4913-a5b0-42b2-958c-f0c39a254e39... failed,
  reason: connect ECONNREFUSED 127.0.0.1:3020

[UPDATE_TEST_USER_PROGRESS-ERROR] Fallback fetch also failed:
  operation=fetch_lessons_fallback
  error={"code":"PGRST205","details":null,"hint":"Perhaps you meant the table 'public.course_progress'","message":"Could not find the table 'public.course_lessons' in the schema cache"}
```

## Related Code

- **Affected Files**:
  - `scripts/testing/update-test-user-progress.ts:163` - Hardcoded COURSE_ID
  - `scripts/testing/update-test-user-progress.ts:216-229` - Fallback query with wrong column/table names

- **Recent Changes**:
  - `903766fa3` fix(tooling): use lesson_number instead of array index in progress script
  - `4c889c1e2` fix(tooling): update test progress script for current Payload CMS structure

- **Suspected Functions**:
  - `fetchLessonsFromPayload()` - Uses hardcoded course ID and wrong column names in fallback

## Related Issues & Context

### Historical Context

This issue likely occurs after every database reset because Payload CMS generates new UUIDs for courses. The hardcoded course ID becomes stale.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The script uses a hardcoded course ID that doesn't match the dynamically-generated UUID in the database, and the Supabase fallback query uses incorrect column/table names.

**Detailed Explanation**:

1. **Primary Cause - Stale Course ID**: At line 163 of `update-test-user-progress.ts`, the COURSE_ID is hardcoded as `e64f4913-a5b0-42b2-958c-f0c39a254e39`. However, Payload CMS generates new UUIDs when courses are seeded, so the actual course ID is now `aa17d72a-32d1-4113-b90a-188e9981bd81`.

2. **Secondary Cause - Wrong Column Name**: The Supabase fallback query at lines 216-229 uses `.eq("course_id", courseId)` but Payload CMS names relationship columns with an `_id` suffix, so the actual column is `course_id_id`.

3. **Tertiary Cause - Wrong Schema Access**: The fallback tries `payload.course_lessons` then `course_lessons`, but PostgREST doesn't expose the `payload` schema by default, so both queries fail.

**Supporting Evidence**:
- Database query confirms course ID mismatch: `aa17d72a-32d1-4113-b90a-188e9981bd81` vs `e64f4913-a5b0-42b2-958c-f0c39a254e39`
- Table schema shows column is `course_id_id` not `course_id`
- Error message confirms table not found in schema cache (PostgREST doesn't expose payload schema)

### How This Causes the Observed Behavior

1. Script starts with hardcoded wrong course ID
2. Payload CMS API query finds 0 lessons (wrong course ID)
3. OR if Payload not running, fallback Supabase query fails (wrong schema/column)
4. Script throws "No lessons found for the course"

### Confidence Level

**Confidence**: High

**Reasoning**: Direct database queries confirm both the course ID mismatch and the column naming convention. The fix path is clear.

## Fix Approach (High-Level)

The script should dynamically fetch the course ID by title instead of using a hardcoded UUID. Replace line 163 with a lookup query like:

```typescript
const { data: course } = await supabase
  .from('payload.courses')
  .select('id')
  .eq('title', 'Decks for Decision Makers')
  .single();
const COURSE_ID = course.id;
```

Additionally, the Supabase fallback query needs to:
1. Use the correct column name `course_id_id`
2. Properly access the `payload` schema (or query directly via psql if PostgREST doesn't expose it)

## Diagnosis Determination

The root cause has been definitively identified: hardcoded course UUID doesn't match the dynamically-generated UUID after database resets, and fallback queries use incorrect column names. This is a data synchronization issue between the script's assumptions and the actual database state.

## Additional Context

- The script was recently updated in commits `903766fa3` and `4c889c1e2` but these fixes addressed lesson numbering, not the course ID issue
- Payload CMS uses a `_id` suffix convention for relationship columns (e.g., `course_id` relationship becomes `course_id_id` column)
- The `payload` schema is not exposed via PostgREST API by default, which is why the Supabase fallback fails

---
*Generated by Claude Debug Assistant*
*Tools Used: psql, Bash, Read*
