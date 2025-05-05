/**
 * Content Migrations Package
 *
 * This package provides utilities and scripts for migrating content from various sources
 * to Payload CMS collections.
 */

// Export utility functions
export {
  validateCollectionSchema,
  validateMultipleCollectionSchemas,
} from './utils/validate-schema.js';

// Export data mappings
export { DOWNLOAD_ID_MAP } from './data/mappings/download-mappings.js';
export { getDownloadIdsForLesson } from './data/mappings/lesson-downloads-mappings.js';

// Export simplified imports
export {
  generateInsertSQL as generateDownloadsSQL,
  runImport as importDownloads,
} from './scripts/import/simplified-import-r2-downloads.js';

// Note: Most migration scripts are not exported as they are meant to be run directly
