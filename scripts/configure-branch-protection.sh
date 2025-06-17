#!/bin/bash

# Configure Branch Protection Rules for SlideHeroes
# This script sets up protection rules for main, staging, and dev branches

REPO="MLorneSmith/2025slideheroes"
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set"
    exit 1
fi

echo "🔒 Configuring branch protection rules for $REPO"

# Function to configure branch protection
configure_branch_protection() {
    local branch=$1
    local required_reviews=$2
    local dismiss_stale_reviews=$3
    local require_code_owner_reviews=$4
    
    echo "Configuring protection for branch: $branch"
    
    # Prepare the JSON payload
    local payload=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["PR Status Check"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": $required_reviews,
    "dismiss_stale_reviews": $dismiss_stale_reviews,
    "require_code_owner_reviews": $require_code_owner_reviews
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": true,
  "allow_auto_merge": false,
  "delete_branch_on_merge": true
}
EOF
)
    
    # Apply branch protection
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "https://api.github.com/repos/$REPO/branches/$branch/protection")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ Successfully configured protection for $branch"
    else
        echo "❌ Failed to configure protection for $branch (HTTP $http_code)"
        echo "Response: $body"
    fi
}

# Configure main branch (2 reviews required)
configure_branch_protection "main" 2 true false

# Configure staging branch (1 review required)
configure_branch_protection "staging" 1 true false

# Configure dev branch (0 reviews required - status checks only)
# For dev, we need a different payload without required reviews
echo "Configuring protection for branch: dev"
dev_payload=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["PR Status Check"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": true,
  "allow_auto_merge": false,
  "delete_branch_on_merge": true
}
EOF
)

response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "$dev_payload" \
    "https://api.github.com/repos/$REPO/branches/dev/protection")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "✅ Successfully configured protection for dev"
else
    echo "❌ Failed to configure protection for dev (HTTP $http_code)"
    echo "Response: $body"
fi

echo ""
echo "🎉 Branch protection configuration complete!"
echo ""
echo "Summary:"
echo "- main: 2 reviews required, linear history, dismiss stale reviews"
echo "- staging: 1 review required, linear history, dismiss stale reviews"
echo "- dev: Status checks only, linear history"