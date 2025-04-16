# UUID Tables Setup Script
# This script detects, manages, and sets up UUID tables which are dynamically created
# by Payload CMS for managing relationships between content types

# Import utility modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\uuid-tables.ps1"

# Parameters
param (
    [switch]$LocalOnly,
    [switch]$RemoteOnly,
    [switch]$SkipVerification,
    [switch]$Force,
    [switch]$Verbose
)

# Configure error handling
$ErrorActionPreference = "Stop"

function Setup-UUIDTables {
    try {
        # Show banner
        Log-Phase "STARTING UUID TABLES SETUP"

        # Test database connections
        Log-Step "Testing database connections"
        $localConnectionOk = Test-DatabaseConnection -connectionString $env:DATABASE_URL -name "local database"
        $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"

        if (-not $localConnectionOk -or -not $remoteConnectionOk) {
            throw "Database connection issues detected. Cannot proceed with UUID tables setup."
        }

        # Create tracking table in remote database if it doesn't exist
        if (-not $LocalOnly) {
            Log-Step "Setting up UUID tables tracking in remote database"
            
            $createTrackerTableQuery = @"
            DO `$`$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'payload' AND table_name = 'dynamic_uuid_tables'
                ) THEN
                    CREATE TABLE payload.dynamic_uuid_tables (
                        uuid_table_name TEXT PRIMARY KEY,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        last_checked TIMESTAMPTZ DEFAULT NOW(),
                        managed BOOLEAN DEFAULT TRUE
                    );
                END IF;
            END
            `$`$;
"@
            
            Invoke-RemoteSql -query $createTrackerTableQuery
            Log-Success "UUID tables tracking table created or verified in remote database"
        }

        # Process UUID tables in local database
        if (-not $RemoteOnly) {
            Log-Step "Identifying UUID tables in local database"
            $localUUIDTables = Get-UUIDTables -connectionString $env:DATABASE_URL -schema "payload"
            
            Log-Message "Found $($localUUIDTables.Count) UUID tables in local database" "Cyan"
            
            if ($Verbose) {
                foreach ($table in $localUUIDTables) {
                    Log-Message "  - $table" "Yellow"
                }
            }
        }

        # Process UUID tables in remote database
        if (-not $LocalOnly) {
            Log-Step "Identifying UUID tables in remote database"
            $remoteUUIDTables = Get-UUIDTables -connectionString $env:REMOTE_DATABASE_URL -schema "payload"
            
            Log-Message "Found $($remoteUUIDTables.Count) UUID tables in remote database" "Cyan"
            
            if ($Verbose) {
                foreach ($table in $remoteUUIDTables) {
                    Log-Message "  - $table" "Yellow"
                }
            }
            
            # Process each UUID table in remote to ensure it has required columns
            Log-Step "Ensuring required columns exist in remote UUID tables"
            
            foreach ($table in $remoteUUIDTables) {
                Log-Message "Processing UUID table: $table" "Yellow"
                
                # Ensure table has required columns
                Ensure-UUIDTableColumns -connectionString $env:REMOTE_DATABASE_URL -schema "payload" -table $table
                
                # Track the UUID table
                Track-UUIDTable -connectionString $env:REMOTE_DATABASE_URL -schema "payload" -table $table
            }
            
            Log-Success "Remote UUID tables processed and validated"
        }

        # Compare local and remote UUID tables if both databases are being processed
        if (-not $LocalOnly -and -not $RemoteOnly) {
            Log-Step "Comparing UUID tables between local and remote databases"
            
            # Find tables that exist in local but not in remote
            $missingInRemote = $localUUIDTables | Where-Object { $remoteUUIDTables -notcontains $_ }
            
            # Find tables that exist in remote but not in local
            $extraInRemote = $remoteUUIDTables | Where-Object { $localUUIDTables -notcontains $_ }
            
            if ($missingInRemote.Count -gt 0) {
                Log-Warning "The following UUID tables exist in local but not in remote: $($missingInRemote -join ', ')"
                
                if ($Force) {
                    Log-Message "Force flag set, creating missing UUID tables in remote..." "Yellow"
                    
                    foreach ($table in $missingInRemote) {
                        Log-Message "Creating UUID table $table in remote database" "Yellow"
                        
                        # Create the table in remote database
                        $createTableQuery = @"
                        CREATE TABLE IF NOT EXISTS payload."$table" (
                            id TEXT,
                            path TEXT,
                            order INTEGER,
                            parent_id TEXT,
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
                        );
"@
                        
                        Invoke-RemoteSql -query $createTableQuery
                        
                        # Track the UUID table
                        Track-UUIDTable -connectionString $env:REMOTE_DATABASE_URL -schema "payload" -table $table
                    }
                    
                    Log-Success "Created missing UUID tables in remote database"
                }
            } else {
                Log-Success "All local UUID tables exist in remote database"
            }
            
            if ($extraInRemote.Count -gt 0) {
                Log-Warning "The following UUID tables exist in remote but not in local: $($extraInRemote -join ', ')"
                
                if ($Force) {
                    Log-Warning "Force flag set, but not removing extra UUID tables from remote to avoid data loss"
                }
            } else {
                Log-Success "No extra UUID tables in remote database"
            }
        }

        # Verification of UUID table structures
        if (-not $SkipVerification) {
            Log-Step "Verifying UUID table structures"
            
            # Get all UUID tables from remote
            $uuidTables = Get-UUIDTables -connectionString $env:REMOTE_DATABASE_URL -schema "payload"
            $verificationErrors = 0
            
            foreach ($table in $uuidTables) {
                # Check if table has the required columns
                $columnsQuery = @"
                SELECT 
                    column_name, 
                    data_type 
                FROM 
                    information_schema.columns 
                WHERE 
                    table_schema = 'payload' 
                    AND table_name = '$table'
                ORDER BY 
                    ordinal_position;
"@
                
                $columns = Invoke-RemoteSql -query $columnsQuery -captureOutput
                $columnsList = $columns -split "`n" | Where-Object { $_ -match '\S' }
                
                if (-not ($columnsList -match "path")) {
                    Log-Warning "UUID table $table is missing 'path' column"
                    $verificationErrors++
                }
                
                if (-not ($columnsList -match "id")) {
                    Log-Warning "UUID table $table is missing 'id' column"
                    $verificationErrors++
                }
            }
            
            if ($verificationErrors -eq 0) {
                Log-Success "All UUID tables have required columns"
            } else {
                Log-Warning "Found $verificationErrors column issues in UUID tables"
            }
        }

        # Verification of tracking table
        if (-not $SkipVerification -and -not $LocalOnly) {
            Log-Step "Verifying UUID tracking table"
            
            $trackedCountQuery = "SELECT COUNT(*) FROM payload.dynamic_uuid_tables;"
            $trackedCount = Invoke-RemoteSql -query $trackedCountQuery -captureOutput
            $trackedCount = $trackedCount.Trim()
            
            $uuidTableCount = $remoteUUIDTables.Count
            
            Log-Message "UUID tables in remote: $uuidTableCount, Tracked tables: $trackedCount" "Cyan"
            
            if ($trackedCount -eq $uuidTableCount) {
                Log-Success "All UUID tables are properly tracked"
            } else {
                Log-Warning "UUID tracking table has $trackedCount entries, but found $uuidTableCount UUID tables"
                
                if ($Force) {
                    Log-Message "Force flag set, synchronizing tracking table..." "Yellow"
                    
                    $syncQuery = @"
                    TRUNCATE payload.dynamic_uuid_tables;
"@
                    
                    Invoke-RemoteSql -query $syncQuery
                    
                    foreach ($table in $remoteUUIDTables) {
                        Track-UUIDTable -connectionString $env:REMOTE_DATABASE_URL -schema "payload" -table $table
                    }
                    
                    Log-Success "Tracking table synchronized"
                }
            }
        }

        # Final output
        Log-Phase "UUID TABLES SETUP COMPLETE"
        Log-Success "UUID table management setup completed successfully"
        
        return @{
            Success = $true
            LocalUUIDTables = $localUUIDTables
            RemoteUUIDTables = $remoteUUIDTables
            MissingInRemote = $missingInRemote
            ExtraInRemote = $extraInRemote
        }
    }
    catch {
        Log-Error "UUID TABLES SETUP ERROR: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Execute the setup
Setup-UUIDTables
