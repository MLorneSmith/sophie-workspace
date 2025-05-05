/**
 * Script to generate a comprehensive migration status report
 * Shows what content exists, relationships, and potential issues
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
// Structured reporting with colored output
const reportSection = (title) => {
    console.log('\n' + chalk.blue.bold(`=== ${title} ===`));
};
const reportSuccess = (message) => {
    console.log(chalk.green(`✓ ${message}`));
};
const reportWarning = (message) => {
    console.log(chalk.yellow(`⚠ ${message}`));
};
const reportError = (message) => {
    console.log(chalk.red(`✗ ${message}`));
};
const reportInfo = (message) => {
    console.log(chalk.white(`→ ${message}`));
};
async function generateMigrationReport() {
    // Database connection setup
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        reportError('DATABASE_URI environment variable is not set');
        return;
    }
    const pool = new Pool({ connectionString: databaseUri });
    const client = await pool.connect();
    try {
        reportSection('DATABASE CONNECTION');
        reportSuccess('Connected to database');
        // Report structure statistics
        reportSection('DATABASE STRUCTURE');
        const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      ORDER BY table_name
    `);
        reportSuccess(`Found ${tables.rows.length} tables in payload schema`);
        // Report content statistics
        reportSection('CONTENT STATISTICS');
        // Courses and lessons
        const courses = await client.query(`SELECT COUNT(*) FROM payload.courses`);
        reportInfo(`Courses: ${courses.rows[0].count}`);
        const lessons = await client.query(`SELECT COUNT(*) FROM payload.course_lessons`);
        reportInfo(`Lessons: ${lessons.rows[0].count}`);
        const quizzes = await client.query(`SELECT COUNT(*) FROM payload.course_quizzes`);
        reportInfo(`Quizzes: ${quizzes.rows[0].count}`);
        // Blog posts
        const posts = await client.query(`SELECT COUNT(*) FROM payload.posts`);
        reportInfo(`Blog Posts: ${posts.rows[0].count}`);
        // Private posts
        try {
            const privatePosts = await client.query(`SELECT COUNT(*) FROM payload.private`);
            reportInfo(`Private Posts: ${privatePosts.rows[0].count}`);
        }
        catch (err) {
            reportWarning(`Private posts table not found or not accessible`);
        }
        // Downloads
        try {
            const downloads = await client.query(`SELECT COUNT(*) FROM payload.downloads`);
            reportInfo(`Downloads: ${downloads.rows[0].count}`);
        }
        catch (err) {
            reportWarning(`Downloads table not found or not accessible`);
        }
        // Survey-related content
        try {
            const surveys = await client.query(`SELECT COUNT(*) FROM payload.surveys`);
            reportInfo(`Surveys: ${surveys.rows[0].count}`);
            const surveyQuestions = await client.query(`SELECT COUNT(*) FROM payload.survey_questions`);
            reportInfo(`Survey Questions: ${surveyQuestions.rows[0].count}`);
        }
        catch (err) {
            reportWarning(`Surveys tables not found or not accessible`);
        }
        // Files in raw data directory
        reportSection('SOURCE DATA');
        // Check blog posts source files
        const postsDir = path.resolve(__dirname, '../../../data/raw/posts');
        if (fs.existsSync(postsDir)) {
            const sourcePostFiles = fs.readdirSync(postsDir)
                .filter(file => file.endsWith('.html') || file.endsWith('.mdoc'));
            reportInfo(`Source Blog Post Files: ${sourcePostFiles.length}`);
            // Compare with database
            if (sourcePostFiles.length > parseInt(posts.rows[0].count)) {
                reportWarning(`Some source blog posts haven't been migrated (${sourcePostFiles.length} files, ${posts.rows[0].count} in DB)`);
            }
            else if (sourcePostFiles.length < parseInt(posts.rows[0].count)) {
                reportWarning(`More blog posts in DB than source files (${posts.rows[0].count} in DB, ${sourcePostFiles.length} files)`);
            }
            else {
                reportSuccess(`Blog post count matches between source and database`);
            }
        }
        else {
            reportWarning(`Blog posts directory not found: ${postsDir}`);
        }
        // Check private posts source files
        const privatePostsDir = path.resolve(__dirname, '../../../data/raw/bpm');
        if (fs.existsSync(privatePostsDir)) {
            const sourcePrivateFiles = fs.readdirSync(privatePostsDir)
                .filter(file => file.endsWith('.html') || file.endsWith('.mdoc'));
            reportInfo(`Source Private Post Files: ${sourcePrivateFiles.length}`);
            try {
                // Compare with database
                const privatePosts = await client.query(`SELECT COUNT(*) FROM payload.private`);
                if (sourcePrivateFiles.length > parseInt(privatePosts.rows[0].count)) {
                    reportWarning(`Some source private posts haven't been migrated (${sourcePrivateFiles.length} files, ${privatePosts.rows[0].count} in DB)`);
                }
                else if (sourcePrivateFiles.length < parseInt(privatePosts.rows[0].count)) {
                    reportWarning(`More private posts in DB than source files (${privatePosts.rows[0].count} in DB, ${sourcePrivateFiles.length} files)`);
                }
                else {
                    reportSuccess(`Private post count matches between source and database`);
                }
            }
            catch (err) {
                reportWarning(`Cannot compare private posts due to DB error`);
            }
        }
        else {
            reportWarning(`Private posts directory not found: ${privatePostsDir}`);
        }
        // Check relationship tables
        reportSection('RELATIONSHIP TABLES');
        const uuidTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
    `);
        reportInfo(`UUID-named relationship tables: ${uuidTables.rows.length}`);
        // Sample a few UUID tables to check their structure
        if (uuidTables.rows.length > 0) {
            const sampleTable = uuidTables.rows[0].table_name;
            const columns = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = $1
      `, [sampleTable]);
            reportInfo(`Sample UUID table columns: ${columns.rows.map(r => r.column_name).join(', ')}`);
            // Check for required columns
            const hasDocumentationId = columns.rows.some(r => r.column_name === 'documentation_id');
            const hasPath = columns.rows.some(r => r.column_name === 'path');
            if (!hasDocumentationId) {
                reportWarning(`Sample UUID table ${sampleTable} is missing documentation_id column`);
            }
            if (!hasPath) {
                reportWarning(`Sample UUID table ${sampleTable} is missing path column`);
            }
        }
        // Check for the existence of repair functions
        reportSection('REPAIR FUNCTIONS');
        try {
            const scannerFunctionExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
          WHERE proname = 'scan_and_fix_uuid_tables'
          AND nspname = 'payload'
        ) as exists
      `);
            if (scannerFunctionExists.rows[0].exists) {
                reportSuccess(`UUID table scanner function exists`);
            }
            else {
                reportWarning(`UUID table scanner function does not exist`);
            }
        }
        catch (err) {
            reportError(`Error checking repair functions: ${err.message}`);
        }
        // Check for the downloads_relationships view
        try {
            const viewExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'payload'
          AND table_name = 'downloads_relationships'
        ) as exists
      `);
            if (viewExists.rows[0].exists) {
                reportSuccess(`downloads_relationships view exists`);
                // Check view columns
                const viewColumns = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'payload'
          AND table_name = 'downloads_relationships'
        `);
                reportInfo(`View columns: ${viewColumns.rows.map(r => r.column_name).join(', ')}`);
            }
            else {
                reportWarning(`downloads_relationships view does not exist`);
            }
        }
        catch (err) {
            reportWarning(`Error checking downloads_relationships view: ${err.message}`);
        }
        // Report todo fields statistics 
        reportSection('TODO FIELDS');
        try {
            const todoFieldsQuery = await client.query(`
        SELECT 
          COUNT(*) as count,
          COUNT(todo) as todo_count,
          COUNT(todo_complete_quiz) as quiz_count
        FROM payload.course_lessons
      `);
            const row = todoFieldsQuery.rows[0];
            reportInfo(`Lessons: ${row.count}, with todo field: ${row.todo_count}, with quiz todo: ${row.quiz_count}`);
            if (parseInt(row.count) > parseInt(row.todo_count)) {
                reportWarning(`${parseInt(row.count) - parseInt(row.todo_count)} lessons are missing todo fields`);
            }
        }
        catch (err) {
            reportWarning(`Error checking todo fields: ${err.message}`);
        }
        reportSection('OVERALL STATUS');
        // Overall status determination
        let issues = 0;
        // Check critical tables
        const criticalTables = ['courses', 'course_lessons', 'course_quizzes', 'quiz_questions'];
        for (const table of criticalTables) {
            const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = $1
        ) as exists
      `, [table]);
            if (!tableExists.rows[0].exists) {
                reportError(`Critical table ${table} is missing`);
                issues++;
            }
        }
        if (issues === 0) {
            reportSuccess('Migration appears to be successful.');
            reportInfo('Note: Warnings about "No posts were migrated" may appear if all posts are already in the database.');
        }
        else {
            reportError(`Found ${issues} critical issues that need to be fixed.`);
        }
    }
    catch (error) {
        reportError(`Error generating migration report: ${error.message}`);
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the report generation
generateMigrationReport().catch(error => {
    console.error('Migration report failed:', error);
    process.exit(1);
});
