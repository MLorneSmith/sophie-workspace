#!/bin/bash
# Install all dependencies for stealth-browser skill
set -e

echo "=== Stealth Browser Setup ==="

# Python packages
echo "Installing Python packages..."
pip3 install --user --break-system-packages \
  undetected-chromedriver \
  xvfbwrapper \
  selenium \
  bottle \
  waitress \
  func-timeout \
  prometheus-client \
  2>&1 | tail -3

# Check for Xvfb
if ! command -v xvfb-run &>/dev/null; then
  echo "Installing Xvfb..."
  sudo apt-get install -y xvfb 2>&1 | tail -3
fi

# Check for Chrome/Chromium
if ! command -v google-chrome &>/dev/null && ! command -v chromium-browser &>/dev/null; then
  echo "WARNING: No Chrome/Chromium found. Install google-chrome-stable or chromium-browser."
fi

# Clone FlareSolverr if not present
if [ ! -d /tmp/FlareSolverr ]; then
  echo "Cloning FlareSolverr..."
  git clone --depth 1 https://github.com/FlareSolverr/FlareSolverr.git /tmp/FlareSolverr 2>&1 | tail -3
fi

echo "=== Setup Complete ==="
echo "Run 'scripts/ensure-flaresolverr.sh' to start FlareSolverr on port 8191"
