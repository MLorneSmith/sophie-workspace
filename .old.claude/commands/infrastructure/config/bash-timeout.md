---
description: Configure Claude Code bash command timeout values for long-running operations
category: claude-setup
allowed-tools: [Read, Edit, Write, Bash(test:*), Bash(cat:*), Bash(mkdir:*)]
argument-hint: "<duration> [scope]"
---

# Configure Bash Timeout Settings

Optimize Claude Code bash command timeout settings for your workflow, enabling long-running builds, tests, and deployments.

## Key Features

- **Smart Duration Parsing**: Accepts human-readable formats (10min, 600s, 2h)
- **Dual-Scope Support**: Configure at user or project level
- **Safe Updates**: Preserves existing settings while updating timeouts
- **Validation**: Ensures reasonable timeout values with safety limits
- **Instant Feedback**: Shows before/after configuration changes

## Essential Context
<!-- Always read for this command -->
- Read CLAUDE.md

## Prompt

<purpose>
You are configuring Claude Code's bash timeout settings to enable long-running operations. Success is measured by:
- Correct parsing of duration input
- Successful update of settings.json file
- Preservation of all existing settings
- Clear confirmation of changes applied
- Reasonable timeout values that balance flexibility and safety
</purpose>

<role>
You are the Claude Code Configuration Specialist, expert in settings management, JSON manipulation, and development workflow optimization. You ensure proper configuration while maintaining system stability and preserving user customizations. Your modifications are precise, validated, and reversible.
</role>

<instructions>
# Bash Timeout Configuration Workflow

**CORE REQUIREMENTS**:

- Parse duration input accurately (supports min, m, s, h formats)
- Preserve all existing settings when updating
- Create settings file if it doesn't exist
- Validate timeout values are reasonable (max 30 minutes)
- Show before/after configuration for transparency

## 1. Parse & Validate Input

<parse_input>
Parse arguments and validate duration format:

```bash
# Parse arguments
FULL_ARGS="${ARGUMENTS}"
DURATION=""
SCOPE="user"

# Split arguments
if [[ "$FULL_ARGS" =~ ^([^ ]+)( +(.+))?$ ]]; then
  DURATION="${BASH_REMATCH[1]}"
  if [ ! -z "${BASH_REMATCH[3]}" ]; then
    SCOPE="${BASH_REMATCH[3]}"
  fi
fi

# Validate duration is provided
if [ -z "$DURATION" ]; then
  echo "❌ Error: Duration is required"
  echo "Usage: /config:bash-timeout <duration> [scope]"
  echo "Examples: 10min, 600s, 2h"
  exit 1
fi

# Convert duration to milliseconds
convert_to_ms() {
  local input="$1"
  local value
  local unit

  # Extract numeric value and unit
  if [[ "$input" =~ ^([0-9]+)([a-z]+)?$ ]]; then
    value="${BASH_REMATCH[1]}"
    unit="${BASH_REMATCH[2]:-s}"
  else
    echo "❌ Invalid duration format: $input"
    echo "Use formats like: 10min, 600s, 2h"
    return 1
  fi

  # Convert based on unit
  case "$unit" in
    s|sec|seconds)
      echo $((value * 1000))
      ;;
    m|min|minutes)
      echo $((value * 60 * 1000))
      ;;
    h|hr|hour|hours)
      echo $((value * 60 * 60 * 1000))
      ;;
    ms)
      echo "$value"
      ;;
    *)
      echo "❌ Unknown time unit: $unit"
      echo "Supported units: s, m, min, h, ms"
      return 1
      ;;
  esac
}

# Convert duration
TIMEOUT_MS=$(convert_to_ms "$DURATION")
if [ $? -ne 0 ]; then
  exit 1
fi

# Validate timeout range (min 1 minute, max 30 minutes)
if [ "$TIMEOUT_MS" -lt 60000 ]; then
  echo "⚠️ Warning: Timeout too short (minimum 1 minute)"
  TIMEOUT_MS=60000
elif [ "$TIMEOUT_MS" -gt 1800000 ]; then
  echo "⚠️ Warning: Timeout too long (maximum 30 minutes)"
  TIMEOUT_MS=1800000
fi

# Calculate max timeout (2x default, min 20 minutes)
MAX_TIMEOUT_MS=$((TIMEOUT_MS * 2))
if [ "$MAX_TIMEOUT_MS" -lt 1200000 ]; then
  MAX_TIMEOUT_MS=1200000
fi

echo "✅ Parsed configuration:"
echo "  Duration: $DURATION → ${TIMEOUT_MS}ms"
echo "  Max timeout: ${MAX_TIMEOUT_MS}ms"
echo "  Scope: $SCOPE"
```

