# Warp Terminal Multi-GitHub Codespace Workflow Implementation Guide

This comprehensive guide provides step-by-step instructions for setting up Warp terminal to efficiently manage multiple GitHub Codespaces simultaneously.

## Quick Start Overview

1. **SSH Configuration** - Set up keys and connection configs
2. **Shell Scripts** - Create management and connection utilities  
3. **Warp Integration** - Configure terminal workflows
4. **Daily Operations** - Streamlined codespace management

---

## Prerequisites

- Warp terminal installed ([Download](https://www.warp.dev/))
- GitHub account with Codespaces access
- SSH key configured for GitHub authentication
- zsh shell (default on macOS, installable on Linux)
- GitHub CLI installed (`gh`)

---

## Phase 1: SSH Configuration

### Step 1: SSH Key Setup

Generate a dedicated SSH key for codespaces:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github_codespaces -C "codespaces@$(hostname)"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github_codespaces

# Add to GitHub account
gh ssh-key add ~/.ssh/github_codespaces.pub --title "Codespaces - $(hostname)"
```

### Step 2: SSH Config File

Create/edit `~/.ssh/config`:

```bash
# Backup existing config
[[ -f ~/.ssh/config ]] && cp ~/.ssh/config ~/.ssh/config.backup

# Add codespace configuration
cat >> ~/.ssh/config << 'EOF'

# GitHub Codespaces Configuration
Host *.github.dev
    User root
    IdentityFile ~/.ssh/github_codespaces
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
    ServerAliveInterval 30
    ServerAliveCountMax 3
    Compression yes
    ControlMaster auto
    ControlPath ~/.ssh/control-%r@%h:%p
    ControlPersist 10m

# Specific codespace aliases (update with your actual URLs)
Host slideheroes-main
    HostName your-main-codespace.github.dev
    User root

Host slideheroes-dev  
    HostName your-dev-codespace.github.dev
    User root

Host slideheroes-feature
    HostName your-feature-codespace.github.dev
    User root
EOF
```

### Step 3: Test SSH Connection

```bash
# List your codespaces to get actual hostnames
gh codespace list

# Test connection (replace with actual codespace name)
ssh your-codespace-name "echo 'Connection successful'"
```

---

## Phase 2: Shell Scripts and Utilities

### Step 1: Create Script Directory

```bash
# Create local bin directory
mkdir -p ~/.local/bin

# Ensure it's in PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Codespace Manager Script

Create `~/.local/bin/codespace-manager.sh`:

```bash
#!/bin/zsh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show codespace status
show_status() {
    echo "${BLUE}📊 Codespace Status Dashboard${NC}"
    echo "=================================="
    
    gh codespace list --json name,state,machineDisplayName,region,repositoryName | \
    jq -r '.[] | "Name: \(.name)\nState: \(.state)\nMachine: \(.machineDisplayName)\nRegion: \(.region)\nRepo: \(.repositoryName)\n---"'
}

# Function to stop all codespaces
stop_all() {
    echo "${YELLOW}⚠️  Stopping all codespaces...${NC}"
    gh codespace list --json name,state | \
    jq -r '.[] | select(.state=="Available") | .name' | \
    while read codespace; do
        echo "🛑 Stopping $codespace"
        gh codespace stop --codespace "$codespace"
    done
}

# Function to start specific codespace
start_codespace() {
    local name=$1
    if [[ -z "$name" ]]; then
        echo "${RED}❌ Please provide codespace name${NC}"
        return 1
    fi
    
    echo "${GREEN}🚀 Starting $name...${NC}"
    gh codespace start --codespace "$name"
}

# Function to delete inactive codespaces
cleanup_inactive() {
    echo "${YELLOW}🧹 Cleaning up inactive codespaces...${NC}"
    gh codespace list --json name,state,lastUsedAt | \
    jq -r --arg threshold "$(date -d '7 days ago' -Iseconds)" \
    '.[] | select(.state=="Shutdown" and .lastUsedAt < $threshold) | .name' | \
    while read codespace; do
        echo "🗑️  Deleting inactive codespace: $codespace"
        read "confirm?Are you sure? (y/N) "
        if [[ $confirm =~ ^[Yy]$ ]]; then
            gh codespace delete --codespace "$codespace"
        fi
    done
}

# Main command dispatcher
case "$1" in
    "status"|"s")
        show_status
        ;;
    "stop-all")
        stop_all
        ;;
    "start")
        start_codespace "$2"
        ;;
    "cleanup")
        cleanup_inactive
        ;;
    *)
        echo "Usage: $0 {status|stop-all|start <name>|cleanup}"
        echo "  status    - Show all codespaces status"
        echo "  stop-all  - Stop all running codespaces"
        echo "  start     - Start specific codespace"
        echo "  cleanup   - Remove inactive codespaces"
        ;;
esac
```

### Step 3: Connection Scripts

Create `~/.local/bin/connect-all-codespaces.sh`:

```bash
#!/bin/zsh

echo "🔍 Checking available codespaces..."

# Get list of available codespaces
AVAILABLE_CODESPACES=($(gh codespace list --json name,state | jq -r '.[] | select(.state=="Available") | .name'))

if [[ ${#AVAILABLE_CODESPACES[@]} -eq 0 ]]; then
    echo "⚠️  No available codespaces found. Starting some..."
    
    # List all codespaces and prompt to start
    gh codespace list --json name,state | jq -r '.[] | select(.state!="Available") | .name' | \
    while read codespace; do
        read "start?Start $codespace? (y/N) "
        if [[ $start =~ ^[Yy]$ ]]; then
            echo "🚀 Starting $codespace..."
            gh codespace start --codespace "$codespace"
        fi
    done
    
    # Wait a moment and refresh list
    sleep 10
    AVAILABLE_CODESPACES=($(gh codespace list --json name,state | jq -r '.[] | select(.state=="Available") | .name'))
fi

echo "📱 Opening connections to ${#AVAILABLE_CODESPACES[@]} codespaces..."

for codespace in "${AVAILABLE_CODESPACES[@]}"; do
    echo "🔗 Connecting to $codespace..."
    
    # Open new Warp tab and connect (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Warp\" to activate" 2>/dev/null
        osascript -e "tell application \"System Events\" to keystroke \"t\" using {command down}" 2>/dev/null
        sleep 1
        osascript -e "tell application \"System Events\" to keystroke \"gh codespace ssh --codespace $codespace\"" 2>/dev/null
        osascript -e "tell application \"System Events\" to keystroke return" 2>/dev/null
        sleep 2
    else
        # Linux fallback - open in new terminal
        gnome-terminal -- gh codespace ssh --codespace "$codespace" 2>/dev/null || \
        xterm -e "gh codespace ssh --codespace $codespace" 2>/dev/null || \
        echo "⚠️  Please manually run: gh codespace ssh --codespace $codespace"
    fi
done

echo "✅ All available codespaces connected!"
```

### Step 4: Resource Monitor Script

Create `~/.local/bin/resource-monitor.sh`:

```bash
#!/bin/zsh

monitor_codespace_resources() {
    echo "📊 Codespace Resource Monitor"
    echo "============================="
    
    gh codespace list --json name,state | jq -r '.[] | select(.state=="Available") | .name' | while read cs; do
        echo "🖥️  $cs:"
        gh codespace ssh --codespace "$cs" -- "
            echo '  CPU Usage:' \$(top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1)%
            echo '  Memory Usage:' \$(free -m | awk 'NR==2{printf \"%.1f%%\", \$3*100/\$2}')
            echo '  Disk Usage:' \$(df -h /workspaces | awk 'NR==2{print \$5}' || df -h / | awk 'NR==2{print \$5}')
            echo '  Processes:' \$(ps aux | wc -l)
        "
        echo ""
    done
}

# Real-time monitoring
monitor_realtime() {
    while true; do
        clear
        monitor_codespace_resources
        echo "🔄 Refreshing in 30 seconds... (Ctrl+C to stop)"
        sleep 30
    done
}

case "$1" in
    "realtime"|"rt")
        monitor_realtime
        ;;
    *)
        monitor_codespace_resources
        ;;
esac
```

### Step 5: Make Scripts Executable

```bash
chmod +x ~/.local/bin/*.sh
```

---

## Phase 3: Shell Aliases and Functions

Add to `~/.zshrc`:

```bash
# Codespace Management Aliases
alias cs-status='codespace-manager.sh status'
alias cs-stop='codespace-manager.sh stop-all'
alias cs-cleanup='codespace-manager.sh cleanup'
alias cs-connect='connect-all-codespaces.sh'
alias cs-monitor='resource-monitor.sh'

# Quick SSH functions
cs-ssh() {
    if [[ -z "$1" ]]; then
        echo "Usage: cs-ssh <codespace-name>"
        gh codespace list --json name | jq -r '.[].name'
        return 1
    fi
    gh codespace ssh --codespace "$1"
}

# Multi-codespace command execution
cs-exec() {
    if [[ -z "$1" ]]; then
        echo "Usage: cs-exec '<command>' [codespace1] [codespace2] ..."
        return 1
    fi
    
    local cmd="$1"
    shift
    local codespaces=("$@")
    
    if [[ ${#codespaces[@]} -eq 0 ]]; then
        # Default to all available codespaces
        codespaces=($(gh codespace list --json name,state | jq -r '.[] | select(.state=="Available") | .name'))
    fi
    
    for cs in "${codespaces[@]}"; do
        echo "🔄 Executing on $cs: $cmd"
        gh codespace ssh --codespace "$cs" -- "$cmd"
        echo "---"
    done
}

# Quick codespace creation
cs-create() {
    local repo="$1"
    local branch="$2"
    
    if [[ -z "$repo" ]]; then
        echo "Usage: cs-create <repo> [branch]"
        echo "Example: cs-create MLorneSmith/2025slideheroes main"
        return 1
    fi
    
    if [[ -n "$branch" ]]; then
        gh codespace create --repo "$repo" --branch "$branch"
    else
        gh codespace create --repo "$repo"
    fi
}
```

Apply changes:

```bash
source ~/.zshrc
```

---

## Phase 4: Warp Terminal Configuration

### Step 1: Create Warp Workflows

1. Open Warp Terminal
2. Access Settings (Cmd+, on macOS / Ctrl+, on Linux)
3. Navigate to "Features" → "Workflows"
4. Add custom workflows:

**Codespace Status Workflow**:
- Name: "Codespace Status"
- Description: "Show status of all codespaces"
- Command: `codespace-manager.sh status`

**Connect All Workflow**:
- Name: "Connect All Codespaces"
- Description: "Connect to all available codespaces"
- Command: `connect-all-codespaces.sh`

### Step 2: Custom Themes (Optional)

Create distinct themes for different codespaces:

1. Go to Settings → Appearance → Themes
2. Create/duplicate themes with different colors:
   - `Codespace-Main` (Blue accent)
   - `Codespace-Dev` (Green accent)
   - `Codespace-Feature` (Orange accent)

---

## Daily Workflow Usage

### Start Your Day

```bash
# Check status of all codespaces
cs-status

# Connect to all available codespaces
cs-connect
```

### During Work

```bash
# Connect to specific codespace
cs-ssh slideheroes-main

# Execute commands across multiple codespaces
cs-exec 'git status'
cs-exec 'pnpm install' slideheroes-main slideheroes-dev

# Monitor resource usage
cs-monitor
```

### End of Day

```bash
# Stop all codespaces to save costs
cs-stop

# Weekly cleanup (removes codespaces inactive >7 days)
cs-cleanup
```

---

## Advanced Usage

### Parallel Command Execution

```bash
# Run tests on all codespaces simultaneously
cs-exec 'cd /workspaces/2025slideheroes && pnpm test'

# Update dependencies across environments
cs-exec 'cd /workspaces/2025slideheroes && pnpm update'
```

### File Synchronization

Create `~/.local/bin/sync-codespaces.sh`:

```bash
#!/bin/zsh

MAIN_CODESPACE="slideheroes-main"
TARGET_CODESPACES=("slideheroes-dev" "slideheroes-feature")

sync_file() {
    local file="$1"
    
    for target in "${TARGET_CODESPACES[@]}"; do
        echo "🔄 Syncing $file to $target"
        gh codespace ssh --codespace "$MAIN_CODESPACE" -- "cat $file" | \
        gh codespace ssh --codespace "$target" -- "cat > $file"
    done
}

# Usage: sync_file "/workspaces/2025slideheroes/.env.local"
```

---

## Troubleshooting

### SSH Connection Issues

1. **Check codespace status**:
   ```bash
   gh codespace list
   ```

2. **Verify SSH key**:
   ```bash
   ssh-add -l | grep github_codespaces
   ```

3. **Test with verbose output**:
   ```bash
   gh codespace ssh --codespace "your-codespace" -- "echo 'test'"
   ```

### Performance Issues

1. **Enable SSH connection multiplexing** (already in config):
   ```bash
   # Connections automatically reuse existing connections
   ```

2. **Monitor resource usage**:
   ```bash
   cs-monitor realtime
   ```

### Warp Terminal Issues

1. **If AppleScript doesn't work** (macOS):
   - Enable accessibility permissions for Terminal/iTerm in System Preferences
   - Use manual tab opening as fallback

2. **Linux alternatives**:
   - Script will attempt `gnome-terminal` or `xterm`
   - Manually open terminals if automation fails

---

## Security Best Practices

1. **Dedicated SSH keys**: Use separate keys for codespaces
2. **Regular rotation**: Rotate SSH keys every 90 days
3. **Monitor access**: Check GitHub audit logs regularly
4. **Secure storage**: Never share private keys

---

## Performance Benchmarks

Expected performance:
- **Connection Time**: < 5 seconds for active codespaces
- **Command Execution**: Near-native performance  
- **File Transfer**: 10+ MB/s depending on network
- **Resource Usage**: Minimal local impact

---

## Maintenance Schedule

### Weekly Tasks
- Run `cs-cleanup` to remove inactive codespaces
- Check resource usage with `cs-monitor`
- Review SSH connection logs

### Monthly Tasks  
- Update scripts from repository
- Rotate SSH keys (quarterly)
- Review and optimize SSH config

---

## Next Steps

After setup:
1. Customize codespace aliases for your specific projects
2. Add project-specific scripts to `~/.local/bin/`
3. Create Warp workflows for common development tasks
4. Set up monitoring alerts for resource usage

---

This guide provides a production-ready setup for managing multiple GitHub Codespaces through Warp terminal, enabling efficient multi-environment development workflows.