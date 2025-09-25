#!/bin/bash

# Payload CMS E2E Test Runner

echo "🚀 Payload CMS E2E Test Runner"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Payload is running
echo -n "Checking if Payload CMS is running on port 3020... "
if curl -s http://localhost:3020/api/health -o /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}Warning: Payload CMS is not running!${NC}"
    echo "Please start Payload CMS first:"
    echo "  cd apps/payload"
    echo "  npm run dev"
    echo ""
    echo "Or run tests with auto-start (slower):"
    echo "  npm test"
    exit 1
fi

# Check for test type argument
TEST_TYPE=${1:-all}

echo ""
echo "Running tests: $TEST_TYPE"
echo "------------------------"

case $TEST_TYPE in
    auth)
        echo "Running Authentication Tests..."
        npx playwright test payload-auth --config=playwright.config.ts
        ;;
    collections)
        echo "Running Collection Tests..."
        npx playwright test payload-collections --config=playwright.config.ts
        ;;
    database)
        echo "Running Database Tests..."
        npx playwright test payload-database --config=playwright.config.ts
        ;;
    ui)
        echo "Opening UI Mode..."
        npx playwright test --ui --config=playwright.config.ts
        ;;
    debug)
        echo "Running in Debug Mode..."
        npx playwright test --debug --config=playwright.config.ts
        ;;
    all)
        echo "Running All Tests..."
        npx playwright test --config=playwright.config.ts
        ;;
    *)
        echo "Usage: $0 [auth|collections|database|all|ui|debug]"
        exit 1
        ;;
esac

# Show test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Tests passed successfully!${NC}"
    echo ""
    echo "View detailed report with:"
    echo "  npx playwright show-report"
else
    echo ""
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "View detailed report with:"
    echo "  npx playwright show-report"
    echo ""
    echo "Debug failed tests with:"
    echo "  $0 debug"
fi