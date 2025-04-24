/**
 * Verify Downloads Diagnostic View
 *
 * This script verifies that the downloads_diagnostic view exists and has all required columns.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Database connection string
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;

if (!connectionString) {
  console.error('No database connection string found in environment variables');
  process.exit(1);
}

// Configure the pool
const pool = new Pool({
  connectionString,
});

/**
 * Main verification function
 */
async function verifyDownloadsDiagnosticView() {
  console.log('\nVerifying downloads_diagnostic view...');

  try {
    // Check if the view exists
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads_diagnostic'
      ) as view_exists
    `);

    if (!viewCheck.rows[0].view_exists) {
      console.error('❌ downloads_diagnostic view does not exist!');
      return false;
    }

    console.log('✅ downloads_diagnostic view exists.');

    // Get the columns of the view
    const viewColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
        AND table_name = 'downloads_diagnostic'
      ORDER BY ordinal_position
    `);

    const columns = viewColumns.rows.map((row: any) => row.column_name);
    console.log('Columns in the view:', columns.join(', '));

    // Check for required columns
    const requiredColumns = [
      'id',
      'title',
      'filename',
      'url',
      'mimetype',
      'filesize',
      'width',
      'height',
      'sizes_thumbnail_url',
      'path',
      'lesson_count',
      'related_lessons',
    ];

    let missingColumns = false;
    for (const column of requiredColumns) {
      if (!columns.includes(column)) {
        console.error(
          `❌ Missing required column '${column}' in downloads_diagnostic view`,
        );
        missingColumns = true;
      } else {
        console.log(
          `✅ Required column '${column}' exists in downloads_diagnostic view`,
        );
      }
    }

    if (missingColumns) {
      console.error(
        '\n❌ downloads_diagnostic view is missing some required columns!',
      );
      return false;
    }

    console.log('\n✅ downloads_diagnostic view has all required columns.');
    return true;
  } catch (error) {
    console.error('\n❌ Error verifying downloads_diagnostic view:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyDownloadsDiagnosticView()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
