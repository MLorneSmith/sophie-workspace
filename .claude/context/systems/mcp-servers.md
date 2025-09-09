---
# Identity
id: "mcp-servers"
title: "Model Context Protocol (MCP) Servers Architecture"
version: "1.0.0"
category: "systems"

# Discovery
description: "Comprehensive guide to SlideHeroes MCP server implementation including containerized architecture, security patterns, service orchestration, and integration with Claude Code"
tags: ["mcp", "model-context-protocol", "ai-integration", "containerization", "microservices", "claude", "security", "orchestration"]

# Relationships
dependencies: ["docker-setup"]
cross_references:
  - id: "docker-setup"
    type: "prerequisite"
    description: "MCP servers run within Docker container architecture"
  - id: "portkey-implementation"
    type: "related"
    description: "AI model integration patterns"
  - id: "enhanced-logger"
    type: "related"
    description: "Logging patterns for MCP services"

# Maintenance
created: "2025-09-09"
last_updated: "2025-09-09"
author: "create-context"
---

# Model Context Protocol (MCP) Servers Architecture

## Overview

The SlideHeroes project implements a sophisticated Model Context Protocol (MCP) server infrastructure that enables Claude Code to interact with external services, databases, and APIs through a standardized protocol. Our implementation follows enterprise-grade patterns with containerized deployment, multi-layer security, and comprehensive monitoring.

MCP represents a three-tier architecture (Host → Client → Server) enabling AI models to access resources, execute tools, and use prompts through a standardized interface. Our implementation leverages Docker containers for isolation, scalability, and consistent deployment across development and production environments.

## Architecture Design

### Three-Tier MCP Architecture

```
┌─────────────────┐
│   Claude Code   │  Host Layer
│   (Desktop)     │
└────────┬────────┘
         │
┌────────▼────────┐
│   MCP Client    │  Client Layer
│  (Claude Code)  │
└────────┬────────┘
         │
┌────────▼────────┐
│  MCP Servers    │  Server Layer (11 services)
│  (Containers)   │
└─────────────────┘
```

### Service Categories

**AI/ML Services**:
- `mcp-perplexity` (3051): AI-powered search and Q&A
- `mcp-exa-proxy` (3008): Advanced web search
- `mcp-code-reasoning` (3006): Code analysis and reasoning

**Infrastructure Services**:
- `mcp-supabase` (3002): Database and auth management
- `mcp-postgres` (3004): Direct PostgreSQL operations
- `mcp-github` (3007): GitHub API integration

**Cloudflare Services**:
- `mcp-cloudflare-observability` (3009): Monitoring and logs
- `mcp-cloudflare-bindings` (3010): Worker bindings
- `mcp-cloudflare-playwright` (3011): Browser automation

**Utility Services**:
- `mcp-context7` (3003): Context management
- `mcp-browser-tools` (3005): Browser automation

## Implementation Details

### Container Architecture

Each MCP server follows a standardized container pattern:

```dockerfile
# Multi-stage build for optimal size
FROM node:22-alpine AS builder
# Build from official repositories
RUN git clone [official-repo] && npm build

FROM node:22-alpine AS base
# Security: Non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001
    
# Health checks for monitoring
HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f http://localhost:3000/health || exit 1
    
# Proxy server for HTTP health endpoint
CMD ["node", "proxy-server.js"]
```

### Proxy Server Pattern

All MCP servers implement a proxy pattern for health monitoring:

```javascript
// proxy-server.js pattern
const mcpProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
});

// Health endpoint for Docker/Kubernetes
const healthServer = http.createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(isHealthy ? 200 : 503);
        res.end(JSON.stringify({
            status: isHealthy ? "healthy" : "unhealthy",
            service: serviceName,
            timestamp: new Date().toISOString(),
        }));
    }
});
```

### Service Configuration

**Docker Compose Orchestration** (`docker-compose.mcp.yml`):

```yaml
services:
  mcp-[service]:
    build:
      context: ./.mcp-servers/[service]
      dockerfile: Dockerfile
    container_name: mcp-[service]
    environment:
      - API_KEY=${API_KEY}
      - PORT=3000
    ports:
      - "[external]:[internal]"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Security Implementation

### Multi-Layer Security Model

Based on industry best practices and addressing the 43% vulnerability rate in MCP implementations:

**1. Authentication Layer**:
```yaml
# OAuth 2.1 with token exchange (recommended)
MCP_AUTH_TOKEN: Bearer [token]
GITHUB_PERSONAL_ACCESS_TOKEN: [token]
PERPLEXITY_API_KEY: [api-key]
```

**2. Container Security**:
- Non-root user execution (`mcpuser:1001`)
- Read-only root filesystems where possible
- Capability restrictions
- No privileged containers

**3. Network Isolation**:
```yaml
networks:
  default:
    name: mcp-network
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

**4. Input Validation**:
- All proxy servers validate environment variables
- Health check endpoints sanitize responses
- Tool calls validated at MCP client layer

**5. Secret Management**:
- Environment variables for credentials
- Never hardcoded in images
- Rotation policies for tokens

### Security Best Practices

1. **Principle of Least Privilege**: Each service runs with minimal required permissions
2. **Defense in Depth**: Multiple security layers from container to application
3. **Zero Trust**: All inter-service communication authenticated
4. **Audit Logging**: Comprehensive logging of all MCP operations
5. **Regular Updates**: Automated vulnerability scanning and patching

## Service Management

### Startup Procedures

```bash
# 1. Start all MCP services
docker-compose -f docker-compose.mcp.yml up -d

# 2. Verify health status
./scripts/mcp-status.sh

# 3. Monitor logs for specific services
docker-compose -f docker-compose.mcp.yml logs -f mcp-perplexity

# 4. Selective service startup
docker-compose -f docker-compose.mcp.yml up mcp-github mcp-postgres
```

