#!/bin/bash
# Check disk space and warn if below threshold
# Usage: check-disk-space.sh [threshold_percent]
# Default threshold: 5%

THRESHOLD=${1:-5}

# Get usage percentage for root filesystem (remove % sign)
USAGE=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
AVAIL=$(df -h / | awk 'NR==2 {print $4}')
FREE_PCT=$((100 - USAGE))

if [ "$FREE_PCT" -lt "$THRESHOLD" ]; then
    echo "⚠️ **DISK SPACE WARNING:** Only ${FREE_PCT}% free (${AVAIL} available) — below ${THRESHOLD}% threshold"
    exit 1
else
    # Silent success - only output on warning
    exit 0
fi
