#!/usr/bin/env npx tsx
/**
 * List all files in R2 downloads bucket and generate public URLs
 *
 * Usage: npx tsx apps/payload/src/seed/seed-conversion/list-r2-downloads.ts
 *
 * Outputs:
 * - List of all files in the R2 downloads bucket
 * - Public URLs for each file
 * - Comparison with current downloads.json entries
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/payload/.env
config({ path: resolve(__dirname, '../../../.env') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_DOWNLOADS_BUCKET = process.env.R2_DOWNLOADS_BUCKET || 'downloads';

// Public URL base (from existing downloads.json)
const R2_PUBLIC_BASE = 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev';

interface DownloadEntry {
  _ref: string;
  slug: string;
  title: string;
  filename: string;
  url: string;
}

async function main() {
  // Validate environment
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('Missing R2 credentials in environment variables');
    console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  console.log('R2 Downloads Bucket Scanner');
  console.log('===========================\n');
  console.log(`Account ID: ${R2_ACCOUNT_ID}`);
  console.log(`Bucket: ${R2_DOWNLOADS_BUCKET}`);
  console.log(`Public Base: ${R2_PUBLIC_BASE}\n`);

  // Create S3 client for R2
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // List all objects in bucket
    const command = new ListObjectsV2Command({
      Bucket: R2_DOWNLOADS_BUCKET,
    });

    const response = await client.send(command);
    const objects = response.Contents || [];

    console.log(`Found ${objects.length} files in R2 bucket:\n`);

    // Generate URLs for each file
    const r2Files: Array<{ key: string; size: number; url: string }> = [];

    for (const obj of objects) {
      if (obj.Key) {
        const encodedKey = encodeURIComponent(obj.Key);
        const publicUrl = `${R2_PUBLIC_BASE}/${encodedKey}`;
        r2Files.push({
          key: obj.Key,
          size: obj.Size || 0,
          url: publicUrl,
        });
      }
    }

    // Sort by filename
    r2Files.sort((a, b) => a.key.localeCompare(b.key));

    // Display files
    console.log('Files in R2:');
    console.log('-'.repeat(80));
    for (const file of r2Files) {
      const sizeKb = (file.size / 1024).toFixed(1);
      console.log(`  ${file.key} (${sizeKb} KB)`);
      console.log(`    URL: ${file.url}`);
    }

    // Load current downloads.json
    const downloadsJsonPath = resolve(__dirname, '../seed-data/downloads.json');
    let currentDownloads: DownloadEntry[] = [];

    try {
      const content = readFileSync(downloadsJsonPath, 'utf-8');
      currentDownloads = JSON.parse(content);
    } catch {
      console.log('\nCould not read downloads.json');
    }

    // Compare with downloads.json
    console.log('\n' + '='.repeat(80));
    console.log('Comparison with downloads.json:');
    console.log('='.repeat(80));

    const currentFilenames = new Set(currentDownloads.map(d => d.filename));
    const r2Filenames = new Set(r2Files.map(f => f.key));

    // Files in R2 but not in downloads.json
    const missingFromJson = r2Files.filter(f => !currentFilenames.has(f.key));
    if (missingFromJson.length > 0) {
      console.log('\n*** FILES IN R2 BUT MISSING FROM downloads.json: ***');
      for (const file of missingFromJson) {
        console.log(`  + ${file.key}`);
        console.log(`    URL: ${file.url}`);
      }
    } else {
      console.log('\nAll R2 files are in downloads.json');
    }

    // Files in downloads.json but not in R2
    const missingFromR2 = currentDownloads.filter(d => !r2Filenames.has(d.filename));
    if (missingFromR2.length > 0) {
      console.log('\n*** FILES IN downloads.json BUT NOT IN R2: ***');
      for (const file of missingFromR2) {
        console.log(`  - ${file.filename} (${file._ref})`);
      }
    }

    // Generate suggested entries for missing files
    if (missingFromJson.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('Suggested entries for downloads.json:');
      console.log('='.repeat(80));

      const suggestions = missingFromJson.map(file => {
        // Generate slug from filename
        const slug = file.key
          .replace(/\.[^.]+$/, '') // Remove extension
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        // Generate title from filename
        const title = file.key
          .replace(/\.[^.]+$/, '') // Remove extension
          .replace(/^\d+\s*/, ''); // Remove leading numbers

        return {
          _ref: slug,
          slug: slug,
          title: title,
          description: '',
          url: file.url,
          published: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          filename: file.key,
        };
      });

      console.log(JSON.stringify(suggestions, null, 2));
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('Summary:');
    console.log('='.repeat(80));
    console.log(`  Total files in R2: ${r2Files.length}`);
    console.log(`  Total entries in downloads.json: ${currentDownloads.length}`);
    console.log(`  Missing from downloads.json: ${missingFromJson.length}`);
    console.log(`  Missing from R2: ${missingFromR2.length}`);

  } catch (error) {
    console.error('Error listing R2 bucket:', error);
    process.exit(1);
  }
}

main();
