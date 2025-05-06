#!/usr/bin/env tsx
/**
 * Fix UUID Tables Script
 *
 * This script manually runs the scan_and_fix_uuid_tables() function to fix any new
 * UUID tables that have been created since the last scan. It adds required columns
 * to any tables that are missing them.
 *
 * Usage:
 *   pnpm tsx src/scripts/fix-uuid-tables.ts
 */

import { execSync } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

/**
 * Run SQL query against database
 */
async function runQuery(query: string): Promise<string> {
  try {
    // Get DATABASE_URI from environment
    const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL
    if (!DATABASE_URI) {
      throw new Error('DATABASE_URI environment variable not set')
    }

    // Create a temp SQL file
    const tmpFile = path.join(process.cwd(), 'tmp_query.sql')
    fs.writeFileSync(tmpFile, query)

    // Run the query through psql
    const result = execSync(`psql "${DATABASE_URI}" -f "${tmpFile}"`, {
      encoding: 'utf-8',
    })

    // Clean up
    fs.unlinkSync(tmpFile)

    return result
  } catch (error: any) {
    throw new Error(`Error executing query: ${error?.message || String(error)}`)
  }
}

async function fixUuidTables() {
  console.log(`=== UUID TABLE FIXER ===`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log()

  console.log('Testing database connection...')
  try {
    // Simple test query to verify database connection
    const connectionTest = await runQuery('SELECT NOW() as time;')
    console.log(`Database connection successful`)
  } catch (error) {
    console.error(`Database connection failed:`, error)
    process.exit(1)
  }

  // Check if scanner function exists
  console.log('\nChecking for scanner function...')
  try {
    const functionTest = await runQuery(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as exists;
    `)

    const functionExists = functionTest.includes('t')
    if (!functionExists) {
      console.error('❌ Scanner function does not exist')
      console.log('Please run migrations to create the scanner function')
      process.exit(1)
    }

    console.log('✅ Scanner function exists')
  } catch (error) {
    console.error('Error checking scanner function:', error)
    process.exit(1)
  }

  // Run the scanner function
  console.log('\nRunning the scanner function to fix UUID tables...')
  try {
    const result = await runQuery(`SELECT * FROM payload.scan_and_fix_uuid_tables();`)

    // Parse the results (this is simplified as psql output is text-based)
    if (result.includes('(0 rows)')) {
      console.log('No UUID tables required fixing')
    } else {
      // Count number of rows by counting the number of table_name entries
      const tableNameMatches = result.match(/\| [0-9a-f]{8}/g)
      const rowCount = tableNameMatches ? tableNameMatches.length : 0

      console.log(`Fixed ${rowCount} UUID tables`)
      console.log(result)
    }

    console.log('\n✅ UUID tables scan and fix completed successfully')
  } catch (error) {
    console.error('❌ Error fixing UUID tables:', error)
    process.exit(1)
  }

  // Check tracking table contents
  console.log('\nChecking tracking table contents...')
  try {
    const trackingResult = await runQuery(`
      SELECT table_name, has_path_column, last_checked 
      FROM payload.dynamic_uuid_tables 
      ORDER BY last_checked DESC 
      LIMIT 10;
    `)

    console.log(`Tracked UUID tables:`)
    console.log(trackingResult)
  } catch (error) {
    console.error('Error checking tracking table:', error)
  }

  console.log('\n=== SUMMARY ===')
  console.log('UUID tables have been scanned and fixed.')
  console.log('If you continue to experience "column X.path does not exist" errors, please:')
  console.log('1. Run diagnose-downloads.ts script for more detailed diagnostics')
  console.log(
    '2. Verify that the multi-tiered access approach is being used in the application code',
  )
  console.log('3. Check that the downloads_relationships view is correctly defined')
}

// Run the fix
fixUuidTables().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
