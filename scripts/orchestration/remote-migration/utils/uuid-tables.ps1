# UUID Table Handling Utility Functions
# This module provides functions for detecting and managing UUID tables created by Payload CMS

function Get-UUIDTables {
    param (
        [string]$connectionString,
        [string]$schema = "payload"
    )

    $query = @"
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '$schema'
    AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
"@

    $result = Exec-Command -command "supabase db execute --db-url=`"$connectionString`" -c `"$query`"" -description "Getting UUID tables" -captureOutput
    
    # Filter out empty lines and trim whitespace
    return $result -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
}

function Ensure-UUIDTableColumns {
    param (
        [string]$connectionString,
        [string]$schema,
        [string]$table
    )

    $query = @"
    DO \$\$
    BEGIN
        -- Check if path column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '$schema'
            AND table_name = '$table'
            AND column_name = 'path'
        ) THEN
            EXECUTE 'ALTER TABLE $schema."$table" ADD COLUMN path TEXT';
        END IF;

        -- Check if id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '$schema'
            AND table_name = '$table'
            AND column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE $schema."$table" ADD COLUMN id TEXT';
        END IF;
    END
    \$\$;
"@

    Exec-Command -command "supabase db execute --db-url=`"$connectionString`" -c `"$query`"" -description "Ensuring columns for $schema.$table"
}

function Track-UUIDTable {
    param (
        [string]$connectionString,
        [string]$schema,
        [string]$table
    )

    # Check if dynamic_uuid_tables table exists, create if not
    $createTrackerTable = @"
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = '$schema' AND table_name = 'dynamic_uuid_tables'
        ) THEN
            CREATE TABLE $schema.dynamic_uuid_tables (
                uuid_table_name TEXT PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_checked TIMESTAMPTZ DEFAULT NOW(),
                managed BOOLEAN DEFAULT TRUE
            );
        END IF;
    END
    \$\$;
"@

    Exec-Command -command "supabase db execute --db-url=`"$connectionString`" -c `"$createTrackerTable`"" -description "Creating UUID table tracker if needed"

    # Track this UUID table
    $trackTable = @"
    INSERT INTO $schema.dynamic_uuid_tables (uuid_table_name)
    VALUES ('$table')
    ON CONFLICT (uuid_table_name) 
    DO UPDATE SET last_checked = NOW();
"@

    Exec-Command -command "supabase db execute --db-url=`"$connectionString`" -c `"$trackTable`"" -description "Tracking UUID table $table"
}

function Process-UUIDTables {
    param (
        [string]$connectionString,
        [string]$schema = "payload"
    )

    Log-Phase "PROCESSING UUID TABLES"
    
    # Get all UUID tables
    $uuidTables = Get-UUIDTables -connectionString $connectionString -schema $schema
    Log-Message "Found $($uuidTables.Count) UUID tables to process" "Cyan"
    
    foreach ($table in $uuidTables) {
        Log-Step "Processing UUID table: $table"
        
        # Ensure required columns exist
        Ensure-UUIDTableColumns -connectionString $connectionString -schema $schema -table $table
        
        # Track the UUID table
        Track-UUIDTable -connectionString $connectionString -schema $schema -table $table
        
        Log-Success "Successfully processed UUID table $table"
    }

    return $uuidTables
}

function Compare-UUIDTables {
    param (
        [string]$localConnectionString,
        [string]$remoteConnectionString,
        [string]$schema = "payload"
    )

    Log-Phase "COMPARING UUID TABLES BETWEEN LOCAL AND REMOTE"
    
    # Get local and remote UUID tables
    $localUUIDTables = Get-UUIDTables -connectionString $localConnectionString -schema $schema
    $remoteUUIDTables = Get-UUIDTables -connectionString $remoteConnectionString -schema $schema
    
    # Find tables that exist in local but not in remote
    $missingInRemote = $localUUIDTables | Where-Object { $remoteUUIDTables -notcontains $_ }
    
    # Find tables that exist in remote but not in local
    $extraInRemote = $remoteUUIDTables | Where-Object { $localUUIDTables -notcontains $_ }
    
    return @{
        LocalTables = $localUUIDTables
        RemoteTables = $remoteUUIDTables
        MissingInRemote = $missingInRemote
        ExtraInRemote = $extraInRemote
        LocalCount = $localUUIDTables.Count
        RemoteCount = $remoteUUIDTables.Count
    }
}
