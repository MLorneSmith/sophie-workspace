# R2 Media Integration Implementation Plan

This document outlines the detailed implementation plan for integrating Cloudflare R2 with our Payload CMS for media storage and adapting our content migration system to properly populate the database with the correct image links.

## Table of Contents

1. [Current Status Analysis](#current-status-analysis)
2. [Implementation Plan](#implementation-plan)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Testing and Verification](#testing-and-verification)
5. [Potential Issues and Solutions](#potential-issues-and-solutions)
6. [References](#references)

## Current Status Analysis

### Payload CMS Configuration

- The S3 adapter is already configured in `payload.config.ts`
- The Media collection is set up with `upload: true`
- The R2 configuration is partially implemented but needs proper environment variables
- The current configuration lacks image processing options and custom URL generation

### Content Migration System

- We have a two-step content migration process:
  1. Process raw data files to generate processed data files and SQL seed files
  2. Reset the database and run migrations to populate the database with content
- The image mapping system has been implemented to map frontmatter paths to actual R2 filenames
- The SQL seed generation process has been updated to handle media entries
- The migration order has been adjusted to ensure media entries are created before they're referenced

### ImportMap Issue

- There's an error with the S3 client upload handler in the importMap
- This is a known issue with Payload CMS custom components that requires special handling

## Implementation Plan

### 1. Complete R2 Configuration

1. **Update Environment Variables**

   - Create/update `.env` file in the `apps/payload` directory with R2 credentials
   - Ensure all required environment variables are properly set

2. **Enhance S3 Adapter Configuration**
   - Update the S3 adapter configuration in `payload.config.ts`
   - Add custom URL generation for public access
   - Configure proper prefix for organized storage
   - Set up appropriate image size configurations

### 2. Update Content Migration System

1. **Media SQL Generation**

   - Ensure the `generateMediaSql` function creates proper media entries
   - Verify the SQL file order to ensure media entries are created before they're referenced

2. **Image Mapping System**

   - Maintain the image mapping system in `packages/content-migrations/src/data/mappings/image-mappings.ts`
   - Ensure all image paths are correctly mapped to R2 filenames

3. **Lesson SQL Generation**

   - Verify the `generateLessonsSql` function includes `featured_image_id` and creates proper relationships
   - Ensure all lessons with images have the correct media relationships

4. **Verification Steps**
   - Add comprehensive media verification to the content processing migration

### 3. Fix ImportMap Issue

1. **Generate ImportMap**

   - Run the importMap generation command to create the necessary mappings
   - Verify the importMap includes the S3 client upload handler

2. **Create Custom Component Handler**

   - Implement a specialized component to handle the S3 client upload handler
   - Add proper error handling for component resolution

3. **Update Payload Configuration**
   - Ensure the importMap configuration is properly set up in `payload.config.ts`
   - Add any necessary custom components to the admin configuration

### 4. Testing and Verification

1. **Local Testing**

   - Run the content migration process to verify media entries are created correctly
   - Check that relationships between content and media are properly established
   - Verify that media files are properly uploaded to R2

2. **Production Deployment**
   - Ensure environment variables are properly set in production
   - Verify that media files are accessible through the configured URLs

## Detailed Implementation Steps

### Step 1: Update Environment Variables

Create or update `.env` file in `apps/payload` with the following:

```
DATABASE_URI=postgres://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020

# R2 Configuration
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
R2_REGION=auto
```

### Step 2: Enhance Media Collection Configuration

Update the Media collection in `apps/payload/src/collections/Media.ts` to include additional fields and image processing options:

```typescript
import path from 'path';
import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'filename',
    description: 'Media files stored in Cloudflare R2',
  },
  upload: {
    staticURL: '/media',
    staticDir: path.resolve(__dirname, '../../media'),
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
    ],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
};
```

### Step 3: Update S3 Adapter Configuration

Enhance the S3 adapter configuration in `payload.config.ts`:

```typescript
s3Storage({
  collections: {
    media: {
      adapter: 's3',
      disableLocalStorage: true,
      prefix: 'media',
      generateFileURL: ({ filename, prefix }) =>
        `https://${process.env.R2_BUCKET}.${process.env.R2_ENDPOINT}/${prefix}/${filename}`,
    },
  },
  bucket: process.env.R2_BUCKET || '',
  config: {
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: process.env.R2_REGION || 'auto',
    forcePathStyle: true,
  },
}),
```

### Step 4: Fix ImportMap Issue

To fix the importMap issue, you'll need to:

1. Generate the importMap:

   ```bash
   cd apps/payload && pnpm generate:importmap
   ```

2. If the issue persists, create a custom component handler in `apps/payload/src/components/S3ClientUploadHandler.tsx`:

   ```tsx
   'use client';

   import React from 'react';

   import { S3ClientUploadHandler as OriginalS3ClientUploadHandler } from '@payloadcms/storage-s3/client';

   export const S3ClientUploadHandler: React.FC<any> = (props) => {
     // Log props for debugging
     console.log('S3ClientUploadHandler props:', props);

     // Return the original component with the props
     return <OriginalS3ClientUploadHandler {...props} />;
   };

   export default S3ClientUploadHandler;
   ```

3. Update the importMap configuration in `payload.config.ts`:
   ```typescript
   admin: {
     user: Users.slug,
     importMap: {
       baseDir: path.resolve(dirname),
       components: {
         '@payloadcms/storage-s3/client#S3ClientUploadHandler': './components/S3ClientUploadHandler',
       },
     },
   },
   ```

### Step 5: Update Content Migration Process

The content migration process has already been updated with:

1. Image mappings in `packages/content-migrations/src/data/mappings/image-mappings.ts`
2. SQL generation for media entries in `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts`
3. Modified migration order in `apps/payload/src/migrations/20250403_200000_process_content.ts`
4. Verification steps for media entries

### Step 6: Testing and Verification

After implementing these changes, you should:

1. Run the content migration process:

   ```bash
   pnpm --filter @kit/content-migrations run process:raw-data
   ./reset-and-migrate.ps1
   ```

2. Verify that media entries are created correctly:

   ```sql
   SELECT COUNT(*) FROM payload.media;
   ```

3. Verify that relationships between content and media are properly established:

   ```sql
   SELECT COUNT(*) FROM payload.course_lessons WHERE featured_image_id IS NOT NULL;
   SELECT COUNT(*) FROM payload.course_lessons_rels WHERE field = 'featured_image';
   ```

4. Check that media files are properly uploaded to R2 by accessing them through the configured URLs.

## Potential Issues and Solutions

### 1. ImportMap Generation Issues

**Issue**: The importMap generation might fail due to missing components or incorrect paths.

**Solution**:

- Ensure all required components are properly imported and exported
- Check for case sensitivity in component paths
- Verify that the baseDir is correctly set in the importMap configuration

### 2. R2 Access Issues

**Issue**: Media files might not be accessible due to incorrect R2 configuration or permissions.

**Solution**:

- Verify that the R2 bucket is properly configured and accessible
- Check that the R2 credentials have the correct permissions
- Ensure the R2 endpoint is correctly formatted

### 3. Media Relationship Issues

**Issue**: Relationships between content and media might not be properly established.

**Solution**:

- Verify that the media entries are created before they're referenced
- Check that the media IDs are correctly mapped in the SQL generation process
- Ensure the relationship tables have the correct columns and constraints

### 4. Image Processing Issues

**Issue**: Image processing might fail due to incorrect configuration or missing dependencies.

**Solution**:

- Verify that the sharp library is properly installed and configured
- Check that the image processing options are correctly set
- Ensure the image sizes are appropriate for the application

## References

1. [Payload CMS Documentation](https://payloadcms.com/docs)
2. [Payload CMS S3 Adapter Documentation](https://payloadcms.com/docs/upload/storage-adapters/s3)
3. [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
4. [Cloudflare R2 S3 Compatibility](https://developers.cloudflare.com/r2/buckets/)
5. [Content Migration System Documentation](../../z.instructions/content-migration-system.md)
