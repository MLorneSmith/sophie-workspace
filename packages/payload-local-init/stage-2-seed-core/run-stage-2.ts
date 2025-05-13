// run-stage-2.ts
// Central orchestrator for Stage 2: Core Content Seeding

import type { Payload } from 'payload';
import { getPayload } from 'payload';

// Import Payload config
import config from '../../../apps/payload/src/payload.config.js';

// // Import individual seeder functions

async function runAllStage2Seeders() {
  console.log('--- run-stage-2.ts: getPayload call test ---');
  let payload: Payload | null = null;
  // const allIdMaps: Record<string, any> = {}; // Object to hold all collected ID maps

  try {
    console.log(
      'Starting Stage 2: Seed Core Content (Orchestrated) - getPayload call test',
    );
    console.log(
      'Attempting to initialize Payload for Stage 2 orchestration...',
    );
    console.log('[RUN-STAGE-2] About to initialize Payload (call getPayload)...'); // Added log
    console.log('[RUN-STAGE-2] Adding small delay before getPayload...'); // Added log for delay
    await new Promise(resolve => setTimeout(resolve, 100)); // Added small delay
    console.log('[RUN-STAGE-2] Delay finished. Calling getPayload...'); // Added log after delay
    payload = await getPayload({ config });
    console.log('[RUN-STAGE-2] Payload initialized successfully.'); // Modified log

    // // Set environment variable to disable nestedDocsPlugin for Stage 2
    // process.env.DISABLE_NESTED_DOCS_PLUGIN = 'true';

    // // --- Execute Seeders Sequentially ---
    // // Call the refactored individual seeder functions
    // console.log('Running seedCourses...');
    // await seedCourses(payload);
    // console.log('seedCourses finished.');

    // console.log('Running seedCourseLessons...');
    // await seedCourseLessons(payload);
    // console.log('seedCourseLessons finished.');

    // console.log('Running seedQuizQuestions...');
    // const questionMap = await seedQuizQuestions(payload);
    // allIdMaps.quizQuestions = questionMap;
    // console.log('seedQuizQuestions finished.');

    // console.log('Running seedCourseQuizzes...');
    // await seedCourseQuizzes(payload); // This one might need the questionMap, but currently doesn't use it
    // console.log('seedCourseQuizzes finished.');

    // console.log('Running seedSurveys...');
    // await seedSurveys(payload);
    // console.log('seedSurveys finished.');

    // console.log('Running seedDownloads...');
    // await seedDownloads(payload);
    // console.log('seedDownloads finished.');

    // console.log('Running seedMedia...');
    // await seedMedia(payload);
    // console.log('seedMedia finished.');

    // console.log('Running seedPosts...');
    // await seedPosts(payload);
    // console.log('seedPosts finished.');

    // // Temporarily skip seeding private collection due to persistent TypeScript error
    // console.log('Running seedPrivate...');
    // await seedPrivate(payload);
    // console.log('seedPrivate finished.');

    // console.log('Running seedSurveyQuestions...');
    // await seedSurveyQuestions(payload); // This one might need survey map, but currently doesn't use it
    // console.log('seedSurveyQuestions finished.');

    // console.log('Running seedDocumentation...');
    // await seedDocumentation(payload);
    // console.log('seedDocumentation finished.');

    // console.log('All individual seeders executed.');

    console.log(
      'Stage 2: Seed Core Content (Orchestrated) completed (Payload/getPayload imports uncommented test).',
    );

    // Output the collected ID maps as JSON to standard output
    // console.log(JSON.stringify(allIdMaps));
    console.log(
      JSON.stringify({ test: 'Payload/getPayload imports uncommented test output' }),
    ); // Output a simple JSON
  } catch (error: any) {
    console.error(
      'Error during Stage 2 Orchestration (Payload/getPayload imports uncommented test):',
      error.message,
      error.stack,
    );
    // Unset environment variable on error
    // process.env.DISABLE_NESTED_DOCS_PLUGIN = undefined;
    throw error; // Re-throw to be caught by the PowerShell script
  } finally {
    // Unset environment variable regardless of success/failure
    // process.env.DISABLE_NESTED_DOCS_PLUGIN = undefined;
    console.log(
      '[Shutdown Debug] Entering simplified finally block (Payload/getPayload imports uncommented test).',
    );
    console.log('Stage 2 Orchestration process finished (Payload/getPayload imports uncommented test).');
    console.log(
      '[Shutdown Debug] Allowing process to exit naturally (Payload/getPayload imports uncommented test).',
    );
    // Allow process to exit naturally based on success/failure
  }
}

// Execute the orchestrator function
runAllStage2Seeders().catch((err) => {
  console.error(
    'Stage 2 Orchestration script execution failed (Payload/getPayload imports uncommented test):',
    err,
  );
  process.exit(1); // Exit with error code
});
