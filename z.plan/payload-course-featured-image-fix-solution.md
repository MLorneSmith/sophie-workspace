# Payload CMS Course Featured Image Fix Solution

## Problem Summary

The course lessons page was experiencing issues with displaying featured images from Cloudflare R2 storage. The issues included:

1. **400 Errors**: All image requests to the R2 bucket were returning 400 errors, resulting in an infinite stream of error messages in the console.
2. **Missing Images**: The featured images for course lessons were not displaying correctly.
3. **Poor User Experience**: The constant errors and missing images degraded the user experience.

## Root Causes

1. **Relationship Population Issue**:

   - The `getCourseLessons` function was using a depth parameter of 1, which should have been sufficient to populate the first level of relationships, but the component wasn't accessing the image URL correctly.

2. **Cloudflare R2 Configuration Issues**:
   - The R2 bucket may not be properly configured for public access.
   - The URLs being generated may not match the actual file locations in the R2 bucket.
   - The files may not exist at the expected locations.

## Implemented Solution

We've implemented a two-part solution:

### 1. Immediate Fix: Enhanced Image Handling

1. **Created Local Placeholder Images**:

   - Added a default placeholder image at `apps/web/public/images/course-lessons/default-lesson.svg`.
   - This provides a consistent fallback when R2 images fail to load.

2. **Implemented Topic-Based Placeholder Mapping**:

   - Created a mapping system that associates lesson topics with appropriate placeholder images.
   - This makes the placeholders more contextually relevant to the lesson content.

3. **Added Caching for Failed URLs**:

   - Implemented a caching mechanism to remember which image URLs have failed.
   - This prevents repeated attempts to load images that we know will fail, reducing console errors.

4. **Enhanced Error Handling**:

   - Updated the `onError` handler to use our placeholder system.
   - Added logging that only occurs once per failed image to reduce console spam.

5. **Updated API Depth Parameter**:
   - Changed the depth parameter in `getCourseLessons` from 1 to 2 to ensure nested relationships are properly populated.

### 2. Code Changes

1. **Updated `getCourseLessons` Function**:

   ```typescript
   export async function getCourseLessons(
     courseId: string,
     options = {},
     supabaseClient?: any,
   ) {
     return callPayloadAPI(
       `course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&depth=2&limit=100`,
       {},
       supabaseClient,
     );
   }
   ```

2. **Added Placeholder Mapping System**:

   ```typescript
   // Map of lesson keywords to placeholder images
   const LESSON_PLACEHOLDER_MAP: Record<string, string> = {
     why: '/images/course-lessons/default-lesson.svg',
     tools: '/images/course-lessons/default-lesson.svg',
     design: '/images/course-lessons/default-lesson.svg',
     // ... more mappings
   };

   // Default placeholder image path
   const DEFAULT_PLACEHOLDER = '/images/course-lessons/default-lesson.svg';

   /**
    * Get the best placeholder image based on lesson title or filename
    */
   function getPlaceholderImage(lesson: any): string {
     if (!lesson?.title) return DEFAULT_PLACEHOLDER;

     const title = lesson.title.toLowerCase();

     // Check if any keywords match the lesson title
     for (const [keyword, imagePath] of Object.entries(
       LESSON_PLACEHOLDER_MAP,
     )) {
       if (title.includes(keyword)) {
         return imagePath;
       }
     }

     // If no match found, return default
     return DEFAULT_PLACEHOLDER;
   }
   ```

3. **Implemented URL Caching**:

   ```typescript
   // Cache to remember failed image URLs to prevent repeated errors
   const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
     new Set(),
   );
   ```

4. **Enhanced Image Component**:

   ```typescript
   <Image
     src={(() => {
       // Get the R2 URL from the relationship
       const r2Url =
         lesson.featured_image_id?.url || // Direct URL property
         (lesson.featured_image_id &&
         typeof lesson.featured_image_id === 'object'
           ? lesson.featured_image_id.url // Nested URL in object
           : null);

       // If we have an R2 URL and it hasn't failed before, try it
       if (r2Url && !failedImageUrls.has(r2Url)) {
         return r2Url;
       }

       // Otherwise use our placeholder system
       return getPlaceholderImage(lesson);
     })()}
     alt={`Illustration for ${lesson.title}`}
     className="rounded-lg object-cover"
     fill
     sizes="(max-width: 640px) 100vw, 275px"
     priority={true}
     onError={(e) => {
       // Get the original source that failed
       const target = e.target as HTMLImageElement;
       const originalSrc = target.src;

       // Add to failed cache to prevent future attempts
       setFailedImageUrls((prev) => {
         const updated = new Set(prev);
         updated.add(originalSrc);
         return updated;
       });

       // Set placeholder based on lesson title
       target.src = getPlaceholderImage(lesson);

       // Log only once per lesson to reduce console spam
       if (!failedImageUrls.has(originalSrc)) {
         console.log(
           `Image load error for lesson: ${lesson.title}, using placeholder instead`,
         );
       }
     }}
   />
   ```

## Long-term Solution: R2 Configuration

To properly fix the R2 image issues, the following steps should be taken:

### 1. Verify R2 Bucket Public Access

The R2 bucket needs to be configured for public access. According to the Cloudflare R2 documentation, there are two ways to expose a bucket publicly:

1. **Custom Domain**: Expose the bucket as a custom domain under your control.
2. **Cloudflare-managed Subdomain**: Expose the bucket as a Cloudflare-managed subdomain under `https://r2.dev`.

To enable public access:

1. Go to the Cloudflare dashboard > R2 > Select your bucket
2. Go to Settings > Public Access
3. Enable either R2.dev subdomain or Custom Domain access

### 2. Check URL Format

The current URL format in the error logs is:

```
https://media.d33fc17df32ce7d9d48eb8045f1d340a.r2.cloudflarestorage.com/media/lesson_zero.png
```

But the URL format in the Payload configuration is:

```
https://${process.env.R2_BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/media/${filename}
```

This suggests that:

- `R2_BUCKET` is set to `media`
- `R2_ACCOUNT_ID` is set to `d33fc17df32ce7d9d48eb8045f1d340a`

Verify that this is correct and that the files are actually stored at this location in the R2 bucket.

### 3. Check File Existence

Use the Cloudflare dashboard to verify that the files exist at the expected locations in the R2 bucket. For example, check if `media/lesson_zero.png` exists in the bucket.

### 4. CORS Configuration

Ensure that the R2 bucket has the correct CORS configuration to allow requests from your application domains. This can be configured in the Cloudflare dashboard under R2 > Your Bucket > Settings > CORS.

### 5. Check R2 Bucket Permissions

Ensure that the R2 bucket has the correct permissions to allow public access to the files. This can be configured in the Cloudflare dashboard under R2 > Your Bucket > Settings > Permissions.

## Benefits of the Solution

1. **Improved User Experience**: Users now see placeholder images instead of broken images.
2. **Reduced Console Errors**: The caching mechanism prevents repeated error messages in the console.
3. **Contextual Placeholders**: The placeholder mapping system provides more relevant placeholders based on lesson topics.
4. **Graceful Degradation**: The application now gracefully handles R2 image failures.

## Next Steps

1. **Configure R2 Bucket**: Follow the steps in the long-term solution to properly configure the R2 bucket.
2. **Create Custom Placeholders**: Consider creating custom placeholder images for different lesson topics to improve the user experience further.
3. **Monitor Error Rates**: Keep an eye on the error rates to ensure that the R2 configuration is working correctly.
