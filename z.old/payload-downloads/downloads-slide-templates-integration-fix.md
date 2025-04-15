# SlideHeroes Presentation Template Download Integration Fix

## Root Cause Analysis

After examining the content migration system, database, and R2 storage, I've identified the exact source of the issue with the Downloads collection and the missing "slide-templates" file.

### Key Findings:

1. **Filename Mismatch**:

   - The database has a record for `slide-templates.pdf` with ID `9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1`
   - The actual file in R2 storage is `SlideHeroes Presentation Template.zip` (55MB zip file)
   - The NoSuchKey error occurs because Payload CMS is trying to access a file that doesn't exist

2. **ID Mapping Is Correct**:

   - In `packages/content-migrations/src/data/download-id-map.ts`, the UUID mapping is correctly defined:
   - `'slide-templates': '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', // SlideHeroes Presentation Template.zip`
   - The comment even correctly states it should map to the ZIP file, but the actual filename used doesn't match

3. **Missing SQL Seed File for Downloads**:

   - Unlike other collections (courses, lessons, quizzes), there is no SQL seed file for downloads
   - The `generate-sql-seed-files.ts` script doesn't include a function to generate downloads SQL
   - This means the system creates download records without proper file information

4. **Metadata Update Script Limitations**:
   - The `fix-downloads-metadata.ts` script updates generic metadata but assumes filenames are correct
   - It doesn't specifically map 'slide-templates.pdf' to 'SlideHeroes Presentation Template.zip'
   - The thumbnail generation attempts fail because it can't find the original file

## Solution Strategy

To fix this issue properly within the content migration system, we need to implement a solution that addresses all aspects of the problem:

### 1. Create SQL Seed File for Downloads

Add a `11-downloads.sql` file to the `apps/payload/src/seed/sql` directory with the correct mappings:

```sql
-- Downloads data with correct filenames matching R2 storage
INSERT INTO payload.downloads (id, title, filename, url, mimetype, filesize, type) VALUES
('9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', 'SlideHeroes Presentation Template', 'SlideHeroes Presentation Template.zip', 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip', 'application/zip', 55033588, 'pptx_template'),
('a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6', 'SlideHeroes Swipe File', 'SlideHeroes Swipe File.zip', 'https://downloads.slideheroes.com/SlideHeroes Swipe File.zip', 'application/zip', 1000000, 'reference'),
('d7e389a2-5f10-4b8c-9a21-3e78f9c61d28', 'Our Process', '201 Our Process.pdf', 'https://downloads.slideheroes.com/201 Our Process.pdf', 'application/pdf', 215163, 'reference'),
('e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456', 'The Who', '202 The Who.pdf', 'https://downloads.slideheroes.com/202 The Who.pdf', 'application/pdf', 280203, 'reference'),
-- Add other PDF files from the R2 bucket
('f158c264-5e07-71c9-d1f3-165e0e3d8541', 'Storyboards in Presentations', '403 Storyboards in Presentations.pdf', 'https://downloads.slideheroes.com/403 Storyboards in Presentations.pdf', 'application/pdf', 230137, 'reference');
```

### 2. Add Downloads Processing Function

Modify `packages/content-migrations/src/scripts/processing/sql/generate-sql-seed-files.ts` to include a downloads processing function:

```typescript
/**
 * Generate downloads SQL
 */
async function generateDownloadsSql() {
  try {
    console.log('Generating downloads SQL...');

    // Define downloads with correct filenames that match R2 storage
    const downloadsSql = `-- Downloads data with correct filenames matching R2 storage
