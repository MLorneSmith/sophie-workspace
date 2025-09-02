#!/bin/bash

# Script to determine which docker-compose files to use based on environment
# This script is called before Docker Compose starts

set -e

echo "Setting up Docker Compose configuration..."

# Function to detect if we're running in GitHub Codespaces
is_codespaces() {
    if [ -n "$CODESPACES" ] || [ -n "$CODESPACE_NAME" ]; then
        return 0
    fi
    return 1
}

# Base compose file
COMPOSE_FILES="docker-compose.yml"

# Add environment-specific overrides
if is_codespaces; then
    echo "Detected GitHub Codespaces environment"
    COMPOSE_FILES="${COMPOSE_FILES},docker-compose.codespaces.yml"
    
    # Create a marker file for other scripts to detect Codespaces
    touch /tmp/.codespaces_env
else
    echo "Detected local development environment"
    # In local environment, optionally include local overrides if they exist
    if [ -f ".devcontainer/docker-compose.local-override.yml" ]; then
        echo "Including local override configuration"
        COMPOSE_FILES="${COMPOSE_FILES},docker-compose.local-override.yml"
    fi
fi

# Export for use by devcontainer
export COMPOSE_FILES

echo "Docker Compose files configured: ${COMPOSE_FILES}"
echo "Environment setup complete"