# Downloads Collection Comprehensive Fix Implementation Plan

## 1. Current Issues Analysis

### 1.1 Frontend Display Issues

1. **Default Downloads Showing on All Lessons**

   - Certain lessons (101, 104, 402) are displaying downloads when they shouldn't
   - The "SlideHeroes Presentation Template" is showing on many lessons incorrectly
   - Lessons that don't have downloads show "placeholder.pdf"

2. **Quiz-Related Errors**
   - Server logs show errors: `relation "payload.course_quizzes_downloads" does not exist`
   - Error from Payload API: `Failed to call Payload API (course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0): 404 Not Found`

### 1.2 Payload Admin Issues

1. **Placeholder Files Instead of R2 Links**
   - Downloads in the downloads collection appear to be placeholder files
   - Files aren't properly linking to R2-hosted content

## 2. Root Causes Identified

### 2.1 Frontend Issues Root Causes

1. **Fallback Logic Applying Downloads Universally**

   - The `getDownloadsViaPredefinedMappings` function returns default downloads as a fallback for all lessons
   - This causes "SlideHeroes Presentation Template" to appear on unintended lessons

2. **Placeholder Files Used When Real Files Not Found**

   - When download IDs are found but actual files can't be located, the system creates placeholders
   - This occurs in `findDownloadsForCollection` which returns placeholder objects instead of nothing

3. **Missing Specific Lesson Mappings**

   - The affected lessons don't have explicit entries in `LESSON_DOWNLOADS_MAPPING`

4. **Quiz Download Handling Issues**
   - The system tries to fetch downloads for quizzes even though that functionality isn't needed
   - Error handling for non-existent tables is incomplete

### 2.2 Payload Admin Root Causes

1. **Improper R2 Integration**

   - The afterRead hook doesn't properly transform or generate valid R2 URLs
   - R2 adapter configuration may not include the correct base path

2. **Missing URL Generation Logic**
   - The collection doesn't properly generate URLs for download files
   - Fallback URL generation is incomplete

## 3. Implementation Strategy

Our solution will address both the frontend display issues and the Payload admin problems with R2 integration:

### 3.1 Fix Frontend Display Issues

1. Update fallback logic to not apply downloads universally
2. Improve download component conditional rendering
3. Fix quiz-related error handling comprehensively

### 3.2 Fix Payload Admin R2 Integration

1. Enhance afterRead hook to properly generate R2 URLs
2. Update R2 storage adapter configuration
3. Create database migration to fix existing download records

## 4. Detailed Implementation Steps

### 4.1 Update Relationship Helper Logic

1. **Modify `getDownloadsViaPredefinedMappings` function**

   ```typescript
   // Current problematic code:
   const defaultDownloadIds: string[] = []
   const slideTemplatesId = getDownloadIdByKey('slide-templates')
   if (slideTemplatesId) {
     defaultDownloadIds.push(slideTemplatesId)
   }
   const swipeFileId = getDownloadIdByKey('swipe-file')
   if (swipeFileId) {
     defaultDownloadIds.push(swipeFileId)
   }
   return defaultDownloadIds

   // New implementation:
   // Only return empty array if no explicit mapping exists
   // Skip the default fallback logic entirely
   return [] // Return empty array instead of default downloads
   ```

