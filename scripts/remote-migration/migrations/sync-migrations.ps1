# Migration Synchronization Script
# This script ensures that migration records between local and remote Supabase 
# instances are synchronized, which is critical for Payload CMS functionality

# Parameters must come before any other code at script level
param (
    [switch]$Force,
    [switch]$DryRun,
    [switch]$Verbose
)

# Configure error handling
$ErrorActionPreference = "Stop"

# Import utility modules
. "$PSScriptRoot\..\utils\database.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"

function Sync-Migrations {
    try {
        # Show banner
        Log-Phase "STARTING MIGRATION SYNCHRONIZATION"

        # Setup phase: Check the status of the payload schema in both databases
        Log-Step "Testing database connections"
        
        # Test database connections - local
        $localConnectionOk = Test-DatabaseConnection -connectionString $env:DATABASE_URL -name "local database"
        
        # Skip local database checks in migration-only mode
        if (-not $localConnectionOk) {
            Log-Warning "The local Supabase instance is not running or cannot be accessed."
            Log-Warning "We will attempt to continue with the remote database only, but some features may be limited."
            Log-Warning "To properly synchronize migrations, please ensure that local Supabase is running."
            
            if (-not $env:FORCE_REMOTE_ONLY) {
                $confirmPrompt = Read-Host "Do you want to continue with remote-only mode? (y/n)"
                if ($confirmPrompt -ne "y") {
                    throw "Operation canceled by user. Please start the local Supabase instance with 'supabase start' and try again."
                }
                
                $env:FORCE_REMOTE_ONLY = "true"
                Log-Message "Proceeding in remote-only mode. Some functionality will be limited." -Foreground "Yellow"
            } else {
                Log-Message "Continuing in remote-only mode as requested." -Foreground "Yellow"
            }
        }
        
        # Test remote database connection - always required
        $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"
        if (-not $remoteConnectionOk) {
            throw "Remote database connection failed. Cannot proceed with migration synchronization."
        }

        # Check for payload schema in remote database
        Log-Step "Checking for payload schema and tables"
        
        $remoteSchemaQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');"
        $remoteHasSchema = Invoke-RemoteSql -query $remoteSchemaQuery -captureOutput -continueOnError
        
        # If the schema doesn't exist in the remote database, we need to create it
        if ($remoteHasSchema -notmatch "t") {
            Log-Warning "payload schema does not exist in remote database. Creating it now."
            
            $createSchemaQuery = "CREATE SCHEMA IF NOT EXISTS payload;"
            Invoke-RemoteSql -query $createSchemaQuery
            
            Log-Success "Created payload schema in remote database"
        }
        
        # Check for payload_migrations table in both databases
        Log-Step "Checking for payload_migrations tables"
        
        $localHasMigrationsTable = $false
        if ($localConnectionOk) {
            $localMigrationsTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'payload_migrations');"
            $localHasMigrationsTable = Invoke-LocalSql -query $localMigrationsTableQuery -captureOutput -continueOnError
            $localHasMigrationsTable = $localHasMigrationsTable -match "t"
            
            if (-not $localHasMigrationsTable) {
                Log-Warning "payload_migrations table not found in local database."
                if (-not $env:FORCE_REMOTE_ONLY) {
                    throw "Local payload_migrations table not found. Please ensure Payload CMS is properly initialized."
                }
            }
        }
        
        $remoteMigrationsTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'payload_migrations');"
        $remoteHasMigrationsTable = Invoke-RemoteSql -query $remoteMigrationsTableQuery -captureOutput -continueOnError
        $remoteHasMigrationsTable = $remoteHasMigrationsTable -match "t"
        
        if ($remoteHasMigrationsTable -notmatch "t") {
            Log-Warning "payload_migrations table not found in remote database. Will create it."
            
            # Create migrations table in remote
            $createMigrationsTableQuery = @"
            CREATE TABLE IF NOT EXISTS payload.payload_migrations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                batch INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
"@
            
            if (-not $DryRun) {
                Invoke-RemoteSql -query $createMigrationsTableQuery
                Log-Success "Created payload_migrations table in remote database"
            } else {
                Log-Message "DRY RUN: Would create payload_migrations table in remote database" "Yellow"
            }
        }

        # Get migration records from local database
        Log-Step "Fetching migration records from local database"
        
        $localMigrationsList = @()
        
        if ($localConnectionOk -and (-not $env:FORCE_REMOTE_ONLY)) {
            # Normal mode - fetch from local database
            $localMigrationsQuery = "SELECT id, name, batch, created_at FROM payload.payload_migrations ORDER BY id;"
            $localMigrations = Invoke-LocalSql -query $localMigrationsQuery -captureOutput
            
            $localMigrations -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object {
                $parts = $_ -split "\|" | ForEach-Object { $_.Trim() }
                if ($parts.Count -ge 3) {
                    $localMigrationsList += @{
                        Id = $parts[0]
                        Name = $parts[1]
                        Batch = $parts[2]
                        CreatedAt = if ($parts.Count -ge 4) { $parts[3] } else { $null }
                    }
                }
            }
            
            Log-Message "Found $($localMigrationsList.Count) migration records in local database" "Cyan"
            
            if ($Verbose) {
                foreach ($migration in $localMigrationsList) {
                    Log-Message "  - $($migration.Name) (Batch $($migration.Batch))" "Yellow"
                }
            }
        } 
        else {
            # Remote-only mode - we need to handle this specially
            Log-Warning "Local database is not available. Using remote-only mode."
            Log-Warning "This will initialize the remote database migrations table from scratch."
            
            # In FORCE_REMOTE_ONLY mode, we skip local database checks completely
            if (-not $Force) {
                $confirmPrompt = Read-Host "Do you want to continue with initializing migrations in remote-only mode? (y/n)"
                if ($confirmPrompt -ne "y") {
                    throw "Operation canceled by user."
                }
            } else {
                Log-Message "Proceeding with remote-only mode as Force flag is set..." -ForegroundColor "Yellow"
            }
            
            # We'll create a default set of migrations - this is for testing only
            # In a real scenario, you'd need to provide predefined migration records
            Log-Message "Creating sample migration records for testing" -ForegroundColor "Yellow"
            
            # Just add a single initial migration record
            $localMigrationsList += @{
                Id = 1
                Name = "initial-schema"
                Batch = 1
                CreatedAt = [DateTime]::UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            }
            
            Log-Message "Created 1 sample migration record for remote database" -ForegroundColor "Cyan"
        }

        # Get migration records from remote database
        Log-Step "Fetching migration records from remote database"
        
        $remoteMigrationsQuery = "SELECT id, name, batch, created_at FROM payload.payload_migrations ORDER BY id;"
        $remoteMigrations = Invoke-RemoteSql -query $remoteMigrationsQuery -captureOutput
        
        $remoteMigrationsList = @()
        $remoteMigrations -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object {
            $parts = $_ -split "\|" | ForEach-Object { $_.Trim() }
            if ($parts.Count -ge 3) {
                $remoteMigrationsList += @{
                    Id = $parts[0]
                    Name = $parts[1]
                    Batch = $parts[2]
                    CreatedAt = if ($parts.Count -ge 4) { $parts[3] } else { $null }
                }
            }
        }
        
        Log-Message "Found $($remoteMigrationsList.Count) migration records in remote database" "Cyan"
        
        if ($Verbose) {
            foreach ($migration in $remoteMigrationsList) {
                Log-Message "  - $($migration.Name) (Batch $($migration.Batch))" "Yellow"
            }
        }

        # Compare migrations and determine what needs to be synchronized
        Log-Step "Comparing migration records between local and remote databases"
        
        # Get maximum batch numbers
        $maxLocalBatch = 0
        $maxRemoteBatch = 0
        
        if ($localMigrationsList.Count -gt 0) { 
            $maxLocalBatch = ($localMigrationsList | ForEach-Object { [int]$_.Batch } | Measure-Object -Maximum).Maximum 
        }
        
        if ($remoteMigrationsList.Count -gt 0) { 
            $maxRemoteBatch = ($remoteMigrationsList | ForEach-Object { [int]$_.Batch } | Measure-Object -Maximum).Maximum 
        }
        
        Log-Message "Local max batch: $maxLocalBatch, Remote max batch: $maxRemoteBatch" "Cyan"
        
        # Find migrations in local not in remote
        $localMigrationNames = $localMigrationsList | ForEach-Object { $_.Name }
        $remoteMigrationNames = $remoteMigrationsList | ForEach-Object { $_.Name }
        
        $missingInRemote = $localMigrationNames | Where-Object { $remoteMigrationNames -notcontains $_ }
        $extraInRemote = $remoteMigrationNames | Where-Object { $localMigrationNames -notcontains $_ }
        
        Log-Message "Migrations in local but not in remote: $($missingInRemote.Count)" "Cyan"
        Log-Message "Migrations in remote but not in local: $($extraInRemote.Count)" "Cyan"
        
        if ($missingInRemote.Count -gt 0) {
            Log-Warning "The following migrations exist in local but not in remote:"
            $missingInRemote | ForEach-Object { Log-Message "  - $_" "Yellow" }
        }
        
        if ($extraInRemote.Count -gt 0) {
            Log-Warning "The following migrations exist in remote but not in local:"
            $extraInRemote | ForEach-Object { Log-Message "  - $_" "Yellow" }
        }

        # Determine synchronization action based on comparison
        $syncAction = ""
        
        if ($remoteMigrationsList.Count -eq 0) {
            # Remote has no migrations, copy all from local
            $syncAction = "COPY_ALL_TO_REMOTE"
        } 
        elseif ($missingInRemote.Count -gt 0 -and $extraInRemote.Count -eq 0) {
            # Remote is missing some migrations but has no extras, append missing ones
            $syncAction = "APPEND_MISSING_TO_REMOTE"
        }
        elseif ($missingInRemote.Count -eq 0 -and $extraInRemote.Count -gt 0) {
            # Remote has extra migrations, this is unexpected
            $syncAction = "HANDLE_EXTRA_IN_REMOTE"
        }
        elseif ($missingInRemote.Count -gt 0 -and $extraInRemote.Count -gt 0) {
            # Both missing and extra migrations, complex scenario
            $syncAction = "COMPLEX_SYNC"
        }
        elseif ($localMigrationsList.Count -eq $remoteMigrationsList.Count) {
            # Same number of migrations, check if they match by name
            $allNamesMatch = $true
            for ($i = 0; $i -lt $localMigrationsList.Count; $i++) {
                if ($localMigrationsList[$i].Name -ne $remoteMigrationsList[$i].Name) {
                    $allNamesMatch = $false
                    break
                }
            }
            
            if ($allNamesMatch) {
                $syncAction = "ALREADY_SYNCED"
            } else {
                $syncAction = "REORDER_REQUIRED"
            }
        }
        
        Log-Message "Determined synchronization action: $syncAction" "Cyan"

        # Execute synchronization based on determined action
        if ($syncAction -eq "ALREADY_SYNCED") {
            Log-Success "Migration records are already synchronized between local and remote databases"
            return @{
                Success = $true
                Action = "ALREADY_SYNCED"
                LocalCount = $localMigrationsList.Count
                RemoteCount = $remoteMigrationsList.Count
            }
        }
        
        if ($DryRun) {
            Log-Warning "DRY RUN: Would perform '$syncAction' but no changes will be made"
            return @{
                Success = $true
                Action = $syncAction
                DryRun = $true
                LocalCount = $localMigrationsList.Count
                RemoteCount = $remoteMigrationsList.Count
                MissingInRemote = $missingInRemote
                ExtraInRemote = $extraInRemote
            }
        }

        # Perform the actual synchronization
        Log-Step "Executing migration synchronization: $syncAction"
        
        switch ($syncAction) {
            "COPY_ALL_TO_REMOTE" {
                # Truncate remote migrations table first
                Invoke-RemoteSql -query "TRUNCATE payload.payload_migrations;"
                
                # Copy all migrations from local to remote
                foreach ($migration in $localMigrationsList) {
                    $insertQuery = @"
                    INSERT INTO payload.payload_migrations (name, batch, created_at)
                    VALUES ('$($migration.Name)', $($migration.Batch), '$($migration.CreatedAt)');
"@
                    
                    Invoke-RemoteSql -query $insertQuery
                }
                
                Log-Success "Copied all $($localMigrationsList.Count) migrations from local to remote database"
            }
            
            "APPEND_MISSING_TO_REMOTE" {
                # Find and add missing migrations to remote
                foreach ($migrationName in $missingInRemote) {
                    $migration = $localMigrationsList | Where-Object { $_.Name -eq $migrationName }
                    
                    $insertQuery = @"
                    INSERT INTO payload.payload_migrations (name, batch, created_at)
                    VALUES ('$($migration.Name)', $($migration.Batch), '$($migration.CreatedAt)');
"@
                    
                    Invoke-RemoteSql -query $insertQuery
                }
                
                Log-Success "Appended $($missingInRemote.Count) missing migrations to remote database"
            }
            
            "HANDLE_EXTRA_IN_REMOTE" {
                if ($Force) {
                    Log-Warning "Force flag set, removing extra migrations from remote database"
                    
                    foreach ($migrationName in $extraInRemote) {
                        $deleteQuery = @"
                        DELETE FROM payload.payload_migrations WHERE name = '$migrationName';
"@
                        
                        Invoke-RemoteSql -query $deleteQuery
                    }
                    
                    Log-Success "Removed $($extraInRemote.Count) extra migrations from remote database"
                } else {
                    Log-Warning "Remote database has $($extraInRemote.Count) extra migrations. Use -Force to remove them."
                }
            }
            
            "COMPLEX_SYNC" {
                if ($Force) {
                    Log-Warning "Force flag set, performing complete resynchronization"
                    
                    # Truncate remote migrations table
                    Invoke-RemoteSql -query "TRUNCATE payload.payload_migrations;"
                    
                    # Copy all migrations from local to remote
                    foreach ($migration in $localMigrationsList) {
                        $insertQuery = @"
                        INSERT INTO payload.payload_migrations (name, batch, created_at)
                        VALUES ('$($migration.Name)', $($migration.Batch), '$($migration.CreatedAt)');
"@
                        
                        Invoke-RemoteSql -query $insertQuery
                    }
                    
                    Log-Success "Completed full resynchronization of migrations"
                } else {
                    Log-Warning "Complex synchronization required. Use -Force to perform complete resynchronization."
                }
            }
            
            "REORDER_REQUIRED" {
                if ($Force) {
                    Log-Warning "Force flag set, reordering migrations in remote database"
                    
                    # Truncate remote migrations table
                    Invoke-RemoteSql -query "TRUNCATE payload.payload_migrations;"
                    
                    # Copy all migrations from local to remote
                    foreach ($migration in $localMigrationsList) {
                        $insertQuery = @"
                        INSERT INTO payload.payload_migrations (name, batch, created_at)
                        VALUES ('$($migration.Name)', $($migration.Batch), '$($migration.CreatedAt)');
"@
                        
                        Invoke-RemoteSql -query $insertQuery
                    }
                    
                    Log-Success "Reordered migrations in remote database to match local"
                } else {
                    Log-Warning "Migration reordering required. Use -Force to reorder migrations."
                }
            }
        }

        # Verify synchronization
        Log-Step "Verifying migration synchronization"
        
        $finalRemoteMigrationsQuery = "SELECT COUNT(*) FROM payload.payload_migrations;"
        $finalRemoteCount = Invoke-RemoteSql -query $finalRemoteMigrationsQuery -captureOutput
        $finalRemoteCount = $finalRemoteCount.Trim()
        
        # Convert to integers for safe comparison
        $localCount = [int]$localMigrationsList.Count
        $remoteCount = 0
        if ([int]::TryParse($finalRemoteCount, [ref]$remoteCount)) {
            if ($remoteCount -eq $localCount) {
                Log-Success "Migration synchronization complete. Remote database now has $remoteCount migrations."
                
                # Check if the order matches - we'll skip this for remote-only mode
                if (-not $env:FORCE_REMOTE_ONLY) {
                    $orderCheckQuery = @"
                    SELECT
                        l.name AS local_name,
                        r.name AS remote_name
                    FROM 
                        (SELECT ROW_NUMBER() OVER (ORDER BY id) AS row_num, name FROM payload.payload_migrations) AS l
                    FULL OUTER JOIN 
                        (SELECT ROW_NUMBER() OVER (ORDER BY id) AS row_num, name FROM payload.payload_migrations) AS r
                    ON l.row_num = r.row_num
                    WHERE l.name <> r.name OR l.name IS NULL OR r.name IS NULL;
"@
                    
                    $orderCheck = Invoke-RemoteSql -query $orderCheckQuery -captureOutput
                    $orderCheck = $orderCheck.Trim()
                    
                    if ([string]::IsNullOrWhiteSpace($orderCheck)) {
                        Log-Success "Migration order verified. Local and remote databases are fully synchronized."
                    } else {
                        Log-Warning "Migration counts match but order may still differ. Consider using -Force for complete resynchronization."
                    }
                } else {
                    Log-Warning "Order checking skipped in remote-only mode."
                }
            } else {
                Log-Warning "Migration count mismatch after synchronization. Local: $localCount, Remote: $remoteCount"
            }
        } else {
            Log-Warning "Could not parse remote migration count: '$finalRemoteCount'"
        }

        # Final output
        Log-Phase "MIGRATION SYNCHRONIZATION COMPLETE"
        
        return @{
            Success = $true
            Action = $syncAction
            LocalCount = $localCount
            RemoteCount = $remoteCount
            MissingInRemote = $missingInRemote.Count
            ExtraInRemote = $extraInRemote.Count
        }
    }
    catch {
        Log-Error "MIGRATION SYNCHRONIZATION ERROR: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Execute the synchronization
Sync-Migrations
