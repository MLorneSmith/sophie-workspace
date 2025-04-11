# PowerShell Supabase Utility Module for Reset-and-Migrate.ps1
# Handles Supabase-specific commands and operations

# Import utility modules for logging
. "$PSScriptRoot\logging.ps1"

# Function to check if a Supabase storage bucket exists
function Check-SupabaseBucketExists {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName
    )
    
    try {
        # Use direct command execution to list buckets
        $bucketsOutput = & supabase storage list-buckets 2>&1 | Out-String
        
        # Log the output for debugging
        Log-Message "Supabase buckets output: $bucketsOutput" "Gray"
        
        # Check if the specified bucket exists in the output
        if ($bucketsOutput -match $BucketName) {
            return $true
        } else {
            return $false
        }
    } catch {
        Log-Warning "Error checking if bucket exists: $_"
        return $false
    }
}

# Function to create a Supabase storage bucket
function Create-SupabaseBucket {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public
    )
    
    try {
        # Directly execute the command without Invoke-Expression
        if ($Public) {
            $output = & supabase storage create-bucket $BucketName --public 2>&1 | Out-String
        } else {
            $output = & supabase storage create-bucket $BucketName 2>&1 | Out-String
        }
        
        # Log the output for debugging
        Log-Message "Supabase bucket creation output: $output" "Gray"
        
        # Check if the bucket was created successfully
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE -or $output -match "bucket created") {
            return $true
        } else {
            Log-Warning "Bucket creation returned exit code: $LASTEXITCODE"
            return $false
        }
    } catch {
        Log-Warning "Error creating bucket: $_"
        return $false
    }
}

# Function to ensure a Supabase storage bucket exists
function Ensure-SupabaseBucket {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public
    )
    
    try {
        # Check if the bucket exists
        if (Check-SupabaseBucketExists -BucketName $BucketName) {
            Log-Success "$BucketName bucket already exists"
            return $true
        } else {
            # Create the bucket if it doesn't exist
            Log-Message "Creating $BucketName bucket..." "Yellow"
            if (Create-SupabaseBucket -BucketName $BucketName -Public:$Public) {
                # Verify the bucket was created
                if (Check-SupabaseBucketExists -BucketName $BucketName) {
                    Log-Success "$BucketName bucket created successfully"
                    return $true
                } else {
                    Log-Warning "$BucketName bucket creation verification failed"
                    return $false
                }
            } else {
                Log-Warning "$BucketName bucket creation failed"
                return $false
            }
        }
    } catch {
        Log-Warning "Error ensuring bucket exists: $_"
        return $false
    }
}
