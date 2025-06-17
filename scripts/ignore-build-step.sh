#!/bin/bash

# Vercel Ignore Build Step Script
# This script determines whether to skip builds for certain deployments

echo "🔍 Checking if build should be skipped..."

# Get the current branch from Vercel environment or git
BRANCH=${VERCEL_GIT_COMMIT_REF:-$(git rev-parse --abbrev-ref HEAD)}
echo "📋 Current branch: $BRANCH"

# Skip builds for certain file types or paths that don't affect the application
if git diff HEAD^ HEAD --quiet --exit-code -- '*.md' 'docs/' '.github/' '.claude/' 'scripts/' && ! git diff HEAD^ HEAD --quiet --exit-code; then
    echo "📝 Only non-app files changed, skipping build"
    exit 0
fi

# Skip builds for draft PRs (if this information is available)
if [ "$VERCEL_ENV" = "preview" ] && [ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
    # Check if PR is draft (would need GitHub API call)
    echo "🔍 Preview deployment for PR #$VERCEL_GIT_PULL_REQUEST_ID"
fi

# Always build for main, staging, and dev branches
if [[ "$BRANCH" == "main" || "$BRANCH" == "staging" || "$BRANCH" == "dev" ]]; then
    echo "🚀 Building for environment branch: $BRANCH"
    exit 1
fi

# Build for all other cases by default
echo "🏗️ Building deployment"
exit 1