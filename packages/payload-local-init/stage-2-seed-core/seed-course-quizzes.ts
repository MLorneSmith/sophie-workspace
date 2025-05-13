// packages/payload-local-init/stage-2-seed-core/seed-course-quizzes.ts
// Script for Stage 2: Core Content Seeding - Course Quizzes
import type { Payload } from 'payload';
import { v4 as uuidv4 } from 'uuid';

// Import Payload config
// Corrected relative paths and imports for SSoT and types
import { QUIZZES as SSOT_QUIZZES } from '../data/quizzes-quiz-questions-truth.js';

console.log('Starting Stage 2: Seed Course Quizzes...');

export async function seedCourseQuizzes(
  payload: Payload,
): Promise<Record<string, string>> {
  const quizIdMap: Record<string, string> = {}; // Map SSOT ID to Payload Live ID

  try {
    console.log('Executing: Seed Course Quizzes (via orchestrator)...');

    // Seed Course Quizzes (Quiz documents themselves)
    console.log('Seeding Course Quizzes...');
    for (const quiz of Object.values(SSOT_QUIZZES)) {
      try {
        const existingQuiz = await payload.find({
          collection: 'course_quizzes',
          where: {
            slug: {
              equals: quiz.slug,
            },
          },
          limit: 1,
        });

        if (existingQuiz.docs.length === 0) {
          const liveQuizId = uuidv4(); // Generate a fresh UUID for the quiz document

          await payload.create({
            collection: 'course_quizzes',
            data: {
              id: liveQuizId, // Use the newly generated ID
              title: quiz.title,
              slug: quiz.slug, // Slug from SSOT is still used for lookup
              description: quiz.description,
              pass_threshold: quiz.passingScore,
              // 'questions' relationship will be populated in Stage 3
            },
          });
          console.log(
            `Created Course Quiz: ${quiz.title} (Slug: ${quiz.slug}, Live ID: ${liveQuizId}, Original SSOT ID was: ${quiz.id})`,
          );
          quizIdMap[quiz.id] = liveQuizId; // Add to map
        } else {
          const existingLiveId = existingQuiz.docs[0]?.id;
          console.log(
            `Course Quiz "${quiz.title}" (Slug: ${quiz.slug}) already exists with Live ID ${existingLiveId}. SSOT ID was: ${quiz.id}. Skipping creation.`,
          );
          if (existingLiveId) {
            quizIdMap[quiz.id] = existingLiveId; // Add existing ID to map
          } else {
            console.warn(
              `WARN: Existing quiz "${quiz.title}" (Slug: ${quiz.slug}) found but has no ID. Cannot add to map.`,
            );
          }
        }
      } catch (error: any) {
        console.error(
          `Error processing Course Quiz "${quiz.title}" (SSOT ID: ${quiz.id}):`,
          error.message,
          error.stack,
        );
      }
    }
    console.log('Course Quizzes seeding completed.');

    console.log('Seed Course Quizzes process finished.');
    return quizIdMap; // Return the generated map
  } catch (error: any) {
    console.error(
      'Error during Seed Course Quizzes process:',
      error.message,
      error.stack,
    );
    throw error; // Re-throw to be caught by the orchestrator
  }
}
