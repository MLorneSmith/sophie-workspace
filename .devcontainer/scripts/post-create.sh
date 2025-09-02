#!/bin/bash
set -e

echo "🚀 Starting SlideHeroes Development Container Setup..."

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# 0. Optimize disk space in Codespaces
if [ "$CODESPACES" = "true" ]; then
    log_info "Running disk space optimization for Codespaces..."
    if [ -f /workspace/.devcontainer/scripts/optimize-disk-space.sh ]; then
        bash /workspace/.devcontainer/scripts/optimize-disk-space.sh || log_warning "Disk optimization completed with warnings"
    fi
fi

# 1. Set up Git configuration
log_info "Configuring Git..."
if [ -f /home/node/.gitconfig ]; then
    log_info "Git config already mounted from host"
else
    # Prompt for git config if not mounted
    git config --global user.name "${GIT_USER_NAME:-node}"
    git config --global user.email "${GIT_USER_EMAIL:-node@localhost}"
    log_warning "Git config set to default values. Update with your credentials."
fi

# 2. Install Node.js dependencies
log_info "Installing Node.js dependencies with pnpm..."
cd /workspace

# Fix permissions for workspace and node_modules directory
log_info "Setting up workspace permissions..."
# Check if we're already the owner to save time
if [ "$(stat -c '%U' /workspace 2>/dev/null)" != "node" ]; then
    sudo chown -R node:node /workspace 2>/dev/null || true
    sudo chmod -R 755 /workspace 2>/dev/null || true
fi

# Ensure node_modules directory exists with correct permissions
mkdir -p /workspace/node_modules 2>/dev/null || true
mkdir -p /workspace/node_modules/.pnpm 2>/dev/null || true
sudo chown -R node:node /workspace/node_modules 2>/dev/null || true
sudo chmod -R 755 /workspace/node_modules 2>/dev/null || true

# Set up pnpm
export PNPM_HOME="/home/node/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Ensure Corepack doesn't prompt for confirmation
export COREPACK_ENABLE_AUTO_PIN=0
export COREPACK_ENABLE_STRICT=0

# Configure pnpm for disk space efficiency in Codespaces
if [ "$CODESPACES" = "true" ]; then
    log_info "Configuring pnpm for limited disk space..."
    # Use smaller store and disable symlinks to save space
    pnpm config set store-dir /workspace/.pnpm-store
    pnpm config set package-import-method copy
    pnpm config set prefer-frozen-lockfile true
    pnpm config set virtual-store-dir /workspace/node_modules/.pnpm
    # Clear any existing store to start fresh
    pnpm store prune || true
fi

# Install dependencies with disk-space optimizations
log_info "Installing dependencies (this may take a few minutes)..."
if [ "$CODESPACES" = "true" ]; then
    # In Codespaces, use more conservative installation
    CI=true pnpm install --frozen-lockfile --prefer-offline --no-optional || {
        log_warning "First install attempt failed, retrying with cleanup..."
        # Clean and retry if first attempt fails
        rm -rf node_modules
        pnpm store prune
        CI=true pnpm install --frozen-lockfile --prefer-offline --no-optional
    }
else
    # Local development can use standard installation
    CI=true pnpm install --frozen-lockfile || CI=true pnpm install
fi

# 3. Set up environment files
log_info "Setting up environment files..."

# Create .env files from examples if they don't exist
if [ ! -f /workspace/apps/web/.env.local ] && [ -f /workspace/apps/web/.env.example ]; then
    cp /workspace/apps/web/.env.example /workspace/apps/web/.env.local
    log_info "Created apps/web/.env.local from example"
fi

# Create a template for GitHub Codespaces secrets
if [ "$CODESPACES" = "true" ]; then
    log_info "Running in GitHub Codespaces - checking for secrets..."
    
    # Create environment file with Codespaces secrets
    cat > /workspace/apps/web/.env.codespaces << EOF
# GitHub Codespaces Environment Variables
# These are automatically injected from Codespaces secrets

# Database URL (from Codespaces secret)
DATABASE_URL=\${DATABASE_URL:-postgresql://postgres:postgres@localhost:54322/postgres}

# Supabase URLs (local development defaults)
NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:54321}
NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}

# Application URL
NEXT_PUBLIC_SITE_URL=\${NEXT_PUBLIC_SITE_URL:-https://\${CODESPACE_NAME}-3000.app.github.dev}

# Stripe (from Codespaces secrets)
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}

# Email (from Codespaces secrets)
EMAIL_SENDER=\${EMAIL_SENDER:-noreply@slideheroes.com}
EMAIL_HOST=\${EMAIL_HOST}
EMAIL_PORT=\${EMAIL_PORT:-587}
EMAIL_USER=\${EMAIL_USER}
EMAIL_PASS=\${EMAIL_PASS}

# Monitoring (from Codespaces secrets)
NEXT_PUBLIC_SENTRY_DSN=\${NEXT_PUBLIC_SENTRY_DSN}
SENTRY_AUTH_TOKEN=\${SENTRY_AUTH_TOKEN}
EOF
    
    # Merge with local env if not exists
    if [ ! -f /workspace/apps/web/.env.local ]; then
        mv /workspace/apps/web/.env.codespaces /workspace/apps/web/.env.local
    fi
    
    log_info "Codespaces environment configured"
