/**
 * Create Fallback Functions with Direct SQL (no Drizzle ORM)
 *
 * This script creates database functions that act as fallbacks for relationship management.
 * It uses direct SQL queries with the pg client instead of Drizzle ORM.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
const projectRoot = path.resolve(__dirname, '../../../../../../../');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Get environment variables from .env.development file
try {
    const envFilePath = path.resolve(__dirname, '../../../../../.env.development');
    console.log(`Loading environment variables from: ${envFilePath}`);
    dotenv.config({ path: envFilePath });
}
catch (error) {
    console.warn('Could not load .env.development file:', error);
    // Try alternate path in case we're running from different location
    const alternatePath = path.resolve(__dirname, '../../../../../../.env.development');
    console.log(`Trying alternate path: ${alternatePath}`);
    dotenv.config({ path: alternatePath });
}
// Database connection settings
const DATABASE_URI = process.env.DATABASE_URI ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
/**
 * Creates the fallback functions in the database
 */
async function createFallbackFunctions() {
    console.log(chalk.blue('\n=== CREATING FALLBACK FUNCTIONS ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    const pool = new Pool({ connectionString: DATABASE_URI });
    try {
        console.log('Connected to database');
        // Start a transaction
        await pool.query('BEGIN');
        try {
            // 1. Create function to get lesson quiz relationship
            console.log(chalk.cyan('Creating get_lesson_quiz function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_lesson_quiz(lesson_id TEXT)
        RETURNS TABLE (
          quiz_id TEXT,
          quiz_title TEXT,
          question_count INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            cq.id,
            cq.title,
            COALESCE(
              (SELECT COUNT(*) FROM payload.course_quizzes_rels cqr 
               WHERE cqr.parent_id = cq.id AND cqr.quiz_questions_id IS NOT NULL),
              0
            )::INTEGER
          FROM 
            payload.course_lessons cl
          JOIN 
            payload.course_lessons_rels clr ON cl.id = clr.parent_id
          JOIN 
            payload.course_quizzes cq ON clr.course_quizzes_id = cq.id
          WHERE 
            cl.id = lesson_id
          LIMIT 1;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_lesson_quiz function'));
            // 2. Create function to get quiz questions
            console.log(chalk.cyan('Creating get_quiz_questions function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_quiz_questions(quiz_id TEXT)
        RETURNS TABLE (
          question_id TEXT,
          question_text TEXT,
          question_order INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            qq.id,
            qq.text,
            cqr.order::INTEGER
          FROM 
            payload.course_quizzes cq
          JOIN 
            payload.course_quizzes_rels cqr ON cq.id = cqr.parent_id
          JOIN 
            payload.quiz_questions qq ON cqr.quiz_questions_id = qq.id
          WHERE 
            cq.id = quiz_id
          ORDER BY
            cqr.order ASC NULLS LAST;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_quiz_questions function'));
            // 3. Create function to get lesson downloads
            console.log(chalk.cyan('Creating get_lesson_downloads function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_lesson_downloads(lesson_id TEXT)
        RETURNS TABLE (
          download_id TEXT,
          download_title TEXT,
          download_filename TEXT,
          download_path TEXT,
          download_url TEXT,
          download_filesize INTEGER,
          download_mimetype TEXT
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            dl.id,
            dl.title,
            dl.filename,
            dl.path,
            dl.url,
            dl.filesize::INTEGER,
            dl.mimetype
          FROM 
            payload.course_lessons cl
          JOIN 
            payload.course_lessons_rels clr ON cl.id = clr.parent_id
          JOIN 
            payload.downloads dl ON clr.downloads_id = dl.id
          WHERE 
            cl.id = lesson_id
          ORDER BY
            clr.order ASC NULLS LAST;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_lesson_downloads function'));
            // 4. Create function to get survey questions
            console.log(chalk.cyan('Creating get_survey_questions function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_survey_questions(survey_id TEXT)
        RETURNS TABLE (
          question_id TEXT,
          question_text TEXT,
          question_order INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            sq.id,
            sq.text,
            sr.order::INTEGER
          FROM 
            payload.surveys s
          JOIN 
            payload.surveys_rels sr ON s.id = sr.parent_id
          JOIN 
            payload.survey_questions sq ON sr.survey_questions_id = sq.id
          WHERE 
            s.id = survey_id
          ORDER BY
            sr.order ASC NULLS LAST;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_survey_questions function'));
            // 5. Create function to get course lessons
            console.log(chalk.cyan('Creating get_course_lessons function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_course_lessons(course_id TEXT)
        RETURNS TABLE (
          lesson_id TEXT,
          lesson_title TEXT,
          lesson_slug TEXT,
          lesson_order INTEGER,
          has_quiz BOOLEAN,
          quiz_id TEXT,
          quiz_title TEXT
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            cl.id,
            cl.title,
            cl.slug,
            cl.order::INTEGER,
            (EXISTS (
              SELECT 1 FROM payload.course_lessons_rels clr 
              WHERE clr.parent_id = cl.id AND clr.course_quizzes_id IS NOT NULL
            ))::BOOLEAN,
            cq.id,
            cq.title
          FROM 
            payload.course_lessons cl
          LEFT JOIN 
            payload.course_lessons_rels clr ON cl.id = clr.parent_id AND clr.course_quizzes_id IS NOT NULL
          LEFT JOIN 
            payload.course_quizzes cq ON clr.course_quizzes_id = cq.id
          WHERE 
            cl.course_id = course_id
          ORDER BY
            cl.order ASC NULLS LAST;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_course_lessons function'));
            // 6. Create generic relationship lookup function
            console.log(chalk.cyan('Creating get_related_items function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.get_related_items(
          collection TEXT, 
          item_id TEXT,
          target_collection TEXT
        )
        RETURNS TABLE (
          id TEXT,
          title TEXT,
          rel_order INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
          relationship_table TEXT;
          relationship_id_column TEXT;
          query TEXT;
        BEGIN
          -- Determine the relationship table name
          IF collection = 'course_lessons' AND target_collection = 'course_quizzes' THEN
            relationship_table := 'payload.course_lessons_rels';
            relationship_id_column := 'course_quizzes_id';
          ELSIF collection = 'course_quizzes' AND target_collection = 'quiz_questions' THEN
            relationship_table := 'payload.course_quizzes_rels';
            relationship_id_column := 'quiz_questions_id';
          ELSIF collection = 'surveys' AND target_collection = 'survey_questions' THEN
            relationship_table := 'payload.surveys_rels';
            relationship_id_column := 'survey_questions_id';
          ELSE
            -- Return empty result if relationship not supported
            RETURN;
          END IF;
          
          -- Build and execute dynamic query
          query := format('
            SELECT 
              t.id,
              CASE 
                WHEN %L = ''quiz_questions'' OR %L = ''survey_questions'' THEN t.text
                ELSE t.title
              END as title,
              r.order::INTEGER
            FROM 
              %s r
            JOIN 
              payload.%I t ON r.%I = t.id
            WHERE 
              r.parent_id = %L
            ORDER BY
              r.order ASC NULLS LAST',
            target_collection, target_collection, relationship_table, 
            target_collection, relationship_id_column, item_id
          );

          RETURN QUERY EXECUTE query;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created get_related_items function'));
            // 7. Create relationship detection helper function
            console.log(chalk.cyan('Creating detect_relationships function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.detect_relationships(
          collection TEXT, 
          item_id TEXT
        )
        RETURNS TABLE (
          related_collection TEXT,
          count INTEGER
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF collection = 'course_lessons' THEN
            RETURN QUERY
            SELECT 
              'course_quizzes'::TEXT as related_collection,
              COUNT(*)::INTEGER
            FROM 
              payload.course_lessons_rels
            WHERE 
              parent_id = item_id AND course_quizzes_id IS NOT NULL
            UNION ALL
            SELECT 
              'downloads'::TEXT,
              COUNT(*)::INTEGER
            FROM 
              payload.course_lessons_rels
            WHERE 
              parent_id = item_id AND downloads_id IS NOT NULL;
              
          ELSIF collection = 'course_quizzes' THEN
            RETURN QUERY
            SELECT 
              'quiz_questions'::TEXT,
              COUNT(*)::INTEGER
            FROM 
              payload.course_quizzes_rels
            WHERE 
              parent_id = item_id AND quiz_questions_id IS NOT NULL
            UNION ALL
            SELECT 
              'course_lessons'::TEXT,
              COUNT(*)::INTEGER
            FROM 
              payload.course_quizzes_rels
            WHERE 
              parent_id = item_id AND course_lessons_id IS NOT NULL;
              
          ELSIF collection = 'surveys' THEN
            RETURN QUERY
            SELECT 
              'survey_questions'::TEXT,
              COUNT(*)::INTEGER
            FROM 
              payload.surveys_rels
            WHERE 
              parent_id = item_id AND survey_questions_id IS NOT NULL;
              
          ELSE
            -- Return empty result for unsupported collections
            RETURN;
          END IF;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created detect_relationships function'));
            // 8. Create function to ensure fallbacks are enabled
            console.log(chalk.cyan('Creating ensure_fallbacks_enabled function...'));
            await pool.query(`
        CREATE OR REPLACE FUNCTION payload.ensure_fallbacks_enabled()
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        AS $$
        DECLARE
          views_exist BOOLEAN;
          functions_exist BOOLEAN;
        BEGIN
          -- Check if views exist
          SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'payload' AND table_name = 'unified_relationships'
          ) INTO views_exist;
          
          -- Check if functions exist
          SELECT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'payload' AND routine_name = 'get_lesson_quiz'
          ) INTO functions_exist;
          
          -- Return status
          RETURN views_exist AND functions_exist;
        END;
        $$;
      `);
            console.log(chalk.green('✓ Created ensure_fallbacks_enabled function'));
            // Commit the transaction
            await pool.query('COMMIT');
            console.log(chalk.green('\n✓ Successfully created all fallback functions'));
            return { success: true };
        }
        catch (error) {
            // Rollback the transaction on error
            await pool.query('ROLLBACK');
            console.error(chalk.red('Error creating fallback functions:'), error);
            return { success: false, error: error.message };
        }
    }
    catch (error) {
        console.error(chalk.red('Database connection error:'), error);
        return { success: false, error: error.message };
    }
    finally {
        await pool.end();
        console.log('Database connection closed');
    }
}
// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    createFallbackFunctions()
        .then((result) => {
        if (result.success) {
            console.log(chalk.green('Fallback functions creation completed successfully'));
            process.exit(0);
        }
        else {
            console.error(chalk.red('Fallback functions creation failed:'), result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
export { createFallbackFunctions };
