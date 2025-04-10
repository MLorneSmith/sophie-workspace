"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestionsSql = generateQuestionsSql;
/**
 * Generator for quiz questions SQL using the static quiz definitions
 */
const quizzes_js_1 = require("../../../data/definitions/quizzes.js");
/**
 * Generates SQL for quiz questions from static definitions
 * @returns SQL for quiz questions
 */
function generateQuestionsSql() {
    // Start building the SQL
    let sql = `-- Seed data for the quiz questions table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

`;
    // Process each quiz from the static definitions
    for (const quiz of Object.values(quizzes_js_1.QUIZZES)) {
        console.log(`Generating SQL for ${quiz.questions.length} questions in quiz ${quiz.slug}`);
        // Process each question in the quiz
        for (const question of quiz.questions) {
            // Add the question to the SQL
            sql += `-- Insert question for quiz: ${quiz.title}
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '${question.id}', -- UUID for the question
  '${question.text.replace(/'/g, "''")}',
  '${quiz.id}', -- Quiz ID
  '${quiz.id}', -- Quiz ID (duplicate)
  'multiple_choice',
  ${question.explanation ? `'${question.explanation.replace(/'/g, "''")}'` : 'NULL'},
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

`;
            // Process each option
            for (let i = 0; i < question.options.length; i++) {
                const option = question.options[i];
                if (!option)
                    continue; // Skip if option is undefined
                const isCorrect = i === question.correctOptionIndex;
                // Add the option to the SQL
                sql += `-- Insert option ${i + 1} for question
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  ${i},
  '${question.id}',
  '${option.replace(/'/g, "''")}',
  ${isCorrect ? 'true' : 'false'},
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

`;
            }
            // Add the relationship entry
            sql += `-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${question.id}',
  'quiz_id',
  '${quiz.id}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
            // Add the bidirectional relationship entry
            sql += `-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${quiz.id}',
  'questions',
  '${question.id}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
        }
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
