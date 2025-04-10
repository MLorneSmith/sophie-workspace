"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMediaColumns = verifyMediaColumns;
/**
 * Verify Media Columns
 *
 * This script verifies that the media_id columns exist in the
 * course_lessons, course_quizzes, quiz_questions, payload_locked_documents,
 * and payload_locked_documents_rels tables.
 */
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const pg_1 = __importDefault(require("pg"));
const url_1 = require("url");
const { Pool } = pg_1.default;
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../', envFile) });
/**
 * Verifies the media_id columns in the course_lessons, course_quizzes, quiz_questions,
 * payload_locked_documents, and payload_locked_documents_rels tables
 */
async function verifyMediaColumns() {
    console.log('Verifying media_id columns in Payload CMS tables...');
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
            // Check if media_id column exists in course_lessons table
            console.log('Checking if media_id column exists in course_lessons table...');
            const lessonsColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons'
          AND column_name = 'media_id'
        ) AS exists;
      `);
            if (lessonsColumnExistsResult.rows[0].exists) {
                console.log('✅ Column media_id exists in course_lessons table');
            }
            else {
                console.log('❌ Column media_id does not exist in course_lessons table');
                return false;
            }
            // Check if media_id column exists in course_quizzes table
            console.log('Checking if media_id column exists in course_quizzes table...');
            const quizzesColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes'
          AND column_name = 'media_id'
        ) AS exists;
      `);
            if (quizzesColumnExistsResult.rows[0].exists) {
                console.log('✅ Column media_id exists in course_quizzes table');
            }
            else {
                console.log('❌ Column media_id does not exist in course_quizzes table');
                return false;
            }
            // Check if media_id column exists in quiz_questions table
            console.log('Checking if media_id column exists in quiz_questions table...');
            const questionsColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions'
          AND column_name = 'media_id'
        ) AS exists;
      `);
            if (questionsColumnExistsResult.rows[0].exists) {
                console.log('✅ Column media_id exists in quiz_questions table');
            }
            else {
                console.log('❌ Column media_id does not exist in quiz_questions table');
                return false;
            }
            // Check if media_id column exists in payload_locked_documents table
            console.log('Checking if media_id column exists in payload_locked_documents table...');
            const lockedDocumentsColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
          AND column_name = 'media_id'
        ) AS exists;
      `);
            if (lockedDocumentsColumnExistsResult.rows[0].exists) {
                console.log('✅ Column media_id exists in payload_locked_documents table');
            }
            else {
                console.log('❌ Column media_id does not exist in payload_locked_documents table');
                return false;
            }
            // Check if media_id column exists in payload_locked_documents_rels table
            console.log('Checking if media_id column exists in payload_locked_documents_rels table...');
            const lockedDocumentsRelsColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
          AND column_name = 'media_id'
        ) AS exists;
      `);
            if (lockedDocumentsRelsColumnExistsResult.rows[0].exists) {
                console.log('✅ Column media_id exists in payload_locked_documents_rels table');
            }
            else {
                console.log('❌ Column media_id does not exist in payload_locked_documents_rels table');
                return false;
            }
            // Check if media_id columns have the correct data type and constraints
            console.log('Checking if media_id columns have the correct data type and constraints...');
            const columnsInfoResult = await client.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name IN ('course_lessons', 'course_quizzes', 'quiz_questions', 'payload_locked_documents', 'payload_locked_documents_rels')
        AND column_name = 'media_id'
        ORDER BY table_name;
      `);
            if (columnsInfoResult.rows.length === 5) {
                console.log('✅ All five tables have media_id columns');
                // Check each column's data type and constraints
                for (const row of columnsInfoResult.rows) {
                    if (row.data_type === 'uuid') {
                        console.log(`✅ Column media_id in ${row.table_name} has the correct data type (uuid)`);
                    }
                    else {
                        console.log(`❌ Column media_id in ${row.table_name} has incorrect data type: ${row.data_type}, expected: uuid`);
                        return false;
                    }
                }
            }
            else {
                console.log(`❌ Expected 5 media_id columns, found ${columnsInfoResult.rows.length}`);
                return false;
            }
            // Check if media_id columns have foreign key constraints to the media table
            console.log('Checking if media_id columns have foreign key constraints to the media table...');
            const fkConstraintsResult = await client.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
          tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'payload'
          AND tc.table_name IN ('course_lessons', 'course_quizzes', 'quiz_questions', 'payload_locked_documents', 'payload_locked_documents_rels')
          AND kcu.column_name = 'media_id'
          AND ccu.table_name = 'media'
        ORDER BY tc.table_name;
      `);
            if (fkConstraintsResult.rows.length === 5) {
                console.log('✅ All five media_id columns have foreign key constraints to the media table');
            }
            else {
                console.log(`❌ Expected 5 foreign key constraints, found ${fkConstraintsResult.rows.length}`);
                for (const table of [
                    'course_lessons',
                    'course_quizzes',
                    'quiz_questions',
                    'payload_locked_documents',
                    'payload_locked_documents_rels',
                ]) {
                    const hasConstraint = fkConstraintsResult.rows.some((row) => row.table_name === table);
                    if (!hasConstraint) {
                        console.log(`❌ Missing foreign key constraint for ${table}.media_id`);
                    }
                }
                return false;
            }
            console.log('✅ All media_id columns exist and are properly configured');
            return true;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error verifying media_id columns:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the function if this script is executed directly
if (import.meta.url === import.meta.resolve('./verify-media-columns.ts')) {
    verifyMediaColumns()
        .then((success) => {
        if (success) {
            console.log('Verification passed');
            process.exit(0);
        }
        else {
            console.error('Verification failed');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Error during verification:', error);
        process.exit(1);
    });
}
