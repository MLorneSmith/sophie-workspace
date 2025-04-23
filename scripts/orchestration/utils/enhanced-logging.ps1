# Enhanced logging utilities for PowerShell scripts
# Provides better visual feedback and more structured logs

function Log-SectionStart {
    param (
        [string]$SectionName,
        [int]$SectionNumber,
        [int]$TotalSections
    )
    
    $progress = "[$SectionNumber/$TotalSections]"
    $sectionTitle = "$progress $SectionName"
    $lineLength = 80
    $padding = [Math]::Max(0, $lineLength - $sectionTitle.Length - 4)
    
    Write-Host ""
    Write-Host "+=" -ForegroundColor Cyan -NoNewline
    Write-Host $sectionTitle -ForegroundColor Cyan -NoNewline
    Write-Host "=".PadRight($padding, "=") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "`n$timestamp - SECTION $SectionNumber`: $SectionName"
}

function Log-SectionEnd {
    param (
        [string]$SectionName,
        [bool]$Success = $true
    )
    
    $status = if ($Success) { "COMPLETED" } else { "FAILED" }
    $color = if ($Success) { "Green" } else { "Red" }
    $message = "SECTION $SectionName $status"
    $lineLength = 80
    $padding = [Math]::Max(0, $lineLength - $message.Length - 4)
    
    Write-Host "+=" -ForegroundColor Cyan -NoNewline
    Write-Host $message -ForegroundColor $color -NoNewline
    Write-Host "=".PadRight($padding, "=") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan
    Write-Host ""
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - SECTION $SectionName $status"
}

function Log-StepStart {
    param (
        [string]$StepName,
        [int]$StepNumber,
        [int]$TotalSteps
    )
    
    $progress = "[$StepNumber/$TotalSteps]"
    Write-Host "+-" -ForegroundColor DarkCyan -NoNewline
    Write-Host " $progress $StepName " -ForegroundColor Cyan -NoNewline
    Write-Host "-" -ForegroundColor DarkCyan
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - STEP $StepNumber`: $StepName"
}

function Log-StepEnd {
    param (
        [string]$StepName,
        [bool]$Success = $true
    )
    
    $status = if ($Success) { "[DONE]" } else { "[FAIL]" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "+-" -ForegroundColor DarkCyan -NoNewline
    Write-Host " $status " -ForegroundColor $color -NoNewline
    Write-Host "$StepName completed" -ForegroundColor DarkCyan
    
    # Create log entry
    $statusText = if ($Success) { "SUCCESS" } else { "FAILED" }
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - STEP $StepName $statusText"
}

# Enhanced versions of existing logging functions
function Log-Phase {
    param (
        [string]$PhaseName,
        [int]$PhaseNumber,
        [int]$TotalPhases = 4
    )
    
    if (-not $PhaseNumber) {
        # If phase number not provided, infer from name
        switch -Regex ($PhaseName) {
            "SETUP" { $PhaseNumber = 1 }
            "PROCESSING" { $PhaseNumber = 2 }
            "LOADING" { $PhaseNumber = 3 }
            "VERIFICATION|POST-VERIFICATION" { $PhaseNumber = 4 }
            default { $PhaseNumber = 0 }
        }
    }
    
    # Format with box drawing characters
    $lineLength = 80
    $padding = [Math]::Max(0, $lineLength - $PhaseName.Length - 6)
    
    Write-Host ""
    Write-Host "+" -ForegroundColor Blue -NoNewline
    Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Blue -NoNewline
    Write-Host "+" -ForegroundColor Blue
    
    Write-Host "|" -ForegroundColor Blue -NoNewline
    $progressText = if ($PhaseNumber -gt 0) { "[$PhaseNumber/$TotalPhases] " } else { "" }
    $centerText = "$progressText$PhaseName"
    $leftPadding = [math]::Max(0, [math]::Floor(($lineLength - 2 - $centerText.Length) / 2))
    $rightPadding = [math]::Max(0, $lineLength - 2 - $centerText.Length - $leftPadding)
    Write-Host " ".PadRight($leftPadding) -NoNewline
    Write-Host $centerText -ForegroundColor Yellow -NoNewline
    Write-Host " ".PadRight($rightPadding) -NoNewline
    Write-Host "|" -ForegroundColor Blue
    
    Write-Host "+" -ForegroundColor Blue -NoNewline
    Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Blue -NoNewline
    Write-Host "+" -ForegroundColor Blue
    Write-Host ""
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "`n$timestamp - ================================================================================"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - $PhaseName"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - ================================================================================"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - "
}

