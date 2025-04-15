/**
 * Fix Downloads Relationships Script
 *
 * This script addresses issues with the Downloads collection relationships in Payload CMS:
 * 1. Fixes the relationship between lessons and downloads in the junction table
 * 2. Drops the problematic downloads_diagnostic view that's causing ALTER TABLE errors
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

import { DOWNLOAD_ID_MAP } from '../../data/download-id-map.js';

const { Client } = pg;

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Database connection
const client = new Client({
  connectionString:
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixDownloadsRelationships(): Promise<void> {
  console.log(
    'Fixing Downloads relationships and removing problematic view...',
  );

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Start a transaction for atomicity
    await client.query('BEGIN');
    console.log('Transaction started');

    // 1. Drop the problematic view that's causing ALTER TABLE errors
    try {
      await client.query(`DROP VIEW IF EXISTS payload.downloads_diagnostic`);
      console.log(
        'Dropped downloads_diagnostic view that was causing ALTER TABLE errors',
      );
    } catch (viewError) {
      console.error('Error dropping view:', viewError);
      // Continue even if there's an error with the view
    }

    // 2. Fix the our-process lesson downloads relationship
    // First check if there's already a relationship
    const checkRelationshipResult = await client.query(`
      SELECT COUNT(*) as count
      FROM payload.course_lessons_downloads
      WHERE lesson_id = 'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1' 
      AND download_id = 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28'
    `);

    const hasRelationship =
      parseInt(checkRelationshipResult.rows[0].count, 10) > 0;

    if (hasRelationship) {
      console.log(
        'Our Process lesson already has a relationship with the Our Process PDF',
      );
    } else {
      // Create the relationship with the proper order
      await client.query(`
        INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, "order")
        VALUES (uuid_generate_v4(), 'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1', 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', 0)
      `);
      console.log(
        'Created relationship between Our Process lesson and Our Process PDF',
      );
    }

    // 3. Fix any placeholder filenames and URLs
    await client.query(`
      UPDATE payload.downloads
      SET 
        filename = CASE 
          WHEN id = '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1' THEN 'SlideHeroes Presentation Template.zip'
          WHEN id = 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6' THEN 'SlideHeroes Swipe File.zip'
          WHEN id = 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28' THEN '201 Our Process.pdf'
          WHEN id = 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456' THEN '202 The Who.pdf'
          WHEN id = 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593' THEN '203 The Why - Introductions.pdf'
          WHEN id = 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04' THEN '204 The Why - Next Steps.pdf'
          WHEN id = 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18' THEN '301 Idea Generation.pdf'
          WHEN id = 'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29' THEN '302 What is Structure.pdf'
          WHEN id = 'e017b153-4d96-6fb8-c0e2-354f9d2c7130' THEN '401 Using Stories.pdf'
          WHEN id = 'f158c264-5e07-71c9-d1f3-165e0e3d8541' THEN '403 Storyboards in Presentations.pdf'
          ELSE filename
        END,
        url = CASE 
          WHEN id = '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1' THEN 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip'
          WHEN id = 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6' THEN 'https://downloads.slideheroes.com/SlideHeroes Swipe File.zip'
          WHEN id = 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28' THEN 'https://downloads.slideheroes.com/201 Our Process.pdf'
          WHEN id = 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456' THEN 'https://downloads.slideheroes.com/202 The Who.pdf'
          WHEN id = 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593' THEN 'https://downloads.slideheroes.com/203 The Why - Introductions.pdf'
          WHEN id = 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04' THEN 'https://downloads.slideheroes.com/204 The Why - Next Steps.pdf'
          WHEN id = 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18' THEN 'https://downloads.slideheroes.com/301 Idea Generation.pdf'
          WHEN id = 'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29' THEN 'https://downloads.slideheroes.com/302 What is Structure.pdf'
          WHEN id = 'e017b153-4d96-6fb8-c0e2-354f9d2c7130' THEN 'https://downloads.slideheroes.com/401 Using Stories.pdf'
          WHEN id = 'f158c264-5e07-71c9-d1f3-165e0e3d8541' THEN 'https://downloads.slideheroes.com/403 Storyboards in Presentations.pdf'
          ELSE url
        END
      WHERE filename LIKE 'placeholder%' OR url LIKE '%/9e12f8b7.pdf' OR url LIKE '%/a1b2c3d4.pdf'
    `);

    console.log('Fixed placeholder filenames and URLs');

    // 4. Check if course_quizzes_downloads table exists before trying to use it
    const checkQuizDownloadsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'payload'
        AND    table_name   = 'course_quizzes_downloads'
      );
    `);

    const quizDownloadsTableExists =
      checkQuizDownloadsTableResult.rows[0].exists;

    if (quizDownloadsTableExists) {
      // Fix course quiz downloads relationships since logs show issues there too
      const fixQuizDownloadsResult = await client.query(`
        -- First, create relationships for the quiz if they don't exist
        INSERT INTO payload.course_quizzes_downloads (id, course_quizzes_id, download_id, "order")
        SELECT 
          uuid_generate_v4(), 
          '5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b', 
          'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', 
          0
        WHERE NOT EXISTS (
          SELECT 1 FROM payload.course_quizzes_downloads 
          WHERE course_quizzes_id = '5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b'
          AND download_id = 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28'
        );
      `);
      console.log('Fixed quiz downloads relationships');
    } else {
      console.log(
        'Table course_quizzes_downloads does not exist, skipping quiz downloads fix',
      );
    }

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Downloads relationships fix completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error fixing Downloads relationships:', error);
    throw error;
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Execute the function directly when this script is run
fixDownloadsRelationships()
  .then(() => {
    console.log('Script executed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export default fixDownloadsRelationships;
