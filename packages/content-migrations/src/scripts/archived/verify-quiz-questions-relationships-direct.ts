/**
 * Verify Quiz Questions Relationships (Direct Database Access)
 *
 * This script verifies that:
 * 1. The quiz_id_id column in the quiz_questions table is populated
 * 2. The relationships in the quiz_questions_rels table exist with field = 'quiz_id'
 * 3. The bidirectional relationships in the course_quizzes_rels table exist
 *
 * This version uses direct database access instead of the Payload client,
 * so it doesn't require the Payload server to be running.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Verify Quiz Questions Relationships using direct database access
 */
async function verifyQuizQuestionsRelationshipsDirect() {
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

      // Step 1: Check if quiz_id_id column is populated
      console.log('Checking if quiz_id_id column is populated...');
      const quizIdIdResult = await client.query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN quiz_id_id IS NOT NULL THEN 1 END) as populated
        FROM "payload"."quiz_questions"
        WHERE "quiz_id" IS NOT NULL;
      `);

      const total = parseInt(quizIdIdResult.rows[0]?.total || '0');
      const populated = parseInt(quizIdIdResult.rows[0]?.populated || '0');

      console.log(`Quiz questions with quiz_id: ${total}`);
      console.log(`Quiz questions with quiz_id_id: ${populated}`);

      if (total === populated) {
        console.log('✅ All quiz questions have quiz_id_id populated');
      } else {
        console.log(
          `❌ ${total - populated} quiz questions are missing quiz_id_id values`,
        );
      }

      // Step 2: Check if relationships exist in quiz_questions_rels table
      console.log(
        '\nChecking if relationships exist in quiz_questions_rels table...',
      );
      const relsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "payload"."quiz_questions_rels"
        WHERE "field" = 'quiz_id';
      `);

      const relsCount = parseInt(relsResult.rows[0]?.count || '0');

      console.log(
        `Relationships in quiz_questions_rels table with field 'quiz_id': ${relsCount}`,
      );

      if (relsCount === total) {
        console.log(
          '✅ All quiz questions have relationships in quiz_questions_rels table',
        );
      } else {
        console.log(
          `❌ ${total - relsCount} quiz questions are missing relationships in quiz_questions_rels table`,
        );
      }

      // Step 3: Check if bidirectional relationships exist in course_quizzes_rels table
      console.log(
        '\nChecking if bidirectional relationships exist in course_quizzes_rels table...',
      );

      // First, check if course_quizzes_rels table exists
      const tableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
        ) as exists;
      `);

      // Initialize bidirectionalResult outside the if statement
      let bidirectionalCount = 0;

      if (tableExistsResult.rows[0]?.exists) {
        const bidirectionalResult = await client.query(`
          SELECT COUNT(*) as count
          FROM "payload"."course_quizzes_rels"
          WHERE "field" = 'questions';
        `);

        bidirectionalCount = parseInt(
          bidirectionalResult.rows[0]?.count || '0',
        );

        console.log(
          `Bidirectional relationships in course_quizzes_rels table: ${bidirectionalCount}`,
        );

        if (bidirectionalCount === total) {
          console.log(
            '✅ All quiz questions have bidirectional relationships in course_quizzes_rels table',
          );
        } else {
          console.log(
            `❌ ${total - bidirectionalCount} quiz questions are missing bidirectional relationships in course_quizzes_rels table`,
          );
        }
      } else {
        console.log('❌ course_quizzes_rels table does not exist');
      }

      // Step 4: Check if quizzes have questions assigned in the database
      console.log(
        '\nChecking if quizzes have questions assigned in the database...',
      );

      // Get all quizzes
      const quizzesResult = await client.query(`
        SELECT id, title FROM "payload"."course_quizzes";
      `);

      const totalQuizzes = quizzesResult.rows.length;

      // For each quiz, check if it has questions
      let quizzesWithQuestions = 0;
      for (const quiz of quizzesResult.rows) {
        const questionsResult = await client.query(
          `
          SELECT COUNT(*) as count
          FROM "payload"."quiz_questions"
          WHERE "quiz_id" = $1;
        `,
          [quiz.id],
        );

        const questionCount = parseInt(questionsResult.rows[0]?.count || '0');
        if (questionCount > 0) {
          quizzesWithQuestions++;
        }
      }

      console.log(
        `Quizzes with questions assigned: ${quizzesWithQuestions} / ${totalQuizzes}`,
      );

      if (quizzesWithQuestions === totalQuizzes) {
        console.log('✅ All quizzes have questions assigned');
      } else {
        console.log(
          `❌ ${totalQuizzes - quizzesWithQuestions} quizzes are missing questions`,
        );
      }

      console.log('\nVerification complete!');

      // Return a summary of the verification
      return {
        quizQuestionsTotal: total,
        quizQuestionsWithQuizIdId: populated,
        relationshipsInQuizQuestionsRelsWithQuizId: relsCount,
        bidirectionalRelationshipsInCourseQuizzesRels: tableExistsResult.rows[0]
          ?.exists
          ? bidirectionalCount
          : 0,
        quizzesWithQuestionsAssigned: quizzesWithQuestions,
        totalQuizzes,
      };
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the verification if this script is executed directly
if (
  import.meta.url ===
  import.meta.resolve('./verify-quiz-questions-relationships-direct.ts')
) {
  verifyQuizQuestionsRelationshipsDirect()
    .then((result) => {
      console.log('\nVerification Summary:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyQuizQuestionsRelationshipsDirect };
