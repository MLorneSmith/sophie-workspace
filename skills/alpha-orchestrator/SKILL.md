---
name: alpha-orchestrator
description: Run the SlideHeroes Alpha Spec Orchestrator using Sophie's fork-based git workflow (fork origin + upstream base). Creates/uses branch sophie/alpha/S<spec-id> and can auto-open a PR into upstream dev.
allowed-tools: Bash
---

# Alpha Orchestrator (Sophie fork workflow)

This skill wraps the Alpha **Spec Orchestrator** (`.ai/alpha/scripts/spec-orchestrator.ts`) with the git + branch conventions used in Sophie’s fork workflow.

## What it does

- Runs Alpha Spec Orchestrator for a given **Spec ID**.
- Configures E2B sandboxes to use:
  - **origin** = Sophie fork (push destination)
  - **upstream** = main repo (source of truth for `dev`)
- Uses branch naming:
  - `sophie/alpha/S<spec-id>`
- After orchestration, can open a PR:
  - **base**: `dev` on upstream repo
  - **head**: `sophie/alpha/S<spec-id>` from fork

## Prereqs

### Local machine
- Repo checkout available (default assumed path): `~/2025slideheroes-sophie`
- Node + pnpm installed (repo uses Node 22 + pnpm)
- GitHub CLI (`gh`) installed and authenticated

### Environment variables
Required for orchestrator:
- `E2B_API_KEY`
- Claude auth (as used by your setup)

Required for fork workflow + PR automation:
- `GITHUB_TOKEN` (also used in E2B sandboxes for pushing)
- `SOPHIE_FORK_REPO` (format: `owner/repo`)
- `SOPHIE_UPSTREAM_REPO` (format: `owner/repo`)

Optional:
- `SOPHIE_REPO_DIR` (default: `~/2025slideheroes-sophie`)
- `ALPHA_BASE_BRANCH` (default: `dev`)
- `ALPHA_BRANCH_PREFIX` (default: `sophie/alpha`)

## Commands

### Run orchestrator

```bash
~/.openclaw/skills/alpha-orchestrator/scripts/run-spec.sh <spec-id> [-- <extra spec-orchestrator args>]

# Examples:
~/.openclaw/skills/alpha-orchestrator/scripts/run-spec.sh 1362
~/.openclaw/skills/alpha-orchestrator/scripts/run-spec.sh 1362 -- -s 2
~/.openclaw/skills/alpha-orchestrator/scripts/run-spec.sh 1362 -- --dry-run
```

### Open PR to upstream dev

```bash
~/.openclaw/skills/alpha-orchestrator/scripts/open-pr.sh <spec-id>
```

## Notes / Implementation details

This workflow relies on fork-aware support added to Alpha’s sandbox git setup:
- `ALPHA_GIT_FORK_URL` and `ALPHA_GIT_UPSTREAM_URL` are passed into the E2B sandbox and used to set remotes.
- `ALPHA_BRANCH_PREFIX` (or `ALPHA_BRANCH_NAME`) controls the created branch.

If `SOPHIE_FORK_REPO` / `SOPHIE_UPSTREAM_REPO` aren’t set, the wrapper will fail fast with a clear message.
