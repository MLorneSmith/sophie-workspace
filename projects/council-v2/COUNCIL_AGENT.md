# Council Orchestrator Agent

**This is the default architecture for Council v2.**

A dedicated **Claude Opus** agent runs Council debates autonomously. The main session (Sophie) spawns the orchestrator and waits for results — keeping the main context clean.

## Architecture

```
Main Session (Sophie)
    │
    └── spawns → Council Orchestrator (Opus)  ← THIS AGENT
                     │
                     ├── spawns → Claude (Reasoner)
                     ├── spawns → GPT (Pragmatist)
                     └── spawns → GLM (Synthesizer)
```

## How to Use

From the main Sophie session, spawn the Council orchestrator:

```
sessions_spawn:
  task: |
    Run a Council debate on this topic: "Your topic here"
    
    Optional context: "Additional context..."
    
    Follow the Council protocol in ~/clawd/projects/council-v2/
    Spawn Claude, GPT, and GLM sub-agents for each turn.
    Save results to ~/clawd/data/council/
    Return the synthesis and recommendation.
  model: anthropic/claude-opus-4-5
  label: council-orchestrator
```

## Orchestrator Instructions

When spawned as the Council orchestrator, follow this protocol:

### 1. Create Session
```bash
SESSION_ID=$(openssl rand -hex 8)
mkdir -p ~/clawd/data/council
```

### 2. Run Rounds (max 3, or until consensus)

For each round, spawn agents in rotating order:
- Round 1: Claude → GPT → GLM
- Round 2: GPT → GLM → Claude  
- Round 3: GLM → Claude → GPT

Each agent spawn:
```
sessions_spawn:
  task: [agent prompt with topic + previous turns]
  model: [agent's model]
  label: council-{session}-{agent}-r{round}
```

### 3. Parse Responses

Extract from each response:
- Position (1-3 sentences)
- Responses to others (agree/disagree/partial)
- Reasoning (2-4 paragraphs)
- Confidence (1-5)

### 4. Detect Consensus

After each round, check if all agents agree:
- **Strong consensus**: All 3 agree
- **Soft consensus**: 2 agree, 1 partial
- **No consensus**: Continue to next round

### 5. Synthesis

After final round (or early consensus), GLM synthesizes:
- Consensus summary
- Key insights from each agent
- Final recommendation

### 6. Save & Report

Save JSON to `~/clawd/data/council/{session}.json`
Report back to parent session with recommendation.

## Agent Prompts

See `~/clawd/projects/council-v2/src/prompts.ts` for prompt templates.

## Models

| Agent | Model | Role |
|-------|-------|------|
| Claude | anthropic/claude-opus-4-5 | Reasoner |
| GPT | openai/gpt-4o | Pragmatist |
| GLM | zai/glm-4.7 | Synthesizer |

Note: If a model isn't available, fallback to default.
