/**
 * Run UUID Tables Fix Script
 *
 * This script executes the SQL fix directly using Node.js pg client instead of psql.
 * It's a cross-platform approach that doesn't rely on psql being installed.
 *
 * Usage:
 *   pnpm --filter @kit/content-migrations run fix:uuid-tables
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Setup environment
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Load environment variables from .env.development file in content-migrations package
try {
    const envFilePath = path.resolve(__dirname, '../../../.env.development');
    if (fs.existsSync(envFilePath)) {
        console.log(`Loading environment variables from: ${envFilePath}`);
        const envContent = fs.readFileSync(envFilePath, 'utf-8');
        const envLines = envContent.split('\n');
        for (const line of envLines) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                const value = match[2] || '';
                if (key === 'DATABASE_URI' || key === 'DATABASE_URL') {
                    process.env[key] = value.replace(/['"]/g, '');
                    console.log(`Setting ${key} from .env.development file`);
                }
            }
        }
    }
}
catch (error) {
    // Silently continue if env file can't be loaded
}
// Get DATABASE_URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!DATABASE_URI) {
    throw new Error('DATABASE_URI environment variable not set');
}
async function runUuidTablesFix() {
    console.log('=== RUNNING UUID TABLES FIX ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    try {
        // Locate the enhanced SQL fix script from content-migrations package
        const sqlScriptPath = path.resolve(__dirname, 'enhanced-uuid-tables-fix.sql');
        if (!fs.existsSync(sqlScriptPath)) {
            console.error(`SQL script not found at: ${sqlScriptPath}`);
            return false;
        }
        console.log(`Executing SQL script: ${sqlScriptPath}`);
        // Read the SQL script
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');
        // Connect to the database using pg pool
        const pool = new Pool({
            connectionString: DATABASE_URI,
        });
        try {
            // Execute the SQL script
            await pool.query(sqlScript);
            console.log('SQL script executed successfully via Node.js pg client with corrected schema');
            return true;
        }
        catch (dbError) {
            console.error('Database error executing UUID tables fix:', dbError.message);
            // Try a fallback approach with individual statements if the script failed
            console.log('Attempting fallback with individual SQL statements...');
            // Create the required functions and tables directly
            await pool.query(`
        -- Check if we need to convert the schema
        DO $$
        DECLARE
          table_exists BOOLEAN;
          column_exists BOOLEAN;
        BEGIN
          -- Check if dynamic_uuid_tables exists
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'payload'
            AND table_name = 'dynamic_uuid_tables'
          ) INTO table_exists;
          
          IF table_exists THEN
            -- Check if we have the new schema structure (needs_path_column)
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = 'dynamic_uuid_tables'
              AND column_name = 'needs_path_column'
            ) INTO column_exists;
            
            IF NOT column_exists THEN
              -- The table exists but has old schema - try to alter it
              BEGIN
                RAISE NOTICE 'Converting dynamic_uuid_tables schema to new format';
                -- Add the missing columns that should be in the new schema
                ALTER TABLE payload.dynamic_uuid_tables 
                  ADD COLUMN IF NOT EXISTS primary_key TEXT,
                  ADD COLUMN IF NOT EXISTS needs_path_column BOOLEAN DEFAULT FALSE;
                
                -- Remove old columns if they exist
                ALTER TABLE payload.dynamic_uuid_tables 
                  DROP COLUMN IF EXISTS last_checked,
                  DROP COLUMN IF EXISTS has_downloads_id;
                
                -- Rename timestamps if needed
                BEGIN
                  ALTER TABLE payload.dynamic_uuid_tables RENAME COLUMN last_checked TO created_at;
                EXCEPTION WHEN OTHERS THEN
                  -- Column might not exist, which is fine
                  RAISE NOTICE 'No timestamp column rename needed';
                END;
              EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error converting schema: %', SQLERRM;
              END;
            END IF;
          END IF;
        END
        $$;
        
        -- Create the UUID tables tracking table if not exists with the correct schema
        CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
          table_name TEXT PRIMARY KEY,
          primary_key TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          needs_path_column BOOLEAN DEFAULT FALSE
        );
        
        -- Drop the function if it exists to avoid errors
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
        
        -- Create an improved version of the function
        CREATE FUNCTION payload.scan_and_fix_uuid_tables() RETURNS void AS $$
        DECLARE
          table_record RECORD;
          dynamic_table_exists BOOLEAN;
        BEGIN
          -- Check if dynamic_uuid_tables exists first
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'payload'
            AND table_name = 'dynamic_uuid_tables'
          ) INTO dynamic_table_exists;
          
          -- Process all UUID tables
          FOR table_record IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
          LOOP
            -- Add standard columns
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS private_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS documentation_id UUID', table_record.table_name);
            
            -- Log this table in dynamic_uuid_tables with the correct schema
            IF dynamic_table_exists THEN
              BEGIN
                EXECUTE format('INSERT INTO payload.dynamic_uuid_tables (table_name, primary_key, created_at, needs_path_column)
                VALUES (%L, %L, NOW(), TRUE)
                ON CONFLICT (table_name)
                DO UPDATE SET created_at = NOW(), needs_path_column = TRUE', 
                table_record.table_name, 'parent_id');
              EXCEPTION WHEN OTHERS THEN
                -- Skip in case of error with the tracking table
              END;
            END IF;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);
            // Direct fix for critical relationship tables
            try {
                await pool.query(`
          -- Ensure downloads_rels has documentation_id
          ALTER TABLE IF EXISTS payload.downloads_rels 
          ADD COLUMN IF NOT EXISTS documentation_id UUID;
          
          -- Ensure documentation_rels has all required fields
          ALTER TABLE IF EXISTS payload.documentation_rels 
          ADD COLUMN IF NOT EXISTS downloads_id UUID;
          ALTER TABLE IF EXISTS payload.documentation_rels 
          ADD COLUMN IF NOT EXISTS documentation_id UUID;
        `);
                console.log('Applied direct fixes to critical relationship tables');
            }
            catch (tableError) {
                console.error('Error fixing critical tables:', tableError.message);
            }
            // Execute the function
            await pool.query('SELECT payload.scan_and_fix_uuid_tables();');
            console.log('Fallback approach with schema corrections completed successfully');
            return true;
        }
        finally {
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error executing UUID tables fix:', error.message || error);
        return false;
    }
}
// Auto-execute the fix - in ES modules with type:module, the script is always
// executed even when imported, so we run the function directly
runUuidTablesFix()
    .then((success) => {
    if (success) {
        console.log('UUID tables scan completed successfully with schema alignment');
    }
    else {
        console.log('UUID tables scan completed with issues');
        // Only exit with error code if running directly from command line
        if (process.argv[1]?.includes('run-uuid-tables-fix.ts')) {
            process.exit(1);
        }
    }
})
    .catch((error) => {
    console.error('Error running UUID tables fix:', error);
    // Only exit with error code if running directly from command line
    if (process.argv[1]?.includes('run-uuid-tables-fix.ts')) {
        process.exit(1);
    }
});
export { runUuidTablesFix };
