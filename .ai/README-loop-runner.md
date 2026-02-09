# Sophie Loop Runner

A coordination tool for Sophie's builder→reviewer iteration loop.

This runner **does not spawn agents**. It prepares prompts + run metadata, then
prints JSON instructions that the main Sophie session can use to spawn builder
and reviewer runs.

## Files

- `~/.ai/loop-runner.py` — main implementation
- `~/.ai/loop-runner.sh` — thin bash wrapper (calls the python tool)
- `~/.ai/lib/loop-helpers.sh` — shared bash helpers (reserved for future use)
- Run workspace per task:
  - `~/.ai/runs/<task-id>/prompt.md` — builder prompt
  - `~/.ai/runs/<task-id>/output.md` — builder output (saved during review-prep)
  - `~/.ai/runs/<task-id>/review-prompt.md` — reviewer prompt
  - `~/.ai/runs/<task-id>/review.md` — reviewer output
  - `~/.ai/runs/<task-id>/learnings.md` — accumulated feedback across iterations
  - `~/.ai/runs/<task-id>/checks.log` — automated check output
  - `~/.ai/runs/<task-id>/meta.json` — iteration/status metadata

## Mission Control API

Default base URL: `http://localhost:3001/api/v1`

The runner uses:
- `GET /tasks/<id>`
- `PATCH /tasks/<id>`

## Usage

### 1) Prepare builder prompt

```bash
python3 ~/.ai/loop-runner.py prepare \
  --task-id 84 \
  --agent writer \
  --persona solo-consultant \
  --update-status
```

Outputs JSON like:

```json
{
  "action": "spawn_builder",
  "promptFile": "/home/ubuntu/clawd/.ai/runs/84/prompt.md",
  "model": "anthropic/claude-opus-4-6",
  "thinking": "high"
}
```

Main Sophie session should spawn the builder with the provided `promptFile`, then
save the builder output to a file.

#### Dry run

```bash
python3 ~/.ai/loop-runner.py prepare --task-id 84 --agent writer --persona solo-consultant --dry-run
```

### 2) Prepare reviewer prompt (after builder finishes)

```bash
python3 ~/.ai/loop-runner.py review-prep \
  --task-id 84 \
  --output-file /path/to/builder-output.md \
  --update-status
```

This will:
- copy builder output into `~/.ai/runs/84/output.md`
- run automated checks and write `checks.log`
- write `review-prompt.md`
- print JSON instructions to spawn the reviewer

### 3) Process reviewer verdict (after reviewer finishes)

```bash
python3 ~/.ai/loop-runner.py process-review \
  --task-id 84 \
  --review-file /path/to/reviewer-output.md
```

Prints one of:
- `PASS` (and PATCHes Mission Control to `ready_for_review` + `reviewSummary`)
- `FAIL:iterate` (appends notes to `learnings.md`; run `prepare` again)
- `FAIL:blocked` (PATCHes Mission Control with `blockedReason` when iteration cap is hit)

## Notes / Defaults

- Task type is inferred from the builder agent profile's `context_mapping`:
  - `coding` → runs `pnpm typecheck && pnpm lint` in `/home/ubuntu/clawd` by default
  - `research` → checks non-empty output
  - everything else → basic content checks (heading + CTA + minimum word count)

Override task type with `--task-type`.
