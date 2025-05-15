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
    console.log(`[seedCourseQuizzes] Starting quiz loop. Found ${Object.values(SSOT_QUIZZES).length} quizzes in SSOT.`);
    let quizIndex = 0;
    for (const quiz of Object.values(SSOT_QUIZZES)) {
      quizIndex++;
      console.log(`[seedCourseQuizzes] Processing quiz ${quizIndex}/${Object.values(SSOT_QUIZZES).length}: "${quiz.title}" (SSOT ID: ${quiz.id}, Slug: ${quiz.slug})`);
      
      // Add runtime type check and logging for passingScore
      console.log(`[seedCourseQuizzes] Type of quiz.passingScore: ${typeof quiz.passingScore}, Value: ${quiz.passingScore}`);

      try {
        console.log(`[seedCourseQuizzes] Checking if quiz with slug "${quiz.slug}" exists...`);
        console.log(`[seedCourseQuizzes] Calling payload.find for slug "${quiz.slug}"...`);
        const existingQuiz = await payload.find({
          collection: 'course_quizzes',
          where: {
            slug: {
              equals: quiz.slug,
            },
          },
          limit: 1,
        });
        console.log(`[seedCourseQuizzes] payload.find for slug "${quiz.slug}" completed. Found: ${existingQuiz.docs.length > 0}`);

        if (existingQuiz.docs.length === 0) {
          const liveQuizId = uuidv4(); // Generate a fresh UUID for the quiz document
          console.log(`[seedCourseQuizzes] Quiz with slug "${quiz.slug}" does not exist. Preparing to create with Live ID: ${liveQuizId}`);

          // Explicitly parse as integer with radix 10 and default to 70 if invalid
          const passingScoreNumber = parseInt(String(quiz.passingScore), 10);
          const finalPassingScore = isNaN(passingScoreNumber) ? 70 : passingScoreNumber;


          console.log(`[seedCourseQuizzes] Calling payload.create for slug "${quiz.slug}"...`);
          await payload.create({
            collection: 'course_quizzes',
            data: {
              id: liveQuizId, // Use the newly generated ID
              title: quiz.title,
              slug: quiz.slug, // Slug from SSOT is still used for lookup
              description: quiz.description,
              pass_threshold: finalPassingScore, // Use parsed and validated number
              // 'questions' relationship will be populated in Stage 3
            },
          });
          console.log(`[seedCourseQuizzes] payload.create for slug "${quiz.slug}" completed.`);
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
            quizIdMap[quiz.id] = String(existingLiveId); // Convert to string
          } else {
            console.warn(
              `WARN: Existing quiz "${quiz.title}" (Slug: ${quiz.slug}) found but has no ID. Cannot add to map.`,
            );
          }
        }
        console.log(`[seedCourseQuizzes] Finished processing quiz: "${quiz.title}"`);
        
        // Add a small delay after processing each quiz
        console.log(`[seedCourseQuizzes] Adding 1000ms delay...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[seedCourseQuizzes] Delay finished.`);

      } catch (error: any) {
        console.error(
          `[seedCourseQuizzes] Error processing Course Quiz "${quiz.title}" (SSOT ID: ${quiz.id}):`,
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
