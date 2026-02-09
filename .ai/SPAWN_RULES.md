# Spawn Rules — DO NOT OVERRIDE

When spawning sub-agents via the Sophie Loop, **always use the model from the agent profile**.

The loop-runner outputs a JSON instruction with the correct model. Use it exactly.

## Model Allocation

- **GLM (zai/glm-4.7):** writer, emailer, researcher, designer — bulk production, $0.00
- **Opus (anthropic/claude-opus-4-6):** reviewer, planner — quality gates & strategy
- **Codex (openai-codex/gpt-5.2):** coder, devops — specialized code work

## Why This Matters

GLM builds cheap. Opus reviews smart. Overriding the reviewer to GLM defeats the purpose of the quality gate. The whole loop depends on the reviewer being a *higher-quality model* than the builder.

## How It's Enforced

1. Agent profiles (`~/.ai/agents/*.yaml`) define `model` per agent
2. `loop-runner.py prepare` reads the profile and outputs `model` in JSON
3. `loop-runner.py review-prep` reads the reviewer profile and outputs `model` in JSON
4. Sophie (main session) must pass `model` to `sessions_spawn` exactly as specified
5. This file exists as a reminder — if you're tempted to override, don't.
