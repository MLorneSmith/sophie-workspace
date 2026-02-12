# Nightly Backlog Work (11pm ET) - Updated Payload

## Use this payload via:
```bash
openclaw cron edit a044c4ca-bd10-4564-8ea9-f86a82777307 --message "$(cat ~/clawd/deliverables/nightly-backlog-cron-payload.md)"
```

---

Nightly Backlog Work session (11pm ET):

## Goal
Clear in-progress tasks first, then work through the backlog. Focus on completion, not new initiatives.

## Model Dispatch — ENFORCED AT INFRASTRUCTURE LEVEL
You are running on Opus (orchestration + review). For coding tasks, use Sophie Loop workflow:

### Sophie Loop Workflow

The Sophie Loop uses loop-runner.py for structured builder→reviewer iterations. You (Opus) orchestrate; sub-agents do the work.

```bash
# Step 1: Prepare builder prompt
python3 ~/clawd/.ai/loop-runner.py prepare --task-id <ID> --agent <agent> --persona solo-consultant --update-status
# Returns JSON with promptFile and model

# Step 2: Spawn builder sub-agent with the prompt file content and model
# (use sessions_spawn or exec with the model specified)

# Step 3: After builder completes, prepare review
python3 ~/clawd/.ai/loop-runner.py review-prep --task-id <ID> --output-file <builder-output-path> --update-status

# Step 4: Spawn reviewer sub-agent

# Step 5: Process review verdict
python3 ~/clawd/.ai/loop-runner.py process-review --task-id <ID> --review-file <reviewer-output-path>
# Returns PASS, FAIL:iterate, or FAIL:blocked
```

### Agent Mapping by Task Type

| Task Type | Use Agent | Model |
|-----------|-----------|-------|
| CODING | `--agent coder` | `openai-codex/gpt-5.2` |
| CONTENT (writing, emails) | `--agent writer` or `--agent emailer` | `zai/glm-4.7` |
| RESEARCH | `--agent researcher` | `zai/glm-4.7` |

### Loop Iteration Rules
- Max 3 iterations per task
- If PASS → mark task ready for review in Mission Control
- If FAIL:iterate → re-run prepare with updated learnings
- If FAIL:blocked (after 3 iterations) → mark task blocked and document why

### Fallback Path
If loop-runner.py fails or is unavailable, fall back to `codex exec --full-auto` for coding tasks only:
```bash
cd ~/2025slideheroes-sophie  # or ~/slideheroes-internal-tools
codex exec --full-auto 'Implement: <clear task description with acceptance criteria>'
```

## Phase 1: Finish In Progress (First Priority)
Check for any tasks already in progress:
```
curl -s 'http://localhost:3001/api/v1/tasks?assigned=true&status=in_progress' | jq '.'
```
Finish these before anything else. When complete, mark done:
```
curl -X PATCH http://localhost:3001/api/v1/tasks/{id}/complete
```

## Phase 2: Work Through Backlog
Fetch assigned backlog tasks:
```
curl -s 'http://localhost:3001/api/v1/tasks?assigned=true&status=backlog' | jq '.'
```
Work through them by priority (high → medium → low). Mark complete when done.

## Time Limit
2 hours HARD cap. Stop gracefully when hitting the limit.

## Scope (DO work on):
- Internal tools (slideheroes-internal-tools repo)
- Sophie workspace improvements
- Feed monitor, automation, integrations
- Research, planning, documentation
- Marketing/content prep (drafts)
- Any supporting infrastructure

## Out of scope (DO NOT touch):
- The 2025slideheroes product repo — only if Mike explicitly asks
- New initiatives (save for the 2am session)

## Process:
1. Query MC for in-progress tasks → finish first
2. Query MC for backlog tasks → work by priority
3. For each task:
   - Determine task type (coding/content/research)
   - Run `loop-runner.py prepare` with appropriate agent
   - Spawn sub-agent with returned promptFile + model
   - After builder completes, run `review-prep`
   - Spawn reviewer sub-agent
   - Run `process-review` to get verdict
   - If PASS → move to next task; if iterate → re-prepare; if blocked → skip and note reason
4. Mark completed tasks done in MC
5. Post progress report in Discord

When finished, run: openclaw gateway wake --text "Nightly backlog work complete" --mode now
