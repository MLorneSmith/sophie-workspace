import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import config from '../../../apps/payload/src/payload.config';

// Placeholder for HTML to Lexical conversion utility
// import { htmlToLexical } from '../utils/html-to-lexical';

// @ts-ignore
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Corrected path to the raw private HTML files
const privateRawPath = path.resolve(
  dirname,
  '../data/raw/private', // Pointing to the correct location within payload-local-init
);

async function seedPrivate() {
  console.log('Starting Stage 2: Seed Private...');

  let payload: Payload | null = null;

  try {
    // Initialize Payload
    console.log('Initializing Payload...');
    payload = await getPayload({ config });
    console.log('Payload initialized.');

    // Read raw private HTML files
    let privateFiles: string[] = [];
    try {
      if (fs.existsSync(privateRawPath)) {
        privateFiles = fs
          .readdirSync(privateRawPath)
          .filter((file) => file.endsWith('.html')); // Look for .html files
      } else {
        console.warn(`Warning: Directory ${privateRawPath} does not exist.`);
      }
    } catch (readError: any) {
      console.error(
        `Error reading directory ${privateRawPath}:`,
        readError.message,
      );
      privateFiles = [];
    }

    console.log(`Found ${privateFiles.length} private HTML files.`);

    if (privateFiles.length === 0) {
      console.warn(
        `Warning: No private HTML files found in ${privateRawPath}. Skipping seeding.`,
      );
      process.exit(0);
    }

    // Seed Private collection
    console.log('Seeding Private...');
    for (const file of privateFiles) {
      const filePath = path.join(privateRawPath, file);
      const slug = path.basename(file, '.html'); // Use filename as slug
      const title = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()); // Basic title generation

      try {
        // Check if item already exists by slug
        const existingItem = await payload.find({
          collection: 'private',
          where: {
            slug: {
              equals: slug,
            },
          },
        });

        if (existingItem.docs.length === 0) {
          const htmlContent = fs.readFileSync(filePath, 'utf8');

          // Placeholder: Transform HTML to Lexical JSON
          // const lexicalContent = htmlToLexical(htmlContent);
          // For now, use a placeholder
          const lexicalContent = {
            // Basic Lexical structure placeholder
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: `HTML content from ${file} needs conversion.`,
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
          };

          const privatePayloadData = {
            id: uuidv4(), // Generate a new UUID
            title: title,
            slug: slug,
            content: lexicalContent,
            status: 'draft', // Default status
            published_at: null,
            // Add other default fields if necessary based on collection definition
          };

          console.log(`Attempting to create Private Item: ${title} (${slug})`);
          const createdItem = await payload.create({
            collection: 'private',
            data: privatePayloadData,
          });
          console.log(
            `Created Private Item: ${createdItem.title} (${createdItem.id})`,
          );
        } else {
          console.log(
            `Private Item already exists, skipping creation: ${title} (${existingItem.docs[0]?.id})`,
          );
          // Optionally, update the existing item if needed
        }
      } catch (error: any) {
        console.error(
          `Error processing private item ${title} from file ${file}:`,
          error.message,
        );
        // Continue with the next file even if one fails
      }
    } // End of for loop

    console.log('Private seeding completed.');
    process.exit(0); // Exit cleanly on success
  } catch (error: any) {
    // Catch errors from payload init or directory reading
    const errorMessage = error?.message ?? 'Unknown error';
    console.error('Error during Seed Private process:', errorMessage);
    process.exit(1); // Exit with a non-zero code on failure
  } finally {
    // No payload shutdown needed, rely on process exit
    console.log('Seed Private script finished.');
  }
}

seedPrivate();
