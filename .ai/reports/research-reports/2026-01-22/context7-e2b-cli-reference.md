# Context7 Research: E2B CLI Reference

**Date**: 2026-01-22
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, websites/e2b_dev

## Query Summary

Researched E2B documentation to understand CLI tooling for sandbox management, including installation, authentication, and commands for interacting with running sandboxes.

## Findings

### 1. CLI Name and Installation

**Package Name**: `@e2b/cli`

**Installation Methods**:

```bash
# NPM (recommended for Node.js environments)
npm i -g @e2b/cli

# Homebrew (macOS)
brew install e2b

# Beta version (latest features)
npm i -g @e2b/cli@beta
```

### 2. Authentication/Configuration

**Two Authentication Methods**:

#### Browser-based Authentication (Interactive)
```bash
e2b auth login
```
Opens the default browser for user login. Best for interactive CLI sessions.

#### Environment Variable Authentication (Non-interactive)
```bash
export E2B_API_KEY=your_api_key_here
export E2B_ACCESS_TOKEN=your_access_token_here

# Or inline with commands
E2B_ACCESS_TOKEN=sk_e2b_... e2b template build
```
Best for CI/CD pipelines and automation scripts.

**Logout**:
```bash
e2b auth logout
```

### 3. Sandbox Commands

#### List Running Sandboxes
```bash
e2b sandbox list

# With options
e2b sandbox list [options]
  -s, --state <state>      # Filter by state (running, paused). Default: running
  -m, --metadata <key=val> # Filter by metadata
  -l, --limit <limit>      # Limit number of results
  -f, --format <format>    # Output format (json, table)
```

#### Create/Spawn a Sandbox
```bash
# Create and connect terminal
e2b sandbox create [options] [template]
e2b sandbox spawn [options] [template]

# Options
  -p, --path <path>        # Change root directory
  --config <e2b-toml>      # Specify config file path
```

#### Connect to Running Sandbox
```bash
e2b sandbox connect [options] <sandboxID>
```
Connects a terminal to an already running sandbox.

#### Kill/Terminate Sandboxes
```bash
# Kill specific sandbox(es)
e2b sandbox kill <sandbox-id1> <sandbox-id2>

# Kill all sandboxes
e2b sandbox kill --all

# Kill with filters
e2b sandbox kill --all --state=running,paused
e2b sandbox kill --all --metadata=key=value
e2b sandbox kill --all --state=running --metadata=key=value

# Options
  -a, --all                # Kill all sandboxes
  -s, --state <state>      # Filter by state (with --all)
  -m, --metadata <meta>    # Filter by metadata (with --all)
```

#### View Sandbox Logs
```bash
e2b sandbox logs [options] <sandboxID>
```
Displays logs for a specific sandbox. Supports filtering by log level, following logs in real-time, and specifying output format.

#### View Sandbox Metrics
```bash
e2b sandbox metrics [options] <sandboxID>

# Options
  -f, --follow             # Stream metrics until sandbox closes
  --format <format>        # Output format (json, pretty). Default: pretty

# Example output:
# Metrics for sandbox <sandbox_id>
# [2025-07-25 14:05:55Z]  CPU:  8.27% /  2 Cores | Memory:    31 / 484   MiB | Disk:  1445 / 2453  MiB
```

### 4. Template Management Commands

```bash
# Initialize template (creates e2b.Dockerfile)
e2b template init [options]

# Build template
e2b template build [options] [template]
  -d, --dockerfile <file>    # Specify Dockerfile path
  -n, --name <name>          # Template name (lowercase, alphanumeric, dashes, underscores)
  -c, --cmd <start-cmd>      # Command run when sandbox starts
  --ready-cmd <ready-cmd>    # Command to exit 0 when template is ready
  -t, --team <team-id>       # Team ID
  --cpu-count <count>        # CPU count (default: 2)
  --memory-mb <mb>           # Memory in MB (default: 512, must be even)
  --build-arg <args...>      # Build arguments (<varname>=<value>)
  --no-cache                 # Skip cache

# List templates
e2b template list [options]
  -t, --team <team-id>       # Filter by team
  -f, --format <format>      # Output format (json, pretty)

# Publish template
e2b template publish [options] [template]
  -s, --select               # Interactive selection
  -y, --yes                  # Skip confirmation

# Unpublish template
e2b template unpublish [options] [template]

# Delete template
e2b template delete [options] [template]
  -s, --select               # Interactive selection
  -y, --yes                  # Skip confirmation

# Migrate to new template format
e2b template migrate [options]
```

## Key Takeaways

- **CLI Package**: `@e2b/cli` installed via npm or Homebrew
- **Authentication**: Use `e2b auth login` interactively or `E2B_API_KEY`/`E2B_ACCESS_TOKEN` environment variables
- **List sandboxes**: `e2b sandbox list` with optional state/metadata filters
- **Connect to sandbox**: `e2b sandbox connect <sandboxID>` connects terminal to running sandbox
- **View logs**: `e2b sandbox logs <sandboxID>` for debugging
- **View metrics**: `e2b sandbox metrics <sandboxID>` for CPU/memory/disk monitoring
- **Kill sandboxes**: `e2b sandbox kill` supports individual IDs or `--all` with filters

## Practical Debugging Workflow

```bash
# 1. Authenticate
export E2B_API_KEY=your_api_key
# or
e2b auth login

# 2. List running sandboxes
e2b sandbox list

# 3. Get metrics for a specific sandbox
e2b sandbox metrics <sandbox-id> -f  # -f follows/streams

# 4. View logs
e2b sandbox logs <sandbox-id>

# 5. Connect terminal to sandbox
e2b sandbox connect <sandbox-id>

# 6. Clean up when done
e2b sandbox kill <sandbox-id>
# or kill all
e2b sandbox kill --all
```

## Sources

- E2B GitHub Repository via Context7 (e2b-dev/e2b)
- E2B Documentation Website via Context7 (websites/e2b_dev)
