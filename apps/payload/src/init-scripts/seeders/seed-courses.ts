import type { Payload } from 'payload';
import type { Logger } from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import yaml from 'js-yaml'; // Although quiz definitions are TS, yaml is imported in other seeders
import { z } from 'zod'; // Assuming Zod is used for schema validation
import type { Course } from '../../../payload-types.js'; // Assuming Payload generated types are available here

import { CourseDefinitionsSchema, type CourseDefinition } from '../data/schemas/course-definition.schema.js'; // Import course schema
import { generateSlug } from '../utils/slugify.js'; // Import slugify utility

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Course Definitions SSOT file
const SSOT_FILE_PATH = path.resolve(__dirname, '../data/definitions/course-definitions.yaml'); // Adjust filename/extension as needed


interface SeederArgs { /* Potentially specific args for this seeder */ }

export async function seedCourses(
  payload: Payload,
  logger: Logger,
  cliArgs: SeederArgs, // Or use the general Stage2Args
): Promise<Record<string, string | undefined>> {
  const collectionSlug = 'courses'; // Adjust collection slug if different
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string | undefined> = {}; // Maps SSOT course ID to live DB UUID

  try {
    // 1. Load and Validate SSOT Data
    let ssotCourses: any; // Use 'any' for initial load before validation
    try {
      const yamlFileContent = await fs.readFile(SSOT_FILE_PATH, 'utf-8');
      ssotCourses = yaml.load(yamlFileContent);
    } catch (readError: any) {
      logger.error({ err: readError, ssotPath: SSOT_FILE_PATH }, `Failed to read SSOT file for ${collectionSlug}.`);
      throw readError;
    }

    // Implement Zod validation using CourseDefinitionsSchema
    const validationResult = CourseDefinitionsSchema.safeParse(ssotCourses);
    if (!validationResult.success) {
      logger.error({ errors: validationResult.error.format(), collectionSlug, ssotPath: SSOT_FILE_PATH }, `Invalid SSOT data structure for ${collectionSlug}.`);
      throw new Error(`Invalid SSOT for ${collectionSlug}: ${validationResult.error.message}`);
    }
    const validatedCourses = validationResult.data;
    logger.info(`SSOT data for ${collectionSlug} (${SSOT_FILE_PATH}) validated successfully.`);


    for (const courseDef of validatedCourses as CourseDefinition[]) { // Explicitly assert type
      let ssotIdentifier = courseDef.slug || courseDef.id; // Define ssotIdentifier here
      const ssotId = courseDef.id; // Use the course ID as the SSOT identifier
      const itemTitle = courseDef.title;
      logger.debug({ ssotId, itemTitle }, `Processing ${collectionSlug} item...`);

      // Ensure ssotId is defined before proceeding
      if (!ssotId) {
          logger.warn({ itemTitle, collectionSlug }, `Skipping item with no SSOT ID.`);
          continue; // Skip to the next item
      }

      try {
        const slug = courseDef.slug || generateSlug(itemTitle);

        // 2. Prepare data for Payload
        const dataToCreate: Partial<Course> & { slug: string; title: string; status: 'published' | 'draft' } = { // Explicitly assert slug, title, and status
          id: ssotId, // Use the SSOT ID as the Payload document ID
          title: itemTitle,
          slug: slug,
          status: 'published', // Set a default status as it's required
          description: courseDef.description,
          // Add other core fields from courseDef, respecting simplified schema from Phase 1
          // Relationships (lessons) are handled in Stage 3.
          // Store relationship hints for Stage 3 if needed, e.g.:
          // lessons: courseDef.lessons, // Array of lesson keys/IDs
        };

        // 3. "Create if not exists" logic (using predefined ID or slug)
        let liveDocId: string | undefined;
        if (courseDef.id) {
             // Attempt to create using predefined ID
            try {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ slug: courseDef.slug, dbId: liveDocId, ssotId: courseDef.id }, `Created new ${collectionSlug} document with predefined ID.`);
            } catch (createError: any) {
                 // If create fails, try to find by predefined ID
                if (createError.message && createError.message.includes('duplicate key value violates unique constraint') && createError.message.includes('_idx')) {
                    logger.warn({ slug: courseDef.slug, id: courseDef.id }, `Potential duplicate for ${collectionSlug}. Attempting to find by ID.`);
                    const existing = await payload.findByID({
                        collection: collectionSlug,
                        id: courseDef.id,
                        depth: 0,
                    });
                    if (existing) {
                        liveDocId = existing.id;
                        logger.info({ slug: courseDef.slug, dbId: liveDocId }, `Found existing ${collectionSlug} document by ID. Will attempt update.`);
                        // Optionally update existing document
                        // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
                    } else {
                         logger.error({ err: createError, slug: courseDef.slug, id: courseDef.id }, `Create failed and could not find existing by ID for ${collectionSlug}.`);
                         throw createError;
                    }
                } else {
                    throw createError; // Re-throw other errors
                }
            }
        } else if (slug) { // Use the generated slug for lookup if no predefined ID
            // If no predefined ID, attempt to find/create by slug
            const existing = await payload.find({
                collection: collectionSlug,
                where: { slug: { equals: slug } },
                limit: 1,
                depth: 0,
            });

            if (existing.docs.length > 0) {
                liveDocId = existing.docs[0]?.id;
                logger.info({ slug: slug, dbId: liveDocId }, `Found existing ${collectionSlug} document by slug.`);
                // Optionally update existing document
                // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
            } else {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ slug: slug, dbId: liveDocId }, `Created new ${collectionSlug} document.`);
            }
        } else {
             logger.error({ courseDef }, `Course definition is missing both 'id' and 'slug', and title cannot generate a slug. Cannot process.`);
             throw new Error(`Course definition is missing both 'id' and 'slug', and title cannot generate a slug.`);
        }


        idMap[ssotIdentifier] = liveDocId; // Map SSOT identifier to live UUID
        if(courseDef.id && courseDef.id !== liveDocId) {
           // This case should ideally not happen if we force creation with SSOT ID
           // or if findByID works. It's a safety log.
           logger.warn({ssotIdentifier, ssotId: courseDef.id, liveId: liveDocId}, "SSOT ID and Live ID mismatch for course after seeding.");
        } else if (courseDef.id) {
           idMap[courseDef.id] = liveDocId; // Also map SSOT UUID to live UUID if SSOT ID exists
        }


      } catch (itemError) {
        logger.error({ err: itemError, ssotIdentifier, collectionSlug }, `Failed to process item for ${collectionSlug}: ${ssotIdentifier}.`);
        throw itemError;
      }
    }

    logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length / (Object.values(idMap).some(id => id?.includes('-')) ? 2 : 1) } unique items processed.`); // Adjust count if mapping both key and id
    return idMap;
  } catch (error) {
    logger.error({ err: error, collectionSlug }, `Error in seeder for ${collectionSlug}.`);
    throw error;
  }
}
