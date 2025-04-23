/**
 * Script to generate table counts for database content
 * Used by the migration diagnostics process to display a summary of content
 */
import { pool } from '../../utils/db/pool.js';

async function getTableCounts() {
  try {
    const tables = [
      'courses',
      'course_lessons',
      'course_quizzes',
      'quiz_questions',
      'surveys',
      'survey_questions',
      'posts',
      'private',
      'downloads',
    ];

    console.log('=== DATABASE CONTENT SUMMARY ===');
    console.log('Table                     | Count');
    console.log('--------------------------|------');

    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count FROM payload.${table}
        `);
        const count = result.rows[0].count;
        console.log(`${table.padEnd(25, ' ')} | ${count}`);
      } catch (error: any) {
        console.log(`${table.padEnd(25, ' ')} | Error: ${error.message}`);
      }
    }

    console.log('\n=== UUID TABLES SUMMARY ===');

    try {
      const uuidTablesResult = await pool.query(`
        SELECT table_name FROM payload.dynamic_uuid_tables
      `);

      console.log(`Total UUID tables tracked: ${uuidTablesResult.rowCount}`);

      if (uuidTablesResult.rowCount > 0) {
        console.log('First 5 UUID tables:');
        uuidTablesResult.rows.slice(0, 5).forEach((row) => {
          console.log(`- ${row.table_name}`);
        });
      }
    } catch (error: any) {
      console.error('Error getting UUID tables list:', error.message);
    }

    // Check relationship tables
    console.log('\n=== RELATIONSHIP TABLES ===');
    try {
      const relTableQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name LIKE '%_rels'
        ORDER BY table_name
      `;

      const relTables = await pool.query(relTableQuery);

      console.log(`Total relationship tables: ${relTables.rowCount}`);
      if (relTables.rowCount > 0) {
        for (const relTable of relTables.rows) {
          try {
            const countResult = await pool.query(`
              SELECT COUNT(*) as count FROM payload.${relTable.table_name}
            `);
            const count = countResult.rows[0].count;
            console.log(`${relTable.table_name.padEnd(25, ' ')} | ${count}`);
          } catch (countError: any) {
            console.log(
              `${relTable.table_name.padEnd(25, ' ')} | Error: ${countError.message}`,
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking relationship tables:', error.message);
    }
  } catch (error: any) {
    console.error('Error getting table counts:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the function
getTableCounts().catch((error) => {
  console.error('Failed to get table counts:', error);
  process.exit(1);
});
