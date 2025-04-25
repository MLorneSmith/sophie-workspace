# Comprehensive Payload CMS Content Fix Plan

## Problem Summary

Our Payload CMS integration is experiencing multiple issues with content display:

1. Some collections (Documentation, Private Posts, Surveys, etc.) show entries but clicking them displays nothing
2. Quiz entries display "Nothing Found" errors
3. File references show 500 errors with "NoSuchKey" messages
4. Database errors about missing columns in UUID tables appear in logs

## Root Causes

Based on thorough analysis, we've identified these interconnected issues:

1. **UUID Table Column Issues**

   - Dynamically generated UUID tables missing required columns (e.g., `private_id`)
   - Inconsistent column types between UUID tables
   - Missing fallback mechanisms when UUID tables fail

2. **Quiz-Question Relationship Inconsistencies**

   - Data exists in both direct references and relationship tables
   - Unidirectional relationships not properly maintained
   - Missing or inconsistent quiz-to-question references

3. **S3 Storage Reference Problems**

   - Database references files that don't exist in S3 storage
   - Thumbnail references particularly problematic
   - No fallback for missing media files

4. **Incomplete Relationship Repair**
   - Fix for Posts collection successful, but other collections still have issues
   - Repair scripts may not be running completely or in correct order

## Implementation Plan

We'll address these issues in four phases, each building on the previous:

### Phase 1: Enhanced UUID Table Management

#### 1.1 Create Metadata-Based UUID Table Detection

```typescript
// packages/content-migrations/src/scripts/repair/database/metadata-based-uuid-detection.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../utils/db/payload-client';

export async function detectUuidTablesFromMetadata() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;

  // Query PostgreSQL metadata tables for UUID pattern tables
  const tablesResult = await drizzle.execute(sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'payload' 
    AND (
      -- Matches UUID pattern tables
      tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' 
      OR 
      -- Matches relationship tables with _rels suffix
      tablename LIKE '%_rels'
    )
  `);

  return tablesResult.map((row) => row.tablename);
}

