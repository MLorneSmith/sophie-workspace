# Service Accounts Reference

**Tags:** `reference`, `services`
**Updated:** 2026-02-02

---

## Active Services

### OpenAI
- **Purpose:** LLM scoring, sub-agent coding
- **Key Location:** `OPENAI_API_KEY` env var
- **Used By:** Feed monitor scoring, GPT sub-agents
- **Models:** GPT-4o-mini (scoring), GPT-5.2 (coding)

### Anthropic
- **Purpose:** Sophie's main model
- **Key Location:** Clawdbot config
- **Models:** Claude Opus 4.5

### Brave Search
- **Purpose:** Web search
- **Key Location:** Clawdbot config
- **Rate Limit:** Free tier limits apply

### Todoist
- **Purpose:** Mike's task management
- **Key Location:** `TODOIST_API_TOKEN` env var
- **Access:** Full read/write

### Gmail (via gog)
- **Purpose:** Email sending, morning briefs
- **Auth:** OAuth via gog CLI
- **Account:** msmith@slideheroes.com

### Google Calendar (via gog)
- **Purpose:** Event management
- **Auth:** OAuth via gog CLI

---

## SlideHeroes Services

### Mission Control
- **URL:** http://localhost:3001
- **Purpose:** Task management, docs, activity log
- **Database:** SQLite (local)

### Feed Monitor
- **URL:** http://localhost:3001/api/feed-monitor
- **Purpose:** RSS aggregation, article scoring
- **Database:** SQLite (shared with MC)

---

## Pending Setup

### Notion
- **Purpose:** Mike's second brain
- **Status:** API key not configured
- **Action:** Mike to set up integration

### Ragie
- **Purpose:** Presentation import/RAG
- **Status:** Spec exists (S1766), not implemented
- **Action:** Week 3 of MVP roadmap

### Stripe
- **Purpose:** Billing
- **Status:** Integration exists, needs product config
- **Action:** Week 4 of MVP roadmap

---

## API Endpoints Quick Reference

### Mission Control
```
GET  /api/v1/tasks              # List tasks
POST /api/v1/tasks              # Create task
PATCH /api/v1/tasks/:id         # Update task
PATCH /api/v1/tasks/:id/assign  # Assign to Sophie
PATCH /api/v1/tasks/:id/complete # Mark done
GET  /api/v1/boards             # List boards
```

### Feed Monitor
```
POST /api/feed-monitor/fetch    # Fetch all feeds
GET  /api/feed-monitor/candidates # Ranked articles
GET  /api/feed-monitor/use-cases # AI agent use cases
```

---

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=file:./dev.db
OPENAI_API_KEY=sk-...
```

Available globally:
```
TODOIST_API_TOKEN=...
GOG_ACCOUNT=msmith@slideheroes.com
```
