#!/bin/bash

# Setup GitHub CLI authentication

echo "Setting up GitHub CLI authentication..."

# Check if .env.local exists and has a token
if [ -f .env.local ]; then
    # Source the .env.local file
    export $(grep -v '^#' .env.local | xargs)
    
    if [ -n "$GITHUB_TOKEN" ] && [ "$GITHUB_TOKEN" != "your_github_personal_access_token_here" ]; then
        echo "Found GITHUB_TOKEN in .env.local"
        # Export as GH_TOKEN for GitHub CLI
        export GH_TOKEN="$GITHUB_TOKEN"
        
        # Test the authentication
        if gh auth status &>/dev/null; then
            echo "✅ GitHub CLI is now authenticated!"
            gh auth status
        else
            echo "❌ Failed to authenticate. Please check your token."
        fi
    else
        echo "❌ No valid GITHUB_TOKEN found in .env.local"
        echo ""
        echo "Please follow these steps:"
        echo "1. Go to https://github.com/settings/tokens"
        echo "2. Generate a new token with scopes: repo, workflow, read:org"
        echo "3. Copy the token and update .env.local:"
        echo "   GITHUB_TOKEN=your_actual_token_here"
        echo "4. Run this script again"
    fi
else
    echo "❌ .env.local file not found"
    echo "Creating .env.local with template..."
    cat > .env.local << 'EOF'
# GitHub CLI Token
# Generate a token at: https://github.com/settings/tokens
# Required scopes: repo, workflow, read:org (for private repos)
GITHUB_TOKEN=your_github_personal_access_token_here
EOF
    echo "✅ Created .env.local"
    echo "Please update it with your GitHub token and run this script again."
fi