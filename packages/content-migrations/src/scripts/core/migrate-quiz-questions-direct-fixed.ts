/**
 * Script to migrate quiz questions directly to the database
 * Fixed version with proper UUID handling and unique constraint support
 */
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.development') });

/**
 * Validates if a string is a valid UUID
 * @param str - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Migrates quiz questions directly to the database
 */
async function migrateQuizQuestionsToDatabase() {
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

      // Check if the unique constraint exists, if not, create it
      const constraintExists = await client.query(`
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'quiz_questions_quiz_id_question_unique' 
        AND conrelid = 'payload.quiz_questions'::regclass
      `);

      if (constraintExists.rows.length === 0) {
        console.log('Creating unique constraint on quiz_questions table...');
        await client.query(`
          ALTER TABLE payload.quiz_questions 
          ADD CONSTRAINT quiz_questions_quiz_id_question_unique 
          UNIQUE (quiz_id, question)
        `);
        console.log('Unique constraint created successfully');
      } else {
        console.log('Unique constraint already exists');
      }

      // Path to the course quizzes files
      const quizzesDir = path.resolve(
        __dirname,
        '../../../../../apps/payload/data/courses/quizzes',
      );
      console.log(`Course quizzes directory: ${quizzesDir}`);

      // Get all quizzes from the database
      const quizIdsResult = await client.query(
        'SELECT id, slug FROM payload.course_quizzes ORDER BY slug',
      );

      // Create a map of quiz slugs to IDs
      const quizIdMap = new Map();
      for (const quiz of quizIdsResult.rows) {
        quizIdMap.set(quiz.slug, quiz.id);
      }

      console.log(`Loaded ${quizIdMap.size} valid quizzes from database.`);

      console.log('Quizzes in database:');
      for (const quiz of quizIdsResult.rows) {
        console.log(`  ${quiz.slug}: ${quiz.id}`);
      }

      // Log the quiz ID map
      console.log('Quiz ID map:');
      for (const [slug, id] of quizIdMap.entries()) {
        console.log(`  ${slug}: ${id}`);
      }

      // Read all .mdoc files
      const mdocFiles = fs
        .readdirSync(quizzesDir)
        .filter((file) => file.endsWith('.mdoc'))
        .map((file) => path.join(quizzesDir, file));

      console.log(
        `Found ${mdocFiles.length} quiz files to process for questions.`,
      );

      // Migrate questions from each quiz file
      for (const file of mdocFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const { data } = matter(content);

          // Generate a slug from the file name
          const slug = path.basename(file, '.mdoc');

          // Get the quiz ID from the quiz ID map or from the database
          let quizId = quizIdMap.get(slug);
          if (!quizId) {
            // Try to get the quiz ID from the database
            const quizFromDb = quizIdsResult.rows.find((q) => q.slug === slug);
            if (!quizFromDb) {
              console.error(
                `Quiz not found in database for ${slug}. Skipping questions.`,
              );
              continue;
            }
            quizId = quizFromDb.id;
          }
          console.log(
            `Using quiz ID from database: ${quizId} for quiz: ${slug}`,
          );

          // Process questions
          if (data.questions && Array.isArray(data.questions)) {
            console.log(
              `Processing ${data.questions.length} questions for quiz: ${slug}`,
            );

            for (let i = 0; i < data.questions.length; i++) {
              const q = data.questions[i];

              // First check if the question already exists
              const existingQuestion = await client.query(
                `SELECT id FROM payload.quiz_questions WHERE quiz_id = $1 AND question = $2`,
                [quizId, q.question],
              );

              let questionId;
              if (existingQuestion.rows.length > 0) {
                questionId = existingQuestion.rows[0].id;
                console.log(`Question already exists with ID: ${questionId}`);
              } else {
                // Insert the question into the database
                const questionResult = await client.query(
                  `INSERT INTO payload.quiz_questions (id, question, quiz_id, type, explanation, "order", updated_at, created_at)
                   VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
                   RETURNING id`,
                  [
                    q.question,
                    quizId,
                    q.questiontype === 'multi-answer'
                      ? 'multiple_choice'
                      : 'multiple_choice',
                    q.explanation || '',
                    i,
                  ],
                );

                questionId = questionResult.rows[0].id;
                console.log(`Created question with ID: ${questionId}`);
              }

              // Prepare options array for the question
              const options = [];
              if (q.answers && Array.isArray(q.answers)) {
                for (let j = 0; j < q.answers.length; j++) {
                  const option = q.answers[j];
                  options.push({
                    text: option.answer,
                    isCorrect: option.correct || false,
                  });
                }
              }

              // Insert options for the question
              if (questionId && options.length > 0) {
                // First, delete any existing options for this question
                await client.query(
                  `DELETE FROM payload.quiz_questions_options WHERE _parent_id = $1`,
                  [questionId],
                );

                // Then insert the new options
                for (let j = 0; j < options.length; j++) {
                  const option = options[j];
                  if (option) {
                    await client.query(
                      `INSERT INTO payload.quiz_questions_options (id, _order, _parent_id, text, is_correct, updated_at, created_at)
                       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
                      [j, questionId, option.text, option.isCorrect],
                    );
                  }
                }
                console.log(`Added ${options.length} options to the question`);
              }

              console.log(`Migrated question ${i + 1} for quiz: ${slug}`);
            }
          }
        } catch (error) {
          console.error(`Error migrating questions for ${file}:`, error);
        }
      }

      console.log('Quiz questions migration complete!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateQuizQuestionsToDatabase().catch((error) => {
  console.error('Quiz questions migration failed:', error);
  process.exit(1);
});
