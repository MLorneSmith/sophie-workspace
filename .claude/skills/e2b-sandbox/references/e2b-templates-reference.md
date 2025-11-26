# E2B Templates Reference

Deep dive into E2B custom templates for AI agent workflows.

## Template Architecture

Templates are pre-built VM images containing:
- Base operating system
- Pre-installed software and dependencies
- Pre-cloned repositories
- Custom configuration and scripts

**Lifecycle:**
1. **Build** - Docker image → E2B VM image (5-15 minutes)
2. **Store** - Cached in E2B infrastructure
3. **Spawn** - VM created from template (2-10 seconds)
4. **Ready** - `ready_cmd` exits 0

## Dockerfile Best Practices

### Base Images

```dockerfile
# Code interpreter (Python, Jupyter, common packages)
FROM e2bdev/code-interpreter:latest

# Minimal base
FROM e2bdev/base:latest
```

### Layer Optimization

```dockerfile
# ✅ GOOD: Single RUN command, clean up after
RUN apt-get update && apt-get install -y \
    git curl vim \
    && rm -rf /var/lib/apt/lists/*

# ❌ BAD: Multiple RUN commands (larger image)
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y curl
```

### Pre-clone Repository

```dockerfile
# Clone at specific branch/tag for reproducibility
RUN git clone --branch main --single-branch \
    https://github.com/org/repo.git /home/user/project

# Or specific commit
RUN git clone https://github.com/org/repo.git /home/user/project && \
    cd /home/user/project && \
    git checkout abc123def
```

### Dependency Caching

```dockerfile
# Copy package files first (better Docker cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Then copy source (changes more frequently)
COPY . .
```

## e2b.toml Configuration

### Complete Options

```toml
# Template identification
template_id = "my-template"           # Auto-generated after first build
template_name = "my-dev-environment"  # Human-readable name

# Build configuration
dockerfile = "e2b.Dockerfile"         # Dockerfile path (default: e2b.Dockerfile)

# Startup configuration
start_cmd = "/usr/local/bin/start.sh" # Runs when sandbox starts (background)
ready_cmd = "curl localhost:3000"     # Must exit 0 for sandbox to be "ready"

# Resource allocation
cpu_count = 4                         # CPUs (default: 2)
memory_mb = 2048                      # Memory in MB (default: 512, must be even)

# Team/organization
team_id = "team-abc123"               # Associate with team
```

### Resource Allocation Guide

| Workload | CPU | Memory | Notes |
|----------|-----|--------|-------|
| Basic code execution | 2 | 512 | Default, sufficient for simple tasks |
| Unit tests | 2 | 1024 | More memory for test frameworks |
| E2E tests (Playwright) | 4 | 2048 | Browser needs resources |
| Full build + test | 4 | 2048 | Parallel compilation |
| Data science/ML | 8 | 4096 | Heavy compute |

## CLI Commands Reference

### Template Build

```bash
e2b template build [options]

Options:
  -n, --name <name>       Template name
  -c, --cmd <command>     Startup command
  --ready-cmd <command>   Readiness check command
  --cpu-count <count>     CPU count (default: 2)
  --memory-mb <mb>        Memory in MB (default: 512)
  --build-arg <arg>       Docker build argument (repeatable)
  --no-cache              Skip Docker cache
  -t, --team <id>         Team ID
  -p, --path <path>       Path to Dockerfile directory
```

### Template List

```bash
e2b template list [options]

Options:
  -f, --format <format>   Output format: table, json
  -t, --team <id>         Filter by team
```

### Template Delete

```bash
e2b template delete <template-id> [options]

Options:
  -y, --yes               Skip confirmation
  -s, --select            Interactive selection
  -t, --team <id>         Team ID
```

### Sandbox Spawn (Testing)

```bash
e2b sandbox spawn <template-id>

# Opens interactive shell in sandbox
```

## Dockerfile Examples

### Next.js Monorepo

```dockerfile
FROM e2bdev/code-interpreter:latest

# System deps
RUN apt-get update && apt-get install -y \
    git curl vim jq \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# pnpm with corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Clone and setup
RUN git clone https://github.com/org/nextjs-monorepo.git /home/user/project
WORKDIR /home/user/project
RUN pnpm install
RUN pnpm build || true

# Helper scripts
COPY scripts/run-tests.sh /usr/local/bin/run-tests
COPY scripts/build.sh /usr/local/bin/build-project
RUN chmod +x /usr/local/bin/run-tests /usr/local/bin/build-project

ENV PROJECT_ROOT=/home/user/project
ENV NODE_ENV=development
```

### Python Data Science

```dockerfile
FROM e2bdev/code-interpreter:latest

# Scientific packages
RUN pip install --no-cache-dir \
    pandas numpy scipy matplotlib seaborn \
    scikit-learn xgboost lightgbm \
    jupyter jupyterlab

# Clone project
RUN git clone https://github.com/org/ml-project.git /home/user/project
WORKDIR /home/user/project
RUN pip install -e .

ENV PYTHONPATH=/home/user/project
```