export async function getColumnInfo(tableName: string) {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;

  // Get column information from PostgreSQL information_schema
  const columnsResult = await drizzle.execute(sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns
    WHERE table_schema = 'payload' AND table_name = ${tableName}
  `);

  return columnsResult;
}
```

#### 1.2 Create Robust Column Addition System

```typescript
// packages/content-migrations/src/scripts/repair/database/enhanced-column-management.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../utils/db/payload-client';
import {
  detectUuidTablesFromMetadata,
  getColumnInfo,
} from './metadata-based-uuid-detection';

// Required columns for all UUID tables
const REQUIRED_COLUMNS = [
  { name: 'id', type: 'text', nullable: false },
  { name: 'parent_id', type: 'text', nullable: true },
  { name: 'path', type: 'text', nullable: true },
  { name: 'private_id', type: 'text', nullable: true },
  { name: 'order', type: 'integer', nullable: true },
];

export async function ensureRequiredColumnsExist() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;
  const uuidTables = await detectUuidTablesFromMetadata();
  const results = [];

  // Process each UUID table
  for (const tableName of uuidTables) {
    // Get existing columns
    const existingColumns = await getColumnInfo(tableName);
    const existingColumnNames = existingColumns.map((col) => col.column_name);

    // Begin transaction
    await drizzle.execute(sql`BEGIN`);

    try {
      // Add missing columns with proper error handling
      for (const column of REQUIRED_COLUMNS) {
        if (!existingColumnNames.includes(column.name)) {
          try {
            const nullableText = column.nullable ? 'NULL' : 'NOT NULL';
            await drizzle.execute(
              sql.raw(`
              ALTER TABLE payload.${tableName} 
              ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${nullableText}
            `),
            );
            results.push(`Added ${column.name} to ${tableName}`);
          } catch (error) {
            console.error(
              `Error adding ${column.name} to ${tableName}:`,
              error,
            );
            results.push(
              `Failed to add ${column.name} to ${tableName}: ${error.message}`,
            );
            // Continue with other columns even if one fails
          }
        }
      }

      // Commit transaction if successful
      await drizzle.execute(sql`COMMIT`);
    } catch (error) {
      // Rollback transaction on error
      await drizzle.execute(sql`ROLLBACK`);
      console.error(`Transaction failed for ${tableName}:`, error);
      results.push(`Transaction failed for ${tableName}: ${error.message}`);
    }
  }

  return results;
}
```

#### 1.3 Implement Runtime Monitoring System

```typescript
// packages/content-migrations/src/scripts/repair/database/runtime-uuid-monitor.ts
import fs from 'fs';
import path from 'path';

import { getPayloadClient } from '../../utils/db/payload-client';
import { ensureRequiredColumnsExist } from './enhanced-column-management';

// Create a database function to monitor for new UUID tables
export async function createUuidTableMonitorFunction() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;

  // Create SQL function to detect and fix UUID tables
  await drizzle.execute(sql`
    CREATE OR REPLACE FUNCTION payload.monitor_uuid_tables()
    RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      obj record;
      tablename text;
    BEGIN
      FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
        IF obj.command_tag = 'CREATE TABLE' AND obj.schema_name = 'payload' THEN
          tablename := obj.object_identity;
          
          -- Check if the table matches UUID pattern
          IF tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' OR tablename LIKE '%_rels' THEN
            -- Add required columns
            EXECUTE format('
              ALTER TABLE %s 
              ADD COLUMN IF NOT EXISTS id text,
              ADD COLUMN IF NOT EXISTS parent_id text,
              ADD COLUMN IF NOT EXISTS path text,
              ADD COLUMN IF NOT EXISTS private_id text,
              ADD COLUMN IF NOT EXISTS "order" integer
            ', tablename);
            
            -- Log the event
            INSERT INTO payload.uuid_table_monitor(table_name, monitored_at, action)
            VALUES (tablename, now(), 'auto_fixed');
          END IF;
        END IF;
      END LOOP;
    END;
    $$;
  `);

  // Create monitoring table if it doesn't exist
  await drizzle.execute(sql`
    CREATE TABLE IF NOT EXISTS payload.uuid_table_monitor (
      id SERIAL PRIMARY KEY,
      table_name TEXT NOT NULL,
      monitored_at TIMESTAMP NOT NULL DEFAULT NOW(),
      action TEXT NOT NULL
    )
  `);

  // Create event trigger
  await drizzle.execute(sql`
    DROP EVENT TRIGGER IF EXISTS uuid_table_monitor_trigger;
    CREATE EVENT TRIGGER uuid_table_monitor_trigger
    ON ddl_command_end
    WHEN tag IN ('CREATE TABLE')
    EXECUTE FUNCTION payload.monitor_uuid_tables();
  `);

  return 'UUID table monitoring system installed';
}

// Create a simple wrapper script for running all UUID fixes
export async function runComprehensiveUuidFix() {
  try {
    // Fix existing tables
    const columnResults = await ensureRequiredColumnsExist();

    // Set up monitoring for future tables
    const monitorResult = await createUuidTableMonitorFunction();

    return {
      columnResults,
      monitorResult,
      success: true,
    };
  } catch (error) {
    console.error('Error in comprehensive UUID fix:', error);
    return {
      error: error.message,
      success: false,
    };
  }
}

// Main entry point for CLI
if (require.main === module) {
  runComprehensiveUuidFix()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 1.4 Update Package.json Script

Add the following script to `packages/content-migrations/package.json`:

```json
"scripts": {
  "fix:uuid-tables-metadata": "tsx src/scripts/repair/database/runtime-uuid-monitor.ts"
}
```

### Phase 2: Comprehensive Relationship Repair

#### 2.1 Create Unified Quiz-Question Relationship Fix

```typescript
// packages/content-migrations/src/scripts/repair/quiz-management/super-comprehensive-quiz-fix.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../../utils/db/payload-client';

export async function superComprehensiveQuizFix() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;
  const results = {
    fixedQuizzes: 0,
    fixedQuestions: 0,
    fixedRelationships: 0,
    errors: [],
  };

  try {
    // Begin transaction
    await drizzle.execute(sql`BEGIN`);

    // Step 1: Ensure all quizzes have course_id values
    const courseFixResult = await drizzle.execute(sql`
      WITH default_course AS (
        SELECT id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1
      )
      UPDATE payload.course_quizzes
      SET course_id = (SELECT id FROM default_course)
      WHERE course_id IS NULL
      RETURNING id
    `);

    results.fixedQuizzes += courseFixResult.length;

    // Step 2: Fix the _rels tables that handle quiz-question relationships
    const relTablesResult = await drizzle.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'payload' 
      AND tablename LIKE '%_rels' 
      AND (tablename LIKE '%quiz%' OR tablename LIKE '%question%')
    `);

    for (const { tablename } of relTablesResult) {
      try {
        // Add missing columns if needed
        await drizzle.execute(
          sql.raw(`
          ALTER TABLE payload.${tablename}
          ADD COLUMN IF NOT EXISTS id text,
          ADD COLUMN IF NOT EXISTS parent_id text,
          ADD COLUMN IF NOT EXISTS path text,
          ADD COLUMN IF NOT EXISTS private_id text,
          ADD COLUMN IF NOT EXISTS "order" integer
        `),
        );

        results.fixedRelationships++;
      } catch (error) {
        results.errors.push(
          `Error fixing relationship table ${tablename}: ${error.message}`,
        );
      }
    }

    // Step 3: Synchronize direct quiz question references with relationship tables
    const allQuizzes = await payload.find({
      collection: 'course_quizzes',
      limit: 1000,
    });

    for (const quiz of allQuizzes.docs) {
      try {
        // If quiz has questions array
        if (quiz.questions && Array.isArray(quiz.questions)) {
          // Get ordered questions
          const orderedQuestions = quiz.questions.map((q, index) => ({
            id: typeof q === 'string' ? q : q.id,
            order: index,
          }));

          // Clear existing relationships in relationship tables
          await drizzle.execute(
            sql.raw(`
            DELETE FROM payload.course_quizzes_rels
            WHERE parent_id = '${quiz.id}' AND path LIKE '%questions%'
          `),
          );

          // Insert fresh relationships with proper order
          for (const { id, order } of orderedQuestions) {
            await drizzle.execute(
              sql.raw(`
              INSERT INTO payload.course_quizzes_rels (id, parent_id, path, "order")
              VALUES ('${id}', '${quiz.id}', 'questions', ${order})
            `),
            );
          }

          results.fixedQuizzes++;
        } else {
          // Quiz has no questions - check if it should have some in the relationship table
          const relatedQuestions = await drizzle.execute(
            sql.raw(`
            SELECT id, "order" FROM payload.course_quizzes_rels
            WHERE parent_id = '${quiz.id}' AND path LIKE '%questions%'
            ORDER BY "order"
          `),
          );

          if (relatedQuestions.length > 0) {
            // Update quiz with questions from relationship table
            await payload.update({
              collection: 'course_quizzes',
              id: quiz.id,
              data: {
                questions: relatedQuestions.map((q) => q.id),
              },
            });

            results.fixedQuizzes++;
          }
        }
      } catch (error) {
        results.errors.push(`Error fixing quiz ${quiz.id}: ${error.message}`);
      }
    }

    // Commit transaction if successful
    await drizzle.execute(sql`COMMIT`);

    return results;
  } catch (error) {
    // Rollback transaction on error
    await drizzle.execute(sql`ROLLBACK`);
    console.error('Error in superComprehensiveQuizFix:', error);
    results.errors.push(`Transaction error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  superComprehensiveQuizFix()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 2.2 Create Database Views for Stable Relationship Access

```typescript
// packages/content-migrations/src/scripts/repair/database/create-relationship-views.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../../utils/db/payload-client';

export async function createRelationshipViews() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;
  const results = {
    createdViews: [],
    errors: [],
  };

  try {
    // Quiz Questions View
    await drizzle.execute(sql`
      CREATE OR REPLACE VIEW payload.quiz_questions_view AS
      SELECT 
        q.id AS quiz_id,
        q.title AS quiz_title,
        q.slug AS quiz_slug,
        qq.id AS question_id,
        qq.question,
        qq.type,
        qq.options,
        rel."order"
      FROM 
        payload.course_quizzes q
      LEFT JOIN 
        payload.course_quizzes_rels rel ON q.id = rel.parent_id AND rel.path = 'questions'
      LEFT JOIN 
        payload.quiz_questions qq ON rel.id = qq.id
      ORDER BY 
        q.id, rel."order";
    `);
    results.createdViews.push('quiz_questions_view');

    // Downloads Relationships View
    await drizzle.execute(sql`
      CREATE OR REPLACE VIEW payload.downloads_relationships_view AS
      SELECT 
        d.id AS download_id,
        d.title AS download_title,
        d.url AS download_url,
        d.thumbnail AS download_thumbnail,
        rel.parent_id,
        rel.path,
        rel."order"
      FROM 
        payload.downloads d
      LEFT JOIN (
        SELECT * FROM payload.downloads_rels
        UNION
        SELECT * FROM (
          SELECT id, parent_id, path, "order"
          FROM pg_tables pt
          CROSS JOIN LATERAL (
            SELECT id, parent_id, path, "order"
            FROM payload.downloads rels
            WHERE pt.tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
            AND pt.schemaname = 'payload'
          ) as uuid_rels
        ) uuid_tables
      ) rel ON d.id = rel.id;
    `);
    results.createdViews.push('downloads_relationships_view');

    // Helper functions for fallback access
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_quiz_questions(quiz_id TEXT)
      RETURNS TABLE(question_id TEXT, question TEXT, "order" INTEGER)
      LANGUAGE SQL
      AS $$
        SELECT 
          qq.id AS question_id, 
          qq.question, 
          COALESCE(rel."order", 0) AS "order"
        FROM 
          payload.quiz_questions qq
        LEFT JOIN 
          payload.course_quizzes_rels rel ON qq.id = rel.id AND rel.parent_id = quiz_id
        WHERE 
          rel.id IS NOT NULL
        UNION
        SELECT 
          qq.id AS question_id, 
          qq.question, 
          0 AS "order"
        FROM 
          payload.quiz_questions qq
        INNER JOIN 
          payload.course_quizzes q ON q.id = quiz_id AND q.questions @> jsonb_build_array(qq.id::jsonb)
        ORDER BY 
          "order";
      $$;
    `);
    results.createdViews.push('get_quiz_questions function');

    return results;
  } catch (error) {
    console.error('Error creating relationship views:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  createRelationshipViews()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 2.3 Update Package.json Scripts

Add the following scripts to `packages/content-migrations/package.json`:

```json
"scripts": {
  "fix:comprehensive-quiz-fix": "tsx src/scripts/repair/quiz-management/super-comprehensive-quiz-fix.ts",
  "create:relationship-views": "tsx src/scripts/repair/database/create-relationship-views.ts"
}
```

### Phase 3: Fix S3 Storage Issues

#### 3.1 Create S3 Path Validator and Fixer

```typescript
// packages/content-migrations/src/scripts/repair/storage/fix-s3-references.ts
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../../utils/db/payload-client';

// Configure S3 client from environment
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for local development with Supabase
});

// Function to check if a file exists in S3
async function fileExistsInS3(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// List all files in a bucket with a prefix
async function listS3Files(
  bucket: string,
  prefix: string = '',
): Promise<string[]> {
  const results: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);

    if (response.Contents) {
      for (const file of response.Contents) {
        if (file.Key) results.push(file.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return results;
}

// Main function to fix S3 references
export async function fixS3References() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;
  const bucket = process.env.S3_BUCKET || 'local-bucket';
  const results = {
    scannedDownloads: 0,
    fixedDownloads: 0,
    fixedThumbnails: 0,
    missingFiles: [],
    errors: [],
  };

  try {
    // Get all S3 files for reference
    console.log('Listing all files in S3 bucket...');
    const allS3Files = await listS3Files(bucket);
    console.log(`Found ${allS3Files.length} files in S3 bucket`);

    // Get all downloads from database
    const downloads = await payload.find({
      collection: 'downloads',
      limit: 1000,
    });

    results.scannedDownloads = downloads.docs.length;

    // Check each download and fix references
    for (const download of downloads.docs) {
      try {
        let needsUpdate = false;
        const updateData: any = {};

        // Check main file URL
        if (download.url) {
          const fileKey = new URL(download.url).pathname.split('/').pop();

          // If file doesn't exist with current URL, try to find it with a different name
          if (
            fileKey &&
            !(await fileExistsInS3(bucket, `downloads/${fileKey}`))
          ) {
            // Try to find a matching file by ID in the filename
            const matchingFile = allS3Files.find(
              (file) =>
                file.includes(download.id) && !file.includes('thumbnail'),
            );

            if (matchingFile) {
              // Fix the URL
              const baseUrl = download.url.substring(
                0,
                download.url.lastIndexOf('/') + 1,
              );
              updateData.url = `${baseUrl}${matchingFile.split('/').pop()}`;
              needsUpdate = true;
              results.fixedDownloads++;
            } else {
              results.missingFiles.push(
                `Main file for download ${download.id}`,
              );
            }
          }
        }

        // Check thumbnail URL
        if (download.thumbnail) {
          const thumbnailKey = new URL(download.thumbnail).pathname
            .split('/')
            .pop();

          // If thumbnail doesn't exist, try to find it with a different name
          if (
            thumbnailKey &&
            !(await fileExistsInS3(bucket, `downloads/${thumbnailKey}`))
          ) {
            // Try to find a matching thumbnail by ID
            const matchingThumbnail = allS3Files.find(
              (file) =>
                file.includes(download.id) && file.includes('thumbnail'),
            );

            if (matchingThumbnail) {
              // Fix the thumbnail URL
              const baseUrl = download.thumbnail.substring(
                0,
                download.thumbnail.lastIndexOf('/') + 1,
              );
              updateData.thumbnail = `${baseUrl}${matchingThumbnail.split('/').pop()}`;
              needsUpdate = true;
              results.fixedThumbnails++;
            } else {
              results.missingFiles.push(
                `Thumbnail for download ${download.id}`,
              );
            }
          }
        }

        // Update the download if needed
        if (needsUpdate) {
          await payload.update({
            collection: 'downloads',
            id: download.id,
            data: updateData,
          });
        }
      } catch (error) {
        results.errors.push(
          `Error processing download ${download.id}: ${error.message}`,
        );
      }
    }

    // Also check and fix Media collection
    const media = await payload.find({
      collection: 'media',
      limit: 1000,
    });

    for (const item of media.docs) {
      try {
        if (item.url) {
          const fileKey = new URL(item.url).pathname.split('/').pop();

          // If file doesn't exist, log it as missing
          if (fileKey && !(await fileExistsInS3(bucket, `media/${fileKey}`))) {
            results.missingFiles.push(`Media file ${item.id}: ${fileKey}`);
          }
        }
      } catch (error) {
        results.errors.push(
          `Error checking media ${item.id}: ${error.message}`,
        );
      }
    }

    return results;
  } catch (error) {
    console.error('Error fixing S3 references:', error);
    results.errors.push(`General error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  fixS3References()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 3.2 Create Fallback Handler for Missing Media

```typescript
// packages/content-migrations/src/scripts/repair/storage/create-s3-fallbacks.ts
import fs from 'fs';
import path from 'path';

import { getPayloadClient } from '../../../utils/db/payload-client';

// Create fallback placeholder files for missing media
export async function createS3Fallbacks() {
  const payload = await getPayloadClient();
  const results = {
    createdFallbacks: 0,
    errors: [],
  };

  try {
    // Define fallback file paths for different types
    const fallbacks = {
      download: path.resolve(
        __dirname,
        '../../../../src/data/fallbacks/download-placeholder.pdf',
      ),
      thumbnail: path.resolve(
        __dirname,
        '../../../../src/data/fallbacks/thumbnail-placeholder.webp',
      ),
      image: path.resolve(
        __dirname,
        '../../../../src/data/fallbacks/image-placeholder.webp',
      ),
    };

    // Ensure fallback directory exists
    const fallbackDir = path.resolve(
      __dirname,
      '../../../../src/data/fallbacks',
    );
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }

    // Create PDF placeholder if it doesn't exist
    if (!fs.existsSync(fallbacks.download)) {
      // Create a minimal valid PDF
      const minimalPdf =
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n';
      fs.writeFileSync(fallbacks.download, minimalPdf);
      results.createdFallbacks++;
    }

    // Create thumbnail placeholder if it doesn't exist
    if (!fs.existsSync(fallbacks.thumbnail)) {
      // Copy from image placeholder or create a base64 minimal WebP
      const minimalWebp = Buffer.from(
        'UklGRmQAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSBQAAAABF6CgbQSdASoQABAAAFAmAJ0BKhAAEAAASA==',
        'base64',
      );
      fs.writeFileSync(fallbacks.thumbnail, minimalWebp);
      results.createdFallbacks++;
    }

    // Create image placeholder if it doesn't exist
    if (!fs.existsSync(fallbacks.image)) {
      // Create a base64 minimal WebP for image placeholder
      const minimalWebp = Buffer.from(
        'UklGRmQAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSBQAAAABF6CgbQSdASoQABAAAFAmAJ0BKhAAEAAASA==',
        'base64',
      );
      fs.writeFileSync(fallbacks.image, minimalWebp);
      results.createdFallbacks++;
    }

    // Create express middleware file for handling fallbacks
    const middlewarePath = path.resolve(
      __dirname,
      '../../../../src/middleware/s3-fallback-middleware.ts',
    );
    if (!fs.existsSync(middlewarePath)) {
      const middlewareContent = `
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Fallback paths
const FALLBACKS = {
  download: path.resolve(__dirname, '../../src/data/fallbacks/download-placeholder.pdf'),
  thumbnail: path.resolve(__dirname, '../../src/data/fallbacks/thumbnail-placeholder.webp'),
  image: path.resolve(__dirname, '../../src/data/fallbacks/image-placeholder.webp'),
};

/**
 * Middleware to handle S3 NoSuchKey errors with fallback files
 */
export const s3FallbackMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original end method
  const originalEnd = res.end;
  const originalWrite = res.write;
  const chunks: Buffer[] = [];

  // Override write method
  res.write = function(chunk: any) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    }
    return originalWrite.apply(res, arguments as any);
  };

  // Override end method to check for NoSuchKey errors
  res.end = function(chunk?: any) {
    if (chunk) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      }
    }

    const body = Buffer.concat(chunks).toString();
    const isS3Error = res.statusCode === 500 && body.includes('NoSuchKey');

    if (isS3Error) {
      // Determine fallback type based on URL
      const url = req.originalUrl || req.url;
      let fallbackType = 'image';
      
      if (url.includes('thumbnail')) {
        fallbackType = 'thumbnail';
      } else if (url.includes('downloads')) {
        fallbackType = 'download';
      }

      // Reset response
      res.statusCode = 200;
      
      // Set the appropriate content type
      if (fallbackType === 'download') {
        res.setHeader('Content-Type', 'application/pdf');
      } else {
        res.setHeader('Content-Type', 'image/webp');
      }

      // Serve the fallback file
      if (fs.existsSync(FALLBACKS[fallbackType])) {
        const fallbackContent = fs.readFileSync(FALLBACKS[fallbackType]);
        originalWrite.call(res, fallbackContent);
        return originalEnd.call(res);
      }
    }

    // Default behavior if no fallback needed or fallback failed
    return originalEnd.apply(res, arguments as any);
  };

  next();
};
`;

      fs.writeFileSync(middlewarePath, middlewareContent);
      results.createdFallbacks++;
    }

    // Now update the Payload app to use this middleware
    const payloadConfigPath = path.resolve(
      __dirname,
      '../../../../../apps/payload/src/payload.config.ts',
    );

    if (fs.existsSync(payloadConfigPath)) {
      let configContent = fs.readFileSync(payloadConfigPath, 'utf-8');

      // Only add if it doesn't already exist
      if (!configContent.includes('s3FallbackMiddleware')) {
        // Find imports section and add our import
        configContent = configContent.replace(
          /import.*;/g,
          (match) =>
            `${match}\nimport { s3FallbackMiddleware } from './middleware/s3-fallback-middleware';`,
        );

        // Add middleware to express config
        const expressPattern = /express:\s*{\s*([^}]*)}/;
        if (expressPattern.test(configContent)) {
          configContent = configContent.replace(
            expressPattern,
            (match, expressConfig) => {
              if (expressConfig.includes('middleware')) {
                return match.replace(
                  /middleware:\s*\[([\s\S]*?)\]/,
                  (middlewareMatch, existingMiddleware) => {
                    return `middleware: [${existingMiddleware ? existingMiddleware + ',' : ''}
                    s3FallbackMiddleware]`;
                  },
                );
              } else {
                return match.replace(
                  '{',
                  '{\n  middleware: [s3FallbackMiddleware],',
                );
              }
            },
          );
        }

        fs.writeFileSync(payloadConfigPath, configContent);
        results.createdFallbacks++;
      }
    }

    return results;
  } catch (error) {
    console.error('Error creating S3 fallbacks:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  createS3Fallbacks()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 3.3 Update Package.json Scripts

Add the following scripts to `packages/content-migrations/package.json`:

```json
"scripts": {
  "fix:s3-references": "tsx src/scripts/repair/storage/fix-s3-references.ts",
  "create:s3-fallbacks": "tsx src/scripts/repair/storage/create-s3-fallbacks.ts"
}
```

### Phase 4: Enhance Fallback Mechanisms

#### 4.1 Create Multi-Tiered Fallback System

```typescript
// packages/content-migrations/src/scripts/repair/enhance-fallbacks.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../utils/db/payload-client';

