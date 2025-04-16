# Verification utility functions

function Verify-TableRowCount {
    param (
        [string]$schema,
        [string]$table
    )

    $localDbUrl = $env:DATABASE_URL
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # Get local count
    $localQuery = "SELECT COUNT(*) FROM $schema.$table;"
    $localCount = Invoke-LocalSql -query $localQuery -captureOutput -continueOnError
    $localCount = $localCount.Trim()

    # Get remote count
    $remoteQuery = "SELECT COUNT(*) FROM $schema.$table;"
    $remoteCount = Invoke-RemoteSql -query $remoteQuery -captureOutput -continueOnError
    $remoteCount = $remoteCount.Trim()

    # Compare counts
    if ($localCount -eq $remoteCount) {
        Log-Success "Row count match for $schema.$table - $localCount rows"
        return $true
    } else {
        Log-Warning "Row count mismatch for $schema.$table - Local=$localCount, Remote=$remoteCount"
        return $false
    }
}

function Verify-SampleData {
    param (
        [string]$schema,
        [string]$table,
        [string]$idColumn = "id"
    )

    $localDbUrl = $env:DATABASE_URL
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # Get a sample ID from local
    $localQuery = "SELECT $idColumn FROM $schema.$table LIMIT 1;"
    $sampleId = Invoke-LocalSql -query $localQuery -captureOutput -continueOnError
    $sampleId = $sampleId.Trim()

    if (-not $sampleId) {
        Log-Warning "No data found in local $schema.$table to verify"
        return $true
    }

    # Check if sample exists in remote
    $remoteQuery = "SELECT EXISTS(SELECT 1 FROM $schema.$table WHERE $idColumn = '$sampleId');"
    $remoteCheck = Invoke-RemoteSql -query $remoteQuery -captureOutput -continueOnError
    $remoteCheck = $remoteCheck.Trim()

    if ($remoteCheck -eq "t") {
        Log-Success "Sample data verified for $schema.$table"
        return $true
    } else {
        Log-Warning "Sample data verification failed for $schema.$table"
        return $false
    }
}

function Verify-TableMigration {
    param (
        [string]$schema,
        [string]$table,
        [string]$idColumn = "id",
        [switch]$RequireExactMatch
    )

    Log-Message "Verifying migration for $schema.$table..." "Yellow"

    # First verify row counts
    $countVerification = Verify-TableRowCount -schema $schema -table $table
    
    # Then verify sample data
    $sampleVerification = Verify-SampleData -schema $schema -table $table -idColumn $idColumn
    
    # Determine success based on requirements
    if ($RequireExactMatch) {
        $success = $countVerification -and $sampleVerification
    } else {
        # Allow tables with data but not exact count match to pass
        # This is useful for tables that might have runtime differences
        $success = $sampleVerification
    }
    
    if ($success) {
        Log-Success "Migration verification passed for $schema.$table"
    } else {
        Log-Error "Migration verification failed for $schema.$table"
        throw "Verification failed for $schema.$table"
    }
    
    return $success
}
