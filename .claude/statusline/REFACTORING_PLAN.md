# Statusline Refactoring Plan

## Problem Analysis

### Root Causes of Inconsistent Updates

1. **Path Inconsistency** (Critical)
   - Location: `.old.claude/statusline/track-build.sh:6`
   - Issue: Uses `$PWD` instead of `$GIT_ROOT`
   - Impact: Status files created in wrong location, statusline can't find them
   - Fix: Standardize on `$GIT_ROOT` everywhere

2. **Race Conditions** (High Priority)
   - Locations: All wrapper scripts except `update-codecheck-status.sh`
   - Issue: Simple `echo > file` writes aren't atomic
   - Impact: Concurrent updates can corrupt status files
   - Fix: Implement atomic writes (temp + mv) with optional locking

3. **Fragile Process Detection** (Medium Priority)
   - Locations: `statusline.sh:30, 88, 152`
   - Issue: `pgrep` patterns match unrelated processes, miss fast operations
   - Impact: Incorrect "running" status, missed updates
   - Fix: Use PID files for reliable process tracking

4. **Inconsistent Architecture** (Medium Priority)
   - Location: `build-wrapper.sh` calls `track-build.sh`
   - Issue: Indirection creates timing issues, other wrappers write directly
   - Impact: Build status updates are less reliable
   - Fix: All wrappers write directly using shared library

5. **No Validation** (Medium Priority)
   - Locations: All status file operations
   - Issue: No verification that writes succeeded, invalid data not detected
   - Impact: Corrupted status files cause incorrect display
   - Fix: Validate format, verify writes, add cleanup for corrupt files

6. **Brittle Output Parsing** (Low Priority)
   - Locations: All wrapper scripts
   - Issue: Regex patterns break with tool updates
   - Impact: Error/warning counts often wrong or missing
   - Fix: More robust patterns, fallback strategies

## Solution Architecture

### Core Components

1. **`lib/status-common.sh`** - Shared library for all status operations
   - Path generation (always using GIT_ROOT)
   - Atomic write functions
   - Status file validation
   - Debug logging
   - Lock management (optional, for high-contention scenarios)

2. **Improved Wrapper Scripts**
   - `build-wrapper.sh` - Direct status writes, no indirection
   - `test-wrapper.sh` - Better output parsing
   - `codecheck-wrapper.sh` - Improved error detection
   - All use shared library functions

3. **Enhanced `statusline.sh`**
   - More reliable process detection using PID files
   - Better error handling for missing/corrupt files
   - Graceful fallbacks for all components
   - Performance optimizations (reduce subprocess calls)

4. **Utilities**
   - `aliases.sh` - Convenience commands
   - `clear-status.sh` - Clean up all status files
   - `validate-status.sh` - Debug tool to check status files

### Key Improvements

#### 1. Atomic Status Updates

```bash
# Old approach (not atomic, can be corrupted)
echo "success|$timestamp|0" > "$status_file"

# New approach (atomic, race-safe)
temp_file="${status_file}.tmp.$$"
echo "success|$timestamp|0" > "$temp_file"
mv "$temp_file" "$status_file"  # Atomic operation
```

#### 2. Consistent Path Generation

```bash
# Always use GIT_ROOT
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
status_file="/tmp/.claude_build_status_${GIT_ROOT//\//_}"
```

#### 3. PID-Based Process Tracking

```bash
# Write PID when starting
echo "$$" > "/tmp/.claude_test_running_${GIT_ROOT//\//_}.pid"

# Check if actually running
if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
    if ps -p "$pid" > /dev/null 2>&1; then
        status="⟳ test"
    fi
fi

# Clean up when done
rm -f "$pid_file"
```

#### 4. Status File Validation

```bash
validate_status_file() {
    local file="$1"

    # Check file exists and is readable
    [ -f "$file" ] || return 1

    # Parse fields
    IFS='|' read -r status timestamp extras <<< "$(cat "$file")"

    # Validate required fields
    [ -n "$status" ] || return 1
    [[ "$timestamp" =~ ^[0-9]+$ ]] || return 1

    # Check not too old (30 days)
    local age=$(( $(date +%s) - timestamp ))
    [ $age -lt 2592000 ] || return 1

    return 0
}
```

#### 5. Improved Output Parsing

```bash
# Multiple strategies for different tools
parse_test_failures() {
    local output="$1"
    local failed=0

    # Try framework-specific patterns first
    failed=$(grep -oE "([0-9]+) (failed|failing)" "$output" | grep -oE "[0-9]+" | tail -1)

    # Fallback: count FAIL markers
    [ -z "$failed" ] && failed=$(grep -cE "(FAIL|FAILED|✗|✕)" "$output")

    # Ensure at least 1 if exit code was non-zero
    [ "$failed" = "0" ] && failed=1

    echo "$failed"
}
```

### Implementation Phases

#### Phase 1: Core Library (Foundation)
- Create `lib/status-common.sh` with atomic write functions
- Implement path generation standardization
- Add validation functions
- Add debug logging capability

#### Phase 2: Wrapper Refactoring
- Update `build-wrapper.sh` (remove indirection, use library)
- Update `test-wrapper.sh` (better parsing, PID tracking)
- Update `codecheck-wrapper.sh` (improved error detection)
- Remove obsolete `track-build.sh`, `lint-wrapper.sh`, `typecheck-wrapper.sh`

#### Phase 3: Statusline Enhancement
- Update `statusline.sh` to use PID files for process detection
- Add validation for all status file reads
- Improve error handling and fallbacks
- Optimize performance (reduce subprocesses)

#### Phase 4: Utilities & Documentation
- Update `aliases.sh`
- Create `clear-status.sh` utility
- Create `validate-status.sh` debug tool
- Write comprehensive README
- Add troubleshooting guide

### Testing Strategy

1. **Unit Testing** (bash-specific)
   - Test atomic write functions
   - Test path generation consistency
   - Test validation logic
   - Test output parsing

2. **Integration Testing**
   - Run actual builds, tests, codechecks
   - Verify status updates immediately
   - Test concurrent wrapper execution
   - Test statusline reading during updates

3. **Edge Cases**
   - Very fast operations (< 1 second)
   - Concurrent operations
   - Corrupt status files
   - Missing dependencies (jq, gh CLI)
   - Git repository vs non-git directory

### Backward Compatibility

- Keep same status file format (pipe-delimited)
- Keep same file locations (/tmp/.claude_*_status_*)
- Keep same cache timing strategies
- Maintain existing aliases

### Success Criteria

- ✅ Build status updates immediately when build starts/finishes
- ✅ Test status shows correct counts
- ✅ Codecheck status shows accurate error/warning counts
- ✅ No race conditions with concurrent operations
- ✅ Works reliably in CI/CD environments
- ✅ No stale status (max 5 minutes for cached CI/CD)
- ✅ Graceful degradation when tools unavailable
- ✅ Clear debug information when issues occur

### Migration Path

1. Implement new version in `.claude/statusline/`
2. Test thoroughly with new wrappers
3. Update documentation
4. Keep old version in `.old.claude/statusline/` for reference
5. Update shell profiles to use new location
6. Archive old version after 30 days of successful operation
