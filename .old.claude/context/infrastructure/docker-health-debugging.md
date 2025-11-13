---
id: "docker-health-debugging"
title: "Docker Health Debugging Guide"
version: "1.0.0"
category: "infrastructure"
description: "Comprehensive guide for debugging unhealthy Docker containers in SlideHeroes project"
tags: ["docker", "health-checks", "debugging", "troubleshooting", "containers"]
created: "2025-09-29"
last_updated: "2025-09-29"
author: "claude"
---

# Docker Health Debugging Guide

## Quick Reference

### Health Status Indicators

| Emoji | Status | Meaning |
|-------|--------|---------|
| 🟢 | Healthy | All containers running and healthy |
| 🟡 | Partial | Some containers healthy, some issues |
| 🔴 | Unhealthy | Critical issues detected |
| ⚫ | Stopped | No containers running |
| ⟳ | Starting | Containers starting up |
| ⚪ | Unknown | Status cannot be determined |

### Essential Debug Commands

```bash
# Quick health check
.claude/bin/docker-health-wrapper.sh health-check

# Detailed health summary
.claude/bin/docker-health-wrapper.sh stack-health

# Check specific containers
.claude/bin/supabase-health-check.sh

# Test system functionality
.claude/bin/docker-health-wrapper.sh test

# Enable debug mode
CLAUDE_DEBUG=1 .claude/bin/docker-health-wrapper.sh health-check
```

## Container Health Check Hierarchy

The system uses a progressive health detection approach:

1. **Native Docker HEALTHCHECK** (most reliable)
   - Built-in Docker health checks configured in docker-compose.yml
   - Returns: `healthy`, `unhealthy`, `starting`, `none`

2. **Port Connectivity Check**
   - Tests if exposed ports are accessible
   - Verifies actual service availability

3. **Process Status Check**
   - Verifies processes are running inside container
   - Useful for containers without health checks

4. **Container State Fallback**
   - Basic running/stopped status
   - Last resort when other methods fail

## Container-Specific Health Checks

### Supabase Containers (Managed)

All Supabase containers have built-in health checks managed by Supabase CLI:

| Container | Health Check | Config |
|-----------|--------------|--------|
| supabase_db_* | pg_isready | Supabase CLI |
| supabase_auth_* | HTTP endpoint | Supabase CLI |
| supabase_storage_* | HTTP endpoint | Supabase CLI |
| supabase_realtime_* | HTTP endpoint | Supabase CLI |
| supabase_kong_* | HTTP endpoint | Supabase CLI |
| supabase_studio_* | HTTP endpoint | Supabase CLI |
| supabase_pg_meta_* | HTTP endpoint | Supabase CLI |
| supabase_inbucket_* | HTTP endpoint | Supabase CLI |

### Supabase Containers (External Monitoring)

These containers lack standard shell tools and require external monitoring:

**PostgREST** (`supabase_rest_*`):

```bash
# Process check (postgrest process)
docker top "$container_name" | grep -q "postgrest"
```

- No built-in health check (container lacks shell tools)
- Admin server runs on internal port 3001
- Process-based health check as alternative

**Edge Runtime** (`supabase_edge_runtime_*`):

```bash
# Process check (deno process)
docker top "$container_name" | grep -q "deno"
```

- Deno-based edge functions runtime
- No built-in health check
- Process monitoring confirms service health

### Custom Containers

**ccmp-dashboard**:

```yaml
# .claude/dashboards/docker-compose.yml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:8080/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**docs-mcp-server**:

```yaml
# .mcp-servers/docs-mcp/docker-compose.yml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:6280/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

## Common Issues and Solutions

### Container Shows "starting" Indefinitely

**Symptoms**: Container stuck in "starting" state

**Debug Steps**:

```bash
# 1. Check container logs
docker logs <container-name>

# 2. Verify service is listening on expected port
docker exec <container-name> netstat -tlnp

# 3. Check health check logs
docker inspect <container-name> | jq '.[0].State.Health.Log'

# 4. Test health check manually
docker exec <container-name> wget --spider http://localhost:8080/health
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

### Container Shows "unhealthy"

**Symptoms**: Container running but marked unhealthy

**Debug Steps**:

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

**Common Causes**:

- Service started but not fully functional
- Database connection issues
- Resource exhaustion (memory, disk)
- Configuration errors

**Solutions**:

- Check service-specific logs for errors
- Verify all environment variables are set
- Check resource usage: `docker stats <container-name>`
- Restart container: `docker restart <container-name>`

### Health Check Command Not Found

**Symptoms**: Error: "executable not found" in health check

**Debug Steps**:

```bash
# 1. Check what's available in container
docker exec <container-name> ls /bin /usr/bin

