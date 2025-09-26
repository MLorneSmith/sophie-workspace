---
id: "docker-health-troubleshooting"
title: "Docker Health Monitoring Troubleshooting Guide"
version: "1.0.0"
category: "troubleshooting"
description: "Comprehensive troubleshooting guide for Docker Health Monitoring system with step-by-step solutions for common issues"
tags: ["docker", "health-monitoring", "troubleshooting", "problems", "solutions", "debugging"]
dependencies: ["docker-health-index"]
cross_references:
  - id: "docker-health-user-guide"
    type: "prerequisite"
    description: "Basic setup and usage before troubleshooting"
  - id: "docker-health-quick-reference"
    type: "related"
    description: "Command reference for diagnostic commands"
  - id: "docker-health-developer-notes"
    type: "related"
    description: "Technical details for advanced troubleshooting"
created: "2025-09-26"
last_updated: "2025-09-26"
author: "create-context"
---

# Docker Health Monitoring - Troubleshooting Guide

## Common Issues and Solutions

### Docker Not Running

**Symptoms:**
- Error: "Docker daemon not accessible"
- Status shows ⚪ (unknown) or no containers
- Command fails with Docker connection errors

**Solutions:**

1. **Check Docker Service Status:**
   ```bash
   # Linux (systemd)
   sudo systemctl status docker
   sudo systemctl start docker
   
   # macOS/Windows
   # Start Docker Desktop application
   ```

2. **Verify Docker Installation:**
   ```bash
   docker --version
   docker info
   ```

3. **Test Basic Docker Functionality:**
   ```bash
   docker ps
   docker run hello-world
   ```

4. **Check Docker Socket Permissions (Linux):**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Log out and back in
   
   # Or use sudo temporarily
   sudo .claude/bin/docker-health-wrapper.sh health-check
   ```

### Permission Issues

**Symptoms:**
- "Permission denied" errors
- Cannot write to status files
- Lock file creation fails

**Solutions:**

1. **Check Temporary Directory Permissions:**
   ```bash
   ls -la /tmp/.claude_docker_*
   
   # Fix permissions if needed
   chmod 644 /tmp/.claude_docker_*
   ```

2. **Clear Stuck Lock Files:**
   ```bash
   # Remove all lock files
   rm -f /tmp/.claude_docker_*.lock
   
   # Test again
   .claude/bin/docker-health-wrapper.sh test
   ```

3. **Docker Socket Access (Linux):**
   ```bash
   # Check docker socket permissions
   ls -la /var/run/docker.sock
   
   # Should show docker group access
   # If not, restart Docker service:
   sudo systemctl restart docker
   ```

### Cache Issues

**Symptoms:**
- Stale or incorrect status information
- Status not updating despite container changes
- Inconsistent emoji indicators

**Solutions:**

1. **Clear All Caches:**
   ```bash
   .claude/bin/docker-health-wrapper.sh cache-invalidate
   ```

2. **Check Cache Performance:**
   ```bash
   .claude/bin/docker-health-wrapper.sh cache-metrics
   ```

3. **Manual Cache Cleanup:**
   ```bash
   # Remove all cache files
   rm -f /tmp/.claude_docker_cache_*
   rm -f /tmp/.claude_docker_status_*
   
   # Test fresh status
   .claude/bin/docker-health-wrapper.sh health-check
   ```

4. **Adjust Cache Settings:**
   ```bash
   # Shorter cache for faster updates
   export CLAUDE_CACHE_L1_TTL=2
   export CLAUDE_CACHE_L2_TTL=10
   
   .claude/bin/docker-health-wrapper.sh health-check
   ```

### Performance Problems

**Symptoms:**
- Commands take too long to execute
- High CPU usage
- Frequent cache misses

**Solutions:**

1. **Check Current Performance:**
   ```bash
   time .claude/bin/docker-health-wrapper.sh stack-status
   .claude/bin/docker-health-wrapper.sh cache-metrics
   ```

2. **Optimize Cache Settings:**
   ```bash
   # For better performance (use longer cache)
   export CLAUDE_CACHE_L1_TTL=10
   export CLAUDE_CACHE_L2_TTL=60
   export CLAUDE_CACHE_L3_TTL=600
   ```

3. **Use Background Monitoring:**
   ```bash
   # Start background process to keep cache warm
   .claude/bin/docker-health-wrapper.sh bg-start
   
   # Check if it's running
   .claude/bin/docker-health-wrapper.sh bg-status
   ```

4. **Reduce Container Count:**
   ```bash
   # Stop unnecessary containers
   docker ps
   docker stop [container_name]
   ```

### File Locking Issues

**Symptoms:**
- "Failed to acquire lock" errors
- Commands hanging or timing out
- Concurrent access failures

**Solutions:**

1. **Test File Locking:**
   ```bash
   .claude/bin/docker-health-wrapper.sh test-locks
   .claude/bin/docker-health-wrapper.sh test-concurrent
   ```

2. **Clear Stuck Locks:**
   ```bash
   # Find and remove stuck lock files
   find /tmp -name ".claude_docker_*.lock" -mmin +10 -delete
   
   # Or remove all locks
   rm -f /tmp/.claude_docker_*.lock
   ```

3. **Adjust Lock Timeouts:**
   ```bash
   # Increase timeout for slow systems
   export CLAUDE_STATUS_LOCK_TIMEOUT=10
   export CLAUDE_PID_LOCK_TIMEOUT=10
   ```

4. **Check for Zombie Processes:**
   ```bash
   # Look for stuck processes
   ps aux | grep docker-health
   
   # Kill if necessary
   pkill -f docker-health-wrapper
   ```

### Status Display Issues

**Symptoms:**
- Wrong emoji indicators
- Missing or incorrect container counts
- JSON parsing errors

**Solutions:**

1. **Validate JSON Output:**
   ```bash
   .claude/bin/docker-health-wrapper.sh test-json
   ```

2. **Check Raw Status Data:**
   ```bash
   # Read raw status file
   cat /tmp/.claude_docker_status_*
   
   # Check if it's valid JSON
   cat /tmp/.claude_docker_status_* | jq .
   ```

3. **Reset Status File:**
   ```bash
   # Remove status file and regenerate
   rm -f /tmp/.claude_docker_status_*
   .claude/bin/docker-health-wrapper.sh health-check
   ```

4. **Debug Health Check Logic:**
   ```bash
   # Enable debug mode
   CLAUDE_DEBUG=1 .claude/bin/docker-health-wrapper.sh stack-health
   ```

### Docker Compose Stack Detection

**Symptoms:**
- Stacks not detected properly
- Containers not grouped correctly
- Missing stack information

**Solutions:**

1. **Check Stack Detection:**
   ```bash
   .claude/bin/docker-health-wrapper.sh stack-detect
   .claude/bin/docker-health-wrapper.sh stack-group
   ```

2. **Verify Docker Compose Labels:**
   ```bash
   # Check if containers have proper labels
   docker ps --format "table {{.Names}}\t{{.Labels}}"
   ```

3. **Manual Stack Inspection:**
   ```bash
   # Look for compose project labels
   docker inspect [container_name] | jq '.[] | .Config.Labels'
   ```

### Background Monitor Issues

**Symptoms:**
- Background monitor not starting
- Monitor process crashes
- Status not updating automatically

**Solutions:**

1. **Check Monitor Status:**
   ```bash
   .claude/bin/docker-health-wrapper.sh bg-status
   ```

2. **Test Background Functions:**
   ```bash
   .claude/bin/docker-health-wrapper.sh bg-test
   ```

3. **Restart Background Monitor:**
   ```bash
   .claude/bin/docker-health-wrapper.sh bg-stop
   .claude/bin/docker-health-wrapper.sh bg-start
   ```

4. **Check PID Files:**
   ```bash
   # Look for PID file
   ls -la /tmp/.claude_docker_pid_*
   
   # Check if process is actually running
   cat /tmp/.claude_docker_pid_* | xargs ps -p
   ```

## Diagnostic Commands

### System Health Check

```bash
# Run complete diagnostic
.claude/bin/docker-health-wrapper.sh test

# Test specific components
.claude/bin/docker-health-wrapper.sh test-concurrent
.claude/bin/docker-health-wrapper.sh test-locks
.claude/bin/docker-health-wrapper.sh test-json
.claude/bin/docker-health-wrapper.sh test-cleanup
```

### Debug Information

```bash
# Enable full debug output
CLAUDE_DEBUG=1 CLAUDE_VERBOSE=1 .claude/bin/docker-health-wrapper.sh health-check

# Check environment
env | grep CLAUDE

# Check Docker environment
docker version
docker info
docker ps -a
```

### Performance Analysis

```bash
# Measure execution time
time .claude/bin/docker-health-wrapper.sh stack-status

# Check cache statistics
.claude/bin/docker-health-wrapper.sh cache-metrics

# Test cache functionality
.claude/bin/docker-health-wrapper.sh cache-test
```

## Environment-Specific Issues

### WSL2 (Windows Subsystem for Linux)

**Common Issues:**
- Docker Desktop connection problems
- File permission issues with Windows filesystem
- Path resolution problems

**Solutions:**
```bash
# Check Docker Desktop is running in Windows
# Ensure WSL integration is enabled in Docker Desktop settings

# Use Linux filesystem for temp files (already handled)
# Check if Docker commands work
docker ps

# If permission issues, try:
sudo .claude/bin/docker-health-wrapper.sh health-check
```

### macOS

**Common Issues:**
- Docker Desktop startup delays
- Resource limits
- BSD vs GNU command differences

**Solutions:**
```bash
# Check Docker Desktop is running
docker info

# If bash version issues, ensure using bash 4+
bash --version

# May need to install newer bash via Homebrew
brew install bash
```

### Linux

**Common Issues:**
- systemd service management
- Docker socket permissions
- SELinux/AppArmor restrictions

**Solutions:**
```bash
# Check Docker service
sudo systemctl status docker
sudo systemctl enable docker

# Fix user permissions
sudo usermod -aG docker $USER
newgrp docker

# Check SELinux (if applicable)
getenforce
# May need to adjust SELinux policies
```

## Error Codes Reference

| Exit Code | Meaning | Typical Cause | Solution |
|-----------|---------|---------------|----------|
| 0 | Success | - | - |
| 1 | General error | Script failure | Check debug output |
| 2 | Docker unavailable | Docker not running | Start Docker |
| 3 | Permission denied | File/socket permissions | Fix permissions |
| 4 | Lock timeout | File locking issue | Clear locks |
| 5 | Invalid arguments | Wrong command syntax | Check usage |

## Getting Help

### Immediate Steps

1. **Run system test:**
   ```bash
   .claude/bin/docker-health-wrapper.sh test
   ```

2. **Enable debug mode:**
   ```bash
   CLAUDE_DEBUG=1 .claude/bin/docker-health-wrapper.sh [command]
   ```

3. **Check basic Docker functionality:**
   ```bash
   docker ps
   docker info
   ```

4. **Clear all caches and locks:**
   ```bash
   rm -f /tmp/.claude_docker_*
   .claude/bin/docker-health-wrapper.sh health-check
   ```

### Reporting Issues

If problems persist, gather this information:

```bash
# System information
uname -a
docker --version
bash --version

# Environment
env | grep CLAUDE

# Error output with debug
CLAUDE_DEBUG=1 .claude/bin/docker-health-wrapper.sh [failing-command] 2>&1

# File permissions
ls -la /tmp/.claude_docker_*
ls -la /var/run/docker.sock

# Test results
.claude/bin/docker-health-wrapper.sh test
```