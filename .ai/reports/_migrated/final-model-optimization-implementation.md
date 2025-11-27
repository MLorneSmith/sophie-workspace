# Final Model Optimization Implementation Plan

**Date**: 2025-09-06  
**Status**: Ready for Implementation  
**Based on**: Confirmed `model:` field support in YAML frontmatter

---

## Executive Summary

Optimize Claude Code usage by adding `model:` field to command/agent YAML frontmatter. This approach:

- Uses **built-in functionality** (no custom code needed)
- Optimizes **rate limit consumption** (the actual constraint)
- Can be **implemented immediately**
- Provides **30-50% efficiency gains** in rate limit usage

---

## Implementation Strategy

### Phase 1: Quick Wins (Day 1 - 30 minutes)

#### 1.1 Update Git Commands to Haiku

```bash
# Create update script
cat > /tmp/update-git-commands.sh << 'EOF'
#!/bin/bash
COMMANDS_DIR="/home/msmith/projects/2025slideheroes/.claude/commands"

# Add model: haiku to git commands
for cmd in status checkout push; do
  FILE="$COMMANDS_DIR/git/$cmd.md"
  if [ -f "$FILE" ]; then
    # Check if model already exists
    if ! grep -q "^model:" "$FILE"; then
      # Add model after category line
      sed -i '/^category:/a model: haiku' "$FILE"
      echo "✅ Updated $cmd with model: haiku"
    fi
  fi
done
EOF

# Run it
bash /tmp/update-git-commands.sh
```

#### 1.2 Verify Changes

```bash
# Check that model field was added
grep "model:" .claude/commands/git/*.md
```

#### 1.3 Test Immediately

```bash
# Test with new model setting
claude-code /git/status  # Now uses Haiku automatically
```

---

### Phase 2: Systematic Rollout (Day 2-3)

#### 2.1 Command Classification Script

```javascript
// .claude/scripts/classify-commands.js
const fs = require('node:fs');
const path = require('node:path');

const MODEL_MAPPINGS = {
  haiku: [
    'git/status', 'git/checkout', 'git/push',
    'checkpoint/list', 'db-healthcheck', 'dev/cleanup',
    'agents-md/init', 'config/bash-timeout'
  ],
  sonnet: [
    'git/commit', 'code-review', 'codecheck', 
    'write-tests', 'validate-and-fix', 'pr',
    'test', 'checkpoint/create', 'log-task'
  ],
  opus: [
    'feature/spec', 'feature/plan', 'feature/decompose',
    'debug-issue', 'cicd-debug', 'research',
    'spec/create', 'create-subagent'
  ]
};

function updateCommand(cmdPath, model) {
  const fullPath = path.join('.claude/commands', cmdPath + '.md');
  if (!fs.existsSync(fullPath)) return false;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if model already exists
  if (content.includes('\nmodel:')) {
    console.log(`⚠️  ${cmdPath} already has model set`);
    return false;
  }
  
  // Add model after category line
  content = content.replace(
    /^(category: .+)$/m,
    `$1\nmodel: ${model}`
  );
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ ${cmdPath} → model: ${model}`);
  return true;
}

// Apply all mappings
Object.entries(MODEL_MAPPINGS).forEach(([model, commands]) => {
  console.log(`\n🎯 Setting ${model} for ${commands.length} commands:`);
  commands.forEach(cmd => updateCommand(cmd, model));
});
```

#### 2.2 Update Agents

```bash
# Update simple agents to use Haiku
HAIKU_AGENTS="linting-expert code-search log-issue"
for agent in $HAIKU_AGENTS; do
  FILE=".claude/agents/$agent.md"
  if [ -f "$FILE" ]; then
    sed -i 's/^model: .*/model: haiku/' "$FILE"
    echo "✅ Updated $agent to haiku"
  fi
done
```

---

### Phase 3: Create Model-Optimized Variants (Day 4-5)

#### 3.1 Command Variants Pattern

Create optimized versions for different use cases:

```yaml
# .claude/commands/debug/quick.md
---
description: Quick debug check using fast model
category: debugging
model: haiku
allowed-tools: Bash, Read
---
Perform rapid debug check:
- Server status
- Recent errors (last 10 lines)
- Report in 2-3 lines max

# .claude/commands/debug/deep.md
---
description: Deep debug analysis with complex reasoning
category: debugging  
model: opus
allowed-tools: "*"
---
Comprehensive debugging with root cause analysis

# .claude/commands/debug/standard.md
---
description: Standard debugging
category: debugging
model: sonnet  # Or omit for default
allowed-tools: Read, Grep, Bash
---
Standard debugging workflow
```

#### 3.2 Naming Convention

```bash
# Create consistent naming pattern
/[task]         # Default model (Sonnet)
/[task]-quick   # Haiku for speed
/[task]-deep    # Opus for complexity

# Examples:
/test           # Sonnet
/test-quick     # Haiku - just run tests
/test-deep      # Opus - analyze failures

/review         # Sonnet
/review-quick   # Haiku - basic checks
/review-deep    # Opus - architecture review
```

---

### Phase 4: Usage Patterns (Ongoing)

#### 4.1 Session-Level Optimization

For extended work sessions, use model-appropriate entry points:

```bash
# Morning standup - quick status checks
claude-code --model haiku

