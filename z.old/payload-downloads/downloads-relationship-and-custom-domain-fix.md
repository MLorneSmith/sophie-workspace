# Downloads Collection Relationship and Custom Domain Fix

## Issue Analysis

After a comprehensive review of the codebase, database structure, and R2 storage, I've identified the root causes of the download rendering issues in the lesson page:

### 1. Missing Lesson-Download Relationships

- The `course_lessons_downloads` relationship table exists but is completely empty
- This breaks the bidirectional relationship between lessons and their downloads
- No associations exist between lessons and downloads in the database

### 2. Placeholder Data in Downloads Collection

- Download records have placeholder filenames (e.g., "slide-templates.placeholder")
- URLs point to non-existent locations (e.g., "https://downloads.example.com/slide-templates")
- The actual files in R2 storage have proper names like "201 Our Process.pdf" but aren't linked to records

### 3. Custom Domain Configuration Mismatch

- The S3 storage plugin in `payload.config.ts` is correctly configured to use the custom domain:
  ```typescript
  downloads: {
    disableLocalStorage: true,
    generateFileURL: ({ filename }: { filename: string }) =>
      `https://downloads.slideheroes.com/${filename}`,
  }
  ```
- However, existing records still have old placeholder URLs
- The downloads bucket is now properly set up with the custom domain `downloads.slideheroes.com`

### 4. Fallback System Not Working Properly

- The multi-tiered fallback system in `relationship-helpers.ts` ultimately returns placeholder data
- The fallback mechanism returns generic placeholders instead of using proper domain and filenames

## Database Analysis

### Downloads Table Structure

The `payload.downloads` table contains:

- `id` (uuid): Primary key (predefined UUIDs for consistent relationships)
- `filename` (text): Currently has `.placeholder` suffix
- `url` (text): Currently using `https://downloads.example.com/` domain
- `title` (text): Contains references to the file content (e.g., "Download: slide-templates")

### Relationship Table Structure

The `payload.course_lessons_downloads` table exists but is empty. It has:

- `lesson_id` (uuid): Foreign key to course_lessons
- `download_id` (uuid): Foreign key to downloads
- `id` (uuid): Primary key for the relationship
- `path` (text): Path identifier for the relationship
- `created_at`, `updated_at`: Timestamp fields

## Solution Plan

Our solution has three main components:

### 1. Update Download Records with Proper Files and URLs

We'll update the download records to point to actual files in R2 using the custom domain:

```sql
UPDATE payload.downloads
SET
  filename = CASE
    WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
    WHEN title LIKE '%the-who%' THEN '202 The Who.pdf'
    WHEN title LIKE '%introduction%' THEN '203 The Why - Introductions.pdf'
    WHEN title LIKE '%next-steps%' THEN '204 The Why - Next Steps.pdf'
    WHEN title LIKE '%idea-generation%' THEN '301 Idea Generation.pdf'
    WHEN title LIKE '%what-is-structure%' THEN '302 What is Structure.pdf'
    WHEN title LIKE '%using-stories%' THEN '401 Using Stories.pdf'
    WHEN title LIKE '%storyboards%' THEN '403 Storyboards in Presentations.pdf'
    -- Add mappings for other files
    ELSE REPLACE(filename, '.placeholder', '.pdf')
  END,
  url = CONCAT('https://downloads.slideheroes.com/',
          CASE
            WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
            WHEN title LIKE '%the-who%' THEN '202 The Who.pdf'
            WHEN title LIKE '%introduction%' THEN '203 The Why - Introductions.pdf'
            WHEN title LIKE '%next-steps%' THEN '204 The Why - Next Steps.pdf'
            WHEN title LIKE '%idea-generation%' THEN '301 Idea Generation.pdf'
            WHEN title LIKE '%what-is-structure%' THEN '302 What is Structure.pdf'
            WHEN title LIKE '%using-stories%' THEN '401 Using Stories.pdf'
            WHEN title LIKE '%storyboards%' THEN '403 Storyboards in Presentations.pdf'
            -- Add mappings for other files
            ELSE REPLACE(filename, '.placeholder', '.pdf')
          END)
```

### 2. Create Lesson-Download Relationships

We'll populate the relationship table with appropriate associations:

```sql
INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, created_at, updated_at, path)
SELECT
  uuid_generate_v4(),
  cl.id,
  d.id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '/course_lessons_downloads/' || uuid_generate_v4()
FROM
  payload.course_lessons cl
JOIN
  payload.downloads d ON
  (cl.slug = 'our-process' AND d.title LIKE '%our-process%') OR
  (cl.slug = 'the-who' AND d.title LIKE '%the-who%') OR
  (cl.slug = 'introduction' AND d.title LIKE '%introduction%') OR
  (cl.slug = 'next-steps' AND d.title LIKE '%next-steps%') OR
  (cl.slug = 'idea-generation' AND d.title LIKE '%idea-generation%') OR
  -- Add mappings for other lesson-download relationships
  (cl.slug = 'what-is-structure' AND d.title LIKE '%what-is-structure%')
WHERE
  -- Avoid duplicates if some relationships already exist
  NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_downloads
    WHERE lesson_id = cl.id AND download_id = d.id
  )
```

