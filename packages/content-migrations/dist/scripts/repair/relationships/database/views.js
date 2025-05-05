/**
 * Database Views for Relationship Access
 *
 * This module creates standardized views for commonly accessed relationships
 * to provide a stable interface regardless of underlying data structure changes.
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';
/**
 * Create views for quiz-question relationships
 *
 * @returns True if the views were created successfully
 */
export async function createQuizQuestionViews() {
    console.log('Creating quiz-question relationship views...');
    try {
        // Begin transaction
        await executeSQL('BEGIN');
        // Create view for quiz-question relationships
        const createQuizQuestionViewSQL = `
      CREATE OR REPLACE VIEW payload.course_quiz_questions_view AS
      SELECT
        q.id AS quiz_id,
        q.title AS quiz_title,
        qq.id AS question_id,
        qq.question AS question_title,
        qq.type AS question_type,
        r."order" AS question_order
      FROM
        payload.course_quizzes q
      JOIN
        payload.course_quizzes_rels r ON q.id = r.parent_id AND r.path = 'questions'
      JOIN
        payload.quiz_questions qq ON r.quiz_questions_id = qq.id
      ORDER BY
        q.id, r."order";
    `;
        await executeSQL(createQuizQuestionViewSQL);
        console.log('Created course_quiz_questions_view');
        // Create view for lesson-quiz relationships
        const createLessonQuizViewSQL = `
      CREATE OR REPLACE VIEW payload.lesson_quiz_view AS
      SELECT
        l.id AS lesson_id,
        l.title AS lesson_title,
        q.id AS quiz_id,
        q.title AS quiz_title
      FROM
        payload.course_lessons l
      LEFT JOIN
        payload.course_lessons_rels r ON l.id = r.parent_id AND r.path = 'quiz'
      LEFT JOIN
        payload.course_quizzes q ON r.course_quizzes_id = q.id;
    `;
        await executeSQL(createLessonQuizViewSQL);
        console.log('Created lesson_quiz_view');
        // Create view for survey questions
        const createSurveyQuestionsViewSQL = `
      CREATE OR REPLACE VIEW payload.survey_questions_view AS
      SELECT
        s.id AS survey_id,
        s.title AS survey_title,
        sq.id AS question_id,
        sq.question AS question_prompt,
        r."order" AS question_order
      FROM
        payload.surveys s
      JOIN
        payload.surveys_rels r ON s.id = r.parent_id AND r.path = 'questions'
      JOIN
        payload.survey_questions sq ON r.survey_questions_id = sq.id
      ORDER BY
        s.id, r."order";
    `;
        await executeSQL(createSurveyQuestionsViewSQL);
        console.log('Created survey_questions_view');
        // Create unified course content view that shows lessons and their related quizzes
        const createCourseContentViewSQL = `
      CREATE OR REPLACE VIEW payload.course_content_view AS
      SELECT
        c.id AS course_id,
        c.title AS course_title,
        cl.id AS lesson_id,
        cl.title AS lesson_title,
        cl."order" AS lesson_order,
        q.id AS quiz_id,
        q.title AS quiz_title
      FROM
        payload.courses c
      LEFT JOIN
        payload.course_lessons cl ON cl.course_id = c.id
      LEFT JOIN
        payload.course_lessons_rels lr ON cl.id = lr.parent_id AND lr.path = 'quiz'
      LEFT JOIN
        payload.course_quizzes q ON lr.course_quizzes_id = q.id
      ORDER BY
        c.id, cl."order";
    `;
        await executeSQL(createCourseContentViewSQL);
        console.log('Created course_content_view');
        // Create view for downloads relationships
        const createDownloadsViewSQL = `
      CREATE OR REPLACE VIEW payload.downloads_relationships_view AS
      SELECT 
        d.id AS download_id,
        d.title AS download_title,
        d.filename,
        d.url,
        CASE
          WHEN cl.id IS NOT NULL THEN 'course_lessons'
          WHEN c.id IS NOT NULL THEN 'courses'
          ELSE NULL
        END AS parent_type,
        COALESCE(cl.id, c.id) AS parent_id,
        COALESCE(cl.title, c.title) AS parent_title
      FROM 
        payload.downloads d
      LEFT JOIN 
        payload.course_lessons_rels r1 ON d.id = r1.downloads_id
      LEFT JOIN 
        payload.course_lessons cl ON r1.parent_id = cl.id
      LEFT JOIN 
        payload.courses_rels r2 ON d.id = r2.downloads_id
      LEFT JOIN 
        payload.courses c ON r2.parent_id = c.id;
    `;
        await executeSQL(createDownloadsViewSQL);
        console.log('Created downloads_relationships_view');
        // Commit transaction
        await executeSQL('COMMIT');
        console.log('All relationship views created successfully');
        return true;
    }
    catch (error) {
        // Rollback transaction on error
        await executeSQL('ROLLBACK');
        console.error('Error creating relationship views:', error);
        return false;
    }
}
/**
 * Create or update a view to track invalid relationships
 *
 * @returns True if the view was created successfully
 */
