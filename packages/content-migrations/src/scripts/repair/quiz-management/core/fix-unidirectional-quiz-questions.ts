import pg from 'pg';

const { Client } = pg;

/**
 * Comprehensive fix for quiz-question relationships in a unidirectional model
 *
 * This script ensures:
 * 1. All quizzes have their questions properly referenced in the questions array
 * 2. All quiz-question relationships are properly recorded in course_quizzes_rels
 * 3. All quiz objects in course_quizzes have consistent data
 */
export async function fixUnidirectionalQuizQuestions(): Promise<void> {
  console.log(
    'Starting comprehensive unidirectional quiz-question relationship fix...',
  );

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // 1. Get all quizzes
    const quizzes = await client.query(`
      SELECT id, title, slug, questions 
      FROM payload.course_quizzes 
      ORDER BY title
    `);

    console.log(`Found ${quizzes.rowCount} quizzes to process`);

    for (const quiz of quizzes.rows) {
      console.log(`Processing quiz: ${quiz.title} (${quiz.id})`);

      // 2. Get existing question relationships from course_quizzes_rels table
      const relationshipRecords = await client.query(
        `
        SELECT value as question_id, quiz_questions_id 
        FROM payload.course_quizzes_rels 
        WHERE _parent_id = $1 AND field = 'questions'
      `,
        [quiz.id],
      );

      const questionIds = relationshipRecords.rows.map(
        (row) => row.question_id,
      );
      console.log(
        `  Found ${questionIds.length} question relationships in relationship table`,
      );

      if (questionIds.length === 0) {
        console.log(`  No questions found for quiz ${quiz.title}, skipping...`);
        continue;
      }

      // 3. Update the questions array in the course_quizzes table
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET questions = $1::uuid[]
        WHERE id = $2
      `,
        [questionIds, quiz.id],
      );

      console.log(
        `  Updated questions array in course_quizzes table for ${quiz.title}`,
      );

      // 4. Ensure all questions have relationship entries in course_quizzes_rels
      for (const questionId of questionIds) {
        // Check if relationship already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND field = 'questions' AND value = $2
        `,
          [quiz.id, questionId],
        );

        if (existingRel.rowCount === 0) {
          // Create the relationship
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels
            (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
            VALUES (gen_random_uuid()::uuid, $1::uuid, 'questions', $2::uuid, $2::uuid, NOW(), NOW())
          `,
            [quiz.id, questionId],
          );

          console.log(
            `  Created missing relationship for question ${questionId}`,
          );
        }
      }

      // 5. Ensure quiz questions are properly sorted by order field
      await client.query(
        `
        UPDATE payload.quiz_questions
        SET "order" = subquery.row_number
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "order", created_at) as row_number
          FROM payload.quiz_questions
          WHERE id = ANY($1::uuid[])
        ) as subquery
        WHERE payload.quiz_questions.id = subquery.id
      `,
        [questionIds],
      );

      console.log(
        `  Updated order field for all questions in quiz ${quiz.title}`,
      );
    }

    // 6. Verify the fix was successful
    const verificationResult = await client.query(`
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as questions_array_length,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      ORDER BY cq.title
    `);

    console.log('\nVerification results:');
    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.quiz_title}": ${row.questions_array_length} in array, ${row.rel_count} in relationships`,
      );

      if (row.questions_array_length !== row.rel_count) {
        console.warn(`  ⚠️ Mismatch detected for quiz "${row.quiz_title}"`);
      }
    });

    // 7. Commit all changes in a single transaction
    await client.query('COMMIT');
    console.log(
      'Successfully fixed unidirectional quiz-question relationships',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      'Error fixing unidirectional quiz-question relationships:',
      error,
    );
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  fixUnidirectionalQuizQuestions()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
