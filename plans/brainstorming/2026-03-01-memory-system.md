# Brainstorm: Sophie Memory System
**Date:** 2026-03-01
**Participants:** Mike + Sophie

## Inputs
- **Inspiration:** YouTube video on 4 OpenClaw memory methods (structured folders, memory_search, Mem0, SQLite)
- **Scope:** Sophie's own memory architecture (Sophie + all sub-agents)
- **Pain points:** Amnesia (preferences > decisions) → Bloat/cost → Sub-agent memory gap
- **Approach:** Hybrid — markdown stays human-readable, structured layer underneath
- **Sub-agents:** Scoped memory per agent role
- **Maintenance:** Zero — fully self-curating
- **Mem0:** Include, self-hosted OSS mode (keep data on EC2)

## Design Direction
- Mem0 v2 plugin (self-hosted) for conversational memory auto-capture/recall
- SQLite for structured/dense data with precise queries
- Slim down markdown files (MEMORY.md becomes thin index)
- Sophie orchestrates sub-agent memory injection at spawn time
