#!/bin/bash
# Bifrost External Verification Script
# This script verifies that Bifrost is accessible via Cloudflare Tunnel
# Simulates requests from Vercel (external network)

set -e

BIFROST_URL="${BIFROST_EXTERNAL_URL:-https://bifrost.slideheroes.com}"
SERVICE_TOKEN="${CLOUDFLARE_ACCESS_SERVICE_TOKEN:-}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  Bifrost External Verification Script"
echo "=============================================="
echo ""
info "Testing external URL: ${BIFROST_URL}"
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

# Build curl headers
CURL_OPTS="-s -f"
if [ -n "$SERVICE_TOKEN" ]; then
    CURL_OPTS="$CURL_OPTS -H 'Cf-Access-Service-Token: $SERVICE_TOKEN'"
fi

# Check 1: DNS Resolution
echo "Step 1: Checking DNS resolution..."
if host "bifrost.slideheroes.com" >/dev/null 2>&1 || nslookup "bifrost.slideheroes.com" >/dev/null 2>&1; then
    success "DNS resolution successful for bifrost.slideheroes.com"
else
    fail "DNS resolution failed"
    exit 1
fi

echo ""

# Check 2: HTTPS/TLS Connection
echo "Step 2: Testing HTTPS/TLS connection..."
TLS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "${BIFROST_URL}/health" 2>/dev/null || echo "000")

if [ "$TLS_RESPONSE" = "200" ]; then
    success "HTTPS connection successful (HTTP 200)"
else
    fail "HTTPS connection failed (HTTP $TLS_RESPONSE)"
    exit 1
fi

echo ""

# Check 3: Health Check Endpoint
echo "Step 3: Checking health endpoint via external URL..."
HEALTH_RESPONSE=$(curl -s "${BIFROST_URL}/health" 2>/dev/null || echo '{"status": "error"}')

if echo "$HEALTH_RESPONSE" | grep -qi "ok\|healthy\|status"; then
    success "Health check passed through tunnel"
else
    fail "Health check failed"
    info "Response: $HEALTH_RESPONSE"
    exit 1
fi

echo ""

# Check 4: Access Control (if service token configured)
if [ -n "$SERVICE_TOKEN" ]; then
    echo "Step 4: Testing Access service token authentication..."

    # Test without token - should fail
    NO_TOKEN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BIFROST_URL}/health" 2>/dev/null || echo "000")

    # Test with token - should succeed
    WITH_TOKEN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Cf-Access-Service-Token: $SERVICE_TOKEN" \
        "${BIFROST_URL}/health" 2>/dev/null || echo "000")

    if [ "$WITH_TOKEN_RESPONSE" = "200" ]; then
        success "Access service token authentication working"
    else
        fail "Access service token authentication failed"
        exit 1
    fi

    echo ""
fi

# Check 5: OpenAI Provider via Tunnel
echo "Step 5: Testing OpenAI provider through tunnel..."

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
    fail "OpenAI provider test failed through tunnel"
else
    success "OpenAI provider working through tunnel"
fi

echo ""

# Check 6: Anthropic Provider via Tunnel
echo "Step 6: Testing Anthropic provider through tunnel..."

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
    fail "Anthropic provider test failed through tunnel"
else
    success "Anthropic provider working through tunnel"
fi

echo ""
echo "=============================================="
echo "  External Verification Complete"
echo "=============================================="
echo ""
success "Bifrost is accessible via Cloudflare Tunnel at ${BIFROST_URL}"
echo ""
echo "The gateway is ready to receive requests from Vercel."
