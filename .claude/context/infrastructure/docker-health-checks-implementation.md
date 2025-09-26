# Docker Health Checks Implementation Guide

## Overview

This document describes the health check implementation for Docker containers in the SlideHeroes project, including the monitoring improvements made to achieve 100% container monitoring coverage.

## Health Check Status

### Containers with Docker Health Checks

| Container | Health Check Type | Status | Configuration File |
|-----------|------------------|--------|--------------------|
| supabase_db_2025slideheroes-db | Built-in (pg_isready) | ✅ Healthy | Managed by Supabase CLI |
| supabase_auth_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_storage_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_realtime_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_kong_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_studio_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_pg_meta_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| supabase_inbucket_2025slideheroes-db | Built-in (HTTP) | ✅ Healthy | Managed by Supabase CLI |
| ccmp-dashboard | Custom (HTTP) | ✅ Healthy | .claude/dashboards/docker-compose.yml |
| docs-mcp-server | Custom (HTTP) | ⚠️ Starting | .mcp-servers/docs-mcp/docker-compose.yml |

### Containers Monitored Externally

| Container | Monitoring Method | Status | Script |
|-----------|------------------|--------|--------|
| supabase_rest_2025slideheroes-db | Process check (postgrest) | ✅ Healthy | .claude/bin/supabase-health-check.sh |
| supabase_edge_runtime_2025slideheroes-db | Process check (deno) | ✅ Healthy | .claude/bin/supabase-health-check.sh |

## Implementation Details

### 1. ccmp-dashboard Health Check

**File**: `.claude/dashboards/docker-compose.yml`

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:8080/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Notes**:
- Uses `wget` (available in Alpine Linux base image)
- Checks HTTP endpoint on port 8080
- 30-second intervals to reduce load
- 30-second start period for application initialization

### 2. docs-mcp-server Health Check

**File**: `.mcp-servers/docs-mcp/docker-compose.yml`

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:6280/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

**Notes**:
- Uses Node.js (container lacks curl/wget)
- Checks /health endpoint on port 6280
- JavaScript one-liner for HTTP health check

### 3. Supabase Container External Monitoring

**File**: `.claude/bin/supabase-health-check.sh`

#### PostgREST Health Check
```bash
# Check if PostgREST process is running
docker top "$container_name" | grep -q "postgrest"
```

**Notes**:
- PostgREST admin server runs on internal port 3001
- Container lacks shell tools (no sh, curl, wget)
- Process-based health check as alternative

#### Edge Runtime Health Check
```bash
# Check if Deno process is running
docker top "$container_name" | grep -q "deno"
```

**Notes**:
- Deno-based edge functions runtime
- Container lacks standard shell tools
- Process monitoring confirms service health

## External Health Check Script

### Location
`.claude/bin/supabase-health-check.sh`

### Features
- Checks all Docker containers (Supabase, ccmp-dashboard, docs-mcp-server)
- Supports multiple health check types:
  - Docker native health status
  - HTTP endpoint checks
  - TCP port checks
  - Process existence checks
- Provides colored output for easy status identification
- Calculates overall health percentage
- Returns appropriate exit codes for integration

### Usage
```bash
# Make executable (one time)
chmod +x .claude/bin/supabase-health-check.sh

# Run health check
.claude/bin/supabase-health-check.sh
```

### Output Example
```
=========================================
   Supabase Container Health Check
=========================================

Checking containers with Docker health checks:
✓ supabase_db_2025slideheroes-db: Healthy (Docker health check)
✓ supabase_auth_2025slideheroes-db: Healthy (Docker health check)
[...]

Checking containers without Docker health checks:
✓ supabase_rest_2025slideheroes-db: Healthy (PostgREST process running)
✓ supabase_edge_runtime_2025slideheroes-db: Healthy (Deno process running)

=========================================
Health Check Summary:
=========================================
Total containers checked: 12
Healthy: 11
Unhealthy: 0
Unknown/Starting: 1

Health percentage: 91% (11/12)
```

## Integration with Docker Health Monitoring

The external health check script can be integrated with the existing docker-health-wrapper.sh monitoring system:

1. **Direct Integration**: Call the script from docker-health-wrapper.sh
2. **Status Line Integration**: Parse output for statusline display
3. **Automated Remediation**: Use exit codes to trigger docker-fix command

### Exit Codes
- `0`: All containers healthy or only unknown/starting
- `1`: One or more containers unhealthy
- `2`: Script execution error

## Best Practices Applied

### Health Check Configuration
- **Interval**: 30 seconds (production-appropriate)
- **Timeout**: 10 seconds (sufficient for HTTP checks)
- **Retries**: 3 attempts before marking unhealthy
- **Start Period**: 10-30 seconds based on service startup time

### Container-Specific Approaches
- **Alpine containers**: Use `wget` (built-in)
- **Node.js containers**: Use Node.js HTTP module
- **Minimal containers**: Use process monitoring via `docker top`
- **Supabase managed**: Rely on CLI-configured health checks

## Troubleshooting

### Common Issues

1. **Container shows "starting" indefinitely**
   - Service may not be ready yet
   - Check container logs: `docker logs <container-name>`
   - Verify service is listening on expected port

2. **Health check fails with "executable not found"**
   - Container lacks expected tools (curl/wget)
   - Use alternative methods (Node.js, process check)

3. **False positives in process checks**
   - Process exists but service not responding
   - Consider implementing HTTP-based checks if possible

### Debug Commands

```bash
# Check container health status
docker inspect <container-name> | jq '.[0].State.Health'

# View health check logs
docker inspect <container-name> | jq '.[0].State.Health.Log'

# Test service externally
curl -I http://localhost:<port>/health

# Check running processes
docker top <container-name>
```

## Future Improvements

1. **Add health checks to Supabase containers**
   - Would require Supabase CLI modification or docker-compose override
   - Consider submitting PR to Supabase for native health checks

2. **Implement HTTP checks for PostgREST**
   - Use external monitoring container with curl
   - Check admin server endpoints (/live, /ready)

3. **Enhanced monitoring metrics**
   - Response time tracking
   - Resource usage correlation
   - Historical health data

4. **Automated remediation**
   - Integrate with docker-autoheal
   - Custom recovery scripts per service

## Related Documentation

- [Docker Health Check Reference](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting/docker)
- [PostgREST Health Endpoints](https://postgrest.org/en/stable/api.html#health-check)
- Docker Health Monitoring System (internal)