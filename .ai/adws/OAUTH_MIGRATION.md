# ADW OAuth Migration Guide

## Overview

This document details all changes needed to migrate ADW from `ANTHROPIC_API_KEY` to `CLAUDE_CODE_OAUTH_TOKEN` for Claude Max plan users.

## Background

- **Problem**: ADW was using `ANTHROPIC_API_KEY` but Max plan users authenticate via OAuth
- **Solution**: Use `CLAUDE_CODE_OAUTH_TOKEN` environment variable
- **Critical**: `ANTHROPIC_API_KEY` takes precedence over OAuth - it must be removed/commented out

## Prerequisites

Generate your OAuth token:
```bash
claude setup-token
```

This outputs a token like `sk-ant-oat01-...`

---

## Required Changes

### 1. Environment File (`.env`)

**Comment out ANTHROPIC_API_KEY** - it blocks OAuth authentication:

```bash
# Before
ANTHROPIC_API_KEY=sk-ant-api03-...

# After
# NOTE: Commented out to allow CLAUDE_CODE_OAUTH_TOKEN to work for ADW (Max plan)
# ANTHROPIC_API_KEY takes precedence and blocks OAuth authentication
# ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Add OAuth token**:
```bash
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-your-token-here
```

---

### 2. Core Module: `adw_modules/utils.py`

**Location**: Lines 171-177

**Change**: Replace `ANTHROPIC_API_KEY` with `CLAUDE_CODE_OAUTH_TOKEN` in `get_safe_subprocess_env()`

```python
# Before
safe_env_vars = {
    # Anthropic Configuration (required)
    "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),

    # GitHub Configuration (optional)

# After
safe_env_vars = {
    # Claude Code OAuth Configuration (required for Max plan)
    # Use CLAUDE_CODE_OAUTH_TOKEN for Max subscription authentication
    # Generate with: claude setup-token
    "CLAUDE_CODE_OAUTH_TOKEN": os.getenv("CLAUDE_CODE_OAUTH_TOKEN"),

    # GitHub Configuration (optional)
```

---

### 3. Core Module: `adw_modules/agent.py`

**Location**: Lines 91-106

**Change**: Filter out `[SandboxDebug]` messages in `parse_jsonl_output()`

```python
# Before
try:
    with open(output_file, "r") as f:
        # Read all lines and parse each as JSON
        messages = [json.loads(line) for line in f if line.strip()]

# After
try:
    with open(output_file, "r") as f:
        # Read all lines and parse each as JSON
        # Filter out non-JSON lines (like [SandboxDebug] messages)
        messages = []
        for line in f:
            line = line.strip()
            if line and line.startswith("{"):
                try:
                    messages.append(json.loads(line))
                except json.JSONDecodeError:
                    # Skip lines that look like JSON but aren't valid
                    continue
```

---

### 4. ADW Scripts - Environment Variable Checks

Update `required_vars` in the `check_env_vars()` function for each script:

| File | Line | Change |
|------|------|--------|
| `adw_plan.py` | ~60 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |
| `adw_build.py` | ~43 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |
| `adw_test.py` | ~72 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |
| `adw_review.py` | ~72 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |
| `adw_document.py` | ~47 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |
| `adw_patch.py` | ~67 | `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"` |

**Example change**:
```python
# Before
required_vars = [
    "ANTHROPIC_API_KEY",
    "CLAUDE_CODE_PATH",
]

# After
required_vars = [
    "CLAUDE_CODE_OAUTH_TOKEN",
    "CLAUDE_CODE_PATH",
]
```

---

### 5. Test Files

#### `adw_tests/health_check.py`

**Multiple locations** - use find/replace for `"ANTHROPIC_API_KEY"` → `"CLAUDE_CODE_OAUTH_TOKEN"`:

- Line ~69: `required_vars` dictionary key
- Line ~300: `os.getenv()` check
- Line ~310: Error details message
- Line ~373: Error message check

#### `adw_tests/test_adw_test_e2e.py`

**Line ~99**: Update warning message
```python
# Before
if not os.getenv("ANTHROPIC_API_KEY"):
    print("⚠️  Warning: ANTHROPIC_API_KEY not set...")

# After
if not os.getenv("CLAUDE_CODE_OAUTH_TOKEN"):
    print("⚠️  Warning: CLAUDE_CODE_OAUTH_TOKEN not set...")
```

#### `adw_tests/sandbox_poc.py`

**Lines ~35, ~39**: Update E2B sandbox environment
```python
# Before
api_key = os.getenv("ANTHROPIC_API_KEY", "")
with Sandbox(envs={"ANTHROPIC_API_KEY": api_key}) as sandbox:

# After
oauth_token = os.getenv("CLAUDE_CODE_OAUTH_TOKEN", "")
with Sandbox(envs={"CLAUDE_CODE_OAUTH_TOKEN": oauth_token}) as sandbox:
```

---

### 6. Trigger Scripts

#### `adw_triggers/trigger_webhook.py`

**Line ~17**: Update docstring
```python
# Before
- All adw_plan_build.py requirements (GITHUB_PAT, ANTHROPIC_API_KEY, etc.)

# After
- All adw_plan_build.py requirements (GITHUB_PAT, CLAUDE_CODE_OAUTH_TOKEN, etc.)
```

---

### 7. Documentation

#### `README.md`

**Lines ~35-40**: Update Quick Start environment variables
```bash
# Before
export ANTHROPIC_API_KEY="sk-ant-xxxx..."

# After
# For Claude Max plan users, generate OAuth token with: claude setup-token
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-xxxx..."
```

**Line ~443**: Update troubleshooting grep command
```bash
# Before
env | grep -E "(GITHUB|ANTHROPIC|CLAUDE)"

# After
env | grep -E "(GITHUB|CLAUDE)"
```

---

## Quick Apply Script

You can use this sed command to do a bulk replacement (review results carefully):

```bash
cd .ai/adws

# Replace in Python files
find . -name "*.py" -exec sed -i 's/"ANTHROPIC_API_KEY"/"CLAUDE_CODE_OAUTH_TOKEN"/g' {} \;

# Update README
sed -i 's/ANTHROPIC_API_KEY/CLAUDE_CODE_OAUTH_TOKEN/g' README.md
```

**Note**: This bulk replacement won't handle the more complex changes in `utils.py` and `agent.py` - those must be done manually.

---

## Verification

After applying changes, verify:

1. **Environment check**:
   ```bash
   grep "CLAUDE_CODE_OAUTH_TOKEN" .env
   grep "^ANTHROPIC_API_KEY" .env  # Should return nothing (commented out)
   ```

2. **Code check**:
   ```bash
   grep -r "ANTHROPIC_API_KEY" --include="*.py" .  # Should only find comments
   ```

3. **Test run**:
   ```bash
   set -a && source .env && set +a
   CLAUDE_CODE_PATH=/path/to/claude uv run adw_plan.py <issue-number>
   ```

---

## Known Issues

1. **Token Expiration**: OAuth tokens may expire. Monitor for auth errors.
2. **Sandbox Debug Messages**: Claude Code writes `[SandboxDebug]` to stdout, breaking JSONL parsing. The `agent.py` fix filters these out.
3. **Git Operations**: ADW can disrupt uncommitted changes in the working directory. Always commit your work before running ADW.

---

## References

- GitHub Issue #5143: `CLAUDE_CODE_OAUTH_TOKEN` ignored in print mode (v1.0.67+)
- GitHub Issue #1454: Machine to Machine Authentication for Claude Max
- Claude Code version tested: 2.0.47
