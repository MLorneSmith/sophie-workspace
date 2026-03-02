# MEMORY.md — Index & Critical Warnings

> **This file is a thin index.** Detailed memories are stored in Mem0 (semantic search) and SQLite (`~/clawd/data/structured.db`). Only keep critical warnings and structural pointers here.

## ⚠️ Critical Warnings

**ZAI/GLM Endpoint — RECURRING ISSUE**
- ✅ `https://api.z.ai/api/coding/paas/v4/` (Coding Plan)
- ❌ `https://api.z.ai/api/paas/v4/` (regular API — wrong)

## Memory Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| Mem0 (semantic) | In-memory + `memory/mem0-history.db` | Preferences, decisions, facts — auto-captured |
| SQLite (structured) | `data/structured.db` | Tools, contacts, projects, decisions, competitive intel |
| Daily logs | `memory/YYYY-MM-DD.md` | Raw session logs — processed nightly by sleep mode |
| Digests | `memory/digests/` | Auto-generated daily summaries |
| Learnings | `learnings/LEARNINGS.md` | Operational rules from mistakes |

## How to Query

- **Fuzzy/semantic:** `memory_search("topic")` — searches Mem0
- **Precise/structured:** `python3 scripts/structured-db.py query "SQL"`
- **Operational rules:** Read `learnings/LEARNINGS.md`

## Agent Fleet

| Agent | Model | Role |
|-------|-------|------|
| 🦁 Sophie | Opus 4.6 | Orchestration, conversation |
| 🧑‍💻 Neo | MiniMax M2.5 | Implementation, PRs |
| 🔍 Kvoth | MiniMax M2.5 | Research, competitive intel |
| 🎨 Michelangelo | MiniMax M2.5 | Image generation |
| ✍️ Hemingway | Opus 4.6 | Blog, email, LinkedIn, copy |
| 🚀 Viral | MiniMax M2.5 | SEO, growth, GTM |
| 💰 Scrooge | GLM 4.7 | Cost auditing |

## Archived

Detailed history moved to `memory/archive/`:
- `agent-fleet.md`, `ccproxy-setup.md`, `coderabbit-setup.md`
- `mission-control-design.md`, `platform-integrations.md`
