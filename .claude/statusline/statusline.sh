#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract model display name
model=$(echo "$input" | jq -r '.model.display_name')

# Age indicators using symbols instead of colors
# Since colors might not work in all terminals, use symbols to indicate freshness
# 🟢 = Fresh (< 30 min)
# 🟡 = Recent (< 2 hours)  
# 🔴 = Stale (> 2 hours)
# ⚪ = Not run

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
        
        # Determine freshness indicator based on age
        if [ $time_diff -lt 1800 ]; then  # Less than 30 minutes
            age_indicator="🟢"
        elif [ $time_diff -lt 7200 ]; then  # Less than 2 hours
            age_indicator="🟡"
        else  # Older than 2 hours
            age_indicator="🔴"
        fi
        
        # Format time ago
        if [ $time_diff -lt 60 ]; then
            time_ago="${time_diff}s"
        elif [ $time_diff -lt 3600 ]; then
            time_ago="$((time_diff / 60))m"
        elif [ $time_diff -lt 86400 ]; then
            time_ago="$((time_diff / 3600))h"
        else
            time_ago="$((time_diff / 86400))d"
        fi
        
        if [ "$build_result" = "success" ]; then
            build_status="${age_indicator} build (${time_ago})"
        elif [ "$build_result" = "failed" ]; then
            if [ -n "$errors" ] && [ "$errors" != "0" ]; then
                build_status="🔴 build:$errors (${time_ago})"
            else
                build_status="🔴 build (${time_ago})"
            fi
        fi
    fi
fi

# Default if no build info
if [ -z "$build_status" ]; then
    # Check if common build directories exist to infer status
    if [ -d "dist" ] || [ -d ".next" ] || [ -d "build" ]; then
        build_status="⚪ build"
    else
        build_status="⚪ no build"
    fi
fi

# Check test status
test_status=""
test_log_file="/tmp/.claude_test_status_${PWD//\//_}"

# Check if tests are currently running (exclude LSP/watch modes, look for actual test execution)
if pgrep -f "pnpm test|npm test|yarn test|vitest run|jest --run|mocha|pytest" | grep -v "watch" | grep -v "lsp" > /dev/null 2>&1; then
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
        
        # Determine freshness indicator based on age
        if [ $time_diff -lt 1800 ]; then  # Less than 30 minutes
            age_indicator="🟢"
        elif [ $time_diff -lt 7200 ]; then  # Less than 2 hours
            age_indicator="🟡"
        else  # Older than 2 hours
            age_indicator="🔴"
        fi
        
        # Format time ago
        if [ $time_diff -lt 60 ]; then
            time_ago="${time_diff}s"
        elif [ $time_diff -lt 3600 ]; then
            time_ago="$((time_diff / 60))m"
        elif [ $time_diff -lt 86400 ]; then
            time_ago="$((time_diff / 3600))h"
        else
            time_ago="$((time_diff / 86400))d"
        fi
        
        if [ "$test_result" = "success" ]; then
            test_status="${age_indicator} test (${time_ago})"
        elif [ "$test_result" = "failed" ]; then
            if [ -n "$failed" ] && [ "$failed" != "0" ]; then
                test_status="🔴 test:$failed (${time_ago})"
            else
                test_status="🔴 test (${time_ago})"
            fi
        elif [ "$test_result" = "running" ]; then
            test_status="⟳ test"
        fi
    fi
fi

# Default if no test info
if [ -z "$test_status" ]; then
    # Check if test directories/files exist to infer if tests are available
    if [ -d "test" ] || [ -d "tests" ] || [ -d "__tests__" ] || [ -f "vitest.config.ts" ] || [ -f "jest.config.js" ] || [ -d "src/__tests__" ] || find . -maxdepth 3 -name "vitest.config*" 2>/dev/null | grep -q . ; then
        test_status="⚪ test"
    else
        test_status="⚪ no test"
    fi
fi

# Check codecheck status (combines lint + typecheck)
codecheck_status=""
codecheck_log_file="/tmp/.claude_codecheck_status_${PWD//\//_}"
# Also check old lint status file for backwards compatibility
lint_log_file="/tmp/.claude_lint_status_${PWD//\//_}"

