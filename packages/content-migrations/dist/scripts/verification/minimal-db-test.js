import { getClient } from '../../utils/db/client.js';
// packages/content-migrations/src/scripts/verification/minimal-db-test.ts
console.log('--- MINIMAL DB TEST SCRIPT LOADED ---');
console.log('--- IMPORTS COMPLETED ---');
async function runTest() {
    console.log('Attempting to get database client...');
    try {
        const client = await getClient();
        console.log('Successfully obtained database client.');
        // Optionally, run a simple query to confirm connection
        // const result = await client.query('SELECT 1;');
        // console.log('Simple query successful:', result.rows);
        await client.end(); // Close the client
        console.log('Database client closed.');
    }
    catch (error) {
        console.error('Error getting database client:', error);
        process.exit(1);
    }
}
runTest();
