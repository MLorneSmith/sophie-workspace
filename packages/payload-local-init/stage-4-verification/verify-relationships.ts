import type { Payload } from 'payload';

import { LESSON_QUIZ_RELATIONS } from '../data/definitions/lesson-quiz-relations.js';
import {
  DOWNLOAD_ID_MAP,
  LESSON_DOWNLOADS_MAPPING,
} from '../data/mappings/download-mappings.js';
// Corrected import path to SSoT data
import { QUIZZES as SSOT_QUIZZES } from '../data/quizzes-quiz-questions-truth.js';
import { getPayloadClient } from '../stage-3-populate-relationships/payload-client.js';

// Adjusted path

// TODO: Import SSOT for Course -> Lessons relationships
// TODO: Import SSOT for Survey -> SurveyQuestions relationships

async function verifyRelationships() {
  console.log('Starting Stage 4: Verify Relationships...');
  const payloadClient: Payload = await getPayloadClient(true);
  let totalErrors = 0;
  let totalSuccesses = 0;

  // --- 1. Verify Quiz -> QuizQuestions Relationships ---
  console.log('\nVerifying Quiz -> QuizQuestions relationships...');
  for (const ssotQuiz of Object.values(SSOT_QUIZZES)) {
    const quizId = ssotQuiz.id;
    // Ensure questionIds is an array and sort a copy for comparison
    const expectedQuestionIds =
      ssotQuiz.questionIds && Array.isArray(ssotQuiz.questionIds)
        ? [...ssotQuiz.questionIds].sort()
        : [];

    try {
      const quizDoc = await payloadClient.findByID({
        collection: 'course_quizzes',
        id: quizId,
        depth: 1, // Depth 1 to populate the 'questions' field with related documents
      });

      if (!quizDoc) {
        console.error(
          `ERROR: [CourseQuizzes ID: ${quizId}] Document not found.`,
        );
        totalErrors++;
        continue;
      }

      // Extract IDs from the populated questions array
      const actualQuestionIdsInJsonb =
        quizDoc.questions && Array.isArray(quizDoc.questions)
          ? quizDoc.questions
              .map((q: any) => q.id) // q should be the populated QuizQuestion document
              .filter((id) => id != null) // Filter out any null/undefined IDs
              .sort()
          : [];

      if (
        JSON.stringify(actualQuestionIdsInJsonb) !==
        JSON.stringify(expectedQuestionIds)
      ) {
        console.error(`ERROR: [CourseQuizzes ID: ${quizId}, Slug: ${ssotQuiz.slug}] JSONB 'questions' field mismatch.
          Expected (SSOT): ${JSON.stringify(expectedQuestionIds)}
          Actual (DB):     ${JSON.stringify(actualQuestionIdsInJsonb)}`);
        totalErrors++;
      } else {
        console.log(
          `OK: [CourseQuizzes ID: ${quizId}, Slug: ${ssotQuiz.slug}] 'questions' field matches SSOT.`,
        );
        totalSuccesses++;
      }
    } catch (err: any) {
      console.error(
        `ERROR: [CourseQuizzes ID: ${quizId}] Failed to verify relationships: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // --- 2. Verify Lesson -> Quiz Relationships ---
  console.log('\nVerifying Lesson -> Quiz relationships...');
  for (const lessonQuizRelation of LESSON_QUIZ_RELATIONS) {
    const lessonSlug = lessonQuizRelation.lessonSlug;
    const expectedQuizSlug = lessonQuizRelation.quizSlug;

    try {
      const lessonResult = await payloadClient.find({
        collection: 'course_lessons',
        where: { slug: { equals: lessonSlug } },
        limit: 1,
        depth: 1,
      });

      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Document not found.`,
        );
        totalErrors++;
        continue;
      }
      const lessonDoc = lessonResult.docs[0];
      if (!lessonDoc) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to retrieve document from find operation.`,
        );
        totalErrors++;
        continue;
      }
      const lessonId = lessonDoc.id;

      let expectedQuizId: string | null = null;
      if (expectedQuizSlug) {
        const ssotQuizForLesson = SSOT_QUIZZES[expectedQuizSlug];
        if (ssotQuizForLesson) {
          expectedQuizId = ssotQuizForLesson.id;
        } else {
          console.warn(
            `WARN: Expected quiz with slug '${expectedQuizSlug}' for lesson '${lessonSlug}' not found in SSOT_QUIZZES.`,
          );
        }
      }

      const actualQuizRelationship = lessonDoc.quiz_id;
      let actualQuizIdInJsonb: string | undefined | null = undefined;

      if (typeof actualQuizRelationship === 'string') {
        actualQuizIdInJsonb = actualQuizRelationship;
      } else if (
        actualQuizRelationship &&
        typeof actualQuizRelationship === 'object' &&
        actualQuizRelationship.hasOwnProperty('id') &&
        typeof (actualQuizRelationship as any).id === 'string'
      ) {
        actualQuizIdInJsonb = (actualQuizRelationship as { id: string }).id;
      } else if (actualQuizRelationship === null) {
        actualQuizIdInJsonb = null;
      }

      if (actualQuizIdInJsonb !== expectedQuizId) {
        console.error(`ERROR: [CourseLessons ID: ${lessonId}, Slug: ${lessonSlug}] JSONB 'quiz_id' field mismatch.
          Expected Quiz ID (for slug ${expectedQuizSlug}): ${expectedQuizId}
          Actual Quiz ID in lesson:   ${actualQuizIdInJsonb}`);
        totalErrors++;
      } else {
        if (
          expectedQuizId ||
          actualQuizIdInJsonb === null ||
          actualQuizIdInJsonb === undefined
        ) {
          console.log(
            `OK: [CourseLessons ID: ${lessonId}, Slug: ${lessonSlug}] 'quiz_id' field matches SSOT.`,
          );
          totalSuccesses++;
        }
      }
    } catch (err: any) {
      console.error(
        `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to verify quiz relationship: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // --- 3. Verify Lesson -> Downloads Relationships ---
  console.log('\nVerifying Lesson -> Downloads relationships...');
  for (const lessonSlug of Object.keys(LESSON_DOWNLOADS_MAPPING)) {
    const downloadKeys: string[] =
      LESSON_DOWNLOADS_MAPPING[
        lessonSlug as keyof typeof LESSON_DOWNLOADS_MAPPING
      ] || [];
    const expectedDownloadIds = downloadKeys
      .map((key) => DOWNLOAD_ID_MAP[key as keyof typeof DOWNLOAD_ID_MAP]?.id)
      .filter((id) => !!id)
      .sort();

    try {
      const lessonResult = await payloadClient.find({
        collection: 'course_lessons',
        where: { slug: { equals: lessonSlug } },
        limit: 1,
        depth: 1,
      });

      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] for downloads relation check: Document not found.`,
        );
        totalErrors++;
        continue;
      }
      const lessonDoc = lessonResult.docs[0];
      if (!lessonDoc) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to retrieve document from find operation for downloads.`,
        );
        totalErrors++;
        continue;
      }
      const lessonId = lessonDoc.id;

      const actualDownloadIdsInJsonb =
        lessonDoc.downloads && Array.isArray(lessonDoc.downloads)
          ? lessonDoc.downloads
              .map((d: any): string | null => {
                if (typeof d === 'string') {
                  return d; // It's already an ID string
                }
                if (typeof d === 'object' && d !== null && 'id' in d) {
                  // After the 'in' operator, TypeScript should know 'id' exists.
                  const idValue = d.id;
                  if (typeof idValue === 'string') {
                    return idValue; // Populated document with string ID
                  }
                }
                // If it's neither a string ID nor a valid object with a string id property
                console.warn(
                  `Unexpected item structure in lessonDoc.downloads: ${JSON.stringify(d)}`,
                );
                return null;
              })
              .filter((id) => id != null) // Filter out any null/undefined IDs
              .sort()
          : [];

      if (
        JSON.stringify(actualDownloadIdsInJsonb) !==
        JSON.stringify(expectedDownloadIds)
      ) {
        console.error(`ERROR: [CourseLessons ID: ${lessonId}, Slug: ${lessonSlug}] JSONB 'downloads' field mismatch.
              Expected: ${JSON.stringify(expectedDownloadIds)}
              Actual:   ${JSON.stringify(actualDownloadIdsInJsonb)}`);
        totalErrors++;
      } else {
        console.log(
          `OK: [CourseLessons ID: ${lessonId}, Slug: ${lessonSlug}] 'downloads' field matches SSOT.`,
        );
        totalSuccesses++;
      }
    } catch (err: any) {
      console.error(
        `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to verify downloads relationships: ${err.message}`,
      );
      totalErrors++;
    }
  }

  console.log(
    `\nRelationship Verification Complete. Successful checks: ${totalSuccesses}, Errors: ${totalErrors}.`,
  );
  if (totalErrors > 0) {
    console.error(`${totalErrors} relationship verification(s) failed.`);
  }
}

verifyRelationships().catch((err) => {
  console.error('Script failed: verify-relationships.ts', err);
  process.exit(1);
});
