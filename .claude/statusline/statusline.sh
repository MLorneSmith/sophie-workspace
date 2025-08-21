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

# Check test status
test_status=""
test_log_file="/tmp/.claude_test_status_${PWD//\//_}"

# Check if tests are currently running
if pgrep -f "vitest|jest|mocha|pytest|pnpm test|npm test|yarn test" > /dev/null 2>&1; then
    test_status="⟳ test"
elif [ -f "$test_log_file" ]; then
    # Read last test status from temp file
    last_test_info=$(cat "$test_log_file" 2>/dev/null)
    if [ -n "$last_test_info" ]; then
        test_result=$(echo "$last_test_info" | cut -d'|' -f1)
        test_time=$(echo "$last_test_info" | cut -d'|' -f2)
        passed=$(echo "$last_test_info" | cut -d'|' -f3)
        failed=$(echo "$last_test_info" | cut -d'|' -f4)
        
        # Calculate time since test
        current_time=$(date +%s)
        time_diff=$((current_time - test_time))
        
        if [ "$test_result" = "success" ]; then
            test_status="✓ test"
        elif [ "$test_result" = "failed" ]; then
            if [ -n "$failed" ] && [ "$failed" != "0" ]; then
                test_status="✗ test:$failed"
            else
                test_status="✗ test"
            fi
        elif [ "$test_result" = "running" ]; then
            test_status="⟳ test"
        fi
    fi
fi

# Default if no test info
if [ -z "$test_status" ]; then
    # Check if test directories/files exist to infer if tests are available
    if [ -d "test" ] || [ -d "tests" ] || [ -d "__tests__" ] || [ -f "vitest.config.ts" ] || [ -f "jest.config.js" ] || [ -d "src/__tests__" ]; then
        test_status="─ test"
    else
        test_status="─ no test"
    fi
fi

# Check lint status
lint_status=""
lint_log_file="/tmp/.claude_lint_status_${PWD//\//_}"

# Check if linting is currently running
if pgrep -f "eslint|biome|ruff|pylint|tsc|pnpm lint|npm run lint|yarn lint" > /dev/null 2>&1; then
    lint_status="⟳ lint"
elif [ -f "$lint_log_file" ]; then
    # Read last lint status from temp file
    last_lint_info=$(cat "$lint_log_file" 2>/dev/null)
    if [ -n "$last_lint_info" ]; then
        lint_result=$(echo "$last_lint_info" | cut -d'|' -f1)
        lint_time=$(echo "$last_lint_info" | cut -d'|' -f2)
        errors=$(echo "$last_lint_info" | cut -d'|' -f3)
        warnings=$(echo "$last_lint_info" | cut -d'|' -f4)
        
        # Calculate time since lint
        current_time=$(date +%s)
        time_diff=$((current_time - lint_time))
        
        if [ "$lint_result" = "success" ]; then
            lint_status="✓ lint"
        elif [ "$lint_result" = "failed" ]; then
            if [ -n "$errors" ] && [ "$errors" != "0" ]; then
                if [ -n "$warnings" ] && [ "$warnings" != "0" ]; then
                    lint_status="✗ lint:$errors/$warnings"
                else
                    lint_status="✗ lint:$errors"
                fi
            else
                lint_status="✗ lint"
            fi
        elif [ "$lint_result" = "running" ]; then
            lint_status="⟳ lint"
        fi
    fi
fi

# Default if no lint info
if [ -z "$lint_status" ]; then
    # Check if lint config files exist to infer if linting is available
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f "biome.json" ] || [ -f ".prettierrc" ] || [ -f "ruff.toml" ] || [ -f ".pylintrc" ]; then
        lint_status="─ lint"
    else
        lint_status="─ no lint"
    fi
fi

# Build the output with conditional sections
output="$model | ⎇ $branch | $working_dir"

# Add build status
[ -n "$build_status" ] && output="$output | $build_status"

# Add test status
[ -n "$test_status" ] && output="$output | $test_status"

# Add lint status
[ -n "$lint_status" ] && output="$output | $lint_status"

# Output the status line
printf "%s" "$output"