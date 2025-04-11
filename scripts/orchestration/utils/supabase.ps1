# PowerShell Supabase Utility Module for Reset-and-Migrate.ps1
# Handles Supabase-specific commands and operations
#
# NOTE: Bucket creation functions are now deprecated. Bucket creation should be done 
# through Supabase migrations (apps/web/supabase/migrations). See example:
# apps/web/supabase/migrations/20250407140654_create_certificates_bucket.sql

# Import utility modules for logging
. "$PSScriptRoot\logging.ps1"

# Function to get the Supabase CLI version
function Get-SupabaseCLIVersion {
    try {
        $tempOutput = "$env:TEMP\supabase_version_$([Guid]::NewGuid().ToString()).txt"
        $process = Start-Process -FilePath "supabase" -ArgumentList "--version" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tempOutput -RedirectStandardError "$env:TEMP\supabase_version_stderr.txt"
        
        if ($process.ExitCode -eq 0 -and (Test-Path $tempOutput)) {
            $versionContent = Get-Content $tempOutput -Raw -ErrorAction SilentlyContinue
            
            # Clean up temp files
            Remove-Item $tempOutput -ErrorAction SilentlyContinue
            Remove-Item "$env:TEMP\supabase_version_stderr.txt" -ErrorAction SilentlyContinue
            
            # Extract version number using regex
            if ($versionContent -match '(\d+\.\d+\.\d+)') {
                return $matches[1]
            }
        }
        
        # Return a default version if we can't determine it
        return "0.0.0"
    }
    catch {
        Log-Warning "Error getting Supabase CLI version: $_"
        return "0.0.0"
    }
}

# Function to check if a Supabase storage bucket exists
function Check-SupabaseBucketExists {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [int]$RetryCount = 2
    )
    
    for ($retry = 0; $retry -le $RetryCount; $retry++) {
        try {
            # Explicitly use JSON output format for reliable parsing
            Log-Message "Checking if bucket '$BucketName' exists (Attempt $($retry+1)/$($RetryCount+1))..." "Gray"
            
            # Use Start-Process to capture output reliably
            $tempOutput = "$env:TEMP\supabase_buckets_$([Guid]::NewGuid().ToString()).json"
            $process = Start-Process -FilePath "supabase" -ArgumentList "storage", "list-buckets", "--local", "--output=json" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tempOutput -RedirectStandardError "$env:TEMP\supabase_stderr.txt"
            
            # Check for successful execution
            if ($process.ExitCode -eq 0 -and (Test-Path $tempOutput)) {
                $bucketsContent = Get-Content $tempOutput -Raw -ErrorAction SilentlyContinue
                
                # Try to parse as JSON first
                $jsonValid = $false
                try {
                    if ($bucketsContent -match '^\[.*\]$') {
                        $buckets = $bucketsContent | ConvertFrom-Json -ErrorAction Stop
                        $jsonValid = $true
                        
                        # Log the buckets found for debugging
                        Log-Message "Buckets found: $($buckets | ForEach-Object { $_.name } | Join-String -Separator ', ')" "Gray"
                        
                        # Check if our bucket exists in the JSON response
                        foreach ($bucket in $buckets) {
                            if ($bucket.name -eq $BucketName) {
                                # Clean up temp files
                                Remove-Item $tempOutput -ErrorAction SilentlyContinue
                                Remove-Item "$env:TEMP\supabase_stderr.txt" -ErrorAction SilentlyContinue
                                return $true
                            }
                        }
                    }
                } catch {
                    $jsonValid = $false
                    Log-Message "Could not parse JSON output: $_" "Gray"
                }
                
                # Fallback to text matching if JSON parsing fails
                if (-not $jsonValid) {
                    Log-Message "Falling back to text matching for bucket existence check" "Gray"
                    if ($bucketsContent -match $BucketName) {
                        # Clean up temp files
                        Remove-Item $tempOutput -ErrorAction SilentlyContinue
                        Remove-Item "$env:TEMP\supabase_stderr.txt" -ErrorAction SilentlyContinue
                        return $true
                    }
                }
                
                # Clean up temp files
                Remove-Item $tempOutput -ErrorAction SilentlyContinue
                Remove-Item "$env:TEMP\supabase_stderr.txt" -ErrorAction SilentlyContinue
                
                # If we're on the last retry, return false
                if ($retry -eq $RetryCount) {
                    Log-Message "Bucket '$BucketName' not found after $($RetryCount+1) attempts" "Gray"
                    return $false
                }
            } else {
                # Read error output
                $stderr = Get-Content "$env:TEMP\supabase_stderr.txt" -Raw -ErrorAction SilentlyContinue
                Log-Message "Error output from list-buckets: $stderr" "Gray"
                
                # Clean up temp files
                Remove-Item $tempOutput -ErrorAction SilentlyContinue
                Remove-Item "$env:TEMP\supabase_stderr.txt" -ErrorAction SilentlyContinue
                
                # If we're on the last retry, return false
                if ($retry -eq $RetryCount) {
                    Log-Warning "Failed to list buckets after $($RetryCount+1) attempts"
                    return $false
                }
            }
        } catch {
            Log-Warning "Error checking if bucket exists: $_"
            # If we're on the last retry, return false
            if ($retry -eq $RetryCount) {
                return $false
            }
        }
        
        # Sleep before retry with exponential backoff
        if ($retry -lt $RetryCount) {
            $sleepTime = [Math]::Pow(2, $retry) # 1, 2, 4, 8 seconds...
            Log-Message "Retrying in $sleepTime seconds..." "Yellow"
            Start-Sleep -Seconds $sleepTime
        }
    }
    
    return $false
}

