/**
 * Run SQL File Script
 *
 * This script executes a SQL file using the executeSqlFile utility.
 * It's designed to be called from the command line.
 */
import { executeSqlFile } from './execute-sql-file.js';
// Get the file path from the command line arguments
const filePath = process.argv[2];
if (!filePath) {
    console.error('No SQL file path provided');
    process.exit(1);
}
// Execute the SQL file
executeSqlFile(filePath)
    .then(() => {
    console.log(`Successfully executed SQL file: ${filePath}`);
    process.exit(0);
})
    .catch((error) => {
    console.error(`Error executing SQL file: ${filePath}`, error);
    process.exit(1);
});
