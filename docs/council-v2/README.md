# Council v2

Multi-agent deliberation system where Claude, GPT, and GLM debate topics and converge on consensus.

## Architecture

**Default pattern:** Spawn an **Opus-powered orchestrator agent** that manages the entire debate autonomously.

```
Main Session (Sophie)
    │
    └── spawns → Council Orchestrator (Opus)
                     │
                     ├── spawns → Claude (Reasoner)
                     ├── spawns → GPT (Pragmatist)
                     └── spawns → GLM (Synthesizer)
```

The main session stays clean — just spawn the orchestrator with a topic and wait for results.

## Quick Links

- [Architecture](./architecture.md) — Full system design
- [Orchestrator Guide](../projects/council-v2/COUNCIL_AGENT.md) — How to run debates

## Status

**Phase 1: Architecture** ✅ Complete
**Phase 2: Core Implementation** ✅ Complete  
**Phase 3: Integration** ✅ Complete
- Opus orchestrator pattern validated
- Sub-agent spawning works
- Consensus detection works
- JSON storage works

## Usage

From any Clawdbot session:

```
Run a Council debate on: "Your topic here"
```

Sophie will spawn an Opus orchestrator to handle everything.

## How It Works

```
Topic: "Best approach for feature X"
         │
         ▼
┌────────────────────────┐
│   Round 1: Positions   │
│   Claude → GPT → GLM   │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│   Round 2: Responses   │
│   GPT → GLM → Claude   │
└────────────────────────┘
         │
         ▼ (repeat until consensus or max rounds)
         │
┌────────────────────────┐
│    Voting Phase        │
│    Final positions     │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│   Synthesis Phase      │
│   Consensus summary    │
└────────────────────────┘
```

## Agent Roles

| Agent | Model | Role |
|-------|-------|------|
| Claude | opus-4-5 | Reasoner — deep analysis, nuanced thinking |
| GPT | gpt-4o | Pragmatist — practical solutions, implementation focus |
| GLM | glm-4.7 | Synthesizer — finding common ground, summarization |

## Usage (planned)

```bash
# Start a debate
curl -X POST /api/council/debates \
  -d '{"topic": "Should we use SSR or CSR for the dashboard?"}'

# Get debate status
curl /api/council/debates/{id}

# Inject human input mid-debate
curl -X POST /api/council/debates/{id}/inject \
  -d '{"message": "Consider mobile performance too"}'
```