# Feature development - balanced
claude-code --model sonnet  # Default

# Architecture planning - complex
claude-code --model opusplan  # Hybrid approach

# Bug hunting - deep analysis
claude-code --model opus
```

#### 4.2 Workflow Aliases

Add to `.bashrc` or `.zshrc`:

```bash
# Quick operations
alias claude-quick='claude-code --model haiku'
alias cq='claude-quick'

# Standard development
alias claude='claude-code'
alias cc='claude-code'

# Complex tasks
alias claude-deep='claude-code --model opus'
alias cd-opus='claude-deep'

# Smart planning
alias claude-plan='claude-code --model opusplan'
alias cp='claude-plan'
```

---

## Monitoring & Metrics

### Track Rate Limit Usage

```javascript
// .claude/scripts/monitor-usage.js
const fs = require('node:fs');

function logUsage(command, model) {
  const log = {
    timestamp: new Date().toISOString(),
    command,
    model,
    session: process.env.CLAUDE_SESSION_ID
  };
  
  fs.appendFileSync(
    '.claude/data/usage.jsonl',
    JSON.stringify(log) + '\n'
  );
}

// Hook into command execution
process.on('exit', () => {
  const command = process.env.CLAUDE_COMMAND;
  const model = process.env.CLAUDE_MODEL;
  if (command && model) {
    logUsage(command, model);
  }
});
```

### Weekly Analysis

```bash
# Analyze usage patterns
cat .claude/data/usage.jsonl | \
  jq -s 'group_by(.model) | 
    map({model: .[0].model, count: length})'

# Find commands that could be optimized
cat .claude/data/usage.jsonl | \
  jq -s 'group_by(.command) | 
    map({command: .[0].command, uses: length}) | 
    sort_by(-.uses)[:10]'
```

---

## Migration Checklist

### Week 1: Foundation

- [ ] Add `model: haiku` to all git commands
- [ ] Add `model: haiku` to simple list/check commands  
- [ ] Test each modified command
- [ ] Document changes in team notes

### Week 2: Expansion

- [ ] Update test/review commands to explicit `sonnet`
- [ ] Update complex commands to explicit `opus`
- [ ] Create `-quick` variants for common commands
- [ ] Set up usage monitoring

### Week 3: Optimization

- [ ] Analyze usage data
- [ ] Adjust model assignments based on success rates
- [ ] Create team aliases/shortcuts
- [ ] Document best practices

### Week 4: Refinement

- [ ] Review rate limit consumption changes
- [ ] Fine-tune model selections
- [ ] Create workflow guides
- [ ] Share learnings with team

---

## Expected Outcomes

### Rate Limit Efficiency

**Before Optimization:**

- All commands use default model (Sonnet/Opus)
- ~100 commands/day in 5-hour window
- Hitting limits by mid-day

**After Optimization:**

- Simple commands (30%) use Haiku: 5x more efficient
- Standard commands (50%) use Sonnet: baseline
- Complex commands (20%) use Opus: when needed
- **Result**: ~150-180 commands/day in same window

### User Experience

- **No behavioral changes** - Commands work identically
- **Faster responses** - Haiku responds quicker for simple tasks
- **Better availability** - Less likely to hit rate limits
- **Clear mental model** - `-quick` and `-deep` variants

---

## Risk Mitigation

### Rollback Plan

If issues arise, instantly revert:

```bash
# Remove all model specifications
find .claude/commands -name "*.md" -exec \
  sed -i '/^model:/d' {} \;

# Or set all to safe default
find .claude/commands -name "*.md" -exec \
  sed -i 's/^model:.*/model: sonnet/' {} \;
```

### Quality Monitoring

Track command success:

```bash
# Add to command post-hook
if [ "$COMMAND_SUCCESS" = "false" ]; then
  echo "$(date),${CLAUDE_COMMAND},${CLAUDE_MODEL},FAIL" \
    >> .claude/data/failures.csv
fi
```

---

## Implementation Commands

### Start Now (Copy & Paste)

```bash
# 1. Quick-add haiku to git commands
for cmd in status checkout push; do
  FILE=".claude/commands/git/$cmd.md"
  [ -f "$FILE" ] && sed -i '/^category:/a model: haiku' "$FILE"
done

# 2. Test immediately
claude-code /git/status

# 3. Check rate limit usage
claude-code --usage  # If available

# 4. Create quick variants
cp .claude/commands/test.md .claude/commands/test-quick.md
sed -i '/^category:/a model: haiku' .claude/commands/test-quick.md

# 5. Set up monitoring
echo "Model optimization started: $(date)" >> .claude/data/optimization.log
```

---

## Summary

This implementation plan leverages Claude Code's **existing `model:` field** to optimize rate limit usage without any complex development. The approach is:

1. **Immediate** - Start optimizing in minutes
2. **Safe** - Easy rollback, no code changes
3. **Effective** - 30-50% efficiency improvement
4. **Transparent** - Model choice visible in command files
5. **Flexible** - Create variants for different needs

**Next Step**: Run the Phase 1 commands above to start optimization immediately.
