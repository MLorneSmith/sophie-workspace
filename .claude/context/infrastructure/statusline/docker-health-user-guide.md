---
id: "docker-health-user-guide"
title: "Docker Health Monitoring User Guide"
version: "1.0.0"
category: "implementation"
description: "Complete user documentation for Docker Health Monitoring system including setup, usage, and integration examples"
tags: ["docker", "health-monitoring", "user-guide", "statusline", "setup", "usage"]
dependencies: ["docker-health-index"]
cross_references:
  - id: "docker-health-quick-reference"
    type: "related"
    description: "Command reference for quick lookup"
  - id: "docker-health-troubleshooting"
    type: "related"
    description: "Solutions when things don't work as expected"
  - id: "docker-health-developer-notes"
    type: "prerequisite"
    description: "Technical details for advanced usage"
created: "2025-09-26"
last_updated: "2025-09-26"
author: "create-context"
---

# Docker Health Monitoring - User Guide

## Overview

The Docker Health Monitoring system provides real-time status tracking for Docker containers and Docker Compose stacks in your development environment. It displays visual indicators in your statusline and offers detailed health information through command-line operations.

## Quick Start

### Basic Usage

Run the docker health checker:

```bash
# Basic health check
.claude/bin/docker-health-wrapper.sh health-check

# Get stack-aware status display
.claude/bin/docker-health-wrapper.sh stack-status

# View all stacks with health indicators
.claude/bin/docker-health-wrapper.sh stack-health
```

### Status Indicators

The system uses emoji indicators to show container health at a glance:

| Emoji | Meaning | Description |
|-------|---------|-------------|
| 🟢 | Healthy | All containers running and healthy |
| 🟡 | Partial | Some containers healthy, some issues |
| 🔴 | Unhealthy | Critical issues with containers |
| ⚫ | Stopped | No containers running |
| ⟳ | Starting | Containers are starting up |
| ⚪ | Unknown | Unable to determine status |

### Reading Status Output

#### Stack Status Format

The stack-status command shows each Docker Compose stack:

```
web:🟢(3/3) api:🟡(2/3) db:🟢(1/1)
```

This means:
- **web** stack: 🟢 healthy, 3 out of 3 containers running
- **api** stack: 🟡 partial health, 2 out of 3 containers running  
- **db** stack: 🟢 healthy, 1 out of 1 containers running

#### Detailed Health Summary

The stack-health command provides comprehensive information:

```
Stack: web
  Status: 🟢
  Containers: 3 total, 3 running, 3 healthy
  Health: 100%
```

## Available Operations

### Core Operations

| Command | Purpose | Example Output |
|---------|---------|----------------|
| `health-check` | Run complete health analysis | JSON health data |
| `stack-status` | Show compact status line | `web:🟢(3/3) api:🟡(2/3)` |
| `stack-health` | Detailed stack health summary | Multi-line status per stack |
| `stack-detect` | Find Docker Compose stacks | List of detected stacks |
| `stack-group` | Group containers by stack | Organized container lists |

### Testing Operations

| Command | Purpose | Use Case |
|---------|---------|----------|
| `test` | Run all status file tests | Verify system health |
| `test-concurrent` | Test concurrent access | Debug file locking issues |
| `test-locks` | Test file locking | Troubleshoot permissions |
| `test-json` | Validate JSON output | Check data integrity |

### Cache Operations

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `cache-metrics` | Show cache performance | Monitor cache efficiency |
| `cache-test` | Test cache functionality | Debug cache issues |
| `cache-invalidate` | Clear cache data | Force fresh data |

## Environment Configuration

The system respects several environment variables for customization:

### Cache Settings

```bash
# Cache TTL settings (seconds)
export CLAUDE_CACHE_L1_TTL=5      # In-memory cache (default: 5s)
export CLAUDE_CACHE_L2_TTL=30     # File cache (default: 30s)
export CLAUDE_CACHE_L3_TTL=300    # Stale fallback (default: 5min)

# Status cache settings
export CLAUDE_STATUS_CACHE_TTL=30 # Status cache TTL (default: 30s)
```

### Monitoring Settings

```bash
# Background monitoring
export CLAUDE_MONITOR_INTERVAL=30 # Monitor interval (default: 30s)

# Lock timeout settings
export CLAUDE_STATUS_LOCK_TIMEOUT=5  # Status lock timeout (default: 5s)
export CLAUDE_PID_LOCK_TIMEOUT=5     # PID lock timeout (default: 5s)
```

### Debug Settings

```bash
# Enable debug output
export CLAUDE_DEBUG=1

# Enable verbose logging
export CLAUDE_VERBOSE=1
```

## Integration Examples

### Shell Prompt Integration

Add Docker status to your shell prompt:

```bash
# In your .bashrc or .zshrc
docker_status() {
    local status=$(.claude/bin/docker-health-wrapper.sh stack-status 2>/dev/null)
    if [[ -n "$status" ]]; then
        echo " [$status]"
    fi
}

# Add to PS1
PS1="$PS1\$(docker_status)"
```

### Tmux Statusline Integration

```bash
# In your .tmux.conf
set -g status-right "#(.claude/bin/docker-health-wrapper.sh stack-status) %H:%M"
```

### VS Code Integration

Use the status in your VS Code status bar through extensions that support external commands.

## Performance Considerations

### Multi-Level Caching

The system uses three cache levels for optimal performance:

1. **L1 Cache (5s)**: In-memory, fastest access
2. **L2 Cache (30s)**: File-based, good performance
3. **L3 Cache (5min)**: Stale data fallback, prevents failures

### Batch Operations

The health checker processes all containers in a single Docker API call for efficiency.

### Background Monitoring

Optional background monitoring can keep status data fresh:

```bash
# Start background monitoring
.claude/bin/docker-health-wrapper.sh bg-start

# Check background monitor status
.claude/bin/docker-health-wrapper.sh bg-status

# Stop background monitoring
.claude/bin/docker-health-wrapper.sh bg-stop
```

## File Locations

### Status Files

Status data is stored in temporary files with project-specific naming:

```bash
# Status file (JSON format)
/tmp/.claude_docker_status_[PROJECT_HASH]

# Cache files
/tmp/.claude_docker_cache_l1_[PROJECT_HASH]
/tmp/.claude_docker_cache_l2_[PROJECT_HASH]
/tmp/.claude_docker_cache_l3_[PROJECT_HASH]

# Metrics
/tmp/.claude_docker_cache_metrics_[PROJECT_HASH]
```

### Lock Files

Concurrency control uses lock files:

```bash
# Status operations
/tmp/.claude_docker_status_[PROJECT_HASH].lock

# Background monitoring
/tmp/.claude_docker_bg_lock_[PROJECT_HASH]
/tmp/.claude_docker_pid_[PROJECT_HASH]
```

## Health Check Levels

The system performs multi-level health checks:

1. **Native Docker HEALTHCHECK**: Uses built-in Docker health checks
2. **Port Connectivity**: Tests if exposed ports are accessible
3. **Process Status**: Verifies container processes are running
4. **Fallback Status**: Uses container state as final fallback

This progressive approach ensures reliable health detection across different container configurations.

## Next Steps

- Review the [Quick Reference](./docker-health-quick-reference.md) for command shortcuts
- Check the [Troubleshooting Guide](./docker-health-troubleshooting.md) if you encounter issues
- Read the [Developer Notes](./docker-health-developer-notes.md) for technical details