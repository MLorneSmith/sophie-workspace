# Context7 Research: E2B CLI Documentation

**Date**: 2026-01-22
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary
Comprehensive research on E2B CLI documentation including installation, authentication, template management commands, sandbox lifecycle commands, and usage patterns.

## Findings

### 1. Installation

E2B CLI can be installed via multiple methods:

```bash
# NPM (recommended for Node.js users)
npm install -g @e2b/cli

# Homebrew (macOS)
brew install e2b

# Beta version
npm i -g @e2b/cli@beta
```

### 2. Authentication

#### Login Command
```bash
e2b auth login
```
This authenticates the E2B CLI with your E2B account. Required before creating or managing custom sandbox templates.

#### Environment Variable Authentication
For non-interactive sessions (CI/CD pipelines):
```bash
E2B_ACCESS_TOKEN=sk_e2b_... e2b template build
```

#### API Key Configuration
- Set `E2B_API_KEY` environment variable for SDK authentication
- Can be passed programmatically via `apiKey` option in SDK

### 3. Template Commands

#### e2b template (base command)
```bash
e2b template [options] [command]
```
Entry point for all template-related operations.

#### e2b template init
Creates a basic E2B Dockerfile (`./e2b.Dockerfile`) in the root directory.

```bash
e2b template init [options]

Options:
  -p, --path <path>    Change root directory for command execution
```

#### e2b template build
Builds a sandbox template from a Dockerfile.

```bash
e2b template build [options] [template]

Options:
  -p, --path <path>           Change root directory for execution
  -d, --dockerfile <file>     Path to Dockerfile (default: e2b.Dockerfile or Dockerfile)
  -n, --name <template-name>  Sandbox template name (lowercase, alphanumeric, dashes, underscores)
  -c, --cmd <start-command>   Command executed when sandbox starts
  --ready-cmd <ready-command> Command that must exit 0 for template readiness
  -t, --team <team-id>        Team ID for the operation
  --config <e2b-toml>         Path to E2B config TOML (default: ./e2b.toml)
  --cpu-count <cpu-count>     Number of CPUs (default: 2)
  --memory-mb <memory-mb>     Memory in MB, must be even (default: 512)
  --build-arg <args...>       Build arguments in format <varname>=<value>
  --no-cache                  Skip cache when building
```

**Example:**
```bash
e2b template build -n my-template -c "npm start" --cpu-count 4 --memory-mb 1024
```

#### e2b template list
Lists all available sandbox templates.

```bash
e2b template list [options]

Options:
  -t, --team <team-id>    Filter by team ID
  -f, --format <format>   Output format: json, pretty
```

**Example:**
```bash
e2b template list -f json
```

#### e2b template publish
Publishes a sandbox template for use.

```bash
e2b template publish [options] [template]

Options:
  -p, --path <path>       Change root directory
  --config <e2b-toml>     Path to E2B config TOML
  -s, --select            Select template from interactive list
  -t, --team <team-id>    Team ID for the operation
  -y, --yes               Skip manual confirmation
```

**Example:**
```bash
e2b template publish -s -y
```

#### e2b template unpublish
Removes a template from public availability.

```bash
e2b template unpublish [options] [template]

Options:
  -p, --path <path>       Change root directory
  --config <e2b-toml>     Path to E2B config TOML
  -s, --select            Select template from interactive list
  -t, --team <team-id>    Team ID for the operation
  -y, --yes               Skip manual confirmation
```

#### e2b template delete
Deletes a sandbox template and its e2b.toml configuration.

```bash
e2b template delete [options] [template]

Options:
  -p, --path <path>       Change root directory
  --config <e2b-toml>     Path to E2B config TOML
  -s, --select            Select template from interactive list
  -t, --team <team-id>    Team ID for the operation
  -y, --yes               Skip manual confirmation
```

**Example:**
```bash
e2b template delete -s -y
```

#### e2b template migrate
Migrates e2b.Dockerfile and e2b.toml to the new Template SDK format.

```bash
e2b template migrate [options]
```

### 4. Sandbox Commands

#### e2b sandbox (base command)
```bash
e2b sandbox [options] [command]
```
Entry point for sandbox lifecycle management.

#### e2b sandbox create / e2b sandbox spawn
Creates a new sandbox and connects a terminal to it.

```bash
e2b sandbox create [options] [template]
e2b sandbox spawn [options] [template]

Options:
  -p, --path <path>       Change root directory
  --config <e2b-toml>     Path to E2B config TOML
```

#### e2b sandbox list
Lists all available sandboxes.

