# Bug Diagnosis: Course Dashboard 406 Error and Unconfigured Image Hostname

**ID**: ISSUE-pending
**Created**: 2025-12-01T19:48:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The `/home/course` dashboard is experiencing two distinct issues: (1) a 406 HTTP error from Supabase when querying `course_progress` for users without existing progress records, and (2) a Next.js Image configuration error for the `media.slideheroes.com` hostname which prevents lesson thumbnail images from loading.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Browser**: N/A (server-side errors)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown

## Reproduction Steps

1. Start the development server with `pnpm dev`
2. Log in as any user
3. Navigate to `/home/course`
4. Observe the server logs for 406 error on `course_progress` API
5. Observe the console error for `media.slideheroes.com` hostname

## Expected Behavior

1. The course dashboard should load gracefully even when no `course_progress` record exists for the user
2. Lesson thumbnail images from `media.slideheroes.com` should display properly

## Actual Behavior

1. A 406 "Not Acceptable" error is returned by Supabase REST API when no course_progress record exists
2. Console error: `Invalid src prop (https://media.slideheroes.com/lesson_zero.png) on next/image, hostname "media.slideheroes.com" is not configured`

## Diagnostic Data

### Console Output

```
GET http://127.0.0.1:54521/rest/v1/course_progress?select=*&user_id=eq.31a03e74-1639-45b6-bfa7-77447f1a4762&course_id=eq.914cf082-5eec-4835-8c08-77fbe3be9e4a 406 in 4ms

Invalid src prop (https://media.slideheroes.com/lesson_zero.png) on `next/image`, hostname "media.slideheroes.com" is not configured under images in your `next.config.js`
```

### Network Analysis

```
GET /rest/v1/course_progress 406 - PGRST116 "Cannot coerce the result to a single JSON object"
- The API was called with Accept: application/vnd.pgrst.object+json header (via .single())
- The query returned 0 rows, causing PostgREST to return 406 since it cannot create a single object from empty result
```

### Database Analysis

```sql
-- Table exists and has correct schema
\dt public.course_progress
              List of relations
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | course_progress | table | postgres

-- Schema verified (9 columns matching migration)
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'course_progress' AND table_schema = 'public';
```

## Error Stack Traces

```
Issue 1 - Supabase PostgREST Error:
{"code":"PGRST116","details":"The result contains 0 rows","hint":null,"message":"Cannot coerce the result to a single JSON object"}

Issue 2 - Next.js Image Error:
Error: Invalid src prop (https://media.slideheroes.com/lesson_zero.png) on `next/image`,
hostname "media.slideheroes.com" is not configured under images in your `next.config.js`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/page.tsx:71-76` - Uses `.single()` on course_progress query
  - `apps/web/next.config.mjs:97-133` - Image configuration missing media.slideheroes.com
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx:311-334` - Renders lesson thumbnail images
  - `apps/payload/src/seed/seed-data/media.json` - Contains media.slideheroes.com URLs
- **Recent Changes**: Database schema evolution mentioned by user
- **Suspected Functions**:
  - `CoursePage()` in page.tsx - line 71-76
  - `getImagesConfig()` in next.config.mjs - line 97-133

## Related Issues & Context

### Similar Symptoms

Searched for related issues but no direct predecessors found for these specific errors.

### Historical Context

The media.slideheroes.com hostname appears to be a production CDN domain that is seeded in the Payload CMS media records. This domain was never added to the Next.js image configuration.

## Root Cause Analysis

### Issue 1: 406 Error on course_progress

**Root Cause Identified**: The code uses `.single()` Supabase method which sets `Accept: application/vnd.pgrst.object+json` header. PostgREST returns HTTP 406 when no rows match the query because it cannot create a single JSON object from an empty result set.

**Location**: `apps/web/app/home/(user)/course/page.tsx:71-76`

```typescript
const { data: courseProgress } = await supabase
  .from("course_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("course_id", decksForDecisionMakersCourse.id)
  .single();  // <-- This causes 406 when no row exists
```

**Why this happens**: When a user first visits the course dashboard before any progress is tracked, no `course_progress` row exists. The `.single()` method expects exactly one row and fails with 406 when it gets zero rows.

**Evidence**: Direct API test confirmed:
```bash
curl "http://127.0.0.1:54521/rest/v1/course_progress?..." -H "Accept: application/vnd.pgrst.object+json"
# Returns: {"code":"PGRST116","details":"The result contains 0 rows",...}
# HTTP Status: 406
```

### Issue 2: Unconfigured Image Hostname

**Root Cause Identified**: The `media.slideheroes.com` hostname is not configured in Next.js `images.remotePatterns` configuration. The seed data in `apps/payload/src/seed/seed-data/media.json` contains URLs pointing to this CDN, but the Next.js config only allows Supabase URL, localhost, and 127.0.0.1.

**Location**: `apps/web/next.config.mjs:97-133`

The `getImagesConfig()` function only adds:
- Supabase hostname (from `NEXT_PUBLIC_SUPABASE_URL`)
- localhost and 127.0.0.1 (in development)

It does NOT add `media.slideheroes.com` which is used by lesson thumbnail URLs.

**Evidence**: Reading next.config.mjs shows no configuration for media.slideheroes.com:
```javascript
function getImagesConfig() {
  const remotePatterns = [];

  if (SUPABASE_URL) {
    // Only adds Supabase hostname
  }

  if (!IS_PRODUCTION) {
    // Only adds localhost and 127.0.0.1
  }
  // media.slideheroes.com is NEVER added
}
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The 406 error was reproduced and confirmed via direct API call with the exact query parameters from the logs
2. The Next.js image error message explicitly states the missing hostname configuration
3. Both root causes point to specific, identifiable code locations

## Fix Approach (High-Level)

**Issue 1 Fix**: Replace `.single()` with `.maybeSingle()` which returns `null` instead of throwing an error when no rows exist. This is the Supabase-recommended approach for "get one or none" queries.

**Issue 2 Fix**: Add `media.slideheroes.com` to the `remotePatterns` array in `getImagesConfig()` function in `apps/web/next.config.mjs`.

## Diagnosis Determination

Both issues have been conclusively diagnosed with specific root causes and fix locations identified:

1. **406 Error**: The use of `.single()` method on a query that may return zero rows causes PostgREST to return HTTP 406. Solution: Use `.maybeSingle()` instead.

2. **Image Hostname Error**: Missing CDN hostname in Next.js image configuration. Solution: Add `media.slideheroes.com` to allowed remote patterns.

Both fixes are straightforward and low-risk.

## Additional Context

- The `lesson_progress` and `quiz_attempts` queries on the same page do NOT use `.single()` and therefore don't have this issue
- The `_transformImageUrl()` function in CourseDashboardClient.tsx tries to handle R2 storage URLs but doesn't handle media.slideheroes.com
- There's an `images.slideheroes.com` domain referenced in the transform function which may also need to be added to the config

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (psql, curl), Grep, Read, Glob*
