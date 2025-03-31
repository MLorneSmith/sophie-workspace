/**
 * Script to migrate quiz questions directly to the database
 */
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
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

      // Path to the course quizzes files
      const quizzesDir = path.resolve(
        __dirname,
        '../../../../apps/payload/data/courses/quizzes',
      );
      console.log(`Course quizzes directory: ${quizzesDir}`);

      // Get all quizzes from the database
      const quizzesResult = await client.query(
        'SELECT id, slug FROM payload.course_quizzes',
      );

      // Create a map of quiz slugs to IDs
      const quizIdMap = new Map();
      for (const quiz of quizzesResult.rows) {
        quizIdMap.set(quiz.slug, quiz.id);
      }

      console.log(`Found ${quizIdMap.size} quizzes in the database.`);

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

          // Get the quiz ID
          const quizId = quizIdMap.get(slug);
          if (!quizId) {
            console.error(`Quiz ID not found for ${slug}. Skipping questions.`);
            continue;
          }

          // Process questions
          if (data.questions && Array.isArray(data.questions)) {
            console.log(
              `Processing ${data.questions.length} questions for quiz: ${slug}`,
            );

            for (let i = 0; i < data.questions.length; i++) {
              const q = data.questions[i];

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

              const questionId = questionResult.rows[0].id;
              console.log(`Created question with ID: ${questionId}`);

              // Insert options for the question
              if (options.length > 0) {
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
