import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';

// Added Payload type import
import { generateSlug } from '../src/utils/slugify.js';

// Removed: import { getPayloadClient } from './payload-client';

// Use import.meta.url for ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const surveysRawPath = path.resolve(__dirname, '../data/raw/surveys'); // Path to survey YAML files

export async function populateSurveyQuestionRelationships(payload: Payload) {
  // Added payload parameter
  console.log('Populating Survey <-> SurveyQuestions relationships...');
  // Removed: const payloadClient = await getPayloadClient(true);

  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  try {
    // Get list of survey YAML files
    const surveyFiles = fs
      .readdirSync(surveysRawPath)
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));

    // Iterate through each survey file
    for (const surveyFile of surveyFiles) {
      const filePath = path.join(surveysRawPath, surveyFile);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      // Parse YAML content
      const surveyData = yaml.load(fileContents) as any; // Use 'any' or define a type

      if (!surveyData || !surveyData.slug || !surveyData.questions) {
        console.warn(
          `Skipping file ${surveyFile}: Missing slug or questions array in YAML data.`,
        );
        errorCount++;
        continue;
      }

      const surveySlug = surveyData.slug;
      const questionsFromYaml = surveyData.questions as any[]; // Array of question objects from YAML

      if (questionsFromYaml.length === 0) {
        console.log(
          `Survey "${surveySlug}" has no questions defined in YAML. Skipping relationship update.`,
        );
        continue;
      }

      let surveyId: string | undefined;
      const foundQuestionIds: string[] = [];

      try {
        // 1. Find the survey document by slug
        const surveyResult = await payload.find({
          // Changed payloadClient to payload
          collection: 'surveys', // Use actual collection slug for Surveys
          where: { slug: { equals: surveySlug } },
          limit: 1,
        });

        if (!surveyResult.docs || surveyResult.docs.length === 0) {
          console.warn(
            `Skipping relation: Could not find survey document with slug "${surveySlug}".`,
          );
          errorCount++;
          continue;
        }
        const foundSurvey = surveyResult.docs[0];

        if (!foundSurvey || typeof foundSurvey.id !== 'string') {
          console.warn(
            `Skipping relation: Found survey docs array is empty or has invalid ID for slug "${surveySlug}".`,
          );
          errorCount++;
          continue;
        }
        surveyId = foundSurvey.id;

        // 2. Find the *current* IDs for each question associated with this survey
        for (const questionYaml of questionsFromYaml) {
          // const questionSlug = questionYaml.questionSlug; // Old: Read from YAML
          const questionSlug = generateSlug(questionYaml.question); // New: Generate from text

          if (!questionSlug) {
            console.warn(
              `   Question in survey "${surveySlug}" is missing 'questionSlug'. Skipping.`,
            );
            notFoundCount++;
            continue;
          }

          try {
            const questionResult = await payload.find({
              // Changed payloadClient to payload
              collection: 'survey_questions', // Use correct collection slug
              where: { questionSlug: { equals: questionSlug } }, // Find by questionSlug
              limit: 1,
              depth: 0,
            });

            if (questionResult.docs && questionResult.docs.length > 0) {
              const questionId = questionResult.docs[0]?.id;
              if (
                typeof questionId === 'string' ||
                typeof questionId === 'number'
              ) {
                foundQuestionIds.push(String(questionId)); // Push string ID directly
              } else {
                console.warn(
                  `   Found survey question document for slug "${questionSlug}" but it has an invalid ID.`,
                );
                notFoundCount++;
              }
            } else {
              console.warn(
                `   Could not find survey question document with slug "${questionSlug}" for survey "${surveySlug}". Skipping this question.`,
              );
              notFoundCount++;
            }
          } catch (findError: any) {
            console.error(
              `   Error finding survey question with slug "${questionSlug}" for survey "${surveySlug}":`,
              findError.message,
            );
            errorCount++;
          }
        }

        // 3. Update the survey document if we found any valid question IDs AND we have a valid surveyId
        if (surveyId && foundQuestionIds.length > 0) {
          const questionsToLink = foundQuestionIds; // Already in correct format

          console.log(
            `   Updating survey ${surveyId} with ${foundQuestionIds.length} found questions:`,
            JSON.stringify(questionsToLink, null, 2),
          );

          await payload.update({
            // Changed payloadClient to payload
            collection: 'surveys', // Update the survey document
            id: surveyId,
            data: {
              questions: questionsToLink, // Use the correct relationship field name 'questions'
            },
            depth: 0,
          });

          console.log(
            `Successfully linked ${foundQuestionIds.length} questions to Survey (Slug: ${surveySlug}, ID: ${surveyId}).`,
          );
          successCount++;
        } else {
          console.log(
            `No valid question IDs found for survey "${surveySlug}". Skipping update.`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error processing relationships for Survey (${surveySlug}):`,
          error.message,
        );
        errorCount++; // Increment error count for the survey processing failure
      }
    }

    console.log(
      `Survey <-> SurveyQuestions relationships population complete. Successful: ${successCount}, Failed: ${errorCount}, Questions not found: ${notFoundCount}.`,
    );
    if (errorCount > 0 || notFoundCount > 0) {
      console.warn(
        `There were ${errorCount} errors and ${notFoundCount} questions not found during relationship population.`,
      );
    }
  } catch (error: any) {
    console.error('Error processing survey files for relationships:', error);
    throw error; // Re-throw error to be caught by run-stage-3.ts
  }
  if (errorCount > 0 || notFoundCount > 0) {
    throw new Error(
      `populateSurveyQuestionRelationships encountered ${errorCount} errors and ${notFoundCount} items not found.`,
    );
  }
}

// Removed direct execution block
// populateSurveyQuestionRelationships().catch((err) => {
//   console.error('Script failed:', err);
//   process.exit(1);
// });
