# Cloudflare R2 Media Integration Plan

## Overview and Background

### Current State

- The application uses Payload CMS for content management within a Makerkit-based Next.js 15 app
- Content is stored in a PostgreSQL database with separate schemas for web app and Payload CMS
- Images are already stored in Cloudflare R2 but not properly linked in Payload CMS
- The content migration system processes raw data (mdoc files) and populates the database
- The mdoc files contain image references that don't match the actual filenames in R2

### Problem Statement

The current content migration system doesn't properly handle media files. While images are stored in Cloudflare R2, they aren't correctly linked to content in Payload CMS. The image paths in the mdoc frontmatter don't match the actual filenames in R2, requiring a mapping system to connect them.

### Goals

1. Configure Payload CMS to use Cloudflare R2 for media storage via the S3 adapter
2. Create a mapping system between frontmatter image paths and actual R2 filenames
3. Update the content migration process to populate the media table with correct image references
4. Ensure proper relationships between content and media in the database

## Technical Requirements

### Dependencies

- `@payloadcms/storage-s3`: Payload CMS adapter for S3-compatible storage
- `@aws-sdk/client-s3`: AWS SDK for S3 operations (used by the adapter)

### Cloudflare R2 Configuration

The R2 credentials are already available in `apps/payload/.env`:

- Bucket: `media`
- Access Key ID: `7e6826129bd020f755f213684bb2e038`
- Secret Access Key: `ee762c51aa7b9a3893bc9dca4b4085ae5d74fd611a436ed158c571d13785cd0c`
- Endpoint: `https://d33fc17df32ce7d9d48eb8045f1d340a.r2.cloudflarestorage.com`
- Region: `auto`
- Account ID: `d33fc17df32ce7d9d48eb8045f1d340a`

### Database Schema

The Payload CMS database schema includes:

- `payload.media`: Table for storing media metadata
- `payload.course_lessons`: Contains a `featured_image_id` field for linking to media
- `payload.posts`: Contains image references in the content

## Implementation Plan

### Phase 1: Configure Payload CMS S3 Adapter for Cloudflare R2

1. **Install the required dependencies**:

   ```bash
   pnpm add @payloadcms/storage-s3 @aws-sdk/client-s3 --filter payload-app
   ```

2. **Update the Payload CMS configuration**:

   - Modify `apps/payload/src/payload.config.ts` to import and configure the S3 adapter
   - Use the R2 credentials from `apps/payload/.env`
   - Configure the adapter to use the `media` collection

   ```typescript
   // apps/payload/src/payload.config.ts
   import { s3Storage } from '@payloadcms/storage-s3';

   // ... other imports

   // Configure S3 adapter for R2
   const storage = s3Storage({
     collections: {
       media: {
         adapter: 's3',
         disableLocalStorage: true,
       },
     },
     bucket: process.env.R2_BUCKET,
     config: {
       endpoint: process.env.R2_ENDPOINT,
       credentials: {
         accessKeyId: process.env.R2_ACCESS_KEY_ID,
         secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
       },
       region: process.env.R2_REGION || 'auto',
       forcePathStyle: true,
     },
   });

   export default buildConfig({
     // ... other config
     plugins: [
       // ... other plugins
       storage,
     ],
   });
   ```

3. **Test the configuration** to ensure Payload CMS can connect to R2

### Phase 2: Create Image Mapping System

