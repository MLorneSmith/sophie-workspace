/**
 * Unidirectional Quiz Relationship Fix
 *
 * This script ensures quiz relationships are properly established in the correct direction:
 * CourseQuizzes → QuizQuestions
 *
 * It handles both direct field storage and relationship table entries.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-unidirectional-quiz-relationships.sql');
export async function fixUnidirectionalQuizRelationships() {
    // Get database connection string from environment or use default
    const connectionString = process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres';
    console.log('Starting unidirectional quiz relationship fix...');
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
        // Execute SQL script as a single command to maintain transaction integrity
        const result = await client.query(sqlContent);
        // Parse and log verification results
        const stats = result.rows[0];
        if (stats) {
            console.log('\nVerification Results:');
            console.log(`- Total quizzes: ${stats.total_quizzes}`);
            console.log(`- Quizzes with course_id: ${stats.quizzes_with_course}`);
            console.log(`- Course relationship entries: ${stats.course_relationships}`);
            console.log(`- Total quiz questions: ${stats.total_questions}`);
            console.log(`- Quizzes with questions: ${stats.quizzes_with_questions}`);
            console.log(`- Question relationship entries: ${stats.question_relationships}`);
            // Calculate success metrics
            const courseSuccess = parseInt(stats.quizzes_with_course) === parseInt(stats.total_quizzes) &&
                parseInt(stats.course_relationships) === parseInt(stats.total_quizzes);
            const questionSuccess = parseInt(stats.quizzes_with_questions) > 0 &&
                parseInt(stats.question_relationships) > 0;
            if (courseSuccess && questionSuccess) {
                console.log('\n✅ All relationships fixed successfully');
            }
            else if (courseSuccess) {
                console.log('\n⚠️ Course relationships fixed, but some question relationships may still have issues');
            }
            else {
                console.log('\n❌ Relationship fix was not completely successful');
            }
        }
        else {
            console.log('Script executed but verification results were unexpected');
        }
        console.log('\nQuiz relationship fix completed');
    }
    catch (error) {
        console.error('Error fixing quiz relationships:', error);
        throw error;
    }
    finally {
        // Always disconnect from database
        await client.end();
        console.log('Disconnected from database');
    }
}
// Run the function if this file is executed directly
if (require.main === module) {
    fixUnidirectionalQuizRelationships()
        .then(() => console.log('Complete'))
        .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
}