fi

# 4. Initialize PostgreSQL container
log_info "Initializing PostgreSQL container..."
if [ -f /workspace/.devcontainer/scripts/init-postgres.sh ]; then
    bash /workspace/.devcontainer/scripts/init-postgres.sh || log_warning "PostgreSQL initialization failed - will retry"
else
    log_warning "PostgreSQL init script not found"
fi

# 5. Initialize Supabase (if Docker is available)
if command -v docker &> /dev/null; then
    log_info "Starting Supabase services..."
    
    # Wait a bit for PostgreSQL to be fully ready
    sleep 5
    
    # Start Supabase
    cd /workspace/apps/web
    npx supabase start || log_warning "Supabase start failed - will retry in post-start"
    
    # Run migrations
    if [ -d /workspace/apps/web/supabase/migrations ]; then
        log_info "Running database migrations..."
        npx supabase db push || log_warning "Migrations failed - database may not be ready"
    fi
    
    cd /workspace
else
    log_warning "Docker not available yet - Supabase will be started in post-start script"
fi

# 6. Set up MCP servers
log_info "Setting up MCP servers..."

# Ensure MCP servers directory exists
if [ -d /workspace/.mcp-servers ]; then
    # Install dependencies for each MCP server
    for server_dir in /workspace/.mcp-servers/*/; do
        if [ -f "$server_dir/package.json" ]; then
            server_name=$(basename "$server_dir")
            log_info "Installing dependencies for MCP server: $server_name"
            (cd "$server_dir" && npm install --silent) || log_warning "Failed to install $server_name dependencies"
        fi
    done
fi

# 7. Set up database tools
log_info "Setting up database tools..."

# Install database client tools
sudo apt-get update -qq
sudo apt-get install -qq -y postgresql-client > /dev/null 2>&1 || log_warning "Failed to install PostgreSQL client"

# Create database helper aliases
cat >> /home/node/.zshrc << 'EOF'

# SlideHeroes Development Aliases
alias db='psql postgresql://postgres:postgres@localhost:54322/postgres'
alias supabase-start='cd /workspace/apps/web && npx supabase start && cd -'
alias supabase-stop='cd /workspace/apps/web && npx supabase stop && cd -'
alias supabase-reset='cd /workspace/apps/web && npx supabase db reset && cd -'
alias dev='pnpm dev'
alias test='pnpm test'
alias build='pnpm build'
alias lint='pnpm lint'
alias typecheck='pnpm typecheck'

# Git aliases
alias gs='git status'
alias gd='git diff'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline -10'

# Navigation aliases
alias web='cd /workspace/apps/web'
alias root='cd /workspace'

# Export Supabase environment
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

EOF

# 8. Install additional development tools
log_info "Installing additional development tools..."

# Install useful CLI tools
sudo apt-get install -qq -y \
    htop \
    ncdu \
    tree \
    jq \
    ripgrep \
    fd-find \
    bat > /dev/null 2>&1 || log_warning "Some tools failed to install"

# Create bat config for better syntax highlighting
mkdir -p /home/node/.config/bat
echo '--theme="Visual Studio Dark+"' > /home/node/.config/bat/config

# 9. Set up VS Code workspace settings
log_info "Configuring VS Code workspace..."

# Ensure .vscode directory exists
mkdir -p /workspace/.vscode

# Create recommended workspace settings if not exists
if [ ! -f /workspace/.vscode/settings.json ]; then
    cat > /workspace/.vscode/settings.json << 'EOF'
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/.supabase": true
  }
}
EOF
    log_info "Created VS Code workspace settings"
fi

# 10. Prebuild optimization
log_info "Running prebuild optimizations..."

# Build the project to cache dependencies
pnpm build || log_warning "Initial build failed - this is normal for first setup"

# Generate TypeScript types
pnpm --filter web supabase:typegen || log_warning "TypeScript generation failed - database may not be ready"

# 11. Create welcome message
cat > /workspace/.devcontainer/WELCOME.md << 'EOF'
# 🚀 Welcome to SlideHeroes Development Container!

Your development environment is ready! Here are some helpful commands:

## Quick Start
- `pnpm dev` - Start the development server
- `pnpm build` - Build the application
- `pnpm test` - Run tests
- `pnpm lint` - Lint the codebase
- `pnpm typecheck` - Check TypeScript types

## Supabase Commands
- `supabase-start` - Start Supabase services
- `supabase-stop` - Stop Supabase services
- `supabase-reset` - Reset the database
- `db` - Connect to PostgreSQL database

## Useful Aliases
- `web` - Navigate to apps/web directory
- `root` - Navigate to workspace root
- `gs` - Git status
- `gd` - Git diff

## Access Points
- Application: http://localhost:3000
- Supabase Studio: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres

## Need Help?
- Check the documentation in `.devcontainer/README.md`
- View logs in `/tmp/devcontainer-setup.log`
- Report issues at: https://github.com/MLorneSmith/2025slideheroes/issues

Happy coding! 🎉
EOF

# Show welcome message
echo ""
cat /workspace/.devcontainer/WELCOME.md
echo ""

log_info "✨ Development container setup complete!"

# Save setup log
echo "Setup completed at $(date)" >> /tmp/devcontainer-setup.log