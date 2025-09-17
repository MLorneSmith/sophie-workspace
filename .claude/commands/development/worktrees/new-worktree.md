---
description: "Create isolated git worktree with feature branch and preserved local configurations"
allowed-tools: [Bash, Read]
argument-hint: "[feature-name]"
---

# New Worktree

Create a new git worktree with feature branch from dev and copy local configuration files for isolated development.

## Key Features
- **Automated Branch Creation**: Creates feature branch from latest dev
- **Config Preservation**: Copies local .env, .mcp.json, and other git-ignored files
- **Dependency Management**: Installs dependencies or links existing node_modules
- **Security Awareness**: Handles sensitive configuration files appropriately
- **Workspace Integration**: Opens in VS Code automatically when available
- **Error Prevention**: Validates branch availability before creation

## Prompt

<role>
You are a Git Worktree Specialist responsible for creating isolated development environments using git worktrees. You excel at managing multiple concurrent feature developments while preserving local configurations and ensuring proper workspace setup.
</role>

<instructions>
# Worktree Creation - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Create** isolated worktree with feature branch from dev
- **Preserve** local configuration files securely
- **Ensure** ready-to-use development environment

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear worktree creation objectives:

1. **Primary Objective**: Create isolated development environment for new feature work
2. **Success Criteria**: Worktree created, configs copied, dependencies installed, ready for development
3. **Workspace Goals**: Separate branch, preserved local settings, functional environment
4. **Security Standards**: Sensitive files copied but never committed
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** worktree management expertise:

1. **Expertise Domain**: Git worktrees, branch management, configuration handling, dependency setup
2. **Automation Authority**: Script execution, environment setup, workspace configuration
3. **Security Focus**: Sensitive file handling, git-ignore preservation, key management
4. **Approach Style**: Automated setup with minimal user interaction
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** feature requirements and validate environment:

#### Feature Name Collection
**Ask** user for feature name:
```
What name should I use for the new feature branch?
(Provide just the feature name, e.g., "user-auth")
```

#### Environment Validation
**Check** repository state:
```bash
# Verify we're in a git repository
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$MAIN_REPO_PATH" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check if branch already exists
BRANCH_NAME="feature-${FEATURE_NAME}"
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo "Error: Branch '${BRANCH_NAME}' already exists"
    exit 1
fi
```

#### Configuration Detection
**Identify** files to copy:
- Environment files: .env, .env.local, .env.station
- MCP configuration: .mcp.json
- Claude settings: .claude/settings.local.json
- VS Code settings: .vscode/settings.json
</inputs>

### Phase M - METHOD
<method>
**Execute** worktree creation workflow:

#### Step 1: Enable Worktree Mode
**Activate** worktree environment:
```bash
source ~/.zshrc && claude-wt
```

#### Step 2: Execute Creation Script
**Run** enhanced worktree script:
```bash
.claude/scripts/worktree/create-worktree-enhanced.sh "$FEATURE_NAME"
```

#### Step 3: Copy Local Configurations
**Preserve** sensitive files:
```bash
copy_if_exists() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "✅ Copied $3"
    fi
}

# Copy all local config files
copy_if_exists "$MAIN_REPO/.env" "$WORKTREE/.env" ".env"
copy_if_exists "$MAIN_REPO/.mcp.json" "$WORKTREE/.mcp.json" ".mcp.json"
```

#### Step 4: Setup Dependencies
**Install** or link dependencies:
```bash
if [ -d "$MAIN_REPO/node_modules" ]; then
    # Option to link existing modules
    ln -s "$MAIN_REPO/node_modules" "$WORKTREE/node_modules"
else
    cd "$WORKTREE" && pnpm install --frozen-lockfile
fi
```

#### Step 5: Switch to Worktree
**Navigate** to new workspace:
```bash
cd "$WORKTREE_PATH"
pwd  # Verify location
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and deliver ready worktree:

#### Output Specification
**Define** deliverable environment:
- **Format**: Fully configured git worktree with feature branch
- **Structure**: Complete project copy with local configs preserved
- **Location**: ~/projects/worktrees/feature-[name]
- **Quality Standards**: Ready for immediate development

#### Validation Checks
**Verify** worktree setup:
```bash
# Verify worktree creation
git worktree list | grep "$BRANCH_NAME"

# Verify branch tracking
git branch -vv | grep "$BRANCH_NAME"

# Verify config files
[ -f .env ] && echo "✅ .env present"
[ -f .mcp.json ] && echo "✅ .mcp.json present"

# Verify dependencies
[ -d node_modules ] && echo "✅ Dependencies ready"
```

#### Success Reporting
**Report** completion status:
```
✅ Successfully created worktree!
   Branch: feature-${FEATURE_NAME}
   Location: ${WORKTREE_PATH}
   Based on: origin/dev

⚠️ Security Note: Local config files copied
   - Never commit .env or .mcp.json files
   - Keep different keys for dev/staging/production

