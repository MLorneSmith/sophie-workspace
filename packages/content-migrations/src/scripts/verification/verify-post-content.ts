/**
 * Script to verify the full content is properly stored in posts
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

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
 * Verifies the posts in the database have complete content
 */
async function verifyPostsContent() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new pg.Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Get all posts
      const postsResult = await client.query(
        `SELECT id, title, slug, content FROM payload.posts ORDER BY title`,
      );

      console.log(`Found ${postsResult.rows.length} posts in the database.`);

      // Verify content length and structure for each post
      for (const post of postsResult.rows) {
        const { id, title, slug, content } = post;

        console.log(`\n\nVerifying post: ${title} (${slug})`);

        if (!content) {
          console.error(`❌ No content found for post ${id} (${title})`);
          continue;
        }

        // Parse the content JSON
        let parsedContent;
        try {
          parsedContent =
            typeof content === 'string' ? JSON.parse(content) : content;
        } catch (error) {
          console.error(
            `❌ Error parsing content JSON for post ${id} (${title}):`,
            error,
          );
          continue;
        }

        // Check if we have a root node
        if (!parsedContent.root) {
          console.error(
            `❌ No root node found in content for post ${id} (${title})`,
          );
          continue;
        }

        // Check if we have children nodes
        if (
          !parsedContent.root.children ||
          !Array.isArray(parsedContent.root.children)
        ) {
          console.error(
            `❌ No children nodes found in content for post ${id} (${title})`,
          );
          continue;
        }

        // Calculate content length and node counts
        const contentLength = JSON.stringify(parsedContent).length;
        const childrenCount = parsedContent.root.children.length;

        console.log(`Content JSON length: ${contentLength} bytes`);
        console.log(`Number of top-level nodes: ${childrenCount}`);

        // Verify if content looks truncated
        if (contentLength < 1000 && childrenCount < 3) {
          console.warn(
            `⚠️ Content looks potentially truncated for post ${id} (${title})`,
          );
        } else {
          console.log(`✅ Content appears complete for post ${id} (${title})`);
        }

        // Show a preview of the content structure
        const nodeTypes = parsedContent.root.children.map((node) => node.type);
        console.log(`Node types: ${nodeTypes.join(', ')}`);
      }

      console.log('\nVerification complete!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying posts content:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyPostsContent().catch((error) => {
  console.error('Posts content verification failed:', error);
  process.exit(1);
});