# Check if codecheck/lint/typecheck is currently running (exclude LSP servers)
if pgrep -f "code-check|codecheck|pnpm lint|npm run lint|yarn lint|pnpm typecheck|tsc --noEmit|pnpm.*biome check|eslint .*\.(js|ts|jsx|tsx)" | grep -v "lsp" | grep -v "__run_server" > /dev/null 2>&1; then
    codecheck_status="⟳ codecheck"
elif [ -f "$codecheck_log_file" ]; then
    # Read last codecheck status from temp file
    last_check_info=$(cat "$codecheck_log_file" 2>/dev/null)
    if [ -n "$last_check_info" ]; then
        check_result=$(echo "$last_check_info" | cut -d'|' -f1)
        check_time=$(echo "$last_check_info" | cut -d'|' -f2)
        errors=$(echo "$last_check_info" | cut -d'|' -f3)
        warnings=$(echo "$last_check_info" | cut -d'|' -f4)
        type_errors=$(echo "$last_check_info" | cut -d'|' -f5)
        
        # Calculate time since check
        current_time=$(date +%s)
        time_diff=$((current_time - check_time))
        
        # Determine freshness indicator based on age
        if [ $time_diff -lt 1800 ]; then  # Less than 30 minutes
            age_indicator="🟢"
        elif [ $time_diff -lt 7200 ]; then  # Less than 2 hours
            age_indicator="🟡"
        else  # Older than 2 hours
            age_indicator="🔴"
        fi
        
        # Format time ago
        if [ $time_diff -lt 60 ]; then
            time_ago="${time_diff}s"
        elif [ $time_diff -lt 3600 ]; then
            time_ago="$((time_diff / 60))m"
        elif [ $time_diff -lt 86400 ]; then
            time_ago="$((time_diff / 3600))h"
        else
            time_ago="$((time_diff / 86400))d"
        fi
        
        if [ "$check_result" = "success" ]; then
            codecheck_status="${age_indicator} codecheck (${time_ago})"
        elif [ "$check_result" = "failed" ]; then
            if [ -n "$errors" ] && [ "$errors" != "0" ]; then
                if [ -n "$warnings" ] && [ "$warnings" != "0" ]; then
                    codecheck_status="🔴 codecheck:$errors/$warnings (${time_ago})"
                else
                    codecheck_status="🔴 codecheck:$errors (${time_ago})"
                fi
            else
                codecheck_status="🔴 codecheck (${time_ago})"
            fi
        elif [ "$check_result" = "running" ]; then
            codecheck_status="⟳ codecheck"
        fi
    fi
elif [ -f "$lint_log_file" ]; then
    # Fall back to old lint status for backwards compatibility
    last_lint_info=$(cat "$lint_log_file" 2>/dev/null)
    if [ -n "$last_lint_info" ]; then
        lint_result=$(echo "$last_lint_info" | cut -d'|' -f1)
        errors=$(echo "$last_lint_info" | cut -d'|' -f3)
        warnings=$(echo "$last_lint_info" | cut -d'|' -f4)
        
        # Calculate time since lint (for age indicator)
        lint_time=$(echo "$last_lint_info" | cut -d'|' -f2)
        current_time=$(date +%s)
        time_diff=$((current_time - lint_time))
        
        # Determine freshness indicator based on age
        if [ $time_diff -lt 1800 ]; then  # Less than 30 minutes
            age_indicator="🟢"
        elif [ $time_diff -lt 7200 ]; then  # Less than 2 hours
            age_indicator="🟡"
        else  # Older than 2 hours
            age_indicator="🔴"
        fi
        
        # Format time ago
        if [ $time_diff -lt 60 ]; then
            time_ago="${time_diff}s"
        elif [ $time_diff -lt 3600 ]; then
            time_ago="$((time_diff / 60))m"
        elif [ $time_diff -lt 86400 ]; then
            time_ago="$((time_diff / 3600))h"
        else
            time_ago="$((time_diff / 86400))d"
        fi
        
        if [ "$lint_result" = "success" ]; then
            codecheck_status="${age_indicator} codecheck (${time_ago})"
        elif [ "$lint_result" = "failed" ]; then
            if [ -n "$errors" ] && [ "$errors" != "0" ]; then
                if [ -n "$warnings" ] && [ "$warnings" != "0" ]; then
                    codecheck_status="🔴 codecheck:$errors/$warnings (${time_ago})"
                else
                    codecheck_status="🔴 codecheck:$errors (${time_ago})"
                fi
            else
                codecheck_status="🔴 codecheck (${time_ago})"
            fi
        elif [ "$lint_result" = "running" ]; then
            codecheck_status="⟳ codecheck"
        fi
    fi
