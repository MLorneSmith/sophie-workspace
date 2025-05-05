/**
 * Enhanced Relationship Detection System
 *
 * This module analyzes the database to identify and map relationships
 * between collections, integrating with the UUID table registry from Phase 1.
 */
import fs from 'fs/promises';
import path from 'path';
import { executeSQL } from '../../../../utils/db/execute-sql.js';
import { EXCLUDED_RELATIONSHIP_PATHS, RELATIONSHIP_MAP_FILE_PATH, RELATIONSHIP_TABLE_PATTERNS, UUID_TABLE_PATTERN, } from './constants.js';
import { fileExists, saveJsonToFile } from './utils.js';
/**
 * Detect all relationships in the database
 *
 * @returns A comprehensive map of all relationships
 */
export async function detectAllRelationships() {
    console.log('Detecting relationships in the database...');
    // Initialize relationship map
    const map = {
        collections: {},
        relationshipTables: [],
        uuidTables: [],
    };
    try {
        // Step 1: Get all collections from the database (excluding relationship tables)
        const collectionsQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'payload' 
      AND tablename NOT LIKE '%_rels' 
      AND tablename NOT LIKE '%_rels_%'
      AND tablename NOT LIKE 'pg_%'
    `;
        const collectionsResult = await executeSQL(collectionsQuery);
        const collections = collectionsResult.rows.map((row) => row.tablename);
        console.log(`Found ${collections.length} collections`);
        // Step 2: Get relationship tables
        let relationshipTablesQuery = "SELECT tablename FROM pg_tables WHERE schemaname = 'payload' AND (";
        for (let i = 0; i < RELATIONSHIP_TABLE_PATTERNS.length; i++) {
            relationshipTablesQuery += i > 0 ? ' OR ' : '';
            relationshipTablesQuery += `tablename LIKE '${RELATIONSHIP_TABLE_PATTERNS[i]}'`;
        }
        relationshipTablesQuery += ')';
        const relTablesResult = await executeSQL(relationshipTablesQuery);
        const relTables = relTablesResult.rows.map((row) => row.tablename);
        console.log(`Found ${relTables.length} relationship tables`);
        map.relationshipTables = relTables;
        // Step 3: Check for UUID registry from Phase 1
        try {
            const uuidRegistryQuery = `
        SELECT table_name FROM payload.dynamic_uuid_tables
        WHERE table_name ~ '${UUID_TABLE_PATTERN}'
      `;
            const uuidRegistry = await executeSQL(uuidRegistryQuery);
            // Add UUID tables from registry to our tracking
            map.uuidTables = uuidRegistry.rows.map((row) => row.table_name);
            console.log(`Found ${map.uuidTables.length} UUID tables in registry`);
        }
        catch (error) {
            console.log('UUID registry table not found, falling back to direct detection');
            // Fall back to extracting UUID tables from all tables
            const uuidTablesQuery = `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'payload' 
        AND tablename ~ '${UUID_TABLE_PATTERN}'
      `;
            const uuidTablesResult = await executeSQL(uuidTablesQuery);
            map.uuidTables = uuidTablesResult.rows.map((row) => row.tablename);
            console.log(`Directly detected ${map.uuidTables.length} UUID tables`);
        }
        // Step 4: Analyze collections to detect relationships
        for (const collection of collections) {
            // Get collection fields
            const columnsQuery = `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'payload' AND table_name = '${collection}'
      `;
            const columnsResult = await executeSQL(columnsQuery);
            // Initialize collection in the map
            map.collections[collection] = {
                name: collection,
                relationships: [],
            };
            // Filter out known utility/non-collection tables before checking relationships
            const potentialTargetCollections = collections.filter((c) => c !== 'uuid_table_monitor' &&
                c !== 'dynamic_uuid_tables' &&
                c !== 'payload_preferences' && // Add other known non-content tables if necessary
                c !== 'payload_migrations' &&
                c !== 'payload_locked_documents');
            // Find relationship tables for this collection
            const relTableMatches = relTables.filter((table) => {
                return (table === `${collection}_rels` ||
                    (table.startsWith(`${collection}_`) && table.endsWith('_rels')));
            });
            // If relationship tables exist, analyze them
            for (const relTable of relTableMatches) {
                const relPathsQuery = `
          SELECT DISTINCT path
          FROM payload.${relTable}
          ORDER BY path
        `;
                const relPathsResult = await executeSQL(relPathsQuery);
                const paths = relPathsResult.rows.map((row) => row.path);
                for (const path of paths) {
                    // Skip excluded paths
                    if (EXCLUDED_RELATIONSHIP_PATHS.includes(path)) {
                        continue;
                    }
                    // For each path, try to determine the target collection
                    let targetCollection = '';
                    let relationType = 'hasOne';
                    try {
                        // Sample a few rows to determine the target collection
                        const sampleQuery = `
              SELECT r.id, r.parent_id
              FROM payload.${relTable} r
              WHERE r.path = '${path}'
              LIMIT 5
            `;
                        const sampleResult = await executeSQL(sampleQuery);
                        if (sampleResult.rows.length > 0) {
                            const sampleId = sampleResult.rows[0].id;
                            // Try to find which collection this ID belongs to
                            for (const potentialTarget of potentialTargetCollections) {
                                // Use filtered list
                                // Skip self-references to avoid confusion
                                if (potentialTarget === collection)
                                    continue;
                                // Check if the potential target table has an 'id' column before querying it
                                const columnCheckQuery = `
                  SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_schema = 'payload' 
                  AND table_name = '${potentialTarget}' 
                  AND column_name = 'id'
                  LIMIT 1;
                `;
                                const columnCheckResult = await executeSQL(columnCheckQuery);
                                // Only proceed if the 'id' column exists
                                if (columnCheckResult.rows.length > 0) {
                                    const checkQuery = `
                    SELECT COUNT(*) as count
                    FROM payload.${potentialTarget}
                    WHERE id = '${sampleId}'
                  `;
                                    const checkResult = await executeSQL(checkQuery);
                                    if (checkResult.rows[0].count > 0) {
                                        targetCollection = potentialTarget;
                                        break; // Found the target collection
                                    }
                                }
                            }
                            // If we couldn't find a match, try harder with a different approach
                            if (!targetCollection) {
                                // Try to infer from the path name (common pattern in Payload)
                                // For example, if path is 'images', look for a collection named 'media'
                                // This is heuristic and might not always work
                                // Check if there's more than one ID in the sample - if so, it's hasMany
                                if (sampleResult.rows.length > 1) {
                                    const uniqueParentIds = new Set(sampleResult.rows.map((row) => row.parent_id));
                                    if (uniqueParentIds.size < sampleResult.rows.length) {
                                        relationType = 'hasMany';
                                    }
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error analyzing relationship for ${collection}.${path}:`, error);
                    }
                    // If we still don't have a target, try to infer from naming conventions
                    if (!targetCollection && path) {
                        // Convert path to singular form (heuristic)
                        let singularPath = path;
                        if (path && typeof path === 'string' && path.endsWith('s')) {
                            singularPath = path.slice(0, -1);
                        }
                        // Check if any collection name matches or contains the path
                        const possibleTargets = collections.filter((c) => (path && c === path) ||
                            (singularPath && c === singularPath) ||
                            (path && typeof c === 'string' && c.includes(path)) ||
                            (singularPath &&
                                typeof c === 'string' &&
                                c.includes(singularPath)));
                        if (possibleTargets.length === 1) {
                            targetCollection = possibleTargets[0];
                        }
                    }
                    // Add the relationship to the map
                    map.collections[collection].relationships.push({
                        sourceCollection: collection,
                        sourceField: path,
                        targetCollection: targetCollection || 'unknown',
                        relationType,
                        relationshipPath: path,
                        isRequired: false, // Default to false, could be refined with schema analysis
                        relationshipTable: relTable,
                    });
                }
            }
            console.log(`Analyzed ${collection}: found ${map.collections[collection].relationships.length} relationships`);
        }
        return map;
    }
    catch (error) {
        console.error('Error detecting relationships:', error);
        throw error;
    }
}
/**
 * Save the relationship map to a file for future use
 *
 * @param map Relationship map to save
 * @returns Path to the saved file
 */
