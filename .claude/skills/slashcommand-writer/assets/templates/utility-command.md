# Utility Command Template

Use this template for simple, direct-action commands (status checks, quick operations).

---

## Template

```markdown
---
description: <Brief description of what this command does>
model: haiku
allowed-tools: [Bash]
---

# <Command Title>

<Optional: brief description>

## Run

```bash
<command to execute>
```

## Report

<What to display to the user>
```

---

## Examples

### Docker Status

```markdown
---
description: Show status of all Docker containers
model: haiku
allowed-tools: [Bash]
---

# Docker Status

## Run

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Report

Display the container status table.
```

### Git Branch Info

```markdown
---
description: Show current git branch and recent commits
model: haiku
allowed-tools: [Bash]
---

# Branch Info

## Run

```bash
echo "Current branch: $(git branch --show-current)"
echo ""
echo "Recent commits:"
git log --oneline -5
```

## Report

Display the branch name and recent commits.
```

### Start Development Server

```markdown
---
description: Start the development server
model: haiku
allowed-tools: [Bash]
---

# Start Dev

## Run

```bash
pnpm dev
```
```

---

## Customization Points

1. **Tool Restrictions**: Keep minimal (often just `[Bash]`)
2. **Model**: Always use `haiku` for utilities
3. **Keep It Simple**: Utility commands should be < 30 lines
