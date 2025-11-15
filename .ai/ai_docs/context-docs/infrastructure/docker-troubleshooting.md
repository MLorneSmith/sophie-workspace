# Docker Troubleshooting Guide

**Purpose**: Comprehensive troubleshooting reference for Docker-related issues in SlideHeroes development, including container health debugging, common issues, solutions, and prevention strategies.

## Windows/WSL2 Port Binding Issues

### Problem

Windows with WSL2 and Docker Desktop experience port binding conflicts due to Hyper-V dynamic port reservation.

**Error:** `bind: An attempt was made to access a socket in a way forbidden by its access permissions`

### Solutions

#### 1. Port Range Change (Implemented)

Main stack uses ports 54321-54326 + 39006 to avoid problematic 50000-60000 range.

#### 2. Update WSL to 2.6.1+

```powershell
# Update WSL
wsl --update

# Edit C:\Users\[Username]\.wslconfig
[wsl2]
networkingMode=mirrored
```

#### 3. Quick Fix

```powershell
# Restart WSL and Docker
wsl --shutdown
# Then restart Docker Desktop
```

#### 4. Check Reserved Ports

```powershell
# View reserved port ranges
netsh int ipv4 show excludedportrange protocol=tcp

# Reserve specific ports
netsh int ipv4 add excludedportrange protocol=tcp startport=54321 numberofports=10
```

## Container Permission Issues

### pnpm Installation Errors

**Problem:** `EACCES: permission denied, mkdir '/usr/local/lib/node_modules/pnpm'`

**Root Cause:** Containers run as non-root user (`node`) and cannot install global packages.

**Solution:** Use `npx pnpm@latest` instead of global installation:

```dockerfile
# ✅ Correct approach
CMD ["npx", "pnpm@latest", "install", "--frozen-lockfile"]

# ❌ Fails with permissions
RUN npm install -g pnpm
CMD ["pnpm", "install"]
```

**Fix Steps:**

```bash
# 1. Check logs
docker logs slideheroes-app-test

# 2. Restart containers
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d

# 3. Clear volumes if persistent issues
docker-compose -f docker-compose.test.yml down -v
```

### Volume Permission Problems

**Problem:** Cannot write to mounted volumes

**Solutions:**

```bash
# Check ownership
docker exec -it slideheroes-app-test ls -la /workspace

# Fix permissions
docker exec -it slideheroes-app-test chown -R node:node /workspace

# Reset volumes
docker-compose down -v && docker-compose up
```

## Network Connectivity Issues

### Container Communication Failures

**Problem:** Services can't communicate or experience timeouts

**Diagnostic Steps:**

```bash
# 1. Verify network exists
docker network ls | grep slideheroes

# 2. Check DNS resolution
docker exec -it slideheroes-app-test nslookup postgres

# 3. Test connectivity
docker exec -it slideheroes-app-test ping -c 3 host.docker.internal

# 4. Check port binding
docker port slideheroes-app-test
```

**Solutions:**

```bash
# Recreate network
docker-compose down
docker network prune -f
docker-compose up

# Use host networking (temporary)
docker run --network host ...
```

### MCP Server Connection Issues

**Problem:** MCP servers not responding in Claude Code

**Solutions:**

1. Check `.mcp.json` configuration
2. Verify API keys in environment
3. Restart Claude Code
4. Check `.claude/settings.local.json` for enabled servers

## Container Won't Start

### Diagnostic Process

```bash
# 1. Check container status
docker ps -a | grep slideheroes

# 2. View detailed logs
docker logs slideheroes-app-test --tail 50

# 3. Check exit code
docker inspect slideheroes-app-test --format='{{.State.ExitCode}}'

# 4. Interactive debug
docker run -it --entrypoint /bin/bash node:20-slim
```

### Common Exit Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 0 | Success | Container completed normally |
| 1 | General error | Check logs for details |
| 125 | Docker daemon error | Restart Docker |
| 126 | Container command not executable | Check entrypoint |
| 127 | Container command not found | Verify command exists |
| 243 | Permission denied | Fix file permissions |

## Container Health Debugging

### Health Status Indicators

| Emoji | Status | Meaning |
|-------|--------|---------|
| 🟢 | Healthy | All containers running and healthy |
| 🟡 | Partial | Some containers healthy, some issues |
| 🔴 | Unhealthy | Critical issues detected |
| ⚫ | Stopped | No containers running |
| ⟳ | Starting | Containers starting up |
| ⚪ | Unknown | Status cannot be determined |

### Health Check Hierarchy

1. **Native Docker HEALTHCHECK** (most reliable)
2. **Port Connectivity Check**
3. **Process Status Check**
4. **Container State Fallback**

### Container-Specific Health Checks

**Supabase Containers**:

- All have built-in health checks managed by Supabase CLI
- PostgreSQL: `pg_isready`
- HTTP services: HTTP endpoint checks

**PostgREST** (`supabase_rest_*`):

```bash
# Process check (postgrest process)
docker top "$container_name" | grep -q "postgrest"
```

