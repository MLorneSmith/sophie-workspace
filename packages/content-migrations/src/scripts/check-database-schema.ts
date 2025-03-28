/**
 * Script to check the database schema and fix any issues
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Checks the database schema
 */
async function checkDatabaseSchema() {
  console.log('Checking database schema...');

  // Get the database connection string from environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Using database URI: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Check if the payload schema exists
    const schemaResult = await pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'payload';
    `);

    if (schemaResult.rows.length === 0) {
      console.error('The "payload" schema does not exist in the database.');
    } else {
      console.log('The "payload" schema exists in the database.');

      // Check the tables in the payload schema
      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'payload'
        ORDER BY table_name;
      `);

      console.log(
        `Found ${tablesResult.rows.length} tables in the "payload" schema:`,
      );
      for (const row of tablesResult.rows) {
        console.log(`- ${row.table_name}`);

        // Check the columns in the table
        const columnsResult = await pool.query(
          `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'payload' AND table_name = $1
          ORDER BY column_name;
        `,
          [row.table_name],
        );

        console.log(`  Columns in ${row.table_name}:`);
        for (const column of columnsResult.rows) {
          console.log(`  - ${column.column_name} (${column.data_type})`);
        }

        // Check the number of records in the table
        const countResult = await pool.query(`
          SELECT COUNT(*) FROM payload.${row.table_name};
        `);

        console.log(
          `  Records in ${row.table_name}: ${countResult.rows[0].count}`,
        );
      }
    }

    // Check for the _parent_id column in quiz_questions_options
    const parentIdResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'payload' AND table_name = 'quiz_questions_options' AND column_name = '_parent_id';
    `);

    if (parentIdResult.rows.length > 0) {
      console.log(
        `Found _parent_id column in quiz_questions_options with type: ${parentIdResult.rows[0].data_type}`,
      );

      // Check if we need to fix the _parent_id column
      if (parentIdResult.rows[0].data_type === 'character varying') {
        console.log('Fixing _parent_id column in quiz_questions_options...');

        // First, check if there are any records in the table
        const countResult = await pool.query(`
          SELECT COUNT(*) FROM payload.quiz_questions_options;
        `);

        if (parseInt(countResult.rows[0].count) > 0) {
          console.log(
            `Found ${countResult.rows[0].count} records in quiz_questions_options. Deleting them...`,
          );

          // Delete all records in the table
          await pool.query(`
            DELETE FROM payload.quiz_questions_options;
          `);

          console.log('Deleted all records in quiz_questions_options.');
        }

        // We need to fix both the quiz_questions.id and quiz_questions_options._parent_id columns
        try {
          // First, check if there are any records in the quiz_questions table
          const quizQuestionsCountResult = await pool.query(`
            SELECT COUNT(*) FROM payload.quiz_questions;
          `);

          if (parseInt(quizQuestionsCountResult.rows[0].count) > 0) {
            console.log(
              `Found ${quizQuestionsCountResult.rows[0].count} records in quiz_questions. Deleting them...`,
            );

            // Delete all records in the quiz_questions table
            await pool.query(`
              DELETE FROM payload.quiz_questions;
            `);

            console.log('Deleted all records in quiz_questions.');
          }

          // Now, drop the foreign key constraint
          console.log('Dropping foreign key constraint...');
          await pool.query(`
            ALTER TABLE payload.quiz_questions_options
            DROP CONSTRAINT IF EXISTS quiz_questions_options_parent_id_fk;
          `);
          console.log('Dropped foreign key constraint.');

          // Now, alter the column types to UUID
          console.log('Altering column types to UUID...');
          await pool.query(`
            ALTER TABLE payload.quiz_questions
            ALTER COLUMN id TYPE UUID USING NULL;
          `);
          console.log('Fixed id column in quiz_questions.');

          await pool.query(`
            ALTER TABLE payload.quiz_questions_options
            ALTER COLUMN _parent_id TYPE UUID USING NULL;
          `);
          console.log('Fixed _parent_id column in quiz_questions_options.');

          // Re-create the foreign key constraint
          console.log('Re-creating foreign key constraint...');
          await pool.query(`
            ALTER TABLE payload.quiz_questions_options
            ADD CONSTRAINT quiz_questions_options_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES payload.quiz_questions(id);
          `);
          console.log('Re-created foreign key constraint.');
        } catch (error) {
          console.error('Error fixing columns:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }

  console.log('Database schema check complete!');
}

// Run the check
checkDatabaseSchema().catch((error) => {
  console.error('Database schema check failed:', error);
  process.exit(1);
});
