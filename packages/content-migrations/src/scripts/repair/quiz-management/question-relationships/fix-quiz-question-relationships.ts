import { Client } from 'pg';

/**
 * Fix bidirectional relationships between quizzes and quiz questions
 *
 * This script ensures that quizzes properly reference their questions
 * and that the relationship tables are correctly populated.
 */
export async function fixQuizQuestionRelationships(): Promise<void> {
  console.log('Fixing quiz-question bidirectional relationships...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Find all quiz questions and their associated quizzes
    const questions = await client.query(`
      SELECT id, question, quiz_id FROM payload.quiz_questions
      WHERE quiz_id IS NOT NULL
    `);

    console.log(`Found ${questions.rowCount} quiz questions with quiz_id set`);

    // 2. Group questions by quiz_id
    const quizMap = new Map();
    questions.rows.forEach((q) => {
      if (!quizMap.has(q.quiz_id)) {
        quizMap.set(q.quiz_id, []);
      }
      quizMap.get(q.quiz_id).push(q.id);
    });

    console.log(`Found ${quizMap.size} quizzes with questions`);

    // 3. Update quizzes with their questions array
    for (const [quizId, questionIds] of quizMap.entries()) {
      // Update the quiz entry
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET questions = ARRAY[${questionIds.map((id) => `'${id}'`).join(',')}]::uuid[]
        WHERE id = $1
      `,
        [quizId],
      );

      // Ensure relationship entries exist in course_quizzes_rels
      for (const questionId of questionIds) {
        // Check if relationship already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND field = 'questions' AND value = $2
        `,
          [quizId, questionId],
        );

        if (existingRel.rowCount === 0) {
          // Create the relationship
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels
            (id, _parent_id, field, value, created_at, updated_at, quiz_questions_id)
            VALUES (gen_random_uuid(), $1, 'questions', $2, NOW(), NOW(), $2)
          `,
            [quizId, questionId],
          );
        }
      }
    }

    // 4. Verify that relationships are established
    const verificationResult = await client.query(`
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        COUNT(qq.id) as question_count,
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as questions_array_length,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      LEFT JOIN payload.quiz_questions qq ON qq.quiz_id = cq.id
      GROUP BY cq.id, cq.title, cq.questions
      ORDER BY question_count DESC
    `);

    console.log('\nVerification results:');
    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.quiz_title}": ${row.question_count} questions, ${row.questions_array_length} in array, ${row.rel_count} in relationships`,
      );

      if (
        row.question_count !== row.questions_array_length ||
        row.question_count !== row.rel_count
      ) {
        console.warn(`  ⚠️ Mismatch detected for quiz "${row.quiz_title}"`);
      }
    });

    await client.query('COMMIT');
    console.log('Successfully fixed quiz-question relationships');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz-question relationships:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixQuizQuestionRelationships()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