# Function to create a Supabase storage bucket
function Create-SupabaseBucket {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public,
        
        [Parameter(Mandatory = $false)]
        [int]$RetryCount = 1
    )
    
    # Get the Supabase CLI version for logging purposes
    $supabaseCLIVersion = Get-SupabaseCLIVersion
    Log-Message "Detected Supabase CLI version: $supabaseCLIVersion" "Gray"
    
    # For Supabase CLI 2.20.12, the storage commands don't include create-bucket
    # Going straight to SQL approach is more reliable
    Log-Message "Creating bucket '$BucketName' using SQL approach (CLI version $supabaseCLIVersion does not support bucket creation)..." "Yellow"
    
    # Use direct SQL commands to create the bucket
    return Create-BucketWithSQL -BucketName $BucketName -Public:$Public
}

# Function to set bucket to public access
function Set-BucketPublicAccess {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName
    )
    
    # Attempt to make the bucket public
    Log-Message "Setting public access for bucket '$BucketName' using SQL approach..." "Yellow"
    
    # Use direct SQL commands to set the bucket as public
    return Set-BucketPublicWithSQL -BucketName $BucketName
}

# Function to create bucket using direct SQL commands
function Create-BucketWithSQL {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public
    )
    
    try {
        # Create a temporary SQL file
        $tempSql = "$env:TEMP\create_bucket_$([Guid]::NewGuid().ToString()).sql"
        
        # SQL to create bucket
        $sql = @"
-- Check if bucket exists
DO \$\$
DECLARE 
    bucket_count int;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE name = '$BucketName';
    
    IF bucket_count = 0 THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
        VALUES (gen_random_uuid(), '$BucketName', NULL, NOW(), NOW(), $(if ($Public) { 'TRUE' } else { 'FALSE' }));
        
        -- Log success
        RAISE NOTICE 'Bucket $BucketName created successfully';
    ELSE
        -- Log that bucket already exists
        RAISE NOTICE 'Bucket $BucketName already exists';
    END IF;
END
\$\$;
"@

        # Add public access SQL if requested
        if ($Public) {
            $sql += @"

-- Set public access policy
DO \$\$
DECLARE
    bucket_id uuid;
BEGIN
    -- Get bucket ID
    SELECT id INTO bucket_id FROM storage.buckets WHERE name = '$BucketName';
    
    -- Update bucket to be public
    UPDATE storage.buckets SET public = TRUE WHERE id = bucket_id;
    
    -- First, clean up any existing policy
    DELETE FROM storage.policies WHERE bucket_id = bucket_id;
    
    -- Now create public access policy
    INSERT INTO storage.policies (id, name, bucket_id, operation, permission, definition, created_at, updated_at)
    VALUES (
        gen_random_uuid(), 
        'Public Access', 
        bucket_id, 
        '*', -- All operations
        'SELECT', -- Read-only permission
        '{}', -- Empty JSON definition for public access
        NOW(), 
        NOW()
    );
    
    RAISE NOTICE 'Public access set for bucket $BucketName';
END
\$\$;
"@
        }
        
        # Write SQL to file
        Set-Content -Path $tempSql -Value $sql
        
        # Run SQL file using supabase db execute (without --local flag)
        Log-Message "Executing SQL to create/update bucket..." "Yellow"
        $process = Start-Process -FilePath "supabase" -ArgumentList "db", "execute", $tempSql -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\sql_stdout.txt" -RedirectStandardError "$env:TEMP\sql_stderr.txt"
        
        # Log output
        $sqlOutput = Get-Content "$env:TEMP\sql_stdout.txt" -Raw -ErrorAction SilentlyContinue
        $sqlStderr = Get-Content "$env:TEMP\sql_stderr.txt" -Raw -ErrorAction SilentlyContinue
        Log-Message "SQL execution output: $sqlOutput$sqlStderr" "Gray"
        
        # Clean up temporary files
        Remove-Item $tempSql -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_stdout.txt" -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_stderr.txt" -ErrorAction SilentlyContinue
        
        # Check result
        if ($process.ExitCode -eq 0) {
            Log-Success "Bucket created/updated successfully with SQL"
            return $true
        } else {
            Log-Warning "SQL bucket creation/update failed with exit code: $($process.ExitCode)"
            return $false
        }
    } catch {
        Log-Warning "Error in SQL bucket creation: $_"
        return $false
    }
}

