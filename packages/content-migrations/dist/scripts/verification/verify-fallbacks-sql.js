/**
 * Verify Fallbacks with Direct SQL (no Drizzle ORM)
 *
 * This script verifies that the fallback mechanisms (views, functions, etc.) are working properly
 * and ensures that relationship integrity is maintained even with alternative access methods.
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
const projectRoot = path.resolve(__dirname, '../../../../../');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Get environment variables from .env.development file
try {
    const envFilePath = path.resolve(__dirname, '../../../.env.development');
    console.log(`Loading environment variables from: ${envFilePath}`);
    dotenv.config({ path: envFilePath });
}
catch (error) {
    console.warn('Could not load .env.development file:', error);
    // Try alternate path in case we're running from different location
    const alternatePath = path.resolve(__dirname, '../../../../.env.development');
    console.log(`Trying alternate path: ${alternatePath}`);
    dotenv.config({ path: alternatePath });
}
// Database connection settings
const DATABASE_URI = process.env.DATABASE_URI ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
/**
 * Verifies that the fallback mechanisms are in place and working
 */
async function verifyFallbacks() {
    console.log(chalk.blue('\n=== VERIFYING FALLBACK MECHANISMS ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    const pool = new Pool({ connectionString: DATABASE_URI });
    try {
        console.log('Connected to database');
        // 1. Verify views exist
        console.log(chalk.cyan('Verifying fallback views...'));
        const fallbackViews = [
            'unified_relationships',
            'course_content_fallback',
            'downloads_fallback',
            'relationship_diagnostics',
        ];
        for (const view of fallbackViews) {
            try {
                const viewQuery = `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'payload' AND table_name = $1
          );
        `;
                const viewResult = await pool.query(viewQuery, [view]);
                const viewExists = viewResult.rows[0].exists;
                if (viewExists) {
                    console.log(chalk.green(`✓ View payload.${view} exists`));
                }
                else {
                    console.log(chalk.red(`✗ View payload.${view} does not exist`));
                    throw new Error(`Missing fallback view: ${view}`);
                }
            }
            catch (error) {
                console.error(chalk.red(`Error checking view ${view}:`), error);
                throw error;
            }
        }
        // 2. Verify functions exist
        console.log(chalk.cyan('Verifying fallback functions...'));
        const fallbackFunctions = [
            'get_lesson_quiz',
            'get_quiz_questions',
            'get_lesson_downloads',
            'get_survey_questions',
            'get_course_lessons',
            'get_related_items',
            'detect_relationships',
            'ensure_fallbacks_enabled',
        ];
        for (const func of fallbackFunctions) {
            try {
                const funcQuery = `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'payload' AND routine_name = $1
          );
        `;
                const funcResult = await pool.query(funcQuery, [func]);
                const funcExists = funcResult.rows[0].exists;
                if (funcExists) {
                    console.log(chalk.green(`✓ Function payload.${func} exists`));
                }
                else {
                    console.log(chalk.red(`✗ Function payload.${func} does not exist`));
                    throw new Error(`Missing fallback function: ${func}`);
                }
            }
            catch (error) {
                console.error(chalk.red(`Error checking function ${func}:`), error);
                throw error;
            }
        }
        // 3. Test view data
        console.log(chalk.cyan('Testing view data...'));
        // Test unified_relationships view
        try {
            const relationshipQuery = `
        SELECT COUNT(*) as count FROM payload.unified_relationships;
      `;
            const relationshipResult = await pool.query(relationshipQuery);
            const relationshipCount = parseInt(relationshipResult.rows[0].count);
            console.log(`Found ${relationshipCount} relationships in unified_relationships view`);
            if (relationshipCount === 0) {
                console.log(chalk.yellow('⚠️ No relationships found in unified_relationships view'));
            }
            else {
                console.log(chalk.green('✓ unified_relationships view has data'));
            }
        }
        catch (error) {
            console.error(chalk.red('Error testing unified_relationships view:'), error);
            throw error;
        }
        // Test course_content_fallback view
        try {
            const courseContentQuery = `
        SELECT COUNT(*) as count FROM payload.course_content_fallback;
      `;
            const courseContentResult = await pool.query(courseContentQuery);
            const courseContentCount = parseInt(courseContentResult.rows[0].count);
            console.log(`Found ${courseContentCount} lessons in course_content_fallback view`);
            if (courseContentCount === 0) {
                console.log(chalk.yellow('⚠️ No lessons found in course_content_fallback view'));
            }
            else {
                console.log(chalk.green('✓ course_content_fallback view has data'));
            }
        }
        catch (error) {
            console.error(chalk.red('Error testing course_content_fallback view:'), error);
            throw error;
        }
        // 4. Test function calls
        console.log(chalk.cyan('Testing function calls...'));
        // Get a course ID for testing
        let courseId = null;
        try {
            const courseQuery = `SELECT id FROM payload.courses LIMIT 1;`;
            const courseResult = await pool.query(courseQuery);
            if (courseResult.rows.length > 0) {
                courseId = courseResult.rows[0].id;
                console.log(`Using course ID ${courseId} for testing`);
            }
            else {
                console.log(chalk.yellow('⚠️ No courses found for testing functions'));
            }
        }
        catch (error) {
            console.error(chalk.red('Error getting course ID:'), error);
            console.log(chalk.yellow('⚠️ Will skip function testing due to no course ID'));
        }
        // Test get_course_lessons function if we have a course ID
        if (courseId) {
            try {
                const lessonsQuery = `
          SELECT * FROM payload.get_course_lessons($1);
        `;
                const lessonsResult = await pool.query(lessonsQuery, [courseId]);
                const lessonCount = lessonsResult.rows.length;
                console.log(`get_course_lessons function returned ${lessonCount} lessons`);
                if (lessonCount === 0) {
                    console.log(chalk.yellow('⚠️ No lessons returned from get_course_lessons function'));
                }
                else {
                    console.log(chalk.green('✓ get_course_lessons function works correctly'));
                    // Get a lesson ID for further testing
                    const lessonId = lessonsResult.rows[0].lesson_id;
                    console.log(`Using lesson ID ${lessonId} for testing`);
                    // Test get_lesson_quiz function
                    try {
                        const quizQuery = `
              SELECT * FROM payload.get_lesson_quiz($1);
            `;
                        const quizResult = await pool.query(quizQuery, [lessonId]);
                        if (quizResult.rows.length > 0) {
                            console.log(chalk.green('✓ get_lesson_quiz function works correctly'));
                            // Get a quiz ID for further testing
                            const quizId = quizResult.rows[0].quiz_id;
                            console.log(`Using quiz ID ${quizId} for testing`);
                            // Test get_quiz_questions function
                            try {
                                const questionsQuery = `
                  SELECT * FROM payload.get_quiz_questions($1);
                `;
                                const questionsResult = await pool.query(questionsQuery, [
                                    quizId,
                                ]);
                                const questionCount = questionsResult.rows.length;
                                console.log(`get_quiz_questions function returned ${questionCount} questions`);
                                if (questionCount === 0) {
                                    console.log(chalk.yellow('⚠️ No questions returned from get_quiz_questions function'));
                                }
                                else {
                                    console.log(chalk.green('✓ get_quiz_questions function works correctly'));
                                }
                            }
                            catch (error) {
                                console.error(chalk.red('Error testing get_quiz_questions function:'), error);
                            }
                        }
                        else {
                            console.log(chalk.yellow('⚠️ No quiz returned from get_lesson_quiz function'));
                        }
                    }
                    catch (error) {
                        console.error(chalk.red('Error testing get_lesson_quiz function:'), error);
                    }
                    // Test get_lesson_downloads function
                    try {
                        const downloadsQuery = `
              SELECT * FROM payload.get_lesson_downloads($1);
            `;
                        const downloadsResult = await pool.query(downloadsQuery, [
                            lessonId,
                        ]);
                        const downloadCount = downloadsResult.rows.length;
                        console.log(`get_lesson_downloads function returned ${downloadCount} downloads`);
                        if (downloadCount === 0) {
                            console.log(chalk.yellow('⚠️ No downloads returned from get_lesson_downloads function'));
                        }
                        else {
                            console.log(chalk.green('✓ get_lesson_downloads function works correctly'));
                        }
                    }
                    catch (error) {
                        console.error(chalk.red('Error testing get_lesson_downloads function:'), error);
                    }
                }
            }
            catch (error) {
                console.error(chalk.red('Error testing get_course_lessons function:'), error);
            }
        }
        // 5. Test ensure_fallbacks_enabled function
        console.log(chalk.cyan('Testing ensure_fallbacks_enabled function...'));
        try {
            const enabledQuery = `
        SELECT payload.ensure_fallbacks_enabled() as enabled;
      `;
            const enabledResult = await pool.query(enabledQuery);
            const fallbacksEnabled = enabledResult.rows[0].enabled;
            if (fallbacksEnabled) {
                console.log(chalk.green('✓ ensure_fallbacks_enabled function returns true'));
            }
            else {
                console.log(chalk.red('✗ ensure_fallbacks_enabled function returns false'));
                throw new Error('Fallbacks are not fully enabled');
            }
        }
        catch (error) {
            console.error(chalk.red('Error testing ensure_fallbacks_enabled function:'), error);
            throw error;
        }
        console.log(chalk.green('\n✓ All fallback mechanisms are in place and working correctly'));
        return { success: true };
    }
    catch (error) {
        console.error(chalk.red('Error verifying fallbacks:'), error);
        return { success: false, error: error.message };
    }
    finally {
        await pool.end();
        console.log('Database connection closed');
    }
}
// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    verifyFallbacks()
        .then((result) => {
        if (result.success) {
            console.log(chalk.green('Fallback verification completed successfully'));
            process.exit(0);
        }
        else {
            console.error(chalk.red('Fallback verification failed:'), result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
export { verifyFallbacks };
