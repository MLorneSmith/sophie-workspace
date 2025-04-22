/**
 * Type definitions for lesson-downloads-mappings.js module
 * This is a compatibility module that re-exports from download-mappings.js
 */
// Import the original types
import {
  getDownloadIdsForLesson as OriginalFunction,
  LESSON_DOWNLOADS_MAPPING as OriginalMapping,
} from './download-mappings';

// Re-export with compatible names
export declare const lessonDownloadsMapping: typeof OriginalMapping;
export declare const getDownloadIdsForLesson: typeof OriginalFunction;
