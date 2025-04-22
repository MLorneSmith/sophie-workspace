import { Client } from 'pg';

/**
 * Fix references to quizzes that don't have any questions
 *
 * This script identifies quizzes that don't have any questions associated with them
 * and nullifies lesson references to these quizzes to prevent UI errors.
 */
export async function fixQuizzesWithoutQuestions(): Promise<void> {
  console.log('Fixing references to quizzes without questions...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Identify quizzes that don't have any questions
    const quizzesWithoutQuestions = await client.query(`
      SELECT cq.id, cq.title
      FROM payload.course_quizzes cq
      LEFT JOIN payload.quiz_questions qq ON qq.quiz_id = cq.id
      GROUP BY cq.id, cq.title
      HAVING COUNT(qq.id) = 0
    `);

    if (quizzesWithoutQuestions.rowCount > 0) {
      console.log(
        `Found ${quizzesWithoutQuestions.rowCount} quizzes without questions:`,
      );

      const quizIds = quizzesWithoutQuestions.rows.map((q) => q.id);

      quizzesWithoutQuestions.rows.forEach((quiz) => {
        console.log(`- Quiz ID: ${quiz.id}, Title: ${quiz.title}`);
      });

      // Update lessons to remove references to quizzes without questions
      const updateResult = await client.query(`
        UPDATE payload.course_lessons
        SET quiz_id = NULL
        WHERE quiz_id IN (${quizIds.map((id) => `'${id}'`).join(',')})
        RETURNING id, title
      `);

      // Also update quiz_id_id field which is sometimes used
      const updateIdIdResult = await client.query(`
        UPDATE payload.course_lessons
        SET quiz_id_id = NULL
        WHERE quiz_id_id IN (${quizIds.map((id) => `'${id}'`).join(',')})
        RETURNING id, title
      `);

      const totalUpdated = updateResult.rowCount + updateIdIdResult.rowCount;

      console.log(
        `Updated ${totalUpdated} lessons to remove references to quizzes without questions:`,
      );

      const updatedLessons = [...updateResult.rows, ...updateIdIdResult.rows];
      updatedLessons.forEach((row) => {
        console.log(`- Lesson ID: ${row.id}, Title: ${row.title}`);
      });
    } else {
      console.log('No quizzes without questions found');
    }

    await client.query('COMMIT');
    console.log('Successfully fixed quiz-without-questions references');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz-without-questions references:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixQuizzesWithoutQuestions()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
