# Claude Code Hooks Debug Analysis: UserPromptSubmit Hook Fix

**Date:** 2025-09-18
**Issue:** thinking-level.sh hook not working correctly with `/codecheck` command
**Status:** ✅ RESOLVED

## Problem Summary

The thinking-level.sh hook was configured to return level 0 (no thinking) for `/codecheck` commands, but was still injecting "think" despite settings showing `/codecheck: 0`. Manual testing with raw text worked correctly, but the hook failed when invoked by Claude Code.

## Root Cause Analysis

### 1. Hook Data Flow Issue
- **Expected:** Hook receives raw prompt text from stdin
- **Actual:** Claude Code passes JSON data via stdin with structure:
```json
{
  "prompt": "/codecheck",
  "session_id": "uuid",
  "cwd": "/working/directory",
  "hook_event_name": "UserPromptSubmit"
}
```

### 2. Input Processing Bug
The original hook code read stdin directly:
```bash
prompt=$(cat)  # This got the entire JSON string, not just the prompt
```

This caused the complexity detection to fail because it was analyzing JSON structure instead of the actual user command.

### 3. Command Processing Timing
- **Confirmed:** UserPromptSubmit hooks are called BEFORE command name resolution
- **Confirmed:** Claude Code does NOT transform `/codecheck` to `/core:codecheck` before calling hooks
- **Confirmed:** Hooks receive exactly what the user typed

## Solution Implementation

### Fixed Input Processing
```bash
# Read JSON input from stdin
input=$(cat)

# Parse JSON to extract prompt field
if command -v jq &> /dev/null; then
    prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null)

    # Fallback to raw text if JSON parsing fails
    if [ -z "$prompt" ] || [ "$prompt" = "null" ]; then
        prompt="$input"
    fi
else
    # Regex fallback for systems without jq
    if [[ "$input" =~ \"prompt\"[[:space:]]*:[[:space:]]*\"([^\"]+)\" ]]; then
        prompt="${BASH_REMATCH[1]}"
    else
        prompt="$input"
    fi
fi
```

### Output Format Correction
Changed from complex JSON response to simple text output:
```bash
# Before: Complex JSON output
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "$keyword"
  }
}
EOF

# After: Simple text output (Claude Code injects this as context)
echo "$keyword"
```

## Testing Results

All test scenarios now pass:

| Test Case | Input | Expected Output | Actual Output | Status |
|-----------|-------|-----------------|---------------|---------|
| JSON /codecheck | `{"prompt": "/codecheck"}` | (none) | (none) | ✅ |
| JSON /core:codecheck | `{"prompt": "/core:codecheck"}` | (none) | (none) | ✅ |
| JSON implement | `{"prompt": "implement feature"}` | "think" | "think" | ✅ |
| Raw text /codecheck | `/codecheck` | (none) | (none) | ✅ |
| JSON research | `{"prompt": "research..."}` | "think hard" | "think hard" | ✅ |

## Debugging Tools Created

### 1. Debug Input Logger
`/.claude/hooks/debug-hook-input.sh` - Captures actual hook input for inspection
```bash
# Usage: Temporarily replace your hook with this to capture input format
bash .claude/hooks/debug-hook-input.sh
# Check: .claude/hooks/debug-input.log
```

### 2. Comprehensive Test Suite
`/.claude/hooks/test-hook-scenarios.sh` - Validates hook behavior across scenarios
```bash
# Run all test scenarios
bash .claude/hooks/test-hook-scenarios.sh
```

## Best Practices for Claude Code Hooks

### 1. Always Parse JSON Input
```bash
# Correct approach
input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null)

# Incorrect approach
prompt=$(cat)  # Gets raw JSON, not the prompt field
```

### 2. Provide Fallback for Non-JSON
```bash
# Handle both JSON and raw text input
if [ -z "$prompt" ] || [ "$prompt" = "null" ]; then
    prompt="$input"  # Fallback to treating input as raw text
fi
```

### 3. Error Handling
```bash
# Use 2>/dev/null to suppress jq errors
prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null)

# Always provide sensible defaults
if [ -z "$prompt" ]; then
    # Use default behavior
fi
```

### 4. Output Format
- **UserPromptSubmit:** stdout becomes additional context for Claude
- **Other hooks:** stdout shown to user in transcript mode
- **stderr:** Error messages (exit code 2 = blocking error)

## Key Insights

1. **JSON is Standard:** All Claude Code hooks receive JSON input via stdin
2. **No Template Variables:** Claude Code doesn't substitute `{{user_prompt}}` - use JSON parsing instead
3. **Timing Matters:** UserPromptSubmit happens before command resolution
4. **Simple Output:** For UserPromptSubmit, simple text output works better than complex JSON

## Prevention Strategies

1. **Always test hooks with JSON input** that matches Claude Code's format
2. **Use jq for robust JSON parsing** with proper error handling
3. **Provide fallbacks** for systems without jq or malformed input
4. **Create test suites** to validate hook behavior across scenarios
5. **Log debugging info** during development to understand actual input format

## Status: RESOLVED

The thinking-level.sh hook now correctly:
- ✅ Parses JSON input from Claude Code
- ✅ Extracts the prompt field properly
- ✅ Respects `/codecheck: 0` configuration
- ✅ Returns no thinking keyword for level 0 commands
- ✅ Maintains backward compatibility with raw text input
- ✅ Handles edge cases and errors gracefully