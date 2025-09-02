#!/bin/bash
# Quick setup script for Codespaces - only essential operations
# Non-essential operations are deferred to post-start or background

set -e

echo "🚀 Quick Setup for Codespaces..."

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Essential: Set up Git configuration (quick)
log_info "Setting up Git..."
if [ ! -f /home/node/.gitconfig ]; then
    git config --global user.name "${GIT_USER_NAME:-node}"
    git config --global user.email "${GIT_USER_EMAIL:-node@localhost}"
fi

# 2. Essential: Fix permissions and create workspace directories (quick)
log_info "Fixing permissions and creating workspace directories..."
sudo chown -R node:node /workspace || true
mkdir -p /workspace/node_modules/.pnpm /home/node/.pnpm-store 2>/dev/null || true
sudo chown -R node:node /workspace/node_modules /home/node/.pnpm-store || true

# 3. Essential: Set up pnpm (quick)
export PNPM_HOME="/home/node/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
export COREPACK_ENABLE_AUTO_PIN=0
export COREPACK_ENABLE_STRICT=0

# 4. Create a marker file for deferred setup
touch /tmp/.quick-setup-done

# 5. Start dependency installation in background (non-blocking)
log_info "Starting dependency installation in background..."
{
    # Wait a bit for container to fully initialize
    sleep 5
    
    # Configure pnpm for Codespaces
    if [ "$CODESPACES" = "true" ]; then
        pnpm config set store-dir /workspace/.pnpm-store
        pnpm config set package-import-method copy
        pnpm config set prefer-frozen-lockfile true
    fi
    
    # Install dependencies
    cd /workspace
    CI=true pnpm install --frozen-lockfile --prefer-offline --no-optional 2>&1 | tee /tmp/pnpm-install.log
    
    # Mark installation complete
    touch /tmp/.pnpm-install-done
    echo "✅ Dependencies installed successfully" >> /tmp/pnpm-install.log
} &

# Store the background PID
echo $! > /tmp/pnpm-install.pid

log_info "Quick setup complete!"
log_warning "Dependencies are installing in background (check: tail -f /tmp/pnpm-install.log)"

# Show a simple welcome message
cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 SlideHeroes Codespace is starting up...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

While dependencies install in the background, you can:
• Browse the codebase
• Review documentation
• Check installation progress: tail -f /tmp/pnpm-install.log

The terminal will be ready for development commands once
the background installation completes.

EOF