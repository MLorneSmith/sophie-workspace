/**
 * Script to ensure the lesson metadata YAML file exists
 * This is a utility script called during the migration process
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// Define paths
const METADATA_PATH = path.resolve(__dirname, '../../data/raw/lesson-metadata.yaml');
const CREATOR_SCRIPT_PATH = path.resolve(__dirname, '../create-full-lesson-metadata.ts');
/**
 * Check if the lesson metadata YAML file exists and create it if needed
 */
export async function ensureLessonMetadata() {
    console.log('Checking for lesson metadata YAML file...');
    // Check if metadata file exists
    if (fs.existsSync(METADATA_PATH)) {
        console.log(`Lesson metadata file already exists at ${METADATA_PATH}`);
        // Check file age
        const stats = fs.statSync(METADATA_PATH);
        const fileAgeInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (fileAgeInDays > 7) {
            console.warn(`WARNING: Lesson metadata file is ${Math.floor(fileAgeInDays)} days old.`);
            console.warn('Consider regenerating it with the latest data.');
        }
        return true;
    }
    console.log('Lesson metadata file not found. Creating it...');
    try {
        // Execute the creator script
        console.log(`Executing ${CREATOR_SCRIPT_PATH}...`);
        execSync(`tsx ${CREATOR_SCRIPT_PATH}`, { stdio: 'inherit' });
        // Verify file was created
        if (fs.existsSync(METADATA_PATH)) {
            console.log('Lesson metadata file created successfully.');
            return true;
        }
        else {
            console.error('Failed to create lesson metadata file.');
            return false;
        }
    }
    catch (error) {
        console.error('Error creating lesson metadata file:', error);
        return false;
    }
}
// Execute the function if this script is run directly
if (require.main === module) {
    ensureLessonMetadata()
        .then((result) => {
        if (!result) {
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
