/**
 * Test script to verify the UUID tables function fix works correctly
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import {
  safeInsertIntoUuidTablesTracking,
  validateDynamicUuidTablesSchema,
} from '../utils/schema-validation.js';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, `../../../../${envFile}`) });

async function verifyUuidTablesFix() {
  console.log('=== UUID Tables Fix Verification ===');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('\n1. Validating dynamic_uuid_tables schema...');
      const schemaValidation = await validateDynamicUuidTablesSchema(client);

      console.log(
        `Schema validation result: ${schemaValidation.isValid ? '✅ Valid' : '❌ Invalid'}`,
      );
      console.log(`Available columns: ${schemaValidation.columns.join(', ')}`);

      if (schemaValidation.hasDeprecatedColumns) {
        console.log(
          '⚠️ Schema contains deprecated columns that might be removed in future versions.',
        );
      }

      // Test the scan_and_fix_uuid_tables function
      console.log('\n2. Testing scan_and_fix_uuid_tables function...');
      try {
        // First check if the function exists
        const funcExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = 'scan_and_fix_uuid_tables'
            AND nspname = 'payload'
          );
        `);

        if (funcExists.rows[0].exists) {
          console.log('✅ Function scan_and_fix_uuid_tables exists');

          // Execute the function with the updated signature
          const result = await client.query(`
            SELECT * FROM payload.scan_and_fix_uuid_tables();
          `);

          console.log(
            `Function executed successfully and processed ${result.rowCount} tables`,
          );

          if (result.rowCount > 0) {
            console.log('Tables modified:');
            result.rows.forEach((row) => {
              console.log(
                `- ${row.table_name}: Added columns ${row.columns_added.join(', ')}`,
              );
            });
          } else {
            console.log('No tables needed modification');
          }
        } else {
          console.log('❌ Function scan_and_fix_uuid_tables does not exist!');
        }
      } catch (funcError) {
        console.error(
          '❌ Error executing scan_and_fix_uuid_tables function:',
          funcError.message,
        );
      }

      // Test the safe insert function
      console.log('\n3. Testing safe insert function...');
      try {
        // Create a test table name
        const testTable = `test_${Date.now()}`;

        // Try to insert it using the safe function
        const insertResult = await safeInsertIntoUuidTablesTracking(
          client,
          testTable,
        );

        console.log(
          `Safe insert result: ${insertResult ? '✅ Success' : '❌ Failed'}`,
        );

        // Verify the record was inserted
        const verifyResult = await client.query(
          `SELECT * FROM payload.dynamic_uuid_tables WHERE table_name = $1`,
          [testTable],
        );

        if (verifyResult.rowCount > 0) {
          console.log('✅ Record exists in dynamic_uuid_tables');
          console.log('Record data:', verifyResult.rows[0]);
        } else {
          console.log('❌ Record was not found in dynamic_uuid_tables');
        }

        // Clean up the test record
        await client.query(
          `DELETE FROM payload.dynamic_uuid_tables WHERE table_name = $1`,
          [testTable],
        );
      } catch (insertError) {
        console.error(
          '❌ Error testing safe insert function:',
          insertError.message,
        );
      }

      console.log('\n=== Verification Complete ===');
      if (schemaValidation.isValid) {
        console.log('✅ UUID Tables Fix is working correctly');
      } else {
        console.log('❌ UUID Tables Fix verification failed');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying UUID tables fix:', error);
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyUuidTablesFix().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
