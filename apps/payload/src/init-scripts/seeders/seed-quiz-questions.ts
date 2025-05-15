import type { Payload } from 'payload';
import type { Logger as PinoLogger } from 'pino';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml'; // Although quiz definitions are TS, yaml is imported in other seeders
import { z } from 'zod'; // Assuming Zod is used for schema validation
import type { QuizQuestion } from '../../../payload-types.js'; // Assuming Payload generated types are available here

// Import the Zod schema and type for Quiz Definitions
import { QuizzesSchema, type QuizDefinition, type QuizQuestionDefinition } from '../data/schemas/quiz-definition.schema.js';
import { QUIZZES } from '../data/definitions/quiz-definitions.js'; // Import the SSOT data

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the Quiz Definitions SSOT file (for reference in logging)
const SSOT_FILE_PATH = path.resolve(__dirname, '../data/definitions/quiz-definitions.ts');


export async function seedQuizQuestions(
  payload: Payload,
  logger: PinoLogger,
  cliArgs: any, // TODO: Define a specific type for cliArgs if needed
): Promise<Record<string, string | undefined>> {
  const collectionSlug = 'quiz_questions'; // Corrected slug
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string | undefined> = {}; // Maps SSOT question ID to live DB UUID
  const processedQuestionIds = new Set<string>(); // To avoid processing duplicate questions if they appear in multiple quizzes

  try {
    // 1. Load and Validate SSOT Data (Quiz Definitions)
    // The data is directly imported, so we just need to validate it.
    const ssotQuizzes = QUIZZES;

    const validationResult = QuizzesSchema.safeParse(ssotQuizzes);
    if (!validationResult.success) {
      logger.error({ errors: validationResult.error.format(), collectionSlug, ssotPath: SSOT_FILE_PATH }, `Invalid SSOT data structure for ${collectionSlug}.`);
      throw new Error(`Invalid SSOT for ${collectionSlug}: ${validationResult.error.message}`);
    }
    const validatedQuizzes = validationResult.data;
    logger.info(`SSOT data for ${collectionSlug} (${SSOT_FILE_PATH}) validated successfully.`);

    // Iterate through each quiz and then each question within the quiz
    for (const quizSlug in validatedQuizzes) {
      const quizDef = validatedQuizzes[quizSlug];
      if (!quizDef) { // Add null/undefined check for quizDef
        logger.warn({ quizSlug }, `Skipping undefined quiz definition for slug: ${quizSlug}`);
        continue;
      }
      logger.debug({ quizSlug: quizDef.slug, quizId: quizDef.id }, `Processing questions for quiz: ${quizDef.title}`);

      for (const questionDef of quizDef.questions) {
        const ssotIdentifier = questionDef.id; // Use the question ID as the SSOT identifier

        // Skip if this question has already been processed
        if (processedQuestionIds.has(ssotIdentifier)) {
          logger.debug({ ssotIdentifier, questionSlug: questionDef.questionSlug }, `Skipping already processed question: ${questionDef.questionSlug}`);
          continue;
        }

        logger.debug({ ssotIdentifier, questionSlug: questionDef.questionSlug }, `Processing quiz question: ${questionDef.questionSlug}`);

        try {
          // 2. Prepare data for Payload, use any to bypass strict type checking for this object
          const dataToCreate: any = {
            id: questionDef.id, // Use predefined UUID from SSOT
            title: questionDef.text.substring(0, 100) + '...', // Use question text as title (truncated)
            slug: questionDef.questionSlug, // Use question slug from SSOT
            status: 'published', // Set a default status as it's required
            question: questionDef.text!, // Include the full question text, use 'question' field name, add non-null assertion
            options: (questionDef.options ?? [] as Array<{ text: string; isCorrect?: boolean | null | undefined }>).map(option => ({ // Map options to Payload's expected format, add type assertion for options array
                  text: option.text,
                  isCorrect: option.isCorrect,
              })) as Array<{ text: string; isCorrect?: boolean | null | undefined }>, // Explicitly cast the mapped array
            explanation: questionDef.explanation! as any, // Lexical JSON object - Cast to any
            // Add other core fields from questionDef, respecting simplified schema from Phase 1
          };

          // 3. "Create if not exists" logic (using predefined ID or slug)
          let liveDocId: string | undefined;
          if (questionDef.id) {
               // Attempt to create using predefined ID
              try {
                  const newDoc = await payload.create({
                      collection: collectionSlug,
                      data: dataToCreate,
                  });
                  liveDocId = newDoc.id;
                  logger.info({ slug: questionDef.questionSlug, dbId: liveDocId, ssotId: questionDef.id }, `Created new ${collectionSlug} document with predefined ID.`);
              } catch (createError: any) {
                   // If create fails, try to find by predefined ID
                  if (createError.message && createError.message.includes('duplicate key value violates unique constraint') && createError.message.includes('_idx')) {
                      logger.warn({ slug: questionDef.questionSlug, id: questionDef.id }, `Potential duplicate for ${collectionSlug}. Attempting to find by ID.`);
                      const existing = await payload.findByID({
                          collection: collectionSlug,
                          id: questionDef.id,
                          depth: 0,
                      });
                      if (existing) {
                          liveDocId = existing.id;
                          logger.info({ slug: questionDef.questionSlug, dbId: liveDocId }, `Found existing ${collectionSlug} document by ID. Will attempt update.`);
                          // Optionally update existing document
                          // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
                      } else {
                             logger.error({ err: createError, slug: questionDef.questionSlug, id: questionDef.id }, `Create failed and could not find existing by ID for ${collectionSlug}.`);
                             throw createError;
                        }
                    } else {
                        throw createError; // Re-throw other errors
                    }
                }
            } else if (questionDef.questionSlug) {
                // If no predefined ID, attempt to find/create by slug
                const existing = await payload.find({
                    collection: collectionSlug,
                    where: { slug: { equals: questionDef.questionSlug } },
                    limit: 1,
                    depth: 0,
                });

                if (existing.docs.length > 0) {
                    liveDocId = existing.docs[0]?.id;
                    logger.info({ slug: questionDef.questionSlug, dbId: liveDocId }, `Found existing ${collectionSlug} document by slug.`);
                    // Optionally update existing document
                    // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
                } else {
                    const newDoc = await payload.create({
                        collection: collectionSlug,
                        data: dataToCreate,
                    });
                    liveDocId = newDoc.id;
                    logger.info({ slug: questionDef.questionSlug, dbId: liveDocId }, `Created new ${collectionSlug} document.`);
                }
            } else {
                 logger.error({ questionDef }, `Question definition is missing both 'id' and 'questionSlug'. Cannot process.`);
                 throw new Error(`Question definition is missing both 'id' and 'questionSlug'.`);
            }


          idMap[ssotIdentifier] = liveDocId; // Map SSOT identifier (question ID) to live UUID
          if(questionDef.id && questionDef.id !== liveDocId) {
             // This case should ideally not happen if we force creation with SSOT ID
             // or if findByID works. It's a safety log.
             logger.warn({ssotIdentifier, ssotId: questionDef.id, liveId: liveDocId}, "SSOT ID and Live ID mismatch for question after seeding.");
          } else if (questionDef.id) {
             idMap[questionDef.id] = liveDocId; // Also map SSOT UUID to live UUID if SSOT ID exists
          }

          processedQuestionIds.add(ssotIdentifier); // Mark question as processed

        } catch (itemError) {
          logger.error({ err: itemError, ssotIdentifier, collectionSlug }, `Failed to process item for ${collectionSlug}: ${ssotIdentifier}.`);
          throw itemError;
        }
      }
    }


    logger.info(`Seeder for collection: ${collectionSlug} completed. ${processedQuestionIds.size} unique items processed.`);
    return idMap;
  } catch (error) {
    logger.error({ err: error, collectionSlug }, `Error in seeder for ${collectionSlug}.`);
    throw error;
  }
}
