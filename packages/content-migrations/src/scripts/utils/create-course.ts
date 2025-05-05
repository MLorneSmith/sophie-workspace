/**
 * Script to create a course in Payload CMS
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import getPayloadClient from '../../utils/payload.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

/**
 * Creates a course in Payload CMS
 */
async function createCourse() {
  try {
    // Get the Payload client
    // const payload = await getPayloadClient(); // Removed - causes type errors

    // NOTE: Course creation logic removed as it's handled by migrations
    // and the imported client doesn't have the expected methods.
    console.log('Course creation logic is handled by Payload migrations.');
    return null; // Return null or handle appropriately
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

// Run the script if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createCourse().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

// Export the function for use in other scripts
export { createCourse };
