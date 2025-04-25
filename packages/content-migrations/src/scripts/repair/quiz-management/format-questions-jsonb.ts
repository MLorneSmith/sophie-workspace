/**
 * Format Questions JSONB Script
 *
 * This script formats the questions JSONB arrays in course_quizzes to ensure
 * they match the structure expected by Payload CMS for proper UI display.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Log utilities
function logAction(message) {
  console.log(`🔄 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

export const formatQuestionsJSONB = async (): Promise<boolean> => {
  // Database connection
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
    console.log('Connected to database');

    logAction(
      'Formatting quiz questions JSONB arrays for Payload compatibility',
    );

    // Begin transaction
    await client.query('BEGIN');

    // 1. First get all quizzes
    const allQuizzesResult = await client.query(`
      SELECT 
        id as quiz_id,
        title as quiz_title,
        questions
      FROM 
        payload.course_quizzes
      WHERE
        questions IS NOT NULL
    `);

    // 2. Get all quizzes and their related questions from relationship tables
    const quizQuestionsResult = await client.query(`
      SELECT 
        q.id as quiz_id,
        q.title as quiz_title,
        rel.quiz_questions_id as question_id,
        rel._parent_id as parent_id,
        rel.order as sort_order
      FROM 
        payload.course_quizzes q
      JOIN
        payload.course_quizzes_rels rel 
      ON 
        q.id = rel._parent_id
      WHERE 
        rel.field = 'questions'
        AND rel.quiz_questions_id IS NOT NULL
      ORDER BY 
        q.id, rel.order
    `);

    // 3. Group questions by quiz combining both sources
    const quizMap = new Map();

    // First, initialize map with all quizzes and their direct array questions
    for (const quiz of allQuizzesResult.rows) {
      quizMap.set(quiz.quiz_id, {
        id: quiz.quiz_id,
        title: quiz.quiz_title,
        questions: [],
        directQuestions: quiz.questions || [], // Store original questions array
      });
    }

    // Second, add questions from relationship tables
    for (const row of quizQuestionsResult.rows) {
      if (!quizMap.has(row.quiz_id)) {
        quizMap.set(row.quiz_id, {
          id: row.quiz_id,
          title: row.quiz_title,
          questions: [],
          directQuestions: [],
        });
      }

      if (row.question_id) {
        // Check if question already exists to avoid duplicates
        const exists = quizMap
          .get(row.quiz_id)
          .questions.some(
            (q) => q.id === row.question_id || q.questionId === row.question_id,
          );

        if (!exists) {
          quizMap.get(row.quiz_id).questions.push({
            id: row.question_id,
            questionId: row.question_id,
            order: row.sort_order || 0,
          });
        }
      }
    }

    // Third, add any questions from the direct array that aren't in relationship tables
    for (const [quizId, quizData] of quizMap.entries()) {
      // Process direct questions from the array
      let directQuestions = quizData.directQuestions;

      // If it's a string (happens sometimes with JSONB), parse it
      if (typeof directQuestions === 'string') {
        try {
          directQuestions = JSON.parse(directQuestions);
        } catch (e) {
          logError(
            `Error parsing questions array for quiz ${quizData.title}: ${e.message}`,
          );
          directQuestions = [];
        }
      }

      // If it's not an array or null/undefined, skip
      if (!Array.isArray(directQuestions)) {
        continue;
      }

      // Add each direct question that isn't already in the questions array
      for (const questionId of directQuestions) {
        if (!questionId) continue;

        // Extract ID from various possible formats
        const id =
          typeof questionId === 'object'
            ? questionId.id || questionId.value?.id || questionId
            : questionId;

        // Check if question already exists
        const exists = quizData.questions.some(
          (q) => q.id === id || q.questionId === id,
        );

        if (!exists) {
          quizData.questions.push({
            id: id,
            questionId: id,
            order: quizData.questions.length, // Use array position as order
          });

          logAction(
            `Added missing question ${id} from direct array for quiz ${quizData.title}`,
          );
        }
      }

      // Remove the directQuestions property, we don't need it anymore
      delete quizData.directQuestions;
    }

    // 4. Update each quiz with properly formatted questions JSONB and add missing relationships
    let successCount = 0;
    let relationshipsAdded = 0;

    for (const [quizId, quizData] of quizMap.entries()) {
      // Format questions into Payload-compatible structure
      const formattedQuestions = quizData.questions.map((q) => ({
        id: q.id,
        relationTo: 'quiz_questions',
        value: {
          id: q.questionId,
        },
      }));

      // Update the quiz with formatted questions
      await client.query(
        `UPDATE payload.course_quizzes
         SET questions = $1
         WHERE id = $2`,
        [JSON.stringify(formattedQuestions), quizId],
      );

      // Check for each question if it has a relationship record
      for (const question of quizData.questions) {
        // Check if relationship record exists
        const relationshipCheckResult = await client.query(
          `SELECT COUNT(*) as count
           FROM payload.course_quizzes_rels
           WHERE _parent_id = $1
           AND quiz_questions_id = $2
           AND field = 'questions'`,
          [quizId, question.questionId],
        );

        // If no relationship exists, create one
        if (relationshipCheckResult.rows[0].count === '0') {
          await client.query(
            `INSERT INTO payload.course_quizzes_rels
             (_parent_id, field, quiz_questions_id, order)
             VALUES ($1, 'questions', $2, $3)`,
            [quizId, question.questionId, question.order || 0],
          );

          relationshipsAdded++;
          logAction(
            `Created missing relationship for quiz "${quizData.title}" and question ${question.questionId}`,
          );
        }
      }

      successCount++;

      logAction(
        `Formatted questions for quiz "${quizData.title}" (${quizId}) with ${formattedQuestions.length} questions`,
      );
    }

    // 4. Special check for Performance Quiz
    const performanceQuizResult = await client.query(`
      SELECT id, title FROM payload.course_quizzes 
      WHERE title LIKE '%Performance%'
    `);

    if (performanceQuizResult.rows.length > 0) {
      logAction(
        `Found Performance Quiz: ${performanceQuizResult.rows[0].title} (${performanceQuizResult.rows[0].id})`,
      );

      // Check if it has questions
      const questionCountResult = await client.query(
        `
        SELECT COUNT(*) as count FROM payload.course_quizzes_rels
        WHERE _parent_id = $1
        AND field = 'questions'
      `,
        [performanceQuizResult.rows[0].id],
      );

      logAction(
        `Performance Quiz has ${questionCountResult.rows[0].count} related questions`,
      );
    } else {
      logError(
        'Performance Quiz not found! This may indicate a deeper data issue.',
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    logSuccess(
      `Successfully formatted questions JSONB for ${successCount} quizzes, added ${relationshipsAdded} missing relationships`,
    );
    return true;
  } catch (error) {
    // Rollback transaction on error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    logError(`Error formatting questions JSONB: ${error.message}`);
    return false;
  } finally {
    // Close database connection
    try {
      await client.end();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
};

// Execute if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  formatQuestionsJSONB()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default formatQuestionsJSONB;
