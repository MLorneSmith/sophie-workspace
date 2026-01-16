# Bug Diagnosis: Post-completion lesson thumbnails not displaying on course dashboard

**ID**: ISSUE-1072
**Created**: 2025-12-10T20:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The lessons "Congratulations" (lesson_number 30) and "Before you go..." (lesson_number 31) do not display their thumbnail images on the course dashboard after course completion. Instead, a gray placeholder box with "No image required" text is shown. The images exist in the Payload CMS media library (Congratulations.png and Before_you_go.png) and are hosted on Cloudflare R2 like all other media.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development
- **Browser**: All browsers (code-level issue)
- **Node Version**: N/A (frontend rendering issue)
- **Database**: PostgreSQL (Payload CMS)
- **Last Working**: Never worked - code was written this way

## Reproduction Steps

1. Complete all 23 required lessons in the course
2. Navigate to the course dashboard (`/home/course`)
3. Observe that the "Congratulations" and "Before you go..." lessons are now visible
4. Note that these two lessons show a gray placeholder box with "No image required" instead of their thumbnail images
5. Compare with other lesson cards which display their thumbnail images correctly

## Expected Behavior

The "Congratulations" and "Before you go..." lesson cards should display their thumbnail images (Congratulations.png and Before_you_go.png) just like all other lesson cards on the course dashboard.

## Actual Behavior

These two lesson cards display a gray placeholder box with the text "No image required" instead of their thumbnail images, even though the images exist in the media library and are properly hosted on Cloudflare R2.

## Diagnostic Data

### Code Analysis

The issue is in the `CourseDashboardClient.tsx` component at lines 279-313:

```tsx
{/* Don't display images for post-completion lessons */}
{!["congratulations", "before-you-go"].includes(
  lesson.slug || "",
) ? (
  <Image
    src={(() => {
      if (lesson.thumbnail?.url) {
        return (
          _transformImageUrl(lesson.thumbnail.url) ||
          getPlaceholderImage(lesson)
        );
      }
      return getPlaceholderImage(lesson);
    })()}
    alt={`Illustration for ${lesson.title}`}
    // ... other props
  />
) : (
  <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
    <span className="text-muted-foreground text-sm">
      No image required
    </span>
  </div>
)}
```

### Git History

This exclusion was added in commit `b87e22659` ("R2 images no work in Lessons") on April 4, 2025. The commit message suggests this was a workaround when R2 images weren't working properly. The workaround was never removed after the R2 image issues were resolved.

## Error Stack Traces

N/A - No runtime errors. This is intentional (but incorrect) code behavior.

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` (lines 279-313)
- **Recent Changes**: Commit `b87e22659` added the exclusion as a workaround
- **Suspected Functions**: The conditional rendering logic at line 280-282

## Related Issues & Context

### Historical Context

This appears to be leftover code from a workaround that was never cleaned up. The original commit `b87e22659` was titled "R2 images no work in Lessons" suggesting the exclusion was added when R2 storage wasn't functioning properly for these specific images.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The code explicitly excludes lessons with slugs "congratulations" and "before-you-go" from displaying thumbnail images, showing a placeholder instead.

**Detailed Explanation**:
In `CourseDashboardClient.tsx` at lines 280-282, there is a conditional check that specifically excludes the post-completion lessons from the normal image rendering path:

```tsx
{!["congratulations", "before-you-go"].includes(lesson.slug || "") ? (
  <Image ... />  // Normal lessons get images
) : (
  <div>No image required</div>  // Post-completion lessons explicitly excluded
)}
```

This was added as a workaround in commit `b87e22659` when R2 images weren't working. The workaround hardcodes an assumption that these lessons don't need images, but this is incorrect - they have images in the media library that should be displayed.

**Supporting Evidence**:
- Code at `CourseDashboardClient.tsx:280-313` explicitly checks for these slugs
- Comment on line 279 says "Don't display images for post-completion lessons"
- Git history shows this was added in a commit about R2 image problems
- The images (Congratulations.png, Before_you_go.png) exist in the media library

### How This Causes the Observed Behavior

1. User completes all required lessons
2. Course dashboard shows all lessons including post-completion ones
3. For each lesson, the code checks if the slug is "congratulations" or "before-you-go"
4. For these two lessons, the code returns the "No image required" placeholder div instead of the `<Image>` component
5. The thumbnail images are never fetched or displayed for these specific lessons

### Confidence Level

**Confidence**: High

**Reasoning**: The code explicitly checks for these exact slugs and deliberately renders a placeholder instead of an image. This is not a data issue, API issue, or media storage issue - it's hardcoded conditional logic that bypasses the normal image rendering for these specific lessons.

## Fix Approach (High-Level)

Remove the conditional exclusion for post-completion lessons. The fix involves:

1. Delete lines 280-282 (the slug check) and lines 307-312 (the placeholder div)
2. Let all lessons use the same image rendering logic, which already handles missing thumbnails gracefully via the `getPlaceholderImage()` fallback

The image rendering logic already has proper fallback handling - if a lesson doesn't have a thumbnail, it falls back to a placeholder image based on the lesson title keywords.

## Diagnosis Determination

The root cause is definitively identified: explicit code in `CourseDashboardClient.tsx` that was added as a workaround for R2 image issues but was never removed. The fix is straightforward - remove the conditional exclusion and let the normal image rendering logic handle these lessons like all others.

## Additional Context

- The `_transformImageUrl()` function properly handles R2 URLs and transforms them to the custom domain (images.slideheroes.com)
- The `getPlaceholderImage()` function provides fallback images if thumbnails are missing
- Both these functions would work correctly for the post-completion lessons if the exclusion were removed

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log, git show), Task (Explore agent)*
