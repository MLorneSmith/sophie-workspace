import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
// Assuming these are created as per Phase B
import { DownloadDefinitionsSchema } from '../data/schemas/download-definition.schema.js';
import { DOWNLOAD_DEFINITIONS } from '../data/definitions/download-definitions.js'; // Import the SSOT data
// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path to the download definitions SSOT file (for reference in logging)
const SSOT_FILE_PATH = path.resolve(__dirname, '../data/definitions/download-definitions.ts');
export async function seedDownloads(payload, logger, cliArgs) {
    const collectionSlug = 'downloads'; // Or the actual slug for your media/downloads collection
    logger.info(`Starting seeder for collection: ${collectionSlug}...`);
    const idMap = {}; // Maps SSOT download key to live DB UUID
    try {
        // 1. Load and Validate SSOT Data (DOWNLOAD_DEFINITIONS)
        // The data is directly imported, so we just need to validate it.
        const ssotDownloadDefs = DOWNLOAD_DEFINITIONS;
        const validationResult = DownloadDefinitionsSchema.safeParse(ssotDownloadDefs);
        if (!validationResult.success) {
            logger.error({ errors: validationResult.error.format(), collectionSlug, ssotPath: SSOT_FILE_PATH }, `Invalid SSOT data structure for ${collectionSlug}.`);
            throw new Error(`Invalid SSOT for ${collectionSlug}: ${validationResult.error.message}`);
        }
        const validatedDownloadDefs = validationResult.data;
        logger.info(`SSOT data for ${collectionSlug} (${SSOT_FILE_PATH}) validated successfully.`);
        for (const downloadDef of validatedDownloadDefs) {
            const ssotIdentifier = downloadDef.key; // Use the key as the SSOT identifier
            logger.debug({ ssotIdentifier, title: downloadDef.title }, `Processing ${collectionSlug} item...`);
            try {
                // 2. Prepare data for Payload
                const dataToCreate = {
                    id: downloadDef.id, // Use predefined UUID from SSOT
                    title: downloadDef.title,
                    slug: downloadDef.key, // Using key as slug for uniqueness and lookup
                    filename: downloadDef.filename,
                    url: downloadDef.url,
                    mimeType: downloadDef.type, // Assuming Payload uses mimeType field
                    alt: downloadDef.altText, // Assuming Payload uses 'alt' for alt text
                    width: downloadDef.width,
                    height: downloadDef.height,
                    // Add other core fields from downloadDef, respecting simplified schema from Phase 1
                    // NOTE: File upload itself is NOT handled here. This seeder assumes files are pre-uploaded
                    // and focuses on creating the database entry pointing to the file metadata.
                };
                // 3. "Create if not exists" logic (using predefined ID from SSOT)
                let liveDocId;
                try {
                    const newDoc = await payload.create({
                        collection: collectionSlug,
                        data: dataToCreate,
                    });
                    liveDocId = newDoc.id;
                    logger.info({ key: ssotIdentifier, dbId: liveDocId, ssotId: downloadDef.id }, `Created new ${collectionSlug} document.`);
                }
                catch (createError) {
                    // Check if it's a unique constraint violation on 'id' (meaning it likely exists)
                    if (createError.message && createError.message.includes('duplicate key value violates unique constraint') && createError.message.includes('_idx')) {
                        // Attempt to find by the predefined ID
                        logger.warn({ key: ssotIdentifier, id: downloadDef.id }, `Potential duplicate for ${collectionSlug}. Attempting to find by ID.`);
                        const existing = await payload.findByID({
                            collection: collectionSlug,
                            id: downloadDef.id,
                            depth: 0,
                        });
                        if (existing) {
                            liveDocId = existing.id;
                            logger.info({ key: ssotIdentifier, dbId: liveDocId }, `Found existing ${collectionSlug} document by ID. Will attempt update.`);
                            // Optionally update if needed, for now, just map ID
                            // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
                        }
                        else {
                            logger.error({ err: createError, key: ssotIdentifier, id: downloadDef.id }, `Create failed and could not find existing by ID for ${collectionSlug}.`);
                            throw createError;
                        }
                    }
                    else {
                        throw createError; // Re-throw other errors
                    }
                }
                idMap[ssotIdentifier] = liveDocId; // Map SSOT key to live UUID
                if (downloadDef.id && downloadDef.id !== liveDocId) {
                    // This case should ideally not happen if we force creation with SSOT ID
                    // or if findByID works. It's a safety log.
                    logger.warn({ ssotIdentifier, ssotId: downloadDef.id, liveId: liveDocId }, "SSOT ID and Live ID mismatch for download after seeding.");
                }
                else if (downloadDef.id) {
                    idMap[downloadDef.id] = liveDocId; // Also map SSOT UUID to live UUID if SSOT ID exists
                }
            }
            catch (itemError) {
                logger.error({ err: itemError, ssotIdentifier, collectionSlug }, `Failed to process item for ${collectionSlug}: ${ssotIdentifier}.`);
                throw itemError;
            }
        }
        logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length / (Object.values(idMap).some(id => id.includes('-')) ? 2 : 1)} unique items processed.`); // Adjust count if mapping both key and id
        return idMap;
    }
    catch (error) {
        logger.error({ err: error, collectionSlug }, `Error in seeder for ${collectionSlug}.`);
        throw error;
    }
}
//# sourceMappingURL=seed-downloads.js.map