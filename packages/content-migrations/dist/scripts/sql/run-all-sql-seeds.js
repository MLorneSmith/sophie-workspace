/**
 * Run All SQL Seed Files
 *
 * This script executes all SQL seed files in the correct order.
 * It's designed to be called from the command line or from the reset-and-migrate.ps1 script.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { executeSqlFile } from '../../utils/execute-sql-file.js';
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to the SQL seed files
const seedDir = path.resolve(__dirname, '../../../../../apps/payload/src/seed/sql');
// Define the SQL seed files in the order they should be executed
const seedFiles = [
    '01-courses.sql',
    '02-lessons.sql',
    '03-quizzes.sql',
    '04-questions.sql',
    '05-surveys.sql',
    '06a-feedback-survey-questions.sql',
    '06b-assessment-survey-questions.sql',
    '06c-three-questions-survey-questions.sql',
];
/**
 * Runs all SQL seed files in the correct order
 */
async function runAllSqlSeeds() {
    console.log('Starting SQL seed files execution...');
    for (const file of seedFiles) {
        const filePath = path.join(seedDir, file);
        console.log(`Executing SQL seed file: ${file}`);
        try {
            await executeSqlFile(filePath);
            console.log(`Successfully executed SQL seed file: ${file}`);
        }
        catch (error) {
            console.error(`Error executing SQL seed file: ${file}`, error);
            process.exit(1);
        }
    }
    console.log('All SQL seed files executed successfully!');
}
// Run the function if this script is executed directly
if (import.meta.url === import.meta.resolve('./run-all-sql-seeds.ts')) {
    runAllSqlSeeds()
        .then(() => {
        console.log('All SQL seed files executed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Error executing SQL seed files:', error);
        process.exit(1);
    });
}
export { runAllSqlSeeds };
