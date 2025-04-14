import { DOWNLOAD_ID_MAP } from '../download-id-map.js';

/**
 * Mapping between lesson slugs and their associated download IDs
 * This ensures consistent relationships between lessons and downloads
 */
export const lessonDownloadsMapping = {
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
 * Get download IDs for a specific lesson
 * @param lessonSlug The lesson slug
 * @returns Array of download IDs or empty array if none found
 */
export function getDownloadIdsForLesson(lessonSlug) {
  const downloadKeys = lessonDownloadsMapping[lessonSlug] || [];
  return downloadKeys.map((key) => DOWNLOAD_ID_MAP[key]).filter((id) => !!id);
}