INSERT INTO payload.downloads (id, title, filename, url, mimetype, filesize, type) VALUES
('9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', 'SlideHeroes Presentation Template', 'SlideHeroes Presentation Template.zip', 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip', 'application/zip', 55033588, 'pptx_template'),
('a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6', 'SlideHeroes Swipe File', 'SlideHeroes Swipe File.zip', 'https://downloads.slideheroes.com/SlideHeroes Swipe File.zip', 'application/zip', 1000000, 'reference'),
('d7e389a2-5f10-4b8c-9a21-3e78f9c61d28', 'Our Process', '201 Our Process.pdf', 'https://downloads.slideheroes.com/201 Our Process.pdf', 'application/pdf', 215163, 'reference'),
('e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456', 'The Who', '202 The Who.pdf', 'https://downloads.slideheroes.com/202 The Who.pdf', 'application/pdf', 280203, 'reference'),
-- Add other PDF files from the R2 bucket
('f158c264-5e07-71c9-d1f3-165e0e3d8541', 'Storyboards in Presentations', '403 Storyboards in Presentations.pdf', 'https://downloads.slideheroes.com/403 Storyboards in Presentations.pdf', 'application/pdf', 230137, 'reference');
`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '11-downloads.sql');
    fs.writeFileSync(outputFile, downloadsSql);

    console.log('Downloads SQL generated successfully');
  } catch (error) {
    console.error('Error generating downloads SQL:', error);
    throw error;
  }
}
```

### 3. Update Main Generation Function

Add the downloads SQL generation to the main function in the generate-sql-seed-files.ts file:

```typescript
async function generateAllSqlSeedFiles() {
  try {
    // Existing code...

    // Generate SQL seed files
    await generateCoursesSql();
    await generateLessonsSql(lessonMetadata, quizMap);
    await generateQuizzesSql(quizMap);
    await generateLessonQuizReferencesSql(lessonMetadata, quizMap);
    await generateQuestionsSql(quizMap);
    await generateSurveysSql();
    await generateSurveyQuestionsSql();
    await generatePostsSql();
    await generateDocumentationSql();

    // Add the new downloads SQL generation
    await generateDownloadsSql();

    // Copy SQL files to payload seed directory
    copyFilesToPayloadSeedDir();

    // Existing code...
  } catch (error) {
    // Existing error handling
  }
}
```

### 4. Update Metadata Fix Script

Enhance `packages/content-migrations/src/scripts/repair/fix-downloads-metadata.ts` to specifically handle the slide-templates case:

```typescript
// Inside the fixDownloadsMetadata function, add before the general update:

// Special case for slide-templates which should be a ZIP file
const fixSlideTemplatesResult = await client.query(`
  UPDATE payload.downloads
  SET 
    filename = 'SlideHeroes Presentation Template.zip',
    url = 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip',
    mimetype = 'application/zip',
    filesize = 55033588
  WHERE id = '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1'
`);

console.log(
  `Fixed slide-templates record: ${fixSlideTemplatesResult.rowCount} rows updated`,
);
```

### 5. Enhance Downloads Collection

Update the Downloads collection in `apps/payload/src/collections/Downloads.ts` to better handle ZIP files:

```typescript
// In the Downloads.ts file, add special handling for ZIP files in the afterRead hook
afterRead: [
  async ({ doc }) => {
    // Enhanced logging for better debugging
    console.log('Download doc in afterRead:', doc);

    // Verify R2 file existence based on file extension
    const fileExists = doc.filename && !doc.filename.includes('.placeholder');
    const isZipFile = doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip';

    // Special handling for ZIP files
    if (fileExists && isZipFile) {
      // Set appropriate mime type
      doc.mimeType = 'application/zip';

      // Create placeholder thumbnail if missing
      if (!doc.sizes || !doc.sizes.thumbnail) {
        doc.sizes = {
          thumbnail: {
            url: '/images/zip-icon.png', // Path to a ZIP icon in public folder
            width: 400,
            height: 300,
            mimeType: 'image/png',
            filename: 'zip-icon.png'
          }
        };
      }
    }

    // Rest of the hook remains the same
    return {
      ...doc,
      _r2FileExists: fileExists,
      _isZipFile: isZipFile,
      fileStatus: fileExists ? 'Available in R2' : 'Missing in R2',
    };
  },
],
```

## Implementation Steps

1. Create `11-downloads.sql` in `apps/payload/src/seed/sql/`
2. Add `generateDownloadsSql()` function to `generate-sql-seed-files.ts`
3. Update the main generation function to call `generateDownloadsSql()`
4. Add the special case handling to `fix-downloads-metadata.ts`
5. Update the `afterRead` hook in `Downloads.ts` to handle ZIP files
6. Run the migration system to apply changes

## Benefits of This Approach

1. **Root Cause Fix**: Addresses the mismatch between database records and actual R2 files
2. **Content Migration Integration**: Ensures fix persists through database resets
3. **File Type Handling**: Improves ZIP file support in the admin UI and website
4. **Relationship Preservation**: Maintains all existing lesson relationships
5. **Consistent IDs**: Continues using the same UUIDs established in download-id-map.ts

## Next Steps After Implementation

1. Run `reset-and-migrate.ps1` to verify the migration works correctly
2. Check Downloads collection in Payload admin to ensure proper thumbnails
3. Verify downloads work correctly in course lessons
4. Consider adding additional R2 file verification within the migration system
