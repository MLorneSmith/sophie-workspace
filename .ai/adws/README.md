# AI Developer Workflow (ADW) System

ADW automates software development by integrating GitHub issues with Claude Code CLI to classify issues,
generate plans, implement solutions, and create pull requests.

## Authentication Options

- **Claude Max Plan**: Use your Claude subscription (recommended for high-volume usage)
- **API Key**: Traditional pay-as-you-go (better for sporadic usage)
- **Auto-detection**: ADWS automatically uses whichever authentication is available

## Quick Start

### 1. Choose Authentication Method

#### Option A: Claude Max Plan (Recommended)

```bash
# Authenticate Claude Code with your Max subscription
claude  # Follow prompts to log in with Max plan credentials

# Set required environment variables
export GITHUB_REPO_URL="https://github.com/owner/repository"
export CLAUDE_CODE_PATH="/path/to/claude"  # Optional, defaults to "claude"
export GITHUB_PAT="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Optional, only if using different account than 'gh auth login'
```

#### Option B: API Key (Fallback)

```bash
export GITHUB_REPO_URL="https://github.com/owner/repository"
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CLAUDE_CODE_PATH="/path/to/claude"  # Optional, defaults to "claude"
export GITHUB_PAT="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Optional, only if using different account than 'gh auth login'
```

### 2. Install Prerequisites

```bash
# GitHub CLI
brew install gh              # macOS
# or: sudo apt install gh    # Ubuntu/Debian
# or: winget install --id GitHub.cli  # Windows

# Claude Code CLI
# Follow instructions at https://docs.anthropic.com/en/docs/claude-code

# Python dependency manager (uv)
curl -LsSf https://astral.sh/uv/install.sh | sh  # macOS/Linux
# or: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows

# Authenticate GitHub
gh auth login
```

### 3. Run ADW

```bash
cd adws/

# Process a single issue manually
uv run adw_plan_build.py 123

# Run continuous monitoring (polls every 20 seconds)
uv run trigger_cron.py

# Start webhook server (for instant GitHub events)
uv run trigger_webhook.py
```

## Script Usage Guide

### test_auth.py - Verify Authentication

Tests and displays your authentication configuration.

```bash
# Run authentication test
uv run test_auth.py

# Example output:
# ✅ Authentication found: session
#    Using Claude Max plan session authentication
#
# Environment Configuration
#   HOME: /home/user
#   CLAUDE_CODE_PATH: claude
#   ...
```

**What it checks:**

- Claude Code session authentication (Max plan)
- API key authentication (fallback)
- Environment variables configuration
- Next steps and recommendations

### adw_plan_build.py - Process Single Issue

Executes the complete ADW workflow for a specific GitHub issue.

```bash
# Basic usage
uv run adw_plan_build.py 456

# What it does:
# 1. Fetches issue #456 from GitHub
# 2. Creates feature branch
# 3. Classifies issue type (/chore, /bug-plan, /feature)
# 4. Generates implementation plan
# 5. Implements the solution
# 6. Creates commits and pull request
```

**Example output:**

```text
ADW ID: e5f6g7h8
issue_command: /feature
Working on branch: feat-456-e5f6g7h8-add-user-authentication
plan_file_path: specs/add-user-authentication-system-plan.md
Pull request created: https://github.com/owner/repo/pull/789
```

### trigger_cron.py - Automated Monitoring

Continuously monitors GitHub for new issues or "adw" comments.

```bash
# Start monitoring
uv run trigger_cron.py

# Processes issues when:
# - New issue has no comments
# - Latest comment on any issue is exactly "adw"

# Example log output:
# 2024-01-15 10:30:45 - Starting ADW cron trigger
# 2024-01-15 10:30:46 - Issue #123 has no comments - processing
# 2024-01-15 10:30:47 - Issue #456 - latest comment is 'adw' - processing
```

**Production deployment with systemd:**

```bash
# Create service file: /etc/systemd/system/adw-cron.service
sudo systemctl enable adw-cron
sudo systemctl start adw-cron
```

### trigger_webhook.py - GitHub Webhook Server

Receives real-time GitHub events for instant processing.

```bash
# Start webhook server (default port 8001)
uv run trigger_webhook.py

# Custom port
PORT=3000 uv run trigger_webhook.py

# Configure GitHub webhook:
# URL: https://your-server.com/gh-webhook
# Events: Issues, Issue comments
```

**Endpoints:**

- `/gh-webhook` - Receives GitHub events
- `/health` - Health check endpoint

## How ADW Works

1. **Issue Classification**: Analyzes GitHub issue and determines type:
   - `/chore` - Maintenance, documentation, refactoring
   - `/bug-plan` - Bug fixes and corrections
   - `/feature` - New features and enhancements

