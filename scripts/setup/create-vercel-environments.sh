#!/bin/bash

# Create Custom Vercel Environments
# This script creates staging and development custom environments in Vercel

set -e

echo "🏗️ Creating custom Vercel environments..."

# Check if Vercel CLI is installed and user is logged in
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN environment variable not set."
    echo "💡 Get your token from: https://vercel.com/account/tokens"
    echo "💡 Then run: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

echo "🔐 Authenticating with Vercel..."

# Get project info using API
echo "📋 Getting project information..."
PROJECTS_RESPONSE=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects")

# Extract project ID for slideheroes project
PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.projects[] | select(.name | test("slideheroes|SlideHeroes|2025slideheroes"; "i")) | .id' | head -1)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    echo "❌ SlideHeroes project not found in your Vercel account."
    echo "💡 Available projects:"
    echo "$PROJECTS_RESPONSE" | jq -r '.projects[].name' 2>/dev/null | head -5
    echo "💡 Make sure your project is deployed to Vercel and linked to your GitHub repo."
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Function to create custom environment
create_custom_environment() {
    local env_name=$1
    local env_description=$2
    
    echo "🔨 Creating $env_name environment..."
    
    # Use Vercel API to create custom environment
    response=$(curl -s -X POST \
        "https://api.vercel.com/v9/projects/$PROJECT_ID/custom-environments" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"slug\": \"$env_name\",
            \"description\": \"$env_description\"
        }")
    
    if echo "$response" | grep -q '"slug"'; then
        echo "✅ Successfully created $env_name environment"
    else
        echo "⚠️ Environment $env_name may already exist or there was an error:"
        echo "$response" | jq -r '.error.message // "Unknown error"' 2>/dev/null || echo "$response"
    fi
}

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN environment variable not set."
    echo "💡 Get your token from: https://vercel.com/account/tokens"
    echo "💡 Then run: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

# Create custom environments
create_custom_environment "staging" "Staging environment for pre-production testing"
create_custom_environment "development" "Development environment for ongoing development"

echo ""
echo "✅ Custom environment creation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables for each environment in Vercel dashboard"
echo "2. Set up custom domains for each environment"
echo "3. Update deployment workflows to target custom environments"
echo "4. Test deployments to each environment"
echo ""
echo "🔗 Manage environments: https://vercel.com/dashboard/$PROJECT_ID/settings/environments"