# 2. Test if required tools exist
docker exec <container-name> which curl wget nc
```

**Solutions**:

- For Alpine containers: Use `wget` (built-in)
- For Node containers: Use Node.js HTTP module
- For minimal containers: Use process checks instead
- Example Node health check:

  ```javascript
  require('http').get('http://127.0.0.1:8080/health', (res) =>
    process.exit(res.statusCode === 200 ? 0 : 1)
  )
  ```

### Docker Not Running

**Symptoms**: ⚪ status, "Docker daemon not accessible"

**Debug Steps**:

```bash
# 1. Check Docker status
docker ps

# 2. Check Docker daemon
# Linux (systemd)
sudo systemctl status docker

# 3. Verify Docker installation
docker --version
docker info

# 4. Check Docker socket permissions (Linux)
ls -la /var/run/docker.sock
```

**Solutions**:

```bash
# Linux: Start Docker service
sudo systemctl start docker

# Linux: Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in

# macOS/Windows: Start Docker Desktop
```

### Permission Issues

**Symptoms**: "Permission denied" errors, cannot write status files

**Debug Steps**:

```bash
# 1. Check temp directory permissions
ls -la /tmp/.claude_docker_*

# 2. Check Docker socket permissions
ls -la /var/run/docker.sock
```

**Solutions**:

```bash
# Fix temp file permissions
chmod 644 /tmp/.claude_docker_*

# Clear stuck lock files
rm -f /tmp/.claude_docker_*.lock

# Fix Docker socket access (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Stale or Incorrect Status

**Symptoms**: Status not updating despite container changes

**Debug Steps**:

```bash
# 1. Check cache metrics
.claude/bin/docker-health-wrapper.sh cache-metrics

# 2. Check cache file timestamps
ls -lat /tmp/.claude_docker_cache_*
```

**Solutions**:

```bash
# Clear all caches
.claude/bin/docker-health-wrapper.sh cache-invalidate

# Or manually clear cache files
rm -f /tmp/.claude_docker_cache_*
rm -f /tmp/.claude_docker_status_*

# Test fresh status
.claude/bin/docker-health-wrapper.sh health-check

# Adjust cache settings for faster updates
export CLAUDE_CACHE_L1_TTL=2
export CLAUDE_CACHE_L2_TTL=10
```

### File Locking Issues

**Symptoms**: "Failed to acquire lock", commands hanging

**Debug Steps**:

```bash
# 1. Test file locking
.claude/bin/docker-health-wrapper.sh test-locks

# 2. Check for stuck processes
ps aux | grep docker-health
```

**Solutions**:

```bash
# Clear stuck locks
find /tmp -name ".claude_docker_*.lock" -mmin +10 -delete

# Or remove all locks
rm -f /tmp/.claude_docker_*.lock

# Kill stuck processes
pkill -f docker-health-wrapper

# Increase timeout for slow systems
export CLAUDE_STATUS_LOCK_TIMEOUT=10
export CLAUDE_PID_LOCK_TIMEOUT=10
```

## Diagnostic Workflows

### Quick Health Assessment

```bash
# 1. Get overall status
.claude/bin/docker-health-wrapper.sh stack-status

# 2. If issues detected, get details
.claude/bin/docker-health-wrapper.sh stack-health

# 3. Check specific container logs
docker logs <problematic-container>
```

### Deep Dive Investigation

```bash
# 1. Enable debug mode
export CLAUDE_DEBUG=1

# 2. Run health check with verbose output
.claude/bin/docker-health-wrapper.sh health-check

# 3. Check individual container health
docker inspect <container-name> | jq '.[0].State.Health'

# 4. Test health check manually
docker exec <container-name> <health-check-command>

# 5. Check system tests
.claude/bin/docker-health-wrapper.sh test
```

### Performance Investigation

```bash
# 1. Measure execution time
time .claude/bin/docker-health-wrapper.sh stack-status

# 2. Check cache performance
.claude/bin/docker-health-wrapper.sh cache-metrics

# 3. Monitor resource usage
docker stats

# 4. Check for container restarts
docker ps -a
```

## Manual Health Check Commands

### Check Native Docker Health

