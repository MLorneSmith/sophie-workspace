/**
 * Verify that path column exists in relationship tables
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env.development';
// Load from root directory - use path relative to project root
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// Database connection string from environment variables - check both possible variable names
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;
if (!connectionString) {
    console.error('Neither DATABASE_URL nor DATABASE_URI environment variables are set');
    console.error('Please make sure one of these variables is defined in your .env file');
    console.error('Expected format: postgresql://username:password@host:port/database?schema=payload');
    process.exit(1);
}
// Configure the pool
const pool = new Pool({
    connectionString,
});
/**
 * Verify that path column exists in relationship tables
 */
async function verifyPathColumn() {
    console.log('\nVerifying path column in relationship tables...');
    try {
        // List of relationship tables to check
        const relationshipTables = [
            'documentation_rels',
            'course_lessons_rels',
            'courses_rels',
            'course_quizzes_rels',
            'downloads_rels',
        ];
        let missingPathColumn = false;
        // Check each table
        for (const table of relationshipTables) {
            // Check if path column exists
            const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = $1
          AND column_name = 'path'
      `, [table]);
            if (result.rows.length > 0) {
                console.log(`✅ Table ${table} has path column`);
            }
            else {
                console.error(`❌ Table ${table} is missing path column`);
                missingPathColumn = true;
            }
        }
        // Also check the ensure_relationship_columns function to make sure it includes path
        const functionCheck = await pool.query(`
      SELECT prosrc
      FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'payload' 
      AND p.proname = 'ensure_relationship_columns'
    `);
        if (functionCheck.rows.length > 0) {
            const functionSource = functionCheck.rows[0].prosrc;
            if (functionSource.includes('ADD COLUMN IF NOT EXISTS path')) {
                console.log('✅ ensure_relationship_columns function includes path column');
            }
            else {
                console.error('❌ ensure_relationship_columns function does not include path column');
                missingPathColumn = true;
            }
        }
        else {
            console.error('❌ ensure_relationship_columns function does not exist');
            missingPathColumn = true;
        }
        // Final status
        if (missingPathColumn) {
            console.error('\n❌ VERIFICATION FAILED: Path column is missing in some tables or functions');
            return false;
        }
        else {
            console.log('\n✅ VERIFICATION PASSED: All tables have path column');
            return true;
        }
    }
    catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
    finally {
        await pool.end();
    }
}
// Run the verification if this script is executed directly
if (require.main === module) {
    verifyPathColumn()
        .then((success) => {
        process.exit(success ? 0 : 1);
    })
        .catch((err) => {
        console.error('Verification failed:', err);
        process.exit(1);
    });
}
export default verifyPathColumn;