1. **Create a mapping file** to store the relationships between frontmatter image paths and actual R2 filenames:

   - Create `packages/content-migrations/src/data/mappings/image-mappings.ts`
   - Include mappings for both lesson and blog post images

   ```typescript
   // packages/content-migrations/src/data/mappings/image-mappings.ts
   export const lessonImageMappings: Record<string, string> = {
     '/cms/images/basic-graphs/image.png': 'standard_graphs.png',
     '/cms/images/gestalt-principles/image.png':
       'gestalt_principles_of_perception.png',
     '/cms/images/idea-generation/image.png': 'idea_generation.png',
     '/cms/images/lesson-0/image.png': 'lesson_zero.png',
     '/cms/images/our-process/image.png': 'our_process.png',
     '/cms/images/fundamental-design-overview/image.png':
       'overview_elements_design.png',
     '/cms/images/performance/image.png': 'performance.png',
     '/cms/images/preparation-practice/image.png': 'preparation_practice.png',
     '/cms/images/skills-self-assessment/image.png': 'self_assessment.png',
     '/cms/images/slide-composition/image.png': 'slide_composition.png',
     '/cms/images/specialist-graphs/image.png': 'specialist_graphs.png',
     '/cms/images/storyboards-film/image.png': 'storyboards_in_film.png',
     '/cms/images/storyboards-presentations/image.png':
       'storyboards_in_presentations.png',
     '/cms/images/tables-vs-graphs/image.png': 'tables_vs_graphs.png',
     '/cms/images/the-who/image.png': 'the_who.png',
     '/cms/images/the-why-introductions/image.png': 'the_why_introductions.png',
     '/cms/images/the-why-next-steps/image.png': 'the_why_next_steps.png',
     '/cms/images/tools-and-resources/image.png': 'tools_resources.png',
     '/cms/images/using-stories/image.png': 'using_stories.png',
     '/cms/images/visual-perception/image.png': 'visual_perception.png',
     '/cms/images/fact-based-persuasion/image.png': 'what_structure.png',
     '/cms/images/before-we-begin/image.png': 'before_we_begin.png',
     '/cms/images/fundamental-design-detail/image.png':
       'detail_elements_of_design.png',
   };

   export const postImageMappings: Record<string, string> = {
     '/cms/images/art-craft-business-presentation-creation/image.png':
       'Art Craft of Presentation Creation.png',
     '/cms/images/pitch-deck/image.png': 'pitch-deck-image.png',
     '/cms/images/powerpoint-presentations-defense/image.png':
       'Defense of PowerPoint.png',
     '/cms/images/presentation-review-bcg/image.png':
       'BCG-teardown-optimized.jpg',
     '/cms/images/presentation-tips/image.png':
       'Presentation Tips Optimized.png',
     '/cms/images/presentation-tools/image.png':
       'Presentation Tools-optimized.png',
     '/cms/images/public-speaking-anxiety/image.png':
       'Conquering Public Speaking Anxiety.png',
     '/cms/images/seneca-partnership/image.png': 'Seneca Partnership.webp',
     '/cms/images/typology-business-charts/image.png': 'business-charts.jpg',
   };

   export function getActualImageFilename(
     frontmatterPath: string,
   ): string | null {
     return (
       lessonImageMappings[frontmatterPath] ||
       postImageMappings[frontmatterPath] ||
       null
     );
   }
   ```

2. **Create utility functions** to look up the correct image filename based on the frontmatter path

### Phase 3: Update Content Migration Process

1. **Modify the SQL seed generation process** to include media entries:

   - Create a new function in `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts` to generate media SQL
   - Use the image mappings to create the correct media entries
   - Add the generated SQL file to the migration process

   ```typescript
   // packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts
   // Add to existing imports
   import matter from 'gray-matter';
   import path from 'path';
   import { v4 as uuidv4 } from 'uuid';

   import {
     lessonImageMappings,
     postImageMappings,
   } from '../../data/mappings/image-mappings';

   // Add a function to generate media SQL
   function generateMediaSql(): string {
     let sql = `-- Seed data for the media table
   -- This file should be run after the migrations to ensure the media table exists
   
   -- Start a transaction
   BEGIN;
   
   `;

     // Create a map to store media IDs by filename
     const mediaIds: Record<string, string> = {};

     // Process lesson images
     Object.entries(lessonImageMappings).forEach(
       ([frontmatterPath, actualFilename]) => {
         const mediaId = uuidv4();
         mediaIds[frontmatterPath] = mediaId;

         sql += `-- Insert media for ${frontmatterPath}
   INSERT INTO payload.media (
     id,
     alt,
     filename,
     mime_type,
     filesize,
     url,
     updated_at,
     created_at
   ) VALUES (
     '${mediaId}',
     '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
     '${actualFilename}',
     '${getMimeType(actualFilename)}',
     0,
     '${actualFilename}',
     NOW(),
     NOW()
   ) ON CONFLICT (id) DO NOTHING;
   
   `;
       },
     );

     // Process post images
     Object.entries(postImageMappings).forEach(
       ([frontmatterPath, actualFilename]) => {
         const mediaId = uuidv4();
         mediaIds[frontmatterPath] = mediaId;

         sql += `-- Insert media for ${frontmatterPath}
   INSERT INTO payload.media (
     id,
     alt,
     filename,
     mime_type,
     filesize,
     url,
     updated_at,
     created_at
   ) VALUES (
     '${mediaId}',
     '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
     '${actualFilename}',
     '${getMimeType(actualFilename)}',
     0,
     '${actualFilename}',
     NOW(),
     NOW()
   ) ON CONFLICT (id) DO NOTHING;
   
   `;
       },
     );

     // End the transaction
     sql += `-- Commit the transaction
   COMMIT;
   `;

     // Export the media IDs for use in other functions
     global.mediaIds = mediaIds;

     return sql;
   }

   // Helper function to determine MIME type based on file extension
   function getMimeType(filename: string): string {
     const ext = path.extname(filename).toLowerCase();
     switch (ext) {
       case '.png':
         return 'image/png';
       case '.jpg':
       case '.jpeg':
         return 'image/jpeg';
       case '.webp':
         return 'image/webp';
       default:
         return 'application/octet-stream';
     }
   }
   ```

