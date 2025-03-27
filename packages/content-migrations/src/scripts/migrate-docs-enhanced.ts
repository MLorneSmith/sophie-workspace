/**
 * Enhanced script to migrate documentation from Markdown files to Payload CMS
 * Uses the enhanced payload client with token caching and retry logic
 */
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Batch size for document creation
const BATCH_SIZE = 5;

// Delay between batches (in milliseconds)
const BATCH_DELAY = 2000;

/**
 * Sleep for a specified number of milliseconds
 * @param ms - The number of milliseconds to sleep
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Migrates documentation from Markdown files to Payload CMS
 * with improved error handling and batch processing
 */
async function migrateDocsToPayload() {
  // Get the enhanced Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the documentation files - using relative path from this script
  const docsDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/documentation',
  );
  console.log(`Documentation directory: ${docsDir}`);

  // Function to recursively read all .mdoc files
  const readMdocFiles = (dir: string, parentPath = ''): string[] => {
    console.log(`Reading directory: ${dir}`);
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dir);
      console.log(`Found ${items.length} items in directory`);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          console.log(`Found directory: ${item}`);
          files.push(...readMdocFiles(itemPath, path.join(parentPath, item)));
        } else if (item.endsWith('.mdoc')) {
          console.log(`Found .mdoc file: ${item}`);
          files.push(path.join(parentPath, item));
        } else {
          console.log(`Skipping file: ${item} (not a .mdoc file)`);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  };

  // Get all .mdoc files
  const mdocFiles = readMdocFiles(docsDir);
  console.log(`Found ${mdocFiles.length} documentation files to migrate.`);

  // Prepare documents for batch creation
  const documents = [];

  // Process each file
  for (const file of mdocFiles) {
    const filePath = path.join(docsDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: mdContent } = matter(content);

      // Generate a slug from the file path
      const slug = file
        .replace(/\.mdoc$/, '')
        .replace(/\\/g, '/')
        .replace(/^\//, '');

      // Create document data
      const documentData = {
        title: data.title || path.basename(file, '.mdoc'),
        slug,
        description: data.description || '',
        // Use a hardcoded Lexical structure instead of conversion
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: mdContent || 'No content available',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt).toISOString()
          : new Date().toISOString(),
        status: data.status || 'published',
        order: data.order || 0,
        categories: data.categories
          ? data.categories.map((category: string) => ({ category }))
          : [],
        tags: data.tags ? data.tags.map((tag: string) => ({ tag })) : [],
      };

      documents.push(documentData);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log(`Prepared ${documents.length} documents for migration.`);

  // Process documents in batches
  const results = {
    successful: 0,
    failed: 0,
  };

  // Process in batches
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    console.log(
      `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
        documents.length / BATCH_SIZE,
      )}`,
    );

    // Process each item in the batch
    for (const doc of batch) {
      // Log the document data being sent
      console.log(`Attempting to migrate document: ${doc.slug}`);
      console.log(`Document title: ${doc.title}`);
      console.log(`Content structure:`, JSON.stringify(doc.content, null, 2));

      // Extract the text content safely
      const textContent =
        doc.content?.root?.children?.[0]?.children?.[0]?.text ||
        'No content available';

      // Try different content formats if needed
      const contentVariations = [
        // Original format with ltr direction
        {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: textContent,
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        // Variation with null direction
        {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: textContent,
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        // Minimal variation
        {
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: textContent,
                  },
                ],
              },
            ],
            type: 'root',
          },
        },
      ];

      let success = false;
      let lastError = null;

      // Try each content variation until one succeeds
      for (let i = 0; i < contentVariations.length; i++) {
        if (success) break;

        const variation = contentVariations[i];
        console.log(
          `Trying content variation ${i + 1}:`,
          JSON.stringify(variation, null, 2),
        );

        try {
          const docWithVariation = {
            ...doc,
            content: variation,
          };

          await payload.create({
            collection: 'documentation',
            data: docWithVariation,
          });

          console.log(
            `Successfully migrated: ${doc.slug} with variation ${i + 1}`,
          );
          results.successful++;
          success = true;
        } catch (error) {
          console.error(
            `Error migrating ${doc.slug} with variation ${i + 1}:`,
            error,
          );
          lastError = error;

          // Log the full error response
          if (
            error instanceof Error &&
            error.message &&
            error.message.includes('Failed to create document')
          ) {
            try {
              const errorData = JSON.parse(
                error.message.replace('Failed to create document: ', ''),
              );
              console.error(
                'Validation errors:',
                JSON.stringify(errorData, null, 2),
              );
            } catch (parseError) {
              console.error('Could not parse error message:', error.message);
            }
          }

          // Wait a bit before trying the next variation
          await sleep(500);
        }
      }

      // If all variations failed, count as a failure
      if (!success) {
        console.error(`All content variations failed for ${doc.slug}`);
        results.failed++;
      }
    }

    // Add a delay between batches if not the last batch
    if (i + BATCH_SIZE < documents.length) {
      console.log(`Waiting ${BATCH_DELAY / 1000} seconds before next batch...`);
      await sleep(BATCH_DELAY);
    }
  }

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total documents: ${documents.length}`);
  console.log(`Successfully migrated: ${results.successful}`);
  console.log(`Failed to migrate: ${results.failed}`);

  console.log('Migration complete!');
}

// Export the migration function to be used by the enhanced migration script
export default migrateDocsToPayload;

// If this script is run directly, execute the migration
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateDocsToPayload().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