### 3. Integrate with Content Migration System

We'll add a new migration script to integrate with the existing content migration process:

```typescript
// Example implementation in a new file: packages/content-migrations/src/scripts/repair/fix-downloads-relationships.ts
import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

export async function fixDownloadsRelationships(
  payload: Payload,
): Promise<void> {
  console.log('Fixing downloads relationships and URLs...');

  try {
    // Start a transaction for atomicity
    await payload.db.drizzle.execute(sql`BEGIN`);

    // 1. First, update download records with proper filenames and URLs
    const { rowCount: updatedDownloads } = await payload.db.drizzle.execute(sql`
      UPDATE payload.downloads
      SET 
        filename = CASE
          WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
          WHEN title LIKE '%the-who%' THEN '202 The Who.pdf'
          -- Add more mappings
          ELSE REPLACE(filename, '.placeholder', '.pdf')
        END,
        url = CONCAT('https://downloads.slideheroes.com/', 
                CASE 
                  WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
                  -- Add more mappings
                  ELSE REPLACE(filename, '.placeholder', '.pdf')
                END)
    `);

    console.log(
      `Updated ${updatedDownloads} download records with proper filenames and URLs`,
    );

    // 2. Then create the relationships
    const { rowCount: createdRelationships } = await payload.db.drizzle
      .execute(sql`
      INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, created_at, updated_at, path)
      SELECT
        uuid_generate_v4(),
        cl.id,
        d.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '/course_lessons_downloads/' || uuid_generate_v4()
      FROM
        payload.course_lessons cl
      JOIN
        payload.downloads d ON
        (cl.slug = 'our-process' AND d.title LIKE '%our-process%') OR
        -- Add more mappings
        (cl.slug = 'the-who' AND d.title LIKE '%the-who%')
      WHERE
        NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_downloads
          WHERE lesson_id = cl.id AND download_id = d.id
        )
    `);

    console.log(
      `Created ${createdRelationships} new lesson-download relationships`,
    );

    // 3. Commit the transaction
    await payload.db.drizzle.execute(sql`COMMIT`);

    console.log('Downloads relationship fix completed successfully');
  } catch (error) {
    // Rollback on any error
    await payload.db.drizzle.execute(sql`ROLLBACK`);
    console.error('Error fixing downloads relationships:', error);
    throw error;
  }
}
```

### 4. Update Fallback Mechanism

We'll enhance the fallback mechanism in `relationship-helpers.ts` to use the proper domain:

```typescript
// Update this section in apps/payload/src/db/relationship-helpers.ts
return {
  id,
  filename: filename || `${id.substring(0, 8)}.pdf`,
  // Use the correct custom domain
  url: `https://downloads.slideheroes.com/${filename || `${id.substring(0, 8)}.pdf`}`,
  // Other properties
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
}
```

## Implementation Strategy

### 1. Development Testing

- Implement the SQL updates in a development environment first
- Verify that downloads display and function correctly in the UI
- Confirm URL formats use the custom domain
- Test the relationship queries with various lessons

### 2. Content Migration Integration

- Add the fix script to be called during the loading phase of the content migration process
- Update the `reset-and-migrate.ps1` script to include this step
- Add verification of download relationships to the validation phase

```typescript
// Example integration in content migration orchestration
// In scripts/orchestration/phases/loading.ps1

# Execute the downloads relationship fix
Write-Host "Fixing downloads relationships..."
try {
    Execute-ContentMigrationScript "repair:fix-downloads-relationships" -Continue
} catch {
    Write-Host "Error fixing downloads relationships: $_" -ForegroundColor Red
    # Continue with warnings but don't fail the migration
}
```

### 3. Verification

- Add specific verification for downloads after the fix is applied
- Check that relationship tables are populated
- Verify that downloads appear correctly on lesson pages
- Test actual download functionality

## Potential Risks and Mitigations

1. **File Naming Mismatches**:
   - Risk: R2 file names might not exactly match our mapping assumptions
   - Mitigation: Use flexible matching patterns and fallback mechanisms
2. **Custom Domain Configuration**:
   - Risk: Cloudflare R2 custom domain might have specific requirements
   - Mitigation: Test with actual files in development first
3. **Content Migration Conflicts**:

   - Risk: The fix might be overwritten by subsequent migrations
   - Mitigation: Integrate into the official migration flow to ensure it's always applied

4. **Multiple Download Relationships**:
   - Risk: Some lessons might need multiple downloads
   - Mitigation: Ensure our SQL supports multiple relationships per lesson

## Expected Results

After implementing these changes:

1. Downloads will display with proper names in the UI (not "placeholder.pdf")
2. Download links will point to valid URLs with the custom domain
3. Lessons will correctly show their associated downloads
4. The custom domain configuration will be fully utilized
5. The fallback mechanism will provide sensible defaults when relationships are missing

This solution will provide a robust and maintainable approach to handling downloads in the course lessons, with proper integration into the content migration system.
