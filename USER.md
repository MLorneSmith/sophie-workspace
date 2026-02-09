# USER.md - About Your Human

*Learn about the person you're helping. Update this as you go.*

- **Name:** Mike
- **What to call them:** Mike
- **Pronouns:** *(optional)*
- **Timezone:** EST (America/New_York)
- **Notes:** Prefers friendly + professional tone. Default reach: Discord.

## Context

- SlideHeroes / 2025slideheroes is an active project area.
- Current focus (safe to save): retired from Mastercard; building **SlideHeroes** (https://www.slideheroes.com) and pivoting it from a course into an AI-powered SaaS product to rapidly prototype business presentations; target customers are individual consultants and small/medium consultancies.
- Background (safe to save): longtime Mastercard leader in Cyber & Intelligence Solutions / Enterprise Risk & Security; deep expertise in payments/cards, fraud/cybersecurity, identity/biometrics, strategy, M&A, standards, and device/application ecosystems (chip/contactless, mobile, wearables, POS/mPOS, IoT). Previously Mastercard Advisors (payments consulting), Lloyds Banking Group (strategy consulting), and Oliver Wyman (strategy consulting). Early career at IBM (direct marketing). Education: London Business School MBA (Strategy & Finance) and UBC B.Comm.
- Family (safe to save): wife Celine (from France); two sons - Charles ("Charlie", 18, Computer Engineering at University of Waterloo) and Zacharie ("Zach", 16, Grade 11 at Royal St George's College in Toronto).

## Preferences

- **Default model (Sophie):** Opus 4.6 (`anthropic/claude-opus-4-6`) - conversation, planning, research, complex reasoning.
- **Coding sub-agents:** GPT-5.2 Codex (`openai-codex/gpt-5.2`) - spawn sub-agents with this model for implementation work.
- **Coding fallback:** GLM 4.7 (`zai/glm-4.7`) - use if GPT-5.2 Codex fails/unavailable.
- **Web search tasks:** Spawn GLM sub-agents for search-heavy research (bulk lookups, multi-query research, competitive analysis). Quick single searches on Opus are fine; batch/bulk goes to GLM.
- **Basic/slow tasks (GLM):** Use GLM for bulk processing, scheduled background jobs, draft generation, data extraction, translation, async code review, research summaries - anything where latency doesn't matter.

## Scheduling Rules

- **No weekend work tasks** — When scheduling SlideHeroes/work tasks in Todoist, only use weekdays (Mon-Fri). Weekends are buffer time. If a work task would fall on Saturday, move to Friday. If Sunday, move to Monday. Personal tasks can be scheduled on weekends.

## Boundaries

- Default: **do not delete anything anywhere**.
- Exception: Mike pre-approves deleting **(a)** files I created, and **(b)** Clawdbot-related files, when it's clearly needed.
  - "Clawdbot-related" includes: logs; cache/temp files; generated task artifacts (screenshots, exported PDFs, audio/TTS, bundled outputs); one-off scratch scripts/notes I created; old tool outputs (snapshots/recordings) after they're no longer useful.
  - Not included: anything Mike created manually; project source code/repos (unless explicitly created as throwaway); anything in/related to **2025slideheroes**.
## Code Permissions

### 2025slideheroes
Sophie works on a **fork-based workflow**. Requires explicit approval before starting any work or creating Mission Control tasks.

**Repositories:**
- **Main repo:** `slideheroes/2025slideheroes` (upstream) — Sophie has read-only access
- **Sophie's fork:** `slideheroes/2025slideheroes-sophie` (origin) — Sophie has write access
- **Local clone:** `~/2025slideheroes-sophie`

**Workflow:**
1. Fetch latest from upstream: `git fetch upstream`
2. Create feature branch off `upstream/dev`
3. Work & commit to feature branch
4. Push to origin (fork)
5. Open PR from fork → main repo's `dev` branch
6. Mike reviews and merges

**Allowed:**
- Create feature branches off `dev`
- Commit and push to fork (origin)
- Open PRs targeting main repo's `dev`
- Read `.env.example` files (schema only, to understand available variables)

**Not allowed:**
- Push to main repo (upstream) — no write access
- Merge PRs (Mike reviews and merges)
- Delete any branches
- Read or modify `.env` files (real secrets)
- Start work without explicit approval

This permission was granted 2026-02-03.

### slideheroes-internal-tools
Sophie has **full commit/merge authority** for the `slideheroes-internal-tools` repo without per-change approval.

**Process:**
- Small fixes / iterations → review inline, commit directly to main
- Larger features → use feature branch + PR with self-review, then merge
- Keep Mike informed via clear commit messages; summaries on request

This permission was granted 2026-02-01.
