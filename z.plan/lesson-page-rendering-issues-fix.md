# Lesson Page Rendering Issues: Analysis and Fix Plan

## Current Issues Analysis

After investigating the lesson page rendering, we've identified three interconnected issues:

### 1. Raw Template Tags in Content Field

The content field is displaying raw template tags rather than rendering them properly:

```
{% bunny bunnyvideoid="70b1f616-8e55-4c58-8898-c5cefa05417b" /%}
To-Do - Complete the lesson quiz
Watch - None
Read - None
{% custombullet status="right-arrow" /%}
Course Project - None
```

### 2. Empty Content Field Not Being Applied

Despite having a `clear-lesson-content.ts` script that's supposed to set content fields to NULL, they remain populated with template tags.

### 3. Downloads Section Not Rendering Properly

The downloads section shows:

```
### Lesson Downloads
{% r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf" filedescription="'Our Process' Lesson slides" /%}
{% r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf" filedescription="Second download (The Who)" /%}
```

Rather than properly formatted download buttons, despite server logs indicating downloads are being found:

```
payload-app:dev: Found 1 downloads for lesson our-process
```

## Code Analysis

### Template Tag Processor

The `TemplateTagProcessor` in `packages/cms/payload/src/template-tag-processor.tsx` is correctly implemented:

1. It has handlers for:
   - `{% r2file %}` for file downloads
   - `{% bunny %}` for Bunny.net videos
   - `{% custombullet %}` for custom bullet points
2. The content renderer in `packages/cms/payload/src/content-renderer.tsx` correctly:
   - Checks for template tags with `containsTemplateTags()`
   - Delegates to `TemplateTagProcessor` when template tags are detected

### Content Field Clearing

The `clear-lesson-content.ts` script in `packages/content-migrations/src/scripts/repair/clear-lesson-content.ts` is properly implemented:

```typescript
export async function clearLessonContent() {
  try {
    console.log('Starting to clear content field from course_lessons table...');

    // Execute SQL update to clear content field
    const result = await executeSQL(
      `UPDATE payload.course_lessons 
       SET content = NULL 
       WHERE content IS NOT NULL;`,
    );

    console.log('Successfully cleared content field from course_lessons table');
    console.log(`Affected rows: ${result.rowCount || 'unknown'}`);

    return {
      success: true,
      message: `Content field cleared for ${result.rowCount || 'multiple'} lessons`,
    };
  } catch (error) {
    console.error('Error clearing content field:', error);
    return {
      success: false,
      message: `Failed to clear content field: ${error.message || error}`,
      error,
    };
  }
}
```

This script is called during the migration process in `scripts/orchestration/phases/loading.ps1`:

```powershell
# Clear lesson content to fix template tag rendering issues
Log-Message "Clearing lesson content fields to fix template tag rendering..." "Yellow"
Exec-Command -command "pnpm run clear:lesson-content" -description "Clearing lesson content fields" -continueOnError
```

### Downloads Relationship

The `CourseLessons.ts` collection has a properly configured downloads relationship:

```typescript
{
  name: 'downloads',
  type: 'relationship',
  relationTo: 'downloads',
  hasMany: true,
  admin: {
    description: 'Files for download in this lesson',
  },
}
```

And an `afterRead` hook that fetches downloads:

```typescript
hooks: {
  // Add a collection-level afterRead hook to handle downloads
  afterRead: [
    async ({ req, doc }) => {
      // Only handle downloads if we have a specific document with an ID
      if (doc?.id) {
        try {
          // Replace downloads with ones from our custom view
          const downloads = await findDownloadsForCollection(
            req.payload,
            doc.id,
            'course_lessons',
          )

          // Update the document with the retrieved downloads
          return {
            ...doc,
            downloads,
          }
        } catch (error) {
          console.error('Error fetching downloads for course lesson:', error)
          // Return the document with an empty downloads array instead of failing
          return {
            ...doc,
            downloads: [], // Fallback to empty array on error
          }
        }
      }

      return doc
    },
  ],
},
```

The `LessonViewClient.tsx` component has correct UI for rendering downloads:

