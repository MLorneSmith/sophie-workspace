# Agent Fleet Architecture (Feb 23 2026)

**5-agent architecture** with isolated workspaces:

| Agent | Model | Workspace | Skills | Role |
|-------|-------|-----------|--------|------|
| 🦁 **Sophie** | Opus 4.6 | `~/clawd/` | All business, content, research | Orchestration, conversation |
| 🧑‍💻 **Coder** | GLM-5 | `~/agents/coder-agent/` | coding-agent, context7, github, tailwind-* | Implementation, PRs |
| 🔍 **Research** | GLM-5 | `~/agents/research-agent/` | perplexity-research, seo-audit, stealth-browser | Competitive intel |
| 🛠️ **DevOps** | GLM-5 | `~/agents/devops-agent/` | healthcheck, github | Infrastructure |
| 🔄 **Pipeline** | GLM-5 | `~/agents/data-pipeline-agent/` | None | Data syncs, ETL |

**Agent configs:** `~/clawd/.ai/agents/*.yaml`

**Design decisions:**
- Skills symlinked from source to each agent's workspace
- Bundled OpenClaw skills (52) injected by OpenClaw — can't control
- Sophie orchestrates, specialists execute
