#!/bin/bash

echo "🧹 Cleaning up existing processes..."

# Kill any existing Playwright test processes
pkill -f "playwright test" || true

# Kill any Node processes on common test ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Check and handle Supabase port conflicts
echo "🔍 Checking for port conflicts..."

# Define Supabase ports
SUPABASE_PORTS=(54321 54322 54323 54324 54325 54326)
PORT_NAMES=("API" "Database" "Studio" "Inbucket Web" "Inbucket SMTP" "Inbucket POP3")

# Check each port for conflicts
PORTS_IN_USE=()
for i in "${!SUPABASE_PORTS[@]}"; do
    PORT="${SUPABASE_PORTS[$i]}"
    NAME="${PORT_NAMES[$i]}"
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo "⚠️  Port $PORT ($NAME) is in use"
        PORTS_IN_USE+=($PORT)
    fi
done

# If any Supabase ports are in use, stop existing Supabase instance
if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo "🛑 Stopping existing Supabase instance to free ports..."
    cd /home/msmith/projects/2025slideheroes
    
    # Try to stop with project ID first
    npx supabase stop --project-id e2e 2>/dev/null || true
    
    # Then try regular stop
    npx supabase stop 2>/dev/null || true
    
    # Force kill processes if still running
    for PORT in "${PORTS_IN_USE[@]}"; do
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    done
    
    # Wait for ports to be freed
    sleep 2
fi

# Check if Supabase is running
echo "🔍 Checking Supabase status..."
cd /home/msmith/projects/2025slideheroes

# Try to get Supabase status
if ! npx supabase status > /dev/null 2>&1; then
    echo "🚀 Starting Supabase..."
    npx supabase start
else
    echo "✅ Supabase is already running"
fi

# Verify Inbucket is accessible
echo "📧 Checking email service..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54324 | grep -q "200"; then
    echo "✅ Email service (Inbucket) is accessible"
else
    echo "❌ Email service is not accessible. Restarting Supabase..."
    npx supabase stop
    npx supabase start
fi

echo "✅ Test environment ready!"