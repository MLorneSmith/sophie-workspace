# Command Model Optimization Guide

**Date**: 2025-09-06  
**Discovery**: Commands can specify models directly in YAML frontmatter

---

## ✅ YES - Commands Can Auto-Set Models!

Claude Code **already supports** model specification in command YAML frontmatter:

```yaml
---
description: Your command description
category: workflow
model: haiku  # This sets the model!
allowed-tools: Bash, Read
---
```

---

## Implementation: Quick Wins

### 1. Optimize Git Commands for Haiku

Edit `/git/status.md`:

```yaml
---
description: Intelligently analyze git status
category: workflow
model: haiku  # Add this line
allowed-tools: Bash(git:*), Task
---
```

Edit `/git/checkout.md`:

```yaml
---
description: Switch git branches
category: workflow  
model: haiku  # Add this line
allowed-tools: Bash(git:*)
---
```

### 2. Set Sonnet for Moderate Commands

Edit `/git/commit.md`:

```yaml
---
description: Create git commits with security checks
category: workflow
model: sonnet  # Explicit, though it's default
allowed-tools: Bash(git:*), Read, Edit, Task
---
```

### 3. Keep Opus for Complex Commands

Edit `/feature/spec.md`:

```yaml
---
description: Create comprehensive feature specification
category: feature-development
model: opus  # Complex reasoning required
allowed-tools: Write, Read, Bash
---
```

---

## Practical Implementation Script

Create a script to update all commands at once:

```bash
#!/bin/bash
# .claude/scripts/optimize-command-models.sh

# Haiku commands (simple operations)
HAIKU_COMMANDS=(
  "git/status"
  "git/checkout"
  "git/push"
  "checkpoint/list"
  "db-healthcheck"
  "dev/cleanup"
)

# Sonnet commands (moderate complexity)
SONNET_COMMANDS=(
  "git/commit"
  "code-review"
  "write-tests"
  "validate-and-fix"
  "pr"
  "test"
)

# Opus commands (high complexity)
OPUS_COMMANDS=(
  "feature/spec"
  "feature/plan"
  "feature/decompose"
  "debug-issue"
  "cicd-debug"
  "research"
)

# Function to add model to command
add_model() {
  local file=$1
  local model=$2
  
  if [ -f "$file" ]; then
    # Check if model already exists
    if ! grep -q "^model:" "$file"; then
      # Add model after category line
      sed -i '/^category:/a model: '"$model" "$file"
      echo "✅ Added model: $model to $file"
    else
      echo "⚠️  Model already set in $file"
    fi
  fi
}

# Process commands
for cmd in "${HAIKU_COMMANDS[@]}"; do
  add_model ".claude/commands/$cmd.md" "haiku"
done

for cmd in "${SONNET_COMMANDS[@]}"; do
  add_model ".claude/commands/$cmd.md" "sonnet"
done

for cmd in "${OPUS_COMMANDS[@]}"; do
  add_model ".claude/commands/$cmd.md" "opus"
done

echo "✅ Command model optimization complete!"
```

---

## Creating Wrapper Commands

You can also create wrapper commands that chain operations:

### Example: `/git/quick-status`

Create `.claude/commands/git/quick-status.md`:

```yaml
---
description: Ultra-fast git status using Haiku
category: workflow
model: haiku  # Force Haiku for speed
allowed-tools: Bash(git:*)
---

Run a quick git status check with minimal analysis.

Just show:
- Current branch
- Number of modified files
- Number of untracked files
- Whether ready to push/pull

Keep output to 3-4 lines maximum.
```

### Example: `/debug/quick`

Create `.claude/commands/debug/quick.md`:

```yaml
---
description: Quick debug check with Haiku
category: debugging
model: haiku
allowed-tools: Bash, Read, Grep
---

Perform a quick debug check:
1. Check if server is running
2. Look for obvious errors in logs
3. Report status in 2-3 lines
```

### Example: `/debug/deep`

Create `.claude/commands/debug/deep.md`:

```yaml
---
description: Deep debug analysis with Opus
category: debugging
model: opus
allowed-tools: "*"
---

Perform comprehensive debugging:
1. Analyze all error logs
2. Check related systems
3. Identify root causes
4. Suggest fixes
```

---

## Immediate Actions

### 1. Update Existing Commands (5 minutes)

```bash
# Add model to git/status.md
echo "model: haiku" >> .claude/commands/git/status.md

# Add model to git/checkout.md
echo "model: haiku" >> .claude/commands/git/checkout.md

# Test it
claude-code /git/status
```

### 2. Create Aliases for Model-Specific Versions

```bash
# Create haiku version of commands
cp .claude/commands/test.md .claude/commands/test-quick.md
# Edit test-quick.md to add: model: haiku

# Create opus version for complex debugging
cp .claude/commands/debug-issue.md .claude/commands/debug-deep.md
# Edit debug-deep.md to add: model: opus
```

### 3. Monitor Performance

Track which commands benefit most:

```bash
# Before optimization
time claude-code /git/status

# After adding model: haiku
time claude-code /git/status

# Compare response times
```

---

## Benefits of This Approach

### ✅ Advantages

1. **No complex implementation needed** - Just YAML config
2. **Immediate results** - Works today
3. **Transparent** - Model specified in command file
4. **Flexible** - Can have multiple versions of commands
5. **Team-friendly** - Changes tracked in git

### ⚠️ Considerations

1. Still operates within rate limits
2. Model set per command, not dynamically
3. Need to edit files to change models
4. No automatic fallback (but command can use Task tool)

---

## Command Organization Strategy

### Pattern 1: Model Suffix

```text
/debug         # Default (Sonnet)
/debug-quick   # Haiku version
/debug-deep    # Opus version
```

### Pattern 2: Separate Directories

```text
/quick/status  # All quick commands use Haiku
/deep/analyze  # All deep commands use Opus
/git/status    # Standard commands use optimal model
```

### Pattern 3: Explicit in Name

```text
/h-git-status  # h prefix = Haiku
/s-test        # s prefix = Sonnet
/o-debug       # o prefix = Opus
```

---

## Summary

**Yes, you can automatically set models for commands!**

The `model:` field in command YAML frontmatter does exactly what you want:

- Command runs with specified model
- No manual `/model` switching needed
- Works within existing Claude Code architecture

**Start today by adding `model: haiku` to your git commands for immediate optimization.**
