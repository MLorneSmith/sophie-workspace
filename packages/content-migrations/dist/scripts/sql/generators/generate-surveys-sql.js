/**
 * Generator for surveys SQL
 */
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { RAW_SURVEYS_DIR } from '../../../config/paths.js';
/**
 * Generates SQL for surveys from all YAML files in the RAW_SURVEYS_DIR directory
 * @returns SQL for surveys
 */
export function generateSurveysSql() {
    // Get all .yaml files in the surveys directory
    const surveyFiles = fs
        .readdirSync(RAW_SURVEYS_DIR)
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));
    if (surveyFiles.length === 0) {
        console.warn(`No survey files found in ${RAW_SURVEYS_DIR}`);
        return generatePlaceholderSurveysSql();
    }
    console.log(`Found ${surveyFiles.length} survey files to process.`);
    // Start building the SQL
    let sql = `-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

`;
    // Define fixed UUIDs for known surveys for consistency
    const knownSurveyIds = {
        'self-assessment': '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
        'three-quick-questions': '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
        feedback: '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1',
    };
    // Process each survey file
    for (const file of surveyFiles) {
        const filePath = path.join(RAW_SURVEYS_DIR, file);
        const surveyContent = fs.readFileSync(filePath, 'utf8');
        const surveyData = yaml.load(surveyContent);
        // Get the survey slug and UUID
        const surveySlug = path.basename(file, path.extname(file));
        const surveyId = knownSurveyIds[surveySlug] || '00000000-0000-0000-0000-000000000000';
        // Generate a description if not provided
        const description = surveyData.description || `Survey: ${surveyData.title}`;
        console.log(`Processing survey: ${surveyData.title} (${surveySlug}, ID: ${surveyId})`);
        // Add the survey to the SQL
        sql += `-- Insert survey: ${surveyData.title}
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  show_progress_bar,
  created_at,
  updated_at
) VALUES (
  '${surveyId}',
  '${surveyData.title.replace(/'/g, "''")}',
  '${surveySlug}',
  '${description.replace(/'/g, "''")}',
  '${surveyData.status || 'published'}',
  ${surveyData.showProgressBar !== undefined ? surveyData.showProgressBar : true},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
/**
 * Generates placeholder SQL for surveys (used as fallback if YAML file not found)
 * @returns SQL for surveys
 */
function generatePlaceholderSurveysSql() {
    return `-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert a sample survey
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  created_at,
  updated_at
) VALUES (
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Fixed UUID for the survey
  'Course Feedback Survey',
  'course-feedback-survey',
  'Please provide feedback on the course',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the survey already exists

-- Commit the transaction
COMMIT;
`;
}
