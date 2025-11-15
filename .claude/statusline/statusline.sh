#!/bin/bash
# Enhanced Claude Code Statusline
# Displays build, test, codecheck, Docker, CI/CD, and PR status

# Read JSON input from stdin
input=$(cat)

# Extract model display name and convert to lowercase
model=$(echo "$input" | jq -r '.model.display_name' | tr '[:upper:]' '[:lower:]')

# Status indicators using symbols
# 🟢 = Success, fresh (< 30min for dev, < 4h for CI)
# 🟡 = Success, but old OR running/pending
# 🔴 = Error/failure (regardless of time)
# ⚪ = Not run/cancelled/unknown
# ⟳ = Currently running (from PID files, not pgrep)

# Get script directory and source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/status-common.sh
source "$SCRIPT_DIR/lib/status-common.sh"

# Get git root for consistent paths
GIT_ROOT=$(get_git_root)

# Get current git branch (skip locks for performance)
branch=$(git -c core.preloadindex=false -c gc.auto=0 branch --show-current 2>/dev/null || echo "no-git")

# ============================================================================
# Helper Functions
# ============================================================================

# Format time ago from timestamp
# Args: $1 = timestamp (epoch seconds)
# Returns: formatted time string (e.g., "5m", "2h", "3d")
format_time_ago() {
    local timestamp="$1"
    local current_time
    current_time=$(date +%s)
    local time_diff=$((current_time - timestamp))

    if [ $time_diff -lt 60 ]; then
        echo "${time_diff}s"
    elif [ $time_diff -lt 3600 ]; then
        echo "$((time_diff / 60))m"
    elif [ $time_diff -lt 86400 ]; then
        echo "$((time_diff / 3600))h"
    else
        echo "$((time_diff / 86400))d"
    fi
}

# Check if time is fresh (< threshold)
# Args: $1 = timestamp, $2 = threshold in seconds
# Returns: 0 if fresh, 1 if stale
is_fresh() {
    local timestamp="$1"
    local threshold="$2"
    local current_time
    current_time=$(date +%s)
    local age=$((current_time - timestamp))

    [ $age -lt "$threshold" ]
}

# ============================================================================
# Build Status
# ============================================================================

build_status=""
build_status_file=$(get_status_file_path "build")

# Check if build is currently running (PID-based detection)
if is_process_running "build"; then
    build_status="⟳ building"
elif validate_status_file "$build_status_file" 3; then
    # Read build status from file
    IFS='|' read -r result timestamp errors <<< "$(cat "$build_status_file")"

    time_ago=$(format_time_ago "$timestamp")

    if [ "$result" = "success" ]; then
        # Success: Green < 30m, Yellow after 30m
        if is_fresh "$timestamp" 1800; then  # 30 minutes
            build_status="🟢 build ($time_ago)"
        else
            build_status="🟡 build ($time_ago)"
        fi
    elif [ "$result" = "failed" ]; then
        # Failed: Always Red
        if [ -n "$errors" ] && [ "$errors" != "0" ]; then
            build_status="🔴 build:$errors ($time_ago)"
        else
            build_status="🔴 build ($time_ago)"
        fi
    fi
else
    # No valid status file, check for build artifacts
    if [ -d "dist" ] || [ -d ".next" ] || [ -d "build" ]; then
        build_status="⚪ build"
    else
        build_status="⚪ no build"
    fi
fi

# ============================================================================
# Test Status
# ============================================================================

test_status=""
test_status_file=$(get_status_file_path "test")

# Check if tests are currently running (PID-based detection)
if is_process_running "test"; then
    test_status="⟳ test"
elif validate_status_file "$test_status_file" 5; then
    # Read test status from file
    IFS='|' read -r result timestamp passed failed total <<< "$(cat "$test_status_file")"

    time_ago=$(format_time_ago "$timestamp")

    if [ "$result" = "success" ]; then
        # Success: Green < 30m, Yellow after 30m
        if is_fresh "$timestamp" 1800; then  # 30 minutes
            test_status="🟢 test ($time_ago)"
        else
            test_status="🟡 test ($time_ago)"
        fi
    elif [ "$result" = "failed" ]; then
        # Failed: Always Red
        if [ -n "$failed" ] && [ "$failed" != "0" ]; then
            test_status="🔴 test:$failed ($time_ago)"
        else
            test_status="🔴 test ($time_ago)"
        fi
    fi
