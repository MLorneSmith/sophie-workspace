import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';

// Added Payload type import
// Removed: import { getPayloadClient } from './payload-client';

// Use import.meta.url for ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRawPath = path.resolve(__dirname, '../data/raw/documentation'); // CORRECTED path

export async function populateDocumentationHierarchy(payload: Payload) {
  // Added payload parameter
  // ADDED export
  console.log('Populating Documentation hierarchy (parent relationships)...');
  // Removed: const payloadClient = await getPayloadClient(true);

  let successCount = 0;
  let errorCount = 0;

  try {
    // Get list of all documentation files recursively
    const docFiles = getAllMdocFiles(docsRawPath);

    // Iterate through each documentation file
    for (const filePath of docFiles) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(fileContents);

      // Derive slug consistently with Stage 2: prefer frontmatter slug, fallback to filename
      const fileSlug = path.basename(filePath, '.mdoc');
      const childSlug = frontmatter.slug || fileSlug; // Use frontmatter slug if available

      // Get the parent slug from frontmatter
      // The parent slug in frontmatter might be in the format 'directory/filename'
      // We need to extract just the filename part to match the seeded parent slug
      const rawParentSlug = frontmatter.parent;
      const parentSlug = rawParentSlug ? path.basename(rawParentSlug) : null; // Extract filename part

      // Skip if no parent defined or parent slug is null after extraction
      if (!parentSlug) {
        console.log(
          `Doc "${childSlug}" has no parent defined or parent slug is invalid. Skipping.`,
        );
        continue;
      }

      // Skip if no parent defined
      if (!rawParentSlug) {
        // Use rawParentSlug here to check if parent was defined at all
        console.log(`Doc "${childSlug}" has no parent defined. Skipping.`);
        continue;
      }

      // Now, check if the extracted parentSlug is valid (not just an empty string)
      if (!parentSlug) {
        console.warn(
          `Doc "${childSlug}" has an invalid parent slug "${rawParentSlug}". Skipping.`,
        );
        errorCount++;
        continue;
      }

      // Skip if no parent defined
      if (!parentSlug) {
        console.log(`Doc "${childSlug}" has no parent defined. Skipping.`);
        continue;
      }

      try {
        // 1. Find the child document by slug
        const childResult = await payload.find({
          // Changed payloadClient to payload
          collection: 'documentation', // Use actual collection slug
          where: { slug: { equals: childSlug } }, // Use the derived childSlug
          limit: 1,
        });

        if (!childResult.docs || childResult.docs.length === 0) {
          console.warn(
            `Skipping hierarchy: Could not find child doc with slug "${childSlug}".`,
          );
          errorCount++;
          continue;
        }
        const childId = childResult.docs[0]!.id;

        // 2. Find the parent document by slug
        const parentResult = await payload.find({
          // Changed payloadClient to payload
          collection: 'documentation', // Use actual collection slug
          where: { slug: { equals: parentSlug } }, // Use the parentSlug from frontmatter
          limit: 1,
        });

        if (!parentResult.docs || parentResult.docs.length === 0) {
          console.warn(
            `Skipping hierarchy: Could not find parent doc with slug "${parentSlug}" for child "${childSlug}".`,
          );
          errorCount++;
          continue;
        }
        const parentId = parentResult.docs[0]!.id;

        // 3. Update the child document to link the parent
        // Relationship field name in Documentation collection is 'parent_id' (hasOne)
        await payload.update({
          // Changed payloadClient to payload
          collection: 'documentation', // Update the child document
          id: childId,
          data: {
            parent: parentId, // Corrected field name from 'parent_id' to 'parent'
          },
        });

        console.log(`Linked Parent (${parentSlug}) to Child (${childSlug})`);
        successCount++;
      } catch (error: any) {
        console.error(
          `Error linking Parent (${parentSlug}) to Child (${childSlug}):`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log(
      `Documentation hierarchy population complete. Successful: ${successCount}, Failed: ${errorCount}.`,
    );
  } catch (error: any) {
    console.error('Error populating Documentation hierarchy:', error);
    throw error; // Re-throw error to be caught by run-stage-3.ts
  }
  if (errorCount > 0) {
    throw new Error(
      `populateDocumentationHierarchy encountered ${errorCount} errors.`,
    );
  }
}

// Helper function to recursively get all .mdoc files
function getAllMdocFiles(
  dirPath: string,
  arrayOfFiles: string[] = [],
): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllMdocFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.mdoc')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Removed direct execution block
// populateDocumentationHierarchy().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
