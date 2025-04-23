# PowerShell Module for Database Diagnostics
# Provides functions to show migration status and handle timeouts

. "$PSScriptRoot\logging.ps1"
. "$PSScriptRoot\path-management.ps1"

function Show-MigrationDiagnostic {
    param (
        [int]$TimeoutSeconds = 30,
        [switch]$Detailed = $false
    )
    
    Write-Host "Running migration diagnostic... (timeout: $TimeoutSeconds seconds)" -ForegroundColor Cyan
    
    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        Log-Message "Changed directory to: $(Get-Location)" "Gray"
        
        try {
            # Use tsx to run the TypeScript file directly
            # This avoids issues with compiled JS files not being found
            
            # Create a job to run the diagnostic with timeout
            $jobScript = {
                param($workingDir)
                Set-Location $workingDir
                & pnpm exec tsx src/scripts/diagnostic/get-table-counts.ts
            }
            
            $job = Start-Job -ScriptBlock $jobScript -ArgumentList (Get-Location)
            
            # Wait for the job to complete with a timeout
            $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds
            
            if ($null -eq $completed) {
                # Job timed out
                Stop-Job -Job $job
                Remove-Job -Job $job -Force
                # No temp file to remove anymore
                
                Log-Warning "Diagnostic timed out after $TimeoutSeconds seconds. Database might be busy."
                
                # Show simpler information using direct SQL
                Write-Host "Falling back to basic diagnostics..." -ForegroundColor Yellow
                
                # Run the migration status command with a fallback
                $simpleResult = Exec-Command -command "pnpm run diagnostic:simple-status" -description "Basic database status" -captureOutput -continueOnError
                
                if ($simpleResult) {
                    Write-Host $simpleResult -ForegroundColor Gray
                } else {
                    Write-Host "Could not get basic status" -ForegroundColor Red
                }
                
                return $false
            }
            else {
                # Job completed successfully, get the results
                $result = Receive-Job -Job $job
                Remove-Job -Job $job
                # No temp file to remove anymore
                
                # Log the results
                if ($result) {
                    Write-Host ""
                    $result | ForEach-Object {
                        Write-Host $_ -ForegroundColor Gray
                    }
                } else {
                    Write-Host "No diagnostic results returned" -ForegroundColor Yellow
                }
                
                # Add note about common warnings
                Write-Host ""
                Write-Host "Note: Warning messages about 'No posts were migrated' are expected if posts already exist in the database." -ForegroundColor Cyan
                
                return $true
            }
        }
        catch {
            Log-Error "Error running diagnostic: $_"
            return $false
        }
        finally {
            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        }
    }
    else {
        Log-Warning "Could not find packages/content-migrations directory"
        return $false
    }
}

function Export-DatabaseStats {
    param (
        [string]$OutputFile = "migration-stats.json"
    )
    
    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        Log-Message "Exporting database statistics to $OutputFile..." "Cyan"
        
        $result = Exec-Command -command "pnpm run diagnostic:export-stats --output $OutputFile" -description "Exporting database statistics" -captureOutput -continueOnError
        
        if ($result -match "successfully exported") {
            Log-Success "Database statistics exported to $OutputFile"
            return $true
        }
        else {
            Log-Warning "Failed to export database statistics: $result"
            return $false
        }
    }
    else {
        Log-Warning "Could not find packages/content-migrations directory"
        return $false
    }
}
