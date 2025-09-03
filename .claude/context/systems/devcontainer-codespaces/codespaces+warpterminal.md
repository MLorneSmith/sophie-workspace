# DevContainer and GitHub Codespaces System Context

This document provides comprehensive context for LLM coding assistants about the SlideHeroes project's advanced GitHub Codespaces integration with Warp Terminal automation.

## Overview

The SlideHeroes project uses a sophisticated multi-codespace development workflow that combines GitHub Codespaces, SSH connectivity, Warp Terminal automation, and intelligent alias management to create a seamless multi-environment development experience.

### Key Components

1. **DevContainer Configuration**: Automated SSH-enabled codespace setup
2. **Codespace Management Scripts**: CLI utilities for codespace lifecycle management  
3. **SSH Integration**: Direct terminal access to codespaces via SSH
4. **Warp Terminal Automation**: Multi-tab startup with automatic connections
5. **Stable Alias System**: Logical naming that survives codespace rebuilds

## DevContainer Configuration

### Location and Structure
- **Primary Config**: `.devcontainer/devcontainer.json`
- **SSH Feature**: `ghcr.io/devcontainers/features/sshd:1` enabled
- **Port Forwarding**: SSH port 22 forwarded with silent auto-forward
- **User Context**: Runs as `node` user in `/workspaces` directory

### Key Features Enabled
```json
"features": {
  "ghcr.io/devcontainers/features/docker-in-docker:2": {
    "version": "latest",
    "enableNonRootDocker": "true",
    "moby": "true"
  },
  "ghcr.io/devcontainers-contrib/features/supabase-cli:1": {
    "version": "latest"
  },
  "ghcr.io/devcontainers/features/sshd:1": {
    "version": "latest"
  }
}
```

### Codespace Optimization Settings
- **Machine Requirements**: 4 CPUs, 8GB RAM, 64GB storage
- **Shell**: zsh configured as default terminal
- **Startup Commands**: Optimized for Codespaces with minimal mode
- **Port Configuration**: Comprehensive port forwarding for all services

## GitHub Codespace Management Scripts

All scripts are located in `~/.local/bin/` and provide comprehensive codespace lifecycle management.

### Core Management Scripts

#### `codespace-manager.sh` ✅ ENHANCED
**Purpose**: Primary codespace management interface with alias integration  
**Key Functions**:

**Codespace Management**:
- `status` - Display detailed dashboard of all codespaces with state, machine type, repository
- `stop-all` - Gracefully stop all running codespaces to save costs
- `delete <name>` - Force delete specific codespace with confirmation
- `cleanup` - Interactive cleanup of inactive codespaces
- `web <name>` - Open codespace in browser interface
- `ssh <name>` - Connect via SSH (with GitHub CLI proxy)

**Alias Management** ✅ NEW:
- `alias-status` - Show alias configuration status
- `alias-sync` - Sync aliases with current codespaces
- `alias-assign <alias> <codespace>` - Assign codespace to alias
- `alias-unassign <alias>` - Unassign codespace from alias
- `connect <alias>` - Smart connect using alias (local-dev, codespace-1, codespace-2)

**Usage Examples**:
```bash
# Traditional codespace management
codespace-manager.sh status                    # Show all codespaces
codespace-manager.sh web curly-waffle-xyz123  # Open in browser
codespace-manager.sh delete old-codespace     # Delete specific instance

# New alias-based management
codespace-manager.sh alias-status             # Show alias configuration
codespace-manager.sh connect local-dev        # Connect to local development
codespace-manager.sh connect codespace-1      # Connect to primary codespace
codespace-manager.sh alias-assign codespace-2 new-codespace-name
```

#### `setup-codespace-ssh.sh`
**Purpose**: Automated SSH configuration for new codespaces  
**Process**:
1. Generates SSH config entry using GitHub CLI
2. Tests connection and validates functionality
3. Updates local SSH host cache for persistent access
4. Provides direct SSH connection details

**Key Features**:
- Automatic SSH config generation via `gh codespace ssh --config`
- Connection testing and validation
- Host mapping cache in `~/.cache/codespace-manager/ssh-hosts`
- Integration with existing SSH key management

