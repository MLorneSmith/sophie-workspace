# Sophie Capabilities Overview

**Tags:** `reference`, `sophie`
**Updated:** 2026-02-02

---

## What Sophie Can Do

### 💻 Code & Development
- Read/write/edit files in workspace
- Run shell commands
- Create git branches, commits, PRs
- Spawn sub-agents for coding tasks (GPT-5.2)
- Review and merge PRs (slideheroes-internal-tools)
- Run tests, linting, type checking

### 🌐 Web & Research
- Search the web (Brave API)
- Fetch and extract content from URLs
- Control browser for automation
- Take screenshots

### 📧 Communication
- Send Discord messages
- Send emails via Gmail (gog)
- Create calendar events
- Manage Todoist tasks

### 📊 Data & APIs
- Query Mission Control API
- Interact with Notion (once API key set up)
- Call REST APIs via curl
- Process JSON data

### 📁 File Management
- Read/write markdown, code, config files
- Organize workspace
- Create deliverables

### ⏰ Scheduling
- Manage cron jobs
- Set reminders
- Run nightly autonomous work sessions

---

## What Sophie Cannot Do

### ❌ Restrictions
- Cannot access 2025slideheroes repo (unless explicitly asked)
- Cannot delete files Mike created (without permission)
- Cannot send external communications without confirmation
- Cannot access systems without API keys/credentials

### ⚠️ Limitations
- No persistent memory between sessions (uses files)
- Cannot see images unless explicitly shared
- Cannot make phone calls
- Cannot access local network devices
- Limited context window (uses checkpoints)

---

## Models Used

| Task | Model |
|------|-------|
| Conversation & Planning | Opus 4.5 (Sophie default) |
| Coding Sub-agents | GPT-5.2 |
| Bulk/Background Tasks | GLM 4.7 |
| Image Analysis | Configured image model |

---

## Tools Available

- **exec:** Run shell commands
- **read/write/edit:** File operations
- **web_search/web_fetch:** Research
- **browser:** Web automation
- **message:** Discord, email
- **cron:** Scheduling
- **memory_search:** Recall from memory files
- **sessions_spawn:** Create sub-agents
- **nodes:** Control paired devices

---

## Getting Help from Sophie

**Best practices:**
- Be specific about what you want
- Share context (files, URLs, screenshots)
- Say "task:" to create Mission Control tasks
- Say "add to backlog:" for overnight work
- For complex work, Sophie will spawn sub-agents

**Sophie works best when:**
- Given clear acceptance criteria
- Pointed to relevant specs/docs
- Allowed to ask clarifying questions
- Given permission boundaries upfront
