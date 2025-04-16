# Enhanced Data Transfer Functions
# Provides utilities for transferring data between databases using both
# direct SQL and Supabase CLI approaches for maximum reliability

# Get table row count from any database
function Get-TableRowCount {
    param (
        [string]$connectionString,
        [string]$tableFullName
    )

    $query = "SELECT COUNT(*) FROM $tableFullName;"
    
    if ($connectionString -match "localhost") {
        $result = Invoke-LocalSql -query $query -captureOutput -continueOnError
    } else {
        $result = Invoke-RemoteSql -query $query -captureOutput -continueOnError
    }
    
    # Extract just the number from the output
    if ($result -match '\d+') {
        return [int]$Matches[0]
    }
    
    return 0
}

# Compare table counts between local and remote
function Compare-TableCounts {
    param (
        [string]$schema,
        [string]$table,
        [switch]$verbose
    )

    $localCount = Get-TableRowCount -connectionString $env:DATABASE_URL -tableFullName "$schema.$table"
    $remoteCount = Get-TableRowCount -connectionString $env:REMOTE_DATABASE_URL -tableFullName "$schema.$table"

    if ($verbose) {
        Log-Message "Table ${schema}.${table}: Local=${localCount}, Remote=${remoteCount}" "Cyan"
    }

    return @{
        LocalCount = $localCount
        RemoteCount = $remoteCount
        Match = ($localCount -eq $remoteCount)
        TableName = $table
        Schema = $schema
    }
}

# Export table data using psql (direct approach)
function Get-LocalTableData {
    param (
        [string]$schema,
        [string]$table,
        [string]$outputDir = "$env:TEMP\data_migration"
    )

    # Create output directory if it doesn't exist
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }

    $tempFile = Join-Path -Path $outputDir -ChildPath "${schema}_${table}.csv"

    # Use local database URL from environment
    $localDbUrl = $env:DATABASE_URL

    # Check if table exists and has data
    $query = "SELECT COUNT(*) FROM $schema.$table;"
    $count = Invoke-LocalSql -query $query -captureOutput -continueOnError
    
    if ($count -match '\d+' -and [int]$Matches[0] -eq 0) {
        Log-Warning "Table $schema.$table has no rows to export"
        return $null
    }

    # Export data directly using psql COPY command
    try {
        # Create a PowerShell command to execute psql and redirect output
        $psqlCommand = "psql `"$localDbUrl`" -c `"COPY $schema.$table TO STDOUT WITH CSV HEADER`" > `"$tempFile`""
        Invoke-Expression $psqlCommand
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $tempFile)) {
            Log-Success "Exported data for $schema.$table to $tempFile"
            return $tempFile
        } else {
            Log-Warning "PSQL export failed, trying Supabase CLI approach"
            return Export-TableDataWithSupabase -schema $schema -table $table -outputDir $outputDir
        }
    }
    catch {
        Log-Warning "PSQL error: $($_.Exception.Message). Trying Supabase CLI approach instead."
        return Export-TableDataWithSupabase -schema $schema -table $table -outputDir $outputDir
    }
}

# Export table data using Supabase CLI (fallback approach)
function Export-TableDataWithSupabase {
    param (
        [string]$schema,
        [string]$table,
        [string]$outputDir = "$env:TEMP\data_migration"
    )

    # Create output directory if it doesn't exist
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }

    $outputFile = Join-Path -Path $outputDir -ChildPath "${schema}_${table}_data.sql"

    # Use Supabase CLI to dump data-only for this table
    try {
        Log-Message "Exporting data from $schema.$table using Supabase CLI" "Yellow"
        $command = "supabase db dump --data-only --schema $schema --table `"$schema.$table`" -f `"$outputFile`""
        Invoke-Expression $command

        if (Test-Path $outputFile) {
            Log-Success "Exported data for $schema.$table to $outputFile using Supabase CLI"
            return $outputFile
        } else {
            Log-Error "Failed to export data for $schema.$table using Supabase CLI"
            return $null
        }
    }
    catch {
        Log-Error "Supabase CLI export error: $($_.Exception.Message)"
        return $null
    }
}

