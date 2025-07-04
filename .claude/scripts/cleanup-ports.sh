#!/bin/bash

# Script to clean up ports used by E2E tests
# Can be run independently when tests fail to clean up properly

echo "🧹 Port Cleanup Script"
echo "===================="

# Define all ports used by the test environment
declare -A PORTS=(
    ["3000"]="Next.js Dev Server"
    ["3001"]="Alternative Next.js Port"
    ["3020"]="Payload CMS"
    ["54321"]="Supabase API"
    ["54322"]="Supabase Database"
    ["54323"]="Supabase Studio"
    ["54324"]="Inbucket Web"
    ["54325"]="Inbucket SMTP"
    ["54326"]="Inbucket POP3"
)

# Function to check if port is in use
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local name=$2
    
    if check_port $port; then
        echo "🔍 Port $port ($name) is in use"
        
        # Get process info before killing
        echo "   Processes using port $port:"
        lsof -i:$port | grep LISTEN | awk '{print "   - PID: " $2 ", Command: " $1}' | sort -u
        
        # Kill the processes
        lsof -ti:$port | xargs kill -9 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Killed processes on port $port"
        else
            echo "   ❌ Failed to kill processes on port $port"
        fi
    else
        echo "✅ Port $port ($name) is free"
    fi
}

# Clean up all ports
echo ""
echo "Checking and cleaning ports..."
echo "------------------------------"

for port in "${!PORTS[@]}"; do
    kill_port $port "${PORTS[$port]}"
done

# Stop any running Supabase instances
echo ""
echo "Stopping Supabase instances..."
echo "------------------------------"

# Try different project IDs that might be running
for project_id in "e2e" "2025slideheroes-db" "2025slideheroes"; do
    echo "Attempting to stop Supabase project: $project_id"
    npx supabase stop --project-id $project_id 2>/dev/null || true
done

# General stop command
npx supabase stop 2>/dev/null || true

# Kill any remaining Next.js servers
echo ""
echo "Cleaning up Next.js processes..."
echo "--------------------------------"

pkill -f "next-server" || true
pkill -f "next dev" || true

# Final verification
echo ""
echo "Final port status:"
echo "-----------------"

ALL_CLEAR=true
for port in "${!PORTS[@]}"; do
    if check_port $port; then
        echo "❌ Port $port (${PORTS[$port]}) is still in use"
        ALL_CLEAR=false
    else
        echo "✅ Port $port (${PORTS[$port]}) is free"
    fi
done

if [ "$ALL_CLEAR" = true ]; then
    echo ""
    echo "✅ All ports are now free!"
else
    echo ""
    echo "⚠️  Some ports are still in use. You may need to manually investigate."
fi