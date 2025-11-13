#!/bin/bash
# WSL2 Resource Monitoring Script
# Issue #563 - Continuous monitoring for stability tracking

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        WSL2 Resource Monitor - Press Ctrl+C to stop           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Monitoring started at: $(date)"
echo "Log file: /tmp/wsl-resource-monitor.log"
echo ""

# Initialize log
LOG_FILE="/tmp/wsl-resource-monitor.log"
echo "=== WSL2 Resource Monitoring Started: $(date) ===" > "$LOG_FILE"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Trap Ctrl+C for clean exit
trap 'echo -e "\n${GREEN}Monitoring stopped. Log saved to: $LOG_FILE${NC}"; exit 0' INT

# Monitoring loop
ITERATION=0
while true; do
    ((ITERATION++))
    clear

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║           WSL2 Resource Monitor - Iteration #$ITERATION"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo "Time: $TIMESTAMP"
    echo ""

    # Memory Usage
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Memory Usage:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    MEM_INFO=$(free -h | grep -E "^Mem:|^Swap:")
    echo "$MEM_INFO"

    # Calculate percentages
    MEM_TOTAL_GB=$(free -g | awk '/^Mem:/{print $2}')
    MEM_USED_GB=$(free -g | awk '/^Mem:/{print $3}')
    MEM_PERCENT=$((MEM_USED_GB * 100 / MEM_TOTAL_GB))

    if [ "$MEM_PERCENT" -gt 90 ]; then
        echo -e "${RED}⚠ CRITICAL: Memory usage at ${MEM_PERCENT}%${NC}"
        echo "[$TIMESTAMP] CRITICAL: Memory at ${MEM_PERCENT}%" >> "$LOG_FILE"
    elif [ "$MEM_PERCENT" -gt 75 ]; then
        echo -e "${YELLOW}⚠ WARNING: Memory usage at ${MEM_PERCENT}%${NC}"
        echo "[$TIMESTAMP] WARNING: Memory at ${MEM_PERCENT}%" >> "$LOG_FILE"
    else
        echo -e "${GREEN}✓ Memory usage: ${MEM_PERCENT}%${NC}"
    fi
    echo ""

    # Top Memory Consumers
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Top 5 Memory Consumers:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ps aux --sort=-%mem | head -n 6 | tail -n 5 | awk '{printf "%-10s %5s%% %8s  %s\n", substr($1,1,10), $4, $6"K", substr($11,1,40)}'
    echo ""

    # CPU Usage
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Top 5 CPU Consumers:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ps aux --sort=-%cpu | head -n 6 | tail -n 5 | awk '{printf "%-10s %5s%%  %s\n", substr($1,1,10), $3, substr($11,1,45)}'
    echo ""

    # Process Counts
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Process Statistics:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    TOTAL_PROCS=$(ps aux | wc -l)
    NODE_PROCS=$(ps aux | grep -c "[n]ode")
    NEXT_PROCS=$(ps aux | grep -c "[n]ext-server")
    SUPABASE_PROCS=$(ps aux | grep -c "[s]upabase")

    echo "Total Processes:     $TOTAL_PROCS"
    echo "Node.js Processes:   $NODE_PROCS"
    echo "Next.js Processes:   $NEXT_PROCS"
    echo "Supabase Processes:  $SUPABASE_PROCS"

    # Log significant process counts
    if [ "$NODE_PROCS" -gt 20 ]; then
        echo -e "${YELLOW}⚠ High number of Node processes (${NODE_PROCS})${NC}"
        echo "[$TIMESTAMP] WARNING: ${NODE_PROCS} Node processes" >> "$LOG_FILE"
    fi
    echo ""

    # inotify Status
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}File Watcher Status:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    MAX_WATCHES=$(cat /proc/sys/fs/inotify/max_user_watches)
    echo "Max Watches: $MAX_WATCHES"

    # Try to estimate current watch usage (approximate)
    if command -v lsof >/dev/null 2>&1; then
        CURRENT_WATCHES=$(lsof 2>/dev/null | grep -c inotify)
        if [ "$CURRENT_WATCHES" -gt 0 ]; then
            WATCH_PERCENT=$((CURRENT_WATCHES * 100 / MAX_WATCHES))
            echo "Approx Usage: $CURRENT_WATCHES (~${WATCH_PERCENT}%)"

            if [ "$WATCH_PERCENT" -gt 80 ]; then
                echo -e "${RED}⚠ CRITICAL: Watch usage at ${WATCH_PERCENT}%${NC}"
                echo "[$TIMESTAMP] CRITICAL: inotify at ${WATCH_PERCENT}%" >> "$LOG_FILE"
            fi
        fi
    fi
    echo ""

    # Disk Usage
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Disk Usage (Project):${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    df -h /home/msmith/projects/2025slideheroes 2>/dev/null | tail -n 1
    echo ""

    # System Load
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}System Load:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    uptime | awk -F'load average:' '{print "Load Average:" $2}'
    echo ""

    # WSL Kernel Info
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Environment:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Kernel: $(uname -r)"
    WSL_VERSION=$(wsl.exe --version 2>/dev/null | grep "WSL version" | tr -d '\r')
    echo "$WSL_VERSION"

    # Stability indicator
    if [[ "$WSL_VERSION" =~ 2\.6\. ]]; then
        echo -e "${RED}⚠ PRE-RELEASE VERSION - Stability issues expected${NC}"
    elif [[ "$WSL_VERSION" =~ 2\.[2-3]\. ]]; then
        echo -e "${GREEN}✓ Stable WSL version${NC}"
    fi
    echo ""

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next update in 5 seconds... (Ctrl+C to stop)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Log snapshot
    echo "[$TIMESTAMP] Mem: ${MEM_PERCENT}%, Procs: $TOTAL_PROCS (Node: $NODE_PROCS)" >> "$LOG_FILE"

    sleep 5
done