**Edge Runtime** (`supabase_edge_runtime_*`):

```bash
# Process check (deno process)
docker top "$container_name" | grep -q "deno"
```

### Common Health Check Issues

**Container Shows "starting" Indefinitely**:

```bash
# 1. Check container logs
docker logs <container-name>

# 2. Verify service is listening on expected port
docker exec <container-name> netstat -tlnp

# 3. Check health check logs
docker inspect <container-name> | jq '.[0].State.Health.Log'

# 4. Test health check manually
docker exec <container-name> curl -f http://localhost:8080/health
```

**Common Causes**:

- Service taking longer than `start_period` to initialize
- Health check endpoint not responding
- Port mismatch in health check configuration
- Dependencies not ready

**Solutions**:

- Increase `start_period` in docker-compose.yml
- Verify port numbers match service configuration
- Check service logs for initialization errors
- Ensure dependent services are healthy first

**Container Shows "unhealthy"**:

```bash
# 1. Check what health check is failing
docker inspect <container-name> | jq '.[0].State.Health'

# 2. Run health check manually inside container
docker exec <container-name> <health-check-command>

# 3. Check service logs for errors
docker logs --tail 100 <container-name>

# 4. Verify service is responding
curl -I http://localhost:<port>/health
```

**Health Check Command Not Found**:

```bash
# Check what's available in container
docker exec <container-name> ls /bin /usr/bin

# For Alpine containers: Use wget (built-in)
# For Node containers: Use Node.js HTTP module
# For minimal containers: Use process checks
```

## Performance Issues

### Slow Container Startup

**Optimizations:**

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Increase Docker resources (Docker Desktop)
# Settings > Resources > Advanced

# Use cache efficiently
docker build --cache-from slideheroes-app:latest -t slideheroes-app .

# Prune unused data
docker system prune -af
```

### High Memory Usage

**Solutions:**

```bash
# Check memory usage
docker stats --no-stream

# Limit container memory
docker run -m 2g slideheroes-app-test

# Clear build cache
docker builder prune -af

# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm dev
```

## Incorrect Stack Creation Prevention

### Issue #348: Wrong Supabase Stack

**Problem:** Running `npx supabase start` from project root creates wrong stack

### Prevention Mechanisms

#### 1. Claude Code Hook Guard

Location: `.claude/hooks/supabase-directory-guard.sh`

Blocks execution with warning:

```
🚨 SUPABASE DIRECTORY WARNING
❌ You're running from project root
✅ Correct usage:
   cd apps/web && npx supabase start
   cd apps/e2e && npx supabase start
```

#### 2. Root Config Warning

`supabase/config.toml` at root uses invalid ports (99999) to prevent usage.

#### 3. Cleanup Wrong Stacks

```bash
# Stop incorrect stack
npx supabase stop

# Remove incorrect volumes
docker volume ls --filter "label=com.supabase.cli.project=2025slideheroes"
docker volume rm supabase_db_2025slideheroes supabase_config_2025slideheroes
```

## Debugging Commands

### Port Diagnostics

```bash
# Check what's using ports
lsof -i :3000 :3001 :54321 :54322

# Windows: Check port usage
netstat -ano | findstr :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

### Container Diagnostics

```bash
# Full container inspection
docker inspect slideheroes-app-test

# Check resource limits
docker exec slideheroes-app-test cat /proc/meminfo

# View container processes
docker top slideheroes-app-test

# Export container for analysis
docker export slideheroes-app-test > container.tar
```

### Supabase Diagnostics

```bash
# Check all Supabase containers
docker ps --filter "name=supabase_" --format "table {{.Names}}\t{{.Status}}"

# View Supabase logs
docker logs supabase_db_2025slideheroes-db -f

# Reset Supabase completely
npx supabase stop --no-backup
rm -rf ~/.supabase/projects/2025slideheroes-db
npx supabase start
```

## Emergency Recovery

### Complete Reset

```bash
# 1. Stop everything
docker stop $(docker ps -aq)
pkill -f "node|next|playwright"

# 2. Clean Docker
docker system prune -af --volumes

# 3. Clean project
rm -rf node_modules .next .turbo
pnpm store prune

# 4. Fresh start
pnpm install
npx supabase start
pnpm dev
```

### Data Recovery

```bash
# Backup database before reset
pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backup.sql

# Restore after reset
psql postgresql://postgres:postgres@localhost:54322/postgres < backup.sql
```

## Best Practices

### Prevention

- Always run Supabase commands from correct directories
- Use specific port ranges to avoid conflicts
- Run containers with proper user permissions
- Keep Docker and WSL updated

### Monitoring

- Set up health checks for all services
- Monitor resource usage regularly
- Keep logs for troubleshooting
- Use structured logging

### Maintenance

- Prune unused resources weekly
- Update base images monthly
- Review security patches
- Document custom configurations

## Related Documentation

- docker-architecture.md: Architecture overview
- docker-containers-management.md: Container operations
- docker-setup.md: Setup and configuration
- docker-health-debugging.md: Advanced health debugging
