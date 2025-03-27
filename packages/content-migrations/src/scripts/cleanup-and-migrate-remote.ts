/**
 * Script to clean up and migrate collections from local to remote Supabase database
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { migrateCollectionLocalToRemote } from '../utils/migrate-collection-local-to-remote.js';
import { getPayloadClient } from '../utils/payload-client.js';
import { validateMultipleCollectionSchemas } from '../utils/validate-schema.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile = '.env.production'; // Always use production for remote operations

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// Define collections to clean up and migrate
const COLLECTIONS_TO_MIGRATE = [
  {
    name: 'documentation',
    options: {
      matchField: 'slug',
      updateExisting: true,
    },
  },
  {
    name: 'posts',
    options: {
      matchField: 'slug',
      updateExisting: true,
    },
  },
  {
    name: 'courses',
    options: {
      matchField: 'slug',
      updateExisting: true,
    },
  },
  {
    name: 'course_lessons',
    options: {
      matchField: 'slug',
      updateExisting: true,
    },
  },
  {
    name: 'course_quizzes',
    options: {
      matchField: 'title',
      updateExisting: true,
    },
  },
  {
    name: 'quiz_questions',
    options: {
      matchField: 'id',
      updateExisting: true,
    },
  },
  // {
  //   name: 'quiz_questions_options',
  //   options: {
  //     matchField: 'id',
  //     updateExisting: true,
  //   },
  // },
  {
    name: 'media',
    options: {
      matchField: 'filename',
      updateExisting: true,
    },
  },
];

/**
 * Cleans up existing data in remote Payload CMS collections
 */
async function cleanupRemoteCollections() {
  console.log('Starting remote collection cleanup...');

  try {
    // Get the remote Payload client
    const payload = await getPayloadClient('production');

    // Validate that all collections exist
    const collectionNames = COLLECTIONS_TO_MIGRATE.map(
      (collection) => collection.name,
    );
    const validationResult =
      await validateMultipleCollectionSchemas(collectionNames);

    if (!validationResult) {
      console.error('Schema validation failed. Aborting cleanup.');
      process.exit(1);
    }

    // Clean up each collection
    for (const collection of COLLECTIONS_TO_MIGRATE) {
      console.log(`Cleaning up remote collection: ${collection.name}`);

      try {
        // Get all documents in the collection
        const { docs } = await payload.find({
          collection: collection.name,
          limit: 1000, // Use a high limit to ensure we get all documents
        });

        console.log(`Found ${docs.length} documents in ${collection.name}`);

        // Delete each document
        for (const doc of docs) {
          await payload.delete({
            collection: collection.name,
            id: doc.id,
          });
          console.log(
            `Deleted document with ID ${doc.id} from ${collection.name}`,
          );
        }

        console.log(
          `Successfully cleaned up remote collection: ${collection.name}`,
        );
      } catch (error) {
        console.error(
          `Error cleaning up remote collection ${collection.name}:`,
          error,
        );
      }
    }

    console.log('Remote collection cleanup complete!');
  } catch (error) {
    console.error('Remote cleanup failed:', error);
    process.exit(1);
  }
}

/**
 * Migrates collections from local to remote Supabase database
 */
async function migrateCollectionsLocalToRemote() {
  console.log(
    'Starting collections migration from local to remote Supabase database...',
  );

  try {
    // Get local client (using development environment)
    console.log('Connecting to local Supabase database...');
    const localClient = await getPayloadClient('development');

    // Get remote client (using production environment)
    console.log('Connecting to remote Supabase database...');
    const remoteClient = await getPayloadClient('production');

    // Migrate each collection
    for (const collection of COLLECTIONS_TO_MIGRATE) {
      console.log(`\n--- Migrating collection: ${collection.name} ---`);

      const result = await migrateCollectionLocalToRemote(
        localClient,
        remoteClient,
        {
          collection: collection.name,
          ...collection.options,
        },
      );

      if (result.success) {
        console.log(
          `Successfully migrated collection '${collection.name}' from local to remote.`,
        );
        if (result.details) {
          console.log(
            `Results: ${result.details.created} created, ${result.details.updated} updated, ${result.details.skipped} skipped, ${result.details.failed} failed`,
          );
        }
      } else {
        console.error(
          `Failed to migrate collection '${collection.name}' from local to remote:`,
          result.error,
        );
      }
    }

    console.log(
      '\nAll collections migration from local to remote Supabase database complete!',
    );
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Main function to run the cleanup and migration process
 */
async function cleanupAndMigrateRemote() {
  try {
    // First, clean up the remote collections
    await cleanupRemoteCollections();

    // Then, migrate the collections from local to remote
    await migrateCollectionsLocalToRemote();

    console.log('Cleanup and migration process completed successfully!');
  } catch (error) {
    console.error('Cleanup and migration process failed:', error);
    process.exit(1);
  }
}

// Run the cleanup and migration process
cleanupAndMigrateRemote().catch((error) => {
  console.error('Process failed:', error);
  process.exit(1);
});
