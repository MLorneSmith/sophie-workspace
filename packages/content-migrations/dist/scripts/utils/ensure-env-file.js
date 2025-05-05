/**
 * Environment File Setup Utility
 *
 * This script ensures that the .env.development file exists and contains the correct
 * environment variables for running migrations and fixes. It copies the .env file
 * from the project root to a consistent location in the content-migrations package.
 *
 * It's meant to be run before any migration or fix script to ensure environment
 * variables are properly loaded.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define paths
const projectRoot = path.resolve(__dirname, '../../../../../');
const targetDir = path.resolve(__dirname, '../..');
const sourceEnvFile = path.resolve(projectRoot, '.env.development');
const targetEnvFile = path.resolve(targetDir, '.env.development');
/**
 * Main function to ensure the environment file exists
 */
export async function ensureEnvFile() {
    console.log('Ensuring environment file exists...');
    try {
        // Check if target directory exists
        if (!fs.existsSync(targetDir)) {
            console.log(`Creating directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
        }
        // Check if source file exists
        if (!fs.existsSync(sourceEnvFile)) {
            console.log(`Source env file not found at: ${sourceEnvFile}`);
            // Look for other .env files
            const envFiles = fs
                .readdirSync(projectRoot)
                .filter((file) => file.startsWith('.env'));
            if (envFiles.length > 0) {
                console.log(`Found alternative env files: ${envFiles.join(', ')}`);
                // Use the first found .env file
                const alternativeSource = path.resolve(projectRoot, envFiles[0]);
                console.log(`Using alternative source: ${alternativeSource}`);
                fs.copyFileSync(alternativeSource, targetEnvFile);
                console.log(`Copied ${alternativeSource} to ${targetEnvFile}`);
            }
            else {
                // Create minimal .env file with critical variables
                console.log('No .env files found. Creating minimal .env file.');
                const minimalEnvContent = `DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
`;
                fs.writeFileSync(targetEnvFile, minimalEnvContent);
                console.log(`Created minimal env file at: ${targetEnvFile}`);
            }
        }
        else {
            // Copy the source file to the target location
            fs.copyFileSync(sourceEnvFile, targetEnvFile);
            console.log(`Copied ${sourceEnvFile} to ${targetEnvFile}`);
        }
        // Verify the file exists and has database connection info
        if (fs.existsSync(targetEnvFile)) {
            const content = fs.readFileSync(targetEnvFile, 'utf-8');
            if (!content.includes('DATABASE_URI') &&
                !content.includes('DATABASE_URL')) {
                console.log('Environment file is missing database connection information.');
                // Append database connection information
                const appendContent = `
# Added by ensure-env-file.ts
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
`;
                fs.appendFileSync(targetEnvFile, appendContent);
                console.log('Appended database connection information to env file.');
            }
            return true;
        }
        else {
            console.error(`Failed to create env file at: ${targetEnvFile}`);
            return false;
        }
    }
    catch (error) {
        console.error('Error ensuring env file:', error);
        return false;
    }
}
// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    ensureEnvFile()
        .then((success) => {
        if (success) {
            console.log('Environment file setup completed successfully.');
            process.exit(0);
        }
        else {
            console.error('Environment file setup failed.');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
