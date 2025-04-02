/**
 * Script to seed course data directly to the database
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Seeds the course data directly in the database
 */
export async function seedCourseData() {
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

      // Check if the course already exists
      const checkResult = await client.query(
        'SELECT id FROM payload.courses WHERE id = $1',
        ['3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'],
      );

      if (checkResult.rows.length > 0) {
        console.log('Course already exists, skipping seed');
        return;
      }

      // Create a simple content structure for intro_content
      const introContent = {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Welcome to Decks for Decision Makers! This course will teach you how to create effective presentations for decision makers.',
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

      // Create a simple content structure for completion_content
      const completionContent = {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Congratulations on completing the course! You now have the skills to create effective presentations for decision makers.',
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

      // Insert the main course
      await client.query(
        `INSERT INTO payload.courses (
          id,
          title,
          slug,
          description,
          status,
          estimated_duration,
          show_progress_bar,
          intro_content,
          completion_content,
          updated_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', // Fixed UUID for the course
          'Decks for Decision Makers',
          'decks-for-decision-makers',
          'Learn how to create effective presentations for decision makers',
          'published',
          240, // 4 hours
          true,
          JSON.stringify(introContent),
          JSON.stringify(completionContent),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      console.log('Course data seeded successfully');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCourseData().catch((error) => {
    console.error('Course data seeding failed:', error);
    process.exit(1);
  });
}
