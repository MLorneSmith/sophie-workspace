import type { Payload } from 'payload';

import {
  // Assuming this maps keys to filenames or we adapt it
  LESSON_DOWNLOADS_MAPPING,
} from '../data/mappings/download-mappings';

// Added Payload type import
// Removed: import { getPayloadClient } from './payload-client';

// Helper function to get filename from key using DOWNLOAD_ID_MAP
const getKeyToFilenameMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  // Assuming DOWNLOAD_ID_MAP maps a key (like 'our-process-slides') to an object
  // that includes the filename. We need to inspect the structure of DOWNLOAD_ID_MAP.
  // For now, let's assume DOWNLOAD_ID_MAP is a simple key-to-filename map based on Stage 2 output.
  // If DOWNLOAD_ID_MAP is key -> ID, we need a different approach or another map.

  // Based on Stage 2 output, filenames seem to be derived from keys.
  // Let's build a map from the keys in LESSON_DOWNLOADS_MAPPING to the filenames observed in Stage 2 output.
  // This is still a bit manual, but more reliable than the previous derivation.
  // A better approach would be to have a dedicated SSOT for downloads that includes both key and filename.

  // Manually mapping keys to filenames observed in Stage 2 output:
  map['slide-templates'] = 'SlideHeroes Presentation Template.zip';
  map['swipe-file'] = 'SlideHeroes Swipe File.zip';
  map['our-process-slides'] = '201 Our Process.pdf';
  map['the-who-slides'] = '202 The Who.pdf';
  map['introduction-slides'] = '203 The Why - Introductions.pdf';
  map['next-steps-slides'] = '204 The Why - Next Steps.pdf';
  map['idea-generation-slides'] = '301 Idea Generation.pdf';
  map['what-is-structure-slides'] = '302 What is Structure.pdf';
  map['using-stories-slides'] = '401 Using Stories.pdf';
  map['storyboards-presentations-slides'] =
    '403 Storyboards in Presentations.pdf';
  map['visual-perception-slides'] = '501 Visual Perception.pdf';
  map['fundamental-elements-slides'] = '503 Detail Fundamental Elements.pdf';
  map['gestalt-principles-slides'] =
    '504 Gestalt Principles of Visual Perception.pdf';
  map['slide-composition-slides'] = '505 Slide Composition.pdf';
  map['tables-vs-graphs-slides'] = '602 Tables v Graphs.pdf';
  map['standard-graphs-slides'] = '604 Standard Graphs.pdf';
  map['fact-based-persuasion-slides'] =
    '601 Fact-based Persuasion Overview.pdf';
  map['specialist-graphs-slides'] = '605 Specialist Graphs.pdf';
  map['preparation-practice-slides'] = '701 Preparation and Practice.pdf';
  map['performance-slides'] = '702 Performance.pdf';

  console.warn(
    'Using manual key-to-filename map based on Stage 2 output. Verify accuracy.',
    map,
  );
  return map;
};

const KEY_TO_FILENAME_MAP = getKeyToFilenameMap();

