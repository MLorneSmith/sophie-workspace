# Direct SQL data transfer functions

function Get-LocalTableData {
    param (
        [string]$schema,
        [string]$table
    )

    $tempFile = Join-Path -Path $env:TEMP -ChildPath "$schema`_$table.sql"

    # Use local database URL from environment
    $localDbUrl = $env:DATABASE_URL

    # Export data directly using psql COPY command
    Exec-Command -command "psql `"$localDbUrl`" -c `"COPY $schema.$table TO STDOUT WITH CSV HEADER`" > `"$tempFile`"" -description "Exporting data from $schema.$table"

    if (-not (Test-Path $tempFile)) {
        Log-Error "Failed to export data from $schema.$table to $tempFile"
        return $null
    }

    return $tempFile
}

function Import-RemoteTableData {
    param (
        [string]$schema,
        [string]$table,
        [string]$dataFile
    )

    # Use remote database URL from environment
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # First truncate the table to avoid conflicts
    $truncateResult = Exec-Command -command "psql `"$remoteDbUrl`" -c `"TRUNCATE $schema.$table;`"" -description "Truncating remote $schema.$table" -captureOutput

    if ($LASTEXITCODE -ne 0) {
        Log-Error "Failed to truncate remote table $schema.$table - $truncateResult"
        return $false
    }

    # Import data using psql COPY command
    $importResult = Exec-Command -command "psql `"$remoteDbUrl`" -c `"COPY $schema.$table FROM STDIN WITH CSV HEADER`" < `"$dataFile`"" -description "Importing data to $schema.$table" -captureOutput

    if ($LASTEXITCODE -ne 0) {
        Log-Error "Failed to import data to remote table $schema.$table - $importResult"
        return $false
    }

    return $true
}

function Transfer-TableData {
    param (
        [string]$schema,
        [string]$table
    )

    Log-Message "Transferring data for $schema.$table..." "Yellow"

    try {
        # Get data from local table
        $dataFile = Get-LocalTableData -schema $schema -table $table
        if (-not $dataFile -or -not (Test-Path $dataFile)) {
            throw "Failed to export data from local table $schema.$table"
        }

        # Import to remote table
        $importResult = Import-RemoteTableData -schema $schema -table $table -dataFile $dataFile
        if (-not $importResult) {
            throw "Failed to import data to remote table $schema.$table"
        }

        # Clean up temporary file
        if (Test-Path $dataFile) {
            Remove-Item -Path $dataFile -Force
        }

        Log-Success "Successfully transferred data for $schema.$table"
        return $true
    }
    catch {
        Log-Error "CRITICAL ERROR: Failed to transfer data for $schema.$table - $_"
        exit 1  # Hard exit on critical error
    }
}
