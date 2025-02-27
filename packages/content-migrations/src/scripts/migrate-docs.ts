/**
 * Script to migrate documentation from Markdown files to Payload CMS
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { convertMarkdownToLexical } from '../utils/markdown-converter.js';
import { getPayloadClient } from '../utils/payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrates documentation from Markdown files to Payload CMS
 */
async function migrateDocsToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient();

  // Path to the documentation files - using relative path from this script
  const docsDir = path.resolve(
    __dirname,
    '../../../../apps/web/content/documentation',
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

  // Migrate each file to Payload
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

      // Create a document in the documentation collection
      await payload.create({
        collection: 'documentation',
        data: {
          title: data.title || path.basename(file, '.mdoc'),
          slug,
          description: data.description || '',
          // Convert Markdown content to Lexical format
          content: convertMarkdownToLexical(mdContent),
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'published',
          order: data.order || 0,
          categories: data.categories
            ? data.categories.map((category: string) => ({ category }))
            : [],
          tags: data.tags ? data.tags.map((tag: string) => ({ tag })) : [],
          // Handle parent relationship if needed
        },
      });

      console.log(`Migrated: ${file}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run the migration
migrateDocsToPayload().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
