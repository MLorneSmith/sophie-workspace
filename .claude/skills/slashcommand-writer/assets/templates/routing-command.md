# Routing Command Template

Use this template for commands that intelligently route, classify, or load context.

---

## Template

```markdown
---
description: <Brief description of what this command routes/classifies>
argument-hint: [input-to-classify]
model: haiku
allowed-tools: [Read, Grep, Glob, Bash(cat:*), Bash(grep:*)]
---

# <Command Title>

<Brief description of the routing logic>

## Usage

```bash
/<command-name> <input>
```

## Instructions

1. **Parse input**: Extract the key information from $ARGUMENTS

2. **Load configuration** (if applicable):
   ```bash
   Read: .claude/config/<config-file>.yaml
   ```

3. **Apply routing rules**:
   - Rule 1: If <condition>, then <action>
   - Rule 2: If <condition>, then <action>
   - Default: <fallback action>

4. **Return result**: Output the routing decision

## Routing Logic

| Input Pattern | Route To | Priority |
|---------------|----------|----------|
| <pattern 1> | <destination 1> | high |
| <pattern 2> | <destination 2> | medium |
| <default> | <fallback> | low |

## Output Format

```markdown
## Routing Result

**Input:** <original input>
**Matched Pattern:** <pattern that matched>
**Route:** <destination>

<Additional context if needed>
```

## Error Handling

### No Match Found

```markdown
No routing rule matched for: "<input>"

**Fallback:** <default action>

Consider adding a new rule for this pattern.
```

### Configuration Error

```markdown
Error: Could not load routing configuration

**Fallback:** Proceeding with default rules

Please check: .claude/config/<config-file>.yaml
```
```

---

## Examples

### Issue Classifier

```markdown
---
description: Classify a GitHub issue as bug, chore, or feature
argument-hint: [issue-number-or-description]
model: haiku
allowed-tools: [Read, Grep, Glob, Bash(gh *)]
---

# Issue Classifier

Classify an issue to route to the appropriate planning command.

## Instructions

1. **Fetch issue** (if number provided):
   ```bash
   gh issue view <number> --json title,body,labels
   ```

2. **Analyze content** for classification signals:
   - Bug signals: "error", "broken", "fix", "doesn't work", "crash"
   - Feature signals: "add", "new", "implement", "enhance"
   - Chore signals: "update", "refactor", "upgrade", "cleanup"

3. **Apply classification**:
   | Signal Type | Classification | Route To |
   |-------------|---------------|----------|
   | Bug signals | bug | `/diagnose` or `/bug-plan` |
   | Feature signals | feature | `/feature` |
   | Chore signals | chore | `/chore` |

4. **Report result**:
   ```markdown
   ## Classification Result

   **Issue:** #<number> - <title>
   **Type:** <bug|feature|chore>
   **Confidence:** <high|medium|low>

   **Recommended Command:** /<command>
   ```
```

---

## Customization Points

1. **Routing Rules**: Define patterns and destinations
2. **Configuration**: Use YAML for complex routing tables
3. **Fallbacks**: Always include default behavior
4. **Error Handling**: Graceful degradation when routing fails
