# Council Debate Skill

Run multi-agent council debates with true multi-model perspectives (Claude, GPT, GLM).

## Architecture

```
Webhook/Request → Main Session orchestrates
  ├── sessions_spawn(opus) → Claude the Reasoner
  ├── sessions_spawn(gpt-5.2) → GPT the Pragmatist
  └── sessions_spawn(GLM) → GLM the Synthesizer
  → Collect responses → Post to API → Announce
```

**Note:** Sub-agents cannot spawn sub-agents (Clawdbot design). Main session handles orchestration directly.

## Trigger Phrases

- "Have the council debate [topic]"
- "Get the council's opinion on [topic]"
- "Run a council debate about [topic]"

## The Council

| Agent | Model | Role |
|-------|-------|------|
| Claude | `opus` | Reasoner — Logical analysis, first principles |
| GPT | `openai-codex/gpt-5.2` | Pragmatist — Practical implementation |
| GLM | `GLM` | Synthesizer — Finding common ground |

## UI Trigger

Mission Control has a "New Debate" button at `/council`:
1. Enter topic + optional context
2. Sends POST `/api/council/debates` with `run: true`
3. Webhook triggers main session
4. Main session runs the debate

## Manual Orchestration

When triggered, run this flow:

### 1. Create Debate
```bash
curl -X POST http://localhost:3001/api/council/debates \
  -H "Content-Type: application/json" \
  -d '{"topic": "...", "context": "..."}'
```

### 2. Spawn Round 1 (parallel)
```javascript
sessions_spawn({ model: "opus", label: "council-claude-r1", task: "..." })
sessions_spawn({ model: "openai-codex/gpt-5.2", label: "council-gpt-r1", task: "..." })
sessions_spawn({ model: "GLM", label: "council-glm-r1", task: "..." })
```

### 3. Collect Responses
When spawns announce back, parse POSITION/REASONING/CONFIDENCE.

### 4. Post Turns
```bash
curl -X POST http://localhost:3001/api/council/debates/{id}/turns \
  -H "Content-Type: application/json" \
  -d '{"roundNumber": 1, "agentId": "claude", "agentRole": "Reasoner", ...}'
```

### 5. Run Round 2
Spawn again with cross-references to Round 1 positions.

### 6. Synthesize
Analyze positions, determine consensus type (strong/soft/none), generate recommendation.

```bash
curl -X POST http://localhost:3001/api/council/debates/{id}/synthesis \
  -H "Content-Type: application/json" \
  -d '{"consensusSummary": "...", "consensusType": "strong", ...}'
```

### 7. Complete & Announce
```bash
curl -X PATCH http://localhost:3001/api/council/debates/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "complete", "consensusType": "...", "recommendation": "..."}'
```

Send summary to Discord #general.

## Council Member Prompt Template

```
COUNCIL MEMBER: [Name] the [Role]

Topic: [topic]
Context: [context]
{Round 2: Previous positions from other agents}

[Role-specific instructions]

Respond ONLY in this format:
POSITION: [1-3 sentences]
REASONING: [2-4 sentences]
CONFIDENCE: [1-5]
{Round 2: RESPONSE_TO_[AGENT]: [response]}
```

## Files

- `SKILL.md` — This file
- `orchestrate.md` — Detailed prompts and API specs
