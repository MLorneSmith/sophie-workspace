# Payload CMS Course System Implementation Plan

## Issues Addressed

1. **Featured Image Not Displaying**

   - Root cause: The `getCourseLessons` function was using a depth parameter of 0, which meant it wasn't populating the related documents (like media).
   - The component was trying to access `lesson.featuredImage?.url` but the field in the database is named `featured_image_id`.

2. **"High-Stakes Presentation Skills Self-Assessment" Lesson Removal**

   - Successfully removed the lesson from the raw data files.
   - Regenerated the SQL seed files without this lesson.
   - Reset and migrated the database to apply the changes.

3. **Next.js Image Configuration**
   - Added Cloudflare R2 domain to the Next.js config to allow images from this domain.

## Implementation Steps Completed

1. **Fixed the Featured Image Issue**

   - Updated the `getCourseLessons` function in `packages/cms/payload/src/api/course.ts` to use a depth parameter of 1 to populate the related documents.
   - Updated the `CourseDashboardClient` component to correctly access the featured image URL from `lesson.featured_image_id?.url` instead of `lesson.featuredImage?.url`.

2. **Removed the Unwanted Lesson**

   - Deleted the `skills-self-assessment.mdoc` file from the raw data directory.
   - Ran the content migration process to regenerate SQL seed files without this lesson.
   - Reset and migrated the database to apply the changes.

3. **Updated Next.js Configuration**
   - Added the Cloudflare R2 domain to the `remotePatterns` in the Next.js config to allow images from this domain.

## Current Status

1. **Featured Image Issue**

   - The API is now correctly fetching the course lessons with depth=1, which means the relationships are being populated.
   - The component is correctly accessing the featured image URL from `lesson.featured_image_id?.url`.

2. **Lesson Removal**

   - The "High-Stakes Presentation Skills Self-Assessment" lesson has been successfully removed from the database.
   - The course completion logic still works correctly after removing the lesson.

3. **Image Access**
   - Next.js is now configured to allow images from the Cloudflare R2 domain.
   - However, the images are still returning 400 errors from the Cloudflare R2 storage.

## Remaining Issues

1. **Image Access**
   - The images are returning 400 errors from the Cloudflare R2 storage.
   - This suggests that while we've correctly configured Next.js to allow the Cloudflare R2 domain, the actual image URLs might be incorrect or the images might not be accessible.
   - Further investigation is needed to determine why the images are not accessible.

## Next Steps

1. **Investigate Image Access Issues**

   - Check if the Cloudflare R2 bucket is properly configured and accessible.
   - Verify that the image URLs in the database are correct.
   - Consider using placeholder images until the R2 storage issues are resolved.

2. **Update Documentation**

   - Document the changes made to the Payload CMS integration.
   - Update the content migration system documentation to reflect the changes.

3. **Testing**
   - Test the course completion logic to ensure it works correctly after removing the lesson.
   - Test the image display once the R2 storage issues are resolved.
