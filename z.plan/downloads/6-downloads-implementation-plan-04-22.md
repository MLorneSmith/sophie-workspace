# Downloads Collection Implementation Plan

## Table of Contents
1. [Overview](#overview)
2. [Current Issues](#current-issues)
3. [Implementation Strategy](#implementation-strategy)
4. [Detailed Implementation Steps](#detailed-implementation-steps)
5. [Integration with Content Migration System](#integration-with-content-migration-system)
6. [Testing Strategy](#testing-strategy)
7. [Environmental Variables Management](#environmental-variables-management)

## Overview

This document outlines the implementation plan for simplifying the Downloads collection in our Payload CMS integration. We're addressing several issues with the current implementation, particularly around type inconsistencies, bidirectional relationships, and overly complex hook logic.

Our approach leverages official Payload CMS adapters and best practices to create a more maintainable and robust implementation while preserving all existing functionality and content.

## Current Issues

Based on our analysis of the current implementation, we've identified several key issues:

1. **Mixed ID Types**
   - The `downloads` table uses TEXT for its `id` column, while many related tables expect UUID
   - Causes PostgreSQL errors like `operator does not exist: uuid = text`
   - Requires complex type conversion in hooks

2. **Hardcoded Static UUIDs**
   - The collection relies on a `DOWNLOAD_ID_MAP` with predefined UUIDs
   - Creates tight coupling between IDs and code
   - Adds maintenance overhead

3. **Bidirectional Relationship Complexity**
   - Downloads maintains relationships with lessons, documentation, posts, and quizzes
   - Each relationship requires special handling code
   - Complicates updates and maintenance

4. **Custom R2 Storage Implementation**
   - Custom hooks for R2 file handling rather than using official adapters
   - Special case logic for different file types
   - Inconsistent handling between file storage and retrieval

5. **Hook Overengineering**
   - Complex hooks with multiple special case logic branches
   - Extensive transformation logic in afterRead hook
   - Difficult to maintain and debug

## Implementation Strategy

Our implementation strategy focuses on simplifying the collection while maintaining compatibility with existing content:

1. **Standardize on UUID Type**
   - Ensure all IDs use UUID type consistently
   - Add a PostgreSQL function for safe type comparisons
   - Update related junction tables to match

2. **Use Official Adapters**
   - Implement the official Payload S3 adapter for R2 storage
   - Remove custom R2 integration code
   - Leverage built-in functionality for uploads and storage

3. **Simplify to One-way Relationships**
   - Remove bidirectional relationships from the Downloads collection
   - Maintain relationships from content (lessons, docs, etc.) to downloads
   - Simplify relationship management

4. **Reduce Hook Complexity**
   - Remove complex transformation hooks
   - Keep minimal hooks for admin UI enhancements
   - Improve maintainability and performance

5. **Maintain Content Compatibility**
   - Preserve existing download IDs and files
   - Ensure frontend display remains consistent
   - Support content migration system

## Detailed Implementation Steps

### 1. Create R2 Adapter Utility

First, we'll create a reusable R2 adapter utility that leverages the official Payload S3 adapter:

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
  });
};
```

### 2. Create UUID Consistency Migration

Next, we'll create a migration to establish a consistent UUID handling approach:

```typescript
// apps/payload/src/migrations/20250422_uuid_consistency.ts
import { MigrationFunction } from '@payloadcms/db-postgres';

export const uuidConsistency: MigrationFunction = async ({ payload }) => {
  const sql = [
    `
    -- Create safe UUID comparison function
    CREATE OR REPLACE FUNCTION payload.safe_id_compare(id1 anyelement, id2 anyelement)
    RETURNS boolean AS $$
    BEGIN
      IF id1 IS NULL OR id2 IS NULL THEN
        RETURN FALSE;
      END IF;
      BEGIN
        RETURN CASE
          WHEN pg_typeof(id1) = 'uuid'::regtype AND pg_typeof(id2) = 'text'::regtype
            THEN id1 = id2::uuid
          WHEN pg_typeof(id1) = 'text'::regtype AND pg_typeof(id2) = 'uuid'::regtype
            THEN id1::uuid = id2
          ELSE id1::text = id2::text
        END;
      EXCEPTION WHEN others THEN
        RETURN id1::text = id2::text;
      END;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
    
    -- Ensure the downloads table uses UUID consistently
    ALTER TABLE IF EXISTS payload.downloads
    ALTER COLUMN id TYPE uuid USING id::uuid;
    `,
  ];

  for (const statement of sql) {
    await payload.db.raw(statement);
  }
};
```

### 3. Simplify Downloads Collection

Now we'll rewrite the Downloads collection to be much simpler:

```typescript
// apps/payload/src/collections/Downloads.ts
import { CollectionConfig } from 'payload';
import { createR2Adapter } from '../utils/r2-adapter';

const r2Adapter = createR2Adapter();

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: {
    singular: 'Download',
    plural: 'Downloads',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'filename'],
    description: 'Downloadable files for lessons and documentation',
  },
  access: {
    read: () => true, // Public read access
  },
  upload: {
    storage: r2Adapter,
    adminThumbnail: 'thumbnail',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'application/zip',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
  },
  hooks: {
    // Minimal hook for file type detection and display
    afterRead: [
      async ({ doc }) => {
        // Basic file type detection
        const isZipFile =
          doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip';
        const isPdfFile =
          doc.filename?.endsWith('.pdf') || doc.mimeType === 'application/pdf';

        return {
          ...doc,
          _fileType: isZipFile ? 'zip' : isPdfFile ? 'pdf' : 'other',
        };
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'PowerPoint Template',
          value: 'pptx_template',
        },
        {
          label: 'Worksheet',
          value: 'worksheet',
        },
        {
          label: 'Reference',
          value: 'reference',
        },
        {
          label: 'Example',
          value: 'example',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      required: true,
    },
    // No relationship fields - we'll handle relationships from the other side
  ],
};
```

### 4. Update Course Lessons Collection

We need to ensure the course lessons collection maintains one-way relationships to downloads:

```typescript
// Update in apps/payload/src/collections/CourseLessons.ts
// Add this to the fields array:
{
  name: 'downloads',
  type: 'relationship',
  relationTo: 'downloads',
  hasMany: true,
  admin: {
    description: 'Downloadable files for this lesson',
  },
}
```

Similar updates would be needed for documentation, posts, and course_quizzes collections.

### 5. Create Modified Download Import Script

We'll need to modify how downloads are imported during the content migration process:

```typescript
// packages/content-migrations/src/scripts/import/import-r2-downloads.ts
import { Client } from 'pg';
import { DOWNLOAD_ID_MAP, LESSON_DOWNLOADS_MAPPING } from '../../data/mappings/download-mappings';

export async function importDownloads(): Promise<void> {
  console.log('Importing downloads...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:54322/postgres',
  });
  
  try {
    await client.connect();
    await client.query('BEGIN');
    
    // 1. Insert download records using our mapping data
    for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
      const title = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const filename = `${title}.${key.includes('slides') ? 'pdf' : 'zip'}`;
      const mimeType = key.includes('slides') ? 'application/pdf' : 'application/zip';
      const url = `https://downloads.slideheroes.com/${filename}`;
      
      // Insert the download record
      await client.query(`
        INSERT INTO payload.downloads (
          id, title, filename, url, "mimeType", type
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) ON CONFLICT (id) DO UPDATE SET
          title = $2,
          filename = $3,
          url = $4,
          "mimeType" = $5,
          type = $6
      `, [
        id,
        title,
        filename,
        url,
        mimeType,
        key.includes('slides') ? 'example' : 'reference',
      ]);
    }
    
    // 2. Create lesson-to-download relationships
    for (const [lessonSlug, downloadKeys] of Object.entries(LESSON_DOWNLOADS_MAPPING)) {
      // Get the lesson ID based on slug
      const lessonResult = await client.query(
        `SELECT id FROM payload.course_lessons WHERE slug = $1`,
        [lessonSlug]
      );
      
      if (lessonResult.rows.length > 0) {
        const lessonId = lessonResult.rows[0].id;
        
        // Create relationships for each download
        for (const downloadKey of downloadKeys) {
          const downloadId = DOWNLOAD_ID_MAP[downloadKey];
          
          if (downloadId) {
            // Generate a UUID for the relationship record
            await client.query(`
              INSERT INTO payload.course_lessons_downloads (
                id, course_lessons_id, downloads_id, "order"
              ) VALUES (
                gen_random_uuid(), $1, $2, 0
              ) ON CONFLICT DO NOTHING
            `, [lessonId, downloadId]);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Downloads import completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing downloads:', error);
    throw error;
  } finally {
    await client.end();
  }
}
```

### 6. Create Download Verification Script

Finally, let's create a verification script to ensure our changes are working correctly:

```typescript
// packages/content-migrations/src/scripts/verification/verify-downloads.ts
import { Client } from 'pg';

export async function verifyDownloads(): Promise<void> {
  console.log('Verifying downloads collection and relationships...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:54322/postgres',
  });
  
  try {
    await client.connect();
    
    // 1. Check if downloads exist
    const downloadCount = await client.query(
      `SELECT COUNT(*) FROM payload.downloads`
    );
    
    console.log(`Found ${downloadCount.rows[0].count} downloads in database`);
    
    // 2. Check if relationships exist
    const relationshipCount = await client.query(
      `SELECT COUNT(*) FROM payload.course_lessons_downloads`
    );
    
    console.log(`Found ${relationshipCount.rows[0].count} lesson-download relationships`);
    
    // 3. Test a specific mapping to verify correctness
    const specificLessonDownloads = await client.query(`
      SELECT d.title, d.id, d.filename, d.url
      FROM payload.course_lessons cl
      JOIN payload.course_lessons_downloads cld ON cl.id = cld.course_lessons_id
      JOIN payload.downloads d ON d.id = cld.downloads_id
      WHERE cl.slug = 'tools-and-resources'
    `);
    
    console.log(`Found ${specificLessonDownloads.rows.length} downloads for 'tools-and-resources' lesson`);
    specificLessonDownloads.rows.forEach(row => {
      console.log(`- ${row.title}: ${row.url}`);
    });
    
    // 4. Verify the UUID types
    const downloadIdType = await client.query(`
      SELECT pg_typeof(id) AS type FROM payload.downloads LIMIT 1
    `);
    
    console.log(`Download ID type: ${downloadIdType.rows[0]?.type || 'unknown'}`);
    
    if (downloadCount.rows[0].count > 0 && relationshipCount.rows[0].count > 0) {
      console.log('✅ Downloads verification passed!');
    } else {
      console.error('❌ Downloads verification failed: Missing records');
    }
  } catch (error) {
    console.error('Error verifying downloads:', error);
  } finally {
    await client.end();
  }
}
```

## Integration with Content Migration System

To integrate with our content migration system (`reset-and-migrate.ps1`), we'll ensure our changes align with the existing phases:

### Setup Phase

1. **Install Dependencies**
   - Add the Payload S3 adapter
   - `pnpm add @payloadcms/storage-s3 @aws-sdk/client-s3 --filter apps/payload`

2. **Add Migration File**
   - Include our UUID consistency migration in the migration sequence
   - This will be applied during the Payload migrations step

### Processing Phase

This phase doesn't require significant changes as we're keeping our existing download mappings structure.

### Loading Phase

1. **Update Download Import Process**
   - Modify the download import script to use our new approach
   - Ensure it creates the correct one-way relationships

2. **Add Verification Step**
   - Add our download verification script to the verification phase
   - This will confirm our changes are working correctly

## Testing Strategy

After implementing these changes, we'll test thoroughly to ensure everything works correctly:

1. **Reset and Migrate Testing**
   - Run the full `reset-and-migrate.ps1` script
   - Check logs for any errors or warnings
   - Verify database schema is correct

2. **Admin Interface Testing**
   - Login to Payload CMS admin
   - Confirm downloads appear correctly
   - Test uploading a new download
   - Verify relationship fields in lessons work

3. **Frontend Testing**
   - Browse to lesson pages with downloads
   - Verify downloads appear correctly
   - Test download functionality

4. **R2 Integration Testing**
   - Verify files are accessible from R2
   - Test the upload process
   - Check thumbnail generation

## Environmental Variables Management

We need to ensure R2 configuration is available in both development and production:

### Development Environment

R2 configuration is already present in `apps/payload/.env`:
```
R2_BUCKET=media
R2_ACCESS_KEY_ID=7e6826129bd020f755f213684bb2e038
R2_SECRET_ACCESS_KEY=ee762c51aa7b9a3893bc9dca4b4085ae5d74fd611a436ed158c571d13785cd0c
R2_ENDPOINT=https://d33fc17df32ce7d9d48eb8045f1d340a.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCOUNT_ID=d33fc17df32ce7d9d48eb8045f1d340a
```

### Production Environment

We need to add R2 configuration to `apps/payload/.env.production`:
```
# R2 Configuration for Production
R2_BUCKET=media
R2_ACCESS_KEY_ID=7e6826129bd020f755f213684bb2e038
R2_SECRET_ACCESS_KEY=ee762c51aa7b9a3893bc9dca4b4085ae5d74fd611a436ed158c571d13785cd0c
R2_ENDPOINT=https://d33fc17df32ce7d9d48eb8045f1d340a.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCOUNT_ID=d33fc17df32ce7d9d48eb8045f1d340a
```

**Note:** In a real production environment, we would consider using different API keys for development and production, and storing them securely. However, for the current implementation, we'll use the same keys for consistency.
