# Phase 3: S3 Storage Issues Fix Implementation Plan

## Problem Analysis

Based on examination of the current system and error logs, we've identified the following S3 storage issues affecting Payload CMS:

1. **Missing Thumbnail References**:

   - Database contains references to thumbnail files (e.g., `d9f6a042-3c85-5fa7-b9d1-143e8c1b6f29-thumbnail.webp`) that don't exist in the R2 bucket
   - These result in 500 errors with `NoSuchKey: The specified key does not exist` messages when Payload attempts to load them
   - Primary issue appears to be with thumbnails, not the main files

2. **Inconsistent URL Formats**:

   - R2 bucket contains PDF files with straightforward names (e.g., "201 Our Process.pdf")
   - Database references use UUID-based paths that may not match actual file locations

3. **No Fallback Mechanism**:
   - When files are missing, the system generates 500 errors instead of gracefully handling the situation
   - No placeholder system exists for missing media

## Implementation Approach

We'll implement a three-tier solution that addresses both immediate issues and ensures long-term reliability:

### Tier 1: Immediate Error Mitigation

Create a middleware that intercepts S3 errors and serves placeholder files, preventing 500 errors from reaching the UI.

### Tier 2: Database-to-S3 Reconciliation

Build a script that scans the database for file references, checks if they exist in S3, and updates references or flags missing files.

### Tier 3: Placeholder Generation

Implement a system to generate and upload placeholder thumbnails for any files missing them, ensuring a complete media library.

## Detailed Implementation Plan

### 1. Create S3 Fallback Middleware

Create a middleware that intercepts S3 errors and serves placeholder files:

```typescript
// Path: apps/payload/src/middleware/s3-fallback-middleware.ts
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Define paths to fallback files
const FALLBACKS = {
  thumbnail: path.resolve(
    __dirname,
    '../../content-migrations/src/data/fallbacks/thumbnail-placeholder.webp',
  ),
  pdf: path.resolve(
    __dirname,
    '../../content-migrations/src/data/fallbacks/download-placeholder.pdf',
  ),
};

/**
 * Middleware to intercept S3 errors and serve fallback files
 * This prevents 500 errors from reaching the client when media is missing
 */
export const s3FallbackMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Store original send method to intercept responses
  const originalSend = res.send;

  // Override send method to check for S3 errors
  res.send = function (body) {
    // Check if this is an S3 error response
    if (
      typeof body === 'string' &&
      body.includes('NoSuchKey') &&
      res.statusCode >= 400
    ) {
      // Determine what type of file was requested
      const url = req.originalUrl || req.url;
      let fallbackType = 'thumbnail';

      if (url.includes('.pdf')) {
        fallbackType = 'pdf';
      }

      // Serve the appropriate fallback file
      try {
        const fallbackPath = FALLBACKS[fallbackType];
        if (fs.existsSync(fallbackPath)) {
          const fallbackContent = fs.readFileSync(fallbackPath);

          // Set status and content type
          res.status(200);
          res.type(fallbackType === 'pdf' ? 'application/pdf' : 'image/webp');

          // Log for monitoring
          console.log(`Serving fallback for ${url}`);

          // Send fallback content using original method
          return originalSend.call(this, fallbackContent);
        }
      } catch (error) {
        console.error('Error serving fallback:', error);
      }
    }

    // Default behavior if no fallback was served
    return originalSend.call(this, body);
  };

  next();
};
```

### 2. Create Fallback File Setup Script

Create a script to generate fallback placeholder files:

