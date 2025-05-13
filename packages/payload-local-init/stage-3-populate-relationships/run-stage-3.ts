import type { Payload } from 'payload';
import { getPayload } from 'payload';

import config from '../../../apps/payload/src/payload.config.js';
// Assuming default config path

import { populateCourseLessonRelationships } from './populate-course-lesson-relationships';
import { populateDocumentationHierarchy } from './populate-documentation-hierarchy';
import { populateLessonDownloadRelationships } from './populate-lesson-download-relationships';
import { populateLessonQuizRelationships } from './populate-lesson-quiz-relationships';
import { populatePostImageRelationships } from './populate-post-image-relationships';
import { populateQuizQuestionRelationships } from './populate-quiz-question-relationships';
import { populateSurveyQuestionRelationships } from './populate-survey-question-relationships';

async function runStage3() {
  console.log('--- Starting Stage 3: Populate Relationships ---');
  let payload: Payload | null = null;

  try {
    console.log('Initializing Payload for Stage 3...');
    payload = await getPayload({ config });
    console.log('Payload initialized for Stage 3.');

    // Read and parse the SSOT Question ID map from environment variable
    const ssotQuestionIdMapJson = process.env.SSOT_QUESTION_ID_MAP;
    let ssotQuestionIdToLiveQuestionIdMap: Record<string, string> = {};

    if (ssotQuestionIdMapJson) {
      try {
        ssotQuestionIdToLiveQuestionIdMap = JSON.parse(ssotQuestionIdMapJson);
        console.log(
          'Successfully parsed SSOT_QUESTION_ID_MAP from environment.',
        );
      } catch (parseError: any) {
        console.error(
          `Error parsing SSOT_QUESTION_ID_MAP JSON: ${parseError.message}`,
        );
        // Decide whether to throw or continue with an empty map
        // For now, we'll log and continue, but relationships will fail
      }
    } else {
      console.warn(
        'SSOT_QUESTION_ID_MAP environment variable not found. Quiz Question relationships will not be populated correctly.',
      );
    }

    console.log('Attempting to run populateCourseLessonRelationships...');
    await populateCourseLessonRelationships(payload);
    console.log('Finished populateCourseLessonRelationships.');

    console.log('Attempting to run populateLessonQuizRelationships...');
    await populateLessonQuizRelationships(payload);
    console.log('Finished populateLessonQuizRelationships.');

    console.log('Attempting to run populateQuizQuestionRelationships...');
    // Pass the parsed map to the function
    await populateQuizQuestionRelationships(
      payload,
      ssotQuestionIdToLiveQuestionIdMap,
    );
    console.log('Finished populateQuizQuestionRelationships.');

    console.log('Attempting to run populateLessonDownloadRelationships...');
    await populateLessonDownloadRelationships(payload);
    console.log('Finished populateLessonDownloadRelationships.');

    console.log('Attempting to run populateSurveyQuestionRelationships...');
    await populateSurveyQuestionRelationships(payload);
    console.log('Finished populateSurveyQuestionRelationships.');

    console.log('Attempting to run populatePostImageRelationships...');
    await populatePostImageRelationships(payload);
    console.log('Finished populatePostImageRelationships.');

    console.log('Attempting to run populateDocumentationHierarchy...');
    await populateDocumentationHierarchy(payload);
    console.log('Finished populateDocumentationHierarchy.');

    console.log(
      '--- Stage 3: Populate Relationships Completed Successfully ---',
    );
    process.exit(0); // Ensure clean exit, will bypass finally's hang
  } catch (error) {
    console.error('--- Stage 3: Populate Relationships Failed ---');
    console.error(error);
    process.exit(1); // Exit with error code
  } finally {
    console.log('[FINALLY DEBUG run-stage-3] Entering finally block.');
    if (payload) {
      console.log(
        '[FINALLY DEBUG run-stage-3] Payload object exists in finally.',
      );
      try {
        const drizzleDbInstance = (payload.db as any)?.drizzle;
        console.log(
          '[FINALLY DEBUG run-stage-3] Inspecting drizzleDbInstance:',
          Object.keys(drizzleDbInstance || {}),
        );
        if (drizzleDbInstance) {
          console.log(
            '[FINALLY DEBUG run-stage-3] typeof drizzleDbInstance.$client?.end:',
            typeof drizzleDbInstance.$client?.end,
          );
          console.log(
            '[FINALLY DEBUG run-stage-3] typeof drizzleDbInstance.end:',
            typeof drizzleDbInstance.end,
          );
        }

        if (
          drizzleDbInstance &&
          typeof drizzleDbInstance.$client?.end === 'function'
        ) {
          console.log(
            '[FINALLY DEBUG run-stage-3] Attempting to call drizzleDbInstance.$client.end()',
          );
          await drizzleDbInstance.$client.end();
          console.log(
            '[FINALLY DEBUG run-stage-3] Call to drizzleDbInstance.$client.end() completed.',
          );
          console.log(
            '[run-stage-3] Underlying node-postgres client/pool closed via Drizzle $client.',
          );
        } else if (
          drizzleDbInstance &&
          typeof drizzleDbInstance.end === 'function'
        ) {
          console.log(
            '[FINALLY DEBUG run-stage-3] Attempting to call drizzleDbInstance.end()',
          );
          await drizzleDbInstance.end({ timeout: 5 });
          console.log(
            '[FINALLY DEBUG run-stage-3] Call to drizzleDbInstance.end() completed.',
          );
          console.log(
            '[run-stage-3] Underlying Drizzle instance (postgres.js client) ended.',
          );
        } else {
          console.warn(
            '[run-stage-3] Could not find a recognized method ($client.end or .end) to close database connection. Process might not exit cleanly if not for process.exit().',
          );
        }
      } catch (dbCloseError: any) {
        console.error(
          `[run-stage-3] Error closing database connection: ${dbCloseError.message}`,
        );
      }
      console.log('[run-stage-3] Script finished.');
    } else {
      console.log(
        '[FINALLY DEBUG run-stage-3] Payload object is null in finally.',
      );
    }
    console.log('[FINALLY DEBUG run-stage-3] Exiting finally block.');
  }
}

runStage3();
