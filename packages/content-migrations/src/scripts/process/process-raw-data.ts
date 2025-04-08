/**
 * Process Raw Data
 *
 * This script processes all raw data files and generates processed data files.
 * It's designed to be run once to generate the processed data, which can then be used
 * by the migration scripts without having to reprocess the raw data each time.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  PAYLOAD_SQL_SEED_DIR,
  PROCESSED_DATA_DIR,
  PROCESSED_JSON_DIR,
  PROCESSED_SQL_DIR,
  RAW_COURSES_DIR,
  RAW_DATA_DIR,
  RAW_DOCUMENTATION_DIR,
  RAW_LESSONS_DIR,
  RAW_POSTS_DIR,
  RAW_QUIZZES_DIR,
  RAW_SURVEYS_DIR,
} from '../../config/paths.js';
// Import the SQL seed file generator
import { generateSqlSeedFiles } from '../sql/new-generate-sql-seed-files.js';
import { verifyQuizSystemIntegrity } from '../verification/verify-quiz-system-integrity.js';

/**
 * Ensures all required directories exist
 */
function ensureDirectoriesExist(): void {
  console.log('Ensuring directories exist...');

  const directories = [
    PROCESSED_DATA_DIR,
    PROCESSED_SQL_DIR,
    PROCESSED_JSON_DIR,
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('All directories exist.');
}

/**
 * Copies SQL seed files from the Payload seed directory to the processed SQL directory
 */
async function copySqlSeedFiles(): Promise<void> {
  console.log('Copying SQL seed files...');

  if (!fs.existsSync(PAYLOAD_SQL_SEED_DIR)) {
    console.warn(
      `Payload SQL seed directory does not exist: ${PAYLOAD_SQL_SEED_DIR}`,
    );
    return;
  }

  const files = fs.readdirSync(PAYLOAD_SQL_SEED_DIR);

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sourcePath = path.join(PAYLOAD_SQL_SEED_DIR, file);
      const destPath = path.join(PROCESSED_SQL_DIR, file);

      console.log(`Copying ${file} to ${destPath}`);
      fs.copyFileSync(sourcePath, destPath);
    }
  }

  console.log('SQL seed files copied successfully.');
}

/**
 * Processes all raw data
 */
async function processRawData(): Promise<void> {
  console.log('Starting raw data processing...');

  try {
    // Ensure all directories exist
    ensureDirectoriesExist();

    // Generate SQL seed files
    console.log('Generating SQL seed files...');
    await generateSqlSeedFiles(PAYLOAD_SQL_SEED_DIR);

    // Verify quiz ID consistency
    console.log('Verifying quiz ID consistency...');
    const quizIdsConsistent = verifyQuizSystemIntegrity();
    if (!quizIdsConsistent) {
      console.warn(
        'WARNING: Quiz ID inconsistencies detected. This may cause issues during migration.',
      );
    }

    // Copy SQL seed files to the processed directory
    await copySqlSeedFiles();

    // Create a metadata file with processing timestamp
    const metadata = {
      processedAt: new Date().toISOString(),
      rawDataDir: RAW_DATA_DIR,
      processedDataDir: PROCESSED_DATA_DIR,
      quizIdsConsistent,
    };

    fs.writeFileSync(
      path.join(PROCESSED_DATA_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
    );

    console.log('Raw data processing completed successfully.');
  } catch (error) {
    console.error('Error processing raw data:', error);
    throw error;
  }
}

/**
 * Validates that all required raw data directories exist
 */
function validateRawDataDirectories(): boolean {
  console.log('Validating raw data directories...');

  const directories = [
    RAW_DATA_DIR,
    RAW_COURSES_DIR,
    RAW_LESSONS_DIR,
    RAW_QUIZZES_DIR,
    RAW_DOCUMENTATION_DIR,
    RAW_POSTS_DIR,
    RAW_SURVEYS_DIR,
  ];

  let allExist = true;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.error(`Raw data directory does not exist: ${dir}`);
      allExist = false;
    }
  }

  if (allExist) {
    console.log('All raw data directories exist.');
  } else {
    console.error(
      'Some raw data directories are missing. Please check the paths.',
    );
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
    console.log(
      'Validation completed successfully. Raw data directories exist.',
    );
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

export { processRawData, validateRawDataDirectories };
