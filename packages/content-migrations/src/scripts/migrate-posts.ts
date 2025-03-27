/**
 * Script to migrate blog posts from Markdown files to Payload CMS
 */
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { getPayloadClient } from '../utils/payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrates blog posts from Markdown files to Payload CMS
 */
async function migratePostsToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient();

  // Path to the blog posts files
  const postsDir = path.resolve(
    __dirname,
    '../../../../apps/web/content/posts',
  );
  console.log(`Blog posts directory: ${postsDir}`);

  // Read all .mdoc files
  const mdocFiles = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.mdoc'))
    .map((file) => path.join(postsDir, file));

  console.log(`Found ${mdocFiles.length} blog post files to migrate.`);

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data, content: mdContent } = matter(content);

      // Generate a slug from the file name
      const slug = path.basename(file, '.mdoc');

      // Convert Markdown content to Lexical format
      const lexicalContent = (() => {
        // Create a headless editor instance
        const headlessEditor = createHeadlessEditor({});

        // Convert Markdown to Lexical format
        headlessEditor.update(
          () => {
            $convertFromMarkdownString(mdContent);
          },
          { discrete: true },
        );

        // Get the Lexical JSON
        return headlessEditor.getEditorState().toJSON();
      })();

      // Create a document in the posts collection
      await payload.create({
        collection: 'posts',
        data: {
          title: data.title || slug,
          slug,
          description: data.description || '',
          content: lexicalContent,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'draft',
          categories: data.categories
            ? data.categories.map((category: string) => ({ category }))
            : [],
          tags: data.tags ? data.tags.map((tag: string) => ({ tag })) : [],
        },
      });

      console.log(`Migrated blog post: ${slug}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  console.log('Blog posts migration complete!');
}

// Run the migration
migratePostsToPayload().catch((error) => {
  console.error('Blog posts migration failed:', error);
  process.exit(1);
});
