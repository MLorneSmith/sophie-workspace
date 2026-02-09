# Sophie's Tools Quick Reference

**Tags:** `reference`, `sophie`, `tools`
**Updated:** 2026-02-02

---

## File Operations

| Tool | Usage |
|------|-------|
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Precise text replacement |
| `exec` | Run shell commands |

---

## Web & Research

| Tool | Usage |
|------|-------|
| `web_search` | Brave Search API |
| `web_fetch` | Fetch URL content as markdown |
| `browser` | Full browser automation |
| `image` | Analyze images with vision model |

---

## Communication

| Tool | Usage |
|------|-------|
| `message` | Send Discord/channel messages |
| `tts` | Text to speech |

### gog CLI (Google)
```bash
gog gmail send --to X --subject Y --body Z
gog gmail search 'query'
gog calendar events <cal> --from X --to Y
gog calendar create <cal> --summary X --from Y --to Z
```

---

## Task Management

### Mission Control API
```bash
# Create task
curl -X POST localhost:3001/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "...", "board_id": 1}'

# Assign to Sophie
curl -X PATCH localhost:3001/api/v1/tasks/{id}/assign

# Complete task
curl -X PATCH localhost:3001/api/v1/tasks/{id}/complete
```

### Todoist API
```bash
curl -X POST "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "...", "project_id": "..."}'
```

---

## Scheduling

| Tool | Usage |
|------|-------|
| `cron` | Manage scheduled jobs |

```bash
# List jobs
cron action=list

# Add job
cron action=add job={...}
```

---

## Memory

| Tool | Usage |
|------|-------|
| `memory_search` | Search MEMORY.md + memory/*.md |
| `memory_get` | Read snippet from memory files |

---

## Sub-Agents

| Tool | Usage |
|------|-------|
| `sessions_spawn` | Create background sub-agent |
| `sessions_list` | List active sessions |
| `sessions_history` | Get session messages |
| `sessions_send` | Send message to session |

### Spawn Example
```
sessions_spawn(
  task="Build feature X",
  model="openai-codex/gpt-5.2",
  label="feature-x-impl"
)
```

---

## Skills Available

| Skill | Trigger |
|-------|---------|
| `github` | gh CLI operations |
| `gog` | Google Workspace |
| `notion` | Notion API |
| `weather` | Weather forecasts |
| `tmux` | Terminal control |
| `agent-browser` | Browser automation |
| `frontend-design` | UI/web design |

---

## Boards (Mission Control)

| ID | Board |
|----|-------|
| 1 | Mission Control |
| 2 | SlideHeroes Product |
| 3 | Newsletter & Content |
| 4 | Infrastructure |

---

## Common Patterns

### Create + Assign Task
```bash
# Create
ID=$(curl -s -X POST localhost:3001/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"X","board_id":1}' | jq -r '.id')

# Assign
curl -X PATCH localhost:3001/api/v1/tasks/$ID/assign

# Move to up_next
curl -X PATCH localhost:3001/api/v1/tasks/$ID \
  -d '{"status":"up_next"}'
```

### Research Pattern
```
1. web_search for overview
2. web_fetch top results
3. Synthesize findings
4. Write deliverable
```

### Code Pattern
```
1. Read existing code
2. Understand patterns
3. Write changes
4. Run typecheck/lint
5. Test locally
6. Commit + PR
```
