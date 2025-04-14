/**
 * Main script for importing downloads from R2 to Payload CMS
 *
 * This is meant to be run as part of the content migration process
 */
import fs from 'fs';
import path from 'path';

import { runImport } from '../import/import-r2-downloads';

async function main() {
  console.log('Starting download import process');

  try {
    // Create the output directory for SQL
    const outputDir = path.resolve(
      process.cwd(),
      'packages/content-migrations/sql-output',
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate the SQL file
    const outputFile = path.join(outputDir, 'import-downloads.sql');

    // Run the import to generate SQL
    await runImport();

    console.log(
      `\nTo complete the import, run the generated SQL statements against your database.`,
    );
    console.log(
      `For example: psql -U postgres -d your_database -f ${outputFile}\n`,
    );

    return 0;
  } catch (error) {
    console.error(
      'Error during download import process:',
      error instanceof Error ? error.message : String(error),
    );
    return 1;
  }
}

// Always execute when this file is run directly
main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

export { main as importDownloads };
