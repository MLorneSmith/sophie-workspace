# E2B CLI Reference

**Purpose**: Comprehensive reference for E2B CLI commands, sandbox management, and template workflows for running isolated code execution environments.

**Related Files**:

- `.claude/skills/e2b-sandbox.md` - E2B sandbox skill for Claude Code
- `.ai/ai_docs/tool-docs/docker-setup.md` - Local container reference
- `.github/workflows/` - CI/CD integration patterns

## Installation

```bash
# NPM (recommended)
npm install -g @e2b/cli

# pnpm
pnpm add -g @e2b/cli

# Homebrew (macOS)
brew install e2b

# Beta version
npm i -g @e2b/cli@beta

# Verify installation
e2b --version
```

## Authentication

```bash
# Interactive login (opens browser)
e2b auth login

# Verify authentication
e2b auth info

# Logout
e2b auth logout
```

**CI/CD Environment Variable**:

```bash
# Set access token for non-interactive environments
export E2B_ACCESS_TOKEN=sk_e2b_...

# Use in CI/CD
E2B_ACCESS_TOKEN=${{ secrets.E2B_TOKEN }} e2b template build
```

## Core Commands

### Template Management

Templates define the environment for sandboxes. They are built from Dockerfiles and can include pre-installed dependencies, cloned repositories, and custom configurations.

```bash
# Initialize template (creates e2b.Dockerfile)
e2b template init

# Build template from Dockerfile
e2b template build

# Build with options
e2b template build \
  -n my-template \
  --cpu-count 4 \
  --memory-mb 2048 \
  --dockerfile ./custom.Dockerfile

# List all templates
e2b template list

# Publish template for use
e2b template publish
e2b template publish -y  # Skip confirmation

# Unpublish template
e2b template unpublish

# Delete template and config
e2b template delete

# Migrate to new SDK format
e2b template migrate
```

**Template Build Options**:

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Change root directory | Current dir |
| `-d, --dockerfile <file>` | Path to Dockerfile | `e2b.Dockerfile` |
| `-n, --name <name>` | Template name (lowercase, alphanumeric) | From config |
| `-c, --cmd <command>` | Command to run on sandbox start | None |
| `--ready-cmd <command>` | Readiness check command | None |
| `-t, --team <team-id>` | Team ID for organization | Default team |
| `--config <path>` | Config file path | `e2b.toml` |
| `--cpu-count <count>` | Number of CPUs | 2 |
| `--memory-mb <mb>` | Memory in megabytes | 512 |
| `--build-arg <args...>` | Docker build arguments | None |
| `--no-cache` | Skip build cache | false |

### Sandbox Management

Sandboxes are running instances of templates. They provide isolated execution environments.

```bash
# Create sandbox and connect terminal
e2b sandbox create <template-name>
e2b sandbox spawn <template-name>  # Alias

# Create with custom timeout
e2b sandbox create my-template --timeout 3600

# List all sandboxes
e2b sandbox list

# List with filters
e2b sandbox list -s running           # Filter by state
e2b sandbox list -m key=value         # Filter by metadata
e2b sandbox list -l 10                # Limit results
e2b sandbox list -f json              # JSON output

# View sandbox logs
e2b sandbox logs <sandbox-id>
e2b sandbox logs -f <sandbox-id>      # Follow logs
e2b sandbox logs --level DEBUG <id>   # Debug level

# View sandbox metrics
e2b sandbox metrics <sandbox-id>
e2b sandbox metrics -f <sandbox-id>   # Follow metrics

# Kill sandboxes
e2b sandbox kill <sandbox-id>
e2b sandbox kill <id1> <id2> <id3>    # Multiple
e2b sandbox kill -a                    # Kill all
e2b sandbox kill -s running           # Filter by state
e2b sandbox kill -m env=dev           # Filter by metadata
```

**Sandbox List Options**:

| Option | Description |
|--------|-------------|
| `-s, --state <state>` | Filter by state: `running`, `paused` |
| `-m, --metadata <key=value>` | Filter by metadata |
| `-l, --limit <limit>` | Limit number of results |
| `-f, --format <format>` | Output format: `json`, `table` |

## Configuration Files

### e2b.toml

Auto-generated during `template build`. Contains template configuration:

```toml
# Template identifier
template_id = "abc123xyz"

# Template settings
[template]
name = "my-sandbox"
dockerfile = "e2b.Dockerfile"

# Resource allocation
[resources]
cpu_count = 2
memory_mb = 512

# Startup configuration
[startup]
command = "/bin/bash"
ready_command = "curl -s localhost:3000/health"
```

### e2b.Dockerfile

Custom Dockerfile for sandbox environment:

