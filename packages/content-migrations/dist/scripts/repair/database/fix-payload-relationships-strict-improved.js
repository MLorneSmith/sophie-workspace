/**
 * Improved Payload CMS Relationship Architecture Fix
 *
 * Enhanced version with:
 * - Improved transaction handling
 * - Better error diagnostics
 * - State validation before operations
 * - Detailed logging
 * - Robust error recovery
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Client } = pg;
// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Setup environment
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Load environment variables from .env.development file in content-migrations package
try {
    const envFilePath = path.resolve(__dirname, '../../../.env.development');
    if (fs.existsSync(envFilePath)) {
        console.log(`Loading environment variables from: ${envFilePath}`);
        const envContent = fs.readFileSync(envFilePath, 'utf-8');
        const envLines = envContent.split('\n');
        for (const line of envLines) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                const value = match[2] || '';
                if (key === 'DATABASE_URI' || key === 'DATABASE_URL') {
                    process.env[key] = value.replace(/['"]/g, '');
                    console.log(`Setting ${key} from .env.development file`);
                }
            }
        }
    }
}
catch (error) {
    // Silently continue if env file can't be loaded
}
const sqlPath = path.join(__dirname, 'fix-payload-relationships-alternate.sql');
const sqlOriginal = fs.readFileSync(sqlPath, 'utf8');
// Max retry count for transient errors
const MAX_RETRIES = 3;
/**
 * Execute SQL with retry logic and error handling
 */
