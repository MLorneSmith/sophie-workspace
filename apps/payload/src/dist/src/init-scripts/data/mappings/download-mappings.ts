/**
 * Unified download mappings module
 *
 * This file consolidates download-related mapping functionality:
 * 1. Predefined UUIDs for downloads
 * 2. Mappings between lesson slugs and their associated download IDs
 * 3. Helper functions to work with these mappings
 */

/**
 * Map of download keys to their predefined UUIDs
 * This ensures consistent IDs across all tables and relationships
 */
export const DOWNLOAD_ID_MAP: Record<string, string> = {
  // Define IDs for course resources downloads that actually exist
  'slide-templates': '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', // SlideHeroes Presentation Template.zip
  'swipe-file': 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6', // SlideHeroes Swipe File.zip

  // Lesson PDFs - using consistent naming convention for keys
  'our-process-slides': 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', // 201 Our Process.pdf
  'the-who-slides': 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456', // 202 The Who.pdf
  'introduction-slides': 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593', // 203 The Why - Introductions.pdf
  'next-steps-slides': 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04', // 204 The Why - Next Steps.pdf
  'idea-generation-slides': 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18', // 205 Idea Generation.pdf
  'what-is-structure-slides': 'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29', // 206 What is Structure.pdf
  'using-stories-slides': 'e017b153-4d96-6fb8-c0e2-354f9d2c7130', // 207 Using Stories.pdf
  'storyboards-presentations-slides': 'f158c264-5e07-71c9-d1f3-165e0e3d8541', // 208 Storyboards in Presentations.pdf
  'visual-perception-slides': '1219d375-6f18-85d0-e214-276d1f4e9152', // 209 Visual Perception.pdf
  'fundamental-elements-slides': '3320e486-7129-91e1-f355-487a215f0263', // 210 Fundamental Elements.pdf
  'gestalt-principles-slides': '44a1f597-8530-02f2-14a6-598a356a1a74', // 211 Gestalt Principles.pdf
  'slide-composition-slides': '55b21608-9a41-1a13-5527-a09a4a7a2b85', // 212 Slide Composition.pdf
  'tables-vs-graphs-slides': '66c35719-0252-2b54-a6a8-a10b5a8a3c96', // 213 Tables vs Graphs.pdf
  'standard-graphs-slides': '77d4a820-1a63-3ca5-a7b9-b21c6a9a4d07', // 214 Standard Graphs.pdf
  'fact-based-persuasion-slides': '88e5a931-2b74-4da6-a8c0-a32d7b0a5e18', // 215 Fact-based Persuasion.pdf
  'specialist-graphs-slides': '99f6a042-3c85-5ea7-b9d1-a43e8c1b6f29', // 216 Specialist Graphs.pdf
  'preparation-practice-slides': 'aa07b153-4d96-6fb8-c0e2-b54f9d2c7a30', // 217 Preparation and Practice.pdf
  'performance-slides': 'bb18c264-5e07-71c9-d1f3-c65e0e3d8b41', // 218 Performance.pdf
};

/**
 * Mapping between lesson slugs and their associated download IDs
 * This ensures consistent relationships between lessons and downloads
 */
export const LESSON_DOWNLOADS_MAPPING: Record<string, string[]> = {
  // Format: lessonSlug: [downloadIdKey1, downloadIdKey2]
  'our-process': ['our-process-slides'],
  'the-who': ['the-who-slides'],
  'the-why-introductions': ['introduction-slides'],
  'the-why-next-steps': ['next-steps-slides'],
  'idea-generation': ['idea-generation-slides'],
  'what-is-structure': ['what-is-structure-slides'],
  'using-stories': ['using-stories-slides'],
  'storyboards-presentations': ['storyboards-presentations-slides'],
  'visual-perception': ['visual-perception-slides'],
  'fundamental-design-overview': ['fundamental-elements-slides'],
  'fundamental-design-detail': ['fundamental-elements-slides'],
  'gestalt-principles': ['gestalt-principles-slides'],
  'slide-composition': ['slide-composition-slides'],
  'tables-vs-graphs': ['tables-vs-graphs-slides'],
  'basic-graphs': ['standard-graphs-slides'],
  'fact-based-persuasion': ['fact-based-persuasion-slides'],
  'specialist-graphs': ['specialist-graphs-slides'],
  'preparation-practice': ['preparation-practice-slides'],
  performance: ['performance-slides'],
  // Add course-wide resources to specific lessons or all lessons as needed
  'tools-and-resources': ['slide-templates', 'swipe-file'],
};

/**
 * Get a download ID by its key
 * @param key The download key
 * @returns The UUID for the specified download key or undefined if not found
 */
export function getDownloadIdByKey(key: string): string | undefined {
  return DOWNLOAD_ID_MAP[key];
}

/**
 * Get a download key by its ID
 * @param id The download UUID
 * @returns The key for the specified download ID or undefined if not found
 */
export function getDownloadKeyById(id: string): string | undefined {
  for (const [key, value] of Object.entries(DOWNLOAD_ID_MAP)) {
    if (value === id) {
      return key;
    }
  }
  return undefined;
}

/**
 * Get download IDs for a specific lesson
 * @param lessonSlug The lesson slug
 * @returns Array of download IDs or empty array if none found
 */
export function getDownloadIdsForLesson(lessonSlug: string): string[] {
  const downloadKeys = LESSON_DOWNLOADS_MAPPING[lessonSlug] || [];
  return downloadKeys
    .map((key: string) => { // Explicitly type key
      const id = DOWNLOAD_ID_MAP[key];
      return typeof id === 'string' ? id : '';
    })
    .filter((id) => id !== '');
}

/**
 * Get all download keys for a specific lesson
 * @param lessonSlug The lesson slug
 * @returns Array of download keys or empty array if none found
 */
export function getDownloadKeysForLesson(lessonSlug: string): string[] {
  return LESSON_DOWNLOADS_MAPPING[lessonSlug] || [];
}

/**
 * Check if a lesson has any associated downloads
 * @param lessonSlug The lesson slug
 * @returns True if the lesson has downloads, false otherwise
 */
export function hasDownloads(lessonSlug: string): boolean {
  const downloads = LESSON_DOWNLOADS_MAPPING[lessonSlug];
  return Array.isArray(downloads) && downloads.length > 0;
}
