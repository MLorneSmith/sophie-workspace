/**
 * Script to clean up existing data in Payload CMS collections before running migrations
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getPayloadClient } from '../utils/payload-client.js';
import { validateMultipleCollectionSchemas } from '../utils/validate-schema.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// Define collections to clean up
const COLLECTIONS_TO_CLEANUP = [
  'documentation',
  'posts',
  'courses',
  'course_lessons',
  'course_quizzes',
  'quiz_questions',
  // 'quiz_questions_options', // This collection might not exist or have a different name
];

/**
 * Cleans up existing data in Payload CMS collections
 */
async function cleanupCollections() {
  console.log('Starting collection cleanup...');

  try {
    // Get the Payload client
    const payload = await getPayloadClient();

    // Validate that all collections exist
    const validationResult = await validateMultipleCollectionSchemas(
      COLLECTIONS_TO_CLEANUP,
    );

    if (!validationResult) {
      console.error('Schema validation failed. Aborting cleanup.');
      process.exit(1);
    }

    // Clean up each collection
    for (const collection of COLLECTIONS_TO_CLEANUP) {
      console.log(`Cleaning up collection: ${collection}`);

      try {
        // Get all documents in the collection
        const { docs } = await payload.find({
          collection,
          limit: 1000, // Use a high limit to ensure we get all documents
        });

        console.log(`Found ${docs.length} documents in ${collection}`);

        // Delete each document
        for (const doc of docs) {
          await payload.delete({
            collection,
            id: doc.id,
          });
          console.log(`Deleted document with ID ${doc.id} from ${collection}`);
        }

        console.log(`Successfully cleaned up collection: ${collection}`);
      } catch (error) {
        console.error(`Error cleaning up collection ${collection}:`, error);
      }
    }

    console.log('Collection cleanup complete!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupCollections().catch((error) => {
  console.error('Cleanup process failed:', error);
  process.exit(1);
});
