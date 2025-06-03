#!/bin/bash
# WSL-optimized startup script for Payload

echo "🚀 Starting Payload with WSL optimizations..."

# Set WSL-specific environment variables
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=3000
export NEXT_TELEMETRY_DISABLED=1

# Disable some Next.js features that slow down on WSL
export NEXT_DISABLE_SWC_WASM=1
export NEXT_DISABLE_MINIFICATION=1

# Use Node.js directly instead of npm scripts
echo "📦 Starting Next.js server on port 3020..."
exec node_modules/.bin/next dev --port 3020