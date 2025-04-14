/**
 * Generator for lesson-quiz references SQL using the static definitions
 */
import { LESSON_QUIZ_RELATIONS } from '../../../data/definitions/lesson-quiz-relations.js';
import { QUIZZES } from '../../../data/definitions/quizzes.js';
/**
 * Generates SQL for lesson-quiz references from static definitions
 * @returns SQL for lesson-quiz references
 */
export function generateLessonQuizReferencesSql() {
    // Start building the SQL
    let sql = `-- Seed data for lesson-quiz references
-- This file is generated from static lesson-quiz relation definitions

-- Start a transaction
BEGIN;

`;
    // Process each lesson-quiz relation
    for (const relation of LESSON_QUIZ_RELATIONS) {
        const quiz = QUIZZES[relation.quizSlug];
        if (!quiz) {
            console.error(`Error: Quiz ${relation.quizSlug} not found for lesson ${relation.lessonSlug}`);
            continue;
        }
        console.log(`Generating SQL for lesson ${relation.lessonSlug} referencing quiz ${relation.quizSlug}`);
        // Add the reference to the SQL
        sql += `-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = '${quiz.id}',
    quiz_id_id = '${quiz.id}' -- Duplicate field for compatibility
WHERE slug = '${relation.lessonSlug}';

`;
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
