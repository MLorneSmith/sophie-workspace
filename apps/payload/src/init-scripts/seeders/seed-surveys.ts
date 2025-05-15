import type { Payload, SanitizedConfig } from 'payload';
import type { Logger } from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import * as fsSync from 'fs'; // Import synchronous fs for existsSync
import yaml from 'js-yaml'; // Assuming SSOT is YAML, adjust if needed
import { z } from 'zod';

import { SurveyDefinitionsSchema } from '../data/schemas/survey-definition.schema.js';
import { markdownToLexical } from '../utils/markdown-to-lexical.js'; // Markdown to Lexical converter
import { generateSlug } from '../utils/slugify.js'; // Assuming slugify utility exists

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the surveys SSOT data
const SURVEYS_SSOT_PATH = path.resolve(__dirname, '../data/definitions/survey-definitions.yaml'); // Adjust filename/extension as needed

interface SeederArgs { /* Potentially specific args for this seeder */ }

export async function seedSurveys(
  payload: Payload,
  logger: Logger,
  cliArgs: SeederArgs, // Or use the general Stage2Args
  config: SanitizedConfig, // Add Payload config parameter
): Promise<Record<string, string | undefined>> {
  const collectionSlug = 'surveys'; // Adjust collection slug if different
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string | undefined> = {};

  // 1. Load and Validate SSOT Data
  let ssotSurveys: z.infer<typeof SurveyDefinitionsSchema>;
  try {
    logger.debug(`Attempting to read SSOT file from: ${SURVEYS_SSOT_PATH}`);
    if (!fsSync.existsSync(SURVEYS_SSOT_PATH)) {
      logger.error(`File not found at expected path: ${SURVEYS_SSOT_PATH}`);
      // Optionally throw a more specific error or handle differently
    }
    const fileContent = await fs.readFile(SURVEYS_SSOT_PATH, 'utf-8');
    // Assuming YAML, adjust loader if JSON or other format
    const rawData = yaml.load(fileContent);
    logger.debug('Raw YAML data:', rawData);

    logger.debug('Data being parsed by Zod:', rawData);
    ssotSurveys = SurveyDefinitionsSchema.parse(rawData);
    logger.info(`SSOT data for ${collectionSlug} validated successfully.`);
  } catch (error) {
    logger.error({ err: error, collectionSlug, path: SURVEYS_SSOT_PATH }, `Invalid SSOT data structure or file not found for ${collectionSlug}.`);
    throw error; // Propagate error
  }

  for (const surveyData of ssotSurveys) {
    const ssotId = surveyData.id;
    const itemTitle = surveyData.title;
    logger.debug({ ssotId, itemTitle }, `Processing ${collectionSlug} item...`);

    // Ensure ssotId is defined before proceeding
    if (!ssotId) {
        logger.warn({ itemTitle, collectionSlug }, `Skipping item with no SSOT ID.`);
        continue; // Skip to the next item
    }

    try {
      const slug = surveyData.slug || generateSlug(itemTitle);

      // 2. Convert Markdoc content to Lexical JSON for description/introduction if applicable
      // Assuming survey data might have a description or introduction field that uses Markdoc
      const descriptionContent = surveyData.description ? await markdownToLexical(surveyData.description, config) : null;
      const introductionContent = surveyData.introduction ? await markdownToLexical(surveyData.introduction, config) : null;


      // 3. Prepare data for Payload
      const dataToCreate: any = { // Use 'any' temporarily until types are clearer
        id: ssotId, // Use the SSOT ID as the Payload document ID
        title: itemTitle,
        slug: slug,
        status: surveyData.status,
        description: descriptionContent, // Lexical JSON content
        introduction: introductionContent, // Lexical JSON content
        // Add other core fields based on your Payload collection definition
      };

      // 4. "Create if not exists" logic (by slug or ID)
      let liveDocId: string | undefined;
      const existing = await payload.find({
        collection: collectionSlug,
        where: {
           or: [
            { slug: { equals: slug } },
            { id: { equals: ssotId } } // Check by SSOT ID as well
           ]
        },
        limit: 1,
        depth: 0,
      });

      if (existing.docs.length > 0) {
        liveDocId = existing.docs[0]?.id;
        logger.info({ slug, liveDocId }, `Found existing ${collectionSlug} document.`);
        // Optionally, update existing document if needed
        // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
      } else {
        const newDoc = await payload.create({
          collection: collectionSlug,
          data: dataToCreate,
        });
        liveDocId = newDoc.id;
        logger.info({ slug, liveDocId }, `Created new ${collectionSlug} document.`);
      }

      idMap[ssotId] = liveDocId;

    } catch (itemError) {
      logger.error({ err: itemError, ssotId, itemTitle, collectionSlug }, `Failed to process item for ${collectionSlug}.`);
      throw itemError; // Propagate error
    }
  }

  logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length} items processed.`);
  return idMap;
}