function Log-Step {
    param (
        [string]$StepName,
        [int]$StepNumber = 0,
        [int]$TotalSteps = 12
    )
    
    $progressText = if ($StepNumber -gt 0) { "[$StepNumber/$TotalSteps] " } else { "" }
    $lineLength = 60
    
    Write-Host ""
    Write-Host "+" -ForegroundColor Cyan -NoNewline
    Write-Host "-".PadRight($lineLength - 2, "-") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan
    
    Write-Host "|" -ForegroundColor Cyan -NoNewline
    Write-Host " $progressText$StepName" -ForegroundColor Yellow -NoNewline
    $paddingRight = $lineLength - 3 - "$progressText$StepName".Length
    Write-Host " ".PadRight($paddingRight) -NoNewline
    Write-Host "|" -ForegroundColor Cyan
    
    Write-Host "+" -ForegroundColor Cyan -NoNewline
    Write-Host "-".PadRight($lineLength - 2, "-") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "`n$timestamp - ------------------------------------------------------------"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - STEP $StepNumber`: $StepName"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - ------------------------------------------------------------"
}

function Log-Success {
    param (
        [string]$Message
    )
    
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message -ForegroundColor Green
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - SUCCESS: $Message"
}

function Log-Warning {
    param (
        [string]$Message
    )
    
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor Yellow
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - WARNING`: $Message"
    
    # Set the script:overallSuccess to false
    $script:overallSuccess = $false
}

function Log-Error {
    param (
        [string]$Message
    )
    
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message -ForegroundColor Red
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - ERROR`: $Message"
    
    # Set the script:overallSuccess to false
    $script:overallSuccess = $false
}

function Log-Message {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Write-Host $Message -ForegroundColor $Color
    
    # Create log entry
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - $Message"
}

function Log-Command {
    param (
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "EXECUTING: " -ForegroundColor Gray -NoNewline
    Write-Host $Command -ForegroundColor Yellow
    Write-Host "DESCRIPTION: " -ForegroundColor Gray -NoNewline
    Write-Host $Description -ForegroundColor Cyan
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - EXECUTING`: $Command"
    Add-Content -Path $script:detailedLogFile -Value "$timestamp - DESCRIPTION`: $Description"
}

