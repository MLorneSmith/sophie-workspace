"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRawData = processRawData;
exports.validateRawDataDirectories = validateRawDataDirectories;
/**
 * Process Raw Data
 *
 * This script processes all raw data files and generates processed data files.
 * It's designed to be run once to generate the processed data, which can then be used
 * by the migration scripts without having to reprocess the raw data each time.
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const paths_js_1 = require("../../config/paths.js");
// Import the SQL seed file generator
const new_generate_sql_seed_files_js_1 = require("../sql/new-generate-sql-seed-files.js");
const verify_quiz_system_integrity_js_1 = require("../verification/verify-quiz-system-integrity.js");
/**
 * Ensures all required directories exist
 */
function ensureDirectoriesExist() {
    console.log('Ensuring directories exist...');
    const directories = [
        paths_js_1.PROCESSED_DATA_DIR,
        paths_js_1.PROCESSED_SQL_DIR,
        paths_js_1.PROCESSED_JSON_DIR,
    ];
    for (const dir of directories) {
        if (!fs_1.default.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    console.log('All directories exist.');
}
/**
 * Copies SQL seed files from the Payload seed directory to the processed SQL directory
 */
async function copySqlSeedFiles() {
    console.log('Copying SQL seed files...');
    if (!fs_1.default.existsSync(paths_js_1.PAYLOAD_SQL_SEED_DIR)) {
        console.warn(`Payload SQL seed directory does not exist: ${paths_js_1.PAYLOAD_SQL_SEED_DIR}`);
        return;
    }
    const files = fs_1.default.readdirSync(paths_js_1.PAYLOAD_SQL_SEED_DIR);
    for (const file of files) {
        if (file.endsWith('.sql')) {
            const sourcePath = path_1.default.join(paths_js_1.PAYLOAD_SQL_SEED_DIR, file);
            const destPath = path_1.default.join(paths_js_1.PROCESSED_SQL_DIR, file);
            console.log(`Copying ${file} to ${destPath}`);
            fs_1.default.copyFileSync(sourcePath, destPath);
        }
    }
    console.log('SQL seed files copied successfully.');
}
/**
 * Processes all raw data
 */
async function processRawData() {
    console.log('Starting raw data processing...');
    try {
        // Ensure all directories exist
        ensureDirectoriesExist();
        // Generate SQL seed files
        console.log('Generating SQL seed files...');
        await (0, new_generate_sql_seed_files_js_1.generateSqlSeedFiles)(paths_js_1.PAYLOAD_SQL_SEED_DIR);
        // Verify quiz ID consistency
        console.log('Verifying quiz ID consistency...');
        const quizIdsConsistent = (0, verify_quiz_system_integrity_js_1.verifyQuizSystemIntegrity)();
        if (!quizIdsConsistent) {
            console.warn('WARNING: Quiz ID inconsistencies detected. This may cause issues during migration.');
        }
        // Copy SQL seed files to the processed directory
        await copySqlSeedFiles();
        // Create a metadata file with processing timestamp
        const metadata = {
            processedAt: new Date().toISOString(),
            rawDataDir: paths_js_1.RAW_DATA_DIR,
            processedDataDir: paths_js_1.PROCESSED_DATA_DIR,
            quizIdsConsistent,
        };
        fs_1.default.writeFileSync(path_1.default.join(paths_js_1.PROCESSED_DATA_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
        console.log('Raw data processing completed successfully.');
    }
    catch (error) {
        console.error('Error processing raw data:', error);
        throw error;
    }
}
/**
 * Validates that all required raw data directories exist
 */
function validateRawDataDirectories() {
    console.log('Validating raw data directories...');
    const directories = [
        paths_js_1.RAW_DATA_DIR,
        paths_js_1.RAW_COURSES_DIR,
        paths_js_1.RAW_LESSONS_DIR,
        paths_js_1.RAW_QUIZZES_DIR,
        paths_js_1.RAW_DOCUMENTATION_DIR,
        paths_js_1.RAW_POSTS_DIR,
        paths_js_1.RAW_SURVEYS_DIR,
    ];
    let allExist = true;
    for (const dir of directories) {
        if (!fs_1.default.existsSync(dir)) {
            console.error(`Raw data directory does not exist: ${dir}`);
            allExist = false;
        }
    }
    if (allExist) {
        console.log('All raw data directories exist.');
    }
    else {
        console.error('Some raw data directories are missing. Please check the paths.');
    }
    return allExist;
}
// Run the processor if this script is executed directly
if (import.meta.url === import.meta.resolve('./process-raw-data.ts')) {
    // Check if we're only validating
    const validateOnly = process.argv.includes('--validate-only');
    // Validate raw data directories
    if (!validateRawDataDirectories()) {
        process.exit(1);
    }
    if (validateOnly) {
        console.log('Validation completed successfully. Raw data directories exist.');
        process.exit(0);
    }
    processRawData()
        .then(() => {
        console.log('Raw data processing completed successfully.');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Error processing raw data:', error);
        process.exit(1);
    });
}
