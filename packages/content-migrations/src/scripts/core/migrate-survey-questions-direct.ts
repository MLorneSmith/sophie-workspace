/**
 * Script to migrate survey questions from YAML files to Payload CMS directly in the PostgreSQL database
 */
import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

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
 * Validates if a string is a valid UUID
 * @param str - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Migrates survey questions from YAML files directly to the PostgreSQL database
 */
async function migrateSurveyQuestionsToDatabase() {
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

      // We don't need a unique constraint since we'll check for duplicates manually
      console.log('Checking for existing questions...');

      // Path to the surveys files
      const surveysDir = path.resolve(
        __dirname,
        '../../../../../apps/payload/data/surveys',
      );
      console.log(`Surveys directory: ${surveysDir}`);

      // Get all surveys from the database
      const surveyIdsResult = await client.query(
        'SELECT id, slug FROM payload.surveys ORDER BY slug',
      );

      // Create a map of survey slugs to IDs
      const surveyIdMap = new Map();
      for (const survey of surveyIdsResult.rows) {
        surveyIdMap.set(survey.slug, survey.id);
      }

      console.log(`Loaded ${surveyIdMap.size} valid surveys from database.`);

      console.log('Surveys in database:');
      for (const survey of surveyIdsResult.rows) {
        console.log(`  ${survey.slug}: ${survey.id}`);
      }

      // Read all .yaml files
      const yamlFiles = fs
        .readdirSync(surveysDir)
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map((file) => path.join(surveysDir, file));

      console.log(
        `Found ${yamlFiles.length} survey files to process for questions.`,
      );

      // Migrate questions from each survey file
      for (const file of yamlFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const data = yaml.load(content) as any;

          // Generate a slug from the file name
          const slug = path.basename(file, path.extname(file));

          // Get the survey ID from the database
          const surveyFromDb = surveyIdsResult.rows.find(
            (s) => s.slug === slug,
          );
          if (!surveyFromDb) {
            console.error(
              `Survey not found in database for ${slug}. Skipping questions.`,
            );
            continue;
          }

          const surveyId = surveyFromDb.id;
          console.log(
            `Using survey ID from database: ${surveyId} for survey: ${slug}`,
          );

          // Process questions
          if (data.questions && Array.isArray(data.questions)) {
            console.log(
              `Processing ${data.questions.length} questions for survey: ${slug}`,
            );

            for (let i = 0; i < data.questions.length; i++) {
              const q = data.questions[i];

              // First check if the question already exists
              const existingQuestion = await client.query(
                `SELECT sq.id 
                 FROM payload.survey_questions sq
                 JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
                 WHERE sqr.surveys_id = $1 AND sq.question = $2`,
                [surveyId, q.question],
              );

              let questionId;
              if (existingQuestion.rows.length > 0) {
                questionId = existingQuestion.rows[0].id;
                console.log(`Question already exists with ID: ${questionId}`);
              } else {
                // Get the question type from the YAML or default to multiple_choice
                const questionType = q.type || 'multiple_choice';

                // Insert the question into the database
                const questionResult = await client.query(
                  `INSERT INTO payload.survey_questions (
                    id, 
                    question, 
                    type, 
                    questionspin, 
                    category, 
                    position, 
                    updated_at, 
                    created_at
                  ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
                  RETURNING id`,
                  [
                    q.question,
                    questionType, // Use the question type from the YAML
                    q.questionspin === 'positive'
                      ? 'Positive'
                      : q.questionspin === 'negative'
                        ? 'Negative'
                        : 'Positive',
                    q.questioncategory || '',
                    i, // Use the array index as the position
                  ],
                );

                questionId = questionResult.rows[0].id;
                console.log(`Created question with ID: ${questionId}`);

                // Create the relationship between the question and the survey
                await client.query(
                  `INSERT INTO payload.survey_questions_rels (
                    id,
                    _parent_id,
                    surveys_id,
                    updated_at,
                    created_at
                  ) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
                  [questionId, surveyId],
                );
                console.log(
                  `Created relationship between question ${questionId} and survey ${surveyId}`,
                );
              }

              // Prepare options array for the question
              const options = [];
              if (q.answers && Array.isArray(q.answers)) {
                for (let j = 0; j < q.answers.length; j++) {
                  const answer = q.answers[j];
                  options.push({
                    option: answer.answer,
                  });
                }
              }

              // Insert options for the question
              if (questionId && options.length > 0) {
                // First, delete any existing options for this question
                await client.query(
                  `DELETE FROM payload.survey_questions_options WHERE _parent_id = $1`,
                  [questionId],
                );

                // Then insert the new options
                for (let j = 0; j < options.length; j++) {
                  const option = options[j];
                  if (option) {
                    await client.query(
                      `INSERT INTO payload.survey_questions_options (id, _order, _parent_id, option, updated_at, created_at)
                       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
                      [j, questionId, option.option],
                    );
                  }
                }
                console.log(`Added ${options.length} options to the question`);
              }

              console.log(`Migrated question ${i + 1} for survey: ${slug}`);
            }
          }
        } catch (error) {
          console.error(`Error migrating questions for ${file}:`, error);
        }
      }

      console.log('Survey questions migration complete!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateSurveyQuestionsToDatabase().catch((error) => {
  console.error('Survey questions migration failed:', error);
  process.exit(1);
});