export async function createInvalidRelationshipsView() {
    console.log('Creating invalid relationships view...');
    try {
        // Begin transaction
        await executeSQL('BEGIN');
        // Create view to track invalid relationships
        const createInvalidRelationshipsViewSQL = `
      CREATE OR REPLACE VIEW payload.invalid_relationships_view AS
      
      -- 1. Quiz-question relationships where question doesn't exist
      SELECT
        'quiz_question' AS relationship_type,
        r.parent_id AS source_id,
        r.id AS target_id,
        'questions' AS path,
        'missing_target' AS issue_type,
        q.title AS source_name
      FROM
        payload.course_quizzes_rels r
      JOIN
        payload.course_quizzes q ON r.parent_id = q.id
      LEFT JOIN
        payload.quiz_questions qq ON r.quiz_questions_id = qq.id
      WHERE
        r.path = 'questions' AND
        qq.id IS NULL
        
      UNION ALL
      
      -- 2. Lesson-quiz relationships where quiz doesn't exist
      SELECT
        'lesson_quiz' AS relationship_type,
        r.parent_id AS source_id,
        r.id AS target_id,
        'quiz' AS path,
        'missing_target' AS issue_type,
        l.title AS source_name
      FROM
        payload.course_lessons_rels r
      JOIN
        payload.course_lessons l ON r.parent_id = l.id
      LEFT JOIN
        payload.course_quizzes q ON r.course_quizzes_id = q.id
      WHERE
        r.path = 'quiz' AND
        q.id IS NULL
        
      UNION ALL
      
      -- 3. Survey-question relationships where question doesn't exist
      SELECT
        'survey_question' AS relationship_type,
        r.parent_id AS source_id,
        r.id AS target_id,
        'questions' AS path,
        'missing_target' AS issue_type,
        s.title AS source_name
      FROM
        payload.surveys_rels r
      JOIN
        payload.surveys s ON r.parent_id = s.id
      LEFT JOIN
        payload.survey_questions sq ON r.survey_questions_id = sq.id
      WHERE
        r.path = 'questions' AND
        sq.id IS NULL
        
      UNION ALL
      
      -- 4. Download relationships where download doesn't exist
      SELECT
        CASE
          WHEN r.parent_id IN (SELECT id FROM payload.course_lessons) THEN 'lesson_download'
          WHEN r.parent_id IN (SELECT id FROM payload.courses) THEN 'course_download'
          ELSE 'unknown_download'
        END AS relationship_type,
        r.parent_id AS source_id,
        r.id AS target_id,
        'downloads' AS path,
        'missing_target' AS issue_type,
        COALESCE(
          (SELECT title FROM payload.course_lessons WHERE id = r.parent_id),
          (SELECT title FROM payload.courses WHERE id = r.parent_id),
          'Unknown'
        ) AS source_name
      FROM
        payload.course_lessons_rels r
      LEFT JOIN 
        payload.downloads d ON r.downloads_id = d.id
      WHERE
        r.path = 'downloads' AND
        d.id IS NULL;
    `;
        await executeSQL(createInvalidRelationshipsViewSQL);
        console.log('Created invalid_relationships_view');
        // Commit transaction
        await executeSQL('COMMIT');
        console.log('Invalid relationships view created successfully');
        return true;
    }
    catch (error) {
        // Rollback transaction on error
        await executeSQL('ROLLBACK');
        console.error('Error creating invalid relationships view:', error);
        return false;
    }
}
/**
 * Create all relationship views
 *
 * @returns True if all views were created successfully
 */
export async function createAllRelationshipViews() {
    try {
        // Create standard relationship views
        const viewsCreated = await createQuizQuestionViews();
        // Create invalid relationships view
        const invalidViewCreated = await createInvalidRelationshipsView();
        return viewsCreated && invalidViewCreated;
    }
    catch (error) {
        console.error('Error creating all relationship views:', error);
        return false;
    }
}
