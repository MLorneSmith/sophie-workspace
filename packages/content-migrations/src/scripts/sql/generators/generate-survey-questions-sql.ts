/**
 * Generator for survey questions SQL
 */
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { RAW_SURVEYS_DIR } from '../../../config/paths.js';

/**
 * Generates SQL for survey questions from all YAML files in the RAW_SURVEYS_DIR directory
 * @returns Object containing SQL for each survey's questions
 */
export function generateSurveyQuestionsSql(): {
  feedbackSql: string;
  assessmentSql: string;
  threeQuestionsSql: string;
} {
  // Get all .yaml files in the surveys directory
  const surveyFiles = fs
    .readdirSync(RAW_SURVEYS_DIR)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));

  if (surveyFiles.length === 0) {
    console.warn(`No survey files found in ${RAW_SURVEYS_DIR}`);
    return generatePlaceholderSurveyQuestionsSql();
  }

  console.log(
    `Found ${surveyFiles.length} survey files to process for questions.`,
  );

  // Define fixed UUIDs for known surveys for consistency
  const knownSurveyIds: Record<string, string> = {
    'self-assessment': '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
    'three-quick-questions': '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
    feedback: '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1',
  };

  // Initialize SQL strings for each survey
  let feedbackSql = `-- Seed data for the feedback survey questions
-- Survey ID: 7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1

-- Start a transaction
BEGIN;

`;

  let assessmentSql = `-- Seed data for the High-Stakes Presentations Self-Assessment survey questions
-- Survey ID: 5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9

-- Start a transaction
BEGIN;

`;

  let threeQuestionsSql = `-- Seed data for the Three Quick Questions survey questions
-- Survey ID: 6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0

-- Start a transaction
BEGIN;

`;

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

    // Select the appropriate SQL string based on the survey slug
    let targetSql: string;
    if (surveySlug === 'feedback') {
      targetSql = feedbackSql;
    } else if (surveySlug === 'self-assessment') {
      targetSql = assessmentSql;
    } else if (surveySlug === 'three-quick-questions') {
      targetSql = threeQuestionsSql;
    } else {
      console.warn(`Skipping unknown survey: ${surveySlug}`);
      continue;
    }

    // Process each question
    if (surveyData.questions && Array.isArray(surveyData.questions)) {
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

        // Add the question to the SQL
        targetSql += `-- Insert question ${i + 1}: ${question.question.substring(0, 50)}...
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
  '${questionId}',
  '${question.question.replace(/'/g, "''")}',
  '${questionType}',
  '${question.questioncategory || ''}',
  ${questionspinValue},
  ${i},
  '${surveyId}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;

        // Process answer options if they exist and the question type is not text_field
        if (
          question.answers &&
          Array.isArray(question.answers) &&
          questionType !== 'text_field'
        ) {
          for (let j = 0; j < question.answers.length; j++) {
            const answer = question.answers[j];

            // Add the option to the SQL
            targetSql += `-- Insert option ${j + 1} for question ${i + 1}
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  ${j},
  '${questionId}',
  '${answer.answer.replace(/'/g, "''")}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
          }
        }

        // Create relationship entry for the question to the survey
        targetSql += `-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${questionId}',
  'surveys',
  '${surveyId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;

        // Create bidirectional relationship entry for the survey to the question
        targetSql += `-- Create bidirectional relationship entry for the survey to the question
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
  '${surveyId}',
  'questions',
  '${questionId}',
  '${questionId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
      }
    }
  }

  // End the transactions
  feedbackSql += `-- Commit the transaction
COMMIT;
`;

  assessmentSql += `-- Commit the transaction
COMMIT;
`;

  threeQuestionsSql += `-- Commit the transaction
COMMIT;
`;

  return { feedbackSql, assessmentSql, threeQuestionsSql };
}

/**
 * Generates placeholder SQL for survey questions (used as fallback if YAML file not found)
 * @returns Object containing SQL for each survey's questions
 */
function generatePlaceholderSurveyQuestionsSql(): {
  feedbackSql: string;
  assessmentSql: string;
  threeQuestionsSql: string;
} {
  // Feedback survey placeholder
  const feedbackSql = `-- Seed data for the feedback survey questions
-- Survey ID: 7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1

-- Start a transaction
BEGIN;

-- Insert a sample survey question
INSERT INTO payload.survey_questions (
  id,
  question,
  surveys_id,
  created_at,
  updated_at
) VALUES (
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9e1', -- Fixed UUID for the question
  'How would you rate the course overall?',
  '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1', -- Survey ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Commit the transaction
COMMIT;
`;

  // Assessment survey placeholder
  const assessmentSql = `-- Seed data for the High-Stakes Presentations Self-Assessment survey questions
-- Survey ID: 5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9

-- Start a transaction
BEGIN;

-- Insert a sample survey question
INSERT INTO payload.survey_questions (
  id,
  question,
  surveys_id,
  created_at,
  updated_at
) VALUES (
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea', -- Fixed UUID for the question
  'How would you rate your presentation skills?',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Survey ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Commit the transaction
COMMIT;
`;

  // Three Quick Questions survey placeholder
  const threeQuestionsSql = `-- Seed data for the Three Quick Questions survey questions
-- Survey ID: 6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0

-- Start a transaction
BEGIN;

-- Insert a sample survey question
INSERT INTO payload.survey_questions (
  id,
  question,
  surveys_id,
  created_at,
  updated_at
) VALUES (
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9eb', -- Fixed UUID for the question
  'What is your experience level with presentations?',
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0', -- Survey ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Commit the transaction
COMMIT;
`;

  return { feedbackSql, assessmentSql, threeQuestionsSql };
}