else
    # No valid status file, check for test configuration
    if [ -d "test" ] || [ -d "tests" ] || [ -d "__tests__" ] || \
       [ -f "vitest.config.ts" ] || [ -f "jest.config.js" ] || \
       [ -d "src/__tests__" ] || \
       find . -maxdepth 3 -name "vitest.config*" 2>/dev/null | grep -q . ; then
        test_status="⚪ test"
    else
        test_status="⚪ no test"
    fi
fi

# ============================================================================
# Codecheck Status
# ============================================================================

codecheck_status=""
codecheck_status_file=$(get_status_file_path "codecheck")

# Check if codecheck is currently running (PID-based detection)
if is_process_running "codecheck"; then
    codecheck_status="⟳ codecheck"
elif validate_status_file "$codecheck_status_file" 5; then
    # Read codecheck status from file
    IFS='|' read -r result timestamp errors warnings type_errors <<< "$(cat "$codecheck_status_file")"

    time_ago=$(format_time_ago "$timestamp")

    if [ "$result" = "success" ]; then
        # Success: Green < 30m, Yellow after 30m
        if is_fresh "$timestamp" 1800; then  # 30 minutes
            codecheck_status="🟢 codecheck ($time_ago)"
        else
            codecheck_status="🟡 codecheck ($time_ago)"
        fi
    elif [ "$result" = "failed" ]; then
        # Failed: Always Red
        if [ -n "$errors" ] && [ "$errors" != "0" ]; then
            if [ -n "$warnings" ] && [ "$warnings" != "0" ]; then
                codecheck_status="🔴 codecheck:$errors/$warnings ($time_ago)"
            else
                codecheck_status="🔴 codecheck:$errors ($time_ago)"
            fi
        else
            codecheck_status="🔴 codecheck ($time_ago)"
        fi
    fi
else
    # No valid status file, check for config files
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || \
       [ -f "biome.json" ] || [ -f ".prettierrc" ] || [ -f "tsconfig.json" ] || \
       [ -f "ruff.toml" ] || [ -f ".pylintrc" ]; then
        codecheck_status="⚪ codecheck"
    else
        codecheck_status="⚪ no codecheck"
    fi
fi

# ============================================================================
# CI/CD Status (GitHub Actions)
# ============================================================================

