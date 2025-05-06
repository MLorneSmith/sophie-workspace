/**
 * Maps collection types to their corresponding table names in the database
 * This ensures consistent access to database tables across the application
 */

// Mapping of collection types to table names
export const COLLECTION_TABLE_NAMES: Record<string, string> = {
  documentation: 'documentation',
  course_lessons: 'course_lessons',
  courses: 'courses',
  course_quizzes: 'course_quizzes',
  quiz_questions: 'quiz_questions',
  surveys: 'surveys',
  survey_questions: 'survey_questions',
  downloads: 'downloads',
};

/**
 * Get the table name for a given collection type
 * @param collectionType The collection type
 * @returns The table name or null if not found
 */
export function getTableNameForCollection(
  collectionType: string,
): string | null {
  return COLLECTION_TABLE_NAMES[collectionType] || null;
}

/**
 * Collection to downloads mappings - maps specific collection items to download IDs
 * Useful for cases where we know certain collection items always have specific downloads
 */
export const COLLECTION_DOWNLOAD_MAPPINGS: Record<
  string,
  Record<string, string[]>
> = {
  // Documentation section downloads
  documentation: {
    // No specific mappings yet
  },

  // Course lesson downloads - using the actual UUIDs from download-id-map.ts
  course_lessons: {
    // Map specific lesson IDs to their associated slide PDFs
    'lesson-our-process': ['d7e389a2-5f10-4b8c-9a21-3e78f9c61d28'], // our-process-slides
    'lesson-the-who': ['e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456'], // the-who-slides
    'lesson-introduction': ['a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593'], // introduction-slides
    'lesson-next-steps': ['b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04'], // next-steps-slides
    'lesson-idea-generation': ['c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18'], // idea-generation-slides
    'lesson-what-is-structure': ['d9f6a042-3c85-5fa7-b9d1-143e8c1b6f29'], // what-is-structure-slides
    'lesson-using-stories': ['e017b153-4d96-6fb8-c0e2-354f9d2c7130'], // using-stories-slides
    'lesson-storyboards-presentations': [
      'f158c264-5e07-71c9-d1f3-165e0e3d8541',
    ], // storyboards-presentations-slides
    'lesson-visual-perception': ['1219d375-6f18-85d0-e214-276d1f4e9152'], // visual-perception-slides
    'lesson-fundamental-elements': ['3320e486-7129-91e1-f355-487a215f0263'], // fundamental-elements-slides
    'lesson-gestalt-principles': ['44a1f597-8530-02f2-14a6-598a356a1a74'], // gestalt-principles-slides
    'lesson-slide-composition': ['55b21608-9a41-1a13-5527-a09a4a7a2b85'], // slide-composition-slides
    'lesson-tables-vs-graphs': ['66c35719-0252-2b54-a6a8-a10b5a8a3c96'], // tables-vs-graphs-slides
    'lesson-standard-graphs': ['77d4a820-1a63-3ca5-a7b9-b21c6a9a4d07'], // standard-graphs-slides
    'lesson-fact-based-persuasion': ['88e5a931-2b74-4da6-a8c0-a32d7b0a5e18'], // fact-based-persuasion-slides
    'lesson-specialist-graphs': ['99f6a042-3c85-5ea7-b9d1-a43e8c1b6f29'], // specialist-graphs-slides
    'lesson-preparation-practice': ['aa07b153-4d96-6fb8-c0e2-b54f9d2c7a30'], // preparation-practice-slides
    'lesson-performance': ['bb18c264-5e07-71c9-d1f3-c65e0e3d8b41'], // performance-slides
  },
};

/**
 * Get the download IDs for a specific collection item
 * @param collectionId The ID of the collection item
 * @param collectionType The type of collection
 * @returns An array of download IDs or an empty array if none found
 */
export function getDownloadsForCollection(
  collectionId: string,
  collectionType: string,
): string[] {
  const collectionMappings = COLLECTION_DOWNLOAD_MAPPINGS[collectionType];
  if (!collectionMappings) return [];

  return collectionMappings[collectionId] || [];
}
