#!/bin/bash

# Wrapper script to track build status
# This wraps the actual build command and tracks its success/failure

TRACK_SCRIPT="$(dirname "$0")/track-build.sh"

# Load environment variables from .env if it exists
# Use a safer approach to load only the TURBO_REMOTE_CACHE_SIGNATURE_KEY
if [ -f .env ]; then
    export TURBO_REMOTE_CACHE_SIGNATURE_KEY=$(grep "^TURBO_REMOTE_CACHE_SIGNATURE_KEY=" .env | cut -d'=' -f2-)
fi

# Set GIT_HASH environment variable for the build process
# This prevents warnings about missing git hash in production builds
if [ -z "$GIT_HASH" ] && command -v git &> /dev/null; then
    export GIT_HASH=$(git log --pretty=format:"%h" -n1 2>/dev/null || echo "")
fi

# Run the actual build command (turbo build with cache)
turbo build --cache-dir=.turbo

# Capture exit code
BUILD_EXIT_CODE=$?

# Track the build status
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    "$TRACK_SCRIPT" success
else
    # Try to count errors from output (this is a simplified approach)
    "$TRACK_SCRIPT" failed $BUILD_EXIT_CODE
fi

# Exit with the same code as the build
exit $BUILD_EXIT_CODE