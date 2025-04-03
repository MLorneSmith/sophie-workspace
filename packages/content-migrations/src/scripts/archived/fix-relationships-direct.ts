/**
 * Script to fix quiz relationships directly in the database
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
 * Fixes quiz relationships directly in the database
 */
async function fixRelationshipsDirect() {
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

      // 1. Fix missing slugs in course_quizzes
      console.log('Fixing missing slugs in course_quizzes...');

      // Get all quizzes without slugs
      const quizzesWithoutSlugs = await client.query(
        `SELECT id, title FROM payload.course_quizzes WHERE slug IS NULL OR slug = ''`,
      );

      console.log(
        `Found ${quizzesWithoutSlugs.rows.length} quizzes without slugs`,
      );

      // Update each quiz with a generated slug
      for (const quiz of quizzesWithoutSlugs.rows) {
        // Generate a slug from the title
        const slug = quiz.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Update the quiz with the slug
        await client.query(
          `UPDATE payload.course_quizzes SET slug = $1 WHERE id = $2`,
          [slug, quiz.id],
        );

        console.log(`Updated quiz ${quiz.id} with slug: ${slug}`);
      }

      // 2. Fix missing quiz_id in quiz_questions
      console.log('Fixing missing quiz_id in quiz_questions...');

      // Get all questions without quiz_id
      const questionsWithoutQuizId = await client.query(
        `SELECT id, question FROM payload.quiz_questions WHERE quiz_id IS NULL`,
      );

      console.log(
        `Found ${questionsWithoutQuizId.rows.length} questions without quiz_id`,
      );

      // Get all quizzes to create a map of quiz titles to IDs
      const quizzes = await client.query(
        `SELECT id, title, slug FROM payload.course_quizzes`,
      );

      // Create maps for matching
      const quizTitleToIdMap = new Map();
      const quizSlugToIdMap = new Map();

      for (const quiz of quizzes.rows) {
        quizTitleToIdMap.set(quiz.title.toLowerCase(), quiz.id);
        if (quiz.slug) {
          quizSlugToIdMap.set(quiz.slug.toLowerCase(), quiz.id);
        }
      }

      // Update each question with a matched quiz_id
      let fixedCount = 0;
      for (const question of questionsWithoutQuizId.rows) {
        // Try to find a matching quiz based on the question content
        let matchedQuizId = null;

        // Try matching by quiz title
        for (const [title, id] of quizTitleToIdMap.entries()) {
          // Extract keywords from the title
          const keywords = title
            .replace(/quiz$/i, '')
            .trim()
            .split(/\s+/)
            .filter((word: string) => word.length > 3); // Only consider words longer than 3 characters

          // Check if any keyword is in the question
          if (
            keywords.some((keyword: string) =>
              question.question.toLowerCase().includes(keyword),
            )
          ) {
            matchedQuizId = id;
            break;
          }
        }

        // If no match by title, try matching by slug
        if (!matchedQuizId) {
          for (const [slug, id] of quizSlugToIdMap.entries()) {
            // Extract keywords from the slug
            const keywords = slug
              .replace(/-/g, ' ')
              .split(/\s+/)
              .filter((word: string) => word.length > 3);

            // Check if any keyword is in the question
            if (
              keywords.some((keyword: string) =>
                question.question.toLowerCase().includes(keyword),
              )
            ) {
              matchedQuizId = id;
              break;
            }
          }
        }

        if (matchedQuizId) {
          // Update the question with the quiz_id
          await client.query(
            `UPDATE payload.quiz_questions SET quiz_id = $1 WHERE id = $2`,
            [matchedQuizId, question.id],
          );

          console.log(
            `Updated question ${question.id} with quiz_id: ${matchedQuizId}`,
          );
          fixedCount++;
        } else {
          console.log(
            `Could not find a matching quiz for question ${question.id}`,
          );
        }
      }

      console.log(`Fixed ${fixedCount} quiz questions`);

      // 3. Verify the fixes
      console.log('Verifying fixes...');

      const quizzesWithoutSlugsAfter = await client.query(
        `SELECT COUNT(*) FROM payload.course_quizzes WHERE slug IS NULL OR slug = ''`,
      );

      const questionsWithoutQuizIdAfter = await client.query(
        `SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NULL`,
      );

      console.log(
        `Quizzes without slugs after fix: ${quizzesWithoutSlugsAfter.rows[0].count}`,
      );
      console.log(
        `Questions without quiz_id after fix: ${questionsWithoutQuizIdAfter.rows[0].count}`,
      );

      console.log('Relationships fixed!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
fixRelationshipsDirect().catch((error) => {
  console.error('Failed to fix relationships:', error);
  process.exit(1);
});
