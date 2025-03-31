/**
 * Script to fix quiz relationships in Payload CMS
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Fixes quiz relationships in Payload CMS
 */
async function fixQuizRelationships() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  console.log('Fixing quiz relationships...');

  // Get all quizzes
  const quizzesResult = await payload.find({
    collection: 'course_quizzes',
    limit: 100,
  });

  console.log(`Found ${quizzesResult.docs.length} quizzes`);

  // Fix quizzes without slugs
  for (const quiz of quizzesResult.docs) {
    if (!quiz.slug) {
      console.log(
        `Quiz ${quiz.id} (${quiz.title}) is missing a slug. Fixing...`,
      );

      // Generate a slug from the title
      const slug = quiz.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Update the quiz with the slug
      await payload.update({
        collection: 'course_quizzes',
        id: quiz.id,
        data: {
          slug: slug,
        },
      });

      console.log(`Updated quiz ${quiz.id} with slug: ${slug}`);
    }
  }

  // Get all quiz questions
  const questionsResult = await payload.find({
    collection: 'quiz_questions',
    limit: 1000,
  });

  console.log(`Found ${questionsResult.docs.length} quiz questions`);

  // Get all quizzes from the database to create a map of quiz IDs
  const quizzes = await payload.find({
    collection: 'course_quizzes',
    limit: 100,
  });

  // Create a map of quiz titles to IDs
  const quizTitleToIdMap = new Map();
  for (const quiz of quizzes.docs) {
    quizTitleToIdMap.set(quiz.title, quiz.id);
  }

  // Fix questions without quiz_id
  let fixedCount = 0;
  for (const question of questionsResult.docs) {
    if (!question.quiz_id) {
      console.log(`Question ${question.id} is missing a quiz_id. Fixing...`);

      // Try to find a matching quiz based on the question content
      // This is a heuristic approach and may not work for all questions
      let matchedQuizId = null;

      // Loop through all quizzes and check if the question content matches
      for (const [title, id] of quizTitleToIdMap.entries()) {
        // Extract the quiz name from the title (e.g., "Basic Graphs Quiz" -> "basic-graphs")
        const quizName = title
          .toLowerCase()
          .replace(/\s+quiz$/i, '')
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Check if the question content contains the quiz name
        if (question.question.toLowerCase().includes(quizName)) {
          matchedQuizId = id;
          break;
        }
      }

      if (matchedQuizId) {
        // Update the question with the quiz_id
        await payload.update({
          collection: 'quiz_questions',
          id: question.id,
          data: {
            quiz_id: matchedQuizId,
          },
        });

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
  }

  console.log(`Fixed ${fixedCount} quiz questions`);
  console.log('Quiz relationships fixed!');
}

// Run the script
fixQuizRelationships().catch((error) => {
  console.error('Failed to fix quiz relationships:', error);
  process.exit(1);
});
