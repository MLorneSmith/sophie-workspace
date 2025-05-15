import type { Payload, SanitizedConfig } from 'payload';
import type { Logger as PinoLogger } from 'pino';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml'; // Although quiz definitions are TS, yaml is imported in other seeders
import { z } from 'zod'; // Assuming Zod is used for schema validation
import type { CourseLesson } from '../../../payload-types.js'; // Assuming Payload generated types are available here

import { LessonDefinitionsSchema, type LessonDefinition } from '../data/schemas/lesson-definition.schema.js'; // Import lesson schema
import { generateSlug } from '../utils/slugify.js'; // Import slugify utility
import { markdownToLexical } from '../utils/markdown-to-lexical.js'; // Import the new converter

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the Lesson Definitions SSOT file
const SSOT_FILE_PATH = path.resolve(__dirname, '../data/definitions/lesson-definitions.yaml'); // Define SSOT_FILE_PATH

// Base path for raw lesson content files
const RAW_CONTENT_BASE_PATH = path.resolve(__dirname, '../data/raw/courses/lessons');


interface SeederArgs { /* Potentially specific args for this seeder */ }

export async function seedCourseLessons(
  payload: Payload,
  logger: PinoLogger,
  cliArgs: SeederArgs, // Or use the general Stage2Args
  config: SanitizedConfig, // Add Payload config parameter
): Promise<Record<string, string | undefined>> {
  const collectionSlug = 'course_lessons'; // Corrected slug
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string | undefined> = {}; // Maps SSOT lesson identifier (e.g., slug) to live DB UUID

  try {
    // 1. Load and Validate SSOT Data
    let ssotLessonDefs: any; // Use 'any' for initial load before validation
    try {
      const yamlFileContent = await fs.readFile(SSOT_FILE_PATH, 'utf-8');
      ssotLessonDefs = yaml.load(yamlFileContent);
    } catch (readError: any) {
      logger.error({ err: readError, ssotPath: SSOT_FILE_PATH }, `Failed to read SSOT file for ${collectionSlug}.`);
      throw readError;
    }

    // Implement Zod validation using LessonDefinitionsSchema
    const validationResult = LessonDefinitionsSchema.safeParse(ssotLessonDefs);
    if (!validationResult.success) {
      logger.error({ errors: validationResult.error.format(), collectionSlug, ssotPath: SSOT_FILE_PATH }, `Invalid SSOT data structure for ${collectionSlug}.`);
      throw new Error(`Invalid SSOT for ${collectionSlug}: ${validationResult.error.message}`);
    }
    const validatedLessonDefs = validationResult.data;
    logger.info(`SSOT data for ${collectionSlug} (${SSOT_FILE_PATH}) validated successfully.`);


    for (const lessonDef of validatedLessonDefs as LessonDefinition[]) { // Explicitly assert type
      // Determine the SSOT identifier (e.g., slug or predefined ID)
      const ssotIdentifier = lessonDef.slug || lessonDef.id; // Placeholder

      logger.debug({ ssotIdentifier, title: lessonDef.title }, `Processing ${collectionSlug} item...`);

      // Ensure slug is always present
      const lessonSlug = lessonDef.slug || generateSlug(lessonDef.title);

      try {
        // 2. Prepare data for Payload
        // 2a. Load and convert raw content if specified
        let lexicalContent: any | undefined; // TODO: Replace 'any' with actual Lexical JSON type
        if (lessonDef.content_file) {
          const mdocFilePath = path.resolve(RAW_CONTENT_BASE_PATH, lessonDef.content_file);
          try {
            const markdownContent = await fs.readFile(mdocFilePath, 'utf-8');
            lexicalContent = await markdownToLexical(markdownContent, config); // Use the new utility and pass config
          } catch (mdocError: any) {
            logger.warn({ err: mdocError, mdocFilePath }, `Could not read or convert mdoc file for lesson ${lessonDef.title}. Content will be empty.`);
          }
        }

        const dataToCreate: Partial<CourseLesson> & { slug: string; title: string; status: 'published' | 'draft'; lesson_number: number } = { // Explicitly assert slug, title, status, and lesson_number
          id: lessonDef.id, // Use predefined UUID if available
          title: lessonDef.title!, // Add non-null assertion
          slug: lessonSlug, // Use generated slug if original is missing
          lesson_number: lessonDef.lesson_number!, // Include lesson_number from SSOT and add non-null assertion
          description: lessonDef.description,
          content: lexicalContent || undefined, // Seed converted Lexical content
          status: 'published', // Set a default status as it's required
          // Add other core fields from lessonDef, respecting simplified schema from Phase 1
          // Relationships (course, quiz, downloads) are handled in Stage 3.
          // Store relationship hints for Stage 3 if needed, e.g.:
          // course: lessonDef.course_id,
          // quiz: lessonDef.quiz_id,
          // downloads: lessonDef.downloads, // Array of download keys/IDs
        };

        // 3. "Create if not exists" logic (using predefined ID or slug)
        let liveDocId: string | undefined;
        if (lessonDef.id) {
             // Attempt to create using predefined ID
            try {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ slug: lessonDef.slug, dbId: liveDocId, ssotId: lessonDef.id }, `Created new ${collectionSlug} document with predefined ID.`);
            } catch (createError: any) {
                 // If create fails, try to find by predefined ID
                if (createError.message && createError.message.includes('duplicate key value violates unique constraint') && createError.message.includes('_idx')) {
                    logger.warn({ slug: lessonDef.slug, id: lessonDef.id }, `Potential duplicate for ${collectionSlug}. Attempting to find by ID.`);
                    const existing = await payload.findByID({
                        collection: collectionSlug,
                        id: lessonDef.id,
                        depth: 0,
                    });
                    if (existing) {
                        liveDocId = existing.id;
                        logger.info({ slug: lessonDef.slug, dbId: liveDocId }, `Found existing ${collectionSlug} document by ID. Will attempt update.`);
                        // Optionally update existing document
                        // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
                    } else {
                         logger.error({ err: createError, slug: lessonDef.slug, id: lessonDef.id }, `Create failed and could not find existing by ID for ${collectionSlug}.`);
                         throw createError;
                    }
                } else {
                    throw createError; // Re-throw other errors
                }
            }
        } else if (lessonSlug) { // Use the generated slug for lookup if no predefined ID
            // If no predefined ID, attempt to find/create by slug
            const existing = await payload.find({
                collection: collectionSlug,
                where: { slug: { equals: lessonSlug } },
                limit: 1,
                depth: 0,
            });

            if (existing.docs.length > 0) {
                liveDocId = existing.docs[0]?.id;
                logger.info({ slug: lessonSlug, dbId: liveDocId }, `Found existing ${collectionSlug} document by slug.`);
                // Optionally update existing document
                // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
            } else {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ slug: lessonSlug, dbId: liveDocId }, `Created new ${collectionSlug} document.`);
            }
        } else {
             logger.error({ lessonDef }, `Lesson definition is missing both 'id' and 'slug', and title cannot generate a slug. Cannot process.`);
             throw new Error(`Lesson definition is missing both 'id' and 'slug', and title cannot generate a slug.`);
        }


        idMap[ssotIdentifier] = liveDocId; // Map SSOT identifier to live UUID
        if(lessonDef.id && lessonDef.id !== liveDocId) {
           // This case should ideally not happen if we force creation with SSOT ID
           // or if findByID works. It's a safety log.
           logger.warn({ssotIdentifier, ssotId: lessonDef.id, liveId: liveDocId}, "SSOT ID and Live ID mismatch for lesson after seeding.");
        } else if (lessonDef.id) {
           idMap[lessonDef.id] = liveDocId; // Also map SSOT UUID to live UUID if SSOT ID exists
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
