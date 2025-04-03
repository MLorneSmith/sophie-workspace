/**
 * Script to verify relationships in the database
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
 * Verifies relationships in the database
 */
async function verifyRelationships() {
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

      // Verify lesson-quiz relationships
      console.log('\nVerifying lesson-quiz relationships...');

      // Check quiz_id and quiz_id_id columns in course_lessons
      const lessonsWithQuizId = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons 
        WHERE quiz_id IS NOT NULL
      `);

      const lessonsWithQuizIdId = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons 
        WHERE quiz_id_id IS NOT NULL
      `);

      // Check relationship entries in course_lessons_rels
      const lessonQuizRelationships = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons_rels 
        WHERE field = 'quiz_id_id'
      `);

      console.log(`Lessons with quiz_id: ${lessonsWithQuizId.rows[0].count}`);
      console.log(
        `Lessons with quiz_id_id: ${lessonsWithQuizIdId.rows[0].count}`,
      );
      console.log(
        `Lesson-Quiz relationships in course_lessons_rels: ${lessonQuizRelationships.rows[0].count}`,
      );

      // Verify quiz-question relationships
      console.log('\nVerifying quiz-question relationships...');

      // Check quiz_id column in quiz_questions
      const questionsWithQuizId = await client.query(`
        SELECT COUNT(*) FROM payload.quiz_questions 
        WHERE quiz_id IS NOT NULL
      `);

      console.log(
        `Questions with quiz_id: ${questionsWithQuizId.rows[0].count}`,
      );

      // Check if the course_quizzes_rels table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
        ) AS exists
      `);

      if (tableExists.rows[0].exists) {
        // Check if the field column exists
        const fieldColumnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = 'course_quizzes_rels'
            AND column_name = 'field'
          ) AS exists
        `);

        if (fieldColumnExists.rows[0].exists) {
          // Check relationship entries in course_quizzes_rels
          const quizQuestionRelationships = await client.query(`
            SELECT COUNT(*) FROM payload.course_quizzes_rels 
            WHERE field = 'questions'
          `);

          console.log(
            `Quiz-Question relationships in course_quizzes_rels: ${quizQuestionRelationships.rows[0].count}`,
          );
        } else {
          console.log(
            `Field column does not exist in course_quizzes_rels table, skipping relationship check`,
          );
        }
      } else {
        console.log(
          `course_quizzes_rels table does not exist, skipping relationship check`,
        );
      }

      // Verify specific examples
      console.log('\nVerifying specific examples...');

      // Get a sample lesson with a quiz
      const sampleLesson = await client.query(`
        SELECT id, title, quiz_id, quiz_id_id FROM payload.course_lessons 
        WHERE quiz_id IS NOT NULL 
        LIMIT 1
      `);

      if (sampleLesson.rows.length > 0) {
        const lesson = sampleLesson.rows[0];
        console.log(`Sample lesson: ${lesson.title}`);
        console.log(`  quiz_id: ${lesson.quiz_id}`);
        console.log(`  quiz_id_id: ${lesson.quiz_id_id}`);

        // Check if the relationship entry exists
        const lessonRel = await client.query(
          `
          SELECT * FROM payload.course_lessons_rels 
          WHERE _parent_id = $1 AND field = 'quiz_id_id'
        `,
          [lesson.id],
        );

        if (lessonRel.rows.length > 0) {
          console.log(`  Relationship entry exists in course_lessons_rels`);
        } else {
          console.log(
            `  WARNING: No relationship entry in course_lessons_rels`,
          );
        }
      } else {
        console.log(`No lessons with quizzes found`);
      }

      // Get a sample quiz with questions
      const sampleQuiz = await client.query(`
        SELECT q.id, q.title, COUNT(qq.id) as question_count 
        FROM payload.course_quizzes q
        JOIN payload.quiz_questions qq ON qq.quiz_id = q.id
        GROUP BY q.id, q.title
        LIMIT 1
      `);

      if (sampleQuiz.rows.length > 0) {
        const quiz = sampleQuiz.rows[0];
        console.log(`Sample quiz: ${quiz.title}`);
        console.log(`  Question count: ${quiz.question_count}`);

        // Check if the course_quizzes_rels table exists
        if (tableExists.rows[0].exists) {
          // Check if the field column exists
          const sampleFieldColumnExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'payload' 
              AND table_name = 'course_quizzes_rels'
              AND column_name = 'field'
            ) AS exists
          `);

          if (sampleFieldColumnExists.rows[0].exists) {
            // Check if the relationship entries exist
            const quizRels = await client.query(
              `
              SELECT COUNT(*) FROM payload.course_quizzes_rels 
              WHERE _parent_id = $1 AND field = 'questions'
            `,
              [quiz.id],
            );

            console.log(
              `  Relationship entries in course_quizzes_rels: ${quizRels.rows[0].count}`,
            );

            if (
              parseInt(quizRels.rows[0].count) !== parseInt(quiz.question_count)
            ) {
              console.log(
                `  WARNING: Mismatch between question count and relationship entries`,
              );
            }
          } else {
            console.log(
              `  Field column does not exist in course_quizzes_rels table, skipping relationship check`,
            );
          }
        } else {
          console.log(
            `  course_quizzes_rels table does not exist, skipping relationship check`,
          );
        }
      } else {
        console.log(`No quizzes with questions found`);
      }

      console.log('\nVerification complete!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
verifyRelationships().catch((error) => {
  console.error('Failed to verify relationships:', error);
  process.exit(1);
});
