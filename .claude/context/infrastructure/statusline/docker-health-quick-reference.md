---
id: "docker-health-quick-reference"
title: "Docker Health Monitoring Quick Reference"
version: "1.0.0"
category: "reference"
description: "Command reference, emoji meanings, and common usage patterns for Docker Health Monitoring system"
tags: ["docker", "health-monitoring", "reference", "commands", "emoji", "cheatsheet"]
dependencies: ["docker-health-index"]
cross_references:
  - id: "docker-health-user-guide"
    type: "prerequisite"
    description: "Setup and detailed usage instructions"
  - id: "docker-health-troubleshooting"
    type: "related"
    description: "Solutions for common command issues"
  - id: "docker-health-developer-notes"
    type: "related"
    description: "Technical implementation details"
created: "2025-09-26"
last_updated: "2025-09-26"
author: "create-context"
---

# Docker Health Monitoring - Quick Reference

## Emoji Status Indicators

| Emoji | Status | Condition |
|-------|--------|----------|
| 🟢 | Healthy | All containers running and healthy |
| 🟡 | Partial | Some healthy, some issues |
| 🔴 | Unhealthy | Critical issues detected |
| ⚫ | Stopped | No containers running |
| ⟳ | Starting | Containers starting up |
| ⚪ | Unknown | Status cannot be determined |

## Essential Commands

### Core Operations

```bash
# Quick health check
.claude/bin/docker-health-wrapper.sh health-check

# Compact status line (for statusbars)
.claude/bin/docker-health-wrapper.sh stack-status

# Detailed health summary
.claude/bin/docker-health-wrapper.sh stack-health

# Find Docker Compose stacks
.claude/bin/docker-health-wrapper.sh stack-detect
```

### Troubleshooting Commands

```bash
# Test system functionality
.claude/bin/docker-health-wrapper.sh test

# Clear cache and get fresh data
.claude/bin/docker-health-wrapper.sh cache-invalidate

# Check cache performance
.claude/bin/docker-health-wrapper.sh cache-metrics

# Test concurrent file access
.claude/bin/docker-health-wrapper.sh test-concurrent
```

### Background Monitoring

```bash
# Start background monitoring
.claude/bin/docker-health-wrapper.sh bg-start

# Check monitor status
.claude/bin/docker-health-wrapper.sh bg-status

# Stop background monitoring
.claude/bin/docker-health-wrapper.sh bg-stop

# Restart background monitoring
.claude/bin/docker-health-wrapper.sh bg-restart
```

## Command Aliases

| Long Form | Short Form | Purpose |
|-----------|------------|----------|
| `health-check` | `health` | Run health analysis |
| `bg-status` | `background-status` | Background monitor status |

## Output Formats

### Stack Status Format

```
web:🟢(3/3) api:🟡(2/3) db:🟢(1/1)
```

**Pattern**: `{stack}:{emoji}({healthy}/{running})`

### Health Summary Format

```
Stack: web
  Status: 🟢
  Containers: 3 total, 3 running, 3 healthy
  Health: 100%
```

## Environment Variables

### Quick Setup

```bash
# Enable debug mode
export CLAUDE_DEBUG=1

# Adjust cache timing (seconds)
export CLAUDE_CACHE_L1_TTL=5    # Fast cache
export CLAUDE_CACHE_L2_TTL=30   # Medium cache
export CLAUDE_CACHE_L3_TTL=300  # Stale fallback

# Background monitoring interval
export CLAUDE_MONITOR_INTERVAL=30
```

### Performance Tuning

```bash
# For faster responses (more CPU)
export CLAUDE_CACHE_L1_TTL=2
export CLAUDE_CACHE_L2_TTL=10

# For slower systems (less CPU)
export CLAUDE_CACHE_L1_TTL=10
export CLAUDE_CACHE_L2_TTL=60
export CLAUDE_MONITOR_INTERVAL=60
```

## Common Use Cases

### 1. Quick Status Check

```bash
# Get current status
.claude/bin/docker-health-wrapper.sh stack-status
```

### 2. Detailed Investigation

```bash
# See detailed health info
.claude/bin/docker-health-wrapper.sh stack-health

# Test if everything works
.claude/bin/docker-health-wrapper.sh test
```

### 3. Performance Issues

```bash
# Check cache efficiency
.claude/bin/docker-health-wrapper.sh cache-metrics

# Clear cache if stale
.claude/bin/docker-health-wrapper.sh cache-invalidate
```

### 4. Integration Setup

```bash
# Start background monitoring for statusline
.claude/bin/docker-health-wrapper.sh bg-start

# Get compact status for display
.claude/bin/docker-health-wrapper.sh stack-status
```

## File Locations (Quick)

```bash
# Main script
.claude/bin/docker-health-wrapper.sh

# Status data (temp files)
/tmp/.claude_docker_status_*

# Cache files
/tmp/.claude_docker_cache_*

# Lock files
/tmp/.claude_docker_*.lock
```

## Health Check Progression

1. **Docker HEALTHCHECK** → Use native health status if available
2. **Port Check** → Test connectivity to exposed ports
3. **Process Check** → Verify processes running in container
4. **State Check** → Fall back to basic container state

## Exit Codes

| Code | Meaning |
|------|----------|
| 0 | Success |
| 1 | General error |
| 2 | Docker not available |
| 3 | Permission denied |
| 4 | Lock timeout |
| 5 | Invalid arguments |

## Integration Examples

### Bash Prompt

```bash
# Add to .bashrc
PS1="$PS1\$(.claude/bin/docker-health-wrapper.sh stack-status 2>/dev/null | sed 's/^/ [/' | sed 's/$/]/')"
```

### Tmux Status

```bash
# Add to .tmux.conf
set -g status-right "#(.claude/bin/docker-health-wrapper.sh stack-status) %H:%M"
```

### Watch Command

```bash
# Continuous monitoring
watch -n 5 '.claude/bin/docker-health-wrapper.sh stack-health'
```

## Debug Mode

```bash
# Enable debug output
CLAUDE_DEBUG=1 .claude/bin/docker-health-wrapper.sh health-check

# With verbose logging
CLAUDE_DEBUG=1 CLAUDE_VERBOSE=1 .claude/bin/docker-health-wrapper.sh stack-status
```

## Help

```bash
# Show help
.claude/bin/docker-health-wrapper.sh --help

# Show version
.claude/bin/docker-health-wrapper.sh --version
```