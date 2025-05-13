import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';

// Import fileURLToPath

import PAYLOAD_CONFIG_PROMISE from '../../../apps/payload/src/payload.config';
import { QUIZZES } from '../data/quizzes-quiz-questions-truth';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function populateQuizQuestionRelationships(
  payload: Payload,
  ssotQuestionIdToLiveQuestionIdMap: Record<string, string>,
) {
  console.log('Populating Quiz <-> QuizQuestions relationships...');

  // Await the config promise
  await PAYLOAD_CONFIG_PROMISE;

  let successCount = 0;
  let errorCount = 0;

  // Iterate over the QUIZZES object from the source of truth
  for (const quizSsotId in QUIZZES) {
    const quizDefinition = QUIZZES[quizSsotId];

    // Check if quizDefinition is defined
    if (!quizDefinition) {
      console.warn(
        `[POPULATE Diag] Quiz definition not found for SSOT ID: ${quizSsotId}. Skipping.`,
      );
      errorCount++;
      continue;
    }

    const { slug: quizSlug, questionIds: ssotQuestionIds } = quizDefinition;

    console.log(
      `[POPULATE Diag] Processing Quiz "${quizSlug}" (SSOT ID: ${quizSsotId})...`,
    );

    try {
      // Find the parent quiz document by slug
      const quizQuery = await payload.find({
        collection: 'course_quizzes',
        where: {
          slug: { equals: quizSlug },
        },
        limit: 1,
      });

      if (quizQuery.docs.length === 0) {
        console.warn(
          `[POPULATE Diag] Quiz with slug "${quizSlug}" not found in Payload. Skipping relation population for this quiz.`,
        );
        errorCount++;
        continue;
      }

      const quizDoc = quizQuery.docs[0];
      const liveQuizId = quizDoc?.id; // Use optional chaining just in case

      if (!liveQuizId) {
        console.warn(
          `[POPULATE Diag] Could not get live ID for Quiz "${quizSlug}" (SSOT ID: ${quizSsotId}) after finding document. Skipping.`,
        );
        errorCount++;
        continue;
      }

      console.log(
        `[POPULATE Diag] Found Quiz "${quizSlug}" (Live ID: ${liveQuizId}).`,
      );

      const foundQuestionIds: string[] = [];

      // Find related question documents by slug
      for (const questionSsotId of ssotQuestionIds) {
        // We need to get the question slug from the ALL_QUIZ_QUESTIONS source of truth
        // This requires importing ALL_QUIZ_QUESTIONS or getting the slug from QUIZZES if available there
        // Based on quizzes-quiz-questions-truth.ts, questionIds in QUIZZES are SSOT IDs, not slugs.
        // We need to look up the slug from ALL_QUIZ_QUESTIONS using the SSOT ID.

        // Assuming ALL_QUIZ_QUESTIONS is imported or accessible
        // import { ALL_QUIZ_QUESTIONS } from '../data/quizzes-quiz-questions-truth';
        // const questionDefinition = ALL_QUIZ_QUESTIONS[questionSsotId];
        // if (!questionDefinition) {
        //   console.warn(`[POPULATE Diag] Question SSOT ID "${questionSsotId}" not found in ALL_QUIZ_QUESTIONS source of truth. Skipping.`);
        //   continue;
        // }
        // const questionSlug = questionDefinition.questionSlug;

        // Use the map to get the Payload ID for the SSOT question ID
        const liveQuestionId =
          ssotQuestionIdToLiveQuestionIdMap[questionSsotId];

        if (!liveQuestionId) {
          console.warn(
            `[POPULATE Diag] Payload ID not found in map for SSOT Question ID "${questionSsotId}". Skipping relation for this question.`,
          );
          errorCount++; // Count missing map entries as errors
          continue;
        }

        try {
          // Find the question document by its Payload ID (UUID)
          const questionQuery = await payload.find({
            collection: 'quiz_questions',
            where: {
              id: { equals: liveQuestionId }, // Find by the correct Payload ID (UUID)
            },
            limit: 1,
            depth: 0, // Only need the ID
          });

          if (questionQuery.docs.length > 0) {
            // Use non-null assertion as we know docs[0] exists here
            foundQuestionIds.push(questionQuery.docs[0]!.id);
            // console.log(`[POPULATE Diag] Found Question (Live ID: ${questionQuery.docs[0]!.id}) for SSOT ID "${questionSsotId}".`);
          } else {
            // This case should ideally not happen if the map is correct and Stage 2 succeeded fully
            console.warn(
              `[POPULATE Diag] Question with Payload ID "${liveQuestionId}" (SSOT ID: "${questionSsotId}") not found in Payload despite being in the map. Skipping relation for this question.`,
            );
            errorCount++; // Count missing questions as errors
          }
        } catch (e: any) {
          console.error(
            `[POPULATE Diag] Error finding Question with Payload ID "${liveQuestionId}" (SSOT ID: "${questionSsotId}"):`,
            e.message,
          );
          errorCount++;
        }
      }

      if (foundQuestionIds.length === 0 && ssotQuestionIds.length > 0) {
        console.warn(
          `[POPULATE Diag] No questions found in Payload for Quiz "${quizSlug}" (SSOT ID: ${quizSsotId}) despite having ${ssotQuestionIds.length} SSOT question IDs. Skipping update.`,
        );
        // errorCount++; // Already counted missing questions above
        continue;
      }

      if (foundQuestionIds.length > 0) {
        console.log(
          `[POPULATE Diag] About to update Quiz "${quizSlug}" (Live ID: ${liveQuizId}) with ${foundQuestionIds.length} question IDs: [${foundQuestionIds.join(',')}]`,
        );

        // Update the quiz document with the array of found question IDs
        await payload.update({
          collection: 'course_quizzes',
          id: liveQuizId,
          data: {
            questions: foundQuestionIds, // Array of related question IDs
          },
          depth: 0, // No need for response depth
        });

        console.log(
          `[POPULATE Diag] Successfully linked ${foundQuestionIds.length} questions to Quiz "${quizSlug}" (Live ID: ${liveQuizId}).`,
        );
        successCount++;
      } else {
        console.log(
          `[POPULATE Diag] No questions to link for Quiz "${quizSlug}" (SSOT ID: ${quizSsotId}). Skipping update.`,
        );
        // Don't count as error if ssotQuestionIds was also empty
        if (ssotQuestionIds.length > 0) {
          // This case is covered by the warning/error inside the question loop
        }
      }
    } catch (error: any) {
      console.error(
        `Error processing Quiz "${quizSlug}" (SSOT ID: ${quizSsotId}):`,
        error.message,
        error.stack,
      );
      if (error.data?.errors) {
        console.error(
          'Payload validation errors:',
          JSON.stringify(error.data.errors, null, 2),
        );
      }
      errorCount++;
    }
  }

  console.log(
    `Quiz <-> QuizQuestions relationships population complete. Successful: ${successCount}, Failed: ${errorCount}.`,
  );
  if (errorCount > 0) {
    throw new Error(
      `populateQuizQuestionRelationships encountered ${errorCount} errors.`,
    );
  }
}