export async function createFallbackLayers() {
  const payload = await getPayloadClient();
  const drizzle = payload.db.drizzle;
  const results = {
    createdFallbacks: 0,
    errors: [],
  };

  try {
    // Create fallback functions for more robust relationship access

    // Create function to get quizzes for a course with fallbacks
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_course_quizzes(course_id TEXT)
      RETURNS TABLE(quiz_id TEXT, quiz_title TEXT)
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- First try: Direct relationship via course_id field
        RETURN QUERY
        SELECT id, title FROM payload.course_quizzes
        WHERE course_id = $1;
        
        -- If no results, try fallback: relationship table
        IF NOT FOUND THEN
          RETURN QUERY
          SELECT cq.id, cq.title
          FROM payload.course_quizzes cq
          JOIN payload.courses_rels cr ON cr.id = cq.id
          WHERE cr.parent_id = $1 AND cr.path = 'quizzes';
        END IF;
        
        -- If still no results, try fallback: UUID relationship tables
        IF NOT FOUND THEN
          RETURN QUERY
          SELECT cq.id, cq.title
          FROM payload.course_quizzes cq
          JOIN (
            SELECT id, parent_id
            FROM pg_tables pt
            CROSS JOIN LATERAL (
              SELECT id, parent_id
              FROM payload.rels
              WHERE pt.tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
              AND pt.schemaname = 'payload'
            ) as uuid_rels
            WHERE parent_id = $1
          ) uuid_rel ON uuid_rel.id = cq.id;
        END IF;

        -- If still no results, return a message in the logs
        IF NOT FOUND THEN
          RAISE NOTICE 'No quizzes found for course %', $1;
        END IF;
      END;
      $$;
    `);
    results.createdFallbacks++;

    // Create function to handle any entity lookup with fallbacks
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.find_related_entities(
        parent_id TEXT,
        relationship_path TEXT,
        target_collection TEXT
      )
      RETURNS TABLE(related_id TEXT)
      LANGUAGE plpgsql
      AS $$
      DECLARE
        rel_table TEXT;
        uuid_pattern TEXT := '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
        query_text TEXT;
        found_any BOOLEAN := FALSE;
      BEGIN
        -- First try standard relationship table (collection_rels)
        rel_table := target_collection || '_rels';
        
        IF EXISTS (
          SELECT 1 FROM pg_tables 
          WHERE schemaname = 'payload' AND tablename = rel_table
        ) THEN
          query_text := format(
            'SELECT id AS related_id FROM payload.%I WHERE parent_id = $1 AND path = $2',
            rel_table
          );
          
          RETURN QUERY EXECUTE query_text USING parent_id, relationship_path;
          GET DIAGNOSTICS found_any = ROW_COUNT;
        END IF;
        
        -- If no results, check UUID tables
        IF NOT found_any THEN
          RETURN QUERY
          SELECT rel.id AS related_id
          FROM pg_tables pt
          JOIN payload.rels rel ON rel.parent_id = parent_id AND rel.path = relationship_path
          WHERE pt.schemaname = 'payload' 
          AND pt.tablename ~ uuid_pattern;
          
          GET DIAGNOSTICS found_any = ROW_COUNT;
        END IF;
        
        -- If still no results, check direct field references in JSON
        IF NOT found_any THEN
          query_text := format(
            'SELECT (field->''id'')::TEXT AS related_id
            FROM payload.%I,
            jsonb_array_elements(CASE WHEN jsonb_typeof(%I) = ''array'' THEN %I ELSE ''[]''::jsonb END) AS field
            WHERE id = $1',
            target_collection, relationship_path, relationship_path
          );
          
          RETURN QUERY EXECUTE query_text USING parent_id;
        END IF;
      END;
      $$;
    `);
    results.createdFallbacks++;

    return results;
  } catch (error) {
    console.error('Error creating fallback layers:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  createFallbackLayers()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 4.2 Implement UI Error Handler

```typescript
// packages/content-migrations/src/scripts/repair/ui/create-error-handler.ts
import fs from 'fs';
import path from 'path';

export async function createErrorHandlerOverride() {
  const results = {
    createdFiles: 0,
    errors: [],
  };

  try {
    // Create directory for UI overrides if it doesn't exist
    const overridesDir = path.resolve(
      __dirname,
      '../../../../../apps/payload/src/custom/components/overrides',
    );
    if (!fs.existsSync(overridesDir)) {
      fs.mkdirSync(overridesDir, { recursive: true });
    }

    // Create error handler component that provides better UX for missing documents
    const errorHandlerPath = path.resolve(overridesDir, 'DocumentNotFound.tsx');
    if (!fs.existsSync(errorHandlerPath)) {
      const componentContent = `
import React from 'react';
import { useDocumentInfo } from 'payload/components/utilities';
import { Button } from 'payload/components/elements';
import { useConfig } from 'payload/components/utilities';

/**
 * Custom Not Found component that provides more helpful information
 * and recovery options when a document cannot be loaded
 */
const DocumentNotFound: React.FC = () => {
  const { id, collection, global } = useDocumentInfo();
  const config = useConfig();

  // Get a more user-friendly collection name
  const getCollectionLabel = () => {
    if (collection) {
      const collectionConfig = config.collections.find((c) => c.slug === collection);
      return collectionConfig?.labels?.singular || collection;
    } 
    if (global) {
      const globalConfig = config.globals.find((g) => g.slug === global);
      return globalConfig?.label || global;
    }
    return 'Document';
  };

  const collectionLabel = getCollectionLabel();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Document Not Found</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <p>
          The {collectionLabel} document with ID <strong>{id}</strong> could not be found or accessed.
          This may be due to one of the following reasons:
        </p>
        
        <ul style={{ textAlign: 'left', marginTop: '1rem', maxWidth: '600px', margin: '1rem auto', lineHeight: '1.5' }}>
          <li>The document may have been deleted</li>
          <li>There may be a relationship issue with this document</li>
          <li>
            A database migration may have affected this document's structure
            (Try running the content repairs script)
          </li>
          <li>You may not have permission to access this document</li>
        </ul>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button onClick={handleRefresh}>
          Refresh Page
        </Button>
        
        <Button onClick={handleGoBack}>
          Go Back
        </Button>
        
        {collection && (
          <Button
            to={\`/admin/collections/\${collection}\`}
          >
            Return to {collectionLabel} List
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentNotFound;
`;
      fs.writeFileSync(errorHandlerPath, componentContent);
      results.createdFiles++;
    }

    // Create payload.config.ts override to use our custom not found component
    const adminConfig = path.resolve(
      __dirname,
      '../../../../../apps/payload/src/custom/components/Admin.tsx',
    );
    if (!fs.existsSync(adminConfig)) {
      const adminConfigContent = `
import React from 'react';
import { Admin } from 'payload/components/admin';
import DocumentNotFound from './overrides/DocumentNotFound';

const CustomAdmin: React.FC = () => {
  return (
    <Admin components={{
      views: {
        // Override the not found view with our custom component
        NotFound: DocumentNotFound,
      },
    }} />
  );
};

export default CustomAdmin;
`;
      fs.writeFileSync(adminConfig, adminConfigContent);
      results.createdFiles++;
    }

    // Update payload config to use our custom admin
    const payloadConfigPath = path.resolve(
      __dirname,
      '../../../../../apps/payload/src/payload.config.ts',
    );

    if (fs.existsSync(payloadConfigPath)) {
      let configContent = fs.readFileSync(payloadConfigPath, 'utf-8');

      // Only add if it doesn't already exist
      if (!configContent.includes('CustomAdmin')) {
        // Add the import
        configContent = configContent.replace(
          /import.*;/g,
          (match) =>
            `${match}\nimport CustomAdmin from './custom/components/Admin';`,
        );

        // Set the admin component
        configContent = configContent.replace(/admin:\s*{[^}]*}/, (match) => {
          if (match.includes('components:')) {
            return match;
          } else {
            return match.replace(
              '{',
              '{\n  components: { admin: CustomAdmin },',
            );
          }
        });

        fs.writeFileSync(payloadConfigPath, configContent);
        results.createdFiles++;
      }
    }

    return results;
  } catch (error) {
    console.error('Error creating UI error handler:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  createErrorHandlerOverride()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 4.3 Implement Error Monitoring and Logging

```typescript
// packages/content-migrations/src/scripts/repair/monitoring/implement-error-monitoring.ts
import fs from 'fs';
import path from 'path';

export async function implementErrorMonitoring() {
  const results = {
    createdFiles: 0,
    errors: [],
  };

  try {
    // Create logging utility for payload
    const loggerDir = path.resolve(
      __dirname,
      '../../../../../apps/payload/src/utils',
    );
    if (!fs.existsSync(loggerDir)) {
      fs.mkdirSync(loggerDir, { recursive: true });
    }

    const loggerPath = path.resolve(loggerDir, 'logger.ts');
    if (!fs.existsSync(loggerPath)) {
      const loggerContent = `
/**
 * Enhanced logger for Payload that captures additional context for debugging
 * relationship issues and other errors
 */
class PayloadLogger {
  private logToFile: boolean;
  private logFile: string;
  
  constructor() {
    // Enable file logging in development mode
    this.logToFile = process.env.NODE_ENV === 'development';
    this.logFile = path.resolve(process.cwd(), 'logs/payload-errors.log');
    
    // Ensure log directory exists
    if (this.logToFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }
  
  /**
   * Log an error with additional context
   */
  error(error: any, context: Record<string, any> = {}) {
    // Format the error message
    const message = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message || 'Unknown error',
      stack: error.stack,
      ...context,
    };
    
    // Log to console
    console.error('[PAYLOAD ERROR]', message);
    
    // Log to file if enabled
    if (this.logToFile) {
      fs.appendFileSync(
        this.logFile,
        JSON.stringify(message) + '\\n',
        { encoding: 'utf8' }
      );
    }
    
    // If there's a database issue related to UUID tables, log additional debug info
    if (
      context.collection &&
      (error.message?.includes('does not exist') || error.message?.includes('column') || error.code === '42703')
    ) {
      this.logDatabaseIssue(error, context);
    }
  }
  
  /**
   * Log advanced database diagnostic info for UUID table issues
   */
  private async logDatabaseIssue(error: any, context: Record<string, any>) {
    try {
      // This would contain logic to query metadata about the tables
      // and log detailed diagnostics about the state of the database
      console.warn(
        '[DATABASE DIAGNOSTIC]',
        'Potential UUID table issue detected. Run the repair script.'
      );
    } catch (diagError) {
      console.error('Error running database diagnostics:', diagError);
    }
  }
  
  /**
   * Log warning with context
   */
  warn(message: string, context: Record<string, any> = {}) {
    const logMessage = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context,
    };
    
    console.warn('[PAYLOAD WARNING]', logMessage);
    
    if (this.logToFile) {
      fs.appendFileSync(
        this.logFile,
        JSON.stringify(logMessage) + '\\n',
        { encoding: 'utf8' }
      );
    }
  }
  
  /**
   * Log info with context
   */
  info(message: string, context: Record<string, any> = {}) {
    if (process.env.DEBUG === 'true') {
      const logMessage = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        ...context,
      };
      
      console.log('[PAYLOAD INFO]', logMessage);
    }
  }
}

// Create singleton instance
export const logger = new PayloadLogger();
`;
      fs.writeFileSync(loggerPath, loggerContent);
      results.createdFiles++;
    }

    return results;
  } catch (error) {
    console.error('Error implementing error monitoring:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

// Main entry point for CLI
if (require.main === module) {
  implementErrorMonitoring()
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((err) => console.error(err));
}
```

#### 4.4 Update Package.json Scripts

Add the following scripts to `packages/content-migrations/package.json`:

```json
"scripts": {
  "create:fallback-layers": "tsx src/scripts/repair/enhance-fallbacks.ts",
  "create:error-handler": "tsx src/scripts/repair/ui/create-error-handler.ts",
  "implement:error-monitoring": "tsx src/scripts/repair/monitoring/implement-error-monitoring.ts"
}
```

### Integration with Content Migration System

To integrate these fixes with the content migration system, we need to update the migration scripts to include these repair steps. Create a new orchestration script:

```typescript
// packages/content-migrations/src/repair-orchestrator.ts
import { createRelationshipViews } from './scripts/repair/database/create-relationship-views';
import { ensureRequiredColumnsExist } from './scripts/repair/database/enhanced-column-management';
import { createUuidTableMonitorFunction } from './scripts/repair/database/runtime-uuid-monitor';
import { createFallbackLayers } from './scripts/repair/enhance-fallbacks';
import { implementErrorMonitoring } from './scripts/repair/monitoring/implement-error-monitoring';
import { superComprehensiveQuizFix } from './scripts/repair/quiz-management/super-comprehensive-quiz-fix';
import { createS3Fallbacks } from './scripts/repair/storage/create-s3-fallbacks';
import { fixS3References } from './scripts/repair/storage/fix-s3-references';
import { createErrorHandlerOverride } from './scripts/repair/ui/create-error-handler';

async function runComprehensiveRepair() {
  console.log('Starting comprehensive content repair...');

  try {
    // Phase 1: Fix UUID tables
    console.log('Phase 1: Enhancing UUID table management...');
    const columnResults = await ensureRequiredColumnsExist();
    console.log(`- Added columns to ${columnResults.length} tables`);

    const monitorResult = await createUuidTableMonitorFunction();
    console.log(`- ${monitorResult}`);

    // Phase 2: Fix relationships
    console.log('\nPhase 2: Repairing relationships...');
    const quizResults = await superComprehensiveQuizFix();
    console.log(`- Fixed ${quizResults.fixedQuizzes} quizzes`);
    console.log(
      `- Fixed ${quizResults.fixedRelationships} relationship tables`,
    );

    const viewResults = await createRelationshipViews();
    console.log(
      `- Created ${viewResults.createdViews.length} database views and functions`,
    );

    // Phase 3: Fix S3 storage
    console.log('\nPhase 3: Fixing S3 storage issues...');
    const s3Results = await fixS3References();
    console.log(`- Scanned ${s3Results.scannedDownloads} downloads`);
    console.log(`- Fixed ${s3Results.fixedDownloads} download URLs`);
    console.log(`- Fixed ${s3Results.fixedThumbnails} thumbnail URLs`);
    console.log(
      `- Found ${s3Results.missingFiles.length} missing files that need attention`,
    );

    const fallbackResults = await createS3Fallbacks();
    console.log(
      `- Created ${fallbackResults.createdFallbacks} fallback mechanisms`,
    );

    // Phase 4: Enhance fallbacks
    console.log('\nPhase 4: Enhancing fallback mechanisms...');
    const layerResults = await createFallbackLayers();
    console.log(`- Created ${layerResults.createdFallbacks} fallback layers`);

    const uiResults = await createErrorHandlerOverride();
    console.log(`- Created ${uiResults.createdFiles} UI components`);

    const monitoringResults = await implementErrorMonitoring();
    console.log(
      `- Created ${monitoringResults.createdFiles} monitoring utilities`,
    );

    console.log('\nComprehensive repair completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during comprehensive repair:', error);
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  runComprehensiveRepair()
    .then((success) => {
      if (success) {
        console.log('Repair completed successfully');
        process.exit(0);
      } else {
        console.log('Repair encountered errors');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error during repair:', err);
      process.exit(1);
    });
}

export { runComprehensiveRepair };
```

Update the `scripts` section in `packages/content-migrations/package.json`:

```json
"scripts": {
  "repair:all": "tsx src/repair-orchestrator.ts"
}
```

Finally, modify the `reset-and-migrate.ps1` script to include the repair step:

```powershell
# Add this after the migration step but before the loading step
Write-Host "Running comprehensive content repair..." -ForegroundColor Cyan
pnpm --filter @slideheroes/content-migrations repair:all
```

### Implementation Timeline

The implementation should proceed in the following order:

1. **Day 1: Development & Testing**

   - Implement and test Phase 1 & 2 scripts
   - Run on development database to validate
   - Document findings and adjustments

2. **Day 2: Development & Testing**

   - Implement and test Phase 3 & 4 scripts
   - Create integration with migration system
   - Test full repair orchestration

3. **Day 3: Validation & Deployment**

   - Complete test scenarios for all scenarios
   - Deploy to staging environment
   - Verify all collections showing correctly
   - Finalize documentation

4. **Ongoing Monitoring**
   - Add monitoring to track S3 issues
   - Create regular health check on UUID tables
   - Implement weekly database structure validation

By following this comprehensive plan, we will address all the identified issues with the Payload CMS content display, ensuring that all collections, relationships, and media files are properly handled and displayed.

```

```
