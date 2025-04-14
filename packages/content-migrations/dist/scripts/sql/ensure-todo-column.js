/**
 * Script to ensure the todo column exists in the course_lessons table
 */
import pg from 'pg';
import { getEnvVars } from '../../utils/get-env-vars.js';
const { Pool } = pg;
async function ensureTodoColumn() {
    console.log('=== ENSURING TODO COLUMN EXISTS IN COURSE_LESSONS TABLE ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');
    const { DATABASE_URI } = getEnvVars();
    if (!DATABASE_URI) {
        console.error('DATABASE_URI environment variable not set');
        process.exit(1);
    }
    const pool = new Pool({
        connectionString: DATABASE_URI,
    });
    try {
        // Connect to the database
        console.log('Connecting to database...');
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
        // Check if todo column exists
        console.log('Checking if todo column exists...');
        const columnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_lessons' 
      AND column_name = 'todo'
    `);
        // If todo column doesn't exist, add it
        if (columnResult.rows.length === 0) {
            console.log('Adding todo column to course_lessons...');
            await pool.query(`
        ALTER TABLE payload.course_lessons 
        ADD COLUMN IF NOT EXISTS todo TEXT
      `);
            console.log('Successfully added todo column to course_lessons table');
        }
        else {
            console.log('Todo column already exists in course_lessons table');
        }
        console.log('✅ Successfully ensured todo column exists in course_lessons table');
    }
    catch (error) {
        console.error('Error ensuring todo column exists:', error);
        throw error;
    }
    finally {
        // Close the connection pool
        await pool.end();
    }
}
// Execute the function if this script is run directly
// In ESM, we can check if the import.meta.url matches the current file's URL
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
    ensureTodoColumn()
        .then(() => {
        console.log('Completed todo column check');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Failed to ensure todo column exists:', error);
        process.exit(1);
    });
}
export default ensureTodoColumn;
