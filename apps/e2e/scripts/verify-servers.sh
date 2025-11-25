#!/bin/bash
# Server readiness verification script for E2E tests

echo "🔍 Verifying servers are ready for E2E tests..."

# Function to check if a URL is responding
check_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "  Checking $name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 5 "$url" > /dev/null 2>&1; then
            echo "  ✅ $name is ready!"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            echo "  ⏳ Waiting for $name to be ready..."
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "  ❌ $name failed to respond after $max_attempts attempts"
    return 1
}

# Check if we should start servers or just verify existing ones
START_SERVERS=${START_SERVERS:-false}

if [ "$START_SERVERS" = "true" ]; then
    echo "🚀 Starting dev servers..."
    
    # Start frontend in background
    echo "  Starting frontend server..."
    cd ../../apps/web && pnpm dev:test > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Start backend in background  
    echo "  Starting backend server..."
    cd ../../apps/payload && pnpm dev:test > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Give servers time to start
    sleep 5
    
    echo "  Frontend PID: $FRONTEND_PID"
    echo "  Backend PID: $BACKEND_PID"
    echo "  Logs: /tmp/frontend.log, /tmp/backend.log"
fi

# Verify frontend server
if ! check_server "http://localhost:3000" "Frontend"; then
    echo "❌ Frontend server is not ready"
    if [ "$START_SERVERS" = "true" ]; then
        echo "   Check frontend logs: tail -f /tmp/frontend.log"
    else
        echo "   Try starting it manually: cd apps/web && pnpm dev:test"
    fi
    exit 1
fi

# Verify Payload CMS server (runs on port 3021 via dev:test script)
if ! check_server "http://localhost:3021" "Payload CMS"; then
    echo "❌ Payload CMS server is not ready"
    if [ "$START_SERVERS" = "true" ]; then
        echo "   Check Payload logs: tail -f /tmp/backend.log"
    else
        echo "   Try starting it manually: cd apps/payload && pnpm dev:test"
    fi
    exit 1
fi

echo "✅ All servers are ready for E2E tests!"
echo ""
echo "You can now run:"
echo "  pnpm test:shard1    # Single shard"
echo "  node .claude/scripts/test-controller.cjs --e2e    # All shards via controller"