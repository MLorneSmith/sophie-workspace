#!/bin/bash
# Robust startup script with timeouts and fallbacks

set -e

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service with timeout
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local timeout=${3:-30}
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            log_info "$service_name is ready"
            return 0
        fi
        
        if [ $((elapsed % 10)) -eq 0 ] && [ $elapsed -gt 0 ]; then
            echo "Waiting for $service_name... ($elapsed/$timeout seconds)"
        fi
        
        sleep 1
        ((elapsed++))
    done
    
    log_warning "$service_name not ready after $timeout seconds (non-critical)"
    return 1
}

# Function to clean up stuck processes
cleanup_stuck_processes() {
    log_info "Cleaning up any stuck processes..."
    
    # Kill stuck Docker processes
    if command_exists killall; then
        killall -9 docker-compose 2>/dev/null || true
        killall -9 "docker compose" 2>/dev/null || true
    else
        # Alternative using ps and kill
        ps aux | grep -E "docker.compose|docker-compose" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
    fi
    
    # Clean up Docker if available
    if command_exists docker; then
        docker compose down 2>/dev/null || true
        docker system prune -f --volumes 2>/dev/null || true
    fi
}

# Function to setup minimal environment
setup_minimal_environment() {
    log_info "Setting up minimal development environment..."
    
    # Fix permissions
    if [ -d /workspace ]; then
        sudo chown -R node:node /workspace 2>/dev/null || true
        mkdir -p /workspace/node_modules/.pnpm /home/node/.pnpm-store 2>/dev/null || true
        sudo chown -R node:node /workspace/node_modules /home/node/.pnpm-store 2>/dev/null || true
    fi
    
    # Configure Git
    if [ ! -f /home/node/.gitconfig ]; then
        git config --global user.name "${GIT_USER_NAME:-node}" 2>/dev/null || true
        git config --global user.email "${GIT_USER_EMAIL:-node@localhost}" 2>/dev/null || true
    fi
    
    # Setup pnpm
    export PNPM_HOME="/home/node/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    export COREPACK_ENABLE_AUTO_PIN=0
    export COREPACK_ENABLE_STRICT=0
    
    # Install dependencies with timeout
    log_info "Installing dependencies (with 5-minute timeout)..."
    cd /workspace
    timeout 300 pnpm install --frozen-lockfile --prefer-offline 2>&1 | tee /tmp/pnpm-install.log || {
        log_warning "Dependency installation timed out or failed"
        log_info "You can retry with: pnpm install"
    }
    
    # Create .env.local if missing
    if [ ! -f /workspace/apps/web/.env.local ]; then
        if [ -f /workspace/apps/web/.env.example ]; then
            cp /workspace/apps/web/.env.example /workspace/apps/web/.env.local
            log_info "Created .env.local from example"
        fi
    fi
}

# Main startup logic
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Robust Codespace Startup"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if we're in minimal mode
    if [ "$MINIMAL_MODE" = "true" ] || [ "$1" = "--minimal" ]; then
        log_info "Running in MINIMAL MODE (faster startup)"
        setup_minimal_environment
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  ✅ Minimal setup complete!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "You can now run:"
        echo "  pnpm dev       - Start development server"
        echo "  pnpm test      - Run tests"
        echo "  pnpm build     - Build the application"
        echo ""
        return 0
    fi
    
    # Full startup with Docker services
    log_info "Starting full environment with Docker services..."
    
    # Wait for Docker with shorter timeout
    if command_exists docker; then
        wait_for_service "Docker" "docker info" 30 || {
            log_warning "Docker not available - falling back to minimal mode"
            setup_minimal_environment
            return 0
        }
        
        # Try to start services with timeout
        log_info "Starting Docker services (2-minute timeout)..."
        timeout 120 docker compose up -d 2>&1 | tee /tmp/docker-compose.log || {
            log_error "Docker Compose failed or timed out"
            log_info "Falling back to minimal mode..."
            cleanup_stuck_processes
            setup_minimal_environment
            return 0
        }
    else
        log_warning "Docker not installed - using minimal mode"
        setup_minimal_environment
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ Startup complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Handle interrupts gracefully
trap 'log_warning "Startup interrupted - cleaning up..."; cleanup_stuck_processes; exit 1' INT TERM

# Run main function
main "$@"