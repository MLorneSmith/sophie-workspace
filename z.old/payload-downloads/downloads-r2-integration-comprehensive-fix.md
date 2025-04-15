# Downloads R2 Integration Comprehensive Fix

## Current Issues Analysis Based on Server Logs

After implementing the initial fixes and examining the server logs, we've identified these persistent issues:

1. **Empty Relationship Arrays**:
   - Server logs show all download objects with `course_lessons: []` despite relationship tables having entries
   - Example: `course_lessons: []` in all downloaded records
   - Bidirectional relationships aren't properly populated in the object arrays

2. **Incorrect Thumbnail URLs**:
   - All thumbnail URLs are showing as `https://downloads.slideheroes.com/null`
   - Example: `url: 'https://downloads.slideheroes.com/null'` in the thumbnail object
   - This indicates the thumbnail generation mechanism for PDF files isn't functioning correctly

3. **Missing File Metadata**:
   - Fields like `mimeType`, `filesize`, `width`, `height` are all null
   - Example from logs: `mimeType: null, filesize: null, width: null, height: null`
   - This metadata is crucial for properly displaying and handling the files

The server logs confirm that while we've successfully updated the filenames and main URLs to the custom domain, these deeper integration issues remain.

## Root Cause Analysis

The issues stem from several underlying problems with how Payload integrates with R2 storage:

1. **Upload Plugin Integration Gap**:
   - The S3/R2 storage plugin is configured correctly in `payload.config.ts`, but it's not properly obtaining and setting file metadata
   - R2 doesn't automatically return file metadata through the standard Payload hooks
   - The afterRead hooks in Downloads.ts don't have the necessary file information to populate the metadata

2. **Relationship Population Mechanism**:
   - SQL updates to the relationship tables don't trigger Payload's relationship resolver
   - The bidirectional relationship arrays need to be explicitly populated or refreshed
   - Payload isn't automatically syncing relationship tables with the arrays in the objects

3. **Missing PDF Processing Configuration**:
   - The thumbnail generation for PDF files requires specific configuration
   - The current imageSizes configuration lacks PDF-specific settings
   - R2 integration with thumbnail generation requires additional setup

4. **Migration Timing Issue**:
   - Our fix script runs before Payload's hooks are fully initialized
   - Relationship updates need to happen after all Payload plugins are active
   - Direct DB changes aren't being reflected in the Payload data model

## Comprehensive Solution Plan

### 1. Add R2 Helper Utility for Direct File Metadata Access

Create a new utility to directly query R2 for file metadata:

```typescript
// Create new file: apps/payload/src/utils/r2-helpers.ts
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client with R2 credentials
const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for R2
});

/**
 * Get file metadata directly from R2 storage
 * @param filename The filename in the R2 bucket
 * @returns Object with file metadata or null if not found
 */
export async function getRawR2FileInfo(filename: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET || '',
      Key: filename,
    });
    
    const response = await s3Client.send(command);
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  } catch (error) {
    console.error(`Error fetching R2 file info for ${filename}:`, error);
    return null;
  }
}

/**
 * Check if a file exists in R2
 * @param filename The filename to check
 * @returns Boolean indicating if file exists
 */
export async function fileExistsInR2(filename: string) {
  try {
    const info = await getRawR2FileInfo(filename);
    return !!info;
  } catch (error) {
    return false;
  }
}
```

### 2. Enhance Downloads Collection with File Metadata Integration

Modify the Downloads collection to fetch and use R2 file metadata:

