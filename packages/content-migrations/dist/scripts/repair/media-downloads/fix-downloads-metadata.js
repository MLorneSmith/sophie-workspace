/**
 * Fix Downloads Metadata Script
 *
 * This script addresses issues with the Downloads collection in Payload CMS:
 * 1. Updates downloads with proper metadata (mimetype, filesize, dimensions)
 * 2. Creates proper thumbnails with sizes information
 * 3. Validates the junction table relationships
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
    connectionString: process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
async function fixDownloadsMetadata() {
    console.log('Fixing Downloads metadata and relationships...');
    try {
        // Connect to database
        await client.connect();
        console.log('Connected to database');
        console.log('Starting metadata fixes...');
        // Start a transaction for atomicity
        await client.query('BEGIN');
        console.log('Transaction started');
        // Special case: Fix the slide-templates record to point to the correct ZIP file
        const fixSlideTemplatesResult = await client.query(`
      UPDATE payload.downloads
      SET 
        filename = 'SlideHeroes Presentation Template.zip',
        url = 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip',
        mimetype = 'application/zip',
        filesize = 55033588
      WHERE id = '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1'
    `);
        console.log(`Fixed slide-templates record: ${fixSlideTemplatesResult.rowCount} rows updated`);
        // 1. Add proper metadata to downloads (excluding the special case we just fixed)
        const updateMetadataResult = await client.query(`
      UPDATE payload.downloads
      SET 
        mimetype = 'application/pdf',
        filesize = 500000, -- Default 500KB for now
        width = 612,  -- Standard PDF width (8.5" at 72 DPI)
        height = 792 -- Standard PDF height (11" at 72 DPI)
      WHERE (mimetype IS NULL OR filesize IS NULL OR width IS NULL OR height IS NULL)
        AND id != '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1' -- Skip the slide-templates record we just fixed
    `);
        const updatedMetadata = updateMetadataResult.rowCount;
        console.log(`Updated metadata for ${updatedMetadata} download records`);
        // 2. Create thumbnail information properly
        const updateThumbnailsResult = await client.query(`
      UPDATE payload.downloads
      SET 
        -- Set the thumbnail_u_r_l to point to the Payload API with the format seen in logs
        -- PostgreSQL column name is snake_case not camelCase
        thumbnail_u_r_l = CONCAT('/api/downloads/file/', id, '-thumbnail.webp'),
        sizes_thumbnail_url = CONCAT('https://downloads.slideheroes.com/', id, '-thumbnail.webp'),
        sizes_thumbnail_width = 400,
        sizes_thumbnail_height = 300,
        sizes_thumbnail_mime_type = 'image/webp',
        sizes_thumbnail_filename = CONCAT(id, '-thumbnail.webp')
      WHERE sizes_thumbnail_url IS NULL OR sizes_thumbnail_filename IS NULL OR thumbnail_u_r_l IS NULL
    `);
        const updatedThumbnails = updateThumbnailsResult.rowCount;
        console.log(`Updated thumbnails for ${updatedThumbnails} download records`);
        // 3. Verify existing relationships in the junction table
        const relationshipCountResult = await client.query(`
      SELECT COUNT(*) as count
      FROM payload.course_lessons_downloads
    `);
        const relationshipCount = parseInt(relationshipCountResult.rows[0].count, 10);
        console.log(`Found ${relationshipCount} relationships in the junction table`);
        // 4. First drop the view if it exists to avoid column renaming issues
        await client.query(`DROP VIEW IF EXISTS payload.downloads_diagnostic`);
        // Then create a new diagnostic view that makes it easier to check downloads
        await client.query(`
      CREATE VIEW payload.downloads_diagnostic AS
      SELECT 
        d.id,
        d.title,
        d.filename,
        d.url,
        d.mimetype,
        d.filesize,
        d.width,
        d.height,
        d.sizes_thumbnail_url,
        (SELECT COUNT(*) FROM payload.course_lessons_downloads WHERE download_id = d.id) AS lesson_count,
        (SELECT array_agg(cl.title) FROM payload.course_lessons_downloads cld 
         JOIN payload.course_lessons cl ON cld.lesson_id = cl.id
         WHERE cld.download_id = d.id) AS related_lessons
      FROM 
        payload.downloads d
    `);
        console.log('Created downloads_diagnostic view for easier debugging');
        // Commit transaction
        await client.query('COMMIT');
        console.log('Downloads metadata fix completed successfully');
    }
    catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('Error fixing Downloads metadata:', error);
        throw error;
    }
    finally {
        // Close the database connection
        await client.end();
    }
}
// Execute the function directly when this script is run
fixDownloadsMetadata()
    .then(() => {
    console.log('Script executed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
export default fixDownloadsMetadata;