# Function to set bucket public with SQL
function Set-BucketPublicWithSQL {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName
    )
    
    try {
        # Create a temporary SQL file
        $tempSql = "$env:TEMP\set_public_$([Guid]::NewGuid().ToString()).sql"
        
# SQL to set public access
$sql = @"
-- Set public access policy
DO \$\$
DECLARE
    bucket_id uuid;
BEGIN
    -- Get bucket ID
    SELECT id INTO bucket_id FROM storage.buckets WHERE name = '$BucketName';
    
    -- Update bucket to be public
    UPDATE storage.buckets SET public = TRUE WHERE id = bucket_id;
    
    -- First, clean up any existing policy
    DELETE FROM storage.policies WHERE bucket_id = bucket_id;
    
    -- Now create public access policy
    INSERT INTO storage.policies (id, name, bucket_id, operation, permission, definition, created_at, updated_at)
    VALUES (
        gen_random_uuid(), 
        'Public Access', 
        bucket_id, 
        '*', -- All operations
        'SELECT', -- Read-only permission
        '{}', -- Empty JSON definition for public access
        NOW(), 
        NOW()
    );
    
    RAISE NOTICE 'Public access set for bucket $BucketName';
END
\$\$;
"@
        
        # Write SQL to file
        Set-Content -Path $tempSql -Value $sql
        
        # Run SQL file using supabase db execute (without --local flag)
        Log-Message "Executing SQL to set public access..." "Yellow"
        $process = Start-Process -FilePath "supabase" -ArgumentList "db", "execute", $tempSql -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\sql_pub_stdout.txt" -RedirectStandardError "$env:TEMP\sql_pub_stderr.txt"
        
        # Log output
        $sqlOutput = Get-Content "$env:TEMP\sql_pub_stdout.txt" -Raw -ErrorAction SilentlyContinue
        $sqlStderr = Get-Content "$env:TEMP\sql_pub_stderr.txt" -Raw -ErrorAction SilentlyContinue
        Log-Message "SQL execution output: $sqlOutput$sqlStderr" "Gray"
        
        # Clean up temporary files
        Remove-Item $tempSql -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_pub_stdout.txt" -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_pub_stderr.txt" -ErrorAction SilentlyContinue
        
        # Check result
        if ($process.ExitCode -eq 0) {
            Log-Success "Bucket set to public successfully with SQL"
            return $true
        } else {
            Log-Warning "SQL public setting failed with exit code: $($process.ExitCode)"
            return $false
        }
    } catch {
        Log-Warning "Error in SQL public setting: $_"
        return $false
    }
}

