# Alpha Provider Setup (Claude + GPT)

Use this checklist to switch between Claude (default) and GPT via Codex for the Alpha orchestrator.

## Choose a Provider

- **Claude (default)**: No changes needed if Claude auth is already configured.
- **GPT via Codex**: Requires Codex CLI auth and an E2B template that includes Codex.

## Claude Checklist

- [ ] `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` is set
- [ ] E2B template: `slideheroes-claude-agent-dev` (default)

## GPT/Codex Checklist

- [ ] Run `codex --login` on the host (stores credentials in `~/.codex/auth.json`)
- [ ] Or set `OPENAI_API_KEY` (or `OPENAI_ACCESS_TOKEN`) in the environment
- [ ] E2B template includes Codex CLI (or allow the orchestrator to install it)
- [ ] Optional: set `ALPHA_GPT_TEMPLATE_ALIAS` if your GPT template alias differs

## How to Select a Provider

CLI:
```
tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id> --provider claude
tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id> --provider gpt
```

Env var:
```
ALPHA_PROVIDER=claude  # default
ALPHA_PROVIDER=gpt
```

## Common Gotchas

- GPT runs require Codex to be available in the sandbox. If your template doesn’t ship it,
  the orchestrator will install `@openai/codex` on sandbox creation.
- If the orchestrator can’t find OpenAI auth, it will fail fast with a clear error.
