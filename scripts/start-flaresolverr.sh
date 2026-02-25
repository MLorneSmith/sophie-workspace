#!/bin/bash
# Start Xvfb virtual display then FlareSolverr
Xvfb :99 -screen 0 1920x1080x24 &
sleep 2
DISPLAY=:99 python3 /tmp/FlareSolverr/src/flaresolverr.py
