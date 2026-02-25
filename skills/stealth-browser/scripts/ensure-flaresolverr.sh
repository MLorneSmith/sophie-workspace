#!/bin/bash
# Ensure FlareSolverr is running on port 8191. Idempotent — safe to call repeatedly.
set -e

# Check if already running
if curl -s http://localhost:8191/v1 -X POST -H "Content-Type: application/json" \
    -d '{"cmd":"sessions.list"}' 2>/dev/null | grep -q '"ok"'; then
  echo "FlareSolverr already running on :8191"
  exit 0
fi

# Check FlareSolverr is installed
if [ ! -d /tmp/FlareSolverr ]; then
  echo "FlareSolverr not found. Run setup.sh first."
  exit 1
fi

# Kill any stale Xvfb on display :99
pkill -f "Xvfb :99" 2>/dev/null || true
sleep 1

# Start Xvfb virtual display
Xvfb :99 -screen 0 1920x1080x24 &>/dev/null &
XVFB_PID=$!
sleep 2

# Start FlareSolverr
DISPLAY=:99 python3 /tmp/FlareSolverr/src/flaresolverr.py &>/tmp/flaresolverr.log &
FS_PID=$!

# Wait for it to be ready
for i in {1..15}; do
  if curl -s http://localhost:8191/v1 -X POST -H "Content-Type: application/json" \
      -d '{"cmd":"sessions.list"}' 2>/dev/null | grep -q '"ok"'; then
    echo "FlareSolverr started (PID $FS_PID, Xvfb PID $XVFB_PID)"
    exit 0
  fi
  sleep 1
done

echo "FlareSolverr failed to start. Check /tmp/flaresolverr.log"
exit 1