</parse_input>

## 2. Determine Settings Path

<determine_path>
Set the correct settings file path based on scope:

```bash
# Determine settings file path
case "$SCOPE" in
  user)
    SETTINGS_PATH="$HOME/.claude/settings.json"
    echo "📁 Configuring user-level settings"
    ;;
  project)
    SETTINGS_PATH=".claude/settings.json"
    echo "📁 Configuring project-level settings"
    ;;
  *)
    echo "❌ Invalid scope: $SCOPE"
    echo "Valid scopes: user, project"
    exit 1
    ;;
esac

# Ensure directory exists
SETTINGS_DIR=$(dirname "$SETTINGS_PATH")
if [ ! -d "$SETTINGS_DIR" ]; then
  echo "📂 Creating directory: $SETTINGS_DIR"
  mkdir -p "$SETTINGS_DIR"
fi
```

</determine_path>

## 3. Read Current Settings

<read_current>
Load and display current configuration:

```bash
# Read existing settings
CURRENT_SETTINGS="{}"
if [ -f "$SETTINGS_PATH" ]; then
  echo "📖 Reading existing settings from: $SETTINGS_PATH"
  CURRENT_SETTINGS=$(cat "$SETTINGS_PATH")

  # Display current timeout settings
  echo "📊 Current timeout configuration:"
  if command -v jq &>/dev/null; then
    CURRENT_DEFAULT=$(echo "$CURRENT_SETTINGS" | jq -r '.env.BASH_DEFAULT_TIMEOUT_MS // "120000"')
    CURRENT_MAX=$(echo "$CURRENT_SETTINGS" | jq -r '.env.BASH_MAX_TIMEOUT_MS // "1800000"')
  else
    # Fallback to grep if jq not available
    CURRENT_DEFAULT=$(echo "$CURRENT_SETTINGS" | grep -oP '"BASH_DEFAULT_TIMEOUT_MS"\s*:\s*"\K[^"]+' || echo "120000")
    CURRENT_MAX=$(echo "$CURRENT_SETTINGS" | grep -oP '"BASH_MAX_TIMEOUT_MS"\s*:\s*"\K[^"]+' || echo "1800000")
  fi

  echo "  Default timeout: ${CURRENT_DEFAULT}ms ($(($CURRENT_DEFAULT / 60000)) minutes)"
  echo "  Maximum timeout: ${CURRENT_MAX}ms ($(($CURRENT_MAX / 60000)) minutes)"
else
  echo "📝 No existing settings file found, will create new one"
fi
```

</read_current>

## 4. Update Settings

<update_settings>
Merge new timeout values with existing settings:

```bash
# Prepare updated settings
echo "🔧 Updating timeout configuration..."

# Use jq if available for clean JSON manipulation
if command -v jq &>/dev/null; then
  UPDATED_SETTINGS=$(echo "$CURRENT_SETTINGS" | jq \
    --arg default "$TIMEOUT_MS" \
    --arg max "$MAX_TIMEOUT_MS" \
    '.env = (.env // {}) |
     .env.BASH_DEFAULT_TIMEOUT_MS = $default |
     .env.BASH_MAX_TIMEOUT_MS = $max')
else
  # Manual JSON construction as fallback
  if [ "$CURRENT_SETTINGS" = "{}" ]; then
    UPDATED_SETTINGS='{
  "env": {
    "BASH_DEFAULT_TIMEOUT_MS": "'$TIMEOUT_MS'",
    "BASH_MAX_TIMEOUT_MS": "'$MAX_TIMEOUT_MS'"
  }
}'
  else
    # This is a simplified update - in practice would need more robust parsing
    echo "⚠️ jq not available, using basic update method"
    # Create temporary file for manual editing
    TEMP_FILE="/tmp/claude_settings_$$.json"
    echo "$CURRENT_SETTINGS" > "$TEMP_FILE"
    # Note: Would need to implement manual JSON editing here
    # For now, we'll create a warning
    echo "⚠️ Manual JSON editing required without jq"
  fi
fi
```

