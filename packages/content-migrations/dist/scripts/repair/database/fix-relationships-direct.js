/**
 * Fix Relationships Direct
 *
 * This script fixes relationships between collections directly in the database.
 * It ensures that all relationships are properly set up and bidirectional.
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
 * Fixes relationships between collections directly in the database
 */
async function fixRelationshipsDirect() {
    console.log('Fixing relationships directly in the database...');
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
            // Start a transaction
            await client.query('BEGIN');
            try {
                // 1. Fix quiz_id_id to match quiz_id in quiz_questions
                console.log('Fixing quiz_id_id to match quiz_id in quiz_questions...');
                const updateQuizIdResult = await client.query(`
          UPDATE payload.quiz_questions
          SET quiz_id_id = quiz_id
          WHERE quiz_id IS NOT NULL AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);
        `);
                console.log(`Updated ${updateQuizIdResult.rowCount} quiz_id_id values to match quiz_id`);
                // 2. Create bidirectional relationships for surveys and survey_questions
                console.log('Creating bidirectional relationships for surveys and survey_questions...');
                // Get all survey questions with surveys_id
                const surveyQuestionsResult = await client.query(`
          SELECT id, surveys_id FROM payload.survey_questions
          WHERE surveys_id IS NOT NULL;
        `);
                // Create bidirectional relationships in surveys_rels table
                let createdSurveyRels = 0;
                for (const row of surveyQuestionsResult.rows) {
                    // Check if relationship already exists
                    const existingRelResult = await client.query(`
            SELECT id FROM payload.surveys_rels
            WHERE _parent_id = $1 AND field = 'questions' AND value = $2;
          `, [row.surveys_id, row.id]);
                    if (existingRelResult.rows.length === 0) {
                        // Create bidirectional relationship
                        await client.query(`
              INSERT INTO payload.surveys_rels (_parent_id, field, value, created_at, updated_at)
              VALUES ($1, 'questions', $2, NOW(), NOW());
            `, [row.surveys_id, row.id]);
                        createdSurveyRels++;
                    }
                }
                console.log(`Created ${createdSurveyRels} bidirectional relationships in surveys_rels table`);
                // 3. Create relationships in quiz_questions_rels table
                console.log('Creating relationships in quiz_questions_rels table...');
                // Get all quiz questions with quiz_id
                const quizQuestionsResult = await client.query(`
          SELECT id, quiz_id FROM payload.quiz_questions
          WHERE quiz_id IS NOT NULL;
        `);
                // Create relationships in quiz_questions_rels table
                let createdQuizQuestionRels = 0;
                for (const row of quizQuestionsResult.rows) {
                    // Check if relationship already exists
                    const existingRelResult = await client.query(`
            SELECT id FROM payload.quiz_questions_rels
            WHERE _parent_id = $1 AND field = 'quiz_id' AND value = $2;
          `, [row.id, row.quiz_id]);
                    if (existingRelResult.rows.length === 0) {
                        // Create relationship
                        await client.query(`
              INSERT INTO payload.quiz_questions_rels (_parent_id, field, value, created_at, updated_at)
              VALUES ($1, 'quiz_id', $2, NOW(), NOW());
            `, [row.id, row.quiz_id]);
                        createdQuizQuestionRels++;
                    }
                }
                console.log(`Created ${createdQuizQuestionRels} relationships in quiz_questions_rels table`);
                // 4. Create bidirectional relationships in course_quizzes_rels table
                console.log('Creating bidirectional relationships in course_quizzes_rels table...');
                // Get all quiz questions with quiz_id
                const quizQuestionsForBiResult = await client.query(`
          SELECT id, quiz_id FROM payload.quiz_questions
          WHERE quiz_id IS NOT NULL;
        `);
                // Create bidirectional relationships in course_quizzes_rels table
                let createdQuizRels = 0;
                for (const row of quizQuestionsForBiResult.rows) {
                    // Check if relationship already exists
                    const existingRelResult = await client.query(`
            SELECT id FROM payload.course_quizzes_rels
            WHERE _parent_id = $1 AND field = 'questions' AND value = $2;
          `, [row.quiz_id, row.id]);
                    if (existingRelResult.rows.length === 0) {
                        // Create bidirectional relationship
                        await client.query(`
              INSERT INTO payload.course_quizzes_rels (_parent_id, field, value, created_at, updated_at)
              VALUES ($1, 'questions', $2, NOW(), NOW());
            `, [row.quiz_id, row.id]);
                        createdQuizRels++;
                    }
                }
                console.log(`Created ${createdQuizRels} bidirectional relationships in course_quizzes_rels table`);
                // 5. Verify relationships
                console.log('Verifying relationships...');
                // Count quiz questions and bidirectional relationships
                const quizQuestionsCountResult = await client.query(`
          SELECT COUNT(*) FROM payload.quiz_questions
          WHERE quiz_id IS NOT NULL;
        `);
                const bidirectionalQuizRelsCountResult = await client.query(`
          SELECT COUNT(*) FROM payload.course_quizzes_rels
          WHERE field = 'questions';
        `);
                const quizQuestionsCount = parseInt(quizQuestionsCountResult.rows[0].count);
                const bidirectionalQuizRelsCount = parseInt(bidirectionalQuizRelsCountResult.rows[0].count);
                console.log(`Verification: ${quizQuestionsCount} quiz questions ${bidirectionalQuizRelsCount} bidirectional relationships`);
                if (quizQuestionsCount === bidirectionalQuizRelsCount) {
                    console.log('✅ All quiz relationships are properly bidirectional');
                }
                else {
                    console.log('⚠️ Some quiz relationships are not properly bidirectional');
                }
                // Commit transaction
                await client.query('COMMIT');
                console.log('Relationships fixed successfully');
            }
            catch (error) {
                // Rollback on error
                await client.query('ROLLBACK');
                console.error('Error fixing relationships:', error);
                throw error;
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error fixing relationships:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the function if this script is executed directly
if (import.meta.url === import.meta.resolve('./fix-relationships-direct.ts')) {
    fixRelationshipsDirect()
        .then(() => {
        console.log('Relationships fixed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Error fixing relationships:', error);
        process.exit(1);
    });
}
export { fixRelationshipsDirect };
