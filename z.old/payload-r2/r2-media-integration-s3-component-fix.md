# R2 Media Integration: S3ClientUploadHandler Component Fix

This document outlines the plan to fix the S3ClientUploadHandler component issue in our Payload CMS implementation for Cloudflare R2 integration.

## Table of Contents

1. [Issue Summary](#issue-summary)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Solution Approach](#solution-approach)
4. [Implementation Plan](#implementation-plan)
5. [Testing and Verification](#testing-and-verification)
6. [Potential Issues and Solutions](#potential-issues-and-solutions)
7. [References](#references)

## Issue Summary

We're encountering an error with the S3 client upload handler in the importMap:

```
getFromImportMap: PayloadComponent not found in importMap {
  key: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
  PayloadComponent: {
    clientProps: {
      collectionSlug: 'media',
      enabled: false,
      extra: undefined,
      prefix: undefined,
      serverHandlerPath: '/storage-s3-generate-signed-url'
    },
    path: '@payloadcms/storage-s3/client#S3ClientUploadHandler'
  },
  schemaPath: ''
}
```

This error occurs because Payload CMS is trying to use the S3ClientUploadHandler component, but it can't find it in the importMap. The error suggests running `payload generate:importmap`, but this command alone doesn't resolve the issue.

## Root Cause Analysis

The root cause is that the S3ClientUploadHandler component from the @payloadcms/storage-s3 package is not properly registered in the importMap. This is similar to issues we've encountered before with custom components in the Lexical editor.

Previous attempts to fix importMap issues using scripts like `fix-importmap.ts` were unsuccessful. However, we have successfully implemented custom components in `apps/payload/src/blocks` that work correctly with the importMap system.

## Solution Approach

We'll follow the same pattern as our existing custom components (BunnyVideo, CallToAction, etc.) to implement a custom S3ClientUploadHandler component. This approach has proven successful for other components and should work for the S3ClientUploadHandler as well.

The key aspects of this approach are:

1. Create a component with a clean, modular structure
2. Register the component in the importMap configuration
3. Use the standard Payload CMS importMap generation process

## Implementation Plan

### 1. Create Component Directory Structure

```
apps/payload/src/components/S3ClientUploadHandler/
├── Component.tsx
└── index.ts
```

Unlike the block components, we don't need Field.tsx or config.ts since this is a utility component, not a content block.

### 2. Create Component.tsx

```typescript
// apps/payload/src/components/S3ClientUploadHandler/Component.tsx
'use client';

import React from 'react';
import { S3ClientUploadHandler as OriginalS3ClientUploadHandler } from '@payloadcms/storage-s3/client';

/**
 * Custom wrapper for the S3ClientUploadHandler component
 * This component simply passes all props to the original component
 */
const Component: React.FC<any> = (props) => {
  // Log props for debugging
  console.log('S3ClientUploadHandler props:', props);

  // Return the original component with the props
  return <OriginalS3ClientUploadHandler {...props} />;
};

export default Component;
```

### 3. Create index.ts

```typescript
// apps/payload/src/components/S3ClientUploadHandler/index.ts
import Component from './Component';

export default Component;
```

### 4. Update the importMap Configuration in payload.config.ts

```typescript
admin: {
  user: Users.slug,
  importMap: {
    baseDir: path.resolve(dirname),
    components: {
      '@payloadcms/storage-s3/client#S3ClientUploadHandler': './components/S3ClientUploadHandler/Component',
    },
  },
},
```

### 5. Enhance the S3 Storage Configuration

```typescript
plugins: [
  payloadCloudPlugin(),
  s3Storage({
    collections: {
      media: {
        adapter: 's3',
        disableLocalStorage: true,
        prefix: 'media',
        generateFileURL: ({ filename, prefix }) =>
          `https://${process.env.R2_BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${prefix}/${filename}`,
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
  // ... other plugins
],
```

### 6. Update the Media Collection

```typescript
// apps/payload/src/collections/Media.ts
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

## Implementation Steps

1. **Create the Components Directory**:

   ```bash
   mkdir -p apps/payload/src/components/S3ClientUploadHandler
   ```

2. **Create the Component.tsx File**:
   Create the file at `apps/payload/src/components/S3ClientUploadHandler/Component.tsx` with the content provided above.

3. **Create the index.ts File**:
   Create the file at `apps/payload/src/components/S3ClientUploadHandler/index.ts` with the content provided above.

4. **Update the Payload Configuration**:
   Update `apps/payload/src/payload.config.ts` with the admin configuration provided above.

5. **Update the Media Collection**:
   Update `apps/payload/src/collections/Media.ts` with the content provided above.

6. **Generate the ImportMap**:

   ```bash
   cd apps/payload
   pnpm generate:importmap
   ```

7. **Start the Development Server**:
   ```bash
   cd apps/payload
   pnpm dev
   ```

## Testing and Verification

After implementing these changes:

1. **Test Media Upload**:
   Upload a file through the Payload CMS admin interface to verify that the S3 client upload handler is working correctly.

2. **Check R2 Storage**:
   Verify that the uploaded file is stored in your Cloudflare R2 bucket.

3. **Test Content Migration**:
   Run the content migration process to verify media entries are created correctly:
   ```bash
   pnpm --filter @kit/content-migrations run process:raw-data
   ./reset-and-migrate.ps1
   ```

## Potential Issues and Solutions

### 1. ImportMap Resolution Issues

If the component is still not found in the importMap, try these alternatives:

1. **Alternative Component Path**:
   Try using a different path format in the importMap:

   ```typescript
   '@payloadcms/storage-s3/client#S3ClientUploadHandler': './components/S3ClientUploadHandler',
   ```

2. **Direct Component Registration**:
   If the importMap approach doesn't work, try registering the component directly in the S3 storage configuration:
   ```typescript
   s3Storage({
     // ...other config
     components: {
       S3ClientUploadHandler: './components/S3ClientUploadHandler/Component',
     },
   }),
   ```

### 2. R2 Access Issues

If media files are not accessible, check the following:

1. **Verify R2 Bucket Permissions**:
   Ensure the R2 bucket has the correct permissions for public access.

2. **Check R2 Credentials**:
   Verify that the R2 credentials in the `.env` file are correct.

3. **Test Direct Access to R2**:
   Try accessing a file directly through the R2 URL to verify that the bucket is accessible.

## References

1. [Payload CMS Documentation](https://payloadcms.com/docs)
2. [Payload CMS S3 Adapter Documentation](https://payloadcms.com/docs/upload/storage-adapters/s3)
3. [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
4. [Cloudflare R2 S3 Compatibility](https://developers.cloudflare.com/r2/buckets/)
5. [Content Migration System Documentation](../../z.instructions/content-migration-system.md)
6. [Payload Custom Components Documentation](../../z.instructions/payload-custom-components.md)