```typescript
// Path: packages/content-migrations/src/scripts/repair/storage/create-s3-fallbacks.ts
import fs from 'fs';
import path from 'path';

/**
 * Creates the necessary fallback files and directory structure
 * These files will be served when actual S3 files are missing
 */
export async function createS3Fallbacks() {
  const results = {
    createdFallbacks: 0,
    errors: [],
  };

  try {
    // Create fallback directory
    const fallbackDir = path.resolve(
      __dirname,
      '../../../../src/data/fallbacks',
    );
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }

    // Create PDF placeholder
    const pdfPlaceholder = path.join(fallbackDir, 'download-placeholder.pdf');
    if (!fs.existsSync(pdfPlaceholder)) {
      // Create a minimal valid PDF
      const minimalPdf =
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n';
      fs.writeFileSync(pdfPlaceholder, minimalPdf);
      results.createdFallbacks++;
    }

    // Create thumbnail placeholder (minimal WebP)
    const thumbnailPlaceholder = path.join(
      fallbackDir,
      'thumbnail-placeholder.webp',
    );
    if (!fs.existsSync(thumbnailPlaceholder)) {
      // This is a minimal valid WebP file (1x1 pixel)
      const minimalWebp = Buffer.from(
        'UklGRmQAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSBQAAAABF6CgbQSdASoQABAAAFAmAJ0BKhAAEAAASA==',
        'base64',
      );
      fs.writeFileSync(thumbnailPlaceholder, minimalWebp);
      results.createdFallbacks++;
    }

    // Install the middleware in Payload config
    await setupMiddlewareInPayloadConfig();
    results.createdFallbacks++;

    return results;
  } catch (error) {
    console.error('Error creating S3 fallbacks:', error);
    results.errors.push(`Error: ${error.message}`);
    return results;
  }
}

/**
 * Updates the Payload config to use the S3 fallback middleware
 */
async function setupMiddlewareInPayloadConfig() {
  // Path to Payload config
  const payloadConfigPath = path.resolve(
    __dirname,
    '../../../../../apps/payload/src/payload.config.ts',
  );

  // Create the middleware file if it doesn't exist
  const middlewarePath = path.resolve(
    __dirname,
    '../../../../../apps/payload/src/middleware/s3-fallback-middleware.ts',
  );

  const middlewareDir = path.dirname(middlewarePath);
  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true });
  }

  // Write the middleware file content
  if (!fs.existsSync(middlewarePath)) {
    const middlewareContent = `
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Fallback paths
const FALLBACKS = {
  thumbnail: path.resolve(__dirname, '../../content-migrations/src/data/fallbacks/thumbnail-placeholder.webp'),
  pdf: path.resolve(__dirname, '../../content-migrations/src/data/fallbacks/download-placeholder.pdf'),
}

/**
 * Middleware to handle S3 NoSuchKey errors with fallback files
 */
