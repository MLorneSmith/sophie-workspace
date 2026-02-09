# Sophie's Tooling & Skills — Feb 8, 2026

## Core Platform

- **OpenClaw v2026.2.6-3** — Agent runtime (migrated from clawdbot)
- **Model:** Opus 4.6 (main session — conversation, planning, research)
- **Server:** AWS EC2, Ubuntu, Node 22.22

## Channels

- **Discord** — Primary (private guild: #general, #inbox-sophie, #capture)
- **Telegram** — Enabled
- **WhatsApp** — Enabled (DM allowlist)
- **Slack** — Enabled (mention-only)

## Coding Sub-Agent

- **Codex CLI v0.94.0** (GPT-5.2-codex) — Primary coding agent
- **Auth:** API key (Todoist task to switch to ChatGPT OAuth)
- **Config:** `~/.codex/config.toml` — workspace-write sandbox, on-failure approval
- **Project context:** `AGENTS.md` in 2025slideheroes-sophie (ported from CLAUDE.md)
- **Wrapper scripts** (`.ai/bin/codex/`):
  - `implement <issue#>` — Full GitHub issue → implementation pipeline
  - `codecheck` — typecheck + lint + format
  - `commit` — conventional commits with traceability
  - `review <issue#>` — review against spec

## Sub-Agent Models

- **GPT-5.2 Codex** — Coding implementation
- **GLM 4.7** — Bulk/slow tasks (batch processing, research summaries, scheduled jobs)
- **Opus 4.6** — Complex reasoning, planning (spawned sub-agents)

## Built-in OpenClaw Tools

- `exec` / `process` — Shell commands, background processes, PTY
- `read` / `write` / `edit` — File operations
- `web_search` / `web_fetch` — Brave search + URL fetching
- `browser` — Headless Chrome automation
- `message` — Cross-channel messaging (Discord, Telegram, WhatsApp, Slack)
- `cron` — Scheduled jobs & reminders
- `memory_search` / `memory_get` — Semantic memory search
- `sessions_spawn` / `sessions_send` — Sub-agent orchestration
- `tts` — Text-to-speech
- `image` — Vision analysis
- `canvas` — UI rendering
- `nodes` — Device control (paired nodes)
- `gateway` — Self-management, config, updates

## Installed Skills (OpenClaw — `~/.clawdbot/skills/`)

| Skill | Purpose |
| --- | --- |
| agent-browser | Browser automation CLI |
| alpha-orchestrator | Spec orchestration (Mike-only, local) |
| blog-post-optimizer | SEO + readability scoring |
| blog-writing | Two-stage blog workflow |
| brainstorming | Pre-creative exploration |
| context7 | Library docs from GitHub repos |
| email-marketing | Andre Chaperon methodology + 118 examples |
| find-skills | Discover installable skills |
| frontend-design | Production-grade UI design |
| haircut-booking | Perfection Grooming booking |
| perplexity-research | AI-powered web research |
| seo-audit | Technical SEO diagnosis |
| tailwind-design-system | Design system patterns |
| vercel-react-best-practices | React/Next.js performance |

## Built-in Skills (OpenClaw package)

| Skill | Purpose |
| --- | --- |
| bluebubbles | iMessage channel plugin |
| coding-agent | Run Codex/Claude Code via PTY |
| github | `gh` CLI integration |
| gog | Google Workspace (Gmail, Calendar, Drive) |
| notion | Notion API |
| openai-image-gen | Image generation |
| openai-whisper-api | Audio transcription |
| skill-creator | Build new skills |
| slack | Slack control |
| tmux | Terminal session control |
| weather | Weather forecasts |
| qmd | Local markdown search |

## Project Research Tools (`.ai/bin/` in 2025slideheroes)

- **context7** — Library docs (search + get-context)
- **perplexity** — AI web search (chat + search)
- **exa** — Web search, similarity, content extraction

## External Integrations

| Service | How |
| --- | --- |
| **GitHub** | `gh` CLI, PR workflows, issue management |
| **Google Workspace** | `gog` CLI — Gmail (sophie@slideheroes.com), Calendar |
| **Notion** | API — Resources + Best Practices databases |
| **Todoist** | REST API — Task management for Mike |
| **AWS** | CLI — Cost Explorer for morning briefs |
| **Brave Search** | API — Web search |
| **Twitter/X** | API keys configured (read/write) |
| **Mission Control** | localhost:3001 — Tasks, feeds, practices, council |

## Scheduled Jobs (Cron)

| Time (ET) | Job | Target |
| --- | --- | --- |
| 11:00 PM | Nightly Backlog Work | Isolated (2hr cap) |
| 2:00 AM | Nightly New Initiatives | Isolated (2hr cap) |
| 4:00 AM | qmd Index Refresh | Isolated |
| 5:00 AM | Workspace Git Backup | Main |
| 6:00 AM | OpenClaw Auto-Update | Main |
| 6:30 AM | Feed Monitor Refresh | Isolated |
| 7:00 AM | Morning Brief | Isolated |
| 1st of month 9:00 AM | Cineplex Movie Pick | Isolated |
| 1st of month 9:30 AM | Date Night Pick | Isolated |

## Memory System

- **MEMORY.md** — Long-term curated memory (main session only)
- **memory/YYYY-MM-DD.md** — Daily logs
- **state/current.md** — Current task state (survives compaction)
- **Semantic search** — 138 files, 1422 chunks, OpenAI embeddings
- **Session memory** — Indexed across 90 sessions

## Repos Sophie Works On

- **slideheroes-internal-tools** — Full commit/merge authority
- **2025slideheroes-sophie** (fork) — Feature branches → PRs to upstream dev
- **~/clawd** — Sophie's workspace (backed up to GitHub nightly)
