#!/bin/bash
# Complete development environment setup for WSL

set -e  # Exit on error

echo "🚀 Setting up WSL development environment for 2025slideheroes"
echo "=================================================="

# 1. Setup git configuration
echo ""
echo "1️⃣ Configuring git for WSL..."
bash ./scripts/setup/setup-git-env.sh

# 2. Check if we need to clean node_modules
if [ -d "node_modules" ]; then
    echo ""
    echo "2️⃣ Found existing node_modules directory"
    read -p "   Remove and reinstall for Linux? (recommended) [Y/n]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo "   Cleaning node_modules..."
        rm -rf node_modules
        rm -rf apps/*/node_modules
        rm -rf packages/*/node_modules
        echo "   ✅ Cleaned node_modules"
    fi
else
    echo ""
    echo "2️⃣ No existing node_modules found"
fi

# 3. Install dependencies
echo ""
echo "3️⃣ Installing dependencies with pnpm..."
source ~/.bashrc
pnpm install

# 4. Setup Supabase CLI path
echo ""
echo "4️⃣ Setting up Supabase CLI..."
if [ -f "$HOME/.local/bin/supabase" ]; then
    echo "   ✅ Supabase CLI already installed"
else
    echo "   ❌ Supabase CLI not found"
fi

# Add to PATH if not already there
if ! grep -q 'export PATH=$PATH:~/.local/bin' ~/.bashrc; then
    echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
    echo "   ✅ Added ~/.local/bin to PATH"
fi

# 5. Check Docker/Supabase status
echo ""
echo "5️⃣ Checking Docker Supabase status..."
if docker ps | grep -q "supabase_db_2025slideheroes-db"; then
    echo "   ✅ Supabase Docker containers are running"
else
    echo "   ⚠️  Supabase Docker containers are not running"
    echo "   Run 'docker-compose up -d' in your Supabase directory"
fi

# 6. Create .env.local if needed
echo ""
echo "6️⃣ Checking environment files..."
if [ ! -f "apps/payload/.env.local" ]; then
    echo "   Creating .env.local for WSL development..."
    cat > apps/payload/.env.local << 'EOF'
# WSL-specific environment overrides
# This file is gitignored and specific to your WSL environment

# Add any WSL-specific overrides here
# For example, if you need different paths or settings
EOF
    echo "   ✅ Created apps/payload/.env.local"
fi

echo ""
echo "✨ WSL development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'source ~/.bashrc' to reload your shell"
echo "  2. Run 'pnpm dev' to start all development servers"
echo "  3. Or 'pnpm --filter payload dev' to start just Payload"
echo ""
echo "To switch back to Windows development:"
echo "  - Open PowerShell in Windows"
echo "  - Run: .\\scripts\\setup-dev-env.ps1"