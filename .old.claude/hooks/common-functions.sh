#!/bin/bash
# Common functions for all hooks to reduce code duplication

# Source the configuration
HOOK_DIR="$(dirname "${BASH_SOURCE[0]}")"
source "$HOOK_DIR/.hookconfig"

# Function to check if hook should run based on throttling
should_run_hook() {
    local hook_name="$1"
    local throttle_file="$HOOK_CACHE_DIR/${hook_name}.last-run"
    
    # Check if throttling is enabled
    if [[ -z "$HOOK_THROTTLE_SECONDS" ]] || [[ "$HOOK_THROTTLE_SECONDS" -eq 0 ]]; then
        return 0  # No throttling, always run
    fi
    
    # Check if enough time has passed since last run
    if [[ -f "$throttle_file" ]]; then
        local last_run=$(cat "$throttle_file")
        local current_time=$(date +%s)
        local elapsed=$((current_time - last_run))
        
        if [[ $elapsed -lt $HOOK_THROTTLE_SECONDS ]]; then
            if [[ "$VERBOSE" == "true" ]]; then
                local remaining=$((HOOK_THROTTLE_SECONDS - elapsed))
                echo "⏳ Hook throttled: ${elapsed}s elapsed, ${remaining}s until next run"
            fi
            return 1  # Don't run yet
        fi
    fi
    
    # Update last run timestamp
    date +%s > "$throttle_file"
    return 0  # OK to run
}

# Function to check if file should be checked
should_check_file() {
    local file="$1"
    local filename=$(basename "$file")
    local extension="${filename##*.}"
    local dir=$(dirname "$file")
    
    # Check if file exists
    if [[ ! -f "$file" ]]; then
        [[ "$VERBOSE" == "true" ]] && echo "⚠️  File not found: $file"
        return 1
    fi
    
    # Check file extension
    if [[ -n "$CHECK_EXTENSIONS" ]]; then
        local valid_ext=false
        IFS=',' read -ra EXTS <<< "$CHECK_EXTENSIONS"
        for ext in "${EXTS[@]}"; do
            if [[ "$extension" == "$ext" ]]; then
                valid_ext=true
                break
            fi
        done
        if [[ "$valid_ext" == false ]]; then
            [[ "$VERBOSE" == "true" ]] && echo "⏭️  Skipping $file (extension: .$extension)"
            return 1
        fi
    fi
    
    # Check skip patterns
    if [[ -n "$SKIP_PATTERNS" ]]; then
        IFS=',' read -ra PATTERNS <<< "$SKIP_PATTERNS"
        for pattern in "${PATTERNS[@]}"; do
            if [[ "$file" == $pattern ]] || [[ "$filename" == $pattern ]]; then
                [[ "$VERBOSE" == "true" ]] && echo "⏭️  Skipping $file (matches pattern: $pattern)"
                return 1
            fi
        done
    fi
    
    # Check skip directories
    if [[ -n "$SKIP_DIRECTORIES" ]]; then
        IFS=',' read -ra DIRS <<< "$SKIP_DIRECTORIES"
        for skip_dir in "${DIRS[@]}"; do
            if [[ "$dir" == *"$skip_dir"* ]]; then
                [[ "$VERBOSE" == "true" ]] && echo "⏭️  Skipping $file (in directory: $skip_dir)"
                return 1
            fi
        done
    fi
    
    # Check file size
    if [[ -n "$MAX_FILE_SIZE_KB" ]]; then
        local file_size_kb=$(du -k "$file" | cut -f1)
        if [[ $file_size_kb -gt $MAX_FILE_SIZE_KB ]]; then
            [[ "$VERBOSE" == "true" ]] && echo "⏭️  Skipping $file (size: ${file_size_kb}KB > ${MAX_FILE_SIZE_KB}KB)"
            return 1
        fi
    fi
    
    return 0  # File should be checked
}

# Function to batch file changes
add_to_batch() {
    local hook_name="$1"
    local file="$2"
    local batch_file="$HOOK_CACHE_DIR/${hook_name}.batch"
    
    # Add file to batch
    echo "$file" >> "$batch_file"
    
    # Check if batch size reached
    if [[ -n "$HOOK_BATCH_SIZE" ]] && [[ "$HOOK_BATCH_SIZE" -gt 0 ]]; then
        local batch_count=$(wc -l < "$batch_file" 2>/dev/null || echo 0)
        if [[ $batch_count -ge $HOOK_BATCH_SIZE ]]; then
            return 0  # Batch is ready
        fi
    fi
    
    return 1  # Batch not ready yet
}

# Function to get batched files
get_batch_files() {
    local hook_name="$1"
    local batch_file="$HOOK_CACHE_DIR/${hook_name}.batch"
    
    if [[ -f "$batch_file" ]]; then
        cat "$batch_file"
        > "$batch_file"  # Clear batch file
    fi
}

# Function to check if hook is disabled
is_hook_disabled() {
    local hook_type="$1"
    
    case "$hook_type" in
        "format")
            [[ "$DISABLE_FORMAT_HOOKS" == "true" ]] && return 0
            ;;
        "lint")
            [[ "$DISABLE_LINT_HOOKS" == "true" ]] && return 0
            ;;
    esac
    
    return 1
}