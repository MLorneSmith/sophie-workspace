/**
 * Hook script to inject bunny video IDs after content migration
 * This ensures the bunny_video_id field is populated whenever the database is reset
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to update bunny video IDs in course lessons
 */
export async function updateBunnyVideoIds(): Promise<void> {
  console.log('Running hook to update bunny video IDs in course lessons...');
  process.stdout.write(
    'Running hook to update bunny video IDs in course lessons...\n',
  );

  try {
    // Use the relative path that we know works
    const sqlFilePath = 'src/scripts/repair/fix-bunny-video-ids.sql';
    console.log(`SQL file path: ${sqlFilePath}`);
    process.stdout.write(`SQL file path: ${sqlFilePath}\n`);

    // Run the SQL file using the project's utility
    const command = `pnpm run utils:run-sql-file "${sqlFilePath}"`;
    console.log(`Executing: ${command}`);
    process.stdout.write(`Executing: ${command}\n`);

    execSync(command, {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
    });

    console.log('Successfully updated bunny video IDs for course lessons');
    return;
  } catch (error) {
    console.error('Error updating bunny video IDs:', error);
    throw error;
  }
}

// Execute the function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  updateBunnyVideoIds()
    .then(() => {
      console.log('Bunny video ID update hook completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during bunny video ID update hook:', error);
      process.exit(1);
    });
}
