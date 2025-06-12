#!/bin/bash
# Check status of MCP Docker containers

echo "📊 MCP Container Status:"
docker-compose -f docker-compose.mcp.yml ps

echo ""
echo "🏥 Health Check Results:"

services=(
    "3051:Perplexity"
    "3002:Supabase"
    "3003:Context7"
    "3004:Postgres"
    "3005:Browser Tools"
    "3006:Code Reasoning"
    "3007:GitHub"
    "3008:Exa Proxy"
    "3009:CF Observability"
    "3010:CF Bindings"
    "3011:CF Playwright"
)

for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"
    
    if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
        echo "  ✅ $name (port $port): healthy"
    else
        echo "  ❌ $name (port $port): unhealthy or not running"
    fi
done