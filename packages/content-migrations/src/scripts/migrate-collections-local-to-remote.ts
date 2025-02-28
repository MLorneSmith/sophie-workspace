/**
 * Script to migrate collections from local Supabase database to remote Supabase database
 */
import { migrateCollectionLocalToRemote } from '../utils/migrate-collection-local-to-remote.js';
import { getPayloadClient } from '../utils/payload-client.js';

// Define collections to migrate with their specific options
const COLLECTIONS_TO_MIGRATE = [
  {
    name: 'documentation',
    options: {
      matchField: 'slug',
      updateExisting: true,
    },
  },
  // Add more collections as needed
  // {
  //   name: 'blog',
  //   options: {
  //     matchField: 'slug',
  //     transformData: (data) => {
  //       // Custom transformations for blog data
  //       return data;
  //     },
  //   },
  // },
];

/**
 * Migrates collections from local Supabase database to remote Supabase database
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

// Run the migration
migrateCollectionsLocalToRemote().catch((error) => {
  console.error('Migration process failed:', error);
  process.exit(1);
});
