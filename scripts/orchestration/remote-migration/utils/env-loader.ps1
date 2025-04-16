# Environment Variable Loader
# This script loads environment variables from .env file

function Load-EnvFile {
    param (
        [string]$filePath = ".env"
    )
    
    Write-Host "Loading environment variables from $filePath"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "Warning: .env file not found at $filePath" -ForegroundColor Yellow
        return $false
    }
    
    $envContent = Get-Content $filePath
    
    foreach ($line in $envContent) {
        # Skip empty lines and comments
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
            continue
        }
        
        # Parse variable assignment
        if ($line -match "^\s*([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # Remove quotes if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            
            # Set environment variable
            [Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
            Write-Host "Set environment variable: $key" -ForegroundColor DarkGray
        }
    }
    
    return $true
}

# Load environment variables from scripts/.env file
$scriptsEnvPath = Join-Path -Path $PSScriptRoot -ChildPath "../../../../scripts/.env"
Load-EnvFile -filePath $scriptsEnvPath
