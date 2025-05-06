import type { Payload } from 'payload'

import {
  columnExists,
  executeSafeParamQuery,
  getTableNameForCollection,
  tableExists,
} from '../db/db-utils'

/**
 * Run diagnostics on downloads relationships
 */
export async function diagnoseDownloadsRelationships(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<string> {
  try {
    const results: string[] = []
    results.push(`=== DOWNLOAD RELATIONSHIPS DIAGNOSTICS ===`)
    results.push(`Collection type: ${collectionType}`)
    results.push(`Collection ID: ${collectionId}`)
    results.push(`Timestamp: ${new Date().toISOString()}`)
    results.push(``)

    // 1. Check if collection exists
    const tableName = getTableNameForCollection(collectionType)
    results.push(`Collection table name: ${tableName}`)

    if (!tableName) {
      results.push(`❌ Unknown collection type: ${collectionType}`)
      return results.join('\n')
    }

    const collectionExists = await tableExists(payload, 'payload', tableName)
    results.push(`Collection table exists: ${collectionExists ? '✅' : '❌'}`)

    if (!collectionExists) {
      return results.join('\n')
    }

    // 2. Check if downloads collection exists
    const downloadsExists = await tableExists(payload, 'payload', 'downloads')
    results.push(`Downloads table exists: ${downloadsExists ? '✅' : '❌'}`)

    // 3. Check relationship tables
    const relsTable = `${tableName}_rels`
    const relsTableExists = await tableExists(payload, 'payload', relsTable)
    results.push(`${relsTable} table exists: ${relsTableExists ? '✅' : '❌'}`)

    if (relsTableExists) {
      // Check for field column
      const fieldColumnExists = await columnExists(payload, 'payload', relsTable, 'field')
      results.push(`${relsTable}.field column exists: ${fieldColumnExists ? '✅' : '❌'}`)

      // Check for path column
      const pathColumnExists = await columnExists(payload, 'payload', relsTable, 'path')
      results.push(`${relsTable}.path column exists: ${pathColumnExists ? '✅' : '❌'}`)

      // Check for parent_id column
      const parentIdColumnExists = await columnExists(payload, 'payload', relsTable, '_parent_id')
      results.push(`${relsTable}._parent_id column exists: ${parentIdColumnExists ? '✅' : '❌'}`)

      // Check for value column
      const valueColumnExists = await columnExists(payload, 'payload', relsTable, 'value')
      results.push(`${relsTable}.value column exists: ${valueColumnExists ? '✅' : '❌'}`)
    }

    // 4. Check downloads_rels table
    const downloadsRelsExists = await tableExists(payload, 'payload', 'downloads_rels')
    results.push(`downloads_rels table exists: ${downloadsRelsExists ? '✅' : '❌'}`)

    if (downloadsRelsExists) {
      // Check for field column
      const fieldColumnExists = await columnExists(payload, 'payload', 'downloads_rels', 'field')
      results.push(`downloads_rels.field column exists: ${fieldColumnExists ? '✅' : '❌'}`)

      // Check for path column
      const pathColumnExists = await columnExists(payload, 'payload', 'downloads_rels', 'path')
      results.push(`downloads_rels.path column exists: ${pathColumnExists ? '✅' : '❌'}`)
    }

    // 5. Check for dynamic UUID tables
    const dynamicTablesQuery = `
      SELECT table_name FROM payload.dynamic_uuid_tables
    `
    const dynamicTables = await executeSafeParamQuery(payload, dynamicTablesQuery, [])

    results.push(`\n=== DYNAMIC UUID TABLES (${dynamicTables.length}) ===`)
    for (const table of dynamicTables) {
      results.push(`- ${table.table_name}`)

      const pathColumnExists = await columnExists(payload, 'payload', table.table_name, 'path')
      results.push(`  ${table.table_name}.path column exists: ${pathColumnExists ? '✅' : '❌'}`)
    }

    // 6. Try to get downloads via each approach
    results.push(`\n=== DOWNLOADS RETRIEVAL TESTS ===`)

    // TIER 1: API approach
    try {
      // Use Payload's collection API
      const where: Record<string, any> = {}
      where[collectionType] = { equals: collectionId }

      const { docs } = await payload.find({
        collection: 'downloads',
        where,
        depth: 0, // Minimize join complexity
      })

      results.push(`API approach: ${docs.length} downloads found ✅`)
      if (docs.length > 0) {
        results.push(`  First download ID: ${docs[0].id}`)
      }
    } catch (error: any) {
      results.push(`API approach failed: ❌`)
      results.push(`  Error: ${error?.message || String(error)}`)
    }

    // TIER 2: Direct SQL approach
    try {
      const directSqlQuery = `
        SELECT d.id 
        FROM payload.downloads d
        JOIN payload.${tableName}_rels r ON r.value = d.id
        WHERE r._parent_id = $1
        AND r.field = 'downloads'
      `

      const rows = await executeSafeParamQuery(payload, directSqlQuery, [collectionId])

      results.push(
        `Direct SQL approach: ${rows.length} downloads found ${rows.length > 0 ? '✅' : '⚠️'}`,
      )
      if (rows.length > 0) {
        results.push(`  First download ID: ${rows[0].id}`)
      }
    } catch (error: any) {
      results.push(`Direct SQL approach failed: ❌`)
      results.push(`  Error: ${error?.message || String(error)}`)
    }

    // TIER 3: View approach
    try {
      const viewQuery = `
        SELECT download_id 
        FROM payload.downloads_relationships
        WHERE collection_id = $1
        AND collection_type = $2
      `

      const rows = await executeSafeParamQuery(payload, viewQuery, [collectionId, collectionType])

      results.push(`View approach: ${rows.length} downloads found ${rows.length > 0 ? '✅' : '⚠️'}`)
      if (rows.length > 0) {
        results.push(`  First download ID: ${rows[0].download_id}`)
      }
    } catch (error: any) {
      results.push(`View approach failed: ❌`)
      results.push(`  Error: ${error?.message || String(error)}`)
    }

    // TIER 4: Database Functions approach
    try {
      const dbFunctionQuery = `
        SELECT * FROM payload.get_downloads_for_collection($1, $2)
      `

      const rows = await executeSafeParamQuery(payload, dbFunctionQuery, [
        collectionId,
        collectionType,
      ])

      results.push(
        `DB Function approach: ${rows.length} downloads found ${rows.length > 0 ? '✅' : '⚠️'}`,
      )
      if (rows.length > 0) {
        results.push(`  First download ID: ${rows[0].download_id}`)
      }
    } catch (error: any) {
      results.push(`DB Function approach failed: ❌`)
      results.push(`  Error: ${error?.message || String(error)}`)
    }

    return results.join('\n')
  } catch (error: any) {
    console.error('Diagnostics failed:', error)
    return `Diagnostics failed: ${error?.message || String(error)}`
  }
}