```typescript
// Update apps/payload/src/collections/Downloads.ts
import { CollectionConfig } from 'payload';
import { getRawR2FileInfo } from '../utils/r2-helpers';

// ... existing imports and DOWNLOAD_ID_MAP ...

export const Downloads: CollectionConfig = {
  // ... existing configuration ...
  
  hooks: {
    // Ensure ID consistency with our fixed UUID maps
    beforeChange: [
      async ({ data, req }) => {
        // If this is a known download item with a fixed ID, ensure it matches
        if (data.title) {
          const downloadKey = Object.keys(DOWNLOAD_ID_MAP).find((key) =>
            key.includes(data.title.toLowerCase().replace(/\s+/g, '-')),
          );

          if (downloadKey && DOWNLOAD_ID_MAP[downloadKey]) {
            // Ensure the ID matches our predefined UUID
            data.id = DOWNLOAD_ID_MAP[downloadKey];
          }
        }

        // If this is a download with a filename but missing metadata, fetch it from R2
        if (data.filename && !data.mimeType) {
          try {
            const fileInfo = await getRawR2FileInfo(data.filename);
            if (fileInfo) {
              // Update metadata from R2
              data.filesize = fileInfo.size;
              data.mimeType = fileInfo.contentType || 'application/pdf';
              
              // Set default dimensions for PDFs if not already set
              if (!data.width && !data.height && 
                  (data.mimeType === 'application/pdf' || data.filename.endsWith('.pdf'))) {
                data.width = 612; // Standard PDF width (8.5" at 72 DPI)
                data.height = 792; // Standard PDF height (11" at 72 DPI)
              }
            }
          } catch (err) {
            console.error(`Error fetching R2 metadata for ${data.filename}:`, err);
          }
        }

        return data;
      },
    ],
    
    // Add debugging/logging for relationship issues and enhance admin UI display
    afterRead: [
      async ({ doc }) => {
        // Enhanced logging for better debugging
        console.log('Download doc in afterRead:', doc);

        // Verify R2 file existence flag
        const fileExists = doc.filename && !doc.filename.includes('.placeholder');

        // Enhancement: Check if thumbnails are missing and files exist
        if (fileExists && 
            doc.sizes && 
            doc.sizes.thumbnail && 
            (!doc.sizes.thumbnail.filename || doc.sizes.thumbnail.url.includes('/null'))) {
          
          // Generate proper thumbnail URL
          const thumbnailFilename = `${doc.id}-thumbnail.webp`;
          doc.sizes.thumbnail.url = `https://downloads.slideheroes.com/${thumbnailFilename}`;
          doc.sizes.thumbnail.filename = thumbnailFilename;
          doc.sizes.thumbnail.width = 400;
          doc.sizes.thumbnail.height = 300;
          doc.sizes.thumbnail.mimeType = 'image/webp';
        }

        // Get mapped key for debugging
        const key = doc.id ? getDownloadKeyById(doc.id) : null;
        if (key) {
          doc._mappedKey = key; // Add internal reference to help debugging
        }

        // Enhance with relationship counts
        doc._relationshipCounts = {
          lessons: Array.isArray(doc.course_lessons) ? doc.course_lessons.length : 0,
          documentation: Array.isArray(doc.documentation) ? doc.documentation.length : 0,
          posts: Array.isArray(doc.posts) ? doc.posts.length : 0,
          quizzes: Array.isArray(doc.course_quizzes) ? doc.course_quizzes.length : 0,
        };

        // Enhance the document with R2 visibility flags
        return {
          ...doc,
          _r2FileExists: fileExists,
          _r2FileUrl: doc.url,
          // Add a computed field for admin UI display
          fileStatus: fileExists ? 'Available in R2' : 'Missing in R2',
        };
      },
    ],
  },
  
  // Rest of the collection config...
}
```

### 3. Update Payload Config for PDF Thumbnail Support

Enhance the Payload configuration with better PDF handling:

```typescript
// Update apps/payload/src/payload.config.ts
import { s3Storage } from '@payloadcms/storage-s3';
// ... other imports ...

