#!/bin/bash
# Quick WSL setup - focused on getting Payload working

echo "🚀 Quick WSL Setup for Payload Development"
echo "=========================================="

# 1. Set git config
echo "Setting git configuration for WSL..."
git config core.autocrlf input
git config core.eol lf
echo "✅ Git configured"

# 2. Just reinstall in the payload directory
echo ""
echo "📦 Installing dependencies for Payload..."
cd apps/payload

# Remove only payload's node_modules
if [ -d "node_modules" ]; then
    echo "Removing Payload's node_modules..."
    rm -rf node_modules
fi

# Install with pnpm
source ~/.bashrc
pnpm install

echo ""
echo "✅ Setup complete! Now you can run:"
echo "   pnpm dev         (from apps/payload)"
echo "   pnpm --filter payload dev  (from root)"