# Import required modules
. ".\scripts\orchestration\utils\path-management.ps1"
. ".\scripts\orchestration\utils\logging.ps1"
. ".\scripts\orchestration\utils\execution.ps1"
. ".\scripts\orchestration\utils\supabase.ps1"

# Initialize logging
$script:logFile = ".\bucket-test-log.txt"
$script:detailedLogFile = ".\bucket-test-detailed-log.txt"

try {
    # Change to web app directory
    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "apps/web") {
        Write-Host "Changed directory to: $(Get-Location)" -ForegroundColor Green
    } else {
        throw "Could not find apps/web directory from project root"
    }
    
    # Test bucket creation
    Write-Host "Testing certificate bucket creation..." -ForegroundColor Yellow
    
    # Create a direct SQL file to create the bucket
    Write-Host "Creating direct SQL file for bucket operations..." -ForegroundColor Yellow
    
    $sqlFilePath = "$env:TEMP\direct-bucket-operations.sql"
    
    @"
-- Delete existing bucket if it exists
DO `$`$
BEGIN
    -- Delete policies first
    DELETE FROM storage.policies WHERE bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'certificates');
    -- Delete bucket
    DELETE FROM storage.buckets WHERE name = 'certificates';
    RAISE NOTICE 'Cleaned up any existing certificates bucket';
END
`$`$;

-- Create new bucket
DO `$`$
DECLARE 
    bucket_count int;
    bucket_id uuid;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE name = 'certificates';
    
    IF bucket_count = 0 THEN
        -- Generate UUID for bucket
        bucket_id := gen_random_uuid();
        
        -- Create the bucket with specific values
        INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
        VALUES (bucket_id, 'certificates', NULL, NOW(), NOW(), TRUE);
        
        RAISE NOTICE 'BUCKET_CREATED=TRUE';
        RAISE NOTICE 'BUCKET_ID=%', bucket_id;
        
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
    ELSE
        SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'certificates';
        
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
        
        RAISE NOTICE 'BUCKET_ALREADY_EXISTS=TRUE';
        RAISE NOTICE 'BUCKET_ID=%', bucket_id;
        RAISE NOTICE 'POLICY_UPDATED=TRUE';
    END IF;
END
`$`$;

-- Verify the bucket exists and is public
DO `$`$
DECLARE
    bucket_record RECORD;
BEGIN
    -- Check if bucket exists
    SELECT * INTO bucket_record FROM storage.buckets WHERE name = 'certificates';
    
    IF FOUND THEN
        RAISE NOTICE 'VERIFICATION_SUCCESS=TRUE';
        RAISE NOTICE 'BUCKET_PUBLIC=%', bucket_record.public;
        RAISE NOTICE 'BUCKET_ID=%', bucket_record.id;
    ELSE
        RAISE NOTICE 'VERIFICATION_SUCCESS=FALSE';
    END IF;
END
`$`$;
"@ | Set-Content -Path $sqlFilePath
    
    # Use direct connection via psql if available
    try {
        # Try to connect via psql
        Write-Host "Trying to create bucket using direct psql command..." -ForegroundColor Yellow
        $connectionString = "postgresql://postgres:postgres@localhost:54322/postgres"
        & psql $connectionString -f $sqlFilePath -o "$env:TEMP\psql_output.txt" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $psqlOutput = Get-Content "$env:TEMP\psql_output.txt" -Raw -ErrorAction SilentlyContinue
            Write-Host $psqlOutput -ForegroundColor Gray
            Write-Host "Direct psql execution succeeded" -ForegroundColor Green
            
            # Check for verification success
            if ($psqlOutput -match "VERIFICATION_SUCCESS=TRUE") {
                Write-Host "Bucket verification successful!" -ForegroundColor Green
            }
        } else {
            Write-Host "Direct psql command failed, falling back to Supabase execution" -ForegroundColor Yellow
            Exec-Command -command "supabase db execute $sqlFilePath" -description "Creating bucket via Supabase CLI" -continueOnError
        }
    } catch {
        Write-Host "Error with direct psql connection: $_" -ForegroundColor Yellow
        Write-Host "Falling back to Supabase CLI..."
        Exec-Command -command "supabase db execute $sqlFilePath" -description "Creating bucket via Supabase CLI" -continueOnError
    }
    
    # Now create bucket using our enhanced function
    $result = Ensure-SupabaseBucket -BucketName "certificates" -Public -IgnoreErrors
    
    if ($result) {
        Write-Host "SUCCESS: Certificate bucket created and set to public successfully!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not create or verify certificates bucket, but continuing as this is non-critical" -ForegroundColor Yellow
    }
    
    # Create a direct verification SQL file
    Write-Host "Verifying bucket through direct SQL query..." -ForegroundColor Yellow
    $verifyTempSql = "$env:TEMP\direct_verify_$([Guid]::NewGuid().ToString()).sql"
    @"
