#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract model display name
model=$(echo "$input" | jq -r '.model.display_name')

# Get current git branch (skip locks for performance)
branch=$(git -c core.preloadindex=false -c gc.auto=0 branch --show-current 2>/dev/null || echo "no-git")

# Get current working directory (basename only for brevity)
working_dir=$(basename "$PWD")

# Check build status
build_status=""
build_log_file="/tmp/.claude_build_status_${PWD//\//_}"

# Check if build is currently running
if pgrep -f "pnpm (run )?build" > /dev/null 2>&1 || pgrep -f "npm run build" > /dev/null 2>&1; then
    build_status="⟳ building"
elif [ -f "$build_log_file" ]; then
    # Read last build status from temp file
    last_build_info=$(cat "$build_log_file" 2>/dev/null)
    if [ -n "$last_build_info" ]; then
        build_result=$(echo "$last_build_info" | cut -d'|' -f1)
        build_time=$(echo "$last_build_info" | cut -d'|' -f2)
        errors=$(echo "$last_build_info" | cut -d'|' -f3)
        
        # Calculate time since build
        current_time=$(date +%s)
        time_diff=$((current_time - build_time))
        
        # Format time ago
        if [ $time_diff -lt 60 ]; then
            time_ago="${time_diff}s ago"
        elif [ $time_diff -lt 3600 ]; then
            time_ago="$((time_diff / 60))m ago"
        elif [ $time_diff -lt 86400 ]; then
            time_ago="$((time_diff / 3600))h ago"
        else
            time_ago="$((time_diff / 86400))d ago"
        fi
        
        if [ "$build_result" = "success" ]; then
            build_status="✓ build ($time_ago)"
        elif [ "$build_result" = "failed" ]; then
            if [ -n "$errors" ] && [ "$errors" != "0" ]; then
                build_status="✗ build ($errors errors)"
            else
                build_status="✗ build ($time_ago)"
            fi
        fi
    fi
fi

# Default if no build info
if [ -z "$build_status" ]; then
    # Check if common build directories exist to infer status
    if [ -d "dist" ] || [ -d ".next" ] || [ -d "build" ]; then
        build_status="─ build"
    else
        build_status="─ no build"
    fi
fi

# Output the status line
printf "%s | ⎇ %s | %s | %s" "$model" "$branch" "$working_dir" "$build_status"