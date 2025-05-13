// Adjust path if necessary, assuming payload-client.ts is in ../
import type { Payload } from 'payload';

import { getPayloadClient } from '../stage-3-populate-relationships/payload-client';

// Define expected document counts for each collection
// These should be derived from your SSOT files or actual expected values
const EXPECTED_COUNTS: Record<string, number> = {
  courses: 1, // Example: Expect 1 course
  course_lessons: 25, // Example: Expect 25 lessons
  course_quizzes: 20, // Example: Expect 20 quizzes
  quiz_questions: 94, // Updated to match SSOT count
  surveys: 3,
  survey_questions: 32, // Corrected: Expect 32 unique questions
  posts: 9,
  documentation: 19,
  downloads: 22, // From seed-downloads.ts log
  media: 135, // From seed-media.ts log (Note: 'media' might be deprecated, confirm if this check is needed)
  // Add other collections as needed, e.g., 'private_posts'
};

async function verifyDocumentCounts() {
  console.log('Starting Stage 4: Verify Document Counts...');
  const payloadClient: Payload = await getPayloadClient(true);
  let errorCount = 0;
  let successCount = 0;
  const collectionsToVerify = Object.keys(EXPECTED_COUNTS);

  for (const collectionSlug of collectionsToVerify) {
    const expectedCount = EXPECTED_COUNTS[collectionSlug];
    try {
      const result = await payloadClient.find({
        collection: collectionSlug as any, // Type assertion might be needed if slugs aren't strictly typed
        limit: 0, // We only need the total count
        depth: 0,
      });

      const actualCount = result.totalDocs;

      if (actualCount === expectedCount) {
        console.log(
          `OK: Collection '${collectionSlug}' has ${actualCount} documents (matches expected).`,
        );
        successCount++;
      } else {
        console.error(
          `ERROR: Collection '${collectionSlug}' has ${actualCount} documents, expected ${expectedCount}.`,
        );
        errorCount++;
      }
    } catch (err: any) {
      console.error(
        `ERROR: Failed to fetch count for collection '${collectionSlug}': ${err.message}`,
      );
      errorCount++;
    }
  }

  console.log(
    `Document Count Verification Complete. Successful collections: ${successCount}, Collections with errors: ${errorCount}.`,
  );
  if (errorCount > 0) {
    throw new Error(
      `${errorCount} collection(s) failed document count verification.`,
    );
  } else {
    // Explicitly exit with 0 on success
    process.exit(0);
  }
}

verifyDocumentCounts().catch((err) => {
  console.error('Script failed: verifyDocumentCounts.ts', err);
  process.exit(1);
});