2. **Planning**: `sdlc_planner` agent creates implementation plan with:
   - Technical approach
   - Step-by-step tasks
   - File modifications
   - Testing requirements

3. **Implementation**: `sdlc_implementor` agent executes the plan:
   - Analyzes codebase
   - Implements changes
   - Runs tests
   - Ensures quality

4. **Integration**: Creates git commits and pull request:
   - Semantic commit messages
   - Links to original issue
   - Implementation summary

## Common Usage Scenarios

### Process a bug report

```bash
# User reports bug in issue #789
uv run adw_plan_build.py 789
# ADW analyzes, creates fix, and opens PR
```

### Enable automatic processing

```bash
# Start cron monitoring
uv run trigger_cron.py
# New issues are processed automatically
# Users can comment "adw" to trigger processing
```

### Deploy webhook for instant response

```bash
# Start webhook server
uv run trigger_webhook.py
# Configure in GitHub settings
# Issues processed immediately on creation
```

## Troubleshooting

### Environment Issues

```bash
# Check required variables
env | grep -E "(GITHUB|ANTHROPIC|CLAUDE)"

# Verify GitHub auth
gh auth status

# Test Claude Code
claude --version
```

### Common Errors

#### "Claude Code CLI is not installed"

```bash
which claude  # Check if installed
# Reinstall from https://docs.anthropic.com/en/docs/claude-code
```

**"Missing GITHUB_PAT"** (Optional - only needed if using different account than 'gh auth login')

```bash
export GITHUB_PAT=$(gh auth token)
```

#### "Agent execution failed"

```bash
# Check agent output
cat agents/*/sdlc_planner/raw_output.jsonl | tail -1 | jq .
```

### Debug Mode

```bash
export ADW_DEBUG=true
uv run adw_plan_build.py 123  # Verbose output
```

## Authentication

ADWS supports two authentication methods for Claude Code:

### Claude Max Plan (Recommended)

**Benefits:**

- Shared usage limits across Claude web/mobile and CLI
- Max 5x: $100/month (~50-200 prompts per 5-hour window)
- Max 10x: $200/month (20x higher limits)
- More cost-effective for high-volume usage

**Setup:**

```bash
# One-time authentication
claude  # Follow prompts to log in

# Verify authentication
claude --version

# ADWS will automatically detect and use your session
uv run adw_plan_build.py 123
```

### API Key (Fallback)

**Benefits:**

- Pay-as-you-go pricing
- No subscription required
- Better for sporadic usage

**Setup:**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
uv run adw_plan_build.py 123
```

### Authentication Status

ADWS automatically detects which authentication method is available:

- Checks for Claude Code session first (Max plan)
- Falls back to API key if no session found
- Displays authentication type when running

**Testing Authentication:**

```bash
# Run authentication test
uv run test_auth.py

# Shows:
# - Which authentication method is active
# - Environment configuration
# - Next steps
```

**Troubleshooting:**

```bash
# Check if Claude is authenticated
claude --version  # Should succeed without errors

# Re-authenticate if needed
rm -rf ~/.claude/session.json
claude  # Log in again

# Verify API key (if using)
echo $ANTHROPIC_API_KEY
```

## Configuration

### ADW Tracking

Each workflow run gets a unique 8-character ID (e.g., `a1b2c3d4`) that appears in:

- Issue comments: `a1b2c3d4_ops: ✅ Starting ADW workflow`
- Output files: `agents/a1b2c3d4/sdlc_planner/raw_output.jsonl`
- Git commits and PRs

### Model Selection

Edit `agent.py` line 129 to change model:

- `model="sonnet"` - Faster, lower cost (default)
- `model="opus"` - Better for complex tasks

### Output Structure

```text
agents/
├── a1b2c3d4/
│   ├── sdlc_planner/
│   │   └── raw_output.jsonl
│   └── sdlc_implementor/
│       └── raw_output.jsonl
```

## Security Best Practices

- Store tokens as environment variables, never in code
- Use GitHub fine-grained tokens with minimal permissions
- Set up branch protection rules
- Require PR reviews for ADW changes
- Monitor API usage and set billing alerts

## Technical Details

### Core Components

- `agent.py` - Claude Code CLI integration
- `data_types.py` - Pydantic models for type safety
- `github.py` - GitHub API operations
- `adw_plan_build.py` - Main workflow orchestration (plan & build)

### Branch Naming

```text
{type}-{issue_number}-{adw_id}-{slug}
```

Example: `feat-456-e5f6g7h8-add-user-authentication`

### Commit Format

```text
{type}: {description} for #{issue_number}

Generated with ADW ID: {adw_id}
🤖 Generated with [Claude Code](https://claude.ai/code)
```

### API Rate Limits

- GitHub: 5000 requests/hour (authenticated)
- Anthropic: Based on your plan tier
- Automatic retry with exponential backoff
