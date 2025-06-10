#!/bin/bash

# Script to create technical domain labels for AAFD v2.0 methodology
# Usage: ./scripts/create-domain-labels.sh

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set"
    echo "Please set your GitHub token: export GITHUB_TOKEN=your_token_here"
    exit 1
fi

REPO_OWNER="MLorneSmith"
REPO_NAME="2025slideheroes"
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/labels"

# Define labels with colors
declare -a LABELS=(
    "domain:frontend#0052CC#React components, UI, frontend development"
    "domain:backend#B60205#Server actions, APIs, backend development" 
    "domain:database#5319E7#Schema changes, queries, database operations"
    "domain:ai#FF6B35#AI integration, prompts, machine learning"
    "domain:devops#28A745#Build, deployment, infrastructure"
    "domain:testing#FFEB3B#Test implementation, quality assurance"
)

echo "Creating technical domain labels for AAFD v2.0..."

for label_info in "${LABELS[@]}"; do
    IFS='#' read -r name color description <<< "$label_info"
    
    echo "Creating label: $name"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "$API_URL" \
        -d "{
            \"name\": \"$name\",
            \"color\": \"$color\",
            \"description\": \"$description\"
        }")
    
    if [ "$response" -eq 201 ]; then
        echo "✅ Successfully created: $name"
    elif [ "$response" -eq 422 ]; then
        echo "⚠️  Label already exists: $name"
    else
        echo "❌ Failed to create: $name (HTTP $response)"
    fi
done

echo ""
echo "🎉 Domain labels setup complete!"
echo ""
echo "Labels created:"
echo "• domain:frontend (Blue) - React components, UI"
echo "• domain:backend (Red) - Server actions, APIs"  
echo "• domain:database (Purple) - Schema changes, queries"
echo "• domain:ai (Orange) - AI integration, prompts"
echo "• domain:devops (Green) - Build, deployment"
echo "• domain:testing (Yellow) - Test implementation"
echo ""
echo "These labels can now be used in your GitHub issues and will integrate with your AAFD v2.0 GitHub Projects workflow."