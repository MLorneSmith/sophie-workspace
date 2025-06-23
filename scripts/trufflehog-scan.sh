#!/bin/bash
# TruffleHog pre-commit scanner for staged files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Running TruffleHog secret scan on staged files...${NC}"

# Check if TruffleHog is installed
if ! command -v trufflehog &> /dev/null; then
    echo -e "${YELLOW}📦 TruffleHog not found. Installing...${NC}"
    
    # Detect OS and install TruffleHog
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install trufflehog
        else
            curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
    else
        echo -e "${RED}❌ Unsupported OS. Please install TruffleHog manually.${NC}"
        echo "Visit: https://github.com/trufflesecurity/trufflehog#installation"
        exit 1
    fi
fi

# Get the list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✅ No staged files to scan.${NC}"
    exit 0
fi

# Create a temporary file to store results
TEMP_RESULTS=$(mktemp)

# Initialize secret found flag
SECRETS_FOUND=false

# Scan each staged file
for FILE in $STAGED_FILES; do
    # Skip binary files and excluded patterns
    if [[ "$FILE" =~ \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip|tar|gz)$ ]]; then
        continue
    fi
    
    # Skip files in .secretsignore patterns
    if grep -qE "^${FILE}$|^\*\*/${FILE##*/}$" .secretsignore 2>/dev/null; then
        continue
    fi
    
    # Get the staged content
    CONTENT=$(git show ":${FILE}" 2>/dev/null || true)
    
    if [ -z "$CONTENT" ]; then
        continue
    fi
    
    # Create temp file with staged content
    TEMP_FILE=$(mktemp)
    echo "$CONTENT" > "$TEMP_FILE"
    
    # Run TruffleHog on the file
    if trufflehog filesystem "$TEMP_FILE" \
        --config=.trufflehog/config.yaml \
        --only-verified \
        --json \
        --no-update \
        2>/dev/null >> "$TEMP_RESULTS"; then
        # Check if any results were found
        if [ -s "$TEMP_RESULTS" ]; then
            SECRETS_FOUND=true
            echo -e "${RED}⚠️  Potential secret found in: $FILE${NC}"
        fi
    fi
    
    # Clean up temp file
    rm -f "$TEMP_FILE"
done

# Check if any secrets were found
if [ "$SECRETS_FOUND" = true ]; then
    echo -e "${RED}❌ Secrets detected in staged files!${NC}"
    echo ""
    echo "Review the following findings:"
    
    # Parse and display results
    if command -v jq &> /dev/null; then
        jq -r '.Raw // .StructuredData // .MetaData' "$TEMP_RESULTS" 2>/dev/null || cat "$TEMP_RESULTS"
    else
        cat "$TEMP_RESULTS"
    fi
    
    echo ""
    echo -e "${YELLOW}How to fix:${NC}"
    echo "1. Remove the secret from your code"
    echo "2. Use environment variables instead"
    echo "3. If it's a false positive, add to .secretsignore"
    echo ""
    echo "For more info: https://github.com/trufflesecurity/trufflehog"
    
    # Clean up
    rm -f "$TEMP_RESULTS"
    
    exit 1
else
    echo -e "${GREEN}✅ No secrets detected in staged files.${NC}"
    rm -f "$TEMP_RESULTS"
    exit 0
fi