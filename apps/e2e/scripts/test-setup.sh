#!/bin/bash

echo "🧹 Cleaning up existing processes..."

# Kill any existing Playwright test processes
pkill -f "playwright test" || true

# Kill any Node processes on common test ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

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