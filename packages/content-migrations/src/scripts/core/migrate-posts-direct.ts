/**
 * Script to migrate blog posts from Markdown files to Payload CMS directly in the PostgreSQL database
 */
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

/**
 * Migrates blog posts from Markdown files directly to the PostgreSQL database
 */
async function migratePostsToDatabase() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Path to the blog posts files
      const postsDir = path.resolve(
        __dirname,
        '../../../../../apps/web/content/posts',
      );
      console.log(`Blog posts directory: ${postsDir}`);

      // Check if the directory exists
      if (!fs.existsSync(postsDir)) {
        console.log(`Blog posts directory does not exist: ${postsDir}`);
        console.log('Skipping blog posts migration.');
        return;
      }

      // Read all .mdoc files
      const mdocFiles = fs
        .readdirSync(postsDir)
        .filter((file) => file.endsWith('.mdoc'))
        .map((file) => path.join(postsDir, file));

      console.log(`Found ${mdocFiles.length} blog post files to migrate.`);

      // Migrate each file to the database
      for (const file of mdocFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const { data, content: mdContent } = matter(content);

          // Generate a slug from the file name
          const slug = path.basename(file, '.mdoc');

          // Convert Markdown content to Lexical format
          const lexicalContent = (() => {
            // Create a headless editor instance with list nodes and heading nodes registered
            const headlessEditor = createHeadlessEditor({
              nodes: [ListNode, ListItemNode, HeadingNode],
            });

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

          // Check if the post already exists
          const existingPostResult = await client.query(
            `SELECT id FROM payload.posts WHERE slug = $1`,
            [slug],
          );

          if (existingPostResult.rows.length > 0) {
            console.log(`Post with slug ${slug} already exists. Skipping.`);
            continue;
          }

          // Create a new post
          const postId = uuidv4();
          await client.query(
            `INSERT INTO payload.posts (
              id, 
              title, 
              slug, 
              description, 
              content, 
              published_at, 
              status, 
              updated_at, 
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [
              postId,
              data.title || slug,
              slug,
              data.description || '',
              JSON.stringify(lexicalContent),
              data.publishedAt
                ? new Date(data.publishedAt).toISOString()
                : new Date().toISOString(),
              data.status || 'draft',
            ],
          );

          // Add categories if they exist
          if (data.categories && Array.isArray(data.categories)) {
            for (let i = 0; i < data.categories.length; i++) {
              const categoryId = uuidv4();
              await client.query(
                `INSERT INTO payload.posts_categories (
                  id, 
                  _parent_id, 
                  category, 
                  updated_at, 
                  created_at,
                  "order"
                ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`,
                [categoryId, postId, data.categories[i], i],
              );
            }
          }

          // Add tags if they exist
          if (data.tags && Array.isArray(data.tags)) {
            for (let i = 0; i < data.tags.length; i++) {
              const tagId = uuidv4();
              await client.query(
                `INSERT INTO payload.posts_tags (
                  id, 
                  _parent_id, 
                  tag, 
                  updated_at, 
                  created_at,
                  "order"
                ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`,
                [tagId, postId, data.tags[i], i],
              );
            }
          }

          console.log(`Migrated blog post: ${slug} with ID: ${postId}`);
        } catch (error) {
          console.error(`Error migrating ${file}:`, error);
        }
      }

      console.log('Blog posts migration complete!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error migrating blog posts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migratePostsToDatabase().catch((error) => {
  console.error('Blog posts migration failed:', error);
  process.exit(1);
});
