import type { Payload } from 'payload';
import { getPayload } from 'payload';

// Adjust path to be relative to this script's location in packages/payload-local-init/
import config from '../../apps/payload/src/payload.config';

async function testFindQuizQuestionBySlug() {
  console.log('Initializing Payload for test-find-quiz-question-by-slug...');
  const payload: Payload = await getPayload({ config });
  console.log('Payload initialized for test.');

  const uniqueSuffix = Date.now();
  const testSlug = `test-slug-for-quiz-question-${uniqueSuffix}`;
  const testQuestionText = `This is a test question for slug query ${uniqueSuffix}`;
  let createdQuestionId: string | undefined;

  try {
    console.log(`Attempting to create quiz_question with slug: ${testSlug}`);
    const createdQuestion = await payload.create({
      collection: 'quiz_questions',
      data: {
        question: testQuestionText,
        questionSlug: testSlug, // Field name as in collection config
        type: 'multiple_choice',
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false },
        ],
        explanation: 'Test explanation',
        order: 1,
      },
    });
    createdQuestionId = createdQuestion.id;
    console.log(
      `Created quiz_question with ID: ${createdQuestionId} and slug: ${testSlug}`,
    );

    console.log(`Attempting to find quiz_question by slug: ${testSlug}`);
    // Ensure the 'where' clause uses the database column name if different from field name,
    // but for 'text' fields with 'index: true', Payload usually allows querying by field name.
    // The error "path cannot be queried: question_slug" suggests it's looking for 'question_slug'.
    const findResult = await payload.find({
      collection: 'quiz_questions',
      where: {
        questionSlug: {
          // Using the camelCase field name from collection config
          equals: testSlug,
        },
      },
      limit: 1,
      depth: 0, // No need to populate relationships for this test
    });

    if (findResult.docs && findResult.docs.length > 0) {
      console.log(
        `SUCCESS: Found quiz_question by slug: ${testSlug}`,
        findResult.docs[0],
      );
    } else {
      console.error(
        `ERROR: Could NOT find quiz_question by slug: ${testSlug}. Docs count: ${findResult.docs?.length}`,
      );
    }
  } catch (error: any) {
    console.error(
      `ERROR during test-find-quiz-question-by-slug: ${error.message}`,
    );
    if (error.payloadErrors) {
      console.error(
        'Payload Errors:',
        JSON.stringify(error.payloadErrors, null, 2),
      );
    }
    // console.error(error); // Full stack trace if needed
  } finally {
    if (createdQuestionId) {
      try {
        console.log(
          `Cleaning up: Deleting test quiz_question with ID: ${createdQuestionId}`,
        );
        await payload.delete({
          collection: 'quiz_questions',
          id: createdQuestionId,
        });
        console.log(`Cleanup successful for ID: ${createdQuestionId}`);
      } catch (cleanupError: any) {
        console.error(`ERROR during cleanup: ${cleanupError.message}`);
      }
    }
    // No process.exit() here, let the calling script handle it or run manually
    console.log('Test script finished.');
  }
}

testFindQuizQuestionBySlug();
