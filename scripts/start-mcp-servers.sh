#!/bin/bash
# Start MCP Docker containers
# This script replaces unreliable npx-based servers with containerized versions

set -e

echo "🐋 Starting MCP Docker containers..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables
if [ -f .env.mcp.local ]; then
    echo "📄 Loading environment from .env.mcp.local"
    set -a
    source .env.mcp.local
    set +a
elif [ -f .env.mcp ]; then
    echo "📄 Loading environment from .env.mcp"
    set -a
    source .env.mcp
    set +a
else
    echo "⚠️  No environment file found. Using defaults from docker-compose.mcp.yml"
fi

# Start containers
echo "🚀 Starting MCP containers..."
docker-compose -f docker-compose.mcp.yml up -d

# Wait for health checks
echo "⏳ Waiting for containers to be healthy..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose -f docker-compose.mcp.yml ps

# Health check summary
echo ""
echo "🏥 Health check endpoints:"
echo "  - Perplexity:                http://localhost:3001/health"
echo "  - Supabase:                  http://localhost:3002/health"
echo "  - Context7:                  http://localhost:3003/health"
echo "  - Postgres:                  http://localhost:3004/health"
echo "  - Browser Tools:             http://localhost:3005/health"
echo "  - Code Reasoning:            http://localhost:3006/health"
echo "  - GitHub:                    http://localhost:3007/health"
echo "  - Exa Proxy:                 http://localhost:3008/health"
echo "  - Cloudflare Observability:  http://localhost:3009/health"
echo "  - Cloudflare Bindings:       http://localhost:3010/health"
echo "  - Cloudflare Playwright:     http://localhost:3011/health"

echo ""
echo "✅ MCP Docker containers started!"
echo "💡 Use 'scripts/stop-mcp-servers.sh' to stop containers"
echo "📊 Use 'scripts/mcp-status.sh' to check status"