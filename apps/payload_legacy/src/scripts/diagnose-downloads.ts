#!/usr/bin/env tsx
/**
 * Diagnose Downloads Script
 *
 * This script checks the relationship between Payload collections and the downloads system,
 * identifying any problems with UUID tables, missing columns, or relationship issues.
 *
 * Usage:
 *   pnpm tsx src/scripts/diagnose-downloads.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { sql } from '@payloadcms/db-postgres'

// Setup environment
dotenv.config()

async function diagnoseDownloads() {
  console.log(`=== DOWNLOADS RELATIONSHIP DIAGNOSTICS ===`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log()

  // Initialize Payload - directly access the database instead
  console.log('Initializing direct database connection...')

  // Get database connection details
  const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!DATABASE_URI) {
    console.error('DATABASE_URI environment variable not set')
    process.exit(1)
  }

  // Create a direct database connection
  console.log('Creating direct database connection...')

  // Set up fake payload object to use for diagnostics
  const payload = {
    db: {
      drizzle: {
        execute: async (query: any) => {
          try {
            // Use postgres directly
            const { default: postgres } = await import('postgres')
            const client = postgres(DATABASE_URI, { ssl: { rejectUnauthorized: false } })

            // Execute the query
            const values = query.values || []
            const result = await client.unsafe(query.sql, values)
            await client.end()

            return { rows: result }
          } catch (error) {
            console.error('Database error:', error)
            throw error
          }
        },
      },
    },
    shutdown: async () => {},
  }

  console.log('Testing database connection...')
  try {
    // Simple test query to verify database connection
    const connectionTest = await payload.db.drizzle.execute(sql`SELECT NOW() as time`)
    console.log(
      `Database connection successful, server time: ${connectionTest?.rows?.[0]?.time || 'unknown'}`,
    )
  } catch (error) {
    console.error(`Database connection failed:`, error)
    process.exit(1)
  }

  // Check if scanner function exists
  console.log('\nChecking for scanner function...')
  try {
    const functionTest = await payload.db.drizzle.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as exists
    `)

    const functionExists = functionTest?.rows?.[0]?.exists === true
    if (!functionExists) {
      console.error('❌ Scanner function does not exist')
      console.log('This is a critical component for fixing UUID tables')
      console.log('Please run migrations to create the scanner function')
    } else {
      console.log('✅ Scanner function exists')
    }
  } catch (error) {
    console.error('Error checking scanner function:', error)
  }

  // Check for tracking table
  console.log('\nChecking for tracking table...')
  try {
    const tableTest = await payload.db.drizzle.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name = 'dynamic_uuid_tables'
      ) as exists
    `)

    const tableExists = tableTest?.rows?.[0]?.exists === true
    if (!tableExists) {
      console.error('❌ Tracking table does not exist')
      console.log('This table is needed to track UUID tables and their columns')
    } else {
      console.log('✅ Tracking table exists')

      // Check tracking table contents
      console.log('\nChecking tracking table contents...')
      try {
        const trackingResult = await payload.db.drizzle.execute(sql`
          SELECT table_name, has_path_column, last_checked 
          FROM payload.dynamic_uuid_tables 
          ORDER BY last_checked DESC 
          LIMIT 10
        `)

        console.log(`Found ${trackingResult.rows.length} tracked UUID tables:`)
        for (const row of trackingResult.rows) {
          console.log(
            ` - ${row.table_name}: ${row.has_path_column ? '✅' : '❌'} path column, last checked ${row.last_checked}`,
          )
        }
      } catch (error) {
        console.error('Error checking tracking table:', error)
      }
    }
  } catch (error) {
    console.error('Error checking tracking table:', error)
  }

  // Check for helper view
  console.log('\nChecking for helper view...')
  try {
    const viewTest = await payload.db.drizzle.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'payload'
        AND table_name = 'downloads_relationships'
      ) as exists
    `)

    const viewExists = viewTest?.rows?.[0]?.exists === true
    if (!viewExists) {
      console.error('❌ Helper view does not exist')
      console.log('This view is needed for easier relationship data access')
    } else {
      console.log('✅ Helper view exists')
    }
  } catch (error) {
    console.error('Error checking helper view:', error)
  }

  // Find UUID tables with missing path columns
  console.log('\nSearching for UUID tables with missing columns...')
  try {
    const missingColumnsResult = await payload.db.drizzle.execute(sql`
      SELECT t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'payload'
      AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      AND NOT EXISTS (
        SELECT FROM information_schema.columns c
        WHERE c.table_schema = 'payload'
        AND c.table_name = t.table_name
        AND c.column_name = 'path'
      )
    `)

    if (missingColumnsResult.rows.length > 0) {
      console.error(
        `❌ Found ${missingColumnsResult.rows.length} UUID tables with missing path column:`,
      )
      for (const row of missingColumnsResult.rows) {
        console.error(` - ${row.table_name}`)
      }
      console.log('These tables need the path column added')
    } else {
      console.log('✅ No UUID tables found with missing path column')
    }

    // Check for missing parent_id and downloads_id columns as well
    const missingParentIdResult = await payload.db.drizzle.execute(sql`
      SELECT t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'payload'
      AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      AND NOT EXISTS (
        SELECT FROM information_schema.columns c
        WHERE c.table_schema = 'payload'
        AND c.table_name = t.table_name
        AND c.column_name = 'parent_id'
      )
    `)

    if (missingParentIdResult.rows.length > 0) {
      console.warn(
        `⚠️ Found ${missingParentIdResult.rows.length} UUID tables with missing parent_id column`,
      )
    }

    const missingDownloadsIdResult = await payload.db.drizzle.execute(sql`
      SELECT t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'payload'
      AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      AND NOT EXISTS (
        SELECT FROM information_schema.columns c
        WHERE c.table_schema = 'payload'
        AND c.table_name = t.table_name
        AND c.column_name = 'downloads_id'
      )
    `)

    if (missingDownloadsIdResult.rows.length > 0) {
      console.warn(
        `⚠️ Found ${missingDownloadsIdResult.rows.length} UUID tables with missing downloads_id column`,
      )
    }
  } catch (error) {
    console.error('Error searching for missing columns:', error)
  }

  // Count total UUID tables
  console.log('\nCounting total UUID tables...')
  try {
    const totalTablesResult = await payload.db.drizzle.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables t
      WHERE t.table_schema = 'payload'
      AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
    `)

    console.log(`Total UUID tables found: ${totalTablesResult.rows[0]?.count || 0}`)
  } catch (error) {
    console.error('Error counting total UUID tables:', error)
  }

  // Close Payload
  try {
    // @ts-ignore - shutdown method might exist with different parameters in different payload versions
    await payload.shutdown()
  } catch (error) {
    console.log('Note: Could not properly shutdown Payload, but this is not critical')
  }

  console.log('\n=== RECOMMENDATIONS ===')
  console.log('If issues were found, please run the following fixes:')
  console.log('1. Run the reset-and-migrate.ps1 script to apply all migrations')
  console.log("2. If that doesn't work, run the fix-uuid-tables script directly:")
  console.log('   cd apps/payload && pnpm tsx src/scripts/fix-uuid-tables.ts')
  console.log('3. Check that all migration files are present and applied correctly')
  console.log('\nIf problems persist:')
  console.log(
    '1. Make sure your application code uses a multi-tiered approach for accessing relationship data',
  )
  console.log('2. Consider using the helper function for safer relationship data access')
}

// Run the diagnostics
diagnoseDownloads().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
