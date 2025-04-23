/**
 * Simple utility to get table counts from the database
 * Used by PowerShell diagnostic scripts
 */
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

/**
 * Get count of records in key tables
 */
async function getTableCounts() {
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    console.error('DATABASE_URI environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: databaseUri });
  const client = await pool.connect();

  try {
    console.log('Database connected successfully');

    const tables = [
      'courses',
      'course_lessons',
      'course_quizzes',
      'quiz_questions',
      'posts',
      'private',
      'downloads',
      'surveys',
      'survey_questions',
      'users',
    ];

    console.log('\nContent Summary:');

    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) FROM payload.${table}`,
        );
        const count = parseInt(result.rows[0].count);
        console.log(`  ${table}: ${count}`);
      } catch (err) {
        console.log(`  ${table}: N/A (table not found or error)`);
      }
    }

    // Check if dynamic_uuid_tables exists
    try {
      const dynamicTableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'dynamic_uuid_tables'
        ) as exists;
      `);

      console.log(
        `\nDynamic UUID Tables: ${dynamicTableResult.rows[0].exists ? 'Exists' : 'Missing'}`,
      );

      if (dynamicTableResult.rows[0].exists) {
        // Count tracked tables
        const trackedTablesResult = await client.query(`
          SELECT COUNT(*) FROM payload.dynamic_uuid_tables
        `);

        console.log(`  Tracked tables: ${trackedTablesResult.rows[0].count}`);
      }
    } catch (err) {
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? err.message
          : 'Unknown error';
      console.log(`  Dynamic UUID Tables tracking: Error (${errorMsg})`);
    }

    // Check database version
    try {
      const versionResult = await client.query('SELECT version()');
      console.log(
        `\nDatabase Version: ${versionResult.rows[0].version.split(',')[0]}`,
      );
    } catch (err) {
      console.log(`Database Version: Error getting version`);
    }

    console.log('\nDiagnostic complete!');
  } catch (err) {
    const errorMsg =
      err && typeof err === 'object' && 'message' in err
        ? err.message
        : 'Unknown error';
    console.error(`Database error: ${errorMsg}`);
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = {
  getTableCounts,
};
