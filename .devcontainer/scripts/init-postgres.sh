#!/bin/bash

# PostgreSQL initialization script for multi-container environment
# Handles both local and Codespaces environments

set -e

echo "========================================="
echo "PostgreSQL Initialization"
echo "========================================="

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T postgres pg_isready -U postgres -d postgres >/dev/null 2>&1; then
            echo "PostgreSQL is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: PostgreSQL failed to start after $max_attempts attempts"
    return 1
}

# Initialize database with Supabase requirements
init_database() {
    echo "Initializing database with Supabase extensions..."
    
    docker compose exec -T postgres psql -U postgres <<EOF
-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;

-- Grant permissions
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON SCHEMA realtime TO postgres;

-- Basic configuration
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
SELECT pg_reload_conf();

-- Confirm setup
SELECT current_database(), current_user, version();
EOF
    
    echo "Database initialization complete!"
}

# Check if we're in Codespaces
if [ -f "/tmp/.codespaces_env" ] || [ -n "$CODESPACES" ]; then
    echo "Running in GitHub Codespaces environment"
    echo "Using simplified PostgreSQL configuration"
else
    echo "Running in local development environment"
fi

# Main execution
if wait_for_postgres; then
    init_database
    echo "PostgreSQL setup completed successfully!"
    exit 0
else
    echo "PostgreSQL setup failed!"
    echo "Checking container logs..."
    docker compose logs --tail=50 postgres
    exit 1
fi