### Rust Project

```dockerfile
FROM e2bdev/code-interpreter:latest

# Rust toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Clone and build
RUN git clone https://github.com/org/rust-project.git /home/user/project
WORKDIR /home/user/project
RUN cargo build --release
```

### Go Project

```dockerfile
FROM e2bdev/code-interpreter:latest

# Go 1.21
RUN wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz && \
    rm go1.21.0.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"

# Clone and build
RUN git clone https://github.com/org/go-project.git /home/user/project
WORKDIR /home/user/project
RUN go mod download
RUN go build -o /usr/local/bin/app ./cmd/app
```

## Claude Code Integration

### Installing Claude Code in Template

```dockerfile
FROM e2bdev/code-interpreter:latest

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/download/cli | bash
# Or via npm
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure (optional)
RUN mkdir -p /home/user/.config/claude
COPY claude-config.json /home/user/.config/claude/config.json
```

### Running Claude Code in Sandbox

```python
from e2b import Sandbox
import os

sandbox = Sandbox.create(
    template="my-claude-template",
    timeout=600,
    envs={
        "ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"],
    },
)

# Interactive mode
result = sandbox.commands.run(
    "claude",
    timeout=0,  # No timeout for interactive
)

# Non-interactive with prompt
result = sandbox.commands.run(
    'echo "Add error handling to api.ts" | claude -p --dangerously-skip-permissions',
    timeout=300,
)

# With specific model
result = sandbox.commands.run(
    'ANTHROPIC_MODEL=claude-sonnet-4-5-20250514 claude -p "Fix the bug"',
    timeout=300,
)
```

## Advanced Patterns

### Multi-Stage Builds

```dockerfile
# Build stage
FROM node:20 AS builder
WORKDIR /build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# Runtime stage
FROM e2bdev/code-interpreter:latest
COPY --from=builder /build/dist /home/user/project/dist
COPY --from=builder /build/node_modules /home/user/project/node_modules
WORKDIR /home/user/project
```

### Secrets During Build

```bash
# Pass secrets as build args (NOT stored in image)
e2b template build \
  --build-arg NPM_TOKEN=$NPM_TOKEN \
  --build-arg GITHUB_TOKEN=$GITHUB_TOKEN
```

```dockerfile
ARG NPM_TOKEN
ARG GITHUB_TOKEN

# Use secrets for private packages
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    pnpm install && \
    rm ~/.npmrc  # Remove after install
```

### Conditional Builds

```dockerfile
ARG INCLUDE_DEV_TOOLS=true

RUN if [ "$INCLUDE_DEV_TOOLS" = "true" ]; then \
      apt-get update && apt-get install -y vim htop; \
    fi
```

## Troubleshooting

### Build Failures

| Error | Cause | Solution |
|-------|-------|----------|
| "No space left" | Image too large | Use multi-stage build, clean caches |
| "Connection refused" | Network in build | Check if base image has networking |
| "Permission denied" | File permissions | Use `chmod` or run as correct user |
| "Command not found" | PATH not set | Add to ENV PATH in Dockerfile |

### Slow Startup

1. **Check `ready_cmd`** - Should be fast (< 5 seconds)
2. **Reduce `start_cmd` work** - Move to build time
3. **Pre-compile/build** - Don't compile at runtime
4. **Check resource allocation** - Increase CPU/memory

### Template Not Updating

Templates are immutable. To update:
1. Modify Dockerfile
2. Run `e2b template build` (same name)
3. **Existing sandboxes use old template** - must create new sandboxes

## Performance Benchmarks

| Operation | Typical Time |
|-----------|--------------|
| Template build | 5-15 minutes |
| Sandbox spawn (base) | 2-5 seconds |
| Sandbox spawn (custom) | 5-10 seconds |
| File write (small) | < 100ms |
| Command execution | 50-200ms overhead |
| Sandbox kill | < 1 second |

## Security Considerations

### Don't Include in Templates

- API keys or secrets
- Private SSH keys
- Database credentials
- Sensitive configuration

### Pass at Runtime

```python
sandbox = Sandbox.create(
    template="my-template",
    envs={
        "API_KEY": os.environ["API_KEY"],
        "DATABASE_URL": os.environ["DATABASE_URL"],
    },
)
```

### Network Isolation

```python
# Disable internet access
sandbox = Sandbox.create(
    template="my-template",
    allow_internet_access=False,
)
```

### Secure Mode

```python
# Require auth token for all operations
sandbox = Sandbox.create(
    template="my-template",
    secure=True,
)

# Pre-signed URLs for file access
url = sandbox.download_url(path, use_signature_expiration=60)
```