export const s3FallbackMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original send method to intercept responses
  const originalSend = res.send;
  
  // Override send method to check for S3 errors
  res.send = function(body) {
    // Check if this is an S3 error response
    if (typeof body === 'string' && 
        (body.includes('NoSuchKey') || body.includes('AccessDenied')) && 
        res.statusCode >= 400) {
      
      // Determine what type of file was requested
      const url = req.originalUrl || req.url;
      let fallbackType = 'thumbnail';
      
      if (url.includes('.pdf') || url.includes('/downloads/')) {
        fallbackType = 'pdf';
      }
      
      // Serve the appropriate fallback file
      try {
        const fallbackPath = FALLBACKS[fallbackType];
        if (fs.existsSync(fallbackPath)) {
          const fallbackContent = fs.readFileSync(fallbackPath);
          
          // Set status and content type
          res.status(200);
          res.type(fallbackType === 'pdf' ? 'application/pdf' : 'image/webp');
          
          // Log for monitoring
          console.log(\`Serving fallback for \${url} (type: \${fallbackType})\`);
          
          // Send fallback content using original method
          return originalSend.call(this, fallbackContent);
        }
      } catch (error) {
        console.error('Error serving fallback:', error);
      }
    }
    
    // Default behavior if no fallback was served
    return originalSend.call(this, body);
  };
  
  next();
};
`;
    fs.writeFileSync(middlewarePath, middlewareContent);
  }

  // Update Payload config to use the middleware
  if (fs.existsSync(payloadConfigPath)) {
    let configContent = fs.readFileSync(payloadConfigPath, 'utf8');

    // Only update if not already using the middleware
    if (!configContent.includes('s3FallbackMiddleware')) {
      // Add import for the middleware
      configContent = configContent.replace(
        /import.*;/g,
        (match) =>
          `${match}\nimport { s3FallbackMiddleware } from './middleware/s3-fallback-middleware';`,
      );

      // Add middleware to express config
      if (configContent.includes('express: {')) {
        // If express config already exists
        configContent = configContent.replace(
          /express:\s*{/,
          'express: {\n  middleware: [s3FallbackMiddleware],',
        );
      } else {
        // If no express config exists
        configContent = configContent.replace(
          /export default buildConfig\({/,
          'export default buildConfig({\n  express: {\n    middleware: [s3FallbackMiddleware],\n  },',
        );
      }

      fs.writeFileSync(payloadConfigPath, configContent);
    }
  }
}

// Run the script when executed directly
if (require.main === module) {
  createS3Fallbacks()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
```

### 3. Create Database-to-S3 Reconciliation Script

Create a script that fixes database references to match actual S3 state:

```typescript
// Path: packages/content-migrations/src/scripts/repair/storage/fix-s3-references.ts
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

import { getPayloadClient } from '../../../utils/db/payload-client';

// Configure S3 client
const s3 = new S3Client({
  endpoint:
    process.env.S3_ENDPOINT || 'https://[account-id].r2.cloudflarestorage.com',
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

/**
 * Main function to scan database and fix S3 references
 * This reconciles database records with actual S3 storage state
 */
export async function fixS3References() {
  const payload = await getPayloadClient();
  const results = {
    scannedRecords: 0,
    fixedUrls: 0,
    missingThumbnails: 0,
    errors: [],
  };

  try {
    // Get all files in the downloads bucket for reference
    const allS3Files = await listAllFiles('downloads');
    console.log(`Found ${allS3Files.length} files in R2 bucket`);

    // Scan the downloads collection for file references
    const downloads = await payload.find({
      collection: 'downloads',
      limit: 1000,
    });

    results.scannedRecords = downloads.docs.length;

    for (const download of downloads.docs) {
      try {
        let needsUpdate = false;
        const updateData: any = {};

        // Check thumbnail URL if it exists
        if (download.thumbnail) {
          const thumbnailKey = extractKeyFromUrl(download.thumbnail);

          if (
            thumbnailKey &&
            !(await fileExistsInS3('downloads', thumbnailKey))
          ) {
            // Thumbnail doesn't exist - update record to remove reference
            updateData.thumbnail = null;
            updateData.thumbnailStatus = 'missing';
            needsUpdate = true;
            results.missingThumbnails++;
          }
        }

        // Check main file URL
        if (download.url) {
          const fileKey = extractKeyFromUrl(download.url);

          if (fileKey && !(await fileExistsInS3('downloads', fileKey))) {
            // Try to find a matching file by name
            const matchingFile = findMatchingFile(
              allS3Files,
              download.filename,
            );

            if (matchingFile) {
              // Found a match - update the URL
              updateData.url = formatFileUrl(matchingFile);
              needsUpdate = true;
              results.fixedUrls++;
            } else {
              // No match found - flag as missing
              updateData.status = 'missing';
              needsUpdate = true;
            }
          }
        }

        // Update the record if needed
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

    return results;
  } catch (error) {
    console.error('Error fixing S3 references:', error);
    results.errors.push(`General error: ${error.message}`);
    return results;
  }
}

/**
 * Helper function to check if a file exists in S3
 */
async function fileExistsInS3(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to list all files in an S3 bucket
 */
async function listAllFiles(bucket: string): Promise<string[]> {
  const results: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
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

/**
 * Helper function to extract the file key from a URL
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.substring(1); // Remove leading slash
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to find a matching file by name
 */
function findMatchingFile(files: string[], filename?: string): string | null {
  if (!filename) return null;

  // Try to find an exact match
  const exactMatch = files.find((file) => file.endsWith(filename));
  if (exactMatch) return exactMatch;

  // Try to find a partial match (filename might be truncated)
  const partialMatch = files.find((file) => {
    const fileBasename = path.basename(file);
    return fileBasename.includes(filename) || filename.includes(fileBasename);
  });

  return partialMatch || null;
}

/**
 * Helper function to format a file URL
 */
function formatFileUrl(key: string): string {
  return `https://downloads.slideheroes.com/${encodeURIComponent(key)}`;
}

// Run the script when executed directly
if (require.main === module) {
  fixS3References()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
```

### 4. Create Thumbnail Generation Script

Create a script that generates and uploads thumbnails for missing items:

```typescript
// Path: packages/content-migrations/src/scripts/repair/storage/create-thumbnail-placeholders.ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

import { getPayloadClient } from '../../../utils/db/payload-client';

// Configure S3 client
const s3 = new S3Client({
  endpoint:
    process.env.S3_ENDPOINT || 'https://[account-id].r2.cloudflarestorage.com',
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

/**
 * Main function to create and upload thumbnail placeholders
 * This ensures all downloads have thumbnail images even if real thumbnails don't exist
 */
export async function createThumbnailPlaceholders() {
  const payload = await getPayloadClient();
  const results = {
    createdThumbnails: 0,
    errors: [],
  };

  try {
    // Create a base placeholder thumbnail
    const placeholderDir = path.resolve(
      __dirname,
      '../../../../src/data/fallbacks',
    );
    if (!fs.existsSync(placeholderDir)) {
      fs.mkdirSync(placeholderDir, { recursive: true });
    }

    const placeholderPath = path.join(
      placeholderDir,
      'thumbnail-placeholder.webp',
    );

    // Create a simple WebP placeholder if it doesn't exist
    if (!fs.existsSync(placeholderPath)) {
      // This is a minimal valid WebP file (1x1 pixel)
      const minimalWebp = Buffer.from(
        'UklGRmQAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSBQAAAABF6CgbQSdASoQABAAAFAmAJ0BKhAAEAAASA==',
        'base64',
      );
      fs.writeFileSync(placeholderPath, minimalWebp);
    }

    // Query for downloads missing thumbnails
    const downloads = await payload.find({
      collection: 'downloads',
      where: {
        and: [
          { url: { exists: true } },
          {
            or: [
              { thumbnail: { exists: false } },
              { thumbnail: { equals: null } },
              { thumbnailStatus: { equals: 'missing' } },
            ],
          },
        ],
      },
      limit: 1000,
    });

    console.log(`Found ${downloads.docs.length} downloads without thumbnails`);

    // Process each download
    for (const download of downloads.docs) {
      try {
        // Generate thumbnail key based on document ID
        const thumbnailKey = `${download.id}-thumbnail.webp`;

        // Upload placeholder to R2
        await s3.send(
          new PutObjectCommand({
            Bucket: 'downloads',
            Key: thumbnailKey,
            Body: fs.readFileSync(placeholderPath),
            ContentType: 'image/webp',
          }),
        );

        // Update database record with thumbnail URL
        await payload.update({
          collection: 'downloads',
          id: download.id,
          data: {
            thumbnail: `https://downloads.slideheroes.com/${thumbnailKey}`,
            thumbnailStatus: 'placeholder',
          },
        });

        results.createdThumbnails++;
      } catch (error) {
        results.errors.push(
          `Error creating thumbnail for ${download.id}: ${error.message}`,
        );
      }
    }

    return results;
  } catch (error) {
    console.error('Error creating thumbnail placeholders:', error);
    results.errors.push(`General error: ${error.message}`);
    return results;
  }
}

// Run the script when executed directly
if (require.main === module) {
  createThumbnailPlaceholders()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
```

### 5. Update Package.json Scripts

Add these new scripts to `packages/content-migrations/package.json`:

```json
{
  "scripts": {
    "fix:s3-references": "tsx src/scripts/repair/storage/fix-s3-references.ts",
    "create:thumbnail-placeholders": "tsx src/scripts/repair/storage/create-thumbnail-placeholders.ts",
    "setup:s3-fallback-middleware": "tsx src/scripts/repair/storage/create-s3-fallbacks.ts",
    "fix:s3-storage": "pnpm run setup:s3-fallback-middleware && pnpm run fix:s3-references && pnpm run create:thumbnail-placeholders"
  }
}
```

### 6. Integration with Content Migration System

Update the loading phase in `scripts/orchestration/phases/loading.ps1` to include our S3 fix steps:

```powershell
# Add this to the Fix-Relationships function or create a new section

# Fix S3 storage issues
Log-EnhancedStep "Fixing S3 storage issues" 10.5 12
Log-Message "Setting up S3 fallback middleware..." "Yellow"
Exec-Command -command "pnpm --filter @kit/content-migrations run setup:s3-fallback-middleware" -description "Setting up S3 fallback middleware" -continueOnError

Log-Message "Fixing S3 references in database..." "Yellow"
Exec-Command -command "pnpm --filter @kit/content-migrations run fix:s3-references" -description "Fixing S3 references" -continueOnError

Log-Message "Creating thumbnail placeholders..." "Yellow"
Exec-Command -command "pnpm --filter @kit/content-migrations run create:thumbnail-placeholders" -description "Creating thumbnail placeholders" -continueOnError

Log-Success "S3 storage issues fixed successfully"
Log-EnhancedStepCompletion -Success $true
```

## Testing Plan

### 1. Test S3 Fallback Middleware

1. Run the middleware setup: `pnpm --filter @kit/content-migrations run setup:s3-fallback-middleware`
2. Start the Payload CMS server
3. Verify that:
   - When accessing a missing thumbnail, a placeholder is served instead of a 500 error
   - Server logs show "Serving fallback for" messages when fallbacks are triggered
   - The admin UI displays properly without errors

### 2. Test Database-to-S3 Reconciliation

1. Run the reconciliation script: `pnpm --filter @kit/content-migrations run fix:s3-references`
2. Verify that:
   - The script identifies and reports missing thumbnails
   - Database records are updated appropriately
   - URLs are fixed to match actual S3 files

### 3. Test Thumbnail Placeholder Generation

1. Run the placeholder generation script: `pnpm --filter @kit/content-migrations run create:thumbnail-placeholders`
2. Verify that:
   - Placeholder thumbnails are uploaded to R2
   - Database records are updated with new thumbnail URLs
   - Missing thumbnails are properly replaced

### 4. End-to-End Testing

1. Run the full content migration process with the new S3 fixes integrated
2. Verify that:
   - No 500 errors occur when accessing media
   - All downloads show thumbnails in the admin UI
   - The system gracefully handles any remaining missing files

## Success Metrics

1. **Zero 500 Errors**: No more "NoSuchKey" errors in the server logs when accessing media files
2. **Complete Thumbnails**: All downloads have visible thumbnails in the admin UI
3. **Accurate Database**: Database records accurately reflect the state of the S3 storage
4. **Graceful Fallbacks**: Any remaining issues are handled gracefully with fallbacks

## Maintenance Considerations

1. **Regular Monitoring**: Implement periodic checks for S3 storage health
2. **Automated Repair**: Run the repair scripts periodically as part of system maintenance
3. **Logging and Alerts**: Set up alerts for any NoSuchKey errors to proactively address storage issues
