/**
 * Script to migrate documentation from Payload data directory to Payload CMS
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

/**
 * Migrates documentation from Payload data directory to Payload CMS
 */
async function migratePayloadDocsToPayload() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the documentation files
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

  // First pass: Create all documents without parent relationships
  const docIdMap = new Map();

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

      // Convert Markdown content to Lexical format or use default empty content
      const lexicalContent = (() => {
        // Create a headless editor instance with list nodes and heading nodes registered
        const headlessEditor = createHeadlessEditor({
          nodes: [ListNode, ListItemNode, HeadingNode],
        });

        // If mdContent is empty, use a default paragraph
        const contentToConvert = mdContent.trim() || 'No content provided.';

        // Convert Markdown to Lexical format
        headlessEditor.update(
          () => {
            $convertFromMarkdownString(contentToConvert);
          },
          { discrete: true },
        );

        // Get the Lexical JSON
        return headlessEditor.getEditorState().toJSON();
      })();

      // Create a document in the documentation collection with simplified data
      const doc = await payload.create({
        collection: 'documentation',
        data: {
          title: data.title || path.basename(file, '.mdoc'),
          slug,
          description: data.description || '',
          content: lexicalContent,
          publishedAt: new Date().toISOString(),
          status: 'published',
          // Removed categories, tags, and order for debugging
        },
      });

      // Store the document ID for later use
      docIdMap.set(slug, doc.id);

      console.log(`Migrated: ${file}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  // Skip second pass for now to debug the issue
  console.log('Skipping second pass (parent relationships) for debugging');

  console.log('Payload documentation migration complete!');
}

// Run the migration
migratePayloadDocsToPayload().catch((error) => {
  console.error('Payload documentation migration failed:', error);
  process.exit(1);
});
