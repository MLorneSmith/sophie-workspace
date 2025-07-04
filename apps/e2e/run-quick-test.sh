#!/bin/bash
echo "Quick E2E Test Runner"
echo "===================="

# Check if web app is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Web app is not running on port 3000"
    echo ""
    echo "IMPORTANT: The web app MUST be started with test environment variables!"
    echo "Please start it with: cd apps/web && pnpm dev:test"
    echo ""
    echo "This ensures emails are sent to local Supabase instead of production."
    exit 1
fi

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54324 > /dev/null; then
    echo "❌ Supabase email service is not running"
    echo "Please start it with: npx supabase start"
    exit 1
fi

echo "✅ Services are running"
echo "🧪 Running auth test..."

# Run just the first auth test
npx playwright test tests/authentication/auth.spec.ts:17 --reporter=list

echo "Done!"