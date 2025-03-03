/**
 * Script to clean up duplicate entries in the remote documentation collection
 */
import { getPayloadClient } from '../utils/payload-client.js';

/**
 * Cleans up duplicate entries in the remote documentation collection
 */
async function cleanupRemoteDocumentation() {
  console.log('Starting cleanup of remote documentation collection...');

  try {
    // Connect to remote database
    console.log('Connecting to remote Supabase database...');
    const remoteClient = await getPayloadClient('production');

    // Get all documentation from remote
    const { docs } = await remoteClient.find({
      collection: 'documentation',
      limit: 1000, // Set a high limit to ensure we get all documents
    });

    console.log(`Found ${docs.length} documents in remote database.`);

    // Track processed slugs to identify duplicates
    const processedSlugs = new Map<string, number>(); // Map of slug to ID
    const duplicates: { id: number; title: string; slug: string }[] = [];

    // Identify duplicates
    for (const doc of docs) {
      if (processedSlugs.has(doc.slug)) {
        // This is a duplicate
        duplicates.push({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
        });
      } else {
        // First time seeing this slug
        processedSlugs.set(doc.slug, doc.id);
      }
    }

    console.log(`Found ${duplicates.length} duplicate documents.`);

    // Delete duplicates
    for (const duplicate of duplicates) {
      console.log(
        `Deleting duplicate document: ${duplicate.title} (ID: ${duplicate.id}, Slug: ${duplicate.slug})`,
      );
      await remoteClient.delete({
        collection: 'documentation',
        id: duplicate.id,
      });
    }

    console.log('Cleanup complete!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupRemoteDocumentation().catch((error) => {
  console.error('Cleanup process failed:', error);
  process.exit(1);
});
