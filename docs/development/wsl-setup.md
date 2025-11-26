# WSL2 Setup Guide for SlideHeroes Development

## Overview

This guide provides comprehensive instructions for setting up Windows Subsystem for
Linux 2 (WSL2) for optimal SlideHeroes development. Proper WSL configuration is
critical for stability, performance, and avoiding common development issues.

## Quick Start Checklist

- [ ] WSL2 installed and updated to stable version
- [ ] `.wslconfig` file created with proper resource limits
- [ ] Project cloned to WSL filesystem (not Windows filesystem)
- [ ] inotify limits configured
- [ ] Docker Desktop WSL2 backend enabled

## Prerequisites

### Windows Requirements

- Windows 10 version 2004+ (Build 19041+) or Windows 11
- Virtualization enabled in BIOS
- At least 16GB RAM (8GB minimum)
- Administrator access

### Check Current WSL Version

```powershell
# Run in PowerShell
wsl --version
```

**Expected Output (Stable):**

```text
WSL version: 2.2.4 (or 2.3.x - NOT 2.6.x pre-release)
Kernel version: 5.15.x (stable - NOT 6.6.x)
```

⚠️ **Important:** If you see version 2.6.x, you're on an unstable pre-release
version. Follow the "Downgrade to Stable" section below.

## Installation

### Install WSL2 (First Time Setup)

```powershell
# Run in PowerShell (Administrator)
wsl --install
```

This installs:

- WSL2 with Ubuntu (default distribution)
- Virtual Machine Platform
- Windows Hypervisor Platform

**Reboot required after first install.**

### Install Specific Ubuntu Version (Optional)

```powershell
# List available distributions
wsl --list --online

# Install specific version (recommended: Ubuntu 22.04)
wsl --install -d Ubuntu-22.04
```

## Critical Configuration

### Step 1: Create .wslconfig File

The `.wslconfig` file controls WSL2 resource allocation and performance.
**This file must be in your Windows user home directory**, not the WSL filesystem.

**Location:** `C:\Users\<YourUsername>\.wslconfig`

#### PowerShell Method (Recommended)

```powershell
# Run in PowerShell (any directory)
$wslConfigPath = "$env:USERPROFILE\.wslconfig"

$wslConfigContent = @"
[wsl2]
# Memory allocation (adjust based on your system RAM)
# Recommended: 50-75% of total RAM for development
# Example: 16GB for 32GB system, 8GB for 16GB system
memory=16GB

# CPU cores for parallel operations
# Recommended: Total cores - 2 (leave some for Windows)
# Example: 6 cores for 8-core system
processors=6

# Swap space for heavy operations (tests, builds)
# Recommended: Equal to memory allocation
swap=16GB

# Swap file location (optional - Windows manages by default)
# swapfile=C:\\temp\\wsl-swap.vhdx

# Memory reclamation strategy
# dropcache = aggressive reclaim (recommended for stability)
# gradual = balanced performance and reclaim
# disabled = maximum performance, manual management required
autoMemoryReclaim=dropcache

# Network Configuration
# Enable localhost forwarding for accessing WSL services from Windows
localhostForwarding=true

# Disk Management
# Enable sparse VHD to prevent disk bloat
sparseVhd=true

# Stability Optimizations
# vsyscall emulation for compatibility
kernelCommandLine=vsyscall=emulate

# Disable nested virtualization (not needed for most development)
nestedVirtualization=false

# File System Permissions
# Ensures proper file permissions for development
[automount]
enabled=true
options="metadata,umask=022,fmask=111"
mountFsTab=true

# Network Configuration
[network]
generateHosts=true
generateResolvConf=true
"@

# Write the configuration
Set-Content -Path $wslConfigPath -Value $wslConfigContent -Encoding UTF8

Write-Host "✅ .wslconfig created at: $wslConfigPath"
Write-Host "⚠️  WSL restart required for changes to take effect"
```

#### Manual Creation Method

1. Open File Explorer
2. Navigate to `C:\Users\<YourUsername>\`
3. Create new file named `.wslconfig` (note the leading dot)
4. Paste the configuration from above
5. Save as UTF-8 encoding

#### Apply Configuration

```powershell
# Restart WSL to apply changes
wsl --shutdown

# Wait 10 seconds
Start-Sleep -Seconds 10

# Start WSL
wsl
```

### Step 2: Verify Configuration

```bash
# From inside WSL
# Check memory
free -h

# Check CPU cores
nproc

# Check swap
swapon --show
```

### Step 3: Configure inotify Limits

inotify watches are required for file watching (hot reload, test runners, etc.).

```bash
# Check current limits
cat /proc/sys/fs/inotify/max_user_watches

# Set permanent limits
echo "fs.inotify.max_user_watches=1048576" | sudo tee -a /etc/sysctl.conf
echo "fs.inotify.max_user_instances=8192" | sudo tee -a /etc/sysctl.conf

# Apply immediately
sudo sysctl -p

# Verify
cat /proc/sys/fs/inotify/max_user_watches  # Should show 1048576
```

## Performance Best Practices

### 1. Use WSL Filesystem for Projects

⚠️ **Critical:** Always clone projects to the WSL filesystem, not Windows filesystem.

```bash
# ✅ CORRECT - WSL filesystem (fast)
cd ~
git clone https://github.com/MLorneSmith/2025slideheroes.git

# ❌ WRONG - Windows filesystem (10-100x slower)
cd /mnt/c/Users/YourName/Projects
git clone https://github.com/MLorneSmith/2025slideheroes.git
```

**Why?** Cross-filesystem access between Windows and WSL is extremely slow due to protocol translation overhead.

### 2. Docker Desktop Integration

Enable WSL2 backend in Docker Desktop:

1. Open Docker Desktop Settings
2. Go to "General"
3. Enable "Use the WSL 2 based engine"
4. Go to "Resources" → "WSL Integration"
5. Enable integration with your Ubuntu distribution
6. Click "Apply & Restart"

### 3. Memory Management

```bash
# View memory usage
htop  # Install: sudo apt install htop

# Clear page cache if needed (system will auto-reclaim with dropcache setting)
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
```

### 4. Disk Space Management

```bash
# Check disk usage
df -h

# Compact WSL2 virtual disk (run from PowerShell, WSL must be shut down)
# wsl --shutdown
# diskpart
# select vdisk file="C:\Users\<YourUsername>\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu22.04LTS_...\LocalState\ext4.vhdx"
# compact vdisk
# exit
```

## Troubleshooting

### WSL Version Issues

#### Problem: Running Pre-Release Version (2.6.x)

Pre-release versions can be unstable. Downgrade to stable:

```powershell
# Check version
wsl --version

# Update to stable release (removes pre-release)
wsl --update

# Verify new version (should be 2.2.4 or 2.3.x)
wsl --version

# Restart WSL
wsl --shutdown
Start-Sleep -Seconds 10
wsl

# Verify kernel version from inside WSL
uname -r  # Should show 5.15.x, NOT 6.6.x
```

### Performance Issues

#### Problem: Slow File Operations

**Check filesystem location:**

```bash
pwd
# Should start with /home/username, NOT /mnt/c/
```

**Solution:** Move project to WSL filesystem:

```bash
# Copy from Windows to WSL
cp -r /mnt/c/Users/YourName/Projects/2025slideheroes ~/
cd ~/2025slideheroes
```

#### Problem: High Memory Usage

**Check current usage:**

```bash
free -h
```

**Solutions:**

1. Reduce `memory` setting in `.wslconfig`
2. Enable `autoMemoryReclaim=dropcache`
3. Manually clear caches (see Memory Management section)

#### Problem: File Watching Not Working

**Symptoms:**

- Hot reload doesn't work
- Tests don't re-run on file changes

**Check inotify limits:**

```bash
cat /proc/sys/fs/inotify/max_user_watches
```

**Solution:** Increase limits (see Step 3 in Configuration section)

### Docker Issues

#### Problem: Docker Containers Can't Access Host Services

**Check `.wslconfig` network settings:**

```ini
[wsl2]
localhostForwarding=true
```

**Restart WSL after changes:**

```powershell
wsl --shutdown
```

#### Problem: Permission Errors in Docker Volumes

**Solution:** Use proper UID/GID in containers:

```yaml
services:
  app:
    user: "${UID:-1000}:${GID:-1000}"
```

**Set environment variables:**

```bash
echo "export UID=$(id -u)" >> ~/.bashrc
echo "export GID=$(id -g)" >> ~/.bashrc
source ~/.bashrc
```

### Network Issues

#### Problem: DNS Resolution Fails

**Check `/etc/resolv.conf`:**

```bash
cat /etc/resolv.conf
```

**Solution:** Enable automatic generation in `.wslconfig`:

```ini
[network]
generateResolvConf=true
```

**Or manually set DNS:**

```bash
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

### Common Error Messages

#### "The attempted operation is not supported for the type of object referenced"

**Cause:** WSL not properly installed or enabled

**Solution:**

```powershell
# Enable WSL and Virtual Machine Platform
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reboot
Restart-Computer
```

#### "WSL 2 requires an update to its kernel component"

**Solution:**

```powershell
# Download and install kernel update
# Visit: https://aka.ms/wsl2kernel
# Or update directly:
wsl --update
```

## Environment Variables for WSL

Add these to your `~/.bashrc` for optimal development experience:

```bash
# Performance optimizations
export WATCHPACK_POLLING=false  # Use inotify instead of polling
export CHOKIDAR_USEPOLLING=false

# Docker integration
export DOCKER_HOST=unix:///var/run/docker.sock

# User ID for Docker volumes
export UID=$(id -u)
export GID=$(id -g)

# Node.js optimizations
export NODE_OPTIONS="--max-old-space-size=4096"

# Disable Next.js telemetry
export NEXT_TELEMETRY_DISABLED=1
```

**Apply changes:**

```bash
source ~/.bashrc
```

## SlideHeroes-Specific Setup

After configuring WSL, follow these steps for SlideHeroes development:

1. **Clone the repository** (in WSL filesystem):

   ```bash
   cd ~
   git clone https://github.com/MLorneSmith/2025slideheroes.git
   cd 2025slideheroes
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start Supabase** (uses Docker):

   ```bash
   pnpm supabase:web:start
   ```

4. **Start development server**:

   ```bash
   pnpm dev
   ```

5. **Access from Windows browser**:
   - Web app: `http://localhost:3000`
   - Supabase Studio: `http://localhost:54523`

## Recommended WSL Tools

```bash
# Essential tools
sudo apt update
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  htop \
  tree \
  jq \
  unzip

# Optional but helpful
sudo apt install -y \
  vim \
  tmux \
  zsh \
  bat \
  ripgrep \
  fd-find
```

## Additional Resources

- [WSL Official Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)
- [WSL Best Practices](https://docs.microsoft.com/en-us/windows/wsl/compare-versions)
- [Project Local Development Guide](../cicd/local-development.md)

## Configuration Template Summary

**Quick reference for `.wslconfig` (in `C:\Users\<YourUsername>\.wslconfig`):**

```ini
[wsl2]
memory=16GB
processors=6
swap=16GB
autoMemoryReclaim=dropcache
localhostForwarding=true
sparseVhd=true
kernelCommandLine=vsyscall=emulate
nestedVirtualization=false

[automount]
enabled=true
options="metadata,umask=022,fmask=111"
mountFsTab=true

[network]
generateHosts=true
generateResolvConf=true
```

Remember to restart WSL after creating or modifying `.wslconfig`:

```powershell
wsl --shutdown
```
