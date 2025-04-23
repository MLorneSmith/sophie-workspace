/**
 * Fix Downloads R2 Integration Script
 *
 * This script:
 * 1. Updates download records with proper filenames and URLs
 * 2. Creates missing relationships between lessons and downloads
 * 3. Creates a validation view for easier relationship debugging
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

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

async function fixDownloadsR2Integration(): Promise<void> {
  console.log('Fixing Downloads R2 integration...');

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Start a transaction for atomicity
    await client.query('BEGIN');

    // 1. Update download records to point to actual R2 files with enhanced metadata
    const updateDownloadsResult = await client.query(`
      UPDATE payload.downloads
      SET 
        filename = CASE
          WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
          WHEN title LIKE '%the-who%' THEN '202 The Who.pdf'
          WHEN title LIKE '%introduction%' THEN '203 The Why - Introductions.pdf'
          WHEN title LIKE '%next-steps%' THEN '204 The Why - Next Steps.pdf'
          WHEN title LIKE '%idea-generation%' THEN '301 Idea Generation.pdf'
          WHEN title LIKE '%what-is-structure%' THEN '302 What is Structure.pdf'
          WHEN title LIKE '%using-stories%' THEN '401 Using Stories.pdf'
          WHEN title LIKE '%storyboards%' THEN '403 Storyboards in Presentations.pdf'
          -- Add mappings for other files
          ELSE REPLACE(filename, '.placeholder', '.pdf')
        END,
        url = CONCAT('https://downloads.slideheroes.com/', 
                CASE 
                  WHEN title LIKE '%our-process%' THEN '201 Our Process.pdf'
                  WHEN title LIKE '%the-who%' THEN '202 The Who.pdf'
                  WHEN title LIKE '%introduction%' THEN '203 The Why - Introductions.pdf'
                  WHEN title LIKE '%next-steps%' THEN '204 The Why - Next Steps.pdf'
                  WHEN title LIKE '%idea-generation%' THEN '301 Idea Generation.pdf'
                  WHEN title LIKE '%what-is-structure%' THEN '302 What is Structure.pdf'
                  WHEN title LIKE '%using-stories%' THEN '401 Using Stories.pdf'
                  WHEN title LIKE '%storyboards%' THEN '403 Storyboards in Presentations.pdf'
                  -- Add mappings for other files
                  ELSE REPLACE(filename, '.placeholder', '.pdf')
                END),
        -- Set mime type for PDFs
        mimeType = 'application/pdf',
        -- Set default filesize if not known (will be updated by hooks)
        filesize = COALESCE(filesize, 500000), -- Default 500KB for now
        -- Set standard PDF dimensions
        width = COALESCE(width, 612),  -- Standard PDF width (8.5" at 72 DPI)
        height = COALESCE(height, 792) -- Standard PDF height (11" at 72 DPI)
    `);

    const updatedDownloads = updateDownloadsResult.rowCount;
    console.log(`Updated ${updatedDownloads} download records`);

    // 2. Verify and repair relationship tables
    const createRelationshipsResult = await client.query(`
      INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, created_at, updated_at, path)
      SELECT
        uuid_generate_v4(),
        cl.id,
        d.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '/course_lessons_downloads/' || uuid_generate_v4()
      FROM
        payload.course_lessons cl
      JOIN
        payload.downloads d ON
        (cl.slug = 'our-process' AND d.title LIKE '%our-process%') OR
        (cl.slug = 'the-who' AND d.title LIKE '%the-who%') OR
        (cl.slug = 'introduction' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'the-why-introductions' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'the-why-next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'idea-generation' AND d.title LIKE '%idea-generation%') OR
        (cl.slug = 'what-is-structure' AND d.title LIKE '%what-is-structure%')
      WHERE
        NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_downloads
          WHERE lesson_id = cl.id AND download_id = d.id
        )
    `);

    const createdRelationships = createRelationshipsResult.rowCount;
    console.log(
      `Created ${createdRelationships} new lesson-download relationships`,
    );

    // 3. Update the download thumbnail information
    await client.query(`
      UPDATE payload.downloads
      SET 
        sizes = jsonb_build_object(
          'thumbnail', jsonb_build_object(
            'url', CONCAT('https://downloads.slideheroes.com/', id, '-thumbnail.webp'),
            'width', 400,
            'height', 300,
            'mimeType', 'image/webp',
            'filename', CONCAT(id, '-thumbnail.webp')
          )
        )
    `);

    console.log(`Updated download thumbnails`);

    // 4. CRITICAL: Directly populate the course_lessons array for each download
    await client.query(`
      WITH download_lessons AS (
        SELECT 
          download_id,
          jsonb_agg(lesson_id) AS lesson_ids
        FROM 
          payload.course_lessons_downloads
        GROUP BY 
          download_id
      )
      UPDATE payload.downloads d
      SET course_lessons = dl.lesson_ids
      FROM download_lessons dl
      WHERE d.id = dl.download_id
    `);

    console.log(`Populated course_lessons arrays in downloads`);

    // 5. Create a validation view for easier relationship debugging
    await client.query(`
      CREATE OR REPLACE VIEW payload.download_relationships_debug AS
      SELECT 
        cl.title AS lesson_title,
        cl.slug AS lesson_slug,
        d.title AS download_title,
        d.filename AS download_filename,
        d.url AS download_url,
        d.id AS download_id,
        cl.id AS lesson_id,
        EXISTS (
          SELECT 1 FROM payload.course_lessons_downloads 
          WHERE lesson_id = cl.id AND download_id = d.id
        ) AS relationship_exists
      FROM payload.course_lessons cl
      CROSS JOIN payload.downloads d
      WHERE 
        (cl.slug = 'our-process' AND d.title LIKE '%our-process%') OR
        (cl.slug = 'the-who' AND d.title LIKE '%the-who%') OR
        (cl.slug = 'introduction' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'the-why-introductions' AND d.title LIKE '%introduction%') OR
        (cl.slug = 'next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'the-why-next-steps' AND d.title LIKE '%next-steps%') OR
        (cl.slug = 'idea-generation' AND d.title LIKE '%idea-generation%') OR
        (cl.slug = 'what-is-structure' AND d.title LIKE '%what-is-structure%')
    `);

    console.log('Created validation view for download relationships');

    // Commit transaction
    await client.query('COMMIT');
    console.log('Downloads R2 integration fix completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error fixing Downloads R2 integration:', error);
    throw error;
  } finally {
    // Close the database connection
    await client.end();
  }
}

export default fixDownloadsR2Integration;
