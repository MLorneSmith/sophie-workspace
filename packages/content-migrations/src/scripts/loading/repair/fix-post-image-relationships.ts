/**
 * Fix Post Image Relationships
 *
 * This script ensures that posts in Payload CMS are correctly linked to their image media.
 * It addresses the issue where posts are not displaying their featured images by creating
 * the necessary relationship records in the payload.posts_rels table.
 */
import dotenv from 'dotenv';
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
dotenv.config({ path: path.resolve(__dirname, `../../../../${envFile}`) });

/**
 * Fix the relationships between posts and their images
 */
async function fixPostImageRelationships() {
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

      // Ensure the posts_rels table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'posts_rels'
        );
      `);

      if (!tableExists.rows[0].exists) {
        console.log('Creating posts_rels table...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS payload.posts_rels (
            id UUID PRIMARY KEY,
            _parent_id UUID REFERENCES payload.posts(id) ON DELETE CASCADE,
            field TEXT NOT NULL,
            value TEXT,
            media_id UUID REFERENCES payload.media(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
          );
        `);
      }

      // Check for existing relationships
      const existingRels = await client.query(
        'SELECT COUNT(*) FROM payload.posts_rels WHERE field = $1',
        ['image_id'],
      );

      console.log(
        `Found ${existingRels.rows[0].count} existing post-image relationships`,
      );

      // Get all posts
      const posts = await client.query('SELECT id, slug FROM payload.posts');
      console.log(`Found ${posts.rows.length} posts in total`);

      // Clear existing image relationships to start fresh
      console.log('Clearing existing image relationships...');
      await client.query('DELETE FROM payload.posts_rels WHERE field = $1', [
        'image_id',
      ]);
      await client.query(
        'UPDATE payload.posts SET image_id = NULL, image_id_id = NULL',
      );

      // Mapping of post slugs to image filenames
      const slugToImageMap = {
        'presentation-tips': 'Presentation Tips Optimized.png',
        'art-craft-business-presentation-creation':
          'Art Craft of Presentation Creation.png',
        'pitch-deck': 'pitch-deck-image.png',
        'powerpoint-presentations-defense': 'Defense of PowerPoint.png',
        'presentation-review-bcg': 'BCG-teardown-optimized.jpg',
        'presentation-tools': 'Presentation Tools-optimized.png',
        'public-speaking-anxiety': 'Conquering Public Speaking Anxiety.png',
        'seneca-partnership': 'Seneca Partnership.webp',
        'typology-business-charts': 'business-charts.jpg',
      };

      let successCount = 0;
      let failureCount = 0;

      // Process each post
      for (const post of posts.rows) {
        const slug = post.slug;
        const postId = post.id;

        // Get the image filename for this post
        const imageFilename = slugToImageMap[slug];

        if (!imageFilename) {
          console.log(`No image mapping found for post with slug: ${slug}`);
          failureCount++;
          continue;
        }

        // Find the media record for this filename
        const mediaResult = await client.query(
          'SELECT id FROM payload.media WHERE filename = $1',
          [imageFilename],
        );

        if (mediaResult.rows.length === 0) {
          console.log(
            `No media found with filename: ${imageFilename} for post ${slug}`,
          );
          failureCount++;
          continue;
        }

        const mediaId = mediaResult.rows[0].id;

        // Update the post record with image_id and image_id_id
        await client.query(
          'UPDATE payload.posts SET image_id = $1, image_id_id = $1 WHERE id = $2',
          [mediaId, postId],
        );

        // Create the relationship record
        await client.query(
          `
          INSERT INTO payload.posts_rels (
            id, 
            _parent_id, 
            field, 
            value, 
            media_id, 
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          [uuidv4(), postId, 'image_id', mediaId, mediaId],
        );

        console.log(
          `Created relationship for post "${slug}" with image "${imageFilename}"`,
        );
        successCount++;
      }

      console.log(
        `Relationship fixing completed: ${successCount} fixed, ${failureCount} failed`,
      );

      // Verify relationships were created
      const finalCount = await client.query(
        'SELECT COUNT(*) FROM payload.posts_rels WHERE field = $1',
        ['image_id'],
      );

      console.log(
        `Final count of post-image relationships: ${finalCount.rows[0].count}`,
      );

      if (finalCount.rows[0].count > 0) {
        console.log('Post image relationships fixed successfully!');
      } else {
        console.error('Failed to create any post-image relationships');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fixing post image relationships:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixPostImageRelationships().catch((error) => {
  console.error('Post image relationship fix failed:', error);
  process.exit(1);
});
