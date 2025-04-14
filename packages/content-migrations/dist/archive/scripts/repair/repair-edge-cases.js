/**
 * Repair Edge Cases
 *
 * This script repairs edge cases that might not be fixed by the migrations.
 * It handles:
 * - Missing bidirectional relationships
 * - Incorrect field names
 * - Missing columns
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
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
/**
 * Repairs edge cases in the database
 */
async function repairEdgeCases() {
    // Get the database connection string from the environment variables
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    console.log(`Connecting to database: ${databaseUri}`);
    // Create a connection pool
    const pool = new Pool({
        connectionString: databaseUri,
    });
    try {
        // Test the connection
        const client = await pool.connect();
        try {
            console.log('Connected to database');
            // Start a transaction
            await client.query('BEGIN');
            try {
                // Fix 1: Ensure quiz_id_id column exists and matches quiz_id
                console.log('\n--- Fixing quiz_id_id column ---');
                await client.query(`
          DO $$
          BEGIN
            -- Ensure quiz_id_id column exists
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'payload' 
              AND table_name = 'quiz_questions' 
              AND column_name = 'quiz_id_id'
            ) THEN
              ALTER TABLE "payload"."quiz_questions"
              ADD COLUMN "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
            END IF;
          END $$;
        `);
                // Update quiz_id_id to match quiz_id
                const updateQuizIdResult = await client.query(`
          UPDATE payload.quiz_questions
          SET quiz_id_id = quiz_id
          WHERE quiz_id IS NOT NULL AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);
        `);
                console.log(`Updated ${updateQuizIdResult.rowCount} quiz_id_id values`);
                // Fix 2: Fix field names in quiz_questions_rels
                console.log('\n--- Fixing field names in quiz_questions_rels ---');
                const updateQuizFieldResult = await client.query(`
          UPDATE payload.quiz_questions_rels
          SET field = 'quiz_id'
          WHERE field = 'quiz_id_id';
        `);
                console.log(`Updated ${updateQuizFieldResult.rowCount} field names in quiz_questions_rels`);
                // Fix 3: Fix field names in survey_questions_rels
                console.log('\n--- Fixing field names in survey_questions_rels ---');
                const updateSurveyFieldResult = await client.query(`
          UPDATE payload.survey_questions_rels
          SET field = 'surveys'
          WHERE field = 'surveys_id';
        `);
                console.log(`Updated ${updateSurveyFieldResult.rowCount} field names in survey_questions_rels`);
                // Fix 4: Create missing bidirectional relationships for surveys
                console.log('\n--- Creating missing bidirectional relationships for surveys ---');
                const createSurveyRelsResult = await client.query(`
          WITH questions_to_link AS (
            SELECT sq.id as question_id, sqr.surveys_id as survey_id
            FROM payload.survey_questions sq
            JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
            WHERE sqr.surveys_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM payload.surveys_rels sr
              WHERE sr._parent_id = sqr.surveys_id
              AND sr.field = 'questions'
              AND sr.value = sq.id
            )
          )
          INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
          SELECT 
            gen_random_uuid(), 
            survey_id, 
            'questions', 
            question_id,
            NOW(),
            NOW()
          FROM questions_to_link;
        `);
                console.log(`Created ${createSurveyRelsResult.rowCount} bidirectional relationships for surveys`);
                // Fix 5: Create missing bidirectional relationships for quizzes
                console.log('\n--- Creating missing bidirectional relationships for quizzes ---');
                const createQuizRelsResult = await client.query(`
          WITH questions_to_fix AS (
            SELECT id, quiz_id
            FROM payload.quiz_questions qq
            WHERE quiz_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM payload.course_quizzes_rels cqr
              WHERE cqr._parent_id = qq.quiz_id
              AND cqr.field = 'questions'
              AND cqr.value = qq.id
            )
          )
          INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
          SELECT 
            gen_random_uuid(), 
            quiz_id, 
            'questions', 
            id,
            NOW(),
            NOW()
          FROM questions_to_fix;
        `);
                console.log(`Created ${createQuizRelsResult.rowCount} bidirectional relationships for quizzes`);
                // Commit the transaction
                await client.query('COMMIT');
                console.log('\nTransaction committed successfully');
            }
            catch (error) {
                // Rollback the transaction if an error occurs
                await client.query('ROLLBACK');
                console.error('Transaction rolled back due to error:', error);
                throw error;
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error repairing edge cases:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the repair if this script is executed directly
if (import.meta.url === import.meta.resolve('./repair-edge-cases.ts')) {
    repairEdgeCases()
        .then(() => {
        console.log('\nRepair completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Repair failed:', error);
        process.exit(1);
    });
}
export { repairEdgeCases };