async function executeWithRetry(client, sql, description, retryCount = 0) {
    try {
        console.log(`Executing SQL ${description}...`);
        const result = await client.query(sql);
        console.log(`✅ SQL ${description} executed successfully`);
        return result;
    }
    catch (error) {
        // Enhanced error reporting
        console.error(`❌ Error executing SQL ${description}:`);
        console.error(error instanceof Error ? error.message : String(error));
        // If the error is transient and we haven't exceeded retries
        if (retryCount < MAX_RETRIES &&
            error instanceof Error &&
            (error.message.includes('deadlock') ||
                error.message.includes('could not serialize') ||
                error.message.includes('concurrent update'))) {
            console.log(`Transient error occurred, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            // Exponential backoff with jitter
            const delay = Math.floor(100 * Math.pow(2, retryCount) * (0.5 + Math.random()));
            await new Promise((resolve) => setTimeout(resolve, delay));
            return executeWithRetry(client, sql, description, retryCount + 1);
        }
        // Non-transient error or max retries exceeded
        throw error;
    }
}
/**
 * Validate database state before operations
 */
async function validateDatabaseState(client) {
    console.log('Validating database state before operations...');
    try {
        // Check if tables exist
        const tablesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes'
      ) AS course_quizzes_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      ) AS course_quizzes_rels_exists;
    `);
        const { course_quizzes_exists, course_quizzes_rels_exists } = tablesResult.rows[0];
        if (!course_quizzes_exists || !course_quizzes_rels_exists) {
            console.error('❌ Required tables do not exist:');
            console.error(`- course_quizzes: ${course_quizzes_exists ? 'exists' : 'missing'}`);
            console.error(`- course_quizzes_rels: ${course_quizzes_rels_exists ? 'exists' : 'missing'}`);
            return false;
        }
        // Check if required columns exist
        const columnsResult = await client.query(`
      SELECT 
        EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes' 
          AND column_name = 'course_id_id'
        ) AS course_id_column_exists,
        EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels' 
          AND column_name = '_parent_id'
        ) AS parent_id_column_exists;
    `);
        const { course_id_column_exists, parent_id_column_exists } = columnsResult.rows[0];
        if (!course_id_column_exists || !parent_id_column_exists) {
            console.error('❌ Required columns do not exist:');
            console.error(`- course_quizzes.course_id_id: ${course_id_column_exists ? 'exists' : 'missing'}`);
            console.error(`- course_quizzes_rels._parent_id: ${parent_id_column_exists ? 'exists' : 'missing'}`);
            return false;
        }
        console.log('✅ Database state validation passed');
        return true;
    }
    catch (error) {
        console.error('❌ Error validating database state:');
        console.error(error instanceof Error ? error.message : String(error));
        return false;
    }
}
/**
 * Split the SQL into individual operations for better control
 */
function prepareOperations() {
    console.log('Preparing SQL operations...');
    // Instead of trying to parse PL/pgSQL functions, use a simpler approach
    // Execute the SQL as a whole or split manually based on known markers
    // First separate the verification queries (last four queries) from the transaction operations
    const mainSql = sqlOriginal
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    // Find the BEGIN TRANSACTION and COMMIT markers
    const beginTxnMatch = mainSql.match(/BEGIN\s+TRANSACTION/i);
    const commitMatch = mainSql.match(/COMMIT\s*;/i);
    if (!beginTxnMatch || !commitMatch) {
        console.warn('Could not identify transaction boundaries, using full script as single operation');
        return {
            sqlOperations: [mainSql],
            verificationQueries: [],
        };
    }
    // Transaction SQL (everything between BEGIN TRANSACTION and COMMIT, inclusive)
    const txnSql = mainSql.substring(beginTxnMatch.index, commitMatch.index + commitMatch[0].length);
    // Verification queries (everything after COMMIT)
    const verificationSql = mainSql
        .substring(commitMatch.index + commitMatch[0].length)
        .trim();
    // Split verification queries - these are simpler SELECT statements
    const verificationQueries = verificationSql
        .split(';')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);
    console.log(`Found transaction SQL (${txnSql.length} chars) and ${verificationQueries.length} verification queries`);
    return {
        sqlOperations: [txnSql], // Execute transaction as one block
        verificationQueries,
    };
}
export async function fixPayloadRelationshipsStrict() {
    const client = new Client({
        connectionString: process.env.DATABASE_URI ||
            'postgresql://postgres:postgres@localhost:54322/postgres',
    });
    console.log('Starting Payload relationship fix with strict UUID typing (improved version)...');
    try {
        await client.connect();
        console.log('Connected to database');
        // Validate database state before proceeding
        const isValid = await validateDatabaseState(client);
        if (!isValid) {
            console.error('❌ Database validation failed, aborting relationship fix');
            return false;
        }
        // Prepare SQL operations
        const { sqlOperations, verificationQueries } = prepareOperations();
        console.log(`Running ${sqlOperations.length} SQL operations and ${verificationQueries.length} verification queries`);
        // Execute the transaction SQL as a whole to avoid parsing issues with PL/pgSQL
        try {
            console.log('Executing transaction SQL...');
            await executeWithRetry(client, sqlOperations[0], 'complete transaction block');
            console.log('✅ Transaction committed successfully');
        }
        catch (error) {
            // Rollback transaction on error
            console.error('❌ Error during transaction, rolling back');
            await client.query('ROLLBACK');
            console.log('Transaction rolled back');
            throw error;
        }
        // Execute verification queries outside transaction
        console.log('\nRunning verification queries...');
        try {
            const results = [];
            for (let i = 0; i < verificationQueries.length; i++) {
                const query = verificationQueries[i];
                if (!query)
                    continue;
                const result = await executeWithRetry(client, query, `verification query ${i + 1}/${verificationQueries.length}`);
                results.push(result);
            }
            // Print verification results
            console.log('\nVerification Results:');
            results.forEach((result, index) => {
                if (result && result.rows && result.rows.length) {
                    console.log(`Query ${index + 1} result:`, result.rows[0]);
                }
            });
            // Check for inconsistencies
            const inconsistentCount = results[3]?.rows[0]?.inconsistent_quizzes || 0;
            if (inconsistentCount > 0) {
                console.warn(`WARNING: Found ${inconsistentCount} quizzes with inconsistent relationships`);
                return false;
            }
            else {
                console.log('✅ All relationships are consistent between main table and relationship table');
                return true;
            }
        }
        catch (error) {
            console.error('Error during verification:', error);
            return false;
        }
    }
    catch (error) {
        console.error('Error fixing Payload relationships:', error);
        throw error;
    }
    finally {
        await client.end();
    }
}
// Run if called directly
if (import.meta.url.endsWith('fix-payload-relationships-strict-improved.js') ||
    import.meta.url.endsWith('fix-payload-relationships-strict-improved.ts')) {
    fixPayloadRelationshipsStrict()
        .then((success) => {
        if (success) {
            console.log('✅ Payload relationships fixed successfully');
            process.exit(0);
        }
        else {
            console.error('❌ Failed to fix Payload relationships completely');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('❌ Failed to fix Payload relationships:', error);
        process.exit(1);
    });
}
