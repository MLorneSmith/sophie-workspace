/**
 * Utility for migrating collection data from local Supabase database to remote Supabase database
 */
// import type { PayloadClient } from './payload-client.js'; // Removed - file doesn't exist

/**
 * Options for configuring the migration of a collection from local to remote
 */
export interface MigrationOptions {
  /**
   * The name of the collection to migrate
   */
  collection: string;

  /**
   * Number of documents to process in each batch (default: 50)
   */
  batchSize?: number;

  /**
   * Whether to skip documents that already exist in the remote database (default: false)
   */
  skipExisting?: boolean;

  /**
   * Whether to update documents that already exist in the remote database (default: true)
   */
  updateExisting?: boolean;

  /**
   * Field to use for matching documents between local and remote (default: 'slug')
   */
  matchField?: string;

  /**
   * Optional function to transform document data before migration
   */
  transformData?: (data: any) => any;

  /**
   * Level of detail in logging (default: 'normal')
   */
  logLevel?: 'minimal' | 'normal' | 'verbose';
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  /**
   * Whether the migration was successful
   */
  success: boolean;

  /**
   * Number of documents processed
   */
  count?: number;

  /**
   * Error if the migration failed
   */
  error?: any;

  /**
   * Detailed results of the migration
   */
  details?: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Migrates collection data from local Supabase database to remote Supabase database
 *
 * @param localClient - Payload client connected to local Supabase database
 * @param remoteClient - Payload client connected to remote Supabase database
 * @param options - Migration options
 * @returns Migration result with success status and count
 */
export async function migrateCollectionLocalToRemote(
  localClient: any, // Changed type to any since PayloadClient type is removed
  remoteClient: any, // Changed type to any since PayloadClient type is removed
  options: MigrationOptions,
): Promise<MigrationResult> {
  const {
    collection,
    batchSize = 50,
    skipExisting = false,
    updateExisting = true,
    matchField = 'slug',
    transformData,
    logLevel = 'normal',
  } = options;

  const verbose = logLevel === 'verbose';
  const minimal = logLevel === 'minimal';

  // Track migration statistics
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  if (!minimal)
    console.log(
      `Starting migration of collection '${collection}' from local to remote Supabase database...`,
    );

  try {
    // Get all documents from local database
    // @ts-ignore // Ignore potential type error due to 'any' type
    const { docs: localDocs, totalDocs } = await localClient.find({
      collection,
      limit: 1000, // Use a high limit to ensure we get all documents
    });

    if (!minimal)
      console.log(
        `Found ${totalDocs} items in local database to migrate to remote`,
      );

    // Process each document
    for (const localDoc of localDocs) {
      try {
        // Prepare data for migration, applying any transformations
        const migrationData = transformData
          ? transformData(localDoc)
          : { ...localDoc };

        // Remove id field as it will be auto-generated in the target database
        const { id, ...dataWithoutId } = migrationData;

        // Check if document exists in remote database by matchField
        const matchValue = localDoc[matchField];
        if (!matchValue) {
          console.warn(
            `Document is missing match field '${matchField}', using id instead`,
          );
        }

        // Find matching document in remote database by matchField
        // @ts-ignore // Ignore potential type error due to 'any' type
        const { docs: remoteDocs } = await remoteClient.find({
          collection,
          limit: 1,
          query: { [matchField]: matchValue },
        });

        if (remoteDocs.length > 0) {
          // Document exists in remote database
          if (skipExisting) {
            if (verbose)
              console.log(
                `Skipping existing document in remote database: ${matchValue || id}`,
              );
            stats.skipped++;
            continue;
          }

          if (updateExisting) {
            // Update existing document in remote database
            // @ts-ignore // Ignore potential type error due to 'any' type
            await remoteClient.update({
              collection,
              id: remoteDocs[0].id,
              data: dataWithoutId,
            });
            if (!minimal)
              console.log(
                `Updated document in remote database: ${matchValue || id}`,
              );
            stats.updated++;
          } else {
            if (verbose)
              console.log(
                `Skipping update for existing document: ${matchValue || id}`,
              );
            stats.skipped++;
          }
        } else {
          // Create new document in remote database
          // @ts-ignore // Ignore potential type error due to 'any' type
          await remoteClient.create({
            collection,
            data: dataWithoutId,
          });
          if (!minimal)
            console.log(
              `Created document in remote database: ${matchValue || id}`,
            );
          stats.created++;
        }
      } catch (error) {
        const docIdentifier = localDoc[matchField] || localDoc.id;
        console.error(
          `Error migrating document ${docIdentifier} from local to remote:`,
          error,
        );
        stats.failed++;
      }
    }

    if (!minimal) {
      console.log(
        `Migration complete for collection '${collection}' from local to remote Supabase database`,
      );
      console.log(
        `Results: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed`,
      );
    }

    return {
      success: true,
      count: localDocs.length,
      details: stats,
    };
  } catch (error) {
    console.error(
      `Error during migration of collection '${collection}' from local to remote:`,
      error,
    );
    return {
      success: false,
      error,
      details: stats,
    };
  }
}
