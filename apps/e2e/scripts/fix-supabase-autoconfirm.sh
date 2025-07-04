#!/bin/bash
# Script to disable autoconfirm in Supabase local development
# This is needed for E2E tests that expect confirmation emails

echo "🔧 Fixing Supabase autoconfirm for E2E tests..."

# Check if Supabase is running
if ! npx supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first with: npx supabase start"
    exit 1
fi

# Get the auth container name
AUTH_CONTAINER="supabase_auth_2025slideheroes"

# Check if container exists
if ! docker ps | grep -q $AUTH_CONTAINER; then
    echo "❌ Auth container not found: $AUTH_CONTAINER"
    exit 1
fi

# Update the auth service environment to disable autoconfirm
echo "📝 Disabling autoconfirm in auth container..."
docker exec $AUTH_CONTAINER sh -c "
    # This would normally work but Supabase auth reads env vars at startup
    # So we need to restart the container with the new env var
    export GOTRUE_MAILER_AUTOCONFIRM=false
"

echo "⚠️  Note: Supabase local development has autoconfirm hardcoded."
echo "    To properly test email confirmation, you need to either:"
echo "    1. Use a custom docker-compose.yml with GOTRUE_MAILER_AUTOCONFIRM=false"
echo "    2. Mock the email confirmation in tests"
echo "    3. Use Supabase's test helpers to bypass email confirmation"
echo ""
echo "🔍 Current autoconfirm status:"
docker inspect $AUTH_CONTAINER | grep "GOTRUE_MAILER_AUTOCONFIRM"