Ready for development! You're now in: ${WORKTREE_PATH}
```

#### Example Output
```
✅ Worktree created successfully
- Branch: feature-user-auth
- Location: ~/projects/worktrees/feature-user-auth
- Configs: .env ✓ .mcp.json ✓
- Dependencies: Installed (245 packages)
- VS Code: Opened in new window
```
</expectations>

## Error Handling
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- **No feature name**: Prompt user for feature name
- **Invalid characters**: Sanitize branch name
- **Reserved names**: Suggest alternative names

### Role Phase Errors
- **Git not installed**: Provide installation instructions
- **No worktree support**: Check git version (needs 2.5+)

### Inputs Phase Errors
- **Not in git repo**: Navigate to repository first
- **Branch exists**: Suggest different name or cleanup
- **No dev branch**: Fetch from origin or use main

### Method Phase Errors
- **Script not found**: Check script location
- **Permission denied**: Fix script permissions
- **Copy failures**: Continue with available configs
- **Dependency install fails**: Retry or link to existing

### Expectations Phase Errors
- **Worktree not created**: Check git worktree list
- **Wrong directory**: Manually navigate to worktree
- **Missing configs**: Copy manually from main repo
</instructions>

## Script Content

```bash
#!/bin/bash
# Enhanced Git Worktree Creation Script with Local Config Copying
# Location: .claude/scripts/worktree/create-worktree-enhanced.sh

set -e

# Configuration
WORKTREE_BASE="$HOME/projects/worktrees"
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"

# Validate we're in a git repository
if [ -z "$MAIN_REPO_PATH" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Get feature name from argument
if [ -z "$1" ]; then
    echo "Error: Feature name required"
    echo "Usage: $0 <feature-name>"
    exit 1
fi

FEATURE_NAME="$1"
BRANCH_NAME="feature-${FEATURE_NAME}"
WORKTREE_PATH="${WORKTREE_BASE}/${BRANCH_NAME}"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo "Error: Branch '${BRANCH_NAME}' already exists"
    echo "Please choose a different feature name or delete the existing branch"
    exit 1
fi

# Create worktree base directory if it doesn't exist
if [ ! -d "$WORKTREE_BASE" ]; then
    echo "Creating worktree base directory: $WORKTREE_BASE"
    mkdir -p "$WORKTREE_BASE"
fi

# Fetch latest changes
echo "Fetching latest changes from origin..."
git fetch origin dev --quiet

# Create the worktree with new branch
echo "Creating worktree at: $WORKTREE_PATH"
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/dev

# Copy local configuration files
echo ""
echo "📋 Copying local configuration files..."

# Function to safely copy a file if it exists
copy_if_exists() {
    local src="$1"
    local dest="$2"
    local desc="$3"
    
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "   ✅ Copied $desc"
    else
        echo "   ⚠️  No $desc found (skipped)"
    fi
}

# Copy environment files
copy_if_exists "$MAIN_REPO_PATH/.env" "$WORKTREE_PATH/.env" ".env"
copy_if_exists "$MAIN_REPO_PATH/.env.local" "$WORKTREE_PATH/.env.local" ".env.local"
copy_if_exists "$MAIN_REPO_PATH/.env.station" "$WORKTREE_PATH/.env.station" ".env.station"

# Copy MCP configuration
copy_if_exists "$MAIN_REPO_PATH/.mcp.json" "$WORKTREE_PATH/.mcp.json" ".mcp.json"

# Copy Claude local settings
if [ -d "$MAIN_REPO_PATH/.claude" ]; then
    # Create .claude directory if needed
    mkdir -p "$WORKTREE_PATH/.claude"
    
    # Copy local settings files
    copy_if_exists "$MAIN_REPO_PATH/.claude/settings.local.json" \
                   "$WORKTREE_PATH/.claude/settings.local.json" \
                   "Claude local settings"
    
    # Copy any .env files in .claude directory
    if ls "$MAIN_REPO_PATH/.claude"/.env* 1> /dev/null 2>&1; then
        cp "$MAIN_REPO_PATH/.claude"/.env* "$WORKTREE_PATH/.claude/" 2>/dev/null || true
        echo "   ✅ Copied .claude environment files"
    fi
fi

# Copy other common local config files
copy_if_exists "$MAIN_REPO_PATH/.vscode/settings.json" "$WORKTREE_PATH/.vscode/settings.json" "VS Code settings"

# Create a symlink to shared node_modules if it exists (optional optimization)
# This saves disk space and install time for large projects
if [ -d "$MAIN_REPO_PATH/node_modules" ] && [ ! -d "$WORKTREE_PATH/node_modules" ]; then
    echo ""
    read -p "Link to existing node_modules to save space? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ln -s "$MAIN_REPO_PATH/node_modules" "$WORKTREE_PATH/node_modules"
        echo "   ✅ Linked node_modules (saves disk space)"
    else
        # Install dependencies
        echo ""
        echo "Installing dependencies with pnpm..."
        cd "$WORKTREE_PATH"
        pnpm install --frozen-lockfile
    fi
else
    # Install dependencies
    echo ""
    echo "Installing dependencies with pnpm..."
    cd "$WORKTREE_PATH"
    pnpm install --frozen-lockfile
fi

# Open in VS Code if available (non-blocking)
if command -v code &> /dev/null; then
    echo "Opening worktree in VS Code..."
    code -n "$WORKTREE_PATH" 2>/dev/null || true
fi

# Success message with warnings about sensitive files
echo ""
echo "✅ Successfully created worktree!"
echo "   Branch: $BRANCH_NAME"
echo "   Location: $WORKTREE_PATH"
echo "   Based on: origin/dev"
echo ""
echo "⚠️  Security Note: Local config files have been copied."
echo "   These contain sensitive data (API keys, etc.)"
echo "   Remember to:"
echo "   - Never commit .env or .mcp.json files"
echo "   - Keep different keys for dev/staging/production"
echo ""
echo "WORKTREE_PATH=$WORKTREE_PATH"
```