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
import { v4 as uuidv4 } from 'uuid';
import { RAW_SURVEYS_DIR } from '../../config/paths.js';
import { checkColumnExists } from '../../utils/check-column-exists.js';
const { Pool } = pg;
// Get the current directory - simplifying to just use cwd
const currentDir = process.cwd();
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({
    path: path.resolve(currentDir, `packages/content-migrations/${envFile}`),
});
/**
 * Fixes the survey questions population issue
 */
async function fixSurveyQuestionsPopulation() {
    // Get the database connection string from the environment variables
    // Use default connection string as fallback
    const databaseUri = process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
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
                // Check if RAW_SURVEYS_DIR exists
                if (!fs.existsSync(RAW_SURVEYS_DIR)) {
                    console.error(`Survey directory not found: ${RAW_SURVEYS_DIR}`);
                    console.log(`Creating missing directory: ${RAW_SURVEYS_DIR}`);
                    fs.mkdirSync(RAW_SURVEYS_DIR, { recursive: true });
                }
                // Define fixed UUIDs for known surveys for consistency
                const knownSurveyIds = {
                    'self-assessment': '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
                    'three-quick-questions': '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
                    feedback: '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1',
                };
                // Check if surveys exist in database, regardless of survey files
                const surveysResult = await client.query(`SELECT id, title FROM payload.surveys`);
                if (surveysResult.rowCount === 0) {
                    console.warn(`No surveys found in database. Skipping question population.`);
                    console.warn(`Please run the migration script first to create the surveys.`);
                    return;
                }
                console.log(`Found ${surveysResult.rowCount} surveys in database.`);
                // Get all .yaml files in the surveys directory
                const surveyFiles = fs.existsSync(RAW_SURVEYS_DIR)
                    ? fs
                        .readdirSync(RAW_SURVEYS_DIR)
                        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
                    : [];
                if (surveyFiles.length === 0) {
                    console.warn(`No survey YAML files found in ${RAW_SURVEYS_DIR}`);
                    console.warn(`This is expected if you're not using YAML files or they are in a different location.`);
                    // Continue with database surveys instead of YAML files
                    for (const survey of surveysResult.rows) {
                        console.log(`Processing database survey: ${survey.title} (ID: ${survey.id})`);
                        // Create placeholder questions for database surveys when no YAML files exist
                        await createPlaceholderQuestionsForSurvey(client, survey.id, survey.title);
                    }
                    return;
                }
                console.log(`Found ${surveyFiles.length} survey YAML files to process.`);
                // Process each survey file
                for (const file of surveyFiles) {
                    const filePath = path.join(RAW_SURVEYS_DIR, file);
                    const surveyContent = fs.readFileSync(filePath, 'utf8');
                    const surveyData = yaml.load(surveyContent);
                    // Get the survey slug and UUID
                    const surveySlug = path.basename(file, path.extname(file));
                    const surveyId = knownSurveyIds[surveySlug] || uuidv4();
                    console.log(`Processing questions for survey: ${surveyData.title} (${surveySlug}, ID: ${surveyId})`);
                    // Get existing questions for this survey
                    const existingQuestionsResult = await client.query(`SELECT id FROM payload.survey_questions WHERE surveys_id = $1`, [surveyId]);
                    const existingQuestionIds = existingQuestionsResult.rows.map((row) => row.id);
                    console.log(`Found ${existingQuestionIds.length} existing questions for survey ${surveySlug}`);
                    // Process each question
                    if (surveyData.questions && Array.isArray(surveyData.questions)) {
                        console.log(`Processing ${surveyData.questions.length} questions for survey ${surveySlug}`);
                        for (let i = 0; i < surveyData.questions.length; i++) {
                            const question = surveyData.questions[i];
                            const questionId = uuidv4();
                            // Convert questionspin string to integer (0 for Positive, 1 for Negative)
                            // Make the comparison case-insensitive
                            const questionspinValue = question.questionspin &&
                                question.questionspin.toLowerCase() === 'negative'
                                ? 1
                                : 0;
                            // Determine the question type (default to multiple_choice if not specified)
                            const questionType = question.type || 'multiple_choice';
                            // Check if we've already processed this question
                            if (i < existingQuestionIds.length) {
                                console.log(`Skipping question ${i + 1} as it already exists (ID: ${existingQuestionIds[i]})`);
                                continue;
                            }
                            // Add the question to the database
                            console.log(`Adding question ${i + 1}: ${question.question.substring(0, 50)}...`);
                            const insertQuestionResult = await client.query(`
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
                `, [
                                questionId,
                                question.question,
                                questionType,
                                question.questioncategory || '',
                                questionspinValue,
                                i,
                                surveyId,
                                true,
                            ]);
                            if (insertQuestionResult.rowCount === 0) {
                                console.log(`Question ${i + 1} already exists, skipping insertion`);
                                continue;
                            }
                            // Process answer options if they exist and the question type is not text_field
                            if (question.answers &&
                                Array.isArray(question.answers) &&
                                questionType !== 'text_field') {
                                // Check which parent column exists in the table
                                const parentColumn = await checkColumnExists(client, 'payload', 'survey_questions_options', ['parent_id', '_parent_id']);
                                if (!parentColumn) {
                                    console.warn('Neither parent_id nor _parent_id column exists in survey_questions_options table');
                                    continue;
                                }
                                for (let j = 0; j < question.answers.length; j++) {
                                    const answer = question.answers[j];
                                    // Add the option to the database using the correct parent column
                                    await client.query(`
                    INSERT INTO payload.survey_questions_options (
                      id,
                      _order,
                      ${parentColumn},
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
                    `, [j, questionId, answer.answer]);
                                }
                            }
                            // Check which parent columns exist in the survey_questions_rels table
                            const hasParentId = await client.query(`SELECT EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'survey_questions_rels' 
                  AND column_name = 'parent_id'
                );`);
                            const hasUnderscoreParentId = await client.query(`SELECT EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'survey_questions_rels' 
                  AND column_name = '_parent_id'
                );`);
                            // Build a SQL query that populates all existing parent columns
                            let insertColumns = [
                                'id',
                                'field',
                                'value',
                                'created_at',
                                'updated_at',
                            ];
                            let insertValues = [
                                'gen_random_uuid()',
                                '$2',
                                '$3',
                                'NOW()',
                                'NOW()',
                            ];
                            let insertParams = [questionId, 'surveys', surveyId];
                            let paramIndex = 4; // Start at 4 since we're using $1, $2, $3 already
                            if (hasParentId.rows[0].exists) {
                                insertColumns.push('parent_id');
                                insertValues.push(`$${paramIndex}`);
                                insertParams.push(questionId); // Always use questionId for parent_id
                                paramIndex++;
                            }
                            if (hasUnderscoreParentId.rows[0].exists) {
                                insertColumns.push('_parent_id');
                                insertValues.push(`$${paramIndex}`);
                                insertParams.push(questionId); // Always use questionId for _parent_id
                                paramIndex++;
                            }
                            if (!hasParentId.rows[0].exists &&
                                !hasUnderscoreParentId.rows[0].exists) {
                                console.warn('Neither parent_id nor _parent_id column exists in survey_questions_rels table');
                                continue;
                            }
                            // Create relationship entry for the question to the survey
                            // Using direct SQL with explicit parameter values to avoid type issues
                            const valuesWithTypes = [];
                            valuesWithTypes.push('gen_random_uuid()'); // id
                            valuesWithTypes.push(`'surveys'`); // field
                            valuesWithTypes.push(`'${surveyId}'::uuid`); // value
                            valuesWithTypes.push('NOW()'); // created_at
                            valuesWithTypes.push('NOW()'); // updated_at
                            if (hasParentId.rows[0].exists) {
                                valuesWithTypes.push(`'${questionId}'::uuid`); // parent_id
                            }
                            if (hasUnderscoreParentId.rows[0].exists) {
                                valuesWithTypes.push(`'${questionId}'::uuid`); // _parent_id
                            }
                            const insertSql = `
                INSERT INTO payload.survey_questions_rels (
                  ${insertColumns.join(', ')}
                ) VALUES (
                  ${valuesWithTypes.join(', ')}
                ) ON CONFLICT DO NOTHING
              `;
                            await client.query(insertSql);
                            // Check which parent columns exist in the surveys_rels table
                            const srHasParentId = await client.query(`SELECT EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'surveys_rels' 
                  AND column_name = 'parent_id'
                );`);
                            const srHasUnderscoreParentId = await client.query(`SELECT EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_schema = 'payload' 
                  AND table_name = 'surveys_rels' 
                  AND column_name = '_parent_id'
                );`);
                            // Build a SQL query that populates all existing parent columns
                            let srInsertColumns = [
                                'id',
                                'field',
                                'value',
                                'survey_questions_id',
                                'created_at',
                                'updated_at',
                            ];
                            let srInsertValues = [
                                'gen_random_uuid()',
                                '$2',
                                '$3',
                                '$4',
                                'NOW()',
                                'NOW()',
                            ];
                            let srInsertParams = [
                                surveyId,
                                'questions',
                                questionId,
                                questionId,
                            ];
                            let srParamIndex = 5; // Start at 5 since we're using $1, $2, $3, $4 already
                            if (srHasParentId.rows[0].exists) {
                                srInsertColumns.push('parent_id');
                                srInsertValues.push(`$${srParamIndex}`);
                                srInsertParams.push(surveyId); // Always use surveyId for parent_id
                                srParamIndex++;
                            }
                            if (srHasUnderscoreParentId.rows[0].exists) {
                                srInsertColumns.push('_parent_id');
                                srInsertValues.push(`$${srParamIndex}`);
                                srInsertParams.push(surveyId); // Always use surveyId for _parent_id
                                srParamIndex++;
                            }
                            if (!srHasParentId.rows[0].exists &&
                                !srHasUnderscoreParentId.rows[0].exists) {
                                console.warn('Neither parent_id nor _parent_id column exists in surveys_rels table');
                                continue;
                            }
                            // Create bidirectional relationship entry for the survey to the question
                            // Using direct SQL with explicit parameter values to avoid type issues
                            const srValuesWithTypes = [];
                            srValuesWithTypes.push('gen_random_uuid()'); // id
                            srValuesWithTypes.push(`'questions'`); // field
                            srValuesWithTypes.push(`'${questionId}'::uuid`); // value
                            srValuesWithTypes.push(`'${questionId}'::uuid`); // survey_questions_id
                            srValuesWithTypes.push('NOW()'); // created_at
                            srValuesWithTypes.push('NOW()'); // updated_at
                            if (srHasParentId.rows[0].exists) {
                                srValuesWithTypes.push(`'${surveyId}'::uuid`); // parent_id
                            }
                            if (srHasUnderscoreParentId.rows[0].exists) {
                                srValuesWithTypes.push(`'${surveyId}'::uuid`); // _parent_id
                            }
                            const srInsertSql = `
                INSERT INTO payload.surveys_rels (
                  ${srInsertColumns.join(', ')}
                ) VALUES (
                  ${srValuesWithTypes.join(', ')}
                ) ON CONFLICT DO NOTHING
              `;
                            await client.query(srInsertSql);
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
                console.log(`Updated ${updateSurveyFieldResult.rowCount} field names in survey_questions_rels`);
                // Fix surveys_id column in survey_questions_rels
                console.log('\n--- Fixing surveys_id column in survey_questions_rels ---');
                const updateSurveysIdResult = await client.query(`
          UPDATE payload.survey_questions_rels
          SET surveys_id = value
          WHERE field = 'surveys' AND surveys_id IS NULL;
        `);
                console.log(`Updated ${updateSurveysIdResult.rowCount} surveys_id values in survey_questions_rels`);
                // Commit the transaction
                await client.query('COMMIT');
                console.log('\nTransaction committed successfully');
            }
            catch (error) {
                // Rollback the transaction if an error occurs
                await client.query('ROLLBACK');
                console.error('Transaction rolled back due to error:', error);
                throw error;
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error fixing survey questions population:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
/**
 * Creates placeholder questions for a survey when no YAML files are found
 */
async function createPlaceholderQuestionsForSurvey(client, surveyId, surveyTitle) {
    // Check if survey already has questions
    const existingQuestionsResult = await client.query(`SELECT id FROM payload.survey_questions WHERE surveys_id = $1`, [surveyId]);
    if (existingQuestionsResult.rowCount > 0) {
        console.log(`Survey ${surveyTitle} already has ${existingQuestionsResult.rowCount} questions. Skipping placeholder creation.`);
        return;
    }
    console.log(`Creating placeholder questions for survey: ${surveyTitle}`);
    // Create different placeholder questions based on survey type
    let questions = [];
    if (surveyTitle.toLowerCase().includes('assessment')) {
        // Self-assessment type placeholder questions
        questions = [
            {
                question: 'How would you rate your current skill level?',
                type: 'rating',
            },
            {
                question: 'What areas do you feel most confident in?',
                type: 'text_field',
            },
            { question: 'What areas would you like to improve?', type: 'text_field' },
        ];
    }
    else if (surveyTitle.toLowerCase().includes('feedback')) {
        // Feedback type placeholder questions
        questions = [
            { question: 'How would you rate your experience?', type: 'rating' },
            { question: 'What did you like most?', type: 'text_field' },
            { question: 'What could be improved?', type: 'text_field' },
        ];
    }
    else {
        // Generic placeholder questions
        questions = [
            { question: 'Please rate your satisfaction', type: 'rating' },
            { question: 'Do you have any comments?', type: 'text_field' },
        ];
    }
    // Add the placeholder questions
    for (let i = 0; i < questions.length; i++) {
        const questionId = uuidv4();
        console.log(`Adding placeholder question ${i + 1}: ${questions[i].question}`);
        // Insert the question
        await client.query(`INSERT INTO payload.survey_questions (
        id, question, type, position, surveys_id, required, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`, [questionId, questions[i].question, questions[i].type, i, surveyId, true]);
        // Create relationship entries
        // survey_questions_rels: question -> survey
        await client.query(`INSERT INTO payload.survey_questions_rels (
        id, field, value, parent_id, created_at, updated_at, surveys_id
      ) VALUES (gen_random_uuid(), 'surveys', $1, $2, NOW(), NOW(), $1)`, [surveyId, questionId]);
        // surveys_rels: survey -> question
        await client.query(`INSERT INTO payload.surveys_rels (
        id, field, value, parent_id, created_at, updated_at, survey_questions_id
      ) VALUES (gen_random_uuid(), 'questions', $1, $2, NOW(), NOW(), $1)`, [questionId, surveyId]);
    }
    console.log(`Created ${questions.length} placeholder questions for survey: ${surveyTitle}`);
}
// Run the fix if this script is executed directly
// Simplified check that works without requiring module-specific features
const isMainModule = process.argv.length > 1;
if (isMainModule) {
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
