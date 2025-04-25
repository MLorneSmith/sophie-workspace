/**
 * Database Helper Functions for Relationship Access
 *
 * This module creates helper functions in the database for retrieving
 * relationship data to provide multiple access mechanisms.
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';

/**
 * Create helper functions for quiz-question relationships
 *
 * @returns True if the helper functions were created successfully
 */
export async function createQuizQuestionHelpers(): Promise<boolean> {
  console.log('Creating quiz-question relationship helper functions...');

  try {
    // Begin transaction
    await executeSQL('BEGIN');

    // Create function to get questions for a quiz
    const createGetQuestionsFunction = `
      CREATE OR REPLACE FUNCTION payload.get_quiz_questions(quiz_id TEXT)
      RETURNS TABLE (
        id TEXT,
        title TEXT,
        type TEXT,
        "order" INTEGER
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          qq.id,
          qq.title,
          qq.type,
          COALESCE(r."order", 0) AS "order"
        FROM 
          payload.quiz_questions qq
        JOIN 
          payload.course_quizzes_rels r ON qq.id = r.id
        WHERE 
          r.parent_id = quiz_id AND
          r.path = 'questions'
        ORDER BY 
          r."order" ASC;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createGetQuestionsFunction);
    console.log('Created get_quiz_questions function');

    // Create function to get a quiz for a lesson
    const createGetLessonQuizFunction = `
      CREATE OR REPLACE FUNCTION payload.get_lesson_quiz(lesson_id TEXT)
      RETURNS TABLE (
        id TEXT,
        title TEXT
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          q.id,
          q.title
        FROM 
          payload.course_quizzes q
        JOIN 
          payload.course_lessons_rels r ON q.id = r.id
        WHERE 
          r.parent_id = lesson_id AND
          r.path = 'quiz'
        LIMIT 1;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createGetLessonQuizFunction);
    console.log('Created get_lesson_quiz function');

    // Create function to get questions for a survey
    const createGetSurveyQuestionsFunction = `
      CREATE OR REPLACE FUNCTION payload.get_survey_questions(survey_id TEXT)
      RETURNS TABLE (
        id TEXT,
        prompt TEXT,
        "order" INTEGER
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          sq.id,
          sq.prompt,
          COALESCE(r."order", 0) AS "order"
        FROM 
          payload.survey_questions sq
        JOIN 
          payload.surveys_rels r ON sq.id = r.id
        WHERE 
          r.parent_id = survey_id AND
          r.path = 'questions'
        ORDER BY 
          r."order" ASC;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createGetSurveyQuestionsFunction);
    console.log('Created get_survey_questions function');

    // Create function to get related downloads
    const createGetRelatedDownloadsFunction = `
      CREATE OR REPLACE FUNCTION payload.get_related_downloads(entity_id TEXT)
      RETURNS TABLE (
        id TEXT,
        title TEXT,
        filename TEXT,
        url TEXT
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          d.id,
          d.title,
          d.filename,
          d.url
        FROM 
          payload.downloads d
        WHERE 
          d.id IN (
            -- From course_lessons_rels
            SELECT r.id
            FROM payload.course_lessons_rels r
            WHERE r.parent_id = entity_id AND r.path = 'downloads'
            
            UNION ALL
            
            -- From courses_rels
            SELECT r.id
            FROM payload.courses_rels r
            WHERE r.parent_id = entity_id AND r.path = 'downloads'
          )
        ORDER BY 
          d.title ASC;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createGetRelatedDownloadsFunction);
    console.log('Created get_related_downloads function');

    // Create general utility function for relationship lookup
    const createLookupRelationshipsFunction = `
      CREATE OR REPLACE FUNCTION payload.lookup_relationships(
        source_collection TEXT,
        source_id TEXT,
        relationship_path TEXT
      )
      RETURNS TABLE (
        target_id TEXT,
        target_table TEXT,
        "order" INTEGER
      ) 
      LANGUAGE plpgsql
      AS $$
      DECLARE
        rel_table TEXT;
      BEGIN
        -- Determine the relationship table name
        rel_table := source_collection || '_rels';
        
        RETURN QUERY EXECUTE
          format('
            SELECT 
              r.id AS target_id,
              -- Try to determine the target table based on where the ID exists
              CASE
                WHEN EXISTS (SELECT 1 FROM payload.course_quizzes WHERE id = r.id) THEN ''course_quizzes''
                WHEN EXISTS (SELECT 1 FROM payload.quiz_questions WHERE id = r.id) THEN ''quiz_questions''
                WHEN EXISTS (SELECT 1 FROM payload.survey_questions WHERE id = r.id) THEN ''survey_questions''
                WHEN EXISTS (SELECT 1 FROM payload.downloads WHERE id = r.id) THEN ''downloads''
                WHEN EXISTS (SELECT 1 FROM payload.media WHERE id = r.id) THEN ''media''
                ELSE ''unknown''
              END AS target_table,
              r."order"
            FROM 
              payload.%I r
            WHERE 
              r.parent_id = $1 AND
              r.path = $2
            ORDER BY 
              r."order" ASC
          ', rel_table)
        USING source_id, relationship_path;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createLookupRelationshipsFunction);
    console.log('Created lookup_relationships function');

    // Create a function to summarize relationship consistency
    const createRelationshipConsistencyFunction = `
      CREATE OR REPLACE FUNCTION payload.check_relationship_consistency()
      RETURNS TABLE (
        relationship_type TEXT,
        total_count INTEGER,
        inconsistent_count INTEGER,
        consistency_percentage NUMERIC
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        WITH 
        -- Quiz-Question relationships
        quiz_questions AS (
          SELECT 
            'quiz_questions' AS rel_type,
            COUNT(*) AS total,
            SUM(CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM payload.quiz_questions qq WHERE qq.id = r.id
              ) THEN 1
              ELSE 0
            END) AS inconsistent
          FROM payload.course_quizzes_rels r
          WHERE r.path = 'questions'
        ),
        
        -- Lesson-Quiz relationships
        lesson_quizzes AS (
          SELECT 
            'lesson_quizzes' AS rel_type,
            COUNT(*) AS total,
            SUM(CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM payload.course_quizzes q WHERE q.id = r.id
              ) THEN 1
              ELSE 0
            END) AS inconsistent
          FROM payload.course_lessons_rels r
          WHERE r.path = 'quiz'
        ),
        
        -- Survey-Question relationships
        survey_questions AS (
          SELECT 
            'survey_questions' AS rel_type,
            COUNT(*) AS total,
            SUM(CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM payload.survey_questions sq WHERE sq.id = r.id
              ) THEN 1
              ELSE 0
            END) AS inconsistent
          FROM payload.surveys_rels r
          WHERE r.path = 'questions'
        ),
        
        -- Download relationships
        downloads AS (
          SELECT 
            'downloads' AS rel_type,
            COUNT(*) AS total,
            SUM(CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM payload.downloads d WHERE d.id = r.id
              ) THEN 1
              ELSE 0
            END) AS inconsistent
          FROM (
            SELECT id, parent_id, path FROM payload.course_lessons_rels WHERE path = 'downloads'
            UNION ALL
            SELECT id, parent_id, path FROM payload.courses_rels WHERE path = 'downloads'
          ) r
        )
        
        -- Combine all relationship types
        SELECT 
          rel_type AS relationship_type,
          total AS total_count,
          inconsistent AS inconsistent_count,
          CASE
            WHEN total = 0 THEN 100
            ELSE ROUND((1 - (inconsistent::NUMERIC / total::NUMERIC)) * 100, 2)
          END AS consistency_percentage
        FROM (
          SELECT * FROM quiz_questions
          UNION ALL SELECT * FROM lesson_quizzes
          UNION ALL SELECT * FROM survey_questions
          UNION ALL SELECT * FROM downloads
        ) combined
        ORDER BY consistency_percentage ASC;
        
        -- Return an empty result set if no results
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;

    await executeSQL(createRelationshipConsistencyFunction);
    console.log('Created check_relationship_consistency function');

    // Commit transaction
    await executeSQL('COMMIT');
    console.log('All relationship helper functions created successfully');

    return true;
  } catch (error) {
    // Rollback transaction on error
    await executeSQL('ROLLBACK');
    console.error('Error creating relationship helper functions:', error);
    return false;
  }
}

/**
 * Create all relationship helper functions
 *
 * @returns True if all functions were created successfully
 */
export async function createAllRelationshipHelpers(): Promise<boolean> {
  try {
    return await createQuizQuestionHelpers();
  } catch (error) {
    console.error('Error creating all relationship helpers:', error);
    return false;
  }
}
