import path from 'path';
import type { Payload } from 'payload';

// Added Payload type import

// Removed: import { getPayloadClient } from './payload-client';

// Assuming there is only one course and all lessons belong to it.
// The course slug is defined in packages/payload-local-init/data/raw/courses/default-course.yaml
const courseSlug = 'decks-for-decision-makers';

export async function populateCourseLessonRelationships(payload: Payload) {
  // Added payload parameter
  // ADDED export
  console.log('Populating Course <-> CourseLessons relationships...');
  // Removed: const payloadClient = await getPayloadClient(true);
  let successCount = 0;
  let errorCount = 0;

  try {
    // 1. Find the single course document
    const courseResult = await payload.find({
      // Changed payloadClient to payload
      collection: 'courses', // Use actual collection slug for Courses
      where: { slug: { equals: courseSlug } }, // Find by slug
      limit: 1,
    });

    if (
      !courseResult.docs ||
      !Array.isArray(courseResult.docs) ||
      courseResult.docs.length === 0
    ) {
      console.error(`Error: Could not find course with slug ${courseSlug}.`);
      throw new Error(`Could not find course with slug ${courseSlug}.`); // Changed to throw error
    }

    const courseId = (courseResult.docs as any)[0].id;

    // 2. Find all lesson documents
    console.log('Attempting to find all lesson documents...'); // Added logging
    const lessonsResult = await payload.find({
      // Changed payloadClient to payload
      collection: 'course_lessons', // Use correct collection slug for CourseLessons
      limit: 1000, // Use a large limit to get all lessons
    });
    console.log(
      `Find lessons result: ${lessonsResult.docs.length} documents found.`,
    ); // Added logging

    if (!lessonsResult.docs || lessonsResult.docs.length === 0) {
      console.warn('No lessons found to link to the course.');
      // Continue, as it might be valid to have a course with no lessons initially
      return; // Exit the function if no lessons are found
    }

    // 3. Iterate through each lesson and link it to the course
    // Relationship field name in CourseLessons collection is 'course_id' (hasOne)
    for (const lesson of lessonsResult.docs) {
      try {
        await payload.update({
          // Changed payloadClient to payload
          collection: 'course_lessons', // Update the lesson document (use correct slug)
          id: lesson.id,
          data: {
            course_id: courseId, // Use the correct relationship field name 'course_id'
          },
        });
        successCount++;
      } catch (error: any) {
        console.error(
          `Error linking lesson ${lesson.slug || lesson.id} to Course (${courseSlug}):`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log(
      `Attempted to link ${lessonsResult.docs.length} lessons to Course (${courseSlug}). Successful: ${successCount}, Failed: ${errorCount}.`,
    );
  } catch (error: any) {
    console.error(
      'Error populating Course <-> CourseLessons relationships:',
      error,
    );
    throw error; // Re-throw error to be caught by run-stage-3.ts
  }

  console.log('Course <-> CourseLessons relationships populated successfully.');
  if (errorCount > 0) {
    throw new Error(
      `populateCourseLessonRelationships encountered ${errorCount} errors.`,
    );
  }
}

// Removed direct execution block
// populateCourseLessonRelationships().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