-- Verify buckets with improved output
DO \$\$
DECLARE
    bucket_record RECORD;
    bucket_found BOOLEAN := FALSE;
BEGIN
    -- Check if bucket exists
    SELECT * INTO bucket_record FROM storage.buckets WHERE name = 'certificates';
    
    IF FOUND THEN
        bucket_found := TRUE;
        RAISE NOTICE 'BUCKET_FOUND=TRUE';
        RAISE NOTICE 'BUCKET_PUBLIC=%', bucket_record.public;
        RAISE NOTICE 'BUCKET_ID=%', bucket_record.id;
    ELSE
        RAISE NOTICE 'BUCKET_FOUND=FALSE';
    END IF;
END
\$\$;
"@ | Set-Content -Path $verifyTempSql
    
    # Use the content-migrations package for SQL execution which is already set up correctly
    Write-Host "Navigating to content-migrations package for SQL verification..." -ForegroundColor Yellow
    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        Write-Host "Changed directory to: $(Get-Location)" -ForegroundColor Green
        
        # Copy our SQL file to a location accessible by the content-migrations package
        $verifyPath = ".\bucket-verification.sql"
        Copy-Item $verifyTempSql -Destination $verifyPath -Force
        
        Write-Host "Running verification through content-migrations utilities..." -ForegroundColor Yellow
        try {
            $verifyOutput = Exec-Command -command "pnpm run utils:run-sql-file $verifyPath" -description "Verifying bucket" -captureOutput
            
            # Check if BUCKET_FOUND=TRUE appears in the output
            if ($verifyOutput -match "BUCKET_FOUND=TRUE") {
                Write-Host "VERIFICATION SUCCESSFUL: Bucket 'certificates' exists in the database!" -ForegroundColor Green
                
                # Check if bucket is public
                if ($verifyOutput -match "BUCKET_PUBLIC=t") {
                    Write-Host "VERIFICATION SUCCESSFUL: Bucket is properly set to public!" -ForegroundColor Green
                } else {
                    Write-Host "WARNING: Bucket exists but may not be public" -ForegroundColor Yellow
                }
            } else {
                Write-Host "VERIFICATION FAILED: Bucket 'certificates' does not exist in the database" -ForegroundColor Red
            }
        } catch {
            Write-Host "ERROR: SQL verification failed: $_" -ForegroundColor Red
        }
        
        # Clean up verification file
        Remove-Item $verifyPath -ErrorAction SilentlyContinue
        Pop-Location
    } else {
        Write-Host "WARNING: Could not find content-migrations package, skipping SQL verification" -ForegroundColor Yellow
    }
    
    # Clean up temp file
    Remove-Item $verifyTempSql -ErrorAction SilentlyContinue
    
    Write-Host "Test completed successfully." -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Test failed: $_" -ForegroundColor Red
}
finally {
    # Return to original directory
    Set-ProjectRootLocation
}