```bash
e2b sandbox list [options]

Options:
  -s, --state <state>         Filter by state: running, paused (default: running)
  -m, --metadata <metadata>   Filter by metadata: key1=value1
  -l, --limit <limit>         Limit number of sandboxes returned
  -f, --format <format>       Output format: json, table
```

#### e2b sandbox kill
Terminates one or more sandboxes.

```bash
e2b sandbox kill [options] [sandboxIDs...]

Options:
  -a, --all                   Kill all sandboxes
  -s, --state <state>         Filter by state when using --all (default: running)
  -m, --metadata <metadata>   Filter by metadata when using --all
```

#### e2b sandbox metrics
Displays performance metrics for a sandbox.

```bash
e2b sandbox metrics [options] <sandboxID>

Options:
  -f, --follow              Stream metrics until sandbox closes
  --format <format>         Output format: json, pretty (default: pretty)
```

**Example Output:**
```
Metrics for sandbox <sandbox_id>

[2025-07-25 14:05:55Z]  CPU:  8.27% /  2 Cores | Memory:    31 / 484   MiB | Disk:  1445 / 2453  MiB
[2025-07-25 14:06:00Z]  CPU:   0.5% /  2 Cores | Memory:    32 / 484   MiB | Disk:  1445 / 2453  MiB
```

#### e2b sandbox logs
Retrieves and displays logs for a sandbox.

```bash
e2b sandbox logs [options] <sandboxID>

Options:
  --level <level>           Filter by log level: DEBUG, INFO, WARN, ERROR (default: INFO)
  -f, --follow              Stream logs until sandbox closes
  --format <format>         Output format: json, pretty (default: pretty)
  --loggers [loggers]       Filter by logger names (comma-separated)
```

### 5. Configuration Files

#### e2b.toml
Configuration file for E2B templates. Created automatically during `template build`. Default location: `./e2b.toml`

#### e2b.Dockerfile
Custom Dockerfile for building sandbox templates. Default location: `./e2b.Dockerfile`

### 6. Common Patterns

#### Basic Template Workflow
```bash
# 1. Login
e2b auth login

# 2. Initialize template
e2b template init

# 3. Edit e2b.Dockerfile as needed

# 4. Build template
e2b template build -n my-custom-sandbox

# 5. Test by spawning
e2b sandbox spawn my-custom-sandbox

# 6. Publish for team use
e2b template publish -y
```

#### CI/CD Integration
```bash
# Use environment variable for auth
export E2B_ACCESS_TOKEN=sk_e2b_...

# Build with specific settings
e2b template build \
  -n production-sandbox \
  --cpu-count 4 \
  --memory-mb 2048 \
  --no-cache

# List and verify
e2b template list -f json
```

#### Monitoring Running Sandboxes
```bash
# List all running sandboxes
e2b sandbox list

# Monitor specific sandbox metrics
e2b sandbox metrics -f <sandbox_id>

# View sandbox logs
e2b sandbox logs -f <sandbox_id>

# Kill all running sandboxes
e2b sandbox kill -a
```

#### Filtering Sandboxes
```bash
# List paused sandboxes
e2b sandbox list -s paused

# Filter by metadata
e2b sandbox list -m env=production

# Kill sandboxes with specific metadata
e2b sandbox kill -a -m env=staging
```

## Key Takeaways

- E2B CLI is installed via npm (`@e2b/cli`) or Homebrew
- Authentication via `e2b auth login` or `E2B_ACCESS_TOKEN` environment variable
- Template workflow: init -> build -> publish
- Sandbox commands manage lifecycle: create/spawn, list, kill, metrics, logs
- Configuration stored in `e2b.toml` and `e2b.Dockerfile`
- Team ID can be specified for all template operations via `-t, --team` flag
- Output formats support both human-readable (`pretty`) and machine-readable (`json`)

## Code Examples

### Complete Template Build
```bash
e2b template build \
  -n nodejs-sandbox \
  -c "node server.js" \
  --ready-cmd "curl -s http://localhost:3000/health" \
  --cpu-count 2 \
  --memory-mb 1024 \
  --build-arg NODE_ENV=production \
  -t team_abc123
```

### Sandbox Lifecycle Management
```bash
# Create and connect
e2b sandbox spawn nodejs-sandbox

# List with filters
e2b sandbox list -s running -l 10 -f json

# Monitor
e2b sandbox metrics -f sbx_123abc

# Cleanup
e2b sandbox kill sbx_123abc
```

## Sources

- e2b-dev/e2b via Context7 (https://github.com/e2b-dev/e2b)
- CLI Reference: docs/sdk-reference/cli/v2.2.4/
- CLI Main Page: docs/cli/page.mdx
- CLI README: packages/cli/README.md