function Log-DiagnosticSummary {
    param (
        [bool]$Success
    )
    
    Write-Host ""
    $lineLength = 80
    
    if ($Success) {
        # Success header
        Write-Host "+" -ForegroundColor Green -NoNewline
        Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Green -NoNewline
        Write-Host "+" -ForegroundColor Green
        
        Write-Host "|" -ForegroundColor Green -NoNewline
        $message = " MIGRATION COMPLETED SUCCESSFULLY "
        $leftPadding = [math]::Max(0, [math]::Floor(($lineLength - 2 - $message.Length) / 2))
        $rightPadding = [math]::Max(0, $lineLength - 2 - $message.Length - $leftPadding)
        Write-Host " ".PadRight($leftPadding) -NoNewline
        Write-Host $message -ForegroundColor White -BackgroundColor DarkGreen -NoNewline
        Write-Host " ".PadRight($rightPadding) -NoNewline
        Write-Host "|" -ForegroundColor Green
        
        Write-Host "+" -ForegroundColor Green -NoNewline
        Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Green -NoNewline
        Write-Host "+" -ForegroundColor Green
    }
    else {
        # Warning header
        Write-Host "+" -ForegroundColor Yellow -NoNewline
        Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Yellow -NoNewline
        Write-Host "+" -ForegroundColor Yellow
        
        Write-Host "|" -ForegroundColor Yellow -NoNewline
        $message = " MIGRATION COMPLETED WITH WARNINGS "
        $leftPadding = [math]::Max(0, [math]::Floor(($lineLength - 2 - $message.Length) / 2))
        $rightPadding = [math]::Max(0, $lineLength - 2 - $message.Length - $leftPadding)
        Write-Host " ".PadRight($leftPadding) -NoNewline
        Write-Host $message -ForegroundColor Black -BackgroundColor Yellow -NoNewline
        Write-Host " ".PadRight($rightPadding) -NoNewline
        Write-Host "|" -ForegroundColor Yellow
        
        Write-Host "+" -ForegroundColor Yellow -NoNewline
        Write-Host "=".PadRight($lineLength - 2, "=") -ForegroundColor Yellow -NoNewline
        Write-Host "+" -ForegroundColor Yellow
        
        # Note about post-migration warnings
        Write-Host ""
        Write-Host "NOTE: Warnings about 'No posts were migrated' are expected if all posts" -ForegroundColor Cyan
        Write-Host "already exist in the database." -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "For more detailed information, run:" -ForegroundColor White
    Write-Host "  pnpm --filter @kit/content-migrations run diagnostic:migration-status" -ForegroundColor Cyan
    Write-Host ""
    
    # Create log entry
    $timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
    if ($Success) {
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - MIGRATION COMPLETED SUCCESSFULLY"
    }
    else {
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - MIGRATION COMPLETED WITH WARNINGS"
    }
}

# Function to run diagnostic report and show summary
function Show-MigrationDiagnostic {
    param (
        [switch]$Detailed = $false
    )
    
    Write-Host "Running migration diagnostic report..." -ForegroundColor Cyan
    
    try {
        if ($Detailed) {
            # Run full diagnostic
            $result = Invoke-Expression "pnpm --filter @kit/content-migrations run diagnostic:migration-status"
            Write-Host $result
        }
        else {
            # Run compact diagnostic
            Set-ProjectRootLocation
            Set-ProjectLocation -RelativePath "packages/content-migrations"
            $tables = & pnpm exec tsx -e "
                const { Pool } = require('pg');
                require('dotenv').config();
                
                async function getTableCounts() {
                    const pool = new Pool({ connectionString: process.env.DATABASE_URI });
                    const client = await pool.connect();
                    
                    try {
                        const tables = ['courses', 'course_lessons', 'course_quizzes', 'posts', 'private', 'downloads', 'surveys'];
                        const results = {};
                        
                        for (const table of tables) {
                            try {
                                const result = await client.query(`SELECT COUNT(*) FROM payload.\${table}`);
                                results[table] = parseInt(result.rows[0].count);
                            } catch (err) {
                                results[table] = 'N/A';
                            }
                        }
                        
                        console.log(JSON.stringify(results));
                    } finally {
                        client.release();
                        await pool.end();
                    }
                }
                
                getTableCounts();
            "
            
            $counts = $tables | ConvertFrom-Json
            
            Write-Host ""
            Write-Host "Content Summary:" -ForegroundColor Cyan
            Write-Host "  Courses:      $($counts.courses)" -ForegroundColor White
            Write-Host "  Lessons:      $($counts.course_lessons)" -ForegroundColor White
            Write-Host "  Quizzes:      $($counts.course_quizzes)" -ForegroundColor White
            Write-Host "  Blog Posts:   $($counts.posts)" -ForegroundColor White
            Write-Host "  Private:      $($counts.private)" -ForegroundColor White
            Write-Host "  Downloads:    $($counts.downloads)" -ForegroundColor White
            Write-Host "  Surveys:      $($counts.surveys)" -ForegroundColor White
            
            Pop-Location
        }
    }
    catch {
        Write-Host "Error running diagnostic: $_" -ForegroundColor Red
    }
}

# No need to export functions when using dot-sourcing in PowerShell scripts
# Functions are automatically available to the script that dot-sources this file
