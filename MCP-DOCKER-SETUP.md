# MCP Docker Setup

This document explains the Docker-based MCP server implementation that replaces unreliable `npx`-based servers with containerized versions.

## Overview

The previous MCP setup relied on `npx` to download and run packages dynamically, causing frequent connection issues and startup delays. This Docker-based solution provides:

- **Reliability**: Pre-built containers eliminate download delays
- **Performance**: Faster startup times and stable connections
- **Consistency**: Same environment across all development setups
- **Maintainability**: Versioned containers and declarative configuration

## Architecture

### Container Overview

| Service                  | Port | Container                      | Original Command                                                                   |
| ------------------------ | ---- | ------------------------------ | ---------------------------------------------------------------------------------- |
| perplexity-ask           | 3001 | `mcp-perplexity`               | `npx -y server-perplexity-ask`                                                     |
| supabase                 | 3002 | `mcp-supabase`                 | `npx -y @supabase/mcp-server-supabase@latest`                                      |
| context7                 | 3003 | `mcp-context7`                 | `npx -y @upstash/context7-mcp`                                                     |
| postgres                 | 3004 | `mcp-postgres`                 | `npx -y @henkey/postgres-mcp-server`                                               |
| browser-tools            | 3005 | `mcp-browser-tools`            | `npx -y @agentdeskai/browser-tools-mcp@latest`                                     |
| code-reasoning           | 3006 | `mcp-code-reasoning`           | `npx -y @mettamatt/code-reasoning`                                                 |
| github                   | 3007 | `mcp-github`                   | `npx -y @modelcontextprotocol/server-github`                                       |
| exa                      | 3008 | `mcp-exa-proxy`                | `npx -y mcp-remote https://mcp.exa.ai/mcp?exaApiKey=...`                           |
| cloudflare-observability | 3009 | `mcp-cloudflare-observability` | `npx -y mcp-remote https://observability.mcp.cloudflare.com/sse`                   |
| cloudflare-bindings      | 3010 | `mcp-cloudflare-bindings`      | `npx -y mcp-remote https://bindings.mcp.cloudflare.com/sse`                        |
| cloudflare-playwright    | 3011 | `mcp-cloudflare-playwright`    | `npx -y mcp-remote https://slideheroes-playwright-mcp.slideheroes.workers.dev/sse` |

### Container Types

1. **Direct MCP Servers**: Run the actual MCP server packages
2. **Proxy Containers**: Proxy requests to remote MCP services
3. **Working Server**: `newrelic` (unchanged, already working with local setup)

## Quick Start

### 1. Start MCP Containers

```bash
# Start all MCP containers
./scripts/start-mcp-servers.sh

# Or start individual services
docker-compose -f docker-compose.mcp.yml up mcp-perplexity mcp-supabase -d
```

### 2. Check Status

```bash
# Check container status
./scripts/mcp-status.sh

# View logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-perplexity
```

### 3. Stop Containers

```bash
# Stop all containers
./scripts/stop-mcp-servers.sh

# Or stop specific containers
docker-compose -f docker-compose.mcp.yml stop mcp-perplexity
```

## Configuration

### Environment Variables

Create `.env.mcp.local` to customize environment variables:

```bash
# Copy the example file
cp .env.mcp .env.mcp.local

# Edit with your API keys
nano .env.mcp.local
```

Key variables:

- `PERPLEXITY_API_KEY`: Perplexity API key
- `SUPABASE_ACCESS_TOKEN`: Supabase access token
- `GITHUB_PERSONAL_ACCESS_TOKEN`: GitHub API token
- `EXA_API_KEY`: Exa search API key
- `MCP_AUTH_TOKEN`: Cloudflare Playwright auth token

### Claude Code Integration

The `.mcp.json` configuration has been updated to use HTTP connections to Docker containers instead of `npx` commands:

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "curl",
      "args": [
        "-s",
        "-X",
        "POST",
        "http://localhost:3001/mcp",
        "-H",
        "Content-Type: application/json"
      ]
    }
    // ... other servers
  }
}
```

## File Structure

```
.mcp-servers/
├── perplexity-ask/
│   └── Dockerfile
├── supabase/
│   └── Dockerfile
├── context7/
│   └── Dockerfile
├── postgres/
│   └── Dockerfile
├── browser-tools/
│   └── Dockerfile
├── code-reasoning/
│   └── Dockerfile
├── github/
│   └── Dockerfile
├── exa/
│   ├── Dockerfile
│   └── proxy-server.js
├── cloudflare-observability/
│   ├── Dockerfile
│   └── proxy-server.js
├── cloudflare-bindings/
│   ├── Dockerfile
│   └── proxy-server.js
├── cloudflare-playwright/
│   ├── Dockerfile
│   └── proxy-server.js
└── newrelic-mcp/        # Existing working setup
    └── (unchanged)