#### `connect-codespaces.sh`
**Purpose**: Intelligent codespace connection with fallback logic  
**Connection Hierarchy**:
1. **Direct SSH**: Uses cached SSH host if available
2. **GitHub CLI SSH**: Falls back to `gh codespace ssh` proxy method
3. **Web Interface**: Ultimate fallback opens in browser

**Smart Features**:
- Automatic SSH host resolution from cache
- Connection retry and timeout handling
- Cross-platform terminal launching (macOS/Linux)
- Graceful fallback when connections fail

#### `enable-ssh-in-codespace.sh`
**Purpose**: Manual SSH enablement for existing codespaces  
**Use Case**: Legacy codespaces created before SSH feature was enabled  
**Process**: Provides step-by-step instructions for manual SSH server installation and configuration

#### Demonstration Scripts
- `cs-demo.sh` - Shows available commands and examples
- `ssh-demo.sh` - Validates SSH connectivity and demonstrates capabilities

### Script Integration and Data Flow

```
User Command → codespace-manager.sh → 
├── GitHub CLI (gh codespace list/ssh/etc.)
├── SSH Config Updates (~/.ssh/config)
├── Host Cache (~/.cache/codespace-manager/ssh-hosts)
└── Connection Scripts (connect-codespaces.sh)
```

### SSH Host Cache Format
Location: `~/.cache/codespace-manager/ssh-hosts`  
Format: `codespace-name:ssh-host-alias`  
Example:
```
potential-giggle-pjx5r7gwg4726xvr:cs.potential-giggle-pjx5r7gwg4726xvr.dev
```

## SSH Configuration and Connectivity

### SSH Config Structure
Location: `~/.ssh/config`  
Generated entries follow this pattern:
```
Host cs.codespace-name.dev
    User node
    ProxyCommand /home/msmith/.local/bin/gh cs ssh -c codespace-name --stdio -- -i /home/msmith/.ssh/codespaces.auto
    UserKnownHostsFile=/dev/null
    StrictHostKeyChecking no
    LogLevel quiet
    ControlMaster auto
    IdentityFile /home/msmith/.ssh/codespaces.auto
```

### Connection Methods

#### 1. GitHub CLI Proxy (Primary)
- Uses `gh codespace ssh` as ProxyCommand
- Handles authentication and port forwarding automatically
- Works regardless of codespace networking configuration
- Maintains full terminal functionality

#### 2. Direct SSH (Planned Enhancement)
- Direct connection when codespace has public SSH access
- Faster connection with reduced latency
- Requires additional networking configuration

### Authentication
- **SSH Key**: Dedicated `github_codespaces` key in `~/.ssh/`
- **GitHub CLI**: Authenticated with `codespace` and `admin:public_key` scopes
- **Automatic Management**: Keys added to GitHub account during setup

## Warp Terminal Integration

