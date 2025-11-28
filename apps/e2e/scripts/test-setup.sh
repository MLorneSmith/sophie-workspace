#!/bin/bash

echo "🧹 Cleaning up existing processes..."

# Kill any existing Playwright test processes
pkill -f "playwright test" || true

# Kill any Node processes on common test ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Check and handle E2E Supabase port conflicts
echo "🔍 Checking for E2E port conflicts..."

# Define E2E Supabase ports (55321-55327)
E2E_SUPABASE_PORTS=(55321 55322 55323 55324 55325 55326 55327)
PORT_NAMES=("API" "Database" "Studio" "Mailpit Web" "Mailpit SMTP" "Mailpit POP3" "Analytics")

# Check each port for conflicts
PORTS_IN_USE=()
for i in "${!E2E_SUPABASE_PORTS[@]}"; do
    PORT="${E2E_SUPABASE_PORTS[$i]}"
    NAME="${PORT_NAMES[$i]}"
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo "⚠️  E2E Port $PORT ($NAME) is in use"
        PORTS_IN_USE+=($PORT)
    fi
done

# If any E2E Supabase ports are in use, stop existing E2E Supabase instance
if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo "🛑 Stopping existing E2E Supabase instance to free ports..."
    cd /home/msmith/projects/2025slideheroes/apps/e2e
    
    # Try to stop with project ID first
    pnpm supabase stop --project-id 2025slideheroes-e2e 2>/dev/null || true
    
    # Then try regular stop
    pnpm supabase stop 2>/dev/null || true
    
    # Force kill processes if still running
    for PORT in "${PORTS_IN_USE[@]}"; do
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    done
    
    # Wait for ports to be freed
    sleep 2
fi

# Check if E2E Supabase services are accessible and have required data
echo "🔍 Checking E2E Supabase services..."
cd /home/msmith/projects/2025slideheroes/apps/e2e

# Function to check if E2E database has required tables
check_e2e_database_tables() {
    # Check if critical tables/views exist by testing one key table
    if docker exec -i supabase_db_2025slideheroes-e2e psql -U postgres -d postgres -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts');" 2>/dev/null | grep -q "t"; then
        return 0  # Tables exist
    else
        return 1  # Tables don't exist
    fi
}

# Check if E2E API Gateway (Kong) is accessible - this is the main Supabase entry point
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:55321 | grep -q "200\|401\|403"; then
    echo "✅ E2E Supabase API Gateway is accessible"
    
    # Check if database has required tables
    if check_e2e_database_tables; then
        echo "✅ E2E Database has required tables"
        
        # Double-check email service since it's critical for E2E tests
        echo "📧 Checking E2E email service..."
        if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:55324 | grep -q "200"; then
            echo "✅ E2E Email service (Mailpit) is accessible"
        else
            echo "❌ E2E Email service is not accessible but database has data."
            echo "⚠️  Cannot restart E2E Supabase as it would reset the database."
            echo "🔧 Please check E2E email service manually or restart E2E Supabase and reset database using:"
            echo "    cd apps/e2e && pnpm supabase start && pnpm supabase db reset"
            exit 1
        fi
    else
        echo "❌ E2E Database is missing required tables. May need to reset database state."
        echo "🔧 Please run: cd apps/e2e && pnpm supabase db reset"
        exit 1
    fi
else
    echo "🚀 Starting E2E Supabase..."
    pnpm supabase start
    
    # After starting, the database might be empty, so check if reset is needed
    if ! check_e2e_database_tables; then
        echo "⚠️  E2E Database started but is missing required tables."
        echo "🔧 Please run: cd apps/e2e && pnpm supabase db reset"
        exit 1
    fi
fi

# Seed test data for E2E tests
echo "🌱 Seeding E2E test data..."
cd /home/msmith/projects/2025slideheroes/apps/e2e

# Run the test data seeding script
if docker exec -i supabase_db_2025slideheroes-e2e psql -U postgres -d postgres -f /tmp/seed-test-data.sql 2>/dev/null; then
    echo "✅ Test data seeded successfully"
else
    echo "⚠️  Seeding test data (this is normal for first run)"
    # Copy the seeding script to the container and run it
    docker cp scripts/seed-test-data.sql supabase_db_2025slideheroes-e2e:/tmp/seed-test-data.sql
    docker exec -i supabase_db_2025slideheroes-e2e psql -U postgres -d postgres -f /tmp/seed-test-data.sql
fi

# Verify critical tables exist
echo "🔍 Verifying E2E database schema..."
cd /home/msmith/projects/2025slideheroes/apps/e2e

# Check if critical tables/views exist
CRITICAL_OBJECTS=("user_account_workspace" "user_accounts" "testimonials" "accounts")
MISSING_OBJECTS=()

for OBJECT in "${CRITICAL_OBJECTS[@]}"; do
    # Use docker to query the database directly
    EXISTS=$(docker exec -i supabase_db_2025slideheroes-e2e psql -U postgres -d postgres -t -c "SELECT EXISTS (
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
    echo "❌ Missing critical E2E database objects: ${MISSING_OBJECTS[*]}"
    echo "🔧 E2E Database migration may have failed. Please check the logs above."
    exit 1
else
    echo "✅ All critical E2E database objects exist"
fi

echo "✅ E2E Test environment ready!"