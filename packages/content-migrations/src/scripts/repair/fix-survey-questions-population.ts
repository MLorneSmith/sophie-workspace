/**
 * Fix Survey Questions Population
 *
 * This script fixes the survey questions population issue by:
 * 1. Reading the raw survey YAML files
 * 2. Populating the survey questions in the database
 * 3. Creating the proper relationships between surveys and questions
 */
import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { RAW_SURVEYS_DIR } from '../../config/paths.js';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

/**
 * Fixes the survey questions population issue
 */
async function fixSurveyQuestionsPopulation() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Start a transaction
      await client.query('BEGIN');

      try {
        // Define fixed UUIDs for known surveys for consistency
        const knownSurveyIds: Record<string, string> = {
          'self-assessment': '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
          'three-quick-questions': '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
          feedback: '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1',
        };

        // Get all .yaml files in the surveys directory
        const surveyFiles = fs
          .readdirSync(RAW_SURVEYS_DIR)
          .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));

        if (surveyFiles.length === 0) {
          console.warn(`No survey files found in ${RAW_SURVEYS_DIR}`);
          return;
        }

        console.log(`Found ${surveyFiles.length} survey files to process.`);

        // Process each survey file
        for (const file of surveyFiles) {
          const filePath = path.join(RAW_SURVEYS_DIR, file);
          const surveyContent = fs.readFileSync(filePath, 'utf8');
          const surveyData = yaml.load(surveyContent) as any;

          // Get the survey slug and UUID
          const surveySlug = path.basename(file, path.extname(file));
          const surveyId = knownSurveyIds[surveySlug] || uuidv4();

          console.log(
            `Processing questions for survey: ${surveyData.title} (${surveySlug}, ID: ${surveyId})`,
          );

          // Get existing questions for this survey
          const existingQuestionsResult = await client.query(
            `SELECT id FROM payload.survey_questions WHERE surveys_id = $1`,
            [surveyId],
          );

          const existingQuestionIds = existingQuestionsResult.rows.map(
            (row) => row.id,
          );

          console.log(
            `Found ${existingQuestionIds.length} existing questions for survey ${surveySlug}`,
          );

          // Process each question
          if (surveyData.questions && Array.isArray(surveyData.questions)) {
            console.log(
              `Processing ${surveyData.questions.length} questions for survey ${surveySlug}`,
            );

            for (let i = 0; i < surveyData.questions.length; i++) {
              const question = surveyData.questions[i];
              const questionId = uuidv4();

              // Convert questionspin string to integer (0 for Positive, 1 for Negative)
              // Make the comparison case-insensitive
              const questionspinValue =
                question.questionspin &&
                question.questionspin.toLowerCase() === 'negative'
                  ? 1
                  : 0;

              // Determine the question type (default to multiple_choice if not specified)
              const questionType = question.type || 'multiple_choice';

              // Check if we've already processed this question
              if (i < existingQuestionIds.length) {
                console.log(
                  `Skipping question ${i + 1} as it already exists (ID: ${
                    existingQuestionIds[i]
                  })`,
                );
                continue;
              }

              // Add the question to the database
              console.log(
                `Adding question ${i + 1}: ${question.question.substring(
                  0,
                  50,
                )}...`,
              );

              const insertQuestionResult = await client.query(
                `
                INSERT INTO payload.survey_questions (
                  id,
                  question,
                  type,
                  category,
                  questionspin,
                  position,
                  surveys_id,
                  required,
                  created_at,
                  updated_at
                ) VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5,
                  $6,
                  $7,
                  $8,
                  NOW(),
                  NOW()
                ) ON CONFLICT (id) DO NOTHING
                RETURNING id
                `,
                [
                  questionId,
                  question.question,
                  questionType,
                  question.questioncategory || '',
                  questionspinValue,
                  i,
                  surveyId,
                  true,
                ],
              );

              if (insertQuestionResult.rowCount === 0) {
                console.log(
                  `Question ${i + 1} already exists, skipping insertion`,
                );
                continue;
              }

              // Process answer options if they exist and the question type is not text_field
              if (
                question.answers &&
                Array.isArray(question.answers) &&
                questionType !== 'text_field'
              ) {
                for (let j = 0; j < question.answers.length; j++) {
                  const answer = question.answers[j];

                  // Add the option to the database
                  await client.query(
                    `
                    INSERT INTO payload.survey_questions_options (
                      id,
                      _order,
                      _parent_id,
                      option,
                      created_at,
                      updated_at
                    ) VALUES (
                      gen_random_uuid(),
                      $1,
                      $2,
                      $3,
                      NOW(),
                      NOW()
                    ) ON CONFLICT DO NOTHING
                    `,
                    [j, questionId, answer.answer],
                  );
                }
              }

              // Create relationship entry for the question to the survey
              await client.query(
                `
                INSERT INTO payload.survey_questions_rels (
                  id,
                  _parent_id,
                  field,
                  value,
                  created_at,
                  updated_at
                ) VALUES (
                  gen_random_uuid(),
                  $1,
                  $2,
                  $3,
                  NOW(),
                  NOW()
                ) ON CONFLICT DO NOTHING
                `,
                [questionId, 'surveys', surveyId],
              );

              // Create bidirectional relationship entry for the survey to the question
              await client.query(
                `
                INSERT INTO payload.surveys_rels (
                  id,
                  _parent_id,
                  field,
                  value,
                  survey_questions_id,
                  created_at,
                  updated_at
                ) VALUES (
                  gen_random_uuid(),
                  $1,
                  $2,
                  $3,
                  $4,
                  NOW(),
                  NOW()
                ) ON CONFLICT DO NOTHING
                `,
                [surveyId, 'questions', questionId, questionId],
              );
            }
          }
        }

        // Fix field names in survey_questions_rels
        console.log('\n--- Fixing field names in survey_questions_rels ---');
        const updateSurveyFieldResult = await client.query(`
          UPDATE payload.survey_questions_rels
          SET field = 'surveys'
          WHERE field = 'surveys_id';
        `);

        console.log(
          `Updated ${updateSurveyFieldResult.rowCount} field names in survey_questions_rels`,
        );

        // Fix surveys_id column in survey_questions_rels
        console.log(
          '\n--- Fixing surveys_id column in survey_questions_rels ---',
        );
        const updateSurveysIdResult = await client.query(`
          UPDATE payload.survey_questions_rels
          SET surveys_id = value
          WHERE field = 'surveys' AND surveys_id IS NULL;
        `);

        console.log(
          `Updated ${updateSurveysIdResult.rowCount} surveys_id values in survey_questions_rels`,
        );

        // Commit the transaction
        await client.query('COMMIT');
        console.log('\nTransaction committed successfully');
      } catch (error) {
        // Rollback the transaction if an error occurs
        await client.query('ROLLBACK');
        console.error('Transaction rolled back due to error:', error);
        throw error;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fixing survey questions population:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix if this script is executed directly
if (
  import.meta.url ===
  import.meta.resolve('./fix-survey-questions-population.ts')
) {
  fixSurveyQuestionsPopulation()
    .then(() => {
      console.log('\nSurvey questions population fixed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to fix survey questions population:', error);
      process.exit(1);
    });
}

export { fixSurveyQuestionsPopulation };
