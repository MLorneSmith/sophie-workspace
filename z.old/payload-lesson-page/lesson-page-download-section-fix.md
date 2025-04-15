# Lesson Page Download Section Fix Plan

## Current Issues Analysis

Based on a comprehensive review of the codebase and database structure, I've identified the root causes of the download rendering issues in the lesson page:

1. **Missing Lesson-Download Relationships**:

   - The query against `course_lessons_downloads` returns empty, indicating no relationships exist between lessons and downloads
   - Downloads exist in the database (20 records) but are not properly linked to lessons

2. **Placeholder Downloads**:

   - Download records have placeholder filenames (e.g., "slide-templates.placeholder")
   - URLs point to non-existent locations (https://downloads.example.com/...)
   - The download section shows 'placeholder.pdf' as the name of the file to download

3. **UI Implementation Issues**:
   - Download buttons use raw HTML instead of the Shadcn Button component
   - The fallback mechanism for template tag processing is inconsistent
   - Download links go to 404 pages due to invalid URLs

## Database Analysis

### Downloads Table Structure

The `payload.downloads` table has the following key columns:

- `id` (uuid): Primary key
- `filename` (text): The name of the file (currently with .placeholder suffix)
- `url` (text): The download URL (currently using https://downloads.example.com/)
- `description` (text): Optional description of the download

### Relationship Tables

The `payload.course_lessons_downloads` table should establish relationships between lessons and downloads, but is currently empty. It has:

- `lesson_id` (uuid): Foreign key to course_lessons
- `download_id` (uuid): Foreign key to downloads

## Code Analysis

### Download Rendering Logic

The `LessonViewClient.tsx` component has three approaches to render downloads:

1. **Primary Approach**: Use downloads from the relationship array:

   ```tsx
   if (
     lesson.downloads &&
     Array.isArray(lesson.downloads) &&
     lesson.downloads.length > 0
   ) {
     // Render downloads from relationship array
   }
   ```

2. **Secondary Approach**: Process template tags in content:

   ```tsx
   if (
     lesson.content &&
     typeof lesson.content === 'string' &&
     lesson.content.includes('{%') &&
     lesson.content.includes('r2file')
   ) {
     // Process and render template tags
   }
   ```

3. **Fallback**: Return null if no downloads are found.

### CourseLessons Collection Configuration

The `CourseLessons.ts` configuration properly defines:

- Download relationship field
- afterRead hook that calls `findDownloadsForCollection`

However, the hooks aren't finding any downloads because the relationship tables are empty.

## Root Causes

1. **Relationship Tables Not Populated**:

   - The content migration system isn't correctly establishing relationships between lessons and downloads
   - The `course_lessons_downloads` table is empty

2. **Placeholder Data**:

   - Downloads have placeholder data instead of actual file information
   - URLs don't point to valid locations

3. **Download Button Component**:
   - Download buttons use custom HTML rather than the Shadcn Button component

## Implementation Plan

### 1. Fix Download Record Data

Update download records with proper filenames and valid URLs:

```sql
UPDATE payload.downloads
SET filename = REPLACE(filename, '.placeholder', '.pdf'),
    url = REPLACE(
      url,
      'https://downloads.example.com/',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/'
    ),
    description = CASE
      WHEN description IS NULL THEN REPLACE(filename, '.placeholder', '')
      ELSE description
    END;
```

### 2. Create Lesson-Download Relationships

Create proper relationships in the `course_lessons_downloads` table by mapping existing downloads to appropriate lessons:

```sql
-- Insert relationships for specific lessons and downloads
INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, created_at, updated_at, path)
SELECT
  uuid_generate_v4(), -- Generate a new UUID for the relationship
  cl.id, -- Lesson ID
  d.id, -- Download ID
  CURRENT_TIMESTAMP, -- Created timestamp
  CURRENT_TIMESTAMP, -- Updated timestamp
  '/course_lessons_downloads/' || uuid_generate_v4() -- Generate a path
FROM
  payload.course_lessons cl
JOIN
  payload.downloads d ON
  -- Match lessons with downloads based on name patterns
  (cl.slug = 'our-process' AND d.filename LIKE 'our-process%') OR
  (cl.slug = 'the-who' AND d.filename LIKE 'the-who%') OR
  (cl.slug = 'introduction' AND d.filename LIKE 'introduction%')
-- Add more mappings as needed
```

### 3. Modify the LessonViewClient Download Section

Update the download section in `LessonViewClient.tsx` to properly use the Shadcn Button component:

```tsx
<Button
  asChild
  variant="default"
  size="default"
  className="bg-primary text-primary-foreground"
>
  <a
    href={download.url}
    download
    target="_blank"
    rel="noopener noreferrer"
    data-source="lesson-downloads"
  >
    Download
  </a>
</Button>
```

### 4. Enhance Fallback Processing

Improve the fallback mechanism to handle cases where downloads are not found:

```tsx
// Add this utility function to generate a fallback URL based on filename
const getFallbackDownloadUrl = (filename: string) => {
  if (!filename) return '';

  // Strip placeholder extension if present
  const cleanName = filename.replace('.placeholder', '');

  // Construct a URL to the R2 bucket
  return `https://pub-40e84da466344af19a7192a514a7400e.r2.dev/${cleanName}.pdf`;
};

// Then in the download rendering code, add this fallback
if (!download.url && (download.filename || download.description)) {
  // Generate a fallback URL
  const fallbackUrl = getFallbackDownloadUrl(download.filename);

  return (
    <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex-grow">
        <p className="font-medium">
          {download.description || download.filename.replace('.placeholder', '')}
        </p>
      </div>
      <Button asChild>
        <a
          href={fallbackUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
        >
          Download
        </a>
      </Button>
    </div>
  );
}
```

## Implementation Sequence

1. **Database Updates**:

   - Run SQL to fix download records
   - Create relationships between lessons and downloads

2. **Code Updates**:

   - Update the download rendering section in LessonViewClient.tsx
   - Add fallback URL generation
   - Implement Shadcn Button component

3. **Testing**:
   - Verify database changes with SQL queries
   - Check lesson pages to confirm downloads display correctly
   - Test download functionality to ensure files are accessible

## Integration with Content Migration System

Any changes to the database must be accounted for in the content migration system:

1. **Migration Script Modifications**:

   - Ensure that reset-and-migrate.ps1 correctly populates the relationship tables
   - Add code to transform placeholder download data to valid URLs
   - Consider adding a specific script for download relationship fixes

2. **Coordination with Database Reset**:
   - Be aware that running reset-and-migrate.ps1 will reset the database, potentially reverting our changes
   - Ensure our fixes are incorporated into the migration flow

## Risks and Considerations

1. **Content Migration Impact**:

   - Our changes must be compatible with the content migration system
   - We should coordinate with reset-and-migrate.ps1 to ensure changes persist

2. **Multiple Fallback Methods**:

   - The system has several layers of fallbacks for downloads
   - We need to ensure they work together cohesively

3. **R2 Bucket Access**:
   - The URLs need to point to accessible files in the R2 bucket
   - We should verify proper permissions are set

## Anticipated Results

After implementing these changes, we expect:

- Downloads will display with proper names (not "placeholder.pdf")
- Download links will use the Shadcn Button component
- Downloads will be accessible and functional

This approach addresses both immediate rendering issues and provides a more robust solution that works with the content migration system, ensuring long-term stability of the download functionality.
