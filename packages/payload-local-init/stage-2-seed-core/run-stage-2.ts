// run-stage-2.ts
// Central orchestrator for Stage 2: Core Content Seeding

import type { Payload } from 'payload';
import { getPayload } from 'payload';

// Import Payload seeding config
import config from '../../../apps/payload/src/payload.seeding.config';

// Import individual seeder functions
import { seedCourses } from './seed-courses';
import { seedCourseLessons } from './seed-course-lessons';
import { seedCourseQuizzes } from './seed-course-quizzes';
import { seedQuizQuestions } from './seed-quiz-questions';
import { seedDocumentation } from './seed-documentation';
import { seedPosts } from './seed-posts';
import { seedPrivate } from './seed-private';
import { seedDownloads } from './seed-downloads';
import { seedMedia } from './seed-media';
import { seedSurveys } from './seed-surveys';
import { seedSurveyQuestions } from './seed-survey-questions';


async function runAllStage2Seeders() {
  console.log('--- run-stage-2.ts: Starting Stage 2 Seeders ---');
  let payload: Payload | null = null;
  const allIdMaps: Record<string, any> = {}; // Object to hold all collected ID maps

  try {
    console.log(
      'Starting Stage 2: Seed Core Content (Orchestrated)...',
    );
    console.log(
      'Attempting to initialize Payload for Stage 2 orchestration...',
    );

    // Add log before getPayload
    console.log('[RUN-STAGE-2-DEBUG] Before getPayload call.');
    console.log(`[RUN-STAGE-2-DEBUG] PAYLOAD_CONFIG_PATH: ${process.env.PAYLOAD_CONFIG_PATH}`); // Check env var
    console.log(`[RUN-STAGE-2-DEBUG] DATABASE_URI: ${process.env.DATABASE_URI ? 'Set' : 'Not Set'}`); // Check env var

    console.log('[RUN-STAGE-2] About to initialize Payload (call getPayload)...');
    console.log('[RUN-STAGE-2] Adding small delay before getPayload...');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[RUN-STAGE-2] Delay finished. Calling getPayload...');
    payload = await getPayload({ config });

    // Add log after successful getPayload
    console.log('[RUN-STAGE-2-DEBUG] Payload initialized successfully.');
    console.log('[RUN-STAGE-2] Payload initialized successfully.'); // Keep original log for comparison


    // Set environment variable to disable nestedDocsPlugin for Stage 2
    process.env.DISABLE_NESTED_DOCS_PLUGIN = 'true';
    console.log('[RUN-STAGE-2-DEBUG] DISABLE_NESTED_DOCS_PLUGIN set to true.');


    // --- Execute Seeders Sequentially ---
    // Call the individual seeder functions
    // --- Execute Seeders Sequentially ---
    // Call the individual seeder functions
    // console.log('[RUN-STAGE-2-DEBUG] Running seedCourses...'); // Add log before seeder
    // console.log('[RUN-STAGE-2] Running seedCourses...'); // Keep original log for comparison
    // const coursesMap = await seedCourses(payload);
    // allIdMaps.courses = coursesMap;
    // console.log('[RUN-STAGE-2] seedCourses finished.');

    // console.log('[RUN-STAGE-2] Running seedCourseLessons...');
    // const lessonsMap = await seedCourseLessons(payload);
    // allIdMaps.lessons = lessonsMap;
    // console.log('[RUN-STAGE-2] seedCourseLessons finished.');

    // console.log('[RUN-STAGE-2] Running seedQuizQuestions...');
    // const questionMap = await seedQuizQuestions(payload);
    // allIdMaps.quizQuestions = questionMap;
    // console.log('[RUN-STAGE-2] seedQuizQuestions finished.');

    // console.log('[RUN-STAGE-2] Running seedCourseQuizzes...');
    // const quizzesMap = await seedCourseQuizzes(payload);
    // allIdMaps.quizzes = quizzesMap;
    // console.log('[RUN-STAGE-2] seedCourseQuizzes finished.');

    // console.log('[RUN-STAGE-2] Running seedSurveys...');
    // const surveysMap = await seedSurveys(payload);
    // allIdMaps.surveys = surveysMap;
    // console.log('[RUN-STAGE-2] seedSurveys finished.');

    // console.log('[RUN-STAGE-2] Running seedDownloads...');
    // const downloadsMap = await seedDownloads(payload);
    // allIdMaps.downloads = downloadsMap;
    // console.log('[RUN-STAGE-2] seedDownloads finished.');

    console.log('[RUN-STAGE-2] Running seedMedia...');
    const mediaMap = await seedMedia(payload);
    allIdMaps.media = mediaMap;
    console.log('[RUN-STAGE-2] seedMedia finished.');

    // console.log('[RUN-STAGE-2] Running seedPosts...');
    // const postsMap = await seedPosts(payload);
    // allIdMaps.posts = postsMap;
    // console.log('[RUN-STAGE-2] seedPosts finished.');

    // Temporarily skip seeding private collection due to persistent TypeScript error
    // console.log('[RUN-STAGE-2] Running seedPrivate...');
    // const privateMap = await seedPrivate(payload);
    // allIdMaps.private = privateMap;
    // console.log('[RUN-STAGE-2] seedPrivate finished.');

    // console.log('[RUN-STAGE-2] Running seedSurveyQuestions...');
    // const surveyQuestionsMap = await seedSurveyQuestions(payload);
    // allIdMaps.surveyQuestions = surveyQuestionsMap;
    // console.log('[RUN-STAGE-2] seedSurveyQuestions finished.');

    // console.log('[RUN-STAGE-2] Running seedDocumentation...');
    // const documentationMap = await seedDocumentation(payload);
    // allIdMaps.documentation = documentationMap;
    // console.log('[RUN-STAGE-2] seedDocumentation finished.');


    console.log('Only seedMedia executed for this test.');

    console.log(
      'Stage 2: Seed Core Content (Orchestrated) completed.',
    );

    // Output the collected ID maps as JSON to standard output
    console.log(JSON.stringify(allIdMaps, null, 2));

  } catch (error: any) {
    console.error(
      'Error during Stage 2 Orchestration:',
      error.message,
      error.stack,
    );
    // Unset environment variable on error
    process.env.DISABLE_NESTED_DOCS_PLUGIN = undefined;
    throw error; // Re-throw to be caught by the PowerShell script
  } finally {
    // Unset environment variable regardless of success/failure
    process.env.DISABLE_NESTED_DOCS_PLUGIN = undefined;
    console.log(
      '[Shutdown Debug] Entering simplified finally block.',
    );
    console.log('Stage 2 Orchestration process finished.');
    console.log(
      '[Shutdown Debug] Allowing process to exit naturally.',
    );
    // Allow process to exit naturally based on success/failure
  }
}

// Execute the orchestrator function
runAllStage2Seeders().catch((err) => {
  console.error(
    'Stage 2 Orchestration script execution failed:',
    err,
  );
  // Removed file-based error logging logic

  process.exit(1); // Exit with error code
});
