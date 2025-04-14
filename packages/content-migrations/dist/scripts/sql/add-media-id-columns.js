/**
 * Add Relationship ID Columns
 *
 * This script adds the media_id and documentation_id columns to the payload_locked_documents and
 * payload_locked_documents_rels tables.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../../', envFile) });
/**
 * Adds a column to a table if it doesn't exist
 */
async function addColumnIfMissing(client, tableName, columnName, referencedTable) {
    // Check if table exists
    console.log(`Checking if ${tableName} table exists...`);
    const tableExistsResult = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name = '${tableName}'
    ) AS exists;
  `);
    if (tableExistsResult.rows[0].exists) {
        console.log(`✅ Table ${tableName} exists`);
        // Check if column exists
        console.log(`Checking if ${columnName} column exists in ${tableName} table...`);
        const columnExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = '${tableName}'
        AND column_name = '${columnName}'
      ) AS exists;
    `);
        if (columnExistsResult.rows[0].exists) {
            console.log(`✅ Column ${columnName} already exists in ${tableName} table`);
        }
        else {
            console.log(`Adding ${columnName} column to ${tableName} table...`);
            await client.query(`
        ALTER TABLE "payload"."${tableName}"
        ADD COLUMN "${columnName}" uuid REFERENCES "payload"."${referencedTable}"("id") ON DELETE SET NULL;
      `);
            console.log(`✅ Added ${columnName} column to ${tableName} table`);
        }
    }
    else {
        console.log(`❌ Table ${tableName} does not exist`);
    }
}
/**
 * Adds the media_id and documentation_id columns to the payload_locked_documents and payload_locked_documents_rels tables
 */
async function addRelationshipIdColumns() {
    console.log('Adding relationship ID columns to Payload CMS tables...');
    // Get database connection string
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    // Connect to database
    const pool = new Pool({
        connectionString: databaseUri,
    });
    try {
        // Get a client from the pool
        const client = await pool.connect();
        try {
            console.log('Connected to database');
            // Start transaction
            await client.query('BEGIN');
            // Add media_id columns
            console.log('Adding media_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'media_id', 'media');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'media_id', 'media');
            // Add documentation_id columns
            console.log('Adding documentation_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'documentation_id', 'documentation');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'documentation_id', 'documentation');
            // Add posts_id columns
            console.log('Adding posts_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'posts_id', 'posts');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'posts_id', 'posts');
            // Add surveys_id columns
            console.log('Adding surveys_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'surveys_id', 'surveys');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'surveys_id', 'surveys');
            // Add survey_questions_id columns
            console.log('Adding survey_questions_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'survey_questions_id', 'survey_questions');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'survey_questions_id', 'survey_questions');
            // Add courses_id columns
            console.log('Adding courses_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'courses_id', 'courses');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'courses_id', 'courses');
            // Add course_lessons_id columns
            console.log('Adding course_lessons_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'course_lessons_id', 'course_lessons');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'course_lessons_id', 'course_lessons');
            // Add course_quizzes_id columns
            console.log('Adding course_quizzes_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'course_quizzes_id', 'course_quizzes');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'course_quizzes_id', 'course_quizzes');
            // Add quiz_questions_id columns
            console.log('Adding quiz_questions_id columns...');
            await addColumnIfMissing(client, 'payload_locked_documents', 'quiz_questions_id', 'quiz_questions');
            await addColumnIfMissing(client, 'payload_locked_documents_rels', 'quiz_questions_id', 'quiz_questions');
            // Commit transaction
            await client.query('COMMIT');
            console.log('✅ All changes committed successfully');
            return true;
        }
        catch (error) {
            // Rollback on error
            await client.query('ROLLBACK');
            console.error('Error adding relationship ID columns:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error adding relationship ID columns:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the function if this script is executed directly
if (import.meta.url === import.meta.resolve('./add-media-id-columns.ts')) {
    addRelationshipIdColumns()
        .then((success) => {
        if (success) {
            console.log('Relationship ID columns added successfully');
            process.exit(0);
        }
        else {
            console.error('Failed to add relationship ID columns');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Error during execution:', error);
        process.exit(1);
    });
}
export { addRelationshipIdColumns };
