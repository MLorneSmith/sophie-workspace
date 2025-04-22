/**
 * Type definitions for download-mappings.js module
 */

// Define the structure of the download ID map
export declare const DOWNLOAD_ID_MAP: Record<string, string>;

// Helper function types
export declare function getDownloadIdByKey(key: string): string | undefined;
export declare function getDownloadKeyById(id: string): string | undefined;
export declare function getDownloadIdsForLesson(lessonSlug: string): string[];
export declare function getDownloadKeysForLesson(lessonSlug: string): string[];
export declare function hasDownloads(lessonSlug: string): boolean;

// Define the lesson mappings structure
export declare const LESSON_DOWNLOADS_MAPPING: Record<string, string[]>;
