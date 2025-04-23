/**
 * Test script to verify that post migration scripts work correctly with the schema changes
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
// Create a simple schema validation test utility
// First create the file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../../${envFile}`) });

async function testPostMigration() {
  console.log('========== TESTING POST MIGRATION FIXES ==========');
  console.log(
    'This test will verify that the post migration scripts work correctly with schema changes',
  );

  try {
    // Step 1: Run the schema validation utility directly
    console.log('\n1. Testing schema validation utility...');
    execSync('tsx src/scripts/utils/schema-validation-test.ts', {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
    });

    // Step 2: Run the regular posts migration
    console.log('\n2. Testing regular posts migration...');
    execSync('tsx src/scripts/core/migrate-posts-direct.ts', {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
    });

    // Step 3: Run the private posts migration
    console.log('\n3. Testing private posts migration...');
    execSync('tsx src/scripts/core/migrate-private-direct.ts', {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
    });

    console.log('\n✅ All tests completed successfully!');
    console.log(
      'The migration scripts should now work with the current database schema.',
    );
    console.log(
      'You can now run the full reset-and-migrate.ps1 script to apply all migrations.',
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(
      'Please check the error messages above to diagnose the issue.',
    );
    process.exit(1);
  }
}

const schemaTestContent = `/**
 * Test utility for schema validation
 */
import { Pool } from 'pg';
import { validateDynamicUuidTablesSchema } from './schema-validation.js';

async function testSchemaValidation() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  });
  
  try {
    console.log('Testing schema validation utility...');
    const client = await pool.connect();
    
    try {
      const result = await validateDynamicUuidTablesSchema(client);
      
      console.log('Schema validation result:', {
        isValid: result.isValid,
        message: result.message,
        columns: result.columns,
        hasDeprecatedColumns: result.hasDeprecatedColumns
      });
      
      console.log('✅ Schema validation test completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Schema validation test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testSchemaValidation().catch(err => {
  console.error('Schema validation test failed:', err);
  process.exit(1);
});
`;

// Create the test file
const schemaTestFile = path.resolve(
  __dirname,
  '../utils/schema-validation-test.ts',
);
fs.writeFileSync(schemaTestFile, schemaTestContent);
console.log(`Created schema validation test file: ${schemaTestFile}`);

// Run the test
testPostMigration().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
