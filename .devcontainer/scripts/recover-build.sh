#!/bin/bash
# Recovery script for stuck or failed builds

set -e

echo "🔧 Recovering from stuck build..."

# Kill any stuck processes
echo "Stopping stuck processes..."
ps aux | grep -E "docker.compose|docker-compose|pnpm|npm" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# Clean Docker if available
if command -v docker >/dev/null 2>&1; then
    echo "Cleaning Docker..."
    docker compose down 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
fi

# Clear pnpm cache
echo "Clearing pnpm cache..."
rm -rf /workspace/node_modules/.pnpm 2>/dev/null || true
rm -rf /home/node/.pnpm-store 2>/dev/null || true

# Fix permissions
echo "Fixing permissions..."
sudo chown -R node:node /workspace 2>/dev/null || true

# Reinstall dependencies
echo "Reinstalling dependencies..."
cd /workspace
pnpm install --force

echo "✅ Recovery complete! You can now run: pnpm dev"