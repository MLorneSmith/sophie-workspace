/**
 * Script to migrate course quizzes directly to the database
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
 * Migrates course quizzes directly to the database
 */
async function migrateQuizzesToDatabase() {
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

      // Read all .mdoc files
      const mdocFiles = fs
        .readdirSync(quizzesDir)
        .filter((file) => file.endsWith('.mdoc'))
        .map((file) => path.join(quizzesDir, file));

      console.log(`Found ${mdocFiles.length} quiz files to migrate.`);

      // Store quiz IDs for later use in quiz questions migration
      const quizIdMap = new Map();

      // Migrate each file to the database
      for (const file of mdocFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const { data } = matter(content);

          // Generate a slug from the file name
          const slug = path.basename(file, '.mdoc');

          // Log the data we're trying to create
          console.log(`Creating quiz with data:`, {
            title: data.title || slug,
            slug: slug,
            description: data.description || '',
            passingScore: data.passingScore || 70,
          });

          // Insert the quiz into the database, skip if it already exists
          const result = await client.query(
            `INSERT INTO payload.course_quizzes (id, title, slug, description, passing_score, updated_at, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (slug) DO NOTHING
             RETURNING id, title, slug`,
            [
              data.title || slug,
              slug,
              data.description || '',
              data.passingScore || 70,
            ],
          );

          // If the quiz already exists, result.rows might be empty
          if (result.rows.length > 0) {
            const quiz = result.rows[0];
            // Store the quiz ID for later use
            quizIdMap.set(slug, quiz.id);
            console.log(`Migrated quiz: ${slug} with ID: ${quiz.id}`);
          } else {
            // Quiz already exists, get its ID from the database
            const existingQuiz = await client.query(
              `SELECT id FROM payload.course_quizzes WHERE slug = $1`,
              [slug],
            );

            if (existingQuiz.rows.length > 0) {
              const quizId = existingQuiz.rows[0].id;
              quizIdMap.set(slug, quizId);
              console.log(`Quiz already exists: ${slug} with ID: ${quizId}`);
            } else {
              console.log(`Could not find quiz with slug: ${slug}`);
            }
          }
        } catch (error) {
          console.error(`Error migrating ${file}:`, error);
        }
      }

      // Get all quizzes from the database to ensure we have the correct IDs
      const allQuizzes = await client.query(
        `SELECT id, slug FROM payload.course_quizzes ORDER BY slug`,
      );

      // Create a new map with the IDs from the database
      const updatedQuizIdMap = new Map();
      for (const quiz of allQuizzes.rows) {
        updatedQuizIdMap.set(quiz.slug, quiz.id);
      }

      // Save the quiz ID map to a file for use in the quiz questions migration
      const dataDir = path.resolve(__dirname, '../data');

      // Ensure the data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        path.resolve(dataDir, 'quiz-id-map.json'),
        JSON.stringify(Object.fromEntries(updatedQuizIdMap), null, 2),
      );

      console.log('Course quizzes migration complete!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateQuizzesToDatabase().catch((error) => {
  console.error('Course quizzes migration failed:', error);
  process.exit(1);
});
