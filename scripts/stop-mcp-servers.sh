#!/bin/bash
# Stop MCP Docker containers

set -e

echo "🛑 Stopping MCP Docker containers..."

# Stop containers
docker-compose -f docker-compose.mcp.yml down

echo "✅ MCP Docker containers stopped!"