# Function to create a bucket using direct SQL with comprehensive operations
function Create-DirectBucketWithSQL {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public
    )
    
    try {
        # Create a temporary SQL file with comprehensive operations
        $tempSql = "$env:TEMP\direct_bucket_operations_$([Guid]::NewGuid().ToString()).sql"
        
        # SQL to clean up, create, and verify bucket in one script
        $sql = @"
-- Delete existing bucket if it exists
DO `$`$
BEGIN
    -- Delete policies first
    DELETE FROM storage.policies WHERE bucket_id IN (SELECT id FROM storage.buckets WHERE name = '$BucketName');
    -- Delete bucket
    DELETE FROM storage.buckets WHERE name = '$BucketName';
    RAISE NOTICE 'Cleaned up any existing $BucketName bucket';
END
`$`$;

-- Create new bucket
DO `$`$
DECLARE 
    bucket_count int;
    bucket_id uuid;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE name = '$BucketName';
    
    IF bucket_count = 0 THEN
        -- Generate UUID for bucket
        bucket_id := gen_random_uuid();
        
        -- Create the bucket with specific values
        INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
        VALUES (bucket_id, '$BucketName', NULL, NOW(), NOW(), $(if ($Public) { 'TRUE' } else { 'FALSE' }));
        
        RAISE NOTICE 'BUCKET_CREATED=TRUE';
        RAISE NOTICE 'BUCKET_ID=%', bucket_id;
        
        -- Create access policy if public
        $(if ($Public) {
@"
        -- Create public access policy
        INSERT INTO storage.policies (id, name, bucket_id, operation, permission, definition, created_at, updated_at)
        VALUES (
            gen_random_uuid(), 
            'Public Access', 
            bucket_id, 
            '*', -- All operations
            'SELECT', -- Read-only permission
            '{}', -- Empty JSON definition for public access
            NOW(), 
            NOW()
        );
        
        RAISE NOTICE 'POLICY_CREATED=TRUE';
"@
        } else { "-- Skipping policy creation for non-public bucket" })
    ELSE
        SELECT id INTO bucket_id FROM storage.buckets WHERE name = '$BucketName';
        
        $(if ($Public) {
@"
        -- Update bucket to be public
        UPDATE storage.buckets SET public = TRUE WHERE id = bucket_id;
        
        -- Delete existing policies
        DELETE FROM storage.policies WHERE bucket_id = bucket_id;
        
        -- Create public access policy
        INSERT INTO storage.policies (id, name, bucket_id, operation, permission, definition, created_at, updated_at)
        VALUES (
            gen_random_uuid(), 
            'Public Access', 
            bucket_id, 
            '*', -- All operations
            'SELECT', -- Read-only permission
            '{}', -- Empty JSON definition for public access
            NOW(), 
            NOW()
        );
"@
        } else { "-- Keeping bucket settings as is (non-public)" })
        
        RAISE NOTICE 'BUCKET_ALREADY_EXISTS=TRUE';
        RAISE NOTICE 'BUCKET_ID=%', bucket_id;
        $(if ($Public) { "RAISE NOTICE 'POLICY_UPDATED=TRUE';" } else { "-- No policy update needed" })
    END IF;
END
`$`$;

-- Verify the bucket exists and is properly configured
DO `$`$
DECLARE
    bucket_record RECORD;
BEGIN
    -- Check if bucket exists
    SELECT * INTO bucket_record FROM storage.buckets WHERE name = '$BucketName';
    
    IF FOUND THEN
        RAISE NOTICE 'VERIFICATION_SUCCESS=TRUE';
        RAISE NOTICE 'BUCKET_PUBLIC=%', bucket_record.public;
        RAISE NOTICE 'BUCKET_ID=%', bucket_record.id;
    ELSE
        RAISE NOTICE 'VERIFICATION_SUCCESS=FALSE';
    END IF;
END
`$`$;
"@
        
        # Write SQL to file
        Set-Content -Path $tempSql -Value $sql
        
        # Run SQL file using supabase db execute
        Log-Message "Executing comprehensive SQL for bucket operations..." "Yellow"
        $process = Start-Process -FilePath "supabase" -ArgumentList "db", "execute", $tempSql -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\sql_bucket_ops.txt" -RedirectStandardError "$env:TEMP\sql_bucket_ops_err.txt"
        
        # Log output
        $sqlOutput = Get-Content "$env:TEMP\sql_bucket_ops.txt" -Raw -ErrorAction SilentlyContinue
        $sqlStderr = Get-Content "$env:TEMP\sql_bucket_ops_err.txt" -Raw -ErrorAction SilentlyContinue
        Log-Message "SQL execution output: $sqlOutput$sqlStderr" "Gray"
        
        # Clean up temporary files
        Remove-Item $tempSql -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_bucket_ops.txt" -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\sql_bucket_ops_err.txt" -ErrorAction SilentlyContinue
        
        # Check result
        if ($process.ExitCode -eq 0) {
            if ($sqlOutput -match "VERIFICATION_SUCCESS=TRUE") {
                Log-Success "Bucket created/updated and verified successfully with SQL"
                return $true
            } else {
                Log-Warning "Bucket created but verification did not confirm its existence"
                
                # Check if the operation reported success
                if ($sqlOutput -match "BUCKET_CREATED=TRUE" -or $sqlOutput -match "BUCKET_ALREADY_EXISTS=TRUE") {
                    Log-Success "Bucket operation reported success despite verification issue"
                    return $true
                }
                
                return $false
            }
        } else {
            Log-Warning "SQL bucket operations failed with exit code: $($process.ExitCode)"
            return $false
        }
    } catch {
        Log-Warning "Error in SQL bucket operations: $_"
        return $false
    }
}

