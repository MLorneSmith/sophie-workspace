# UUID Table Management Script for Remote Supabase
# This script creates and maintains UUID pattern tables in the remote database
# UUID tables are dynamically created by Payload CMS for relationship management

# Import remote config to get the database URL
. "$PSScriptRoot\..\utils\remote-config.ps1"

Write-Host "Starting UUID table management for remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

try {
    # First, check if psql is available
    try {
        $psqlVersion = & psql --version 2>&1
        Write-Host "  Using psql: $psqlVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: psql is not installed or not in your PATH" -ForegroundColor Red
        Write-Host "  Please install PostgreSQL client tools or add them to your PATH" -ForegroundColor Red
        throw "psql not found"
    }
    
    # First, go to the web directory where supabase config exists
    Push-Location -Path "apps/web"
    
    Write-Host "`nStep 1: Creating UUID table tracking system..." -ForegroundColor Yellow
    
    # First, create the tracking table if it doesn't exist
    $setupTrackingTableSQL = @'
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
'@
    
    # Create a temp file for the SQL
    $tempFile = Join-Path -Path $env:TEMP -ChildPath "uuid_tracking_table.sql"
    Set-Content -Path $tempFile -Value $setupTrackingTableSQL
    
    Write-Host "  Creating UUID table tracking table..." -ForegroundColor Gray
    $trackingTableResult = & psql "$env:REMOTE_DATABASE_URL" -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ UUID table tracking system created or verified" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to create UUID table tracking system" -ForegroundColor Red
        Write-Host "    Error: $trackingTableResult" -ForegroundColor Red
        throw "Failed to create UUID table tracking system"
    }
    
    # Step 2: Create a function to fix UUID tables
    Write-Host "`nStep 2: Creating helper function for UUID tables..." -ForegroundColor Yellow
    
    $helperFunctionSQL = @'
CREATE OR REPLACE FUNCTION payload.ensure_uuid_table_columns(table_name text)
RETURNS void AS $$
BEGIN
    -- Add path column if it doesn't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_name);
    
    -- Add id column if it doesn't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS id TEXT', table_name);
END;
$$ LANGUAGE plpgsql;
'@
    
    # Create a temp file for the helper function
    $helperFunctionFile = Join-Path -Path $env:TEMP -ChildPath "uuid_helper_function.sql"
    Set-Content -Path $helperFunctionFile -Value $helperFunctionSQL
    
    Write-Host "  Creating UUID table helper function..." -ForegroundColor Gray
    $helperResult = & psql "$env:REMOTE_DATABASE_URL" -f $helperFunctionFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Created UUID table helper function" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to create UUID table helper function" -ForegroundColor Red
        Write-Host "    Error: $helperResult" -ForegroundColor Red
    }
    
    # Step 3: Scan for and fix existing UUID tables
    Write-Host "`nStep 3: Scanning for existing UUID pattern tables..." -ForegroundColor Yellow
    
    $scanUUIDTablesSQL = @'
DO $$
DECLARE
    r RECORD;
    uuid_pattern TEXT := E'^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
    tables_found INTEGER := 0;
BEGIN
    -- Scan for tables matching UUID pattern
    FOR r IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name ~ uuid_pattern
    LOOP
        tables_found := tables_found + 1;
        
        -- Insert into tracking table if it doesn't exist
        INSERT INTO payload.dynamic_uuid_tables (table_name)
        VALUES (r.table_name)
        ON CONFLICT (table_name) DO NOTHING;

        -- Ensure the table has the required columns
        PERFORM payload.ensure_uuid_table_columns(r.table_name);
    END LOOP;
    
    RAISE NOTICE 'Processed % UUID pattern tables', tables_found;
END;
$$;
'@
    
    # Create a temp file for the scan function
    $scanFile = Join-Path -Path $env:TEMP -ChildPath "scan_uuid_tables.sql"
    Set-Content -Path $scanFile -Value $scanUUIDTablesSQL
    
    Write-Host "  Scanning and fixing UUID tables..." -ForegroundColor Gray
    $scanResult = & psql "$env:REMOTE_DATABASE_URL" -f $scanFile 2>&1
    
    # Check for success based on exit code
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Successfully scanned and fixed UUID tables" -ForegroundColor Green
        # Try to extract the number of tables processed
        $match = $scanResult | Select-String -Pattern "Processed (\d+) UUID pattern tables" -AllMatches
        if ($match.Matches.Count -gt 0 -and $match.Matches[0].Groups.Count -gt 1) {
            $tablesCount = $match.Matches[0].Groups[1].Value
            Write-Host "    Processed $tablesCount UUID pattern tables" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ Failed to scan and fix UUID tables" -ForegroundColor Red
        Write-Host "    Error: $scanResult" -ForegroundColor Red
    }
    
    # Step 4: Create the UUID table monitor function
    Write-Host "`nStep 4: Creating UUID table monitor trigger..." -ForegroundColor Yellow
    
    $monitorFunctionSQL = @'
-- Create the monitoring function
CREATE OR REPLACE FUNCTION payload.monitor_uuid_tables()
RETURNS event_trigger AS $$
DECLARE
    obj RECORD;
    uuid_pattern TEXT := E'^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
    table_name TEXT;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
        -- Check if this is a CREATE TABLE in the payload schema with a UUID pattern name
        IF obj.command_tag = 'CREATE TABLE' AND 
           obj.schema_name = 'payload' AND
           obj.object_identity ~ uuid_pattern THEN
            
            -- Extract just the table name from the object_identity
            table_name := regexp_replace(obj.object_identity, E'payload\\.', '');
            
            -- Register in our tracking table
            INSERT INTO payload.dynamic_uuid_tables (table_name)
            VALUES (table_name)
            ON CONFLICT (table_name) DO NOTHING;
            
            -- Add required columns using our helper function
            PERFORM payload.ensure_uuid_table_columns(table_name);
            
            RAISE NOTICE 'Automatically registered and fixed UUID table: %', table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop the event trigger if it exists
DROP EVENT TRIGGER IF EXISTS payload_uuid_table_monitor;

-- Create the event trigger
CREATE EVENT TRIGGER payload_uuid_table_monitor 
ON ddl_command_end
WHEN tag IN ('CREATE TABLE')
EXECUTE FUNCTION payload.monitor_uuid_tables();
'@
    
    # Create a temp file for the monitor function
    $monitorFile = Join-Path -Path $env:TEMP -ChildPath "uuid_monitor_function.sql"
    Set-Content -Path $monitorFile -Value $monitorFunctionSQL
    
    Write-Host "  Creating UUID table monitor function..." -ForegroundColor Gray
    $monitorResult = & psql "$env:REMOTE_DATABASE_URL" -f $monitorFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Created UUID table monitor function and trigger" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Warning: Could not create UUID table monitor" -ForegroundColor Yellow
        Write-Host "    Error: $monitorResult" -ForegroundColor Yellow
        Write-Host "    New UUID tables will need to be manually fixed" -ForegroundColor Yellow
    }
    
    # Clean up temp files
    Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $helperFunctionFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $scanFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $monitorFile -Force -ErrorAction SilentlyContinue
    
    # Return to original directory
    Pop-Location
    
    # Final status report
    Write-Host "`nUUID table management completed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    
    # Return to original directory if needed
    if ((Get-Location).Path -match "apps/web") {
        Pop-Location
    }
    
    # Provide troubleshooting steps
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host " - Check that psql is installed and in your PATH" -ForegroundColor Yellow
    Write-Host " - Verify the remote database connection string" -ForegroundColor Yellow
    Write-Host " - Ensure you have permissions to create tables and functions" -ForegroundColor Yellow
    
    exit 1
}
