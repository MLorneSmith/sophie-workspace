/**
 * Comprehensive Quiz-Question Relationship Fix
 *
 * This script implements a comprehensive fix for quiz-question relationships
 * ensuring proper unidirectional relationships between quizzes and questions.
 *
 * The quiz system uses a unidirectional relationship model:
 * - Quizzes reference questions (parent → children)
 * - Questions do not reference quizzes (no back-reference)
 * - Relationships stored in both quiz's questions array field and relationship tables
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';

/**
 * Fix the relationships between quizzes and questions
 * This comprehensive approach ensures both the direct and relationship table references are correct
 */
export async function fixQuizQuestionRelationships() {
  try {
    // Start a transaction
    await executeSQL('BEGIN');

    // Step 1: Get all quizzes
    console.log('Fetching all quizzes...');
    const quizQuery = `
      SELECT id, title FROM payload.course_quizzes
    `;
    const quizzes = await executeSQL(quizQuery);

    console.log(`Found ${quizzes.rows.length} quizzes to process`);

    // Step 2: For each quiz, ensure proper relationship data
    for (const quiz of quizzes.rows) {
      const quizId = quiz.id;

      // Step 2.1: Identify questions related to this quiz through relationship tables
      const relQuestionsQuery = `
        SELECT id, quiz_id, parent_id, "order" 
        FROM payload.quiz_questions_rels
        WHERE parent_id = $1
        ORDER BY "order" ASC
      `;
      const relQuestions = await executeSQL(relQuestionsQuery, [quizId]);

      // Store questions found in relationship table
      const questionIds = relQuestions.rows.map((q) => q.id);
      console.log(
        `Quiz "${quiz.title}" (${quizId}) has ${questionIds.length} questions in relationship table`,
      );

      // Step 2.2: Update the questions array in the quiz record
      if (questionIds.length > 0) {
        const questionIdsJson = JSON.stringify(questionIds);

        // Update the quiz's questions array
        const updateQuizQuery = `
          UPDATE payload.course_quizzes
          SET questions = $1::jsonb
          WHERE id = $2
        `;
        await executeSQL(updateQuizQuery, [questionIdsJson, quizId]);

        console.log(
          `Updated questions array for quiz "${quiz.title}" (${quizId})`,
        );
      }

      // Step 2.3: Ensure relationship entries exist for each question
      if (questionIds.length > 0) {
        const questionsQuery = `
          SELECT id FROM payload.quiz_questions
          WHERE id = ANY($1::text[])
        `;
        const questions = await executeSQL(questionsQuery, [questionIds]);

        for (const question of questions.rows) {
          const questionId = question.id;

          // Check if relationship exists in course_quizzes_rels table
          const existingRelQuery = `
            SELECT id FROM payload.course_quizzes_rels
            WHERE parent_id = $1 AND id = $2
          `;
          const existingRel = await executeSQL(existingRelQuery, [
            quizId,
            questionId,
          ]);

          if (existingRel.rows.length === 0) {
            // Create relationship entry if missing
            const insertRelQuery = `
              INSERT INTO payload.course_quizzes_rels (id, parent_id, "order")
              VALUES ($1, $2, 0)
              ON CONFLICT (id, parent_id) DO NOTHING
            `;
            await executeSQL(insertRelQuery, [questionId, quizId]);

            console.log(
              `Created missing relationship for quiz ${quizId} and question ${questionId}`,
            );
          }
        }
      }
    }

    // Step 3: Verify all quizzes have their questions array properly populated
    console.log(
      'Verifying all quizzes have properly populated questions arrays...',
    );
    const emptyQuestionsQuery = `
      SELECT id, title 
      FROM payload.course_quizzes
      WHERE questions IS NULL OR questions = '[]'::jsonb OR questions = 'null'::jsonb
    `;
    const emptyQuizzes = await executeSQL(emptyQuestionsQuery);

    if (emptyQuizzes.rows.length > 0) {
      console.log(
        `Found ${emptyQuizzes.rows.length} quizzes with empty questions arrays:`,
      );
      for (const quiz of emptyQuizzes.rows) {
        console.log(`- Quiz "${quiz.title}" (${quiz.id})`);
      }
    } else {
      console.log('All quizzes have properly populated questions arrays');
    }

    // Commit the transaction
    await executeSQL('COMMIT');

    console.log('Quiz-question relationship fix completed successfully');
    return true;
  } catch (error) {
    // Rollback on error
    try {
      await executeSQL('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    console.error('Error fixing quiz question relationships:', error);
    return false;
  }
}

/**
 * Main function to run the comprehensive quiz fix
 */
async function main() {
  try {
    console.log('Starting comprehensive quiz-question relationship fix...');

    await fixQuizQuestionRelationships();

    console.log('Comprehensive quiz fix completed successfully');
  } catch (error) {
    console.error('Error during comprehensive quiz fix:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
