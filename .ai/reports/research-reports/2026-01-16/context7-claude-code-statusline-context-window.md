# Context7 Research: Claude Code Statusline and Context Window Configuration

**Date**: 2026-01-16
**Agent**: context7-expert
**Libraries Researched**: anthropics/claude-code, websites/code_claude, hesreallyhim/awesome-claude-code

## Query Summary

Researched Claude Code statusline configuration and context window information to understand:
1. How Claude Code statusline works and configuration options
2. Methods to access context window usage percentage
3. How to configure custom statusline components
4. Documentation about context window metrics

## Findings

### 1. Statusline Configuration

Claude Code supports custom status lines through a configurable command that receives JSON input via stdin and outputs a formatted string.

**Configuration Location**: `.claude/settings.json`

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

**Key Configuration Options**:
- `type`: Must be "command"
- `command`: Path to the script that generates the status line output
- `padding`: Optional padding around the output

### 2. Context Window Information - JSON Input Structure

The statusline script receives comprehensive session data via stdin as JSON. This includes full context window metrics:

```json
{
  "hook_event_name": "Status",
  "session_id": "abc123...",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/current/working/directory",
  "model": {
    "id": "claude-opus-4-1",
    "display_name": "Opus"
  },
  "workspace": {
    "current_dir": "/current/working/directory",
    "project_dir": "/original/project/directory"
  },
  "version": "1.0.80",
  "output_style": {
    "name": "default"
  },
  "cost": {
    "total_cost_usd": 0.01234,
    "total_duration_ms": 45000,
    "total_api_duration_ms": 2300,
    "total_lines_added": 156,
    "total_lines_removed": 23
  },
  "context_window": {
    "total_input_tokens": 15234,
    "total_output_tokens": 4521,
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 8500,
      "output_tokens": 1200,
      "cache_creation_input_tokens": 5000,
      "cache_read_input_tokens": 2000
    }
  }
}
```

### 3. Context Window Metrics Available

The `context_window` object provides:
- `total_input_tokens`: Cumulative input tokens for the session
- `total_output_tokens`: Cumulative output tokens for the session
- `context_window_size`: Maximum context window size (e.g., 200000)
- `current_usage`: Current turn's token breakdown
  - `input_tokens`: Regular input tokens
  - `output_tokens`: Output tokens
  - `cache_creation_input_tokens`: Tokens used for cache creation
  - `cache_read_input_tokens`: Tokens read from cache

### 4. Calculating Context Window Usage Percentage

**Bash Script Example**:
```bash
#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size')
USAGE=$(echo "$input" | jq '.context_window.current_usage')

if [ "$USAGE" != "null" ]; then
    # Calculate current context from current_usage fields
    CURRENT_TOKENS=$(echo "$USAGE" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
    PERCENT_USED=$((CURRENT_TOKENS * 100 / CONTEXT_SIZE))
    echo "[$MODEL] Context: ${PERCENT_USED}%"
else
    echo "[$MODEL] Context: 0%"
fi
```

**Python Script Example**:
```python
#!/usr/bin/env python3
import json
import sys
import os

# Read JSON from stdin
data = json.load(sys.stdin)

# Extract values
model = data['model']['display_name']
context_size = data['context_window']['context_window_size']
current_usage = data['context_window'].get('current_usage')

if current_usage:
    current_tokens = (
        current_usage.get('input_tokens', 0) +
        current_usage.get('cache_creation_input_tokens', 0) +
        current_usage.get('cache_read_input_tokens', 0)
    )
    percent_used = (current_tokens * 100) // context_size
    print(f"[{model}] Context: {percent_used}%")
else:
    print(f"[{model}] Context: 0%")
```

**Node.js Script Example**:
```javascript
#!/usr/bin/env node
const fs = require('fs');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    
    const model = data.model.display_name;
    const contextSize = data.context_window.context_window_size;
    const usage = data.context_window.current_usage;
    
    if (usage) {
        const currentTokens = usage.input_tokens + 
                             (usage.cache_creation_input_tokens || 0) + 
                             (usage.cache_read_input_tokens || 0);
        const percentUsed = Math.floor((currentTokens * 100) / contextSize);
        console.log(`[${model}] Context: ${percentUsed}%`);
    } else {
        console.log(`[${model}] Context: 0%`);
    }
});
```

### 5. Helper Functions for Status Line Scripts

These jq-based helper functions can extract specific values:

```bash
get_model_name() { echo "$input" | jq -r '.model.display_name'; }
get_current_dir() { echo "$input" | jq -r '.workspace.current_dir'; }
get_project_dir() { echo "$input" | jq -r '.workspace.project_dir'; }
get_version() { echo "$input" | jq -r '.version'; }
get_cost() { echo "$input" | jq -r '.cost.total_cost_usd'; }
get_duration() { echo "$input" | jq -r '.cost.total_duration_ms'; }
get_lines_added() { echo "$input" | jq -r '.cost.total_lines_added'; }
get_lines_removed() { echo "$input" | jq -r '.cost.total_lines_removed'; }
get_input_tokens() { echo "$input" | jq -r '.context_window.total_input_tokens'; }
get_output_tokens() { echo "$input" | jq -r '.context_window.total_output_tokens'; }
get_context_window_size() { echo "$input" | jq -r '.context_window.context_window_size'; }
```

### 6. Git-Aware Status Line Example

A more comprehensive example including git branch:

```bash
#!/bin/bash
# Read JSON input from stdin
input=$(cat)

# Extract values using jq
MODEL_DISPLAY=$(echo "$input" | jq -r '.model.display_name')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir')

# Show git branch if in a git repo
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" | 🌿 $BRANCH"
    fi
fi

echo "[$MODEL_DISPLAY] 📁 ${CURRENT_DIR##*/}$GIT_BRANCH"
```

### 7. Cost and Session Metrics

The statusline also has access to session cost/usage metrics:

| Field | Description |
|-------|-------------|
| `cost.total_cost_usd` | Total cost in USD |
| `cost.total_duration_ms` | Total session duration in milliseconds |
| `cost.total_api_duration_ms` | Total API call duration |
| `cost.total_lines_added` | Lines of code added |
| `cost.total_lines_removed` | Lines of code removed |

## Key Takeaways

1. **Custom statuslines are fully supported** via `.claude/settings.json` with `statusLine.command` configuration

2. **Context window metrics are available** in the JSON input:
   - `context_window.context_window_size` - Maximum context size
   - `context_window.current_usage` - Current turn's token usage breakdown
   - `context_window.total_input_tokens` - Cumulative input tokens
   - `context_window.total_output_tokens` - Cumulative output tokens

3. **Percentage calculation formula**:
   ```
   percent = (input_tokens + cache_creation_input_tokens + cache_read_input_tokens) * 100 / context_window_size
   ```

4. **No direct API** - Context window info is only accessible through the statusline hook, not as a standalone API

5. **Script requirements**:
   - Must be executable
   - Reads JSON from stdin
   - Outputs formatted string to stdout
   - Can use any scripting language (bash, python, node, etc.)
   - Requires `jq` for bash scripts

6. **Additional data available**:
   - Model information (id, display_name)
   - Workspace paths (current_dir, project_dir)
   - Cost metrics (USD, duration, lines changed)
   - Session metadata (session_id, transcript_path, version)

## Code Examples

### Complete Context-Aware Statusline (Bash)

```bash
#!/bin/bash
input=$(cat)

# Extract all relevant info
MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir' | xargs basename)
COST=$(echo "$input" | jq -r '.cost.total_cost_usd')
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size')
USAGE=$(echo "$input" | jq '.context_window.current_usage')

# Calculate context percentage
if [ "$USAGE" != "null" ]; then
    TOKENS=$(echo "$USAGE" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
    PERCENT=$((TOKENS * 100 / CONTEXT_SIZE))
else
    PERCENT=0
fi

# Get git branch
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    [ -n "$BRANCH" ] && GIT_BRANCH=" 🌿$BRANCH"
fi

# Format cost
COST_FMT=$(printf "%.4f" "$COST")

echo "[$MODEL] 📁$DIR$GIT_BRANCH | 💰$${COST_FMT} | 📊${PERCENT}%"
```

## Sources

- Claude Code official documentation via Context7 (websites/code_claude)
- Claude Code GitHub repository via Context7 (anthropics/claude-code)
- Awesome Claude Code community resources via Context7 (hesreallyhim/awesome-claude-code)

**Documentation URL**: https://code.claude.com/docs/en/statusline