### Health Monitoring

**Automated Health Checks** (`scripts/mcp-status.sh`):

```bash
services=(
    "3051:Perplexity"
    "3002:Supabase"
    "3003:Context7"
    # ... other services
)

for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"
    
    if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
        echo "✅ $name (port $port): healthy"
    else
        echo "❌ $name (port $port): unhealthy"
    fi
done
```

### Service Operations

**Restart Unhealthy Service**:
```bash
docker-compose -f docker-compose.mcp.yml restart mcp-[service]
```

**View Service Logs**:
```bash
docker-compose -f docker-compose.mcp.yml logs --tail=100 -f mcp-[service]
```

**Scale Services** (for load testing):
```bash
docker-compose -f docker-compose.mcp.yml up --scale mcp-perplexity=3
```

## Performance Optimization

### Token Efficiency

Critical for AI context window management:

1. **Response Optimization**: Minimize JSON payload sizes
2. **Selective Field Returns**: Only return required data
3. **Pagination**: Implement for large datasets
4. **Caching**: Multi-level caching for repeated queries

### Parallel Execution

Achieving 3-5x performance improvements:

```javascript
// Parallel MCP tool calls
const results = await Promise.all([
    mcpClient.callTool('github', { repo: 'user/repo' }),
    mcpClient.callTool('postgres', { query: 'SELECT...' }),
    mcpClient.callTool('perplexity', { question: '...' })
]);
```

### Resource Management

```yaml
# Container resource limits
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## Claude Code Integration

### Configuration Structure

**MCP Settings** (`.claude/settings/mcp.json`):
```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "perplexity-ask",
    "supabase",
    "context7",
    "postgres",
    "browser-tools",
    "code-reasoning",
    "github",
    "exa",
    "cloudflare-observability",
    "cloudflare-bindings",
    "cloudflare-playwright",
    "newrelic"
  ]
}
```

### Tool Usage Patterns

**Best Practices**:
1. Batch operations when possible
2. Use appropriate timeout values
3. Handle partial failures gracefully
4. Implement retry logic with exponential backoff

## Troubleshooting

### Common Issues and Solutions

**Service Won't Start**:
```bash
# Check logs
docker logs mcp-[service]

# Verify environment variables
docker exec mcp-[service] env | grep API_KEY

# Check port conflicts
lsof -i :3000-3100
```

**Health Check Failures**:
```bash
# Direct health check
curl http://localhost:[port]/health

# Check container networking
docker exec mcp-[service] ping host.docker.internal

# Restart with verbose logging
docker-compose -f docker-compose.mcp.yml up mcp-[service]
```

**Performance Issues**:
1. Check container resource usage: `docker stats`
2. Review service logs for errors
3. Verify network latency between services
4. Check for API rate limiting

**Authentication Failures**:
1. Verify API keys are correctly set
2. Check token expiration
3. Review service-specific auth requirements
4. Validate OAuth flow for applicable services

## Production Considerations

### Deployment Patterns

**1. Development**: Full stack with all services
**2. Staging**: Production-like with monitoring
**3. Production**: 
   - High availability with replicas
   - Load balancing for critical services
   - External secret management (Vault/AWS Secrets Manager)
   - Comprehensive monitoring (Prometheus/Grafana)

### Monitoring Stack

```yaml
# Add to production deployment
monitoring:
  prometheus:
    scrape_interval: 15s
    targets:
      - mcp-network:*/metrics
  
  grafana:
    dashboards:
      - mcp-service-health
      - mcp-performance-metrics
      - mcp-error-rates
```

### Disaster Recovery

1. **Backup Strategy**: Regular config backups
2. **Failover**: Automated service restart
3. **Circuit Breakers**: Prevent cascade failures
4. **Rollback**: Version-tagged images for quick rollback

## Related Files

- `/docker-compose.mcp.yml`: MCP services orchestration
- `/.mcp-servers/*/Dockerfile`: Individual service containers
- `/.mcp-servers/*/proxy-server.js`: Health check proxies
- `/scripts/mcp-status.sh`: Health monitoring script
- `/scripts/start-mcp-servers.sh`: Startup automation
- `/scripts/stop-mcp-servers.sh`: Shutdown script
- `/.claude/settings/mcp.json`: Claude Code MCP configuration
- `/.claude/context/systems/docker-setup.md`: Container architecture

## Best Practices Summary

1. **Always use containerized deployment** for consistency and isolation
2. **Implement comprehensive health checks** for all services
3. **Follow security-first design** with multi-layer protection
4. **Monitor service health proactively** using automated checks
5. **Optimize for token efficiency** to maximize AI context usage
6. **Use parallel execution** for independent operations
7. **Maintain service documentation** for each MCP server
8. **Regular security audits** of configurations and dependencies
9. **Implement proper error handling** and retry logic
10. **Version control all configurations** for reproducibility

## Future Enhancements

1. **Kubernetes Migration**: Helm charts for K8s deployment
2. **Service Mesh**: Istio/Linkerd for advanced networking
3. **API Gateway**: Kong/Traefik for centralized routing
4. **Distributed Tracing**: OpenTelemetry integration
5. **Auto-scaling**: HPA based on metrics
6. **Multi-region**: Geographic distribution for latency
7. **Cost Optimization**: Spot instances for non-critical services

## See Also

- [[docker-setup]]: Complete Docker container architecture
- [[portkey-implementation]]: AI model integration patterns
- [[enhanced-logger]]: Logging and monitoring patterns
- Research Report: `/reports/research/mcp/research-mcp-comprehensive-guide-2025-09-09.md`