export async function saveRelationshipMap(map) {
    return await saveJsonToFile(RELATIONSHIP_MAP_FILE_PATH, map);
}
/**
 * Load the relationship map from a file
 *
 * @returns The loaded relationship map, or undefined if the file doesn't exist
 */
export async function loadRelationshipMap() {
    try {
        if (await fileExists(RELATIONSHIP_MAP_FILE_PATH)) {
            const data = await fs.readFile(path.join(process.cwd(), RELATIONSHIP_MAP_FILE_PATH), 'utf-8');
            return JSON.parse(data);
        }
        return undefined;
    }
    catch (error) {
        console.error('Error loading relationship map:', error);
        return undefined;
    }
}
/**
 * Main function to detect and save relationship map
 *
 * @param force Force regeneration even if map already exists
 * @returns The relationship map
 */
export async function detectAndSaveRelationships(force = false) {
    // Check if map already exists
    if (!force) {
        const existingMap = await loadRelationshipMap();
        if (existingMap) {
            console.log('Using existing relationship map');
            return existingMap;
        }
    }
    console.log('Generating new relationship map...');
    const map = await detectAllRelationships();
    await saveRelationshipMap(map);
    console.log(`Relationship map saved to ${RELATIONSHIP_MAP_FILE_PATH}`);
    return map;
}
/**
 * Retrieve a filtered subset of relationships by source collection
 *
 * @param map The full relationship map
 * @param sourceCollection Filter by source collection
 * @returns Filtered relationships
 */
export function getRelationshipsBySource(map, sourceCollection) {
    return map.collections[sourceCollection]?.relationships || [];
}
/**
 * Retrieve a filtered subset of relationships by target collection
 *
 * @param map The full relationship map
 * @param targetCollection Filter by target collection
 * @returns Filtered relationships
 */
export function getRelationshipsByTarget(map, targetCollection) {
    const result = [];
    Object.values(map.collections).forEach((collection) => {
        collection.relationships.forEach((rel) => {
            if (rel.targetCollection === targetCollection) {
                result.push(rel);
            }
        });
    });
    return result;
}
/**
 * Find relationship by source collection and field
 *
 * @param map The relationship map
 * @param sourceCollection Source collection name
 * @param field Field name in the source collection
 * @returns Relationship info if found, undefined otherwise
 */
export function findRelationship(map, sourceCollection, field) {
    return map.collections[sourceCollection]?.relationships.find((rel) => rel.sourceField === field);
}
