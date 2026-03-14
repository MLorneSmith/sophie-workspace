# Nightly New Initiatives (2am ET) - Updated Payload

## Use this payload via:
```bash
openclaw cron edit daaaeb2e-1b5e-4dda-9d47-ef426712e423 --message "$(cat ~/clawd/deliverables/nightly-initiatives-cron-payload.md)"
```

---

Nightly New Initiatives session (2am ET):

## Goal
Proactively identify and build something new that improves efficiency, effectiveness, or the business. Mike wants to wake up surprised at the progress. Be ambitious.

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
cd ~/slideheroes-internal-tools  # or relevant repo
codex exec --full-auto 'Implement: <clear task description with acceptance criteria>'
```

## What to Build
Think about:
- Automation that saves time
- Tools that provide better insights
- Integrations that reduce friction
- Documentation that clarifies processes
- Research that informs strategy
- Infrastructure improvements
- Workflow optimizations

Pick ONE meaningful initiative and execute it well. Depth over breadth.

## Time Limit
2 hours HARD cap. Plan accordingly.

## Scope (DO work on):
- Internal tools (slideheroes-internal-tools repo)
- Sophie workspace improvements
- Feed monitor, automation, integrations
- Research, planning, documentation
- Marketing/content prep (drafts)
- Any supporting infrastructure

## Out of scope (DO NOT touch):
- The 2025slideheroes product repo — only if Mike explicitly asks

## Process:
1. Reflect: What would make the biggest impact?
2. Pick ONE initiative you can meaningfully complete in 2 hours
3. Create a Mission Control task for the initiative (optional, but good for tracking)
4. For the task:
   - Determine task type (coding/content/research)
   - Run `loop-runner.py prepare` with appropriate agent
   - Spawn sub-agent with returned promptFile + model
   - After builder completes, run `review-prep`
   - Spawn reviewer sub-agent
   - Run `process-review` to get verdict
   - If PASS → commit and push; if iterate → re-prepare; if blocked → document and move on
5. Create MC task for any follow-up work if needed
6. Post report in Discord: what you built, why it matters, PR links, what Mike should review

When finished, run: openclaw gateway wake --text "Nightly initiative complete" --mode now
