#!/bin/bash

# Docs MCP Server Startup Script (NPX version)
# Uses LM Studio for local embeddings

set -e

echo "🚀 Starting Docs MCP Server with LM Studio embeddings (NPX)..."

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

# Export environment variables
export OPENAI_API_KEY="lmstudio"
export OPENAI_API_BASE="http://172.31.160.1:1234/v1"
export DOCS_MCP_EMBEDDING_MODEL="text-embedding-qwen3-embedding-4b"
export DOCS_MCP_TELEMETRY="false"

# Start the server using npx
echo "🔧 Starting server with npx..."
echo ""
echo "📚 Server starting on:"
echo "   Web UI:         http://localhost:6280"
echo "   MCP SSE:        http://localhost:6280/sse"
echo "   MCP HTTP:       http://localhost:6280/mcp"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server (this will run in foreground)
npx @arabold/docs-mcp-server@latest --protocol http --port 6280