fi

# Default if no codecheck info
if [ -z "$codecheck_status" ]; then
    # Check if lint/typecheck config files exist to infer if code checking is available
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f "biome.json" ] || [ -f ".prettierrc" ] || [ -f "tsconfig.json" ] || [ -f "ruff.toml" ] || [ -f ".pylintrc" ]; then
        codecheck_status="⚪ codecheck"
    else
        codecheck_status="⚪ no codecheck"
    fi
fi

# Check CI/CD status (GitHub Actions)
ci_status=""
if command -v gh &> /dev/null && [ -d ".github/workflows" ]; then
    # Cache CI status for 5 minutes to avoid too many API calls
    ci_cache_file="/tmp/.claude_ci_status_${PWD//\//_}"
    current_time=$(date +%s)
    
    # Check if cache exists and is fresh (less than 5 minutes old)
    if [ -f "$ci_cache_file" ]; then
        cache_time=$(stat -c %Y "$ci_cache_file" 2>/dev/null || stat -f %m "$ci_cache_file" 2>/dev/null || echo 0)
        cache_age=$((current_time - cache_time))
        
        if [ $cache_age -lt 300 ]; then  # Less than 5 minutes
            ci_status=$(cat "$ci_cache_file" 2>/dev/null)
        fi
    fi
    
    # If no cached status or cache is stale, fetch new status
    if [ -z "$ci_status" ]; then
        # Get the latest workflow run status
        latest_run=$(gh run list --limit 1 --json status,conclusion,createdAt 2>/dev/null)
        
        if [ -n "$latest_run" ] && [ "$latest_run" != "[]" ]; then
            run_status=$(echo "$latest_run" | jq -r '.[0].status' 2>/dev/null)
            run_conclusion=$(echo "$latest_run" | jq -r '.[0].conclusion' 2>/dev/null)
            run_time=$(echo "$latest_run" | jq -r '.[0].createdAt' 2>/dev/null)
            
            # Calculate time since run
            if [ -n "$run_time" ] && [ "$run_time" != "null" ]; then
                # Convert ISO date to epoch
                run_epoch=$(date -d "$run_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$run_time" +%s 2>/dev/null || echo 0)
                if [ $run_epoch -gt 0 ]; then
                    time_diff=$((current_time - run_epoch))
                    
                    # Format time ago
                    if [ $time_diff -lt 60 ]; then
                        time_ago="${time_diff}s"
                    elif [ $time_diff -lt 3600 ]; then
                        time_ago="$((time_diff / 60))m"
                    elif [ $time_diff -lt 86400 ]; then
                        time_ago="$((time_diff / 3600))h"
                    else
                        time_ago="$((time_diff / 86400))d"
                    fi
                    
                    # Determine freshness indicator
                    if [ $time_diff -lt 1800 ]; then  # Less than 30 minutes
                        age_indicator="🟢"
                    elif [ $time_diff -lt 7200 ]; then  # Less than 2 hours
                        age_indicator="🟡"
                    else  # Older than 2 hours
                        age_indicator="🔴"
                    fi
                fi
            fi
            
            # Determine status indicator
            if [ "$run_status" = "in_progress" ] || [ "$run_status" = "queued" ]; then
                ci_status="⟳ CI"
            elif [ "$run_status" = "completed" ]; then
                if [ "$run_conclusion" = "success" ]; then
                    ci_status="${age_indicator:-🟢} CI"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                elif [ "$run_conclusion" = "failure" ]; then
                    ci_status="🔴 CI:fail"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                elif [ "$run_conclusion" = "cancelled" ]; then
                    ci_status="⚪ CI:cancel"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                fi
            fi
            
            # Cache the status
            [ -n "$ci_status" ] && echo "$ci_status" > "$ci_cache_file"
        fi
    fi
fi

# Build the output with conditional sections
output="$model | ⎇ $branch | $working_dir"

# Add build status
[ -n "$build_status" ] && output="$output | $build_status"

# Add test status
[ -n "$test_status" ] && output="$output | $test_status"

# Add codecheck status
[ -n "$codecheck_status" ] && output="$output | $codecheck_status"

# Add CI status
[ -n "$ci_status" ] && output="$output | $ci_status"

# Output the status line
printf "%s" "$output"