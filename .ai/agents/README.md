# Agent Profiles

Specialized sub-agent profiles for the Sophie Loop autonomous work system.

## Agents

| Agent | Model | Role | Skills |
|-------|-------|------|--------|
| **Writer** | Opus 4.6 | Blog posts, long-form content | blog-writing, blog-post-optimizer |
| **Emailer** | Opus 4.6 | Email campaigns, sequences | email-marketing |
| **Coder** | GPT-5.2 Codex | Feature implementation, bug fixes | coding-agent, context7, github |
| **Designer** | Opus 4.6 | Frontend UI, visual assets | frontend-design, tailwind-design-system |
| **Researcher** | GLM 4.7 | Web research, competitive analysis | perplexity-research |
| **Reviewer** | Opus 4.6 | Quality gate for all agent output | (none — evaluates only) |
| **Planner** | Opus 4.6 | Goal decomposition into tasks | (none — plans only) |
| **DevOps** | GPT-5.2 Codex | Infrastructure, CI/CD, deployment | coding-agent, github |

## How It Works

1. Sophie (orchestrator) picks a task from Mission Control
2. Reads the agent profile YAML to determine model, context, and tools
3. Loads context bundle from `skill-mappings.yaml`
4. Spawns builder agent with profile's system prompt + context
5. Runs automated checks (lint, structure, etc.)
6. Spawns reviewer agent with same context + review criteria
7. Iterates until pass or max iterations hit

## Files

- `writer.yaml` — Blog posts and long-form content
- `emailer.yaml` — Email campaigns (Andre Chaperon methodology)
- `coder.yaml` — Product feature implementation
- `designer.yaml` — UI design and frontend implementation
- `researcher.yaml` — Research and competitive analysis
- `reviewer.yaml` — Quality review gate
- `planner.yaml` — Strategic decomposition
- `devops.yaml` — Infrastructure and deployment

## Context

Each profile references a `context_mapping` key that maps to `~/.ai/contexts/skill-mappings.yaml`. This determines which context files (brand voice, personas, guidelines) are injected into the agent's prompt.

## Adding New Agents

1. Create `<name>.yaml` in this directory
2. Add a corresponding entry in `skill-mappings.yaml` if new context mapping needed
3. Update this README
