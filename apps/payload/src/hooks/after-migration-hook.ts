/**
 * After Migration Hook
 *
 * This module provides hooks that run after migrations.
 * It ensures that required fixes like the UUID table scanner are run
 * automatically when migrations are applied.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Run SQL query against database
 */
async function runQuery(query: string, databaseUrl: string): Promise<string> {
  try {
    // Create a temp SQL file
    const tmpFile = path.join(process.cwd(), 'tmp_query.sql')
    fs.writeFileSync(tmpFile, query)

    // Run the query through psql
    const result = execSync(`psql "${databaseUrl}" -f "${tmpFile}"`, {
      encoding: 'utf-8',
    })

    // Clean up
    fs.unlinkSync(tmpFile)

    return result
  } catch (error: any) {
    throw new Error(`Error executing query: ${error?.message || String(error)}`)
  }
}

/**
 * Run the UUID table scanner to fix any missing columns
 */
export async function runUuidTableScanner(databaseUrl: string): Promise<void> {
  try {
    console.log('Running UUID table scanner to fix any dynamic tables...')

    // Check if the scanner function exists
    const functionTest = await runQuery(
      `
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as exists;
    `,
      databaseUrl,
    )

    const functionExists = functionTest.includes('t')
    if (!functionExists) {
      console.log('UUID table scanner function does not exist, skipping...')
      return
    }

    // Run the scanner function
    const result = await runQuery(`SELECT * FROM payload.scan_and_fix_uuid_tables();`, databaseUrl)

    if (result.includes('(0 rows)')) {
      console.log('No UUID tables required fixing')
    } else {
      // Count number of rows by counting the number of table_name entries
      const tableNameMatches = result.match(/\| [0-9a-f]{8}/g)
      const rowCount = tableNameMatches ? tableNameMatches.length : 0

      console.log(`Fixed ${rowCount} UUID tables during post-migration hook`)
    }
  } catch (error) {
    // Just log the error but don't throw, as we don't want to interrupt migrations
    console.error('Error in after-migration hook when fixing UUID tables:', error)
  }
}

/**
 * Run all after-migration hooks
 */
export async function runAfterMigrationHooks(databaseUrl: string): Promise<void> {
  console.log('Running after-migration hooks...')

  try {
    // Run the UUID table scanner
    await runUuidTableScanner(databaseUrl)

    console.log('After-migration hooks completed successfully')
  } catch (error) {
    console.error('Error running after-migration hooks:', error)
  }
}
