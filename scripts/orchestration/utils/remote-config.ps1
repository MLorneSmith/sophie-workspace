# Remote migration configuration for Supabase

# Remote database connection
# Project reference ID from 'supabase projects list' output
$ProjectReferenceId = "ldebzombxtszzcgnylgq"

# Using the Supavisor session mode pooler format (from Supabase docs)
# This is ideal for persistent servers when IPv6 is not supported
$REMOTE_DATABASE_URL = "postgres://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Set environment variables
$env:REMOTE_DATABASE_URL = $REMOTE_DATABASE_URL

# Remote flag to control script behavior
$IsRemoteMigration = $true

# Connection retry settings
$RemoteConnectionRetries = 3
$RemoteConnectionTimeout = 30
