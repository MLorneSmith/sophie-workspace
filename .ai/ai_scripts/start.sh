#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting SlideHeroes Development Environment...${NC}"

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Check if .env.local exists in apps/web
if [ ! -f "$PROJECT_ROOT/apps/web/.env.local" ]; then
    echo -e "${RED}Warning: No .env.local file found in apps/web/.${NC}"
    echo "Please:"
    echo "  1. cd apps/web"
    echo "  2. cp .env.example .env.local"
    echo "  3. Edit .env.local and add your API keys"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down services...${NC}"

    # Kill all child processes
    jobs -p | xargs -r kill 2>/dev/null

    # Wait for processes to terminate
    wait

    echo -e "${GREEN}Services stopped successfully.${NC}"
    exit 0
}

# Trap EXIT, INT, and TERM signals
trap cleanup EXIT INT TERM

# Start Supabase
echo -e "${GREEN}Starting Supabase...${NC}"
cd "$PROJECT_ROOT/apps/web"

# Check if Supabase is already running
if ! npx supabase status &> /dev/null; then
    echo "Starting Supabase services..."
    npx supabase start
    SUPABASE_START=$?

    if [ $SUPABASE_START -ne 0 ]; then
        echo -e "${RED}Supabase failed to start!${NC}"
        echo "Try running: cd apps/web && npx supabase start"
        exit 1
    fi
else
    echo -e "${YELLOW}Supabase is already running${NC}"
fi

# Wait for Supabase to be fully ready
echo "Waiting for Supabase to be ready..."
sleep 3

# Display Supabase connection info
echo -e "${GREEN}Supabase Status:${NC}"
npx supabase status

# Start Payload CMS (optional - runs on port 3020)
echo -e "\n${GREEN}Starting Payload CMS...${NC}"
cd "$PROJECT_ROOT/apps/payload"
pnpm dev &
PAYLOAD_PID=$!

# Wait for Payload to start
sleep 3

# Check if Payload is running
if ! kill -0 $PAYLOAD_PID 2>/dev/null; then
    echo -e "${YELLOW}Warning: Payload CMS failed to start (this is optional)${NC}"
else
    echo -e "${GREEN} Payload CMS started on port 3020${NC}"
fi

# Start Next.js web application
echo -e "${GREEN}Starting Next.js web application...${NC}"
cd "$PROJECT_ROOT"
pnpm dev &
WEB_PID=$!

# Wait for Next.js to start
echo "Waiting for Next.js to start..."
sleep 5

# Check if Next.js is running
if ! kill -0 $WEB_PID 2>/dev/null; then
    echo -e "${RED}Next.js failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN} Services started successfully!${NC}"
echo ""
echo -e "${BLUE}${NC}"
echo -e "${GREEN}SlideHeroes Development Environment${NC}"
echo -e "${BLUE}${NC}"
echo -e "${BLUE}Web App:        ${NC}http://localhost:3000"
echo -e "${BLUE}Payload CMS:    ${NC}http://localhost:3020"
echo -e "${BLUE}Supabase API:   ${NC}http://localhost:54521"
echo -e "${BLUE}Supabase Studio:${NC}http://localhost:54523"
echo -e "${BLUE}PostgreSQL:     ${NC}postgresql://postgres:postgres@localhost:54522/postgres"
echo -e "${BLUE}${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}"

# Wait for user to press Ctrl+C
wait
