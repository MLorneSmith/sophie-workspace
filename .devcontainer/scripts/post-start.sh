#!/bin/bash
set -e

echo "🔄 Running post-start setup..."

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Ensure Docker is running (for Docker-in-Docker)
if command -v docker &> /dev/null; then
    # Wait for Docker daemon to be ready
    timeout=30
    while ! docker info > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            log_warning "Docker daemon not ready after 30 seconds"
            break
        fi
        echo "Waiting for Docker daemon..."
        sleep 1
        ((timeout--))
    done
    
    if docker info > /dev/null 2>&1; then
        log_info "Docker is running"
        
        # Start Supabase if not already running
        cd /workspace/apps/web
        if ! npx supabase status > /dev/null 2>&1; then
            log_info "Starting Supabase services..."
            npx supabase start || log_warning "Failed to start Supabase"
        else
            log_info "Supabase is already running"
        fi
        cd /workspace
    fi
fi

# 2. Start MCP servers
log_info "Starting MCP servers..."

# Function to start an MCP server
start_mcp_server() {
    local server_dir="$1"
    local server_name=$(basename "$server_dir")
    
    if [ -f "$server_dir/package.json" ]; then
        # Check if server has a start script
        if grep -q '"start"' "$server_dir/package.json"; then
            log_info "Starting MCP server: $server_name"
            (cd "$server_dir" && nohup npm start > "/tmp/mcp-$server_name.log" 2>&1 &)
        fi
    fi
}

# Start each MCP server in the background
if [ -d /workspace/.mcp-servers ]; then
    for server_dir in /workspace/.mcp-servers/*/; do
        start_mcp_server "$server_dir" &
    done
fi

# 3. Restore terminal session
if [ -f /home/node/.zsh_history ]; then
    log_info "Restored command history"
fi

# 4. Check for updates
log_info "Checking for dependency updates..."
cd /workspace
pnpm install --frozen-lockfile --prefer-offline || log_warning "Some dependencies may need updating"

# 5. Warm up Next.js
log_info "Warming up Next.js..."
# Start dev server in background and kill after 10 seconds to prebuild
timeout 10 pnpm --filter web dev > /dev/null 2>&1 || true

# 6. Display status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Development Environment Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check services
if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
    echo "  Docker:       ✅ Running"
    
    if npx supabase status > /dev/null 2>&1; then
        echo "  Supabase:     ✅ Running"
    else
        echo "  Supabase:     ⚠️  Not running (run 'supabase-start')"
    fi
else
    echo "  Docker:       ⚠️  Not available"
    echo "  Supabase:     ⚠️  Requires Docker"
fi

# Check Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo "  Node.js:      ✅ $node_version"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    pnpm_version=$(pnpm --version)
    echo "  pnpm:         ✅ v$pnpm_version"
fi

# Check for .env.local
if [ -f /workspace/apps/web/.env.local ]; then
    echo "  Environment:  ✅ Configured"
else
    echo "  Environment:  ⚠️  Missing .env.local"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to start development! Run 'pnpm dev' to begin."
echo ""