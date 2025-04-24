# Enhanced SQL error logging utilities for content migration system

# Function to parse and categorize SQL errors
function Parse-SQLError {
    param (
        [string]$ErrorMessage
    )

    $errorType = "Unknown"
    $errorDetail = "No details available"
    $suggestedFix = "Check the full error message for more information"

    # Categorize common SQL errors
    if ($ErrorMessage -match "column .* does not exist") {
        $errorType = "Missing Column"
        if ($ErrorMessage -match "column\s+([^\s]+)\s+does not exist") {
            $columnName = $matches[1]
        } else {
            $columnName = "unknown"
        }
        $errorDetail = "The column '$columnName' does not exist in the referenced table"
        $suggestedFix = "Check table schema and column references in your query"
    }
    elseif ($ErrorMessage -match "ALTER .* ADD COLUMN cannot be performed on") {
        $errorType = "Table Modification Restriction"
        if ($ErrorMessage -match "ALTER .* ADD COLUMN cannot be performed on.* ([^\s]+)") {
            $tableName = $matches[1]
        } else {
            $tableName = "unknown"
        }
        $errorDetail = "Cannot add a column to table '$tableName'"
        $suggestedFix = "This table might be locked, a view, or have other restrictions. Try direct SQL access."
    }
    elseif ($ErrorMessage -match "relation .* does not exist") {
        $errorType = "Missing Table"
        if ($ErrorMessage -match "relation\s+""?([^\s""]+)""?\s+does not exist") {
            $tableName = $matches[1]
        } else {
            $tableName = "unknown"
        }
        $errorDetail = "The table or view '$tableName' does not exist in the database"
        $suggestedFix = "Verify table name and ensure it exists before referencing"
    }
    elseif ($ErrorMessage -match "current transaction is aborted") {
        $errorType = "Transaction Aborted"
        $errorDetail = "A previous error has caused the current transaction to be aborted"
        $suggestedFix = "Execute ROLLBACK and start a new transaction to continue"
    }
    elseif ($ErrorMessage -match "duplicate key value violates unique constraint") {
        $errorType = "Unique Constraint Violation"
        if ($ErrorMessage -match "duplicate key value violates unique constraint ""([^""]+)""") {
            $constraintName = $matches[1]
        } else {
            $constraintName = "unknown"
        }
        $errorDetail = "Attempted to insert a duplicate value into a unique constraint '$constraintName'"
        $suggestedFix = "Ensure data being inserted doesn't violate unique constraints"
    }

    return @{
        ErrorType = $errorType
        Detail = $errorDetail
        SuggestedFix = $suggestedFix
        RawMessage = $ErrorMessage
    }
}

# Function to log SQL errors with enhanced details
function Log-SQLError {
    param (
        [string]$Command,
        [string]$ErrorMessage
    )

    $parsedError = Parse-SQLError -ErrorMessage $ErrorMessage
    
    # Log to console with formatting
    Write-Host "SQL ERROR DETECTED:" -ForegroundColor Red -BackgroundColor Black
    Write-Host "  Type: $($parsedError.ErrorType)" -ForegroundColor Red
    Write-Host "  Detail: $($parsedError.Detail)" -ForegroundColor Red
    Write-Host "  Suggested Fix: $($parsedError.SuggestedFix)" -ForegroundColor Yellow
    Write-Host "  Command: $Command" -ForegroundColor Gray
    Write-Host "  Raw Error: $($parsedError.RawMessage)" -ForegroundColor Gray
    
    # Log to detailed log file
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $script:detailedLogFile -Value "`n$timestamp - SQL ERROR DETECTED:"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp -   Type: $($parsedError.ErrorType)"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp -   Detail: $($parsedError.Detail)"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp -   Suggested Fix: $($parsedError.SuggestedFix)"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp -   Command: $Command"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp -   Raw Error: $($parsedError.RawMessage)"
    
    return $parsedError
}

# Enhanced command execution with SQL error detection
function Execute-SQLCommandWithErrorHandling {
    param (
        [string]$Command,
        [string]$Description
    )
    
    Log-Message "EXECUTING SQL: $Command" "Gray"
    Log-Message "DESCRIPTION: $Description" "Gray"
    
    try {
        # Capture all output including errors
        $output = Invoke-Expression $Command 2>&1
        
        # Check if output contains SQL errors
        $hasSQLError = $false
        $sqlErrorMessage = ""
        
        foreach ($line in $output) {
            $lineStr = if ($line -is [string]) { $line } else { $line.ToString() }
            
            # Detect common SQL errors
            if ($lineStr -match "(column .* does not exist)|(relation .* does not exist)|(current transaction is aborted)|(duplicate key value)|(could not connect to server)|(ALTER .* ADD COLUMN cannot be performed)") {
                $hasSQLError = $true
                $sqlErrorMessage = $lineStr
            }
        }
        
        # Log all output
        Log-Message "--- Command Output Start ---" "Gray"
        foreach ($line in $output) {
            $lineStr = if ($line -is [string]) { $line } else { $line.ToString() }
            
            # Highlight SQL errors
            if ($lineStr -match "(column .* does not exist)|(relation .* does not exist)|(current transaction is aborted)|(duplicate key value)|(could not connect to server)|(ALTER .* ADD COLUMN cannot be performed)") {
                Log-Message $lineStr "Red"
            } else {
                Log-Message $lineStr "White"
            }
        }
        Log-Message "--- Command Output End ---" "Gray"
        
        # If SQL error was detected, log it in enhanced format
        if ($hasSQLError) {
            $parsedError = Log-SQLError -Command $Command -ErrorMessage $sqlErrorMessage
            return @{
                Success = $false
                ErrorInfo = $parsedError
                Output = $output
            }
        }
        
        return @{
            Success = $true
            Output = $output
        }
    }
    catch {
        Log-DetailedError "Command failed: $Command" $_
        return @{
            Success = $false
            ErrorInfo = @{
                ErrorType = "Execution Error"
                Detail = $_.Exception.Message
                SuggestedFix = "Check command syntax or environment"
                RawMessage = $_.ToString()
            }
            Output = $null
        }
    }
}

# Helper function for logging detailed errors
function Log-DetailedError {
    param (
        [string]$Message,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )
    
    Log-Error $Message
    
    if ($ErrorRecord) {
        $errorDetails = @"
ERROR DETAILS:
- Exception: $($ErrorRecord.Exception.GetType().FullName)
- Message: $($ErrorRecord.Exception.Message)
- SQL Error: $($ErrorRecord.Exception.InnerException.Message)
- Position: $($ErrorRecord.InvocationInfo.PositionMessage)
- Script: $($ErrorRecord.InvocationInfo.ScriptName):$($ErrorRecord.InvocationInfo.ScriptLineNumber)
"@
        Log-Message $errorDetails "Red"
        
        # Add to detailed log file
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - $errorDetails"
    }
}

# Safe error message extraction function that works in catch blocks
function Get-SafeErrorMessage {
    param (
        [Parameter(Mandatory = $false)]
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )
    
    if ($null -eq $ErrorRecord) {
        return "Unknown error - no error record provided"
    }
    
    try {
        return $ErrorRecord.Exception.Message
    } catch {
        try {
            return $ErrorRecord.ToString()
        } catch {
            return "Error information could not be extracted"
        }
    }
}
