#!/bin/bash
# Bifrost Local Verification Script
# This script verifies that Bifrost is running correctly on the local EC2 instance

set -e

BIFROST_URL="${BIFROST_URL:-http://localhost:8080}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  Bifrost Local Verification Script"
echo "=============================================="
echo ""

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print failure
fail() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check 1: Health Check Endpoint
echo "Step 1: Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BIFROST_URL}/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    success "Health check passed (HTTP 200)"
else
    fail "Health check failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

echo ""

# Check 2: OpenAI Provider Test
echo "Step 2: Testing OpenAI provider (openai/gpt-4o-mini)..."

OPENAI_RESPONSE=$(curl -s -X POST "${BIFROST_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say 'test' and nothing else"}],
    "max_tokens": 10
  }' 2>/dev/null || echo '{"error": "connection failed"}')

if echo "$OPENAI_RESPONSE" | grep -q '"error"'; then
    info "OpenAI test response: $OPENAI_RESPONSE"
    # Note: This may fail if API key is not configured, which is expected before deployment
    fail "OpenAI provider test failed (may need valid API key)"
else
    success "OpenAI provider responded successfully"
fi

echo ""

# Check 3: Anthropic Provider Test
echo "Step 3: Testing Anthropic provider (anthropic/claude-3-5-sonnet)..."

ANTHROPIC_RESPONSE=$(curl -s -X POST "${BIFROST_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d '{
    "model": "anthropic/claude-3-5-sonnet-20241022",
    "messages": [{"role": "user", "content": "Say 'test' and nothing else"}],
    "max_tokens": 10
  }' 2>/dev/null || echo '{"error": "connection failed"}')

if echo "$ANTHROPIC_RESPONSE" | grep -q '"error"'; then
    info "Anthropic test response: $ANTHROPIC_RESPONSE"
    # Note: This may fail if API key is not configured, which is expected before deployment
    fail "Anthropic provider test failed (may need valid API key)"
else
    success "Anthropic provider responded successfully"
fi

echo ""

# Check 4: Docker Container Status
echo "Step 4: Checking Docker container status..."
if docker ps --format '{{.Names}}' | grep -q "bifrost"; then
    success "Bifrost container is running"
else
    fail "Bifrost container is not running"
    exit 1
fi

echo ""
echo "=============================================="
echo "  Verification Complete"
echo "=============================================="
echo ""
info "Bifrost is running on ${BIFROST_URL}"
echo ""
echo "Note: Provider tests may fail if API keys are not configured."
echo "Ensure OPENAI_API_KEY and ANTHROPIC_API_KEY are set in your .env file."
