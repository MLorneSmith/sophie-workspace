# Rabbit Plan Skill

Execute the Rabbit Plan development workflow: brainstorm → spec → feature issues → auto-execute.

## Commands

### rabbit brainstorm
Start a new brainstorm session. Guide through 4-6 questions exploring the problem space. Output: design doc in `~/clawd/plans/brainstorming/`.

### rabbit spec
Create a product-focused spec from brainstorm output or direct input. Uses Spec Template. Output: spec doc in `~/clawd/plans/specs/<slug>/`.

### rabbit create-issues
Read spec's feature breakdown, create GitHub Issues using Issue Template with `type:feature` and `plan-me` labels. Create MC tasks.

### rabbit status
Check the Neo loop status — what's queued, what's running, recent completions.

## Automated Pipeline (No Manual Steps)

Once `rabbit create-issues` creates issues with the `plan-me` label:

1. **CodeRabbit** auto-generates a Coding Plan (comment on issue)
2. **`neo-issue-pickup.py`** (cron, every 10 min) detects the plan → queues Neo
3. **Neo** implements, pushes, opens PR
4. **CodeRabbit** reviews the PR
5. **`neo-review-responder.py`** (cron, every 10 min) detects review comments → queues Neo to fix
6. **`neo-ci-fix.py`** (cron, every 10 min) detects CI failures → queues Neo to fix
7. **Mike** reviews and merges the clean PR

No plan approval step needed — architectural decisions are made during brainstorm/spec (Phases 1-2). PR review is the quality gate.

## Usage

```
rabbit brainstorm
rabbit spec <slug> [-input "..."]
rabbit create-issues <spec-path>
rabbit status
```

## Requirements
- GitHub token with repo write access
- CodeRabbit configured on repo
- Mission Control API access
- Neo loop cron jobs running (neo-issue-pickup, neo-review-responder, neo-ci-fix)
