#!/bin/bash

# Wrapper script to track typecheck status
TRACK_SCRIPT="$(dirname "$0")/track-build.sh"
UPDATE_CODECHECK="$(dirname "$0")/update-codecheck-status.sh"

# Run typecheck and capture output
OUTPUT=$(turbo typecheck --affected --cache-dir=.turbo 2>&1)
EXIT_CODE=$?

# Display the output
echo "$OUTPUT"

# Count TypeScript errors if failed
if [ $EXIT_CODE -ne 0 ]; then
    # Count error occurrences in output
    ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error TS" || echo "1")
    "$TRACK_SCRIPT" failed $ERROR_COUNT
    # Also update codecheck status if running standalone
    if [ -z "$CODECHECK_RUNNING" ]; then
        "$UPDATE_CODECHECK" failed 0 0 $ERROR_COUNT
    fi
else
    "$TRACK_SCRIPT" success
    # Also update codecheck status if running standalone
    if [ -z "$CODECHECK_RUNNING" ]; then
        "$UPDATE_CODECHECK" success 0 0 0
    fi
fi

exit $EXIT_CODE