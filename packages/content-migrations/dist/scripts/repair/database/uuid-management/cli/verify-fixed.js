/**
 * UUID Table Verification CLI - Fixed Version
 *
 * This script checks if all UUID tables and relationship tables have the required columns
 * without making any changes to the database.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
// Import the fixed versions of the detection and verification modules
import { detectUuidTables } from '../detection-fixed.js';
import { getVerificationReport } from '../verification-fixed.js';
// Safer __dirname resolution with error handling
let __filename, __dirname;
try {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
}
catch (error) {
    console.warn('Could not use fileURLToPath. Falling back to process.cwd()');
    __dirname = process.cwd();
}
// Function to load environment variables with better error handling
function loadEnvironmentVariables() {
    try {
        // Try multiple possible .env file locations
        const envPaths = [
            path.resolve(__dirname, '../../../../../../../.env.development'),
            path.resolve(__dirname, '../../../../../../.env.development'),
            path.resolve(__dirname, '../../../../../.env.development'),
            path.resolve(__dirname, '../../../../.env.development'),
            path.resolve(process.cwd(), '.env.development'),
        ];
        // Try each path until one works
        for (const envPath of envPaths) {
            try {
                console.log(`Trying to load env from: ${envPath}`);
                const result = dotenv.config({ path: envPath });
                if (result.parsed) {
                    console.log(`Successfully loaded environment from ${envPath}`);
                    return true;
                }
            }
            catch (e) {
                // Continue to next path
            }
        }
        // If no .env file was found, use defaults
        console.warn('Could not load any .env file, using default connection string');
        return false;
    }
    catch (error) {
        console.warn('Error loading environment variables:', error);
        return false;
    }
}
async function main() {
    console.log(chalk.blue('🚀 Starting UUID table verification (improved version)...'));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    // Load environment variables
    const envLoaded = loadEnvironmentVariables();
    // Get database connection string from environment variables with fallback
    let databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
    if (!databaseUrl) {
        if (!envLoaded) {
            // Use default connection string if no .env file was loaded
            databaseUrl =
                'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
            console.log(chalk.yellow(`Using default connection string: ${databaseUrl}`));
        }
        else {
            console.error(chalk.red('DATABASE_URI or DATABASE_URL environment variable is required'));
            process.exit(1);
        }
    }
    // Create database client
    const client = new pg.Client({
        connectionString: databaseUrl,
    });
    try {
        // Connect to database with retry logic
        let connected = false;
        let retryCount = 0;
        const maxRetries = 3;
        while (!connected && retryCount < maxRetries) {
            try {
                await client.connect();
                connected = true;
                console.log(chalk.green('✅ Connected to database'));
            }
            catch (error) {
                retryCount++;
                console.warn(chalk.yellow(`Connection attempt ${retryCount} failed: ${error.message}`));
                if (retryCount < maxRetries) {
                    console.log(`Retrying in ${retryCount * 2} seconds...`);
                    await new Promise((resolve) => setTimeout(resolve, retryCount * 2000));
                }
                else {
                    throw error; // Rethrow after max retries
                }
            }
        }
        // Detect UUID tables and relationship tables
        console.log(chalk.blue('🔍 Detecting tables to verify...'));
        const tables = await detectUuidTables(client);
        if (tables.length === 0) {
            console.warn(chalk.yellow('⚠️ No UUID pattern tables or relationship tables found in the database.'));
            console.log(chalk.blue('ℹ️ This may be normal for a fresh installation, continuing with verification...'));
        }
        else {
            console.log(chalk.green(`✅ Found ${tables.length} tables to verify`));
        }
        // Get detailed verification report with better error handling
        console.log(chalk.blue('📊 Generating verification report...'));
        const report = getVerificationReport(tables);
        // Display report in a more user-friendly format
        console.log(chalk.blue('\n📋 UUID TABLE VERIFICATION REPORT:'));
        console.log(`Total tables: ${report.totalTables}`);
        if (report.totalTables > 0) {
            // Calculate percentages with safe division
            const criticalIssuePercent = report.totalTables > 0
                ? Math.round((report.missingCriticalColumnsTables / report.totalTables) * 100)
                : 0;
            const optionalIssuePercent = report.totalTables > 0
                ? Math.round((report.missingOptionalColumnsTables / report.totalTables) * 100)
                : 0;
            if (report.missingCriticalColumnsTables > 0) {
                console.log(chalk.red(`❌ Tables with missing critical columns: ${report.missingCriticalColumnsTables} (${criticalIssuePercent}%)`));
            }
            else {
                console.log(chalk.green('✅ All tables have critical columns!'));
            }
            if (report.missingOptionalColumnsTables > 0) {
                console.log(chalk.yellow(`⚠️ Tables with missing optional columns only: ${report.missingOptionalColumnsTables} (${optionalIssuePercent}%)`));
            }
            else {
                console.log(chalk.green('✅ All tables have optional columns!'));
            }
            // Show tables with issues
            if (report.missingCriticalColumnsTables > 0) {
                console.log(chalk.red('\n❌ Tables missing critical columns:'));
                report.tableDetails
                    .filter((detail) => !detail.criticalValid)
                    .forEach((detail) => {
                    console.log(chalk.red(`  - ${detail.tableName}: missing ${detail.missingCriticalColumns.join(', ')}`));
                });
            }
            if (report.missingOptionalColumnsTables > 0) {
                console.log(chalk.yellow('\n⚠️ Tables missing optional columns:'));
                report.tableDetails
                    .filter((detail) => detail.criticalValid && !detail.valid)
                    .forEach((detail) => {
                    console.log(chalk.yellow(`  - ${detail.tableName}: missing ${detail.missingOptionalColumns.join(', ')}`));
                });
            }
        }
        // Exit with appropriate code, but be more lenient
        // Allow migration to continue if only optional columns are missing
        if (report.criticalValid) {
            if (report.valid) {
                console.log(chalk.green('\n✅ All tables have all required columns!'));
            }
            else {
                console.log(chalk.yellow('\n⚠️ All critical columns are present, but some optional columns are missing.'));
                console.log(chalk.yellow('   This is acceptable for the migration to continue, but you may want to fix later.'));
                console.log(chalk.blue('   Run the UUID table repair script to add missing columns: pnpm run uuid:repair'));
            }
            // Still exit with success if only optional columns are missing
            process.exit(0);
        }
        else {
            console.error(chalk.red('\n❌ Some tables are missing critical columns and need repair.'));
            console.log(chalk.blue('   Run the UUID table repair script to fix this issue: pnpm run uuid:repair'));
            // Allow continuing with warnings if ALLOW_WARNINGS env variable is set
            if (process.env.ALLOW_WARNINGS === 'true') {
                console.log(chalk.yellow('   Continuing despite critical column issues due to ALLOW_WARNINGS=true'));
                process.exit(0);
            }
            else {
                process.exit(1);
            }
        }
    }
    catch (error) {
        console.error(chalk.red('Error verifying UUID tables:'), error);
        // Create more helpful error message
        let errorHelp = '';
        if (error.message.includes('connect ECONNREFUSED')) {
            errorHelp =
                'Make sure your database is running and the connection URL is correct.';
        }
        else if (error.message.includes('password authentication failed')) {
            errorHelp =
                'Check your database username and password in the connection string.';
        }
        else if (error.message.includes('database') &&
            error.message.includes('does not exist')) {
            errorHelp =
                'The specified database does not exist. Create it or check the connection string.';
        }
        if (errorHelp) {
            console.error(chalk.yellow(`Hint: ${errorHelp}`));
        }
        // Consider warning instead of error for certain conditions
        if (process.env.ALLOW_ERRORS === 'true') {
            console.log(chalk.yellow('Continuing despite errors due to ALLOW_ERRORS=true'));
            process.exit(0);
        }
        else {
            process.exit(1);
        }
    }
    finally {
        // Close database connection
        try {
            await client.end();
            console.log('Database connection closed');
        }
        catch (e) {
            // Ignore error on connection close
        }
    }
}
// Run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error(chalk.red('Unhandled error:'), error);
        process.exit(1);
    });
}