ci_status=""
if command -v gh &> /dev/null && [ -d "${GIT_ROOT}/.github/workflows" ]; then
    # Cache CI status to avoid too many API calls
    ci_cache_file="/tmp/.claude_ci_status_${GIT_ROOT//\//_}"
    current_time=$(date +%s)

    # Check if cache exists and is fresh
    cache_valid=false
    if [ -f "$ci_cache_file" ]; then
        cache_time=$(stat -c %Y "$ci_cache_file" 2>/dev/null || stat -f %m "$ci_cache_file" 2>/dev/null || echo 0)
        cache_age=$((current_time - cache_time))
        ci_status=$(cat "$ci_cache_file" 2>/dev/null)

        # Adaptive cache times:
        # - 30 seconds for in-progress (to detect completion)
        # - 60 seconds for completed (to detect new runs)
        if [[ "$ci_status" == *"⟳"* ]] || [[ "$ci_status" == *"running"* ]]; then
            [ $cache_age -lt 30 ] && cache_valid=true
        else
            [ $cache_age -lt 60 ] && cache_valid=true
        fi
    fi

    # Fetch new status if cache is stale or missing
    if [ "$cache_valid" = "false" ]; then
        ci_status=""
        latest_run=$(gh run list --limit 1 --json status,conclusion,createdAt 2>/dev/null)

        if [ -n "$latest_run" ] && [ "$latest_run" != "[]" ]; then
            run_status=$(echo "$latest_run" | jq -r '.[0].status' 2>/dev/null)
            run_conclusion=$(echo "$latest_run" | jq -r '.[0].conclusion' 2>/dev/null)
            run_time=$(echo "$latest_run" | jq -r '.[0].createdAt' 2>/dev/null)

            # Calculate time since run
            time_ago=""
            if [ -n "$run_time" ] && [ "$run_time" != "null" ]; then
                run_epoch=$(date -d "$run_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$run_time" +%s 2>/dev/null || echo 0)
                if [ $run_epoch -gt 0 ]; then
                    time_diff=$((current_time - run_epoch))

                    if [ $time_diff -lt 60 ]; then
                        time_ago="${time_diff}s"
                    elif [ $time_diff -lt 3600 ]; then
                        time_ago="$((time_diff / 60))m"
                    elif [ $time_diff -lt 86400 ]; then
                        time_ago="$((time_diff / 3600))h"
                    else
                        time_ago="$((time_diff / 86400))d"
                    fi
                fi
            fi

            # Determine status indicator
            if [ "$run_status" = "in_progress" ] || [ "$run_status" = "queued" ] || [ "$run_status" = "pending" ]; then
                ci_status="🟡 cicd:running"
                [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
            elif [ "$run_status" = "completed" ]; then
                if [ "$run_conclusion" = "success" ]; then
                    ci_status="🟢 cicd"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                elif [ "$run_conclusion" = "failure" ]; then
                    ci_status="🔴 cicd:fail"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                elif [ "$run_conclusion" = "cancelled" ]; then
                    ci_status="⚪ cicd:cancel"
                    [ -n "$time_ago" ] && ci_status="$ci_status ($time_ago)"
                fi
            fi

            # Cache the status
            [ -n "$ci_status" ] && echo "$ci_status" > "$ci_cache_file"
        fi
    fi
fi

# ============================================================================
# PR Status (GitHub Pull Requests)
# ============================================================================

pr_status=""
if command -v gh &> /dev/null && [ -d "${GIT_ROOT}/.git" ]; then
    current_branch=$(git branch --show-current 2>/dev/null)
    # Include branch in cache to invalidate on branch switch
    pr_cache_file="/tmp/.claude_pr_status_${GIT_ROOT//\//_}_${current_branch//\//_}"
    current_time=$(date +%s)

    # Check cache (2 minute TTL)
    if [ -f "$pr_cache_file" ]; then
        cache_time=$(stat -c %Y "$pr_cache_file" 2>/dev/null || stat -f %m "$pr_cache_file" 2>/dev/null || echo 0)
        cache_age=$((current_time - cache_time))

        if [ $cache_age -lt 120 ]; then
            pr_status=$(cat "$pr_cache_file" 2>/dev/null)
        fi
    fi

    # Fetch new status if cache is stale
    if [ -z "$pr_status" ] || [ ! -f "$pr_cache_file" ]; then
        # Check if current branch has an open PR
        branch_pr=$(gh pr list --head "$current_branch" --json number,state,reviewDecision,isDraft --limit 1 2>/dev/null)

        if [ -n "$branch_pr" ] && [ "$branch_pr" != "[]" ]; then
            pr_number=$(echo "$branch_pr" | jq -r '.[0].number' 2>/dev/null)
            pr_state=$(echo "$branch_pr" | jq -r '.[0].state' 2>/dev/null)
            pr_review=$(echo "$branch_pr" | jq -r '.[0].reviewDecision' 2>/dev/null)
            pr_draft=$(echo "$branch_pr" | jq -r '.[0].isDraft' 2>/dev/null)

            if [ "$pr_state" = "OPEN" ]; then
                if [ "$pr_draft" = "true" ]; then
                    pr_status="📝 pr:draft"
                elif [ "$pr_review" = "APPROVED" ]; then
                    pr_status="✅ pr:approved"
                elif [ "$pr_review" = "CHANGES_REQUESTED" ]; then
                    pr_status="🔄 pr:changes"
                elif [ "$pr_review" = "REVIEW_REQUIRED" ] || [ "$pr_review" = "null" ] || [ -z "$pr_review" ]; then
                    pr_status="👀 pr:review"
                fi

                # Add PR number if available
                [ -n "$pr_number" ] && [ "$pr_number" != "null" ] && pr_status="$pr_status #$pr_number"
            fi
        else
            # Check for PRs awaiting review
            review_prs=$(gh pr list --json number --search "review-requested:@me" 2>/dev/null | jq 'length' 2>/dev/null)

            if [ -n "$review_prs" ] && [ "$review_prs" -gt 0 ]; then
                if [ "$review_prs" -eq 1 ]; then
                    pr_status="🔍 pr:1 needs review"
                else
                    pr_status="🔍 pr:$review_prs need review"
                fi
            fi
        fi

        # Cache the status (or empty string if no PR)
        echo "$pr_status" > "$pr_cache_file"
    fi
fi

# ============================================================================
# Docker Status
# ============================================================================

docker_status=""
# Use hash-based path for compatibility with docker-health-wrapper.sh
GIT_ROOT_HASH="$(echo "${GIT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
docker_status_file="/tmp/.claude_docker_status_${GIT_ROOT_HASH}"

if [ -f "$docker_status_file" ]; then
    # Check cache age and trigger background refresh if needed
    cache_mtime=$(stat -c %Y "$docker_status_file" 2>/dev/null || echo "0")
    current_time=$(date +%s)
    cache_age=$((current_time - cache_mtime))

    if [ $cache_age -gt 300 ] && [ -x "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" ]; then
        # Trigger background refresh (5 minute threshold)
        "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" health-check >/dev/null 2>&1 &
    fi

    # Parse Docker status
    if docker_status_content=$(cat "$docker_status_file" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            # Single jq call for efficiency
            docker_data=$(echo "$docker_status_content" | jq -r '
                (.docker_running // false) as $running |
                (.containers.total // 0) as $total |
                (.containers.healthy // 0) as $healthy |
                (.containers.unhealthy // 0) as $unhealthy |
                (.containers.unknown // 0) as $unknown |
                (.last_check // "") as $last_check |
                "\($running)|\($total)|\($healthy)|\($unhealthy)|\($unknown)|\($last_check)"
            ' 2>/dev/null)

            if [ -n "$docker_data" ] && [ "$docker_data" != "null" ]; then
                # Parse pipe-separated values
                docker_running="${docker_data%%|*}"; docker_data="${docker_data#*|}"
                container_total="${docker_data%%|*}"; docker_data="${docker_data#*|}"
                container_healthy="${docker_data%%|*}"; docker_data="${docker_data#*|}"
                container_unhealthy="${docker_data%%|*}"; docker_data="${docker_data#*|}"
                container_unknown="${docker_data%%|*}"; docker_data="${docker_data#*|}"
                last_check="$docker_data"

                # Calculate age
                check_age=0
                if [ -n "$last_check" ] && [ "$last_check" != "null" ] && [ "$last_check" != "" ]; then
                    check_epoch=$(date -d "$last_check" +%s 2>/dev/null || echo "0")
                    if [ "$check_epoch" -gt 0 ]; then
                        check_age=$(( $(date +%s) - check_epoch ))
                    fi
                fi

                # Determine status
                if [ "$docker_running" = "false" ]; then
                    docker_status="🔴 docker:off"
                elif [ "$container_total" = "0" ]; then
                    docker_status="🟡 docker (0/0)"
                elif [ "$container_unhealthy" -gt 0 ]; then
                    docker_status="🔴 docker (${container_healthy}/${container_total})"
                elif [ "$container_unknown" = "0" ] && [ "$container_healthy" = "$container_total" ]; then
                    # All healthy - check freshness
                    if [ $check_age -lt 300 ]; then
                        docker_status="🟢 docker (${container_healthy}/${container_total})"
                    else
                        docker_status="🟡 docker (${container_healthy}/${container_total})"
                        if [ $check_age -ge 60 ]; then
                            time_ago=$(format_time_ago "$check_epoch")
                            docker_status="$docker_status ($time_ago)"
                        fi
                    fi
                else
                    docker_status="🟡 docker (${container_healthy}/${container_total})"
                fi
            else
                docker_status="⚪ docker:parse-error"
            fi
        else
            # Fallback without jq
            if grep -q '"docker_running": *true' "$docker_status_file" 2>/dev/null; then
                container_total=$(grep -o '"total": *[0-9]\+' "$docker_status_file" 2>/dev/null | grep -o '[0-9]\+' | head -1)
                container_healthy=$(grep -o '"healthy": *[0-9]\+' "$docker_status_file" 2>/dev/null | grep -o '[0-9]\+' | head -1)
                container_unhealthy=$(grep -o '"unhealthy": *[0-9]\+' "$docker_status_file" 2>/dev/null | grep -o '[0-9]\+' | head -1)

                if [ "${container_unhealthy:-0}" -gt 0 ]; then
                    docker_status="🔴 docker (${container_healthy:-0}/${container_total:-0})"
                elif [ "${container_healthy:-0}" = "${container_total:-0}" ] && [ "${container_total:-0}" -gt 0 ]; then
                    docker_status="🟢 docker (${container_healthy:-0}/${container_total:-0})"
                else
                    docker_status="🟡 docker (${container_healthy:-0}/${container_total:-0})"
                fi
            else
                docker_status="🔴 docker:off"
            fi
        fi
    else
        docker_status="⚪ docker:read-error"
    fi
elif [ -x "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" ]; then
    # Trigger initial health check
    "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" health-check >/dev/null 2>&1 &
    docker_status="⟳ docker"
else
    docker_status="⚪ docker:none"
fi

# ============================================================================
# Build Output
# ============================================================================

output="$model | ⎇ $branch"

# Add status indicators in order
[ -n "$build_status" ] && output="$output | $build_status"
[ -n "$codecheck_status" ] && output="$output | $codecheck_status"
[ -n "$docker_status" ] && output="$output | $docker_status"
[ -n "$test_status" ] && output="$output | $test_status"
[ -n "$ci_status" ] && output="$output | $ci_status"
[ -n "$pr_status" ] && output="$output | $pr_status"

# Output the status line
printf "%s" "$output"
