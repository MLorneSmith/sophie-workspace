// Reverted to original import
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.development') });
/**
 * Migrates course lessons directly to the database
 */
async function migrateCourseLessonsToDatabase() {
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
            // Use the fixed course ID from the seed file
            const courseId = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
            console.log(`Using course with ID: ${courseId}`);
            // Path to the course lessons files
            const lessonsDir = path.resolve(__dirname, '../../../../../apps/payload/data/courses/lessons');
            console.log(`Course lessons directory: ${lessonsDir}`);
            // Read all .mdoc files
            const mdocFiles = fs
                .readdirSync(lessonsDir)
                .filter((file) => file.endsWith('.mdoc'))
                .map((file) => path.join(lessonsDir, file));
            console.log(`Found ${mdocFiles.length} lesson files to migrate.`);
            // Migrate each file to the database
            for (const file of mdocFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const { data, content: mdContent } = matter(content);
                    // Generate a slug from the file name
                    const slug = path.basename(file, '.mdoc');
                    // Convert Markdown content to Lexical format
                    const lexicalContent = (() => {
                        // Create a headless editor instance without explicit nodes
                        const headlessEditor = createHeadlessEditor({
                        // nodes: [ListNode, ListItemNode, HeadingNode], // Removed explicit nodes
                        });
                        // Convert Markdown to Lexical format
                        headlessEditor.update(() => {
                            $convertFromMarkdownString(mdContent);
                        }, { discrete: true });
                        // Get the Lexical JSON
                        return headlessEditor.getEditorState().toJSON();
                    })();
                    // Check if this lesson has an associated quiz
                    let quizId = null;
                    if (data.quiz) {
                        // Try to find the quiz by slug
                        const quizSlug = data.quiz.toLowerCase().replace(/\s+/g, '-');
                        const quizResult = await client.query('SELECT id FROM payload.course_quizzes WHERE slug = $1', [quizSlug]);
                        if (quizResult.rows.length > 0) {
                            quizId = quizResult.rows[0].id;
                            console.log(`Found quiz with ID ${quizId} for lesson ${slug}`);
                        }
                        else {
                            console.log(`Quiz not found for lesson ${slug}: ${data.quiz}`);
                        }
                    }
                    // Generate a UUID for the lesson
                    const lessonId = uuidv4();
                    // Insert the lesson into the database
                    await client.query(`INSERT INTO payload.course_lessons (
              id,
              title,
              slug,
              description,
              content,
              lesson_number,
              estimated_duration,
              published_at,
              course_id,
              course_id_id,
              quiz_id,
              updated_at,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`, [
                        lessonId,
                        data.title || slug,
                        slug,
                        data.description || '',
                        JSON.stringify(lexicalContent),
                        data.lessonNumber || 0,
                        data.lessonLength || 0,
                        data.publishedAt
                            ? new Date(data.publishedAt).toISOString()
                            : new Date().toISOString(),
                        courseId, // course_id
                        courseId, // course_id_id
                        quizId, // quiz_id (correct field name)
                    ]);
                    console.log(`Migrated lesson: ${slug} with ID: ${lessonId}`);
                }
                catch (error) {
                    console.error(`Error migrating ${file}:`, error);
                }
            }
            console.log('Course lessons migration complete!');
        }
        finally {
            client.release();
        }
    }
    finally {
        await pool.end();
    }
}
// Run the migration
migrateCourseLessonsToDatabase().catch((error) => {
    console.error('Course lessons migration failed:', error);
    process.exit(1);
});
