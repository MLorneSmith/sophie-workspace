#!/bin/bash

echo "🔍 E2E Test Environment Status Check"
echo "===================================="

# Check Supabase status
echo -e "\n📦 Supabase Status:"
npx supabase status 2>/dev/null | grep -E "(API URL|REST|Auth|Realtime|GraphQL|Storage|Database)" || echo "  ❌ Supabase not running"

# Check E2E Supabase status (port 55321)
echo -e "\n📦 E2E Supabase Status (Port 55321):"
if curl -s http://127.0.0.1:55321/rest/v1/ > /dev/null 2>&1; then
  echo "  ✅ E2E Supabase API is responding"
else
  echo "  ❌ E2E Supabase API is not responding"
fi

# Check environment variables
echo -e "\n🔐 Environment Configuration:"
if [ -f apps/web/.env.test ]; then
  echo "  ✅ .env.test exists"
  echo -n "  Auth enabled: "
  grep -q "NEXT_PUBLIC_AUTH_PASSWORD=true" apps/web/.env.test && echo "✅" || echo "❌"
  echo -n "  Product name: "
  grep -q "NEXT_PUBLIC_PRODUCT_NAME" apps/web/.env.test && echo "✅" || echo "❌"
  echo -n "  Site URL: "
  grep -q "NEXT_PUBLIC_SITE_URL" apps/web/.env.test && echo "✅" || echo "❌"
else
  echo "  ❌ .env.test missing"
fi

# Check for running processes
echo -e "\n🔄 Running Processes:"
NEXT_PROCESSES=$(ps aux | grep -E "next dev" | grep -v grep | wc -l)
echo "  Next.js servers: $NEXT_PROCESSES"
PLAYWRIGHT_PROCESSES=$(ps aux | grep -E "playwright" | grep -v grep | wc -l)
echo "  Playwright processes: $PLAYWRIGHT_PROCESSES"

# Check test data
echo -e "\n🗄️ Test Database Status:"
if [ -n "$(docker ps | grep supabase_db_2025slideheroes-e2e)" ]; then
  echo "  ✅ E2E database container running"
  
  # Check for test users
  docker exec supabase_db_2025slideheroes-e2e psql -U postgres -c "SELECT COUNT(*) as user_count FROM auth.users;" 2>/dev/null | grep -E "[0-9]+" | head -1 | awk '{print "  Test users in DB: " $1}'
else
  echo "  ❌ E2E database container not running"
fi

echo -e "\n✨ Quick Test Commands:"
echo "  • Run auth tests:  pnpm --filter web-e2e test authentication"
echo "  • Run smoke tests: pnpm --filter web-e2e test smoke"
echo "  • Run all E2E:     pnpm test:e2e"
echo "  • Check logs:      docker logs supabase_db_2025slideheroes-e2e --tail 20"