2. **Fix `findDownloadsForCollection` function**

   ```typescript
   export async function findDownloadsForCollection(
     payload: Payload,
     collectionId: string,
     collectionType: string,
   ): Promise<any[]> {
     try {
       // Get download IDs using our simplified approach
       const downloadIds = await getDownloadsForCollection(
         payload,
         collectionId,
         collectionType,
       );

       if (!downloadIds.length) {
         return []; // Return empty array if no download IDs
       }

       // Try to get the actual download documents from the database
       try {
         const idList = downloadIds
           .map((id) => `'${id.replace(/'/g, "''")}'`)
           .join(',');
         const query = `
           SELECT id, filename, filesize, "mimeType", url, title, description
           FROM payload.downloads
           WHERE id IN (${idList})
         `;

         const result = await payload.db.drizzle.execute(sql.raw(query));

         if (result?.rows?.length > 0) {
           return result.rows;
         }
       } catch (dbError) {
         console.error('Error fetching actual download documents:', dbError);
       }

       // Only use empty array if DB query fails - no more placeholders
       return [];
     } catch (error) {
       console.error(`Error in findDownloadsForCollection:`, error);
       return []; // Return empty array instead of throwing
     }
   }
   ```

3. **Improve Quiz Error Handling**
   ```typescript
   // Add early exit for quizzes in all download helper functions
   export async function getDownloadsForCollection(
     payload: Payload,
     collectionId: string,
     collectionType: string,
   ): Promise<string[]> {
     // Skip processing entirely for quizzes
     if (collectionType === 'course_quizzes') {
       return [];
     }

     // Rest of the function remains unchanged
   }
   ```

### 4.2 Fix Lesson Component Rendering

**Update conditional logic in LessonViewClient.tsx**

```typescript
{/* Render Downloads with better conditional rendering */}
{(() => {
  // Only proceed if downloads exist and are in the expected format
  if (
    lesson.downloads &&
    Array.isArray(lesson.downloads) &&
    lesson.downloads.length > 0 &&
    lesson.downloads.some(download => download.url && download.url !== '')
  ) {
    return (
      <div className="my-6">
        <div className="space-y-2">
          {/* Only render downloads that have a valid URL */}
          {lesson.downloads
            .filter(download => download.url && download.url !== '')
            .map((download: any, index: number) => {
              // Download rendering code...
            })}
        </div>
      </div>
    );
  }
  return null;
})()}
```

### 4.3 Fix Payload Admin R2 Integration

1. **Update the Downloads Collection afterRead hook**

   ```typescript
   hooks: {
     afterRead: [
       async ({ doc }) => {
         // Basic file type detection
         const isZipFile = doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip'
         const isPdfFile = doc.filename?.endsWith('.pdf') || doc.mimeType === 'application/pdf'

         // Check if file exists and is not a placeholder
         const isPlaceholder = doc.filename?.includes('.placeholder') || !doc.filename
         const fileExists = !isPlaceholder

         // Properly format the R2 URL if it exists but needs transformation
         if (fileExists && doc.filename && (!doc.url || doc.url.includes('placeholder'))) {
           // Format a proper R2 URL using the custom domain
           doc.url = `https://downloads.slideheroes.com/${encodeURIComponent(doc.filename)}`
         }

         // Handle special pre-existing downloads with hardcoded URLs
         if (doc.id === '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1' && !doc.url) {
           doc.url = 'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip'
         }

         if (doc.id === 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6' && !doc.url) {
           doc.url = 'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip'
         }

         // Add diagnostic information for debugging
         console.log(`Processing download ${doc.id}: ${doc.filename}, URL: ${doc.url}, Exists: ${fileExists}`)

         return {
           ...doc,
           _fileType: isZipFile ? 'zip' : isPdfFile ? 'pdf' : 'other',
           fileStatus: fileExists ? 'Available' : 'Missing',
           // Add a more descriptive field to help debugging
           _debug: {
             isPlaceholder,
             fileExists,
             originalUrl: doc.url,
           }
         }
       },
     ],
   }
   ```

2. **Fix R2 Storage Adapter Configuration**

   ```typescript
   // apps/payload/src/utils/r2-adapter.ts
   import { s3Adapter } from '@payloadcms/storage-s3';

   export const createR2Adapter = () => {
     return s3Adapter({
       config: {
         region: process.env.R2_REGION || 'auto',
         endpoint: process.env.R2_ENDPOINT,
         credentials: {
           accessKeyId: process.env.R2_ACCESS_KEY_ID,
           secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
         },
         forcePathStyle: true, // Required for R2 compatibility
       },
       bucket: process.env.R2_BUCKET,
       // Add a proper CDN domain
       basePath: 'https://downloads.slideheroes.com',
     });
   };
   ```

3. **Create Database Fix Script**

   ```typescript
   // packages/content-migrations/src/scripts/repair/fix-download-r2-urls.ts
   import { Client } from 'pg';

   import { DOWNLOAD_ID_MAP } from '../../data/mappings/download-mappings.js';

   export async function fixDownloadR2Urls(): Promise<void> {
     console.log('Fixing download R2 URLs...');

     const client = new Client({
       connectionString:
         process.env.DATABASE_URI ||
         'postgresql://postgres:postgres@localhost:54322/postgres',
     });

     try {
       await client.connect();
       await client.query('BEGIN');

       // Update URLs for known downloads
       for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
         // Generate the proper filename based on the key
         let filename = key
           .replace(/-/g, ' ')
           .replace(/\b\w/g, (l) => l.toUpperCase());

         // Add file extension
         if (key.includes('slides')) {
           filename += '.pdf';
         } else {
           filename += '.zip';
         }

         // Generate proper URL with encoding
         const encodedFilename = encodeURIComponent(filename);
         const url = `https://downloads.slideheroes.com/${encodedFilename}`;

         // Update the database
         await client.query(
           `
           UPDATE payload.downloads 
           SET url = $1, filename = $2
           WHERE id = $3 AND (url IS NULL OR url LIKE '%placeholder%')
         `,
           [url, filename, id],
         );

         console.log(`Updated download ${key} (${id}) with URL: ${url}`);
       }

       await client.query('COMMIT');
       console.log('Successfully updated download R2 URLs');
     } catch (error) {
       await client.query('ROLLBACK');
       console.error('Error fixing download R2 URLs:', error);
       throw error;
     } finally {
       await client.end();
     }
   }

   // Run the function if called directly
   if (require.main === module) {
     fixDownloadR2Urls()
       .then(() => console.log('Complete'))
       .catch((error) => {
         console.error('Failed:', error);
         process.exit(1);
       });
   }
   ```

4. **Add to Migration Flow**
   Update the loading.ps1 script to include this new repair step in the Fix-Relationships function:
   ```powershell
   # Add this line in the Fix-Relationships function
   Log-Message "Fixing download R2 URLs..." "Yellow"
   Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-download-r2-urls.ts" -description "Fixing download R2 URLs" -continueOnError
   ```

## 5. Testing Plan

1. **Database Record Testing**

   - Verify download records have proper URLs and filenames
   - Check that placeholder.pdf entries are removed

2. **Payload Admin Testing**

   - Verify downloads display correctly in Payload admin
   - Confirm R2 URLs are correctly generated and functional

3. **Lesson Display Testing**

   - Verify Lesson 101: No downloads should appear
   - Verify Lesson 104: Should show "SlideHeroes Presentation Template" download
   - Verify Lesson 402: No downloads should appear
   - Check that other lessons display their correct downloads

4. **Error Log Testing**
   - Verify quiz errors no longer appear in logs
   - Verify no errors appear for downloads relationship processing

## 6. Conclusion

This implementation plan addresses all identified issues:

1. Incorrect download display in lesson pages
2. Placeholder files in Payload admin
3. Quiz-related errors

By fixing both the frontend display logic and the underlying R2 integration, we'll ensure that:

- Downloads only appear on lessons that should have them
- Files are properly linked to their R2 storage location
- The system is more robust against unexpected data conditions

This implementation prioritizes:

- Data integrity (no more placeholder files)
- User experience (correct downloads displayed)
- Error reduction (proper handling of edge cases)
- Maintainability (simpler, more explicit code)
