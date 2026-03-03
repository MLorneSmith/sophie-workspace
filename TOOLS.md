# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Mission Control Activity Logging

Log activity to Mission Control after completing significant work:

```bash
~/clawd/scripts/log-activity.sh <action> <summary> [details]
```

**Actions to use:**
- `task_complete` — finished a task or sub-agent work
- `feature_shipped` — merged a feature/PR
- `research` — completed research or analysis
- `fix` — bug fix or issue resolution
- `commit` — (auto-logged by git hook)

**Examples:**
```bash
~/clawd/scripts/log-activity.sh "task_complete" "Built newsletter digest feature" "PR #11 merged"
~/clawd/scripts/log-activity.sh "research" "Analyzed competitor pricing" "5 competitors reviewed"
```

**When to log:**
- After merging PRs
- After completing sub-agent tasks
- After significant research/analysis
- After fixing issues

---

---

## Mission Control Task Blocking

To mark a task as blocked, set the `blockedReason` field (not a separate status):

```bash
# Block a task
curl -X PATCH "https://internal.slideheroes.com/api/v1/tasks/{id}" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"blockedReason": "Reason why blocked", "activity_note": "Optional activity log"}'

# Unblock a task (set blockedReason to null)
curl -X PATCH "https://internal.slideheroes.com/api/v1/tasks/{id}" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"blockedReason": null, "activity_note": "Unblocked - reason"}'
```

**Valid TaskStatus values:** `backlog`, `in_progress`, `in_review`, `done`
**Blocking:** Use `blockedReason` field — if set, task is considered blocked regardless of status.

---

---

## Deployment Reminders

### slideheroes-internal-tools
**Always push after committing!** Deployed on AWS EC2 (not Railway). Push to origin triggers deployment.

After any work on this repo:
```bash
git push origin main
```

Sub-agents often forget this step — if spawning a task for this repo, remind them to push or verify yourself after.

---

## 2025slideheroes Fork PR Workflow

The `gh pr create` CLI fails for same-org forks. Use GraphQL instead:

```bash
cd ~/2025slideheroes-sophie

# Get repo IDs (one-time lookup)
# Upstream: R_kgDON3X_Ow (slideheroes/2025slideheroes)
# Fork: R_kgDORH2m4g (slideheroes/2025slideheroes-sophie)

# Create PR via GraphQL
gh api graphql -f query='
mutation CreatePR {
  createPullRequest(input: {
    repositoryId: "R_kgDON3X_Ow"
    baseRefName: "dev"
    headRefName: "<your-branch-name>"
    headRepositoryId: "R_kgDORH2m4g"
    title: "<title>"
    body: "<body>"
  }) {
    pullRequest { url number }
  }
}'
```

**Why:** Same-org forks confuse `gh pr create` because `--head owner:branch` is ambiguous when both repos share the same owner. GraphQL's `headRepositoryId` explicitly identifies the fork.

---

## Cloudflare Workers

- **Wrangler auth:** Set `CLOUDFLARE_API_TOKEN` env var (from `~/.openclaw/.secrets.env`)
- **Feedback Worker:** `slideheroes-feedback.slideheroes.workers.dev` — HMAC-signed feedback URLs for morning briefing
- **Feedback secret:** `FEEDBACK_SECRET` in `~/.openclaw/.secrets.env` — used by `generate-feedback-urls.sh` and the worker
- **⚠️ .env parsing:** Always use `tr -d '\r\n'` when reading from `.env` files — carriage returns break auth tokens

---

## ZAI/GLM — Coding Plan Endpoint

**Mike's subscription is the Coding Plan.** The API endpoint is DIFFERENT from the regular API:
- ❌ Regular: `https://api.z.ai/api/paas/v4/`
- ✅ Coding Plan: `https://api.z.ai/api/coding/paas/v4/`

Configured in `openclaw.json` → `models.providers.zai.baseUrl`

---

## Rabbit Pipeline Status

Check the full Neo + Rabbit Plan pipeline at a glance:

```bash
python3 ~/clawd/scripts/neo-loop/rabbit-status.py
```

Shows: plan-me issues, in-progress issues, open PRs, CI status, spawn queue, active ACP sessions, cooldowns, and recent completions.

---

## Neo Loop Scripts

All in `~/clawd/scripts/neo-loop/`:

| Script | Cron | Purpose |
|--------|------|---------|
| `neo-issue-pickup.py` | */10 8-23 | Detects plan-me issues with CR plans → queues Neo |
| `neo-review-responder.py` | */10 8-23 | Detects PR review comments → queues Neo |
| `neo-ci-fix.py` | */10 8-23 | Detects CI failures → queues Neo |
| `neo-mc-pickup.py` | */30 8-23 | Picks up MC tasks assigned to Neo |
| `neo-nightly-backlog.py` | 0 23 | Nightly backlog task |
| `neo-pr-merge-sync.py` | */10 8-23 | Syncs MC task status on PR merge |
| `process-spawn-queue.py` | */10 8-23 | Processes spawn queue → launches ACP sessions |
| `cleanup-stale-locks.py` | */15 8-23 | Clears stale active-run locks (45 min expiry) |
| `neo-healthcheck.py` | Manual/heartbeat | Validates pipeline health (D-Bus, labels, locks, queue) |
| `rabbit-status.py` | Manual | Pipeline dashboard |

---

---

## Structured Data Store (SQLite)

**DB:** `~/clawd/data/structured.db`
**Script:** `python3 ~/clawd/scripts/structured-db.py`

### When to use
Use SQLite for **precise, structured queries** — when you need exact data, not fuzzy recall.
- "What tools are we using?" → `query "SELECT name, category, status FROM tools WHERE status='active'"`
- "What decisions have we made?" → `query "SELECT topic, decision FROM decisions"`
- "Show me our competitors" → `query "SELECT * FROM competitive_intel"`

### Commands
```bash
python3 scripts/structured-db.py query "SQL"          # Run any SELECT/INSERT/UPDATE
python3 scripts/structured-db.py insert TABLE 'JSON'   # Insert a row
python3 scripts/structured-db.py stats                  # Table sizes
```

### Tables
| Table | Contents |
|-------|----------|
| `tools` | SaaS tools & services (name, category, status, url, cost, notes) |
| `contacts` | People & orgs (name, role, org, email, notes) |
| `decisions` | Key decisions with rationale (topic, decision, rationale, status) |
| `projects` | Project metadata (name, repo, status, tech_stack) |
| `competitive_intel` | Competitor data (company, product, pricing, strengths, weaknesses) |
| `api_endpoints` | API docs (service, path, method, auth_required, description) |

### Keep it updated
When Mike mentions a new tool, contact, decision, or competitor → add it to SQLite.
When a decision is superseded → update the old row's status and add the new one.

---

## Memory System Overview

Sophie has three memory layers — use the right one:

| Need | Layer | How |
|------|-------|-----|
| "What does Mike prefer?" | **Mem0** (auto-recall) | Already injected in `<relevant-memories>`. Or `memory_search("query")` |
| "What tools do we use?" | **SQLite** | `python3 scripts/structured-db.py query "SQL"` |
| "What went wrong last time?" | **Learnings** | Read `learnings/LEARNINGS.md` |
| "What happened yesterday?" | **Daily logs** | Read `memory/YYYY-MM-DD.md` |

---

Add whatever helps you do your job. This is your cheat sheet.