### Current Implementation Status
**Status**: ✅ IMPLEMENTED (GitHub Issue #291 - COMPLETED)  
**Target**: Automatic 3-tab startup with stable environment connections

### Implemented Architecture

#### Launch Configuration
Location: `~/.warp/launch_configuration/development.yaml`
```yaml
name: "SlideHeroes Development"
windows:
  - active_tab_index: 0
    tabs:
      - title: "Local Dev"
        color: "Blue"
        cwd: "/home/msmith/projects/2025slideheroes"
        commands:
          - exec: "clear"
          - exec: "echo '🏠 Local Development Environment'"
          - exec: "echo 'Project: $(basename $(pwd))'"
          - exec: "echo 'Branch: $(git branch --show-current 2>/dev/null || echo \"no git\")'"
          - exec: "echo 'Status: $(git status --porcelain 2>/dev/null | wc -l) files changed'"
          - exec: "echo ''"
          - exec: "echo 'Ready for development! 🚀'"
          
      - title: "Codespace 1"
        color: "Green"
        commands:
          - exec: "clear"
          - exec: "echo '☁️ Connecting to Primary Codespace...'"
          - exec: "~/.local/bin/smart-ssh.sh codespace-1"
          
      - title: "Codespace 2"
        color: "Red"
        commands:
          - exec: "clear" 
          - exec: "echo '☁️ Connecting to Secondary Codespace...'"
          - exec: "~/.local/bin/smart-ssh.sh codespace-2"
```

#### Stable Alias System ✅ IMPLEMENTED
**Problem**: Codespace names change when rebuilt (e.g., `curly-waffle-xyz123`)  
**Solution**: JSON-based alias mapping system with auto-discovery

**Alias Configuration**: `~/.config/codespace-aliases.json`
```json
{
  "aliases": {
    "local-dev": {
      "type": "local",
      "path": "/home/msmith/projects/2025slideheroes",
      "branch": "dev",
      "display_name": "Local Development",
      "status": "active"
    },
    "codespace-1": {
      "type": "codespace",
      "codespace_name": "vigilant-funicular-vp5rp9j5x7hp99g",
      "ssh_host": "vigilant-funicular-vp5rp9j5x7hp99g",
      "display_name": "vigilant funicular",
      "last_updated": "2025-09-03T17:31:22Z",
      "status": "active",
      "priority": 1
    },
    "codespace-2": {
      "type": "codespace",
      "codespace_name": "stunning-space-disco-jrg7rvpw793q54",
      "ssh_host": "stunning-space-disco-jrg7rvpw793q54",
      "display_name": "stunning space disco",
      "last_updated": "2025-09-03T17:50:21Z",
      "status": "Provisioning",
      "priority": 2
    }
  },
  "settings": {
    "auto_update": true,
    "fallback_mode": "web",
    "connection_timeout": 10,
    "max_retry_attempts": 3,
    "retry_delay": 2
  },
  "metadata": {
    "version": "1.0.0",
    "created": "2025-09-03T17:40:00Z",
    "last_sync": "2025-09-03T17:50:21Z"
  }
}
```

#### New Alias Management Scripts ✅ IMPLEMENTED

##### `codespace-aliases.sh`
**Purpose**: Complete alias lifecycle management  
**Key Functions**:
- `init` - Initialize alias configuration file
- `status` - Show current alias status with metadata  
- `sync` - Sync aliases with current GitHub codespaces
- `discover` - Auto-discover and assign new codespaces
- `validate` - Validate current aliases and fix orphaned entries
- `health` - Comprehensive health check
- `assign <alias> <codespace>` - Manual alias assignment
- `unassign <alias>` - Remove codespace from alias

##### `resolve-codespace.sh`
**Purpose**: Alias resolution and connection info  
**Key Functions**:
- `resolve <alias> [format]` - Resolve alias to codespace details
- `connection <alias>` - Get connection info (LOCAL/CODESPACE format)
- `test <alias>` - Test connection to resolved alias
- `status <alias>` - Check current status of specific alias
- `list` - Show all aliases with resolution status

##### `smart-ssh.sh`
**Purpose**: Intelligent connection with retry and fallback  
**Key Features**:
- Auto-discovery of missing codespaces
- Connection retry with exponential backoff
- Graceful fallback to web interface
- State-aware connection handling (Available/Starting/Stopped)
- Local development environment support

##### `warp-startup-check.sh` ✅ IMPLEMENTED
**Purpose**: Pre-launch validation for Warp Terminal setup  
**Validation Checks**:
- Dependencies (gh, jq, ssh)
- GitHub CLI authentication
- Alias system integrity
- Warp configuration file
- Required scripts availability
- Project directory validation
- Codespace connectivity testing

## Codespace Lifecycle Management

### Creation and Setup Process

1. **Create Codespace**:
   ```bash
   gh codespace create --repo MLorneSmith/2025slideheroes --branch dev
   ```

2. **Automatic SSH Setup**:
   ```bash
   setup-codespace-ssh.sh <new-codespace-name>
   ```

3. **Alias Assignment** (Planned):
   ```bash
   codespace-aliases.sh assign <new-codespace-name> codespace-1
   ```

### Rebuild vs. Recreate Strategy

#### When to Use `gh codespace rebuild`
- DevContainer configuration changes
- Dependency updates that require fresh environment
- System-level package installations
- Performance issues with existing environment

#### When to Delete and Recreate
- Fundamental architecture changes
- Storage corruption or disk space issues
- Branch-specific isolated environments
- Long-term inactive codespaces

#### Best Practices
- **Prefer Rebuild**: Use `gh codespace rebuild` when possible to maintain instance identity
- **Branch Isolation**: Consider separate codespaces for feature branches
- **Regular Cleanup**: Monitor and clean inactive codespaces to control costs
- **Alias Updates**: Update alias mappings when recreating codespaces

### State Management

#### Codespace States
- **Available**: Running and ready for connections
- **Starting**: Booting up, connections will be delayed
- **Stopped**: Shut down, can be restarted
- **Rebuilding**: Applying configuration changes

#### Connection Handling by State
```bash
# Planned smart-ssh.sh logic
case "$codespace_state" in
    "Available")   # Direct connection
    "Starting")    # Wait and retry
    "Stopped")     # Start and connect  
    "Rebuilding")  # Wait for completion
    *)            # Fallback to web interface
esac
```

## Development Workflow Integration

### Multi-Environment Development Pattern

#### Environment Types
1. **Local Dev**: Direct development on local machine
2. **Codespace 1**: Primary cloud development environment
3. **Codespace 2**: Testing, experimentation, or feature branch work

#### Typical Workflow
```bash
# Morning startup
codespace-manager.sh status                    # Check environment status
# → Warp opens automatically with 3 tabs (planned)

# Development work
# Tab 1: Local testing and quick changes
# Tab 2: Main development in primary codespace  
# Tab 3: Parallel feature work or testing

# End of day
codespace-manager.sh stop-all                  # Cost management
```

### File Synchronization Strategies

#### Git-Based Synchronization (Primary)
- All environments work with same Git repository
- Feature branches for isolation
- Regular commits for state persistence

#### Direct File Transfer (When Needed)
```bash
# Upload to codespace
scp file.txt cs.codespace-name.dev:/workspaces/2025slideheroes/

# Download from codespace
scp cs.codespace-name.dev:/workspaces/output.txt ./
```

## Performance and Cost Optimization

### Startup Performance Targets
- **Total Warp Launch**: < 10 seconds with all tabs
- **SSH Connection**: < 5 seconds per codespace
- **Fallback Handling**: < 2 seconds to detect and switch

### Cost Management Features

#### Automatic Shutdown
- Codespaces auto-sleep after 30 minutes of inactivity
- Manual shutdown via `codespace-manager.sh stop-all`
- Scheduled cleanup of inactive instances

#### Resource Optimization
- **Machine Size**: Balanced 4-core/8GB configuration
- **Storage**: 64GB for monorepo and dependencies
- **Networking**: Minimal port forwarding for security

## Security Considerations

### SSH Security
- **Dedicated Keys**: Separate SSH key for codespace access only
- **Key Rotation**: 90-day rotation cycle (recommended)
- **Host Verification**: Disabled for codespace dynamic IPs (StrictHostKeyChecking no)
- **Connection Logging**: Minimal logging for privacy (LogLevel ERROR)

### GitHub Authentication
- **Scoped Tokens**: Only necessary permissions (codespace, admin:public_key)
- **Token Storage**: Secure storage via GitHub CLI configuration
- **Audit Trail**: GitHub provides access logging for all codespace operations

### Network Security
- **Proxy Connections**: GitHub CLI proxy prevents direct network exposure
- **Port Forwarding**: Only essential ports forwarded from codespaces
- **TLS Encryption**: All connections encrypted in transit

## Troubleshooting and Diagnostics

### Common Issues and Solutions

#### SSH Connection Failures
```bash
# Diagnosis
ssh-add -l | grep github_codespaces          # Check SSH key
gh auth status                               # Verify GitHub CLI auth
gh codespace list                            # Confirm codespace status

# Resolution
setup-codespace-ssh.sh <codespace-name>     # Reconfigure SSH
```

#### Codespace State Issues
```bash
# Check codespace health
codespace-manager.sh status
gh codespace logs <codespace-name>           # View startup logs

# Recovery actions
gh codespace stop <codespace-name>           # Force stop
gh codespace start <codespace-name>          # Manual restart
gh codespace rebuild <codespace-name>        # Full rebuild
```

#### Warp Terminal Issues (Planned)
```bash
# Validate configuration
warp-startup-check.sh                        # Pre-launch validation
~/.local/bin/resolve-codespace.sh codespace-1 # Test alias resolution
```

### Logging and Monitoring

#### Script Logging
- Connection attempts and failures
- Alias resolution and updates
- Performance metrics and timing

#### GitHub CLI Logging
```bash
gh codespace list --json                     # Structured output for parsing
gh codespace ssh --debug                     # Verbose SSH diagnostics
```

## Development Context for LLM Assistants

### When Working with Codespaces

1. **Always Check Current State**: Use `codespace-manager.sh status` before making assumptions
2. **Prefer SSH Connections**: Use SSH-based access for better terminal integration
3. **Handle Dynamic Names**: Never hardcode codespace names in scripts or documentation
4. **Validate Connections**: Test SSH connectivity before complex operations
5. **Consider Multiple Environments**: Remember user may have multiple active codespaces

### Script Modification Guidelines

1. **Maintain Backwards Compatibility**: Existing scripts used in production
2. **Follow Error Handling Patterns**: Consistent error messages and graceful failure
3. **Update Host Cache**: Modify cache files when changing SSH connections
4. **Test Cross-Platform**: Scripts must work on both macOS and Linux
5. **Document Changes**: Update this context file when modifying system behavior

### Integration Points

#### With VS Code Remote
- SSH configurations work with VS Code Remote SSH extension
- Use `code --remote ssh-remote+cs.codespace-name.dev /workspaces/2025slideheroes`

#### With Git Operations
- All codespaces have full Git access to repository
- SSH keys provide authenticated Git operations
- Consider which environment for specific Git operations (commits, pushes, etc.)

#### With Build and Test Systems
- Each codespace has complete development environment
- Docker-in-Docker available for containerized operations
- Supabase CLI pre-installed and configured

## Future Enhancements

### Planned Features (GitHub Issue #291)
- Automatic Warp Terminal startup configuration
- Stable alias system with auto-discovery
- Smart connection retry and fallback logic
- Health monitoring and automatic recovery
- Team workspace sharing capabilities

### Potential Improvements
- Direct SSH without GitHub CLI proxy for performance
- Codespace cost monitoring and alerts
- Automated backup and restore of codespace data
- Integration with project management tools
- Advanced debugging and performance monitoring

---

## Quick Reference Commands

### Daily Operations ✅ UPDATED
```bash
# Status check
codespace-manager.sh status                    # GitHub codespace status
codespace-manager.sh alias-status              # Alias configuration status

# Connect to environments (NEW ALIAS-BASED)
codespace-manager.sh connect local-dev         # Local development
codespace-manager.sh connect codespace-1       # Primary codespace
codespace-manager.sh connect codespace-2       # Secondary codespace

# Alternative connection methods
~/.local/bin/smart-ssh.sh codespace-1         # Direct smart connection
connect-codespaces.sh <codespace-name>         # Legacy direct connection

# Stop all codespaces (cost saving)
codespace-manager.sh stop-all

# Setup SSH for new codespace
setup-codespace-ssh.sh <codespace-name>
```

### Warp Terminal Operations ✅ NEW
```bash
# Pre-launch validation
~/.local/bin/warp-startup-check.sh             # Health check before launch

# Launch Warp with development configuration
warp --launch development                      # 3-tab auto-startup

# Alias management
~/.local/bin/codespace-aliases.sh status       # Show alias status
~/.local/bin/codespace-aliases.sh sync         # Sync with GitHub
~/.local/bin/codespace-aliases.sh health       # Full health check
```

### Maintenance Operations ✅ UPDATED
```bash
# Clean up inactive codespaces
codespace-manager.sh cleanup

# Alias management
codespace-manager.sh alias-sync                # Sync aliases
codespace-manager.sh alias-assign codespace-2 new-name # Manual assignment
codespace-manager.sh alias-unassign codespace-2 # Remove assignment

# Test connectivity
~/.local/bin/resolve-codespace.sh test codespace-1 # Test alias connection
ssh cs.codespace-name.dev "echo 'Connection test'" # Direct SSH test

# View configuration
gh codespace ssh --config --codespace <name>   # SSH config
~/.local/bin/resolve-codespace.sh list         # All aliases

# Force delete problematic codespace
codespace-manager.sh delete <codespace-name>
```

This system represents a mature, production-ready multi-codespace development environment optimized for efficiency, cost management, and developer experience.