# Function to ensure a Supabase storage bucket exists - simplified version
function Ensure-SupabaseBucket {
    param (
        [Parameter(Mandatory = $true)]
        [string]$BucketName,
        
        [Parameter(Mandatory = $false)]
        [switch]$Public,
        
        [Parameter(Mandatory = $false)]
        [switch]$IgnoreErrors
    )
    
    try {
        Log-Message "Ensuring bucket '$BucketName' exists using direct SQL approach..." "Yellow"
        
        # Try the direct SQL approach which is more reliable
        if (Create-DirectBucketWithSQL -BucketName $BucketName -Public:$Public) {
            Log-Success "$BucketName bucket created and verified successfully"
            return $true
        }
        
        # If direct SQL failed, fall back to checking if it exists with CLI
        if (Check-SupabaseBucketExists -BucketName $BucketName) {
            Log-Success "$BucketName bucket already exists, verified with CLI"
            return $true
        }
        
        # If we got here, both approaches failed
        Log-Warning "$BucketName bucket creation and verification failed"
        
        if ($IgnoreErrors) {
            Log-Warning "Could not verify or create $BucketName bucket"
            Log-Message "This is non-critical, continuing with migration" "Yellow"
            return $false
        } else {
            return $false
        }
    } catch {
        Log-Warning "Error ensuring bucket exists: $_"
        if ($IgnoreErrors) {
            Log-Warning "Could not verify or create $BucketName bucket"
            Log-Message "This is non-critical, continuing with migration" "Yellow"
            return $false
        } else {
            return $false
        }
    }
}
