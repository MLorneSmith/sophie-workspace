import type { Payload } from 'payload';

import { LESSON_QUIZ_RELATIONS } from '../data/definitions/lesson-quiz-relations';
import {
  DOWNLOAD_ID_MAP,
  LESSON_DOWNLOADS_MAPPING,
} from '../data/mappings/download-mappings';
// Import SSOT data for relationships
import { QUIZZES as SSOT_QUIZZES } from '../data/quizzes-quiz-questions-truth';
import { getPayloadClient } from '../stage-3-populate-relationships/payload-client';

// TODO: Import other SSOTs: Course->Lessons, Survey->SurveyQuestions, etc.

// Placeholder for a direct DB query utility
// async function directDbQuery(sql: string, params: any[] = []): Promise<any[]> {
//   console.warn('Direct DB Query function not implemented yet.');
//   return [];
// }

async function verifyRelatedItemCounts() {
  console.log('Starting Stage 4: Verify Related Item Counts...');
  const payloadClient: Payload = await getPayloadClient(true);
  let totalErrors = 0;
  let totalSuccesses = 0;

  // --- 1. Verify Quiz -> QuizQuestions Counts ---
  console.log('\nVerifying Quiz -> QuizQuestions counts...');
  for (const ssotQuiz of Object.values(SSOT_QUIZZES)) {
    const quizId = ssotQuiz.id;
    const expectedQuestionCount = ssotQuiz.questions.length;

    try {
      const quizDoc = await payloadClient.findByID({
        collection: 'course_quizzes',
        id: quizId,
        depth: 1, // Populate 'questions'
      });

      if (!quizDoc) {
        console.error(
          `ERROR: [CourseQuizzes ID: ${quizId}] Document not found for count verification.`,
        );
        totalErrors++;
        continue;
      }

      const actualQuestionsInJsonbCount =
        quizDoc.questions && Array.isArray(quizDoc.questions)
          ? quizDoc.questions.length
          : 0;

      if (actualQuestionsInJsonbCount !== expectedQuestionCount) {
        console.error(
          `ERROR: [CourseQuizzes ID: ${quizId}] JSONB 'questions' count mismatch. Expected: ${expectedQuestionCount}, Actual: ${actualQuestionsInJsonbCount}`,
        );
        totalErrors++;
      } else {
        totalSuccesses++;
      }

      // TODO: SQL check for 'payload.course_quizzes_rels'
      // const relsCountResult = await directDbQuery('SELECT COUNT(*) as count FROM payload.course_quizzes_rels WHERE _parent_id = $1 AND path = $2', [quizId, 'questions']);
      // const actualRelsCount = relsCountResult[0]?.count || 0;
      // if (Number(actualRelsCount) !== expectedQuestionCount) {
      //   console.error(`ERROR: [CourseQuizzes ID: ${quizId}] _rels table count mismatch. Expected: ${expectedQuestionCount}, Actual: ${actualRelsCount}`);
      //   totalErrors++;
      // } else {
      //   totalSuccesses++; // Count this success separately or combine logic
      // }
    } catch (err: any) {
      console.error(
        `ERROR: [CourseQuizzes ID: ${quizId}] Failed to verify question counts: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // --- 2. Verify Lesson -> Quiz Count (should be 0 or 1) ---
  console.log('\nVerifying Lesson -> Quiz count...');
  for (const lessonQuizRelation of LESSON_QUIZ_RELATIONS) {
    const lessonSlug = lessonQuizRelation.lessonSlug;
    const expectedQuizCount = lessonQuizRelation.quizSlug ? 1 : 0;

    try {
      const lessonResult = await payloadClient.find({
        collection: 'course_lessons',
        where: { slug: { equals: lessonSlug } },
        limit: 1,
        depth: 1, // Populate 'quiz'
      });

      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Document not found for quiz count.`,
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

      const actualQuizInJsonb = lessonDoc.quiz;
      const actualQuizCount = actualQuizInJsonb ? 1 : 0;

      if (actualQuizCount !== expectedQuizCount) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] JSONB 'quiz' count mismatch. Expected: ${expectedQuizCount}, Actual: ${actualQuizCount}`,
        );
        totalErrors++;
      } else {
        totalSuccesses++;
      }
      // TODO: SQL check for 'payload.course_lessons_rels' where path='quiz'
    } catch (err: any) {
      console.error(
        `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to verify quiz count: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // --- 3. Verify Lesson -> Downloads Counts ---
  console.log('\nVerifying Lesson -> Downloads counts...');
  for (const lessonSlug of Object.keys(LESSON_DOWNLOADS_MAPPING)) {
    const downloadKeys: string[] =
      LESSON_DOWNLOADS_MAPPING[
        lessonSlug as keyof typeof LESSON_DOWNLOADS_MAPPING
      ] || [];
    const expectedDownloadCount = downloadKeys
      .map((key) => DOWNLOAD_ID_MAP[key as keyof typeof DOWNLOAD_ID_MAP])
      .filter((id) => !!id).length;

    try {
      const lessonResult = await payloadClient.find({
        collection: 'course_lessons',
        where: { slug: { equals: lessonSlug } },
        limit: 1,
        depth: 1, // Populate 'downloads'
      });
      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Document not found for downloads count.`,
        );
        totalErrors++;
        continue;
      }
      const lessonDoc = lessonResult.docs[0];
      if (!lessonDoc) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to retrieve document from find operation for downloads count.`,
        );
        totalErrors++;
        continue;
      }

      const actualDownloadsInJsonbCount =
        lessonDoc.downloads && Array.isArray(lessonDoc.downloads)
          ? lessonDoc.downloads.length
          : 0;

      if (actualDownloadsInJsonbCount !== expectedDownloadCount) {
        console.error(
          `ERROR: [CourseLessons Slug: ${lessonSlug}] JSONB 'downloads' count mismatch. Expected: ${expectedDownloadCount}, Actual: ${actualDownloadsInJsonbCount}`,
        );
        totalErrors++;
      } else {
        totalSuccesses++;
      }
      // TODO: SQL check for 'payload.course_lessons__downloads' or 'payload.course_lessons_rels'
    } catch (err: any) {
      console.error(
        `ERROR: [CourseLessons Slug: ${lessonSlug}] Failed to verify downloads counts: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // TODO: Add count verifications for other relationships

  console.log(
    `\nRelated Item Count Verification Complete. Successful checks: ${totalSuccesses}, Errors: ${totalErrors}.`,
  );
  if (totalErrors > 0) {
    throw new Error(
      `${totalErrors} related item count verification(s) failed.`,
    );
  }
}

verifyRelatedItemCounts().catch((err) => {
  console.error('Script failed: verify-related-item-counts.ts', err);
  process.exit(1);
});
