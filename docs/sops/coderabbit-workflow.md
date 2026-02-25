# SOP: CodeRabbit Code Review Workflow

## Overview

Two-stage code review process using CodeRabbit:
1. **Pre-commit CLI review** — Catch issues before creating PR
2. **Post-PR review** — Final review with webhook-triggered iteration

## Setup (One-Time)

### CodeRabbit Pro Account
- **Signed up as:** Sophie (`SophieLegerPA` GitHub account)
- **Cost:** $24/month (annual) or $30/month (1 seat, unlimited repos)
- **Organization:** `slideheroes`

### CLI Installation
```bash
# Install
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Authenticate (already done)
coderabbit auth login
# Opens browser → log in as Sophie → paste token back

# Verify
coderabbit auth status
```

### Webhook Integration
- **GitHub webhook:** `https://ip-172-31-1-223.tail952490.ts.net/hooks/github-webhook`
- **Events:** Pull request reviews, Pull request review comments, Issue comments
- **Proxy:** `github-webhook-proxy` (port 8790) filters for `coderabbitai[bot]`
- **OpenClaw hook:** `github-pr` → wakes Sophie to process feedback

### Configuration Files
- **`.coderabbit.yaml`** — In repo root, defines review rules for Next.js/Supabase/Tailwind stack
- **Location:** `2025slideheroes/.coderabbit.yaml` (PR #2182)

## Workflow

### Stage 1: Pre-Commit CLI Review

Run BEFORE creating a PR:

```bash
cd ~/2025slideheroes-sophie
git checkout -b feature/my-feature upstream/dev

# ... make code changes ...

# Review uncommitted changes against dev branch
coderabbit --prompt-only --base upstream/dev
```

**What happens:**
- CodeRabbit analyzes your uncommitted changes
- Returns findings with suggested fixes
- Review takes 2-10 minutes depending on scope

**If issues found:**
1. Read each finding
2. Apply fixes manually or ask Sophie to fix
3. Re-run `coderabbit --prompt-only --base upstream/dev`
4. Repeat until no critical issues

**Then commit and push:**
```bash
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature
```

### Stage 2: Post-PR Review

After creating PR:

1. **CodeRabbit auto-reviews** within minutes of PR creation
2. **Webhook fires** → Sophie gets woken with feedback
3. **Sophie iterates:**
   - Reads CodeRabbit comments via `gh pr view`
   - Applies valid fixes
   - Pushes changes
   - CodeRabbit re-reviews (incremental)
4. **Sophie posts summary** to Discord #general
5. **Mike reviews** when Sophie says it's clean

### CLI Commands Reference

| Command | Description |
|---------|-------------|
| `coderabbit` | Interactive review (default) |
| `coderabbit --plain` | Plain text output |
| `coderabbit --prompt-only` | Minimal output for AI agents |
| `coderabbit --base dev` | Compare against dev branch |
| `coderabbit auth status` | Check authentication |
| `cr` | Short alias |

### Rate Limits (Pro Plan)
- **8 reviews per hour** per seat
- Reviews take 2-10+ minutes depending on scope
- Run in background if large changeset

## Integration with Sophie

### Pre-Commit
Sophie can run CodeRabbit as part of her development workflow:

```
1. Implement feature
2. Run: coderabbit --prompt-only --base upstream/dev
3. Read findings
4. Apply fixes
5. Re-run to verify
6. Commit and push
```

### Post-PR (Automatic)
When CodeRabbit posts a review on a PR:
1. Webhook fires → OpenClaw hook
2. Sophie wakes with the review content
3. Sophie processes each finding
4. Sophie pushes fixes
5. Sophie posts summary to Discord

## Troubleshooting

### CLI says "No files to review"
- Ensure you have uncommitted changes (`git status`)
- Or use `--base` to compare against a branch

### Webhook not firing
- Check webhook is "Active" in GitHub settings
- Check events are selected (Pull request reviews, Issue comments)
- Check `github-webhook-proxy` service: `sudo systemctl status github-webhook-proxy`

### Authentication expired
```bash
coderabbit auth login
# Re-authenticate with browser
```

## Files & Locations

| Item | Location |
|------|----------|
| CodeRabbit config | `2025slideheroes/.coderabbit.yaml` |
| Webhook proxy script | `~/clawd/scripts/github-webhook-proxy.py` |
| Webhook proxy service | `/etc/systemd/system/github-webhook-proxy.service` |
| OpenClaw hook config | `~/.openclaw/openclaw.json` → hooks.mappings.github-pr |
| Webhook secret | `/tmp/github-webhook-secret.txt` |

## Cost

- **CodeRabbit Pro:** $24/month (1 seat)
- **Included:** Unlimited repos, 8 CLI reviews/hour, full PR review features
- **GitHub Team:** Already paying 2 seats ($4/user/month) — no extra cost

## Known Issue: Webhook Hook Processing (Feb 24 2026)

**Status:** Webhooks fire and are accepted by OpenClaw (202 status, runId returned), but `wakeMode: "now"` does not trigger Sophie to process them.

**Symptoms:**
- `github-webhook-proxy` logs show `FORWARDED (202)`
- OpenClaw returns a valid runId
- Sophie is not woken to process the review

**Workaround:** Manually check CodeRabbit reviews on PRs. Sophie can process feedback when asked.

**To investigate:**
- Check if sessionKey format is correct
- Try full gateway restart (not SIGUSR1)
- Check OpenClaw GitHub issues for hook processing bugs
