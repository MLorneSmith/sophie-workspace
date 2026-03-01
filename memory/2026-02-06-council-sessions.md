# 2026-02-06 — Council Sessions Feature

*Truncated 2026-03-01 — full history in git*

## Council v1: Session Dashboard
Built lightweight dashboard to track agent sessions:
- Data: JSON file at `data/council-sessions.json`
- API: CRUD for sessions (id, agentName, label, status, task, channel)
- UI: Stats bar, cards with inline editing, quick status toggles

## Council v2: Multi-Agent Deliberation System — Planned
Mike requested sophisticated multi-agent debate system:
- 3 agents (Claude, GPT, GLM) running simultaneously
- Given topic → debate → reach agreed answer

### Architecture Decisions
- **Orchestration:** Clawdbot spawns via `sessions_spawn`, coordinates via `sessions_send`
- **Turn model:** Round-robin with synthesis phase
- **Consensus:** Voting round after synthesis

### Task Created
**#70 — Council v2: Multi-Agent Deliberation System**
4 phases: Architecture → Core Implementation → UI → Testing

### Design Questions
- Orchestration model (round-robin vs moderator vs free-form)
- Where it runs (MC backend vs Clawdbot vs hybrid)
- Consensus detection (voting vs semantic similarity vs moderator)
