// SSOT for Post <-> FeaturedImage relationships
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';

// Added Payload type import

import { getActualImageFilename } from '../data/mappings/image-mappings';

// Removed: import { getPayloadClient } from './payload-client';

// Library to parse frontmatter

// Use import.meta.url for ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsRawPath = path.resolve(__dirname, '../data/raw/posts'); // CORRECTED path

export async function populatePostImageRelationships(payload: Payload) {
  // Added payload parameter
  // Ensure export is present
  console.log('Populating Post <-> FeaturedImage relationships...');
  // Removed: const payloadClient = await getPayloadClient(true);

  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0; // Added notFoundCount

  try {
    // Get all media documents first
    const allMediaResult = await payload.find({
      // Changed payloadClient to payload
      collection: 'media',
      limit: 1000, // Adjust limit if necessary to fetch all media
      depth: 0,
    });

    const allMedia = allMediaResult.docs;

    // Get list of post files
    const postFiles = fs
      .readdirSync(postsRawPath)
      .filter((file) => file.endsWith('.mdoc'));

    // Iterate through each post file
    for (const postFile of postFiles) {
      const filePath = path.join(postsRawPath, postFile);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(fileContents);

      const postSlug = postFile.replace(/\.mdoc$/, ''); // Derive slug from filename

      // Get the image path from frontmatter
      const imagePath = frontmatter.image;

      // Skip if no image path in frontmatter
      if (!imagePath) {
        console.log(
          `Post "${postSlug}" has no featured image defined in frontmatter. Skipping.`,
        );
        continue;
      }

      // Get the actual R2 filename from the image path using the mapping
      const r2Filename = getActualImageFilename(imagePath);

      // Skip if no mapping found for the image path
      if (!r2Filename) {
        console.warn(
          `No R2 filename mapping found for image path "${imagePath}" in post "${postSlug}". Skipping.`,
        );
        errorCount++;
        continue;
      }

      try {
        // 1. Find the media document by filename in the fetched media
        const foundMedia = allMedia.find(
          (media) => media.filename === r2Filename,
        );

        if (!foundMedia) {
          console.warn(
            `Skipping relation: Could not find media document with filename "${r2Filename}" for post "${postSlug}".`,
          );
          notFoundCount++;
          continue;
        }

        const mediaId = foundMedia.id; // Get the ID from the found document

        // 2. Find the post document by slug
        const postResult = await payload.find({
          // Changed payloadClient to payload
          collection: 'posts', // Use actual collection slug for Posts
          where: { slug: { equals: postSlug } }, // Find by slug
          limit: 1,
        });

        if (!postResult.docs || postResult.docs.length === 0) {
          console.warn(
            `Skipping relation: Could not find post document with slug "${postSlug}".`,
          );
          errorCount++;
          continue;
        }

        const postId = postResult.docs[0]!.id; // Add non-null assertion

        // 3. Update the post document to link the featured image
        // Relationship field name in Posts collection is 'image_id' (hasOne)
        await payload.update({
          // Changed payloadClient to payload
          collection: 'posts', // Update the post document
          id: postId,
          data: {
            image_id: mediaId, // Use the correct relationship field name 'image_id'
          },
        });

        console.log(
          `Linked FeaturedImage (ID: ${mediaId}) to Post (Slug: ${postSlug})`,
        );
        successCount++;
      } catch (error: any) {
        console.error(
          `Error linking FeaturedImage to Post (Slug: ${postSlug}):`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log(
      `Post <-> FeaturedImage relationships population complete. Successful: ${successCount}, Failed: ${errorCount}, Not Found: ${notFoundCount}.`,
    );
  } catch (error: any) {
    console.error(
      'Error populating Post <-> FeaturedImage relationships:',
      error,
    );
    throw error; // Re-throw error to be caught by run-stage-3.ts
  }
  if (errorCount > 0 || notFoundCount > 0) {
    throw new Error(
      `populatePostImageRelationships encountered ${errorCount} errors and ${notFoundCount} items not found.`,
    );
  }
}

// Removed direct execution block
// populatePostImageRelationships().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
