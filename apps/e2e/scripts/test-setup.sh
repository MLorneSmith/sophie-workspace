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

# Skip migration check since we're using shared development database
# The database should be maintained using: pnpm supabase:web:reset when needed

# Verify critical tables exist
echo "🔍 Verifying database schema..."
cd /home/msmith/projects/2025slideheroes

# Check if critical tables/views exist
CRITICAL_OBJECTS=("user_account_workspace" "user_accounts" "testimonials" "accounts")
MISSING_OBJECTS=()

for OBJECT in "${CRITICAL_OBJECTS[@]}"; do
    # Use docker to query the database directly
    EXISTS=$(docker exec -i supabase_db_2025slideheroes-db psql -U postgres -d postgres -t -c "SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '$OBJECT'
        UNION
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = '$OBJECT'
    );" 2>/dev/null | tr -d ' ')
    
    if [ "$EXISTS" != "t" ]; then
        MISSING_OBJECTS+=($OBJECT)
    fi
done

if [ ${#MISSING_OBJECTS[@]} -gt 0 ]; then
    echo "❌ Missing critical database objects: ${MISSING_OBJECTS[*]}"
    echo "🔧 Database migration may have failed. Please check the logs above."
    exit 1
else
    echo "✅ All critical database objects exist"
fi

echo "✅ Test environment ready!"