docker-compose.mcp.yml    # Main container orchestration
.env.mcp                  # Environment variables template
.env.mcp.local           # Local environment overrides (gitignored)
.mcp.json.backup         # Backup of original configuration

scripts/
├── start-mcp-servers.sh  # Start all containers
├── stop-mcp-servers.sh   # Stop all containers
└── mcp-status.sh         # Check container health
```

## Health Checks

Each container includes health check endpoints:

```bash
# Check individual service health
curl http://localhost:3001/health  # Perplexity
curl http://localhost:3002/health  # Supabase
curl http://localhost:3003/health  # Context7
# ... etc
```

Health check responses include:

- Service status
- Service name
- Timestamp
- Remote URL (for proxy containers)

## Port Allocation

### No Conflicts with Existing Services

- **Supabase**: Ports 54321-54326 (unchanged)
- **Web App**: Port 3000 (when running)
- **Payload CMS**: Port 3000 (in separate container)
- **WordPress**: Port 8080
- **MCP Services**: Ports 3001-3011 ✅

### Network Configuration

- **Network**: `mcp-network` (isolated bridge network)
- **Host Access**: `host.docker.internal` for PostgreSQL connection
- **X11 Forwarding**: Enabled for browser-tools container

## Development Workflow

### Building Containers

```bash
# Build all containers
docker-compose -f docker-compose.mcp.yml build

# Build specific container
docker-compose -f docker-compose.mcp.yml build mcp-perplexity

# Build with no cache
docker-compose -f docker-compose.mcp.yml build --no-cache
```

### Debugging

```bash
# View container logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-perplexity

# Execute commands in running container
docker exec -it mcp-perplexity sh

# Check container resource usage
docker stats
```

### Adding New MCP Servers

1. Create directory: `.mcp-servers/new-service/`
2. Create `Dockerfile` based on existing patterns
3. Add service to `docker-compose.mcp.yml`
4. Update `.mcp.json` with new HTTP endpoint
5. Add health check endpoint
6. Test and document

## Security

### Container Security

- **Non-root user**: All containers run as `mcpuser` (UID 1001)
- **Minimal images**: Based on Alpine Linux
- **Read-only containers**: No write access to filesystem
- **Network isolation**: Containers in separate network

### API Key Management

- **Environment variables**: Keys stored in `.env.mcp.local`
- **Gitignored**: Local environment file not committed
- **Container isolation**: Keys only accessible within containers

## Troubleshooting

### Common Issues

1. **Container fails to start**

   ```bash
   docker-compose -f docker-compose.mcp.yml logs mcp-perplexity
   ```

2. **Health check fails**

   ```bash
   curl -v http://localhost:3001/health
   ```

3. **Port conflicts**

   ```bash
   lsof -i :3001  # Check what's using the port
   ```

4. **Environment variables not loaded**

   ```bash
   docker-compose -f docker-compose.mcp.yml config  # Verify config
   ```

### Rollback to npx

If needed, restore the original configuration:

```bash
cp .mcp.json.backup .mcp.json
./scripts/stop-mcp-servers.sh
```

## Performance Benefits

### Before (npx-based)

- ❌ Download delays on each startup
- ❌ Inconsistent server availability
- ❌ Network dependency for package downloads
- ❌ Version inconsistencies

### After (Docker-based)

- ✅ Containers start in <10 seconds
- ✅ Consistent server availability
- ✅ No network delays during startup
- ✅ Versioned and reproducible builds

## Monitoring

### Container Health

```bash
# Check all container status
docker-compose -f docker-compose.mcp.yml ps

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Check restart count
docker inspect mcp-perplexity | grep RestartCount
```

### Service Availability

The `./scripts/mcp-status.sh` script provides a comprehensive health check of all services.

## Future Improvements

1. **Container Registry**: Push images to private registry
2. **Multi-stage Builds**: Optimize container sizes
3. **Kubernetes**: Deploy to K8s for production
4. **Monitoring**: Add Prometheus/Grafana monitoring
5. **Auto-scaling**: Scale containers based on load

## Related Issues

- **GitHub Issue #25**: Original MCP reliability issue
- **GitHub Issue #26**: Docker infrastructure clarification

---

_This setup provides a robust, containerized MCP infrastructure that eliminates the reliability issues of npx-based servers while maintaining full compatibility with Claude Code._
