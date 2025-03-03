/**
 * Script to clean up all documentation in the remote database and then migrate all documents from local to remote
 */
import { getPayloadClient } from '../utils/payload-client.js';

/**
 * Cleans up all documentation in the remote database
 */
async function cleanupAllRemoteDocumentation() {
  console.log('Starting cleanup of all remote documentation...');

  try {
    // Connect to remote database
    console.log('Connecting to remote Supabase database...');
    const remoteClient = await getPayloadClient('production');

    // Get all documentation from remote
    const { docs } = await remoteClient.find({
      collection: 'documentation',
      limit: 1000, // Set a high limit to ensure we get all documents
    });

    console.log(`Found ${docs.length} documents in remote database to delete.`);

    // Delete all documents
    for (const doc of docs) {
      console.log(
        `Deleting document: ${doc.title} (ID: ${doc.id}, Slug: ${doc.slug})`,
      );
      await remoteClient.delete({
        collection: 'documentation',
        id: doc.id,
      });
    }

    console.log('Cleanup complete!');
    return true;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return false;
  }
}

/**
 * Migrates all documentation from local to remote database
 */
async function migrateAllDocsToRemote() {
  console.log(
    'Starting migration of all documentation from local to remote...',
  );

  try {
    // Connect to local and remote databases
    console.log('Connecting to local Supabase database...');
    const localClient = await getPayloadClient('development');

    console.log('Connecting to remote Supabase database...');
    const remoteClient = await getPayloadClient('production');

    // Get all documents from local database
    console.log('Authenticating with local database...');
    const { docs: localDocs } = await localClient.find({
      collection: 'documentation',
      limit: 1000,
    });

    // Log the raw response for debugging
    console.log('Local database response:', JSON.stringify(localDocs, null, 2));

    console.log(
      `Found ${localDocs.length} documents in local database to migrate.`,
    );

    // Migrate each document
    for (const localDoc of localDocs) {
      // Remove ID as it will be auto-generated
      const { id, ...dataWithoutId } = localDoc;

      try {
        // Create document in remote database
        const result = await remoteClient.create({
          collection: 'documentation',
          data: dataWithoutId,
        });

        console.log(
          `Created document in remote: ${localDoc.title} (Slug: ${localDoc.slug})`,
        );
      } catch (error) {
        console.error(`Failed to migrate document ${localDoc.title}:`, error);
      }
    }

    console.log('Migration complete!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

/**
 * Verifies that all documents were properly migrated
 */
async function verifyMigration() {
  console.log('Verifying migration...');

  try {
    // Connect to local and remote databases
    const localClient = await getPayloadClient('development');
    const remoteClient = await getPayloadClient('production');

    // Get all documents from both databases
    const { docs: localDocs } = await localClient.find({
      collection: 'documentation',
      limit: 1000,
    });

    const { docs: remoteDocs } = await remoteClient.find({
      collection: 'documentation',
      limit: 1000,
    });

    // Check if all local documents exist in remote
    const localSlugs = new Set(localDocs.map((doc) => doc.slug));
    const remoteSlugs = new Set(remoteDocs.map((doc) => doc.slug));

    const missing = [...localSlugs].filter((slug) => !remoteSlugs.has(slug));
    const extra = [...remoteSlugs].filter((slug) => !localSlugs.has(slug));

    if (missing.length === 0 && extra.length === 0) {
      console.log('✅ Migration successful! All documents properly migrated.');
      return true;
    } else {
      console.log('❌ Migration incomplete:');
      if (missing.length > 0)
        console.log(`Missing documents: ${missing.join(', ')}`);
      if (extra.length > 0) console.log(`Extra documents: ${extra.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

/**
 * Main function to run the entire process
 */
async function cleanupAndMigrateRemote() {
  console.log('Starting cleanup and migration process...');

  // Step 1: Clean up remote database
  const cleanupSuccess = await cleanupAllRemoteDocumentation();
  if (!cleanupSuccess) {
    console.error('Cleanup failed, aborting migration.');
    process.exit(1);
  }

  // Step 2: Migrate all documents from local to remote
  const migrationSuccess = await migrateAllDocsToRemote();
  if (!migrationSuccess) {
    console.error('Migration failed.');
    process.exit(1);
  }

  // Step 3: Verify migration
  const verificationSuccess = await verifyMigration();
  if (!verificationSuccess) {
    console.error('Verification failed, migration may be incomplete.');
    process.exit(1);
  }

  console.log('Cleanup and migration process completed successfully!');
}

// Run the cleanup and migration process
cleanupAndMigrateRemote().catch((error) => {
  console.error('Process failed:', error);
  process.exit(1);
});
