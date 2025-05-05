/**
 * Final Course ID Fix
 *
 * This is a specialized fix that runs at the very end of the migration process.
 * It exclusively handles course ID relationships and includes safeguards to
 * prevent Payload hooks from resetting the course IDs.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-course-ids-final.sql');
export async function fixCourseIdsFinal() {
    // Get database connection string from environment or use default
    const connectionString = process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres';
    console.log('Starting final course ID fix...');
    console.log(`Using connection string: ${connectionString}`);
    // Create database client
    const client = new Client({ connectionString });
    try {
        // Connect to database
        await client.connect();
        console.log('Connected to database successfully');
        // Load and execute SQL script
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        console.log('Loaded SQL script successfully');
        // Execute SQL script - execute as a single command to maintain transaction integrity
        const result = await client.query(sqlContent);
        // Check result of verification query (will be the last result)
        if (result.rows && result.rows.length > 0) {
            const fixedQuizzes = parseInt(result.rows[0].fixed_quizzes || '0');
            const totalQuizzes = await getTotalQuizCount(client);
            console.log(`\nFix Results:`);
            console.log(`- Fixed ${fixedQuizzes} of ${totalQuizzes} quizzes`);
            if (fixedQuizzes === totalQuizzes) {
                console.log(`\nSUCCESS: All quizzes now have course IDs`);
            }
            else if (fixedQuizzes > 0) {
                console.log(`\nPARTIAL SUCCESS: ${fixedQuizzes} quizzes fixed, but ${totalQuizzes - fixedQuizzes} still have issues`);
            }
            else {
                console.log(`\nFAILURE: No quizzes were fixed`);
            }
        }
        console.log('\nCourse ID fix completed');
    }
    catch (error) {
        console.error('Error fixing course IDs:', error);
        throw error;
    }
    finally {
        await client.end();
        console.log('Disconnected from database');
    }
}
// Helper function to get total quiz count
async function getTotalQuizCount(client) {
    try {
        const result = await client.query('SELECT COUNT(*) as total FROM payload.course_quizzes');
        return parseInt(result.rows[0].total || '0');
    }
    catch (error) {
        console.warn(`Could not get total quiz count: ${error}`);
        return 0;
    }
}
// Run the function if this file is executed directly
if (require.main === module) {
    fixCourseIdsFinal()
        .then(() => console.log('Final course ID fix completed'))
        .catch((error) => {
        console.error('Failed to fix course IDs:', error);
        process.exit(1);
    });
}
