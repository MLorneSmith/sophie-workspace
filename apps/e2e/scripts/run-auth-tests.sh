#!/bin/bash

# Exit on error
set -e

echo "🧹 Cleaning up existing processes..."

# Kill any existing Next.js dev servers
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Kill any existing Playwright test processes
pkill -f "playwright test" || true

echo "🔍 Checking Supabase status..."
cd /home/msmith/projects/2025slideheroes

# Ensure Supabase is running
if ! npx supabase status > /dev/null 2>&1; then
    echo "🚀 Starting Supabase..."
    npx supabase start
    sleep 5
fi

# Verify email service
if ! curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54324 | grep -q "200"; then
    echo "❌ Email service not accessible, restarting Supabase..."
    npx supabase stop
    npx supabase start
    sleep 10
fi

echo "✅ Supabase ready!"

# Start the web app in test mode
echo "🚀 Starting web app in test mode..."
cd apps/web
NODE_ENV=test pnpm dev > /tmp/web-app.log 2>&1 &
WEB_PID=$!

# Wait for web app to be ready
echo "⏳ Waiting for web app to start..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
        echo "✅ Web app is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Web app failed to start. Check /tmp/web-app.log"
        kill $WEB_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Run the tests
echo "🧪 Running authentication tests..."
cd /home/msmith/projects/2025slideheroes/apps/e2e
pnpm playwright test tests/authentication/auth.spec.ts --reporter=list --max-failures=1

# Cleanup
echo "🧹 Cleaning up..."
kill $WEB_PID 2>/dev/null || true

echo "✅ Done!"