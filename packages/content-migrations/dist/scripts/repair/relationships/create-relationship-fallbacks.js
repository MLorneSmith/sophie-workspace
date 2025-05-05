/**
 * Create fallback systems for relationship handling
 *
 * This script creates:
 * 1. Database views for stable relationship access
 * 2. Helper functions for retrieving relationship data
 * 3. JSON mapping files for hard-coded fallbacks
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeSQL } from '../../../utils/db/execute-sql.js';
// Calculate the project root for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');
/**
 * Create fallback views and functions for relationship handling
 */
export async function createRelationshipFallbacks() {
    try {
        // Start a transaction to ensure atomicity
        await executeSQL('BEGIN');
        // Step 1: Create a fallback view for course_quizzes relationships
        console.log('Creating fallback views for relationship handling...');
        const createQuizRelationshipsView = `
      CREATE OR REPLACE VIEW payload.course_quizzes_relationships AS
      SELECT 
        cq.id as quiz_id,
        qq.id as question_id,
        cq.title as quiz_title,
        qq.title as question_title,
        COALESCE(r."order", 0) as "order"
      FROM 
        payload.course_quizzes cq
      LEFT JOIN 
        payload.quiz_questions_rels r ON cq.id = r.parent_id
      LEFT JOIN 
        payload.quiz_questions qq ON r.id = qq.id
    `;
        await executeSQL(createQuizRelationshipsView);
        console.log('Created course_quizzes_relationships view');
        // Step 2: Create a function to get questions for a quiz
        console.log('Creating helper functions for relationship data retrieval...');
        const createGetQuestionsFunction = `
      CREATE OR REPLACE FUNCTION payload.get_quiz_questions(quiz_id TEXT)
      RETURNS TABLE (
        id TEXT,
        title TEXT,
        "order" INTEGER
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          qq.id,
          qq.title,
          COALESCE(r."order", 0) as "order"
        FROM 
          payload.quiz_questions qq
        JOIN 
          payload.quiz_questions_rels r ON qq.id = r.id
        WHERE 
          r.parent_id = quiz_id
        ORDER BY 
          r."order" ASC;
        
        -- Return an empty row if no results to prevent null issues
        IF NOT FOUND THEN
          RETURN;
        END IF;
      END;
      $$;
    `;
        await executeSQL(createGetQuestionsFunction);
        console.log('Created get_quiz_questions function');
        // Step 3: Create mapping file for hard-coded relationship mappings as last resort
        console.log('Creating JSON mapping files for hard-coded fallbacks...');
        const mappingsDir = path.join(projectRoot, 'src', 'data', 'mappings');
        // Ensure directory exists
        await fs.mkdir(mappingsDir, { recursive: true });
        // Get quiz-question relationships
        const quizQuestionQuery = `
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        qq.id as question_id,
        qq.title as question_title
      FROM 
        payload.course_quizzes cq
      JOIN 
        payload.quiz_questions_rels r ON cq.id = r.parent_id
      JOIN 
        payload.quiz_questions qq ON r.id = qq.id
    `;
        const quizQuestionRelationships = await executeSQL(quizQuestionQuery);
        // Format relationships as mapping object
        const quizQuestionMappings = {};
        for (const row of quizQuestionRelationships.rows) {
            if (!quizQuestionMappings[row.quiz_id]) {
                quizQuestionMappings[row.quiz_id] = {
                    title: row.quiz_title,
                    questions: [],
                };
            }
            quizQuestionMappings[row.quiz_id].questions.push({
                id: row.question_id,
                title: row.question_title,
            });
        }
        // Write to file
        const mappingFilePath = path.join(mappingsDir, 'quiz-question-mappings.json');
        await fs.writeFile(mappingFilePath, JSON.stringify(quizQuestionMappings, null, 2));
        console.log(`Created quiz-question mappings file at ${mappingFilePath}`);
        // Step 4: Create a view for downloadable content relationships
        const createDownloadsView = `
      CREATE OR REPLACE VIEW payload.downloads_relationships AS
      SELECT 
        d.id as download_id,
        d.title as download_title,
        d.filename,
        d.url,
        CASE
          WHEN cl.id IS NOT NULL THEN 'course_lessons'
          WHEN c.id IS NOT NULL THEN 'courses'
          ELSE NULL
        END as parent_type,
        COALESCE(cl.id, c.id) as parent_id
      FROM 
        payload.downloads d
      LEFT JOIN 
        payload.course_lessons_rels r1 ON d.id = r1.id
      LEFT JOIN 
        payload.course_lessons cl ON r1.parent_id = cl.id
      LEFT JOIN 
        payload.courses_rels r2 ON d.id = r2.id
      LEFT JOIN 
        payload.courses c ON r2.parent_id = c.id
    `;
        await executeSQL(createDownloadsView);
        console.log('Created downloads_relationships view');
        // Commit the transaction
        await executeSQL('COMMIT');
        console.log('All relationship fallbacks created successfully');
        return true;
    }
    catch (error) {
        // Rollback on error
        try {
            await executeSQL('ROLLBACK');
        }
        catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        console.error('Error creating relationship fallbacks:', error);
        return false;
    }
}
/**
 * Main function to run the relationship fallbacks creation
 */
async function main() {
    try {
        console.log('Starting creation of relationship fallbacks...');
        const success = await createRelationshipFallbacks();
        if (success) {
            console.log('Relationship fallbacks created successfully');
        }
        else {
            console.error('Failed to create relationship fallbacks');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error creating relationship fallbacks:', error);
        process.exit(1);
    }
}
// Run the main function
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
