/**
 * Verification script to ensure todo fields are properly populated in the course_lessons table
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Client } = pg;
// Load environment variables
dotenv.config();
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define paths
const YAML_FILE_PATH = path.resolve(__dirname, '../../data/raw/lesson-metadata.yaml');
// Database connection configuration
const DB_CONFIG = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 54322),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
};
// Create a new PostgreSQL client
const client = new Client(DB_CONFIG);
/**
 * Main verification function
 */
async function verifyTodoFields() {
    console.log(chalk.blue('Starting verification of todo fields in course_lessons table...'));
    try {
        // Ensure YAML file exists
        if (!fs.existsSync(YAML_FILE_PATH)) {
            console.error(chalk.red(`YAML file not found: ${YAML_FILE_PATH}`));
            return false;
        }
        // Load lesson metadata from YAML
        const fileContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
        const metadata = yaml.load(fileContent);
        // Connect to the database
        await client.connect();
        console.log(chalk.green('Connected to database'));
        // Get a list of fields to check
        const fieldsToCheck = [
            'todo',
            'todo_complete_quiz',
            'todo_watch_content',
            'todo_read_content',
            'todo_course_project',
        ];
        // Track results
        let totalChecked = 0;
        let fieldsPopulated = 0;
        let fieldsExpected = 0;
        // For each lesson in the YAML file, verify database has the correct todo fields
        for (const lesson of metadata.lessons) {
            // Skip if no todo fields in YAML
            if (!lesson.todoFields)
                continue;
            // Get the slug (used as ID in the database)
            const slug = lesson.slug;
            // Query the database for this lesson
            const query = `
        SELECT id, slug, ${fieldsToCheck.join(', ')}
        FROM payload.course_lessons 
        WHERE slug = $1
      `;
            const result = await client.query(query, [slug]);
            // If lesson not found in database, log and continue
            if (result.rows.length === 0) {
                console.warn(chalk.yellow(`Lesson not found in database: ${slug}`));
                continue;
            }
            const dbLesson = result.rows[0];
            totalChecked++;
            // Check each todo field
            console.log(chalk.blue(`\nVerifying lesson: ${lesson.title} (${slug})`));
            fieldsToCheck.forEach((field) => {
                const hasFieldInYaml = lesson.todoFields &&
                    (field === 'todo_complete_quiz'
                        ? lesson.todoFields.completeQuiz !== undefined
                        : field === 'todo'
                            ? !!lesson.todoFields.todo
                            : field === 'todo_watch_content'
                                ? !!lesson.todoFields.watchContent
                                : field === 'todo_read_content'
                                    ? !!lesson.todoFields.readContent
                                    : !!lesson.todoFields.courseProject);
                const yamlValue = field === 'todo_complete_quiz'
                    ? lesson.todoFields?.completeQuiz || false
                    : field === 'todo'
                        ? lesson.todoFields?.todo || null
                        : field === 'todo_watch_content'
                            ? lesson.todoFields?.watchContent || null
                            : field === 'todo_read_content'
                                ? lesson.todoFields?.readContent || null
                                : lesson.todoFields?.courseProject || null;
                const dbValue = dbLesson[field];
                const hasFieldInDb = dbValue !== null &&
                    dbValue !== undefined &&
                    (field !== 'todo_complete_quiz' ? dbValue !== '' : true);
                if (hasFieldInYaml) {
                    fieldsExpected++;
                    if (hasFieldInDb) {
                        fieldsPopulated++;
                        console.log(chalk.green(`  ✓ Field ${field} is populated in database`));
                    }
                    else {
                        console.log(chalk.red(`  ✗ Field ${field} is NOT populated in database`));
                    }
                }
            });
        }
        // Log summary
        console.log('\n' + chalk.blue('Verification Summary:'));
        console.log(chalk.blue(`Total lessons checked: ${totalChecked}`));
        console.log(chalk.blue(`Fields expected to be populated: ${fieldsExpected}`));
        console.log(chalk.blue(`Fields actually populated: ${fieldsPopulated}`));
        const success = fieldsPopulated === fieldsExpected;
        if (success) {
            console.log(chalk.green('\nVerification PASSED: All expected todo fields are properly populated'));
        }
        else {
            console.log(chalk.red(`\nVerification FAILED: ${fieldsExpected - fieldsPopulated} fields are missing`));
        }
        return success;
    }
    catch (error) {
        console.error(chalk.red('Error during verification:'), error);
        return false;
    }
    finally {
        // Close the database connection
        await client.end();
        console.log(chalk.green('Database connection closed'));
    }
}
// Execute the verification if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyTodoFields()
        .then((success) => {
        process.exit(success ? 0 : 1);
    })
        .catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
export default verifyTodoFields;