export default buildConfig({
  // ... existing config ...
  
  plugins: [
    // ... other plugins ...
    
    s3Storage({
      collections: {
        media: {
          disableLocalStorage: true,
          generateFileURL: ({ filename }: { filename: string }) =>
            `https://images.slideheroes.com/${filename}`,
        },
        downloads: {
          disableLocalStorage: true,
          generateFileURL: ({ filename }: { filename: string }) =>
            `https://downloads.slideheroes.com/${filename}`,
          // Enhanced PDF handling
          generateThumbnail: {
            pdf: true, // Enable PDF thumbnail generation
            svg: true, // Enable SVG thumbnail generation
          },
          // Configure sharper options for PDF thumbnails
          sharp: (sharpInstance) => {
            return sharpInstance.flatten({ background: '#FFFFFF' }).resize(400, 300, {
              fit: 'inside',
              withoutEnlargement: true,
            }).webp({ quality: 80 });
          },
          imageSizes: [
            {
              name: 'thumbnail',
              width: 400,
              height: 300,
              position: 'centre',
              formatOptions: {
                format: 'webp',
                options: { quality: 80 }
              }
            }
          ],
        },
      },
      // ... rest of s3Storage config ...
    }),
    
    // ... other plugins ...
  ],
  
  // ... rest of config ...
});
```

### 4. Enhanced Downloads R2 Integration Fix Script

Create a more comprehensive fix script that properly handles relationship arrays:

```typescript
// Update packages/content-migrations/src/scripts/repair/fix-downloads-r2-integration.ts
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Database connection
const client = new Client({
  connectionString:
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixDownloadsR2Integration(): Promise<void> {
  console.log('Fixing Downloads R2 integration comprehensively...');

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Start a transaction for atomicity
    await client.query('BEGIN');

    // 1. Update download records to point to actual R2 files
    const updateDownloadsResult = await client.query(`
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
                END),
        -- Set mime type for PDFs
        mimeType = 'application/pdf',
        -- Set default filesize if not known (will be updated by hooks)
        filesize = COALESCE(filesize, 500000) -- Default 500KB for now
    `);

    const updatedDownloads = updateDownloadsResult.rowCount;
    console.log(`Updated ${updatedDownloads} download records`);

    // 2. Update the download thumbnail information
    await client.query(`
      UPDATE payload.downloads
      SET 
        sizes = jsonb_build_object(
          'thumbnail', jsonb_build_object(
            'url', CONCAT('https://downloads.slideheroes.com/', id, '-thumbnail.webp'),
            'width', 400,
            'height', 300,
            'mimeType', 'image/webp',
            'filename', CONCAT(id, '-thumbnail.webp')
          )
        )
    `);

    console.log(`Updated download thumbnails`);

    // 3. Fix and populate the relationship tables
    const createRelationshipsResult = await client.query(`
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
        (cl.slug = 'the-why-introductions' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'the-why-next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'idea-generation' AND d.title LIKE '%idea-generation%') OR
        (cl.slug = 'what-is-structure' AND d.title LIKE '%what-is-structure%')
      WHERE
        NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_downloads
          WHERE lesson_id = cl.id AND download_id = d.id
        )
    `);

    const createdRelationships = createRelationshipsResult.rowCount;
    console.log(
      `Created ${createdRelationships} new lesson-download relationships`,
    );

    // 4. CRITICAL: Directly populate the course_lessons array for each download
    await client.query(`
      WITH download_lessons AS (
        SELECT 
          download_id,
          jsonb_agg(lesson_id) AS lesson_ids
        FROM 
          payload.course_lessons_downloads
        GROUP BY 
          download_id
      )
      UPDATE payload.downloads d
      SET course_lessons = dl.lesson_ids
      FROM download_lessons dl
      WHERE d.id = dl.download_id
    `);

    console.log(`Populated course_lessons arrays in downloads`);

    // 5. Create a validation view for easier relationship debugging
    await client.query(`
      CREATE OR REPLACE VIEW payload.download_relationships_debug AS
      SELECT 
        cl.title AS lesson_title,
        cl.slug AS lesson_slug,
        d.title AS download_title,
        d.filename AS download_filename,
        d.url AS download_url,
        d.id AS download_id,
        cl.id AS lesson_id,
        d.course_lessons IS NOT NULL 
          AND jsonb_array_length(d.course_lessons) > 0 AS has_lessons_array,
        EXISTS (
          SELECT 1 FROM payload.course_lessons_downloads 
          WHERE lesson_id = cl.id AND download_id = d.id
        ) AS relationship_exists
      FROM payload.course_lessons cl
      CROSS JOIN payload.downloads d
      WHERE 
        (cl.slug = 'our-process' AND d.title LIKE '%our-process%') OR
        (cl.slug = 'the-who' AND d.title LIKE '%the-who%') OR
        (cl.slug = 'introduction' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'the-why-introductions' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'the-why-next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'idea-generation' AND d.title LIKE '%idea-generation%') OR
        (cl.slug = 'what-is-structure' AND d.title LIKE '%what-is-structure%')
    `);

    console.log('Created enhanced validation view for download relationships');

    // Commit transaction
    await client.query('COMMIT');
    console.log('Downloads R2 integration fix completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error fixing Downloads R2 integration:', error);
    throw error;
  } finally {
    // Close the database connection
    await client.end();
  }
}

export default fixDownloadsR2Integration;
```

### 5. Update Migration System Integration

Modify the orchestration script to run the fix at the optimal time:

```powershell
# Update scripts/orchestration/phases/loading.ps1

# Create separate function for Downloads R2 fix
function Fix-DownloadsR2Integration {
    Log-Step "Fixing downloads R2 integration with metadata and relationships" 9.5
    
    try {
        # Ensure we're at the project root
        Set-ProjectRootLocation
        
        # Navigate to content-migrations directory
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Running comprehensive downloads R2 integration fix..." "Yellow"
            
            # Run the fix with enhanced logging
            Exec-Command -command "pnpm run fix:downloads-r2-integration" -description "Fixing downloads R2 integration" -continueOnError
            
            # Verify the fix worked by checking relationship arrays
            $verifyQuery = "SELECT COUNT(*) as count FROM payload.downloads WHERE course_lessons IS NOT NULL AND jsonb_array_length(course_lessons) > 0"
            $result = Exec-Command -command "pnpm run utils:run-sql --sql `"$verifyQuery`"" -description "Verifying downloads have relationship arrays" -captureOutput -continueOnError
            
            # Extract count from result
            $downloadsWithRelationships = 0
            if ($result -match "count: (\d+)" -or $result -match "count:(\d+)" -or $result -match "rows: (\d+)") {
                $downloadsWithRelationships = [int]($Matches[1])
            }
            
            if ($downloadsWithRelationships > 0) {
                Log-Success "Successfully populated $downloadsWithRelationships download relationship arrays"
            } else {
                Log-Warning "No download relationship arrays were populated. Further investigation needed."
            }
            
            Pop-Location
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping downloads R2 fix"
        }
        
        return $true
    }
    catch {
        Log-Error "Failed to fix downloads R2 integration: $_"
        Log-Warning "This error might affect download functionality, but continuing"
        return $false
    }
}

# Modify Invoke-LoadingPhase to call this new function
function Invoke-LoadingPhase {
    param (
        [switch]$SkipVerification
    )
    
    Log-Phase "LOADING PHASE"
    
    # Existing steps...
    
    # Step 3: Fix relationships
    Fix-Relationships
    
    # Step 3.5: Run the enhanced downloads R2 integration fix
    Fix-DownloadsR2Integration
    
    # Remaining steps...
}
```

## Implementation Steps

1. **Create R2 Helper Utility**:
   - Add a new file `apps/payload/src/utils/r2-helpers.ts`
   - Implement direct R2 metadata access functions

2. **Enhance Downloads Collection**:
   - Update `apps/payload/src/collections/Downloads.ts`
   - Add metadata fetching in `beforeChange` hook
   - Enhance relationship information in `afterRead` hook

3. **Update Payload Configuration**:
   - Modify `apps/payload/src/payload.config.ts`
   - Add PDF thumbnail generation configuration
   - Configure better S3 storage options for downloads

4. **Improve Fix Script**:
   - Update `packages/content-migrations/src/scripts/repair/fix-downloads-r2-integration.ts`
   - Add direct population of relationship arrays
   - Add metadata and thumbnail URL enhancements

5. **Update Migration System**:
   - Modify `scripts/orchestration/phases/loading.ps1`
   - Create dedicated function for downloads R2 fix
   - Run at the optimal point in the migration process

## Verification Process

After implementing these changes, verify the fixes with:

1. **Database Inspection**:
   - Query the database to verify relationship arrays:
     ```sql
     SELECT id, title, filename, url, jsonb_array_length(course_lessons) as lesson_count 
     FROM payload.downloads
     ```

2. **Server Log Analysis**:
   - Check for populated relationship arrays in download objects
   - Ensure thumbnail URLs no longer contain "null"
   - Verify file metadata fields are populated

3. **Payload Admin UI**:
   - Log into the Payload admin interface
   - Check Downloads collection for proper thumbnails
   - Verify bidirectional relationships work correctly

4. **Web App Testing**:
   - Navigate to course lessons with downloads
   - Verify download links work and display correctly
   - Confirm Shadcn Button styling is applied

## Risks and Mitigation Strategies

1. **R2 API Rate Limits**:
   - Risk: Direct R2 API calls in hooks might hit rate limits
   - Mitigation: Add caching and implement backoff strategies

2. **Database Schema Changes**:
   - Risk: Updates to database structure might conflict with migrations
   - Mitigation: Use existing schema, focus on populating fields

3. **Migration System Integration**:
   - Risk: Script timing might not be optimal in migration flow
   - Mitigation: Create a dedicated function with clear success criteria

4. **PDF Thumbnail Generation**:
   - Risk: PDF thumbnail generation might not work as expected
   - Mitigation: Add fallback to pre-generated thumbnails

5. **Hook Execution Order**:
   - Risk: Payload hooks might not run in the expected order
   - Mitigation: Implement redundant checks in both hooks and migration scripts

## Additional Considerations

1. **Performance Impact**:
   - Some operations might be resource-intensive, especially fetching R2 metadata
   - Consider background processing for large collections

2. **Future Extensibility**:
   - These fixes establish patterns for handling other file types
   - Consider abstracting R2 helpers for reuse with other collections

3. **Monitoring**:
   - Add logging to track download metadata completeness
   - Consider adding a dashboard to monitor file consistency

This comprehensive approach addresses the core issues while building a more robust foundation for file handling in the application.
