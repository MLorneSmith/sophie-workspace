// seed-survey-questions.ts
// Script for Stage 2: Core Content Seeding - Survey Questions
import crypto from 'crypto';
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';

import { generateSlug } from '../src/utils/slugify.js';

console.log('Current working directory:', process.cwd());

// Define the path to the raw survey YAML files relative to the package directory
const surveysRawPath = path.join(process.cwd(), 'data/raw/surveys');

console.log('Resolved surveysRawPath:', surveysRawPath);

console.log('Starting Stage 2: Seed Survey Questions...');

// Helper function to generate a consistent ID for a survey question
function generateQuestionId(
  surveySlug: string,
  questionText: string,
  index: number,
): string {
  // Use a combination of survey slug, question text (truncated), and index
  // to create a unique and consistent identifier.
  // Using crypto.createHash for a more robust ID than simple concatenation.
  const identifier = `${surveySlug}-${questionText.substring(0, 100)}-${index}`;
  return crypto.createHash('sha1').update(identifier).digest('hex');
}

export async function seedSurveyQuestions(payload: Payload) {
  try {
    console.log('Executing: Seed Survey Questions (via orchestrator)...');
    console.log(
      'Contents of surveysRawPath (inside async):',
      fs.readdirSync(surveysRawPath),
    );

    // Find all survey YAML files
    const surveyFiles = glob.sync(surveysRawPath.replace(/\\/g, '/') + '/*');

    console.log('Files found by glob:', surveyFiles);
    console.log(`Found ${surveyFiles.length} survey files.`);

    for (const filePath of surveyFiles) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const surveyData = yaml.load(fileContent) as any; // Cast to any for now

      // Ensure surveyData has a slug (should be added to raw data files)
      if (!surveyData.slug) {
        console.error(
          `Skipping survey questions for "${surveyData.title}" due to missing slug in raw data.`,
        );
        continue; // Skip this survey if slug is missing
      }

      if (surveyData.questions && Array.isArray(surveyData.questions)) {
        console.log(
          `Processing questions for survey: ${surveyData.title} (${surveyData.slug})`,
        );

        for (const [index, questionData] of surveyData.questions.entries()) {
          const questionId = generateQuestionId(
            surveyData.slug,
            questionData.question,
            index,
          );

          console.log(
            `[Seeder] Generating ID for Survey: "${surveyData.slug}", Question Text: "${questionData.question}", Index: ${index}, Generated ID: ${questionId}`,
          ); // DEBUG LOG

          // Generate a slug for the question
          const questionSlug = generateSlug(questionData.question);

          try {
            // Check if question already exists by the generated slug
            const existingQuestion = await payload.find({
              collection: 'survey_questions',
              where: {
                questionSlug: {
                  // Use camelCase field name from collection config
                  equals: questionSlug,
                },
              },
            });

            if (existingQuestion.docs.length === 0) {
              // Question does not exist, create it

              // Determine the correct Payload question type based on YAML data
              let payloadQuestionType = questionData.type;

              // Transform answers into the expected JSONB format for options
              let transformedOptions: { option: string }[] = [];
              if (questionData.answers && Array.isArray(questionData.answers)) {
                transformedOptions = questionData.answers.map(
                  (answerObject: { answer: string }) => {
                    return {
                      option: answerObject.answer, // Map 'answer' from SSOT to 'option' in Payload
                    };
                  },
                );
              }

              // Special handling for 'self-assessment' survey questions if type is not specified
              if (
                surveyData.slug === 'self-assessment' &&
                !payloadQuestionType
              ) {
                payloadQuestionType = 'scale'; // Default to 'scale' type
                // Provide default scale options if none are present in raw data
                if (transformedOptions.length === 0) {
                  transformedOptions = [
                    { option: '1 - Strongly Disagree' },
                    { option: '2 - Disagree' },
                    { option: '3 - Neutral' },
                    { option: '4 - Agree' },
                    { option: '5 - Strongly Agree' },
                  ];
                }
              }

              // Map questioncategory to category
              const category = questionData.questioncategory;

              // Map questionspin to position (assuming questionspin is intended as order/position)
              const position = parseInt(questionData.questionspin, 10); // Assuming questionspin is a number string

              const questionPayloadData: any = {
                // id: questionId, // Let Payload generate the UUID
                questionSlug: questionSlug, // Include the generated slug
                text: questionData.question, // Use 'text' field as per schema
                type:
                  payloadQuestionType === 'textarea'
                    ? 'text_field'
                    : payloadQuestionType, // Use the determined Payload type
                description: questionData.description || null, // Include description if available
                required: questionData.required || false, // Include required if available, default to false
                category: category, // Use mapped category
                position: isNaN(position) ? 0 : position, // Use parsed position or default to 0
                // surveys relationship will be populated in Stage 3
              };

              // Include options based on type, only if the type requires them AND options were found
              if (
                (payloadQuestionType === 'multiple_choice' ||
                  payloadQuestionType === 'scale') &&
                transformedOptions.length > 0
              ) {
                questionPayloadData.options = transformedOptions;
              } else if (
                (payloadQuestionType === 'multiple_choice' ||
                  payloadQuestionType === 'scale') &&
                transformedOptions.length === 0
              ) {
                console.warn(
                  `Question "${questionData.question.substring(0, 50)}..." (ID: ${questionId}) is of type "${payloadQuestionType}" but has no options defined in the raw data. Not including an options array.`,
                );
              }

              console.log(
                'Payload data for question:',
                JSON.stringify(questionPayloadData, null, 2),
              );
              console.log(
                `[Seeder] Attempting to create question with ID: ${questionId} and slug: ${questionSlug}`,
              ); // DEBUG LOG

              await payload.create({
                collection: 'survey_questions',
                data: questionPayloadData,
              });
              console.log(
                `Created Survey Question: ${questionData.question.substring(0, 50)}... (ID: ${questionId})`,
              );
            } else {
              console.log(
                `Survey Question already exists, skipping creation: ${questionData.question.substring(0, 50)}... (ID: ${questionId})`,
              );
              // Optionally, update the existing question if needed
              // This would be more complex as we'd need to match based on question text and potentially survey relationship (which isn't populated yet)
            }
          } catch (error: any) {
            console.error(
              `Error processing Survey Question "${questionData.question.substring(0, 50)}..." (ID: ${questionId}):`,
              error.message,
            );
            // Continue with other questions
          }
        }
      } else {
        console.warn(
          `Survey "${surveyData.title}" has no questions array or it is not an array.`,
        );
      }
    }

    console.log('Survey Questions seeding completed.');
  } catch (error: any) {
    console.error('Error during Seed Survey Questions process:', error.message);
    throw error; // Re-throw to be caught by the orchestrator
  }
}