```bash
# Get health status
docker inspect --format '{{.State.Health.Status}}' <container-name>

# Get full health info with logs
docker inspect <container-name> | jq '.[0].State.Health'
```

### Test HTTP Endpoints

```bash
# Basic connectivity
curl -I http://localhost:<port>/health

# Detailed response
curl -v http://localhost:<port>/health

# From inside container
docker exec <container-name> wget -O- http://localhost:<port>/health
```

### Test TCP Ports

```bash
# Check if port is listening
nc -zv localhost <port>

# Check from inside container
docker exec <container-name> nc -zv localhost <port>
```

### Check Running Processes

```bash
# List container processes
docker top <container-name>

# Check specific process
docker top <container-name> | grep <process-name>

# Process details from inside container
docker exec <container-name> ps aux
```

## Environment Variables

### Cache Configuration

```bash
# Fast updates (more CPU usage)
export CLAUDE_CACHE_L1_TTL=5      # In-memory cache (default: 5s)
export CLAUDE_CACHE_L2_TTL=15     # File cache (default: 15s)
export CLAUDE_CACHE_L3_TTL=60     # Stale fallback (default: 60s)

# Slower updates (less CPU usage)
export CLAUDE_CACHE_L1_TTL=10
export CLAUDE_CACHE_L2_TTL=60
export CLAUDE_CACHE_L3_TTL=300
```

### Monitoring Configuration

```bash
# Background monitoring interval
export CLAUDE_MONITOR_INTERVAL=30  # Default: 30s

# Lock timeouts
export CLAUDE_STATUS_LOCK_TIMEOUT=5  # Default: 5s
export CLAUDE_PID_LOCK_TIMEOUT=5     # Default: 5s
```

### Debug Configuration

```bash
# Enable debug output
export CLAUDE_DEBUG=1

# Enable verbose logging
export CLAUDE_VERBOSE=1
```

## File Locations

### Status Files

```bash
# Main status file (JSON)
/tmp/.claude_docker_status_[PROJECT_HASH]

# Cache files
/tmp/.claude_docker_cache_l1_[PROJECT_HASH]  # Fast cache
/tmp/.claude_docker_cache_l2_[PROJECT_HASH]  # Medium cache
/tmp/.claude_docker_cache_l3_[PROJECT_HASH]  # Stale fallback

# Metrics
/tmp/.claude_docker_cache_metrics_[PROJECT_HASH]
```

### Lock Files

```bash
# Status operations
/tmp/.claude_docker_status_[PROJECT_HASH].lock

# Background monitoring
/tmp/.claude_docker_bg_lock_[PROJECT_HASH]
/tmp/.claude_docker_pid_[PROJECT_HASH]
```

## Integration with /infrastructure:docker-fix

The `/infrastructure:docker-fix` command uses this health monitoring system:

1. Detects unhealthy containers using health check system
2. Analyzes health check logs and container state
3. Applies targeted fixes based on diagnosis
4. Verifies fixes using health status

**Usage**:

```bash
# Fix specific container
/infrastructure:docker-fix <container-name>

# Fix entire stack
/infrastructure:docker-fix <stack-name>

# Auto-fix mode (no prompts)
/infrastructure:docker-fix <container-name> --auto
```

## Best Practices

### Health Check Configuration

- **Interval**: 30 seconds (production-appropriate)
- **Timeout**: 10 seconds (sufficient for HTTP checks)
- **Retries**: 3 attempts before marking unhealthy
- **Start Period**: 10-30 seconds based on service startup time

### Debugging Strategy

1. **Start broad**: Check overall health status
2. **Narrow down**: Identify specific unhealthy containers
3. **Investigate**: Check logs and health check details
4. **Test manually**: Reproduce health check inside container
5. **Fix and verify**: Apply fix and confirm with health check

### Performance Optimization

1. Use background monitoring for statusline updates
2. Adjust cache TTLs based on your needs
3. Clear caches when debugging to ensure fresh data
4. Use batch operations when checking multiple containers

## Related Files

- `.claude/bin/docker-health-wrapper.sh` - Main health monitoring script
- `.claude/bin/supabase-health-check.sh` - Supabase-specific health checks
- `.claude/commands/infrastructure/docker-fix.md` - Automated container fixing
- `.claude/dashboards/docker-compose.yml` - ccmp-dashboard health check
- `.mcp-servers/docs-mcp/docker-compose.yml` - docs-mcp health check
