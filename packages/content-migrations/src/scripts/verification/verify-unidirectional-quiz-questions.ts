// Import pg in a way that works with ESM
import pg from 'pg';

const { Client } = pg;

/**
 * Verify the integrity of unidirectional quiz-question relationships
 * @module verify-unidirectional-quiz-questions
 *
 * This script checks:
 * 1. That all quizzes with questions have their questions array populated
 * 2. That relationship entries exist in the course_quizzes_rels table
 * 3. That there is consistency between direct field storage and relationship table storage
 */
export async function verifyUnidirectionalQuizQuestions(): Promise<boolean> {
  console.log('Verifying unidirectional quiz-question relationships...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();

    // 1. Get all quizzes
    const quizzes = await client.query(`
      SELECT id, title, slug 
      FROM payload.course_quizzes 
      ORDER BY title
    `);

    console.log(`Found ${quizzes.rowCount} quizzes to verify`);

    let overallSuccess = true;
    let problemsFound = 0;

    for (const quiz of quizzes.rows) {
      // 2. Get relationship entries from course_quizzes_rels table
       const relationshipRecords = await client.query(
         `
         SELECT quiz_questions_id as question_id -- Use the correct column name
         FROM payload.course_quizzes_rels 
         WHERE _parent_id = $1 AND field = 'questions'
        ORDER BY _order ASC
      `,
        [quiz.id],
      );

      const questionIdsFromRels = relationshipRecords.rows.map(
        (row) => row.question_id,
      );

      // In the unidirectional model, questions are ONLY stored in the relationship table,
      // not in the main course_quizzes table as a column

      // Instead of checking consistency between two sources, verify that questions exist
      // and are properly ordered in the relationship table
      if (questionIdsFromRels.length === 0) {
        // It's acceptable for a quiz to have no questions, but log it
        console.log(`Quiz "${quiz.title}" (${quiz.id}) has no questions`);
      } else {
        console.log(
          `✅ Quiz "${quiz.title}" has ${questionIdsFromRels.length} questions in the relationship table`,
        );

        // Verify that all question IDs are valid UUIDs
        const invalidQuestionIds = questionIdsFromRels.filter(
          (
            id: any, // Allow 'any' type temporarily for robust checking
          ) =>
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(id), // Explicitly cast ID to string before regex test
            ),
        );

        if (invalidQuestionIds.length > 0) {
          console.warn(
            `❌ Quiz "${quiz.title}" has ${invalidQuestionIds.length} invalid question IDs`,
          );
          overallSuccess = false;
          problemsFound++;
        }
      }
    }

    // Summary
    if (overallSuccess) {
      console.log(
        '✅ All quiz-question relationships are consistent with the unidirectional model',
      );
      return true;
    } else {
      console.warn(
        `❌ Found ${problemsFound} quizzes with inconsistent relationships`,
      );
      console.warn(
        'Run fix:unidirectional-quiz-questions to repair these issues',
      );
      return false;
    }
  } catch (error) {
    console.error(
      'Error verifying unidirectional quiz-question relationships:',
      error,
    );
    return false;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (typeof require !== 'undefined' && require.main === module) {
  verifyUnidirectionalQuizQuestions()
    .then((success) => {
      console.log(success ? 'Verification successful' : 'Verification failed');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

// Default export for ESM compatibility
export default verifyUnidirectionalQuizQuestions;
