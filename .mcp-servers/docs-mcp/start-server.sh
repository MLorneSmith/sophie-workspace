#!/bin/bash

# Docs MCP Server Startup Script
# Uses LM Studio for local embeddings

set -e

echo "🚀 Starting Docs MCP Server with LM Studio embeddings..."

# Check if LM Studio is accessible
echo "📡 Checking LM Studio connection..."
if curl -s --max-time 2 http://172.31.160.1:1234/v1/models > /dev/null 2>&1; then
    echo "✅ LM Studio is accessible"
else
    echo "❌ LM Studio is not accessible on http://172.31.160.1:1234"
    echo "   Please ensure:"
    echo "   1. LM Studio is running on Windows"
    echo "   2. 'Serve on local network' is enabled"
    echo "   3. Windows Firewall allows LM Studio"
    echo "   4. An embedding model is loaded"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p ~/.local/share/docs-mcp-server

# Start the server using Docker Compose
echo "🐳 Starting Docker container..."
cd "$(dirname "$0")"
docker-compose up -d

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s --max-time 1 http://localhost:6280/health > /dev/null 2>&1; then
        echo "✅ Docs MCP Server is running!"
        echo ""
        echo "📚 Access points:"
        echo "   Web UI:         http://localhost:6280"
        echo "   MCP SSE:        http://localhost:6280/sse"
        echo "   MCP HTTP:       http://localhost:6280/mcp"
        echo ""
        echo "📝 To stop the server: docker-compose -f $(pwd)/docker-compose.yml down"
        echo ""
        exit 0
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "⚠️  Server failed to start. Check logs with:"
echo "   docker logs docs-mcp-server"
exit 1