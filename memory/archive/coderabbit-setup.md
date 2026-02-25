# CodeRabbit Setup (Feb 24 2026)

**Two-stage code review:**
1. Pre-commit: `coderabbit --prompt-only --base upstream/dev`
2. Post-PR: CodeRabbit reviews → webhook → Sophie iterates

**Setup:**
- Account: Sophie's GitHub (`SophieLegerPA`) — $24/month Pro
- CLI: `~/.local/bin/coderabbit` v0.3.6
- Webhook: GitHub → Tailscale funnel → port 8790 → OpenClaw
- Config: `.coderabbit.yaml` in repo root

**Workflow:**
```
Code → coderabbit --prompt-only → fix → commit → push →
CodeRabbit reviews PR → webhook → Sophie iterates → Mike reviews
```

**SOP:** `~/clawd/docs/sops/coderabbit-workflow.md`
