/**
 * Script to test the database connection and verify the schema directly in the PostgreSQL database
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
/**
 * Tests the database connection and verifies the schema directly in the PostgreSQL database
 */
async function testDatabaseConnectionDirect() {
    // Get the database connection string from the environment variables
    const databaseUri = process.env.DATABASE_URI;
    if (!databaseUri) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    console.log(`Connecting to database: ${databaseUri}`);
    // Create a connection pool
    const pool = new Pool({
        connectionString: databaseUri,
    });
    try {
        // Test the connection
        const client = await pool.connect();
        try {
            console.log('Connected to database');
            // Test collections with expected fields
            const collectionsToTest = [
                {
                    name: 'courses',
                    requiredFields: [
                        'title',
                        'slug',
                        'description',
                        'show_progress_bar',
                        'estimated_duration',
                    ],
                },
                {
                    name: 'course_lessons',
                    requiredFields: [
                        'title',
                        'slug',
                        'content',
                        'lesson_number',
                        'estimated_duration',
                        'course_id',
                    ],
                },
                {
                    name: 'course_quizzes',
                    requiredFields: ['title', 'slug', 'description', 'passing_score'],
                },
                {
                    name: 'quiz_questions',
                    requiredFields: [
                        'question',
                        'quiz_id',
                        'type',
                        'explanation',
                        'order',
                    ],
                },
            ];
            // Test each collection
            for (const collection of collectionsToTest) {
                console.log(`Testing collection: ${collection.name}`);
                try {
                    // Check if the table exists
                    const tableExistsResult = await client.query(`SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'payload' 
              AND table_name = $1
            )`, [collection.name]);
                    if (!tableExistsResult.rows[0].exists) {
                        console.error(`Table ${collection.name} does not exist`);
                        continue;
                    }
                    // Get the columns for the table
                    const columnsResult = await client.query(`SELECT column_name 
             FROM information_schema.columns 
             WHERE table_schema = 'payload' 
             AND table_name = $1`, [collection.name]);
                    const columns = columnsResult.rows.map((row) => row.column_name);
                    // Check if required fields exist in the table
                    const missingColumns = collection.requiredFields.filter((field) => !columns.includes(field));
                    if (missingColumns.length > 0) {
                        console.warn(`Warning: Table is missing required columns: ${missingColumns.join(', ')}`);
                    }
                    else {
                        console.log(`Table has all required columns: ${collection.requiredFields.join(', ')}`);
                    }
                    // Get a sample document
                    const docsResult = await client.query(`SELECT * FROM payload.${collection.name} LIMIT 1`);
                    if (docsResult.rows.length > 0) {
                        const doc = docsResult.rows[0];
                        console.log(`Sample document from ${collection.name}:`, JSON.stringify(doc, null, 2));
                        // Check if required fields have values in the document
                        const missingFields = collection.requiredFields.filter((field) => doc[field] === null || doc[field] === undefined);
                        if (missingFields.length > 0) {
                            console.warn(`Warning: Document is missing values for required fields: ${missingFields.join(', ')}`);
                        }
                        else {
                            console.log(`Document has values for all required fields: ${collection.requiredFields.join(', ')}`);
                        }
                    }
                    else {
                        console.log(`No documents found in ${collection.name}`);
                    }
                    // Count the documents
                    const countResult = await client.query(`SELECT COUNT(*) FROM payload.${collection.name}`);
                    console.log(`Collection ${collection.name} exists with ${countResult.rows[0].count} documents`);
                }
                catch (error) {
                    console.error(`Error testing collection ${collection.name}:`, error);
                }
            }
            // Test relationships
            console.log('\nTesting relationships...');
            // Test course_lessons to courses relationship
            try {
                const lessonsResult = await client.query(`SELECT id, course_id FROM payload.course_lessons LIMIT 1`);
                if (lessonsResult.rows.length > 0) {
                    const lesson = lessonsResult.rows[0];
                    if (lesson.course_id) {
                        console.log(`Lesson ${lesson.id} has course_id: ${lesson.course_id}`);
                        // Try to find the course
                        const coursesResult = await client.query(`SELECT id, title FROM payload.courses WHERE id = $1`, [lesson.course_id]);
                        if (coursesResult.rows.length > 0) {
                            console.log(`Found related course: ${coursesResult.rows[0].title}`);
                        }
                        else {
                            console.warn(`Could not find related course with ID: ${lesson.course_id}`);
                        }
                    }
                    else {
                        console.warn(`Lesson ${lesson.id} does not have a course_id`);
                    }
                }
            }
            catch (error) {
                console.error('Error testing course_lessons to courses relationship:', error);
            }
            // Test quiz_questions to course_quizzes relationship
            try {
                const questionsResult = await client.query(`SELECT id, quiz_id FROM payload.quiz_questions LIMIT 1`);
                if (questionsResult.rows.length > 0) {
                    const question = questionsResult.rows[0];
                    if (question.quiz_id) {
                        console.log(`Question ${question.id} has quiz_id: ${question.quiz_id}`);
                        // Try to find the quiz
                        const quizzesResult = await client.query(`SELECT id, title FROM payload.course_quizzes WHERE id = $1`, [question.quiz_id]);
                        if (quizzesResult.rows.length > 0) {
                            console.log(`Found related quiz: ${quizzesResult.rows[0].title}`);
                        }
                        else {
                            console.warn(`Could not find related quiz with ID: ${question.quiz_id}`);
                        }
                    }
                    else {
                        console.warn(`Question ${question.id} does not have a quiz_id`);
                    }
                }
            }
            catch (error) {
                console.error('Error testing quiz_questions to course_quizzes relationship:', error);
            }
            console.log('Database connection test complete!');
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the test
testDatabaseConnectionDirect().catch((error) => {
    console.error('Database connection test failed:', error);
    process.exit(1);
});