```tsx
{
  /* Render Downloads if available */
}
{
  lesson.downloads && lesson.downloads.length > 0 && (
    <div className="my-6">
      <div className="space-y-2">
        {lesson.downloads.map((download: any, index: number) => {
          // Ensure we have a download with URL
          if (!download || !download.url) return null;

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex-grow">
                <p className="font-medium">
                  {download.description || download.filename}
                </p>
              </div>
              <a
                href={download.url}
                download
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Root Causes

After analyzing the code and server logs, the root causes appear to be:

1. **Content Field Clearing Issue**:

   - The `clear-lesson-content.ts` script might not be executing properly during migrations
   - It's called with `continueOnError` which means failures are logged but don't halt the migration
   - The script may be running but the content field is being repopulated later in the migration process

2. **Template Tags vs. Downloads Relationship**:

   - The template tags in the content field include download links (`{% r2file %}`)
   - There's a disconnect between these template-based downloads and the proper downloads relationship

3. **Content Rendering Path**:
   - The content field is being passed directly to `PayloadContentRenderer`
   - While the renderer has template tag detection, the raw content field may be overriding or duplicating the properly structured relationship-based content

## Implementation Plan

### 1. Enhanced Content Field Clearing

Create a more robust clearing script that:

- Runs at the end of the migration process
- Verifies the field was successfully cleared
- Explicitly logs the state before and after

```typescript
// Enhanced clearing script
export async function enhancedClearLessonContent() {
  try {
    // First check current state
    const checkQuery = `SELECT id, LEFT(content, 100) as content_preview 
                        FROM payload.course_lessons 
                        WHERE content IS NOT NULL`;

    const beforeResults = await executeSQL(checkQuery);
    console.log(
      `Found ${beforeResults.rowCount} lessons with non-NULL content`,
    );

    if (beforeResults.rowCount > 0) {
      console.log('Sample content before clearing:');
      beforeResults.rows.slice(0, 3).forEach((row) => {
        console.log(`Lesson ${row.id}: ${row.content_preview}...`);
      });
    }

    // Execute SQL update with transaction
    console.log('Executing content field clearing...');
    const result = await executeSQL(
      `BEGIN;
       UPDATE payload.course_lessons 
       SET content = NULL 
       WHERE content IS NOT NULL;
       COMMIT;`,
    );

    // Verify after clearing
    const afterResults = await executeSQL(checkQuery);
    console.log(
      `After clearing: ${afterResults.rowCount} lessons with non-NULL content`,
    );

    return {
      success: afterResults.rowCount === 0,
      message: `Content field cleared for ${result.rowCount || 'multiple'} lessons`,
      before: beforeResults.rowCount,
      after: afterResults.rowCount,
    };
  } catch (error) {
    console.error('Error in enhanced clearLessonContent:', error);
    return {
      success: false,
      message: `Failed to clear content field: ${error.message || error}`,
      error,
    };
  }
}
```

### 2. Debug Template Tag Processor Integration

Add diagnostic logging to the template tag processor to verify its operation:

```typescript
// Enhanced template tag processor with logging
export function TemplateTagProcessor({ content }: TemplateTagProcessorProps) {
  if (!content || typeof content !== 'string') {
    console.log('TemplateTagProcessor received empty or non-string content');
    return null;
  }

  console.log(`Processing template tags in content: ${content.substring(0, 100)}...`);

  // Apply all processors in sequence
  let processedContent = content;

  // Add more detailed logging for each processor
  const r2fileMatches = (content.match(/{%\s*r2file.*?\/%}/g) || []).length;
  const bunnyMatches = (content.match(/{%\s*bunny.*?\/%}/g) || []).length;
  const bulletMatches = (content.match(/{%\s*custombullet.*?\/%}/g) || []).length;

  console.log(`Found template tags: ${r2fileMatches} r2file, ${bunnyMatches} bunny, ${bulletMatches} custombullet`);

  processedContent = processR2FileTags(processedContent);
  processedContent = processBunnyVideoTags(processedContent);
  processedContent = processCustomBulletTags(processedContent);

  // Add wrapper for better styling and debugging class
  return (
    <div className="template-content template-processed-content">
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
}
```

### 3. Fix Download Relationship Handling

Add diagnostics to the downloads rendering section:

```tsx
{
  /* Render Downloads with diagnostics */
}
{
  (() => {
    // Debug logging for downloads
    console.log(`Lesson downloads:`, lesson.downloads);

    if (lesson.downloads && lesson.downloads.length > 0) {
      return (
        <div className="my-6">
          <div className="space-y-2">
            {lesson.downloads.map((download: any, index: number) => {
              // Debug individual download
              console.log(`Download ${index}:`, download);

              // Ensure we have a download with URL
              if (!download || !download.url) {
                console.log(`Download ${index} missing URL:`, download);
                return null;
              }

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex-grow">
                    <p className="font-medium">
                      {download.description ||
                        download.filename ||
                        'Unnamed Download'}
                    </p>
                  </div>
                  <a
                    href={download.url}
                    download
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  })();
}
```

## Implementation Steps

### Step 1: Add Enhanced Diagnostics

1. Create a diagnostic script to check the current state of lesson content and downloads:

```typescript
// packages/content-migrations/src/scripts/diagnostic/lesson-rendering-diagnostic.ts
import { executeSQL } from '../../utils/db/execute-sql.js';

export async function runLessonRenderingDiagnostic() {
  try {
    console.log('=== LESSON RENDERING DIAGNOSTIC ===');

    // Check content fields
    const contentQuery = `
      SELECT id, slug, 
             LEFT(content, 200) as content_preview,
             LENGTH(content) as content_length 
      FROM payload.course_lessons 
      ORDER BY content_length DESC 
      LIMIT 5`;

    const contentResults = await executeSQL(contentQuery);
    console.log(
      `\nTop 5 lessons by content length (${contentResults.rowCount} total):`,
    );
    contentResults.rows.forEach((row) => {
      console.log(
        `Lesson ${row.slug} (${row.id}): ${row.content_length} chars`,
      );
      console.log(`Preview: ${row.content_preview}...\n`);
    });

    // Check download relationships
    const downloadsQuery = `
      SELECT cl.id, cl.slug, cl.title, 
             COUNT(d.id) as download_count
      FROM payload.course_lessons cl
      LEFT JOIN payload.course_lessons_downloads cd ON cl.id = cd.course_lessons_id
      LEFT JOIN payload.downloads d ON cd.downloads_id = d.id
      GROUP BY cl.id, cl.slug, cl.title
      ORDER BY download_count DESC
      LIMIT 10`;

    const downloadsResults = await executeSQL(downloadsQuery);
    console.log(
      `\nTop 10 lessons by download count (${downloadsResults.rowCount} total):`,
    );
    downloadsResults.rows.forEach((row) => {
      console.log(
        `Lesson "${row.title}" (${row.slug}): ${row.download_count} downloads`,
      );
    });

    // Count template tags in content
    const templateTagsQuery = `
      SELECT id, slug, 
             (LENGTH(content) - LENGTH(REPLACE(content, '{%', ''))) / 2 as template_tag_count
      FROM payload.course_lessons
      WHERE content LIKE '%{%}%'
      ORDER BY template_tag_count DESC
      LIMIT 10`;

    const tagsResults = await executeSQL(templateTagsQuery);
    console.log(
      `\nTop 10 lessons by template tag count (${tagsResults.rowCount} total):`,
    );
    tagsResults.rows.forEach((row) => {
      console.log(
        `Lesson ${row.slug} (${row.id}): ${row.template_tag_count} template tags`,
      );
    });

    return {
      success: true,
      contentLessons: contentResults.rowCount,
      downloadLessons: downloadsResults.rowCount,
      templateTagLessons: tagsResults.rowCount,
    };
  } catch (error) {
    console.error('Diagnostic failed:', error);
    return {
      success: false,
      error: error.message || error,
    };
  }
}

// Run the diagnostic if this script is executed directly
if (
  process.argv[1]?.endsWith('lesson-rendering-diagnostic.ts') ||
  process.argv[1]?.endsWith('lesson-rendering-diagnostic.js')
) {
  runLessonRenderingDiagnostic()
    .then((result) => {
      console.log('\nDiagnostic summary:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
```

2. Add an entry in package.json:

```json
"scripts": {
  // ...existing scripts
  "diagnostic:lesson-rendering": "tsx src/scripts/diagnostic/lesson-rendering-diagnostic.ts"
}
```

### Step 2: Enhance Content Field Clearing

1. Modify the existing clearing script to add transaction support and verification:

```typescript
// packages/content-migrations/src/scripts/repair/clear-lesson-content.ts
import { executeSQL } from '../../utils/db/execute-sql.js';

export async function clearLessonContent() {
  try {
    console.log('Starting to clear content field from course_lessons table...');

    // Check current state
    const beforeQuery = `SELECT COUNT(*) as count FROM payload.course_lessons WHERE content IS NOT NULL`;
    const beforeResult = await executeSQL(beforeQuery);
    const beforeCount = beforeResult.rows[0]?.count || 0;

    console.log(
      `Found ${beforeCount} lessons with non-NULL content before clearing`,
    );

    // Execute SQL update with transaction
    const result = await executeSQL(
      `BEGIN;
       UPDATE payload.course_lessons 
       SET content = NULL 
       WHERE content IS NOT NULL;
       COMMIT;`,
    );

    // Verify after clearing
    const afterQuery = `SELECT COUNT(*) as count FROM payload.course_lessons WHERE content IS NOT NULL`;
    const afterResult = await executeSQL(afterQuery);
    const afterCount = afterResult.rows[0]?.count || 0;

    console.log(
      `Found ${afterCount} lessons with non-NULL content after clearing`,
    );

    const success = afterCount === 0 || afterCount < beforeCount;

    if (success) {
      console.log(
        'Successfully cleared content field from course_lessons table',
      );
      console.log(`Affected rows: ${beforeCount - afterCount}`);
    } else {
      console.error('Failed to clear content field from course_lessons table');
      console.error(`Before: ${beforeCount}, After: ${afterCount}`);
    }

    return {
      success,
      message: success
        ? `Content field cleared for ${beforeCount - afterCount} lessons`
        : 'Failed to clear content field',
      beforeCount,
      afterCount,
    };
  } catch (error) {
    console.error('Error clearing content field:', error);
    return {
      success: false,
      message: `Failed to clear content field: ${error.message || error}`,
      error,
    };
  }
}

// Execute the function if this script is run directly
if (
  process.argv[1]?.endsWith('clear-lesson-content.ts') ||
  process.argv[1]?.endsWith('clear-lesson-content.js')
) {
  clearLessonContent()
    .then((result) => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
```

### Step 3: Improve Template Tag Processing

1. Enhance the template tag processor with better error handling and logging:

```typescript
// packages/cms/payload/src/template-tag-processor.tsx
// Add at the top of the file:
const DEBUG = process.env.NODE_ENV === 'development';

// Then add this helper function:
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[TemplateTagProcessor]', ...args);
  }
}

// Update the main function:
export function TemplateTagProcessor({ content }: TemplateTagProcessorProps) {
  if (!content || typeof content !== 'string') {
    debugLog('Received empty or non-string content');
    return null;
  }

  // Log basic stats about the content
  if (DEBUG) {
    const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    debugLog(`Processing content (${content.length} chars): ${contentPreview}`);

    // Count tag occurrences
    const r2fileMatches = (content.match(/{%\s*r2file.*?\/%}/g) || []);
    const bunnyMatches = (content.match(/{%\s*bunny.*?\/%}/g) || []);
    const bulletMatches = (content.match(/{%\s*custombullet.*?\/%}/g) || []);

    debugLog(`Found tags: ${r2fileMatches.length} r2file, ${bunnyMatches.length} bunny, ${bulletMatches.length} custombullet`);

    // Log the first few matches of each type
    const logFirstMatches = (matches: RegExpMatchArray, label: string) => {
      if (matches.length > 0) {
        debugLog(`${label} examples:`);
        matches.slice(0, 2).forEach((match, i) => debugLog(`  ${i+1}. ${match}`));
      }
    };

    logFirstMatches(r2fileMatches, 'r2file');
    logFirstMatches(bunnyMatches, 'bunny');
    logFirstMatches(bulletMatches, 'custombullet');
  }

  try {
    // Apply all processors in sequence
    let processedContent = content;
    processedContent = processR2FileTags(processedContent);
    processedContent = processBunnyVideoTags(processedContent);
    processedContent = processCustomBulletTags(processedContent);

    // Additional processing for headers and other markdown-like patterns
    // Handle ### Header syntax (common in the raw content)
    processedContent = processedContent.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');

    // Remove any duplicate HTML tags that might have been created during processing
    processedContent = processedContent.replace(/<\/(div|h3|p)>\s*<\1>/g, ' ');

    // Add wrapper with diagnostic classes in development
    return (
      <div className={`template-content ${DEBUG ? 'template-processed' : ''}`}>
        <div
          dangerouslySetInnerHTML={{ __html: processedContent }}
          data-processed-length={processedContent.length}
        />
      </div>
    );
  } catch (error) {
    debugLog('Error processing template tags:', error);

    // Fallback to a basic rendering with error indication in development
    if (DEBUG) {
      return (
        <div className="template-content template-error">
          <div className="bg-red-50 p-4 border border-red-200 rounded">
            <p className="text-red-700">Error processing template tags</p>
            <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
              {error.toString()}
            </pre>
          </div>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }

    // In production, just render the content directly
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
}
```

2. Update the content renderer to better handle the template tags:

```typescript
// packages/cms/payload/src/content-renderer.tsx
// Update the template tag handling section:

// Handle string content with template tags ({% ... %})
if (typeof content === 'string') {
  if (containsTemplateTags(content)) {
    console.log('Content contains template tags, using TemplateTagProcessor');
    return <TemplateTagProcessor content={content} />;
  }

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### Step 4: Verify Downloads Rendering

1. Update the LessonViewClient component with better download debugging:

```tsx
// apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx
// Replace the downloads rendering section:

{
  /* Render Downloads with better error handling and debugging */
}
{
  (() => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Lesson downloads:',
        lesson.downloads ? `${lesson.downloads.length} items` : 'undefined',
      );

      if (lesson.downloads && lesson.downloads.length > 0) {
        console.log('First download:', lesson.downloads[0]);
      }
    }

    // If downloads exist and are in the expected format
    if (
      lesson.downloads &&
      Array.isArray(lesson.downloads) &&
      lesson.downloads.length > 0
    ) {
      return (
        <div className="my-6">
          <div className="space-y-2">
            {lesson.downloads.map((download: any, index: number) => {
              // Additional validation
              if (!download) {
                console.warn(`Download at index ${index} is null or undefined`);
                return null;
              }

              if (!download.url) {
                console.warn(
                  `Download at index ${index} has no URL:`,
                  download,
                );

                // Fallback rendering for downloads without URL
                if (download.filename || download.description) {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex-grow">
                        <p className="font-medium">
                          {download.description || download.filename}
                        </p>
                      </div>
                      <span className="text-sm italic text-gray-500">
                        (Download URL not available)
                      </span>
                    </div>
                  );
                }

                return null;
              }

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex-grow">
                    <p className="font-medium">
                      {download.description || download.filename || 'Download'}
                    </p>
                  </div>
                  <a
                    href={download.url}
                    download
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // If we have template tags in the content but no downloads relationship
    // This is a fallback detection for the legacy format
    if (
      lesson.content &&
      typeof lesson.content === 'string' &&
      lesson.content.includes('{%') &&
      lesson.content.includes('r2file')
    ) {
      console.log('Legacy r2file tags detected in content');
      return (
        <div className="my-6">
          <div className="template-downloads">
            <TemplateTagProcessor
              content={lesson.content.replace(
                /[\s\S]*?(### Lesson Downloads[\s\S]*)/m,
                '$1',
              )}
            />
          </div>
        </div>
      );
    }

    return null;
  })();
}
```

## Testing Plan

1. **Run Diagnostic Script First**:

   - Execute `pnpm --filter @kit/content-migrations run diagnostic:lesson-rendering`
   - Review logs to understand the current state of:
     - Content fields with template tags
     - Download relationships
     - The specific lessons with issues

2. **Test Content Clearing Script**:

   - Run `pnpm --filter @kit/content-migrations run clear:lesson-content`
   - Verify that content fields are successfully cleared
   - Check database directly with PostgreSQL query

3. **Test Complete Migration Flow**:

   - Run the full migration with `./reset-and-migrate.ps1`
   - Check logs for any errors in the content clearing step
   - Verify that content fields remain NULL after migration

4. **Test Rendering**:
   - Navigate to a lesson page
   - Inspect the rendered output for:
     - Absence of raw template tags
     - Properly rendered download buttons
     - Correctly displayed video content

## Expected Results

After implementing these fixes:

1. The lesson content field will be properly cleared during migration
2. Downloads will render correctly through the relationship mechanism
3. Any template tags in other fields will be properly processed
4. The UI will show properly formatted download buttons and video players

## Conclusion

The root cause of the rendering issues is a combination of:

1. Content fields retaining template tags despite clearing attempts
2. A disconnect between template-based downloads and relationship-based downloads
3. Template tag processor not being fully integrated with all rendering paths

By enhancing the content clearing process, improving template tag processing, and providing better error handling, we can resolve these issues and ensure proper rendering of lesson content.
