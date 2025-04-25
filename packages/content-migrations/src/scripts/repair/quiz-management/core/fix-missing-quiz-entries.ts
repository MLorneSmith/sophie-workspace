import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Client } = pg;

/**
 * Fix for missing quiz entries referenced by lessons
 *
 * This script:
 * 1. Identifies lesson references to quizzes that don't exist in course_quizzes
 * 2. Creates the missing quiz entries with appropriate metadata
 * 3. Re-establishes the relationships between quizzes and questions
 * 4. Updates both direct fields and relationship tables
 */
export async function fixMissingQuizEntries(): Promise<void> {
  console.log('Starting fix for missing quiz entries...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // 1. Identify missing quizzes referenced by lessons
    const missingQuizzesResult = await client.query(`
      WITH lesson_quiz_refs AS (
        -- Get all quiz references from lessons
        SELECT 
          cl.id AS lesson_id,
          cl.title AS lesson_title,
          cl.quiz_id_id AS quiz_id,
          cl.course_id_id AS course_id
        FROM payload.course_lessons cl
        WHERE cl.quiz_id_id IS NOT NULL
      )
      SELECT 
        lqr.lesson_id,
        lqr.lesson_title,
        lqr.quiz_id,
        lqr.course_id,
        cq.id AS existing_quiz_id,
        CASE WHEN cq.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END AS status
      FROM lesson_quiz_refs lqr
      LEFT JOIN payload.course_quizzes cq ON cq.id = lqr.quiz_id
      WHERE cq.id IS NULL  -- Only return entries where quiz doesn't exist
    `);

    const missingQuizzes = missingQuizzesResult.rows;
    console.log(
      `Found ${missingQuizzes.length} missing quiz entries referenced by lessons`,
    );

    // Track IDs of quizzes we create
    const createdQuizIds: string[] = [];

    // 2. Create missing quiz entries
    for (const missingQuiz of missingQuizzes) {
      const quizId = missingQuiz.quiz_id;
      const courseId = missingQuiz.course_id;
      const lessonTitle = missingQuiz.lesson_title;

      // Generate quiz title and slug based on lesson title
      const quizTitle = `${lessonTitle} Quiz`;
      const quizSlug =
        lessonTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + '-quiz';

      console.log(
        `Creating missing quiz: "${quizTitle}" (${quizId}) for lesson: "${lessonTitle}"`,
      );

      // Create the missing quiz entry
      await client.query(
        `
        INSERT INTO payload.course_quizzes (
          id, 
          title, 
          slug, 
          course_id_id,
          description,
          pass_threshold,
          questions,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid, 
          $2, 
          $3, 
          $4::uuid,
          $5,
          $6,
          $7::uuid[],
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `,
        [
          quizId,
          quizTitle,
          quizSlug,
          courseId,
          `Quiz for ${lessonTitle}`,
          70, // Default pass threshold
          [], // Empty questions array initially
        ],
      );

      // Create relationship entry between quiz and course
      await client.query(
        `
        INSERT INTO payload.course_quizzes_rels (
          id,
          _parent_id,
          field,
          value,
          courses_id,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid,
          $2::uuid,
          'course_id',
          $3::uuid,
          $3::uuid,
          NOW(),
          NOW()
        )
        ON CONFLICT (_parent_id, field, value) DO NOTHING
      `,
        [
          uuidv4(), // Generate a new UUID for the relationship
          quizId,
          courseId,
        ],
      );

      createdQuizIds.push(quizId);
    }

    // If we didn't create any quizzes, we're done
    if (createdQuizIds.length === 0) {
      console.log('No missing quizzes to create');
      await client.query('COMMIT');
      return;
    }

    // 3. Find and associate existing quiz questions with newly created quizzes
    console.log(
      'Searching for quiz questions to associate with new quizzes...',
    );

    for (const quizId of createdQuizIds) {
      // Look for quiz questions that might belong to this quiz
      // We'll use a heuristic to match questions - they might have the same naming pattern
      const quizInfoResult = await client.query(
        `
        SELECT title, slug FROM payload.course_quizzes WHERE id = $1
      `,
        [quizId],
      );

      if (quizInfoResult.rows.length === 0) {
        console.log(`Quiz ${quizId} not found, skipping question association`);
        continue;
      }

      const quizTitle = quizInfoResult.rows[0].title;
      const quizSlug = quizInfoResult.rows[0].slug;

      // Look for questions with similar naming as the quiz or lesson
      const baseTitle = quizTitle.replace(' Quiz', '');

      // Get questions that might belong to this quiz
      const potentialQuestionsResult = await client.query(
        `
        SELECT id, question, "order"
        FROM payload.quiz_questions
        WHERE 
          question ILIKE $1 OR 
          question ILIKE $2 OR
          question ILIKE $3
        ORDER BY "order", created_at
      `,
        [
          `%${baseTitle}%`,
          `%${quizSlug.replace('-quiz', '')}%`,
          `%${baseTitle.split(' ')[0]}%`, // First word in the title
        ],
      );

      const potentialQuestions = potentialQuestionsResult.rows;
      console.log(
        `Found ${potentialQuestions.length} potential questions for quiz "${quizTitle}"`,
      );

      if (potentialQuestions.length > 0) {
        // Get the question IDs
        const questionIds = potentialQuestions.map((q) => q.id);

        // Update the questions array in the course_quizzes table
        await client.query(
          `
          UPDATE payload.course_quizzes
          SET questions = $1::uuid[]
          WHERE id = $2
        `,
          [questionIds, quizId],
        );

        // Create relationships between quiz and questions
        for (const [index, question] of potentialQuestions.entries()) {
          const questionId = question.id;

          // Create relationship entry
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels (
              id,
              _parent_id,
              field,
              value,
              quiz_questions_id,
              order,
              created_at,
              updated_at
            ) VALUES (
              $1::uuid,
              $2::uuid,
              'questions',
              $3::uuid,
              $3::uuid,
              $4,
              NOW(),
              NOW()
            )
            ON CONFLICT (_parent_id, field, value) DO NOTHING
          `,
            [
              uuidv4(), // Generate a new UUID for the relationship
              quizId,
              questionId,
              index,
            ],
          );

          console.log(
            `Associated question "${question.question}" with quiz "${quizTitle}"`,
          );
        }
      } else {
        console.log(`No matching questions found for quiz "${quizTitle}"`);
      }
    }

    // 4. Verify the results
    const verificationResult = await client.query(
      `
      SELECT 
        cq.id, 
        cq.title, 
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as question_count,
        CASE WHEN cq.course_id_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_course_id,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels cqr WHERE cqr._parent_id = cq.id AND cqr.field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      WHERE cq.id IN (${createdQuizIds.map((_, i) => `$${i + 1}`).join(',')})
    `,
      createdQuizIds,
    );

    console.log('\nVerification results for created/fixed quizzes:');
    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.title}" (${row.id}): ${row.question_count} questions in array, ${row.rel_count} in relationships, Has course_id: ${row.has_course_id}`,
      );
    });

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Successfully fixed missing quiz entries');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing missing quiz entries:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the function if called directly
if (import.meta.url.endsWith(process.argv[1])) {
  fixMissingQuizEntries()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
