import type { Payload } from 'payload';

import { LESSON_QUIZ_RELATIONS } from '../data/definitions/lesson-quiz-relations';

// Added Payload type import
// Corrected import path to definitions
// SSOT for Lesson <-> Quiz relationships
// Removed: import { getPayloadClient } from './payload-client';

export async function populateLessonQuizRelationships(payload: Payload) {
  // Added payload parameter
  // ADDED export
  console.log('Populating Lesson <-> Quiz relationships...');
  // Removed: const payloadClient = await getPayloadClient(true);

  let successCount = 0;
  let errorCount = 0;

  // Iterate over the array of lesson-quiz relationship objects
  for (const relation of LESSON_QUIZ_RELATIONS) {
    const { lessonSlug, quizSlug } = relation;

    console.log(
      `Processing relation: Lesson "${lessonSlug}" <-> Quiz "${quizSlug}"`,
    ); // Added progress output

    try {
      // 1. Find the lesson document by slug
      console.log(`   Finding lesson with slug: ${lessonSlug}...`); // ADDED
      const lessonResult = await payload.find({
        // Changed payloadClient to payload
        collection: 'course_lessons', // Use correct collection slug for CourseLessons
        where: { slug: { equals: lessonSlug } }, // Find by slug
        limit: 1,
      });
      console.log(
        `   Found lesson: ${lessonResult.docs?.[0]?.id ?? 'Not Found'}`,
      ); // ADDED

      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.warn(
          `Skipping relation: Could not find lesson with slug ${lessonSlug}`,
        );
        errorCount++;
        continue;
      }

      const lessonId = lessonResult.docs[0]!.id; // Add non-null assertion

      // 2. Find the quiz document by slug
      console.log(`   Finding quiz with slug: ${quizSlug}...`); // ADDED
      const quizResult = await payload.find({
        // Changed payloadClient to payload
        collection: 'course_quizzes', // Use correct collection slug for CourseQuizzes
        where: { slug: { equals: quizSlug } }, // Find by slug
        limit: 1,
      });
      console.log(`   Found quiz: ${quizResult.docs?.[0]?.id ?? 'Not Found'}`); // ADDED

      if (!quizResult.docs || quizResult.docs.length === 0) {
        console.warn(
          `Skipping relation: Could not find quiz with slug ${quizSlug}`,
        );
        errorCount++;
        continue;
      }

      const quizId = quizResult.docs[0]!.id; // Add non-null assertion

      // 3. Update the lesson document to link the quiz
      // Relationship field name in CourseLessons collection is 'quiz_id' (hasOne)
      console.log(`   Updating lesson ${lessonId} to link quiz ${quizId}...`); // ADDED
      await payload.update({
        // Changed payloadClient to payload
        collection: 'course_lessons', // Update the lesson document (use correct slug)
        id: lessonId,
        data: {
          quiz_id: quizId, // Use the correct relationship field name 'quiz_id'
        },
      });
      console.log(`   Update complete for lesson ${lessonId}.`); // ADDED

      console.log(`Linked Lesson (${lessonSlug}) to Quiz (${quizSlug})`);
      successCount++;
    } catch (error: any) {
      console.error(
        `Error linking Lesson (${lessonSlug}) to Quiz (${quizSlug}):`,
        error.message,
      );
      errorCount++;
    }
  }

  console.log(
    `Lesson <-> Quiz relationships population complete. Successful: ${successCount}, Failed: ${errorCount}.`,
  );
  if (errorCount > 0) {
    throw new Error(
      `populateLessonQuizRelationships encountered ${errorCount} errors.`,
    );
  }
}

// Removed direct execution block
// populateLessonQuizRelationships().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
