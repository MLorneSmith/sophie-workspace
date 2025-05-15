import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import yaml from 'js-yaml'; // Assuming SSOT is YAML, adjust if needed
import { z } from 'zod';
import { SurveyQuestionSchema } from '../data/schemas/survey-definition.schema.js'; // Assuming question schema is in survey schema file
// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to the survey questions SSOT data
const SURVEY_QUESTIONS_SSOT_PATH = path.resolve(__dirname, '../data/definitions/survey-question-definitions.yaml'); // Adjust filename/extension as needed
export async function seedSurveyQuestions(payload, logger, cliArgs) {
    const collectionSlug = 'survey_questions'; // Adjust collection slug if different
    logger.info(`Starting seeder for collection: ${collectionSlug}...`);
    const idMap = {};
    // 1. Load and Validate SSOT Data
    // Assuming the SSOT is an array of survey question objects
    let ssotSurveyQuestions;
    try {
        const fileContent = await fs.readFile(SURVEY_QUESTIONS_SSOT_PATH, 'utf-8');
        // Assuming YAML, adjust loader if JSON or other format
        const rawData = yaml.load(fileContent);
        // Validate as an array of SurveyQuestionSchema
        ssotSurveyQuestions = z.array(SurveyQuestionSchema).parse(rawData);
        logger.info(`SSOT data for ${collectionSlug} validated successfully.`);
    }
    catch (error) {
        logger.error({ err: error, collectionSlug, path: SURVEY_QUESTIONS_SSOT_PATH }, `Invalid SSOT data structure or file not found for ${collectionSlug}.`);
        throw error; // Propagate error
    }
    for (const questionData of ssotSurveyQuestions) {
        const ssotId = questionData.id;
        const itemLabel = questionData.label; // Using label as a descriptive field
        logger.debug({ ssotId, itemLabel }, `Processing ${collectionSlug} item...`);
        // Ensure ssotId is defined before proceeding
        if (!ssotId) {
            logger.warn({ itemLabel, collectionSlug }, `Skipping item with no SSOT ID.`);
            continue; // Skip to the next item
        }
        try {
            // Survey questions might not have slugs, using ID as primary identifier
            // If a slug is needed, generate one from the label
            // 2. Convert Markdoc content to Lexical JSON for any rich text fields if applicable
            // Assuming survey questions might have a text field that uses Markdoc (e.g., a detailed prompt)
            // const promptContent = questionData.prompt ? await markdocToLexical(questionData.prompt) : null;
            // 3. Prepare data for Payload
            const dataToCreate = {
                id: ssotId, // Use the SSOT ID as the Payload document ID
                type: questionData.type,
                label: itemLabel,
                required: questionData.required,
                options: questionData.options,
                // prompt: promptContent, // Lexical JSON content if applicable
                // Add other core fields based on your Payload collection definition
            };
            // 4. "Create if not exists" logic (by ID)
            let liveDocId;
            const existing = await payload.find({
                collection: collectionSlug,
                where: {
                    id: { equals: ssotId } // Check by SSOT ID
                },
                limit: 1,
                depth: 0,
            });
            if (existing.docs.length > 0) {
                liveDocId = existing.docs[0]?.id;
                logger.info({ liveDocId }, `Found existing ${collectionSlug} document.`);
                // Optionally, update existing document if needed
                // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
            }
            else {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ ssotId, liveDocId }, `Created new ${collectionSlug} document.`);
            }
            idMap[ssotId] = liveDocId;
        }
        catch (itemError) {
            logger.error({ err: itemError, ssotId, itemLabel, collectionSlug }, `Failed to process item for ${collectionSlug}.`);
            throw itemError; // Propagate error
        }
    }
    logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length} items processed.`);
    return idMap;
}
//# sourceMappingURL=seed-survey-questions.js.map