export async function populateLessonDownloadRelationships(payload: Payload) {
  // Added payload parameter
  console.log('Populating Lesson <-> Downloads relationships...');
  // Removed: const payloadClient = await getPayloadClient(true);

  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  // Iterate over the lesson slugs in the mapping
  // TS Fix: Ensure the mapping object type allows string indexing or iterate safely
  const lessonSlugs = Object.keys(LESSON_DOWNLOADS_MAPPING) as Array<
    keyof typeof LESSON_DOWNLOADS_MAPPING
  >;
  for (const lessonSlug of lessonSlugs) {
    // No need for hasOwnProperty check now due to typed keys iteration
    const downloadKeys = LESSON_DOWNLOADS_MAPPING[lessonSlug] || [];

    if (downloadKeys.length === 0) {
      console.log(
        `Lesson with slug ${lessonSlug} has no downloads defined in mapping. Skipping.`,
      );
      continue;
    }

    let lessonId: string | undefined; // Keep track of the found lesson ID
    const foundDownloadIds: string[] = []; // Use string[] format for relationship IDs

    try {
      // 1. Find the lesson document by slug
      const lessonResult = await payload.find({
        // Changed payloadClient to payload
        collection: 'course_lessons',
        where: { slug: { equals: lessonSlug } },
        limit: 1,
        depth: 0, // Don't need related data here
      });

      if (!lessonResult.docs || lessonResult.docs.length === 0) {
        console.warn(
          `Skipping lesson: Could not find lesson with slug ${lessonSlug}`,
        );
        errorCount++;
        continue;
      }
      // TS Fix: Ensure lessonId is assigned and is a string/number before proceeding
      const potentialLessonId = lessonResult.docs[0]?.id;
      if (
        typeof potentialLessonId !== 'string' &&
        typeof potentialLessonId !== 'number'
      ) {
        console.error(
          `Error: Found lesson "${lessonSlug}" but its ID is invalid or missing.`,
        );
        errorCount++;
        continue; // Skip to the next lesson slug
      }
      lessonId = String(potentialLessonId); // Ensure it's a string for update call

      // 2. Find the *current* IDs for each download associated with this lesson
      for (const downloadKey of downloadKeys) {
        const filename = KEY_TO_FILENAME_MAP[downloadKey];
        if (!filename) {
          console.warn(
            `   No filename mapping found for key "${downloadKey}" in lesson "${lessonSlug}". Skipping this download.`,
          );
          notFoundCount++;
          continue;
        }

        try {
          const downloadResult = await payload.find({
            // Changed payloadClient to payload
            collection: 'downloads',
            where: { filename: { equals: filename } },
            limit: 1,
            depth: 0,
          });

          if (downloadResult.docs && downloadResult.docs.length > 0) {
            // TS Fix: Ensure ID is string before pushing
            const downloadId = downloadResult.docs[0]?.id;
            if (
              typeof downloadId === 'string' ||
              typeof downloadId === 'number'
            ) {
              foundDownloadIds.push(String(downloadId)); // Store in string format
            } else {
              console.warn(
                `   Found download document for filename "${filename}" but it has an invalid ID.`,
              );
              notFoundCount++;
            }
          } else {
            console.warn(
              `   Could not find download document with filename "${filename}" (key: "${downloadKey}") for lesson "${lessonSlug}". Skipping this download.`,
            );
            notFoundCount++;
          }
        } catch (findError: any) {
          console.error(
            `   Error finding download with filename "${filename}" for lesson "${lessonSlug}":`,
            findError.message,
          );
          errorCount++;
        }
      }

      // 3. Update the lesson document if we found any valid download IDs AND we have a valid lessonId
      if (lessonId && foundDownloadIds.length > 0) {
        // downloadsToLink is already in the correct format { value: id }[]
        const downloadsToLink = foundDownloadIds;

        console.log(
          `   Updating lesson ${lessonId} with ${foundDownloadIds.length} found downloads:`,
          JSON.stringify(downloadsToLink, null, 2),
        );

        await payload.update({
          // Changed payloadClient to payload
          collection: 'course_lessons',
          id: lessonId, // Now guaranteed to be a string
          data: {
            downloads: foundDownloadIds, // Use the correct field name 'downloads' and assign string[]
          },
        });

        console.log(
          `Successfully linked ${foundDownloadIds.length} downloads to Lesson (${lessonSlug})`,
        );
        successCount++;
      } else {
        console.log(
          `No valid download IDs found for lesson "${lessonSlug}". Skipping update.`,
        );
      }
    } catch (error: any) {
      console.error(
        `Error processing relationships for Lesson (${lessonSlug}):`,
        error.message,
      );
      errorCount++; // Increment error count for the lesson processing failure
    }
  }

  console.log(
    `Lesson <-> Downloads relationships population complete. Lessons processed successfully: ${successCount}, Lessons with errors: ${errorCount}, Downloads not found: ${notFoundCount}.`,
  );

  // Optionally throw error if significant issues occurred
  if (errorCount > 0 || notFoundCount > 0) {
    console.warn(
      `There were ${errorCount} errors and ${notFoundCount} downloads not found during relationship population.`,
    );
    // Decide if this constitutes a script failure
    if (errorCount > 0 || notFoundCount > 0) {
      // Ensure this throw is inside the main try-catch or handled by run-stage-3
      throw new Error(
        `populateLessonDownloadRelationships encountered ${errorCount} errors and ${notFoundCount} downloads not found.`,
      );
    }
  }
}

// Removed direct execution block
// populateLessonDownloadRelationships().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