```dockerfile
# Start from E2B base image
FROM e2b/base:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    git

# Clone repository
RUN git clone https://github.com/org/repo.git /app

# Set working directory
WORKDIR /app

# Install project dependencies
RUN npm install

# Default command
CMD ["/bin/bash"]
```

## Common Workflows

### Basic Template Workflow

```bash
# 1. Authenticate
e2b auth login

# 2. Initialize template
e2b template init

# 3. Customize Dockerfile
# Edit e2b.Dockerfile as needed

# 4. Build template
e2b template build -n my-sandbox

# 5. Test sandbox
e2b sandbox spawn my-sandbox

# 6. Publish for production use
e2b template publish -y
```

### SlideHeroes Integration

```bash
# Create template with project dependencies
e2b template build \
  -n slideheroes-sandbox \
  --cpu-count 4 \
  --memory-mb 4096 \
  --dockerfile ./e2b.Dockerfile

# Spawn sandbox for Claude Code agent
e2b sandbox create slideheroes-sandbox

# Monitor running sandboxes
e2b sandbox list -s running -f json
```

### CI/CD Integration

```bash
# GitHub Actions example
export E2B_ACCESS_TOKEN=${{ secrets.E2B_TOKEN }}

# Build template on push
e2b template build -n prod-sandbox --no-cache

# Publish after successful build
e2b template publish -y

# Cleanup stale sandboxes
e2b sandbox kill -a -m env=ci
```

### Monitoring & Debugging

```bash
# List all running sandboxes
e2b sandbox list -s running

# View real-time metrics
e2b sandbox metrics -f <sandbox-id>

# Debug with verbose logs
e2b sandbox logs -f --level DEBUG <sandbox-id>

# Kill unresponsive sandbox
e2b sandbox kill <sandbox-id>
```

## SDK Integration

The CLI creates templates that can be used with E2B SDKs:

```typescript
// TypeScript SDK usage
import { Sandbox } from '@e2b/code-interpreter';

// Create sandbox from template built with CLI
const sandbox = await Sandbox.create('my-template');

// Execute code
const result = await sandbox.runCode('print("Hello, World!")');

// Cleanup
await sandbox.kill();
```

```python
# Python SDK usage
from e2b_code_interpreter import Sandbox

# Create sandbox from template
sandbox = Sandbox("my-template")

# Execute code
result = sandbox.run_code('print("Hello, World!")')

# Cleanup
sandbox.kill()
```

## Troubleshooting

### Authentication Issues

```bash
# Re-authenticate
e2b auth logout
e2b auth login

# Verify token
e2b auth info

# Check environment variable
echo $E2B_ACCESS_TOKEN
```

### Build Failures

```bash
# Rebuild without cache
e2b template build --no-cache

# Check Dockerfile syntax
docker build -f e2b.Dockerfile .

# Verify base image availability
docker pull e2b/base:latest
```

### Sandbox Connection Issues

```bash
# Check sandbox status
e2b sandbox list -f json | jq '.[] | select(.id == "SANDBOX_ID")'

# View logs for errors
e2b sandbox logs --level DEBUG <sandbox-id>

# Force kill and recreate
e2b sandbox kill <sandbox-id>
e2b sandbox create <template-name>
```

### Resource Limits

```bash
# Increase resources during build
e2b template build \
  --cpu-count 4 \
  --memory-mb 4096

# Check current template settings
cat e2b.toml
```

### Team/Organization Issues

```bash
# Specify team explicitly
e2b template build -t <team-id>

# List available teams
e2b auth info
```

## Best Practices

1. **Use meaningful template names** - Lowercase, alphanumeric, descriptive
2. **Set appropriate resource limits** - Match workload requirements
3. **Use ready commands** - Ensure sandbox is fully initialized before use
4. **Clean up sandboxes** - Kill unused sandboxes to avoid resource waste
5. **Use metadata for filtering** - Tag sandboxes with `env`, `purpose`, etc.
6. **Store tokens securely** - Use environment variables, never commit tokens
7. **Version templates** - Use naming conventions like `my-template-v2`
8. **Test locally first** - Validate Dockerfile with Docker before E2B build

## Environment Variables

| Variable | Description |
|----------|-------------|
| `E2B_ACCESS_TOKEN` | API access token for authentication |
| `E2B_DEBUG` | Enable debug logging |
| `E2B_TEAM_ID` | Default team ID for operations |

## Related Documentation

- **E2B Sandbox Skill**: `.claude/skills/e2b-sandbox.md` - Claude Code integration
- **Docker Setup**: `.ai/ai_docs/tool-docs/docker-setup.md` - Local container reference
- **CI/CD Workflows**: `.github/workflows/` - Automated deployment pipelines
- **Initiative Workflow**: `.ai/ai_docs/tool-docs/initiative-workflow.md` - Sandbox-based feature development
