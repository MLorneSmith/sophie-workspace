#!/bin/bash

# Debug script for PostgreSQL container issues in Codespaces
echo "========================================="
echo "PostgreSQL Container Debug Information"
echo "========================================="
echo ""

# Check container status
echo "Container Status:"
docker compose ps postgres
echo ""

# Get container logs
echo "Container Logs (last 50 lines):"
docker compose logs --tail=50 postgres 2>&1
echo ""

# Check if container exists
CONTAINER_NAME="2025slideheroes_devcontainer-postgres-1"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "Container found: $CONTAINER_NAME"
    
    # Get detailed container info
    echo "Container Inspect (State):"
    docker inspect "$CONTAINER_NAME" --format='{{json .State}}' | jq '.'
    echo ""
    
    # Check environment variables
    echo "Environment Variables:"
    docker inspect "$CONTAINER_NAME" --format='{{json .Config.Env}}' | jq '.[]' | grep POSTGRES
    echo ""
    
    # Check mounts
    echo "Volume Mounts:"
    docker inspect "$CONTAINER_NAME" --format='{{json .Mounts}}' | jq '.'
    echo ""
else
    echo "Container not found: $CONTAINER_NAME"
    echo "Attempting to start PostgreSQL individually..."
    docker compose up -d postgres
    sleep 5
    docker compose logs postgres
fi

echo ""
echo "========================================="
echo "Debugging Complete"
echo "========================================="