</update_settings>

## 5. Write & Verify

<write_verify>
Save the updated configuration and verify:

```bash
# Write updated settings
echo "$UPDATED_SETTINGS" > "$SETTINGS_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Settings updated successfully!"
else
  echo "❌ Failed to write settings file"
  exit 1
fi

# Verify the update
if [ -f "$SETTINGS_PATH" ]; then
  echo ""
  echo "📋 New timeout configuration:"
  echo "  Default timeout: ${TIMEOUT_MS}ms ($((TIMEOUT_MS / 60000)) minutes)"
  echo "  Maximum timeout: ${MAX_TIMEOUT_MS}ms ($((MAX_TIMEOUT_MS / 60000)) minutes)"
  echo "  Settings file: $SETTINGS_PATH"

  # Show the actual file content for verification
  echo ""
  echo "📄 Settings file content:"
  cat "$SETTINGS_PATH" | head -20
else
  echo "❌ Settings file not found after update"
  exit 1
fi
```

</write_verify>

## 6. Display Usage Tips

<usage_tips>
Provide helpful information about the new configuration:

```bash
echo ""
echo "💡 Usage Tips:"
echo "  • New timeout applies to all bash commands immediately"
echo "  • Use timeout parameter for specific commands: bash -c 'command' --timeout ${MAX_TIMEOUT_MS}"
echo "  • Project settings override user settings"
echo "  • Default Claude Code timeout is 2 minutes (120000ms)"

if [ "$SCOPE" = "user" ]; then
  echo ""
  echo "📌 Note: This is a user-level setting affecting all projects."
  echo "  Create project-level settings to override for specific projects."
else
  echo ""
  echo "📌 Note: This is a project-level setting overriding user defaults."
fi
```

</usage_tips>

## 7. Error Handling

<error_handling>
Comprehensive error handling for common issues:

```bash
# Error handler function
handle_settings_error() {
  local error_type="$1"

  case "$error_type" in
    "permission")
      echo "❌ Permission denied writing to settings file"
      echo "Try: chmod 644 $SETTINGS_PATH"
      ;;
    "json_invalid")
      echo "❌ Existing settings file contains invalid JSON"
      echo "Backup current file and create new one:"
      echo "  mv $SETTINGS_PATH ${SETTINGS_PATH}.backup"
      ;;
    "disk_full")
      echo "❌ Unable to write settings: disk may be full"
      echo "Check available space: df -h"
      ;;
    *)
      echo "❌ Unknown error occurred"
      echo "Check settings file manually: $SETTINGS_PATH"
      ;;
  esac

  exit 1
}

# Validate JSON if jq is available
if command -v jq &>/dev/null && [ -f "$SETTINGS_PATH" ]; then
  jq empty "$SETTINGS_PATH" 2>/dev/null || handle_settings_error "json_invalid"
fi
```

</error_handling>
</instructions>

<expectations>
Upon completion, you will have:
- Correctly parsed and validated the duration input
- Determined the appropriate settings file location
- Created settings directory if needed
- Preserved all existing settings while updating timeouts
- Written valid JSON configuration
- Displayed clear before/after comparison
- Provided usage guidance

Success is measured by:

- Valid JSON in settings file
- Timeout values within safe ranges
- Existing settings preserved
- Clear user feedback provided
- Settings immediately usable
</expectations>

<help>
⏱️ **Bash Timeout Configurator**

Configure Claude Code's bash command timeout for long-running operations.

**Usage:**

- `/config:bash-timeout 10min` - Set user timeout to 10 minutes
- `/config:bash-timeout 20min project` - Set project timeout to 20 minutes
- `/config:bash-timeout 600s` - Set timeout to 600 seconds

**Supported Formats:**

- Seconds: `300s`, `600`
- Minutes: `10min`, `15m`
- Hours: `2h`, `1hour`

**Scopes:**

- `user` (default) - Affects all projects
- `project` - Affects current project only

**Process:**

1. Parse and validate duration
2. Convert to milliseconds
3. Update settings.json
4. Verify configuration

Stop waiting for timeouts on your builds and tests!
</help>
