/**
 * Script to migrate quizzes from Payload data directory directly to the PostgreSQL database
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

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

/**
 * Migrates quizzes from Payload data directory directly to the PostgreSQL database
 */
async function migratePayloadQuizzesToDatabase() {
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

      // Path to the quizzes files
      const quizzesDir = path.resolve(
        __dirname,
        '../../../../apps/payload/data/quizzes',
      );
      console.log(`Quizzes directory: ${quizzesDir}`);

      // Load the quiz ID map if it exists
      const quizIdMapPath = path.resolve(__dirname, '../data/quiz-id-map.json');
      let quizIdMap: Record<string, string> = {};
      if (fs.existsSync(quizIdMapPath)) {
        quizIdMap = JSON.parse(fs.readFileSync(quizIdMapPath, 'utf8'));
        console.log(
          `Loaded ${Object.keys(quizIdMap).length} valid quizzes from quiz ID map file.`,
        );
      }

      // Get existing quizzes from the database
      const existingQuizzesResult = await client.query(
        `SELECT id, title, slug FROM payload.course_quizzes`,
      );
      const existingQuizzes = existingQuizzesResult.rows;

      // Read all .mdoc files
      const mdocFiles = fs
        .readdirSync(quizzesDir)
        .filter((file) => file.endsWith('.mdoc'))
        .map((file) => path.join(quizzesDir, file));

      console.log(`Found ${mdocFiles.length} quiz files to migrate.`);

      // Migrate each file to the database
      for (const file of mdocFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const { data } = matter(content);

          // Generate a slug from the file name
          const slug = path.basename(file, '.mdoc');

          // Check if this quiz already exists
          const existingQuiz = existingQuizzes.find(
            (q) => q.title === data.title,
          );
          let quizId;

          if (existingQuiz) {
            console.log(
              `Quiz already exists: ${data.title}. Using existing quiz.`,
            );
            quizId = existingQuiz.id;
          } else {
            // Create a new quiz
            quizId = uuidv4();
            await client.query(
              `INSERT INTO payload.course_quizzes (
                id, 
                title, 
                slug, 
                description, 
                passing_score, 
                updated_at, 
                created_at
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              [
                quizId,
                data.title || slug,
                slug,
                data.description || '',
                data.passingScore || 70,
              ],
            );

            console.log(`Migrated quiz: ${slug} with ID: ${quizId}`);
          }

          // Store the quiz ID in the map
          quizIdMap[slug] = quizId;

          // Process questions
          if (data.questions && Array.isArray(data.questions)) {
            console.log(
              `Processing ${data.questions.length} questions for quiz: ${slug}`,
            );

            for (let i = 0; i < data.questions.length; i++) {
              const q: {
                question: string;
                questiontype?: string;
                explanation?: string;
                answers?: Array<{
                  answer: string;
                  correct?: boolean;
                }>;
              } = data.questions[i];

              // Check if this question already exists
              const existingQuestionsResult = await client.query(
                `SELECT id FROM payload.quiz_questions 
                 WHERE quiz_id = $1 AND question = $2`,
                [quizId, q.question],
              );

              if (existingQuestionsResult.rows.length > 0) {
                console.log(
                  `Question already exists: ${q.question}. Skipping.`,
                );
                continue;
              }

              // Generate a unique ID for the question
              const questionId = uuidv4();

              // Create the question
              await client.query(
                `INSERT INTO payload.quiz_questions (
                  id, 
                  question, 
                  type, 
                  quiz_id, 
                  explanation, 
                  "order", 
                  updated_at, 
                  created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [
                  questionId,
                  q.question,
                  q.questiontype === 'multi-answer'
                    ? 'multiple_choice'
                    : 'multiple_choice',
                  quizId,
                  q.explanation || '',
                  i,
                ],
              );

              // Add options if they exist
              if (
                q.answers &&
                Array.isArray(q.answers) &&
                q.answers.length >= 2
              ) {
                console.log(
                  `Adding ${q.answers.length} options to the question`,
                );
                for (let j = 0; j < q.answers.length; j++) {
                  const option = q.answers[j];
                  if (option) {
                    const optionId = uuidv4();
                    await client.query(
                      `INSERT INTO payload.quiz_questions_options (
                        id, 
                        _parent_id, 
                        text, 
                        is_correct, 
                        _order, 
                        updated_at, 
                        created_at
                      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                      [
                        optionId,
                        questionId,
                        option.answer || 'No answer provided',
                        option.correct || false,
                        j,
                      ],
                    );
                  }
                }
              } else {
                // Add default options if none are provided or less than 2
                console.log(`Adding default options to the question`);
                const defaultOptions = [
                  { text: 'Option 1', isCorrect: false },
                  { text: 'Option 2', isCorrect: false },
                ];
                for (let j = 0; j < defaultOptions.length; j++) {
                  const option = defaultOptions[j];
                  if (option) {
                    const optionId = uuidv4();
                    await client.query(
                      `INSERT INTO payload.quiz_questions_options (
                        id, 
                        _parent_id, 
                        text, 
                        is_correct, 
                        _order, 
                        updated_at, 
                        created_at
                      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                      [optionId, questionId, option.text, option.isCorrect, j],
                    );
                  }
                }
              }

              console.log(`Migrated question ${i + 1} for quiz: ${slug}`);
            }
          }
        } catch (error) {
          console.error(`Error migrating ${file}:`, error);
        }
      }

      // Save the updated quiz ID map
      fs.writeFileSync(quizIdMapPath, JSON.stringify(quizIdMap, null, 2));

      console.log('Payload quizzes migration complete!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error migrating payload quizzes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migratePayloadQuizzesToDatabase().catch((error) => {
  console.error('Payload quizzes migration failed:', error);
  process.exit(1);
});
