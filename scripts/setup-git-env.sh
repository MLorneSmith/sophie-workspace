#!/bin/bash
# Setup git configuration based on environment (WSL vs Windows)

# Function to detect if running in WSL
is_wsl() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to setup git config
setup_git_config() {
    if is_wsl; then
        echo "🐧 Detected WSL environment - configuring git for Linux"
        git config core.autocrlf input
        git config core.eol lf
        echo "✅ Git configured for WSL: autocrlf=input, eol=lf"
    else
        echo "🪟 Detected Windows environment - configuring git for Windows"
        git config core.autocrlf true
        echo "✅ Git configured for Windows: autocrlf=true"
    fi
    
    # Show current configuration
    echo ""
    echo "Current git configuration:"
    echo "  core.autocrlf: $(git config core.autocrlf)"
    echo "  core.eol: $(git config core.eol)"
}

# Main execution
setup_git_config