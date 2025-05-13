// seed-documentation.ts
// Script for Stage 2: Core Content Seeding - Documentation
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Placeholder for Markdown to Lexical conversion utility
// import { markdownToLexical } from '../utils/markdown-to-lexical';

console.log('Current working directory:', process.cwd());

// Define the path to the raw documentation files relative to the package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../'); // Adjust based on actual script location relative to root
const documentationRawPath = path.resolve(
  projectRoot,
  'packages/payload-local-init/data/raw/documentation', // Corrected path
);

console.log('Resolved documentationRawPath:', documentationRawPath);

console.log('Starting Stage 2: Seed Documentation...');

export async function seedDocumentation(payload: Payload) {
  try {
    console.log('Executing: Seed Documentation (via orchestrator)...');

    // Find all documentation files with .mdoc extension
    const docFiles = glob.sync(
      documentationRawPath.replace(/\\/g, '/') + '/**/*.mdoc',
      { nodir: true },
    ); // Recursive search

    console.log('Files found by glob:', docFiles);
    console.log(`Found ${docFiles.length} documentation files.`);

    if (docFiles.length === 0) {
      console.warn(
        `Warning: No documentation files found in ${documentationRawPath}. Skipping seeding.`,
      );
      return; // Exit cleanly if no files are found
    }

    for (const filePath of docFiles) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parts = fileContent.split('---');

      if (parts.length < 3) {
        console.error(
          `Error: File "${filePath}" does not have valid frontmatter.`,
        );
        continue; // Skip this file
      }

      const frontmatter = parts[1];
      const markdownContent = parts.slice(2).join('---').trim(); // Join remaining parts

      let docData: any; // Declare docData outside the try block
      let slug: string | null = null; // Declare slug outside try block
      let title: string | null = null; // Declare title outside try block

      try {
        docData = yaml.load(frontmatter) as any;

        // Derive slug from filename if not present in frontmatter
        slug = docData.slug || path.basename(filePath, '.mdoc');
        title = docData.title;

        console.log(`Processing file: ${filePath}`);
        console.log(`Parsed frontmatter data: ${JSON.stringify(docData)}`);
        console.log(`Derived slug: ${slug}, Title: ${title}`);

        if (!slug || !title) {
          console.warn(
            `Skipping file ${filePath} due to missing derived slug or title.`,
          );
          continue;
        }

        // Check if doc already exists by slug
        const existingDoc = await payload.find({
          collection: 'documentation', // Correct collection slug
          where: {
            slug: {
              equals: slug, // Use derived slug for check
            },
          },
        });

        if (existingDoc.docs.length === 0) {
          // Doc does not exist, create it

          // Placeholder: Transform Markdown to Lexical JSON
          // const lexicalContent = markdownToLexical(markdownContent);
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
                      text: `Raw content from ${docData.slug}.mdoc needs conversion.`,
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

          const docPayloadData: any = {
            id: docData.id || uuidv4(), // Use ID from frontmatter if available
            title: title, // Use derived title
            slug: slug, // Use derived slug
            description: docData.description,
            status: docData.status || 'draft',
            _order: docData.order, // Use _order field if 'order' is in frontmatter
            content: lexicalContent, // Use transformed Lexical content
            // Exclude parent relationship from Stage 2 creation
            // parent: docData.parent, // This will be populated in Stage 3
          };

          if (docPayloadData.status === 'published') {
            docPayloadData.published_at = new Date(); // Use published_at field
          }

          console.log(
            'Creating Documentation with data:',
            JSON.stringify(
              { ...docPayloadData, content: '[Markdown Content]' },
              null,
              2,
            ), // Avoid logging full content
          );

          await payload.create({
            collection: 'documentation', // Correct collection slug
            data: docPayloadData,
          });
          console.log(
            `Created Documentation: ${title} (${slug})`, // Use derived title and slug for logging
          );
        } else {
          console.log(
            `Documentation already exists, skipping creation: ${title} (${slug})`, // Use derived title and slug for logging
          );
          // Optionally, update the existing doc if needed
        }
      } catch (error: any) {
        console.error(
          `Error processing Documentation "${title || filePath}":`, // Use derived title if available, otherwise path
          error.message,
        );
        // Continue with other docs
      }
    } // End of for loop

    console.log('Documentation seeding completed.');
  } catch (error: any) {
    console.error('Error during Seed Documentation process:', error.message);
    throw error; // Re-throw to be caught by the orchestrator
  }
}
