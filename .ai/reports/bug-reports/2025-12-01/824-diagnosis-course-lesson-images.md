# Bug Diagnosis: Course Dashboard Lesson Images Not Displaying

**ID**: ISSUE-824
**Created**: 2025-12-01T19:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The course dashboard at `/home/course` is not displaying lesson images. Each lesson card shows only text content (title, description, duration) but the image area on the left side of each card is empty. This occurred after the database schema was evolved.

## Environment

- **Application Version**: dev branch (commit 613dfe9d4)
- **Environment**: development (Docker test containers)
- **Browser**: All browsers
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Before schema migration from `featured_image_id` to `thumbnail_id`

## Reproduction Steps

1. Start the application in Docker test environment (`docker compose -f docker-compose.test.yml up`)
2. Sign in with test credentials (test1@slideheroes.com)
3. Navigate to `/home/course`
4. Observe that lesson cards display without images

## Expected Behavior

Each lesson card should display a thumbnail image on the left side showing the lesson's featured image (e.g., `https://media.slideheroes.com/10-visual_perception.png`).

## Actual Behavior

Lesson cards display without any images. The image area appears empty/blank.

## Diagnostic Data

### Console Output
```
No image-related errors in console. API calls succeed.
[PAYLOAD-API-DEBUG] Calling Payload API at: http://slideheroes-payload-test:3021/api/courses?where[status][equals]=published&depth=1
```

### Network Analysis
```
API calls to Payload CMS succeed (200 OK)
Course lessons data includes valid thumbnail URLs:
- https://media.slideheroes.com/10-visual_perception.png
- https://media.slideheroes.com/7-using_stories.png
```

### Database Analysis
```sql
-- Schema change: featured_image_id -> thumbnail_id
-- Old: featured_image_id uuid REFERENCES payload.media(id)
-- New: thumbnail_id uuid REFERENCES payload.media(id)

-- Payload API returns expanded thumbnail object with depth=1:
{
  "thumbnail": {
    "id": "1231b266-9b4d-408b-af31-1b4981be7cad",
    "url": "https://media.slideheroes.com/10-visual_perception.png",
    ...
  }
}
```

### Screenshots
- `/tmp/course-dashboard-final.png` - Shows lesson cards without images

## Error Stack Traces
```
No errors - the code silently falls back to placeholder images
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` (lines 302-323)
  - `apps/web/public/images/course-lessons/default-lesson.svg` (empty file - 0 bytes)

- **Recent Changes**: Schema migration from `featured_image_id` to `thumbnail_id`

- **Suspected Functions**:
  - `getPlaceholderImage()` - Always returns placeholder path
  - Image rendering logic at line 307-323

## Related Issues & Context

### Historical Context
The database schema evolved from `featured_image_id` (uuid) to `thumbnail_id` (uuid). The code was updated to use placeholders instead of being updated to use the new `thumbnail` field from the Payload API response.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The code in `CourseDashboardClient.tsx` ignores the `thumbnail` field from the Payload API and always uses placeholder images, which are empty (0 bytes).

**Detailed Explanation**:

1. **Schema Evolution**: The database schema changed from `featured_image_id` to `thumbnail_id`. The Payload API now returns a `thumbnail` object with the image URL when using `depth=1`.

2. **Code Not Updated**: The `CourseDashboardClient.tsx` code at line 309 has a hardcoded comment:
   ```typescript
   // Since featured_image_id doesn't exist, use placeholder
   return getPlaceholderImage(lesson);
   ```
   This code always returns a placeholder path instead of using `lesson.thumbnail?.url`.

3. **Placeholder File Empty**: The fallback placeholder file at `apps/web/public/images/course-lessons/default-lesson.svg` is 0 bytes (empty), so even the fallback doesn't render.

**Supporting Evidence**:
- Payload API returns valid thumbnail data: `lesson.thumbnail.url = "https://media.slideheroes.com/10-visual_perception.png"`
- Code at `CourseDashboardClient.tsx:309` explicitly ignores this and returns placeholder
- File check: `ls -la` shows `default-lesson.svg` is 0 bytes

### How This Causes the Observed Behavior

1. User navigates to `/home/course`
2. API fetches lessons with valid `thumbnail` objects containing URLs
3. Code ignores `lesson.thumbnail` and calls `getPlaceholderImage(lesson)`
4. `getPlaceholderImage()` returns `/images/course-lessons/default-lesson.svg`
5. Next.js Image component tries to load this SVG file
6. File is empty (0 bytes), so nothing renders
7. User sees lesson cards without images

### Confidence Level

**Confidence**: High

**Reasoning**:
- Payload API response confirmed to include valid thumbnail URLs
- Code explicitly ignores thumbnail data with comment explaining why
- Placeholder file confirmed to be empty (0 bytes)
- Clear causal chain from root cause to symptom

## Fix Approach (High-Level)

1. Update `CourseDashboardClient.tsx` to use `lesson.thumbnail?.url` instead of `getPlaceholderImage(lesson)`
2. Keep `getPlaceholderImage()` as fallback when `thumbnail` is null/undefined
3. Ensure placeholder SVG file has valid content (or create proper placeholder image)

Example fix:
```typescript
src={lesson.thumbnail?.url || getPlaceholderImage(lesson)}
```

## Diagnosis Determination

The root cause is definitively identified as a code-data mismatch after schema evolution:
- Data exists in the correct format (`thumbnail.url`)
- Code ignores this data and uses broken placeholder
- Fix requires updating the image source logic

## Additional Context

### Secondary Issue Found During Diagnosis
The Docker test environment was missing `PAYLOAD_PUBLIC_SERVER_URL` environment variable in `docker-compose.test.yml`, causing the web app container to fail to reach Payload CMS. This was fixed by adding:
```yaml
- PAYLOAD_PUBLIC_SERVER_URL=http://slideheroes-payload-test:3021
```

### TypeScript Type Consideration
The TypeScript type `Database["payload"]["Tables"]["course_lessons"]["Row"]` only includes `thumbnail_id: string | null` (the foreign key ID), not the expanded `thumbnail` object. The Payload API returns the expanded object when using `depth > 0`. The code may need to use a different type or extend the existing type to properly type the `thumbnail` property.

---
*Generated by Claude Debug Assistant*
*Tools Used: Playwright (frontend-debugging skill), Docker inspect, curl, Grep, Read*
