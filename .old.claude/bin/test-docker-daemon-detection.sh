#!/bin/bash

# Test script for Docker daemon detection functionality
# This script tests various scenarios for the enhanced docker-health-wrapper.sh

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly WRAPPER_SCRIPT="$SCRIPT_DIR/docker-health-wrapper.sh"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

echo -e "${BLUE}=== Docker Daemon Detection Test Suite ===${NC}"
echo

# Test 1: Normal operation with debug
echo -e "${YELLOW}Test 1: Normal operation with debug${NC}"
echo "Command: $WRAPPER_SCRIPT --debug"
if "$WRAPPER_SCRIPT" --debug; then
    echo -e "${GREEN}✓ Test 1 PASSED${NC}"
else
    echo -e "${RED}✗ Test 1 FAILED${NC}"
fi
echo

# Test 2: Performance test
echo -e "${YELLOW}Test 2: Performance test (should complete in <500ms)${NC}"
echo "Command: time $WRAPPER_SCRIPT"
start_time=$(date +%s%3N)
if "$WRAPPER_SCRIPT" >/dev/null 2>&1; then
    end_time=$(date +%s%3N)
    elapsed=$((end_time - start_time))
    echo "Elapsed time: ${elapsed}ms"
    if [ "$elapsed" -lt 500 ]; then
        echo -e "${GREEN}✓ Test 2 PASSED (${elapsed}ms < 500ms)${NC}"
    else
        echo -e "${RED}✗ Test 2 FAILED (${elapsed}ms >= 500ms)${NC}"
    fi
else
    echo -e "${RED}✗ Test 2 FAILED (script error)${NC}"
fi
echo

# Test 3: Custom timeout
echo -e "${YELLOW}Test 3: Custom timeout (100ms)${NC}"
echo "Command: DOCKER_TIMEOUT=100 $WRAPPER_SCRIPT --debug"
if DOCKER_TIMEOUT=100 "$WRAPPER_SCRIPT" --debug >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 3 PASSED${NC}"
else
    echo -e "${RED}✗ Test 3 FAILED${NC}"
fi
echo

# Test 4: Help and version
echo -e "${YELLOW}Test 4: Help and version commands${NC}"
echo "Testing --help:"
if "$WRAPPER_SCRIPT" --help | grep -q "Docker Health Monitoring Wrapper"; then
    echo -e "${GREEN}✓ Help output PASSED${NC}"
else
    echo -e "${RED}✗ Help output FAILED${NC}"
fi

echo "Testing --version:"
if "$WRAPPER_SCRIPT" --version | grep -q "version"; then
    echo -e "${GREEN}✓ Version output PASSED${NC}"
else
    echo -e "${RED}✗ Version output FAILED${NC}"
fi
echo

# Test 5: Exit codes
echo -e "${YELLOW}Test 5: Exit codes validation${NC}"
echo "Testing successful execution (exit code 0):"
if "$WRAPPER_SCRIPT" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Exit code 0 PASSED${NC}"
else
    echo -e "${RED}✗ Exit code 0 FAILED${NC}"
fi
echo

# Test 6: Docker environment detection
echo -e "${YELLOW}Test 6: Docker environment detection${NC}"
echo "Checking if Docker environment is properly detected:"
if "$WRAPPER_SCRIPT" --debug 2>&1 | grep -o "Docker environment detected: .*" | head -1; then
    echo -e "${GREEN}✓ Environment detection PASSED${NC}"
else
    echo -e "${RED}✗ Environment detection FAILED${NC}"
fi
echo

echo -e "${BLUE}=== Test Suite Complete ===${NC}"
echo
echo "All tests that could be run have been executed."
echo "Note: Some failure scenarios (Docker stopped, permission errors) are not tested"
echo "      to avoid potentially disrupting the system state."