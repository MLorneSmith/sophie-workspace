/**
 * Script to update existing documentation records with properly formatted Lexical content
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
 * Updates existing documentation records with properly formatted Lexical content
 */
async function updateDocsContent() {
  // Get the Payload client
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
  console.log(`Found ${mdocFiles.length} documentation files to update.`);

  // Get all existing documentation records
  const { docs } = await payload.find({
    collection: 'documentation',
    limit: 100, // Adjust as needed
  });

  console.log(`Found ${docs.length} existing documentation records.`);

  // Update each document with properly formatted Lexical content
  for (const file of mdocFiles) {
    const filePath = path.join(docsDir, file);

    try {
      // Generate a slug from the file path
      const slug = file
        .replace(/\.mdoc$/, '')
        .replace(/\\/g, '/')
        .replace(/^\//, '');

      // Find the corresponding document in the database
      const existingDoc = docs.find(
        (doc: { slug: string; title: string; id: string }) => doc.slug === slug,
      );

      if (!existingDoc) {
        console.log(`No existing document found for slug: ${slug}`);
        continue;
      }

      console.log(
        `Updating document: ${existingDoc.title} (ID: ${existingDoc.id})`,
      );

      // Read the markdown content
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: mdContent } = matter(content);

      // Convert Markdown content to Lexical format using Payload's converter
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

      // Update the document with the new Lexical content
      await payload.update({
        collection: 'documentation',
        id: existingDoc.id,
        data: {
          content: lexicalContent,
        },
      });

      console.log(`Updated: ${file}`);
    } catch (error) {
      console.error(`Error updating ${file}:`, error);
    }
  }

  console.log('Update complete!');
}

// Run the update
updateDocsContent().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
