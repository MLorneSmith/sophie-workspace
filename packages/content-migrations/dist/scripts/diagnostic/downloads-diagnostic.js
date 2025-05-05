/**
 * Downloads Diagnostic Script
 *
 * This script provides diagnostic information about the Downloads collection:
 * 1. Reports on metadata completeness (mimetype, filesize, dimensions, thumbnails)
 * 2. Shows relationship counts and connections
 * 3. Validates lessons can access related downloads properly
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
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
async function runDownloadsDiagnostic() {
    console.log(chalk.cyan('📊 DOWNLOADS COLLECTION DIAGNOSTIC 📊'));
    console.log(chalk.cyan('=============================='));
    try {
        // Connect to database
        await client.connect();
        console.log(chalk.green('✅ Connected to database'));
        // 1. Check total downloads count
        const downloadsCountResult = await client.query(`
      SELECT COUNT(*) as count FROM payload.downloads
    `);
        const downloadsCount = parseInt(downloadsCountResult.rows[0].count, 10);
        console.log(chalk.cyan(`\n📦 Total Downloads: ${downloadsCount}`));
        // 2. Check metadata completeness
        const metadataResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN mimetype IS NOT NULL THEN 1 ELSE 0 END) as has_mimetype,
        SUM(CASE WHEN filesize IS NOT NULL THEN 1 ELSE 0 END) as has_filesize,
        SUM(CASE WHEN width IS NOT NULL AND height IS NOT NULL THEN 1 ELSE 0 END) as has_dimensions,
        SUM(CASE WHEN sizes_thumbnail_url IS NOT NULL THEN 1 ELSE 0 END) as has_thumbnail_url
      FROM payload.downloads
    `);
        const metadata = metadataResult.rows[0];
        console.log(chalk.cyan('\n📋 Metadata Completeness:'));
        console.log(`- MimeType: ${metadata.has_mimetype}/${metadata.total} downloads (${Math.round((metadata.has_mimetype / metadata.total) * 100)}%)`);
        console.log(`- Filesize: ${metadata.has_filesize}/${metadata.total} downloads (${Math.round((metadata.has_filesize / metadata.total) * 100)}%)`);
        console.log(`- Dimensions: ${metadata.has_dimensions}/${metadata.total} downloads (${Math.round((metadata.has_dimensions / metadata.total) * 100)}%)`);
        console.log(`- Thumbnail URL: ${metadata.has_thumbnail_url}/${metadata.total} downloads (${Math.round((metadata.has_thumbnail_url / metadata.total) * 100)}%)`);
        // 3. Check junction table relationships
        const relationshipsResult = await client.query(`
      SELECT COUNT(*) as count FROM payload.course_lessons_downloads
    `);
        const relationshipsCount = parseInt(relationshipsResult.rows[0].count, 10);
        console.log(chalk.cyan(`\n🔄 Lesson-Download Relationships: ${relationshipsCount}`));
        // 4. Check distribution of relationships
        const relationshipDistributionResult = await client.query(`
      SELECT 
        COUNT(*) as download_count,
        SUM(CASE WHEN lesson_count > 0 THEN 1 ELSE 0 END) as downloads_with_lessons,
        MAX(lesson_count) as max_lessons_per_download,
        AVG(lesson_count)::numeric(10,2) as avg_lessons_per_download
      FROM (
        SELECT 
          d.id, 
          (SELECT COUNT(*) FROM payload.course_lessons_downloads WHERE download_id = d.id) AS lesson_count
        FROM payload.downloads d
      ) as download_stats
    `);
        const distribution = relationshipDistributionResult.rows[0];
        console.log(chalk.cyan('\n📊 Relationship Distribution:'));
        console.log(`- Downloads with lessons: ${distribution.downloads_with_lessons}/${distribution.download_count} (${Math.round((distribution.downloads_with_lessons / distribution.download_count) * 100)}%)`);
        console.log(`- Maximum lessons per download: ${distribution.max_lessons_per_download}`);
        console.log(`- Average lessons per download: ${distribution.avg_lessons_per_download}`);
        // 5. Show few example downloads with their relationships
        console.log(chalk.cyan('\n🔍 Sample Downloads with Relationships:'));
        const sampleDownloadsResult = await client.query(`
      SELECT * FROM payload.downloads_diagnostic ORDER BY lesson_count DESC LIMIT 5
    `);
        sampleDownloadsResult.rows.forEach((download, index) => {
            console.log(chalk.yellow(`\nDownload ${index + 1}: ${download.title}`));
            console.log(`- ID: ${download.id}`);
            console.log(`- Filename: ${download.filename}`);
            console.log(`- URL: ${download.url}`);
            console.log(`- MimeType: ${download.mimetype || 'NULL'}`);
            console.log(`- Filesize: ${download.filesize || 'NULL'}`);
            console.log(`- Dimensions: ${download.width || 'NULL'} x ${download.height || 'NULL'}`);
            console.log(`- Thumbnail URL: ${download.sizes_thumbnail_url || 'NULL'}`);
            console.log(`- Lesson Count: ${download.lesson_count}`);
            console.log(`- Related Lessons: ${download.related_lessons ? download.related_lessons.join(', ') : 'None'}`);
        });
        // 6. Check for orphaned downloads (no lesson relationships)
        const orphanedResult = await client.query(`
      SELECT COUNT(*) as count FROM (
        SELECT d.id FROM payload.downloads d
        LEFT JOIN payload.course_lessons_downloads cld ON d.id = cld.download_id
        WHERE cld.id IS NULL
      ) as orphaned_downloads
    `);
        const orphanedCount = parseInt(orphanedResult.rows[0].count, 10);
        console.log(chalk.cyan(`\n⚠️ Orphaned Downloads: ${orphanedCount}`));
        if (orphanedCount > 0) {
            console.log(chalk.yellow('Warning: Some downloads have no lesson relationships.'));
            // Show a few examples of orphaned downloads
            const orphanedExamplesResult = await client.query(`
        SELECT d.id, d.title, d.filename, d.url FROM payload.downloads d
        LEFT JOIN payload.course_lessons_downloads cld ON d.id = cld.download_id
        WHERE cld.id IS NULL
        LIMIT 5
      `);
            console.log(chalk.yellow('\nSample orphaned downloads:'));
            orphanedExamplesResult.rows.forEach((download, index) => {
                console.log(`${index + 1}. "${download.title}" (${download.filename})`);
            });
        }
        console.log(chalk.green('\n✅ Diagnostic completed successfully'));
    }
    catch (error) {
        console.error(chalk.red('Error running Downloads diagnostic:'), error);
        throw error;
    }
    finally {
        // Close the database connection
        await client.end();
    }
}
// Allow script to be executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runDownloadsDiagnostic()
        .then(() => console.log(chalk.green('\nDiagnostic completed')))
        .catch((err) => console.error(chalk.red(`Diagnostic failed: ${err.message}`)));
}
export default runDownloadsDiagnostic;
