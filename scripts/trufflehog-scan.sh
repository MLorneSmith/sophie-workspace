#!/bin/bash
# TruffleHog pre-commit scanner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Running TruffleHog secret scan...${NC}"

# Check if TruffleHog is installed
if ! command -v trufflehog &> /dev/null; then
    # Check if it's in local bin
    if [ -f "$HOME/.local/bin/trufflehog" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo -e "${YELLOW}📦 TruffleHog not found. Installing...${NC}"
        
        # Install TruffleHog locally
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
        
        # Install using the official script
        curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b "$INSTALL_DIR"
        
        # Add to PATH for this session
        export PATH="$INSTALL_DIR:$PATH"
        
        echo -e "${GREEN}✅ TruffleHog installed successfully${NC}"
    fi
fi

# Run TruffleHog using the recommended approach from documentation
# Scan from HEAD to check staged changes
# Use exclusion file if it exists
EXCLUDE_ARGS=""
if [ -f ".trufflehogexclude" ]; then
    EXCLUDE_ARGS="--exclude-paths .trufflehogexclude"
fi

trufflehog git file://. \
    --since-commit HEAD \
    --results=verified,unknown \
    --fail \
    --no-update \
    $EXCLUDE_ARGS 2>&1 | while IFS= read -r line; do
    # Check if it's a finding
    if echo "$line" | grep -q "Found verified result" || echo "$line" | grep -q "Found unverified result"; then
        echo -e "${RED}$line${NC}"
    else
        echo "$line"
    fi
done

# Check exit status
EXIT_STATUS=${PIPESTATUS[0]}

if [ $EXIT_STATUS -eq 183 ]; then
    echo ""
    echo -e "${RED}❌ Secrets detected in staged changes!${NC}"
    echo ""
    echo -e "${YELLOW}How to fix:${NC}"
    echo "1. Remove the secret from your code"
    echo "2. Use environment variables instead"
    echo "3. If it's a false positive, add to .secretsignore"
    echo ""
    echo "For more info: see .claude/docs/security/secret-management.md"
    exit 1
elif [ $EXIT_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets detected.${NC}"
    exit 0
else
    echo -e "${RED}❌ TruffleHog scan failed with error code: $EXIT_STATUS${NC}"
    exit $EXIT_STATUS
fi