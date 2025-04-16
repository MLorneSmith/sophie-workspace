# UUID Table Management Script for Remote Supabase (Using Supabase CLI)
# This script creates and maintains UUID pattern tables in the remote database
# UUID tables are dynamically created by Payload CMS for relationship management

# Import remote config to get the database URL
. "$PSScriptRoot\..\utils\remote-config.ps1"

Write-Host "Starting UUID table management for remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

try {
    # First, go to the web directory where supabase config exists
    Push-Location -Path "apps/web"
    
    Write-Host "`nStep 1: Creating UUID table tracking system..." -ForegroundColor Yellow
    
    # Create a temporary SQL file with our commands
    $uuidSetupDir = Join-Path -Path $env:TEMP -ChildPath "uuid_tables_setup"
    New-Item -ItemType Directory -Path $uuidSetupDir -Force | Out-Null
    
    $setupTrackingTableSQL = @'
-- Create tracking table
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create helper function for adding columns to UUID tables
CREATE OR REPLACE FUNCTION payload.ensure_uuid_table_columns(table_name text)
RETURNS void AS $$
BEGIN
    -- Add path column if it doesn't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_name);
    
    -- Add id column if it doesn't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS id TEXT', table_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to scan and fix existing UUID tables
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
    
    # Create setup seed file for tracking table
    $seedDir = "supabase/seed"
    if (-not (Test-Path $seedDir)) {
        New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
    }
    
    $setupFile = Join-Path -Path $seedDir -ChildPath "uuid_setup.sql"
    Set-Content -Path $setupFile -Value $setupTrackingTableSQL -Encoding UTF8
    
    # Apply the setup script using Supabase CLI
    Write-Host "  Creating UUID table management system using Supabase CLI..." -ForegroundColor Yellow
    Write-Host "  Running supabase db push with include-seed..." -ForegroundColor Gray
    
    $pushResult = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-seed 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ UUID table management system created successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to create UUID table management system" -ForegroundColor Red
        Write-Host "  Error: $pushResult" -ForegroundColor Red
        
        # Try an alternative approach - creating just the tracking table
        Write-Host "`n  Trying alternative approach..." -ForegroundColor Yellow
        
        # Create a simplified version just to create the tracking table
        $simpleSetupSQL = @'
-- Create tracking table only
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
'@
        
        $simpleSetupFile = Join-Path -Path $seedDir -ChildPath "uuid_simple_setup.sql"
        Set-Content -Path $simpleSetupFile -Value $simpleSetupSQL -Encoding UTF8
        
        Write-Host "  Running simplified setup..." -ForegroundColor Yellow
        $simplePushResult = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-seed 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Basic UUID tracking table created" -ForegroundColor Green
            Write-Host "  Note: Advanced UUID table features not available" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Simple setup failed as well" -ForegroundColor Red
            Write-Host "  Error: $simplePushResult" -ForegroundColor Red
            throw "Failed to set up UUID table management"
        }
    }
    
    # Provide verification
    Write-Host "`nStep 2: Verifying UUID table setup..." -ForegroundColor Yellow
    
    # Run a diff to see if the schema exists properly
    Write-Host "  Running db diff to verify setup..." -ForegroundColor Gray
    $diffResult = & supabase db diff --db-url="$env:REMOTE_DATABASE_URL" --schema payload 2>&1
    
    # Check for mentions of dynamic_uuid_tables
    if ($diffResult -match "dynamic_uuid_tables") {
        Write-Host "  ✓ UUID tracking table exists in remote database" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Could not confirm UUID tracking table exists" -ForegroundColor Yellow
        Write-Host "  This may need manual verification" -ForegroundColor Yellow
    }
    
    # Clean up seed files
    Remove-Item -Path $setupFile -Force -ErrorAction SilentlyContinue
    if (Test-Path $simpleSetupFile) {
        Remove-Item -Path $simpleSetupFile -Force -ErrorAction SilentlyContinue
    }
    
    # Return to original directory
    Pop-Location
    
    # Final status report
    Write-Host "`nUUID table management setup completed" -ForegroundColor Green
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    
    # Return to original directory if needed
    if ((Get-Location).Path -match "apps/web") {
        Pop-Location
    }
    
    # Provide troubleshooting steps
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host " - Verify the remote database connection string" -ForegroundColor Yellow
    Write-Host " - Check that the Supabase CLI is working properly" -ForegroundColor Yellow
    Write-Host " - Ensure you have permissions to create tables and functions" -ForegroundColor Yellow
    
    exit 1
}
