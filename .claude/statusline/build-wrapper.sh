#!/bin/bash

# Wrapper script to track build status
# This wraps the actual build command and tracks its success/failure

TRACK_SCRIPT="$(dirname "$0")/track-build.sh"

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