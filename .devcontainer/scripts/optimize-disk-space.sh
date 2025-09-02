#!/bin/bash

# Script to optimize disk space in Codespaces before installing dependencies
# This helps prevent ENOSPC errors during pnpm install

set -e

echo "🧹 Optimizing disk space for Codespaces..."

# Function to check available disk space
check_disk_space() {
    df -h /workspace | awk 'NR==2 {print "Available: " $4 " (" $5 " used)"}'
}

echo "Initial disk space:"
check_disk_space

# 1. Clean up APT cache (saves ~100-200MB)
echo "Cleaning APT cache..."
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*

# 2. Remove unnecessary packages (if in Codespaces)
if [ "$CODESPACES" = "true" ]; then
    echo "Removing unnecessary packages for Codespaces..."
    # Remove large packages we don't need
    sudo apt-get remove -y --auto-remove \
        firefox* \
        google-chrome* \
        thunderbird* \
        libreoffice* \
        2>/dev/null || true
fi

# 3. Clean up Docker if available (saves significant space)
if command -v docker &> /dev/null; then
    echo "Cleaning Docker resources..."
    # Remove unused images
    docker image prune -af 2>/dev/null || true
    # Remove stopped containers
    docker container prune -f 2>/dev/null || true
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || true
    # Remove build cache
    docker builder prune -af 2>/dev/null || true
fi

# 4. Clear npm/pnpm caches
echo "Cleaning package manager caches..."
npm cache clean --force 2>/dev/null || true
if command -v pnpm &> /dev/null; then
    pnpm store prune 2>/dev/null || true
fi

# 5. Remove temp files
echo "Removing temporary files..."
sudo rm -rf /tmp/* 2>/dev/null || true
sudo rm -rf /var/tmp/* 2>/dev/null || true

# 6. Clear journal logs (can be large in long-running containers)
if [ -d /var/log/journal ]; then
    echo "Cleaning journal logs..."
    sudo journalctl --vacuum-size=50M 2>/dev/null || true
fi

# 7. Remove old kernel headers (if any)
echo "Removing old kernel headers..."
sudo apt-get autoremove -y 2>/dev/null || true

# 8. Clear bash history and other user caches
echo "Cleaning user caches..."
rm -rf ~/.cache/* 2>/dev/null || true
rm -rf ~/.npm 2>/dev/null || true
rm -rf ~/.pnpm-store 2>/dev/null || true

echo ""
echo "Final disk space after cleanup:"
check_disk_space
echo ""

# Calculate saved space
INITIAL_USED=$(df /workspace | awk 'NR==2 {print $3}')
FINAL_USED=$(df /workspace | awk 'NR==2 {print $3}')
SAVED=$((INITIAL_USED - FINAL_USED))

if [ $SAVED -gt 0 ]; then
    echo "✅ Successfully freed up approximately $(($SAVED / 1024))MB of disk space"
else
    echo "✅ Disk cleanup completed"
fi