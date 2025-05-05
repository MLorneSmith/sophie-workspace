import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { logger } from '@kit/shared/logger';
import { getDrizzleInstance } from './utils.js';
/**
 * Generates static mappings for fallback relationships
 * These mappings are used when database-level fallbacks fail
 * and provide a last resort for retrieving relationship data
 */
export async function generateStaticMappings() {
    const drizzle = await getDrizzleInstance();
    try {
        logger.info({ script: 'generate-static-mappings' }, 'Generating static relationship mappings');
        // Create mappings directory if it doesn't exist
        const mappingsDir = path.join(process.cwd(), 'packages/content-migrations/src/data/mappings');
        if (!fs.existsSync(mappingsDir)) {
            fs.mkdirSync(mappingsDir, { recursive: true });
        }
        // Generate mappings for every relationship in fallback_relationships table
        const mappingQuery = `
      SELECT DISTINCT 
        collection, 
        field_name
      FROM 
        payload.fallback_relationships
    `;
        const mappingRelations = await drizzle.execute(sql.raw(mappingQuery));
        // Process each collection/field relationship
        for (const relation of mappingRelations) {
            if (!relation.collection || !relation.field_name)
                continue;
            // Get all mappings for this collection/field
            const relDataQuery = `
        SELECT 
          document_id, 
          related_ids
        FROM 
          payload.fallback_relationships
        WHERE 
          collection = '${relation.collection}'
          AND field_name = '${relation.field_name}'
      `;
            const relData = await drizzle.execute(sql.raw(relDataQuery));
            // Skip if no data
            if (!relData || relData.length === 0)
                continue;
            // Create mapping object
            const mapping = {};
            // Fill mapping object
            for (const record of relData) {
                if (record.document_id &&
                    Array.isArray(record.related_ids) &&
                    record.related_ids.length > 0) {
                    mapping[record.document_id] = record.related_ids;
                }
            }
            // Skip if no mappings
            if (Object.keys(mapping).length === 0)
                continue;
            // Write mapping file
            const fileName = `${relation.collection}_${relation.field_name}.json`;
            const filePath = path.join(mappingsDir, fileName);
            fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2));
            logger.info({
                script: 'generate-static-mappings',
                collection: relation.collection,
                field: relation.field_name,
                records: Object.keys(mapping).length,
            }, `Generated static mapping file: ${fileName}`);
        }
        // Also generate special mappings for common problematic relationships
        // 1. Lesson-quiz mappings
        const lessonQuizQuery = `
      SELECT 
        cl.id as lesson_id, 
        cq.id as quiz_id
      FROM 
        payload.course_lessons cl
      JOIN payload.course_lessons_rels rel 
        ON rel.child_id = cl.id
      JOIN payload.course_quizzes cq 
        ON rel.parent_id = cq.id
    `;
        const lessonQuizData = await drizzle.execute(sql.raw(lessonQuizQuery));
        if (lessonQuizData && lessonQuizData.length > 0) {
            const lessonQuizMapping = {};
            for (const record of lessonQuizData) {
                if (record.lesson_id && record.quiz_id) {
                    lessonQuizMapping[record.lesson_id] = [record.quiz_id];
                }
            }
            if (Object.keys(lessonQuizMapping).length > 0) {
                const filePath = path.join(mappingsDir, 'course_lessons_quiz.json');
                fs.writeFileSync(filePath, JSON.stringify(lessonQuizMapping, null, 2));
                logger.info({
                    script: 'generate-static-mappings',
                    records: Object.keys(lessonQuizMapping).length,
                }, 'Generated static mapping file for lesson-quiz relationships');
            }
        }
        // 2. Quiz-questions mappings
        const quizQuestionsQuery = `
      SELECT 
        cq.id as quiz_id, 
        array_agg(qq.id) as question_ids
      FROM 
        payload.course_quizzes cq
      JOIN payload.quiz_questions_rels rel 
        ON rel.child_id = cq.id
      JOIN payload.quiz_questions qq 
        ON rel.parent_id = qq.id
      GROUP BY 
        cq.id
    `;
        const quizQuestionsData = await drizzle.execute(sql.raw(quizQuestionsQuery));
        if (quizQuestionsData && quizQuestionsData.length > 0) {
            const quizQuestionsMapping = {};
            for (const record of quizQuestionsData) {
                if (record.quiz_id &&
                    Array.isArray(record.question_ids) &&
                    record.question_ids.length > 0) {
                    quizQuestionsMapping[record.quiz_id] = record.question_ids;
                }
            }
            if (Object.keys(quizQuestionsMapping).length > 0) {
                const filePath = path.join(mappingsDir, 'course_quizzes_questions.json');
                fs.writeFileSync(filePath, JSON.stringify(quizQuestionsMapping, null, 2));
                logger.info({
                    script: 'generate-static-mappings',
                    records: Object.keys(quizQuestionsMapping).length,
                }, 'Generated static mapping file for quiz-questions relationships');
            }
        }
        logger.info({ script: 'generate-static-mappings' }, 'Static relationship mappings generated successfully');
        return { success: true };
    }
    catch (error) {
        logger.error({ script: 'generate-static-mappings', error }, 'Failed to generate static mappings');
        return { success: false, error };
    }
}
// Run the function directly if executed as a script
if (require.main === module) {
    generateStaticMappings()
        .then((result) => {
        if (result.success) {
            console.log('Successfully generated static mappings');
            process.exit(0);
        }
        else {
            console.error('Failed to generate static mappings:', result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}