# Import table data to remote database using psql
function Import-RemoteTableData {
    param (
        [string]$schema,
        [string]$table,
        [string]$dataFile,
        [switch]$skipTruncate
    )

    if (-not (Test-Path $dataFile)) {
        Log-Error "Data file not found: $dataFile"
        return $false
    }

    # Use remote database URL from environment
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # Determine file type (CSV or SQL)
    $fileExtension = [System.IO.Path]::GetExtension($dataFile).ToLower()
    
    try {
        # First truncate the table to avoid conflicts (unless explicitly skipped)
        if (-not $skipTruncate) {
            Log-Message "Truncating remote $schema.$table" "Yellow"
            $truncateQuery = "TRUNCATE $schema.$table CASCADE;"
            $result = Invoke-RemoteSql -query $truncateQuery -continueOnError
            
            if ($LASTEXITCODE -ne 0) {
                Log-Warning "Failed to truncate with CASCADE, trying without CASCADE..."
                $truncateQuery2 = "TRUNCATE $schema.$table;"
                $result2 = Invoke-RemoteSql -query $truncateQuery2 -continueOnError
                
                if ($LASTEXITCODE -ne 0) {
                    Log-Warning "Truncate failed, will attempt to DELETE instead..."
                    $deleteQuery = "DELETE FROM $schema.$table;"
                    $result3 = Invoke-RemoteSql -query $deleteQuery -continueOnError
                }
            }
        }

        # Import data based on file type
        if ($fileExtension -eq ".csv") {
            # Import CSV data
            Log-Message "Importing CSV data to $schema.$table" "Yellow"
            
            # PowerShell's Get-Content and pipeline instead of < redirect
            $importCommand = "Get-Content `"$dataFile`" | psql `"$remoteDbUrl`" -c `"COPY $schema.$table FROM STDIN WITH CSV HEADER`""
            Invoke-Expression $importCommand
            
            if ($LASTEXITCODE -eq 0) {
                Log-Success "Successfully imported CSV data to $schema.$table"
                return $true
            } else {
                Log-Warning "CSV import failed, trying with Supabase CLI..."
                return Import-TableDataWithSupabase -dataFile $dataFile
            }
        } else {
            # Import SQL data
            return Import-TableDataWithSupabase -dataFile $dataFile
        }
    }
    catch {
        Log-Warning "PSQL import error: $($_.Exception.Message). Trying Supabase CLI approach instead."
        return Import-TableDataWithSupabase -dataFile $dataFile
    }
}

# Import table data using Supabase CLI
function Import-TableDataWithSupabase {
    param (
        [string]$dataFile,
        [switch]$linked
    )

    if (-not (Test-Path $dataFile)) {
        Log-Error "Data file not found: $dataFile"
        return $false
    }

    # Execute the SQL file directly using psql instead of supabase CLI
    try {
        Log-Message "Importing data with direct PSQL connection" "Yellow"
        $remoteDbUrl = $env:REMOTE_DATABASE_URL
        $command = "psql `"$remoteDbUrl`" -f `"$dataFile`""
        Invoke-Expression $command
        
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Successfully imported data using Supabase CLI"
            return $true
        } else {
            Log-Error "Failed to import data using Supabase CLI"
            return $false
        }
    }
    catch {
        Log-Error "Supabase CLI import error: $($_.Exception.Message)"
        return $false
    }
}

# Complete table data transfer with error handling and fallbacks
function Transfer-TableData {
    param (
        [string]$schema,
        [string]$table,
        [switch]$skipTruncate,
        [switch]$useSupabaseCLI,
        [switch]$verifyAfterTransfer
    )

    Log-Message "Transferring data for $schema.$table..." "Yellow"

    try {
        # Get data from local table
        $dataFile = $null
        if ($useSupabaseCLI) {
            $dataFile = Export-TableDataWithSupabase -schema $schema -table $table
        } else {
            $dataFile = Get-LocalTableData -schema $schema -table $table
        }
        
        if (-not $dataFile -or -not (Test-Path $dataFile)) {
            throw "Failed to export data from local table $schema.$table"
        }

        # Import to remote table
        $importParams = @{
            schema = $schema
            table = $table
            dataFile = $dataFile
        }
        
        if ($skipTruncate) {
            $importParams["skipTruncate"] = $true
        }
        
        $importSuccess = Import-RemoteTableData @importParams
        
        if (-not $importSuccess) {
            throw "Failed to import data to remote table $schema.$table"
        }

        # Clean up temporary file
        if (Test-Path $dataFile) {
            Remove-Item -Path $dataFile -Force
        }

        # Verify the transfer if requested
        if ($verifyAfterTransfer) {
            $verification = Compare-TableCounts -schema $schema -table $table -verbose
            if ($verification.Match) {
                Log-Success "Verification passed for ${schema}.${table}: Local=$($verification.LocalCount), Remote=$($verification.RemoteCount)"
            } else {
                Log-Warning "Verification failed for ${schema}.${table}: Local=$($verification.LocalCount), Remote=$($verification.RemoteCount)"
            }
        }

        Log-Success "Successfully transferred data for $schema.$table"
        return $true
    }
    catch {
        Log-Error "Failed to transfer data for $schema.$table - $($_.Exception.Message)"
        return $false
    }
}

# Migrate a specific content type (group of related tables)
function Migrate-ContentType {
    param (
        [string]$contentType,
        [string[]]$tables,
        [string]$description,
        [string]$schema = "payload",
        [switch]$skipVerification,
        [switch]$useSupabaseCLI
    )

    Log-Phase "MIGRATING ${contentType}: ${description}"
    $successful = 0
    $failed = 0

    foreach ($table in $tables) {
        Log-Step "Migrating $table"

        # Transfer the data
        $transferParams = @{
            schema = $schema
            table = $table
        }
        
        if (-not $skipVerification) {
            $transferParams["verifyAfterTransfer"] = $true
        }
        
        if ($useSupabaseCLI) {
            $transferParams["useSupabaseCLI"] = $true
        }
        
        $result = Transfer-TableData @transferParams

        if ($result) {
            $successful++
        } else {
            $failed++
        }
    }

    Log-Message "Migration summary for ${contentType}: ${successful} succeeded, ${failed} failed" "Cyan"
    return @{
        ContentType = $contentType
        SuccessCount = $successful
        FailedCount = $failed
        TotalTables = $tables.Length
    }
}
