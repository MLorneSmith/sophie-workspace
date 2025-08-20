#!/bin/bash

# Wrapper script to track typecheck status
TRACK_SCRIPT="$(dirname "$0")/track-build.sh"

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
else
    "$TRACK_SCRIPT" success
fi

exit $EXIT_CODE