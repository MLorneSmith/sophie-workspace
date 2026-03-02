# Current State — Mar 01, 2026 (21:20 EST)

## Agent Fleet — ALL OPERATIONAL
| Agent | Channel | Model | Loop | Status |
|-------|---------|-------|------|--------|
| Neo 🧑‍💻 | #neo | MiniMax M2.5 | 6 detection scripts | Running |
| Kvoth 🔍 | #kvoth | MiniMax M2.5 | MC pickup hourly | Running — delivered task #659 |
| Hemingway ✍️ | #hemingway | Opus 4.6 | MC pickup 2-hourly | Running — delivered task #652 draft |
| Viral 🚀 | #viral | MiniMax M2.5 | MC pickup 2-hourly | Ready — 4 backlog tasks |
| Michelangelo 🎨 | #michelangelo | MiniMax M2.5 | MC pickup hourly | Ready — reactive |

Shared infra: `~/clawd/scripts/agent_loop/common.py` (AgentLoop class) + `process-spawn-queue.py`

## Product Pipeline
- PR #2206 (TemplateConfig) — open, CI failing (setup-deps infra issue, not code)
- Next: #2198 (5 curated templates) → #2199 (template UI) → #2200 (library nav)
- Blocked on CI fix (Mike tomorrow)

## Pending Review
- MC #669 — Review Hemingway blog draft (AI Presentation Tools Compared)
- PRs: #2206, #2196, #2195, #2194

## Blockers
- CI setup-deps failing on all PRs (dep install issue)
- GitHub PAT swap to classic token (checks:read)

## Key Files
- Agent identities: ~/clawd/agents/{neo,kvoth,hemingway,viral,michelangelo}/
- Loop scripts: ~/clawd/scripts/{agent}-loop/
- Shared infra: ~/clawd/scripts/agent_loop/
- Architecture doc: ~/clawd/plans/agent-jobs-architecture.md
