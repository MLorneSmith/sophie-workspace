/**
 * BACKWARD COMPATIBILITY MODULE
 *
 * This file re-exports items from the consolidated download-mappings.ts file
 * to maintain backward compatibility with existing code.
 *
 * For new code, please import directly from './download-mappings'
 */
import { LESSON_DOWNLOADS_MAPPING, getDownloadIdsForLesson, } from './download-mappings.js';
// Re-export with the original name for backward compatibility
export const lessonDownloadsMapping = LESSON_DOWNLOADS_MAPPING;
// Re-export the function directly
export { getDownloadIdsForLesson };
