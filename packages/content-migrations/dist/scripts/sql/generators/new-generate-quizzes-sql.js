/**
 * Generator for quizzes SQL using the static quiz definitions
 */
import { QUIZZES } from '../../../data/definitions/quizzes.js';
/**
 * Generates SQL for quizzes from static definitions
 * @returns SQL for quizzes
 */
export function generateQuizzesSql() {
    // Start building the SQL
    let sql = `-- Seed data for the course quizzes table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

`;
    // Process each quiz from the static definitions
    for (const quiz of Object.values(QUIZZES)) {
        console.log(`Generating SQL for quiz ${quiz.slug} with ID ${quiz.id}`);
        // Add the quiz to the SQL
        sql += `-- Insert quiz: ${quiz.title}
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '${quiz.id}', -- UUID for the quiz
  '${quiz.title.replace(/'/g, "''")}',
  '${quiz.slug}',
  '${quiz.description.replace(/'/g, "''")}',
  ${quiz.passingScore}, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

`;
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