2. **Update the relationship handling** to link content to media:

   - Modify the lesson and post SQL generation to include references to the media entries
   - Ensure the correct relationships are established in the database

   ```typescript
   // Modify the generateLessonsSql function to include featured_image_id
   function generateLessonsSql(lessonsDir: string): string {
     // ... existing code

     // Process each lesson file
     for (const file of lessonFiles) {
       const filePath = path.join(lessonsDir, file);
       const fileContent = fs.readFileSync(filePath, 'utf8');
       const { data, content } = matter(fileContent);

       // Generate a UUID for the lesson
       const lessonId = uuidv4();

       // Get the media ID for this lesson's image
       const mediaId =
         data.image && global.mediaIds ? global.mediaIds[data.image] : null;

       // ... existing code to add the lesson to the SQL

       // Add the featured_image_id if available
       if (mediaId) {
         sql += `-- Set the featured_image_id for the lesson
   UPDATE payload.course_lessons
   SET featured_image_id = '${mediaId}'
   WHERE id = '${lessonId}';
   
   -- Create relationship entry for the lesson to the media
   INSERT INTO payload.course_lessons_rels (
     id,
     _parent_id,
     field,
     value,
     created_at,
     updated_at
   ) VALUES (
     gen_random_uuid(),
     '${lessonId}',
     'featured_image',
     '${mediaId}',
     NOW(),
     NOW()
   ) ON CONFLICT DO NOTHING;
   
   `;
       }
     }

     // ... existing code
   }

   // Update the generateSqlSeedFiles function to include media SQL
   async function generateSqlSeedFiles() {
     // ... existing code

     // Generate media SQL
     console.log('Generating media SQL...');
     const mediaSql = generateMediaSql();
     fs.writeFileSync(
       path.join(PAYLOAD_SQL_SEED_DIR, '07-media.sql'),
       mediaSql,
     );

     // ... existing code

     // Copy the media SQL file to the processed SQL directory
     fs.copyFileSync(
       path.join(PAYLOAD_SQL_SEED_DIR, '07-media.sql'),
       path.join(PROCESSED_SQL_DIR, '07-media.sql'),
     );

     // ... existing code
   }
   ```

3. **Update the content processing migration** to include the media SQL file:

   ```typescript
   // apps/payload/src/migrations/20250403_200000_process_content.ts
   // Update seedFiles array to include the media SQL file
   const seedFiles = [
     '01-courses.sql',
     '02-lessons.sql',
     '03-quizzes.sql',
     '04-questions.sql',
     '05-surveys.sql',
     '06-survey-questions.sql',
     '07-media.sql', // Add this line
     // ... other seed files
   ];
   ```

4. **Add a verification step** to ensure all media entries are properly linked

### Phase 4: Testing and Validation

1. **Test the complete migration process**:

   - Run `pnpm run process:raw-data` to process the raw data
   - Run `./reset-and-migrate.ps1` to reset and migrate the database
   - Verify that media entries are created correctly
   - Verify that content is properly linked to media

2. **Test the Payload CMS admin interface**:
   - Ensure media files are displayed correctly
   - Verify that uploads work correctly with R2

## Testing Strategy

### Verification Steps

1. **Database Verification**:

   - Verify that the `payload.media` table contains entries for all mapped images
   - Verify that the `featured_image_id` column in `payload.course_lessons` is populated correctly
   - Verify that the relationship tables contain the correct entries

2. **API Verification**:

   - Test the Payload CMS API to ensure media files can be retrieved
   - Verify that media URLs are correctly formed and accessible

3. **UI Verification**:
   - Test the Payload CMS admin interface to ensure media files are displayed correctly
   - Verify that new uploads work correctly with R2

### Success Criteria

1. All mapped images are correctly stored in the `payload.media` table
2. All content is properly linked to media
3. Media files can be retrieved through the Payload CMS API
4. New uploads are stored in R2 and accessible through the API

## Future Considerations

### Performance Optimization

1. **CDN Integration**:

   - Consider integrating a CDN for improved media delivery
   - Configure Cloudflare's edge caching for R2 objects

2. **Image Optimization**:
   - Implement automatic image optimization for different device sizes
   - Consider using Cloudflare Image Resizing for on-the-fly image transformations

### Monitoring and Maintenance

1. **Usage Monitoring**:

   - Set up monitoring to track R2 usage and costs
   - Implement alerts for unusual usage patterns

2. **Backup Strategy**:
   - Implement a backup strategy for media files
   - Consider cross-region replication for disaster recovery

### Potential Enhancements

1. **Metadata Enrichment**:

   - Enhance media metadata with additional information (e.g., dimensions, alt text)
   - Implement automatic tagging and categorization

2. **Media Management**:

   - Develop a more sophisticated media management interface
   - Implement media organization features (folders, tags, etc.)

3. **Migration Improvements**:
   - Enhance the content migration system to handle media more efficiently
   - Implement incremental updates to avoid full database resets
