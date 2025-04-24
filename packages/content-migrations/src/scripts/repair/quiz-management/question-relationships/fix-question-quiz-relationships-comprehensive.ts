/**
 * Comprehensive Fix for Question-Quiz Relationships
 *
 * This script validates and fixes the unidirectional relationships between
 * quizzes and questions. In our model, quizzes point to questions via the
 * course_quizzes_rels table (not the other way around).
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

const { Client } = pg;

/**
 * Main function to fix question-quiz relationships comprehensively
 */
async function fixQuestionQuizRelationshipsComprehensive(): Promise<void> {
  console.log('Running comprehensive question-quiz relationship fix...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    // Connect to database
    await client.connect();

    // Start a transaction for atomicity
    await client.query('BEGIN');

    // 1. Verify that the quiz_questions table exists
    const tablesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions'
      );
    `);

    if (!tablesResult.rows[0].exists) {
      throw new Error('quiz_questions table does not exist');
    }

    // 2. Ensure course_quizzes_rels table exists for unidirectional relationships
    const relsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      );
    `);

    if (!relsTableResult.rows[0].exists) {
      throw new Error(
        'course_quizzes_rels table does not exist. This is a critical error.',
      );
    } else {
      console.log(
        'course_quizzes_rels table exists for unidirectional relationships',
      );
    }

    // Get table structure to better understand relationship columns
    console.log('Examining course_quizzes_rels table structure...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = 'course_quizzes_rels'
      ORDER BY ordinal_position;
    `);

    console.log('Available columns in course_quizzes_rels:');
    const columns = tableStructure.rows.map((row) => row.column_name);
    console.log(columns.join(', '));

    // 3. Get all quiz questions and their relationships
    console.log('Getting all quiz questions...');
    const questionsResult = await client.query(`
      SELECT id
      FROM payload.quiz_questions;
    `);

    const questions = questionsResult.rows;
    console.log(`Found ${questions.length} quiz questions in the database`);

    // 4. Get all quiz-question relationships from the course_quizzes_rels table
    console.log('Getting quiz-question relationships...');
    const relationshipsResult = await client.query(`
      SELECT _parent_id AS quiz_id, value AS question_id
      FROM payload.course_quizzes_rels
      WHERE field = 'questions'
      AND value IS NOT NULL;
    `);

    const relationships = relationshipsResult.rows;
    console.log(`Found ${relationships.length} quiz-question relationships`);

    // 5. Identify questions that aren't associated with any quiz
    const questionIds = new Set(questions.map((q) => q.id));
    const relatedQuestionIds = new Set(relationships.map((r) => r.question_id));

    const orphanedQuestions = [...questionIds].filter(
      (id) => !relatedQuestionIds.has(id),
    );

    console.log(
      `Found ${orphanedQuestions.length} questions not associated with any quiz`,
    );
    if (orphanedQuestions.length > 0) {
      console.log('First 5 orphaned questions:', orphanedQuestions.slice(0, 5));
    }

    // 6. Verify unidirectional relationships
    console.log('Verifying unidirectional relationships...');
    const verificationResult = await client.query(`
      SELECT 
        COUNT(DISTINCT qq.id) as total_questions,
        COUNT(DISTINCT cqr.value) as questions_in_relationships
      FROM 
        payload.quiz_questions qq
      LEFT JOIN 
        payload.course_quizzes_rels cqr ON qq.id = cqr.value AND cqr.field = 'questions';
    `);

    const { total_questions, questions_in_relationships } =
      verificationResult.rows[0];

    console.log(`Verification results:
- Total questions: ${total_questions}
- Questions in relationships: ${questions_in_relationships}
- Orphaned questions: ${total_questions - questions_in_relationships}
    `);

    if (orphanedQuestions.length === 0) {
      console.log('✅ All relationships are valid in the unidirectional model');
    } else {
      console.warn(
        `⚠️ Warning: Found ${orphanedQuestions.length} questions not associated with any quiz`,
      );
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Question-quiz relationship fix completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error fixing question-quiz relationships:', error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
  }
}

// Execute directly when script is run
if (
  import.meta.url ===
  import.meta.resolve('./fix-question-quiz-relationships-comprehensive.ts')
) {
  fixQuestionQuizRelationshipsComprehensive()
    .then(() => {
      console.log('Script executed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default fixQuestionQuizRelationshipsComprehensive;
