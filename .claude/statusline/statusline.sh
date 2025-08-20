#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract model display name
model=$(echo "$input" | jq -r '.model.display_name')

# Get current git branch (skip locks for performance)
branch=$(git -c core.preloadindex=false -c gc.auto=0 branch --show-current 2>/dev/null || echo "no-git")

# Get current working directory (basename only for brevity)
working_dir=$(basename "$PWD")

# Get current time in a nice format
current_time=$(date "+%H:%M")

# Output the status line
printf "%s | ⎇ %s | %s | %s" "$model" "$branch" "$working_dir" "$current_time"