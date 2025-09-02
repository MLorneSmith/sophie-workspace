#!/bin/bash

# This script runs every time a new terminal is attached to the container

# Quick status check
if [ -f /workspace/.devcontainer/WELCOME.md ] && [ ! -f /tmp/.devcontainer-welcomed ]; then
    # Show welcome message only once per session
    echo ""
    echo "🎯 SlideHeroes Development Container"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Run 'pnpm dev' to start developing"
    echo "  Run 'cat .devcontainer/WELCOME.md' for help"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    touch /tmp/.devcontainer-welcomed
fi

# Ensure we're in the workspace directory
cd /workspace 2>/dev/null || true

# Set up environment if in Codespaces
if [ "$CODESPACES" = "true" ]; then
    # Export Codespaces-specific environment variables
    export NEXT_PUBLIC_SITE_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
    export VITE_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
fi

# Source any local environment overrides
if [ -f /workspace/.env.devcontainer ]; then
    set -a
    source /workspace/.env.devcontainer
    set +a
fi