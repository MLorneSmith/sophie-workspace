# Current State — Mar 03, 2026 (11:53 EST)

## Today's Shipped Work
- ✅ Bifrost AI Gateway — built from source, systemd service, SSM secrets
- ✅ gateway.slideheroes.com — CF Tunnel + CF Access (Allow Mike)
- ✅ OpenAI + Anthropic providers configured in Bifrost UI
- ✅ CF Access Service Token for app (Vercel + local dev)
- ✅ App wired to Bifrost (env vars in .env.local + Vercel)
- ✅ Langfuse Cloud (EU, GDPR) — OTEL traces flowing from Bifrost

## Architecture
```
App (Vercel/local) → gateway.slideheroes.com → Bifrost (localhost:8080) → OpenAI/Anthropic
                                                    ↓
                                              OTEL traces → Langfuse Cloud (EU)
```

## Agent Fleet — ALL OPERATIONAL
| Agent | Channel | Model | Status |
|-------|---------|-------|--------|
| Neo 🧑‍💻 | #neo | MiniMax M2.5 | Running |
| Kvoth 🔍 | #kvoth | MiniMax M2.5 | Running |
| Hemingway ✍️ | #hemingway | Opus 4.6 | Running |
| Viral 🚀 | #viral | MiniMax M2.5 | Ready |
| Michelangelo 🎨 | #michelangelo | MiniMax M2.5 | Ready |

## Bifrost Migration (Spec #2212)
- ✅ F1: Bifrost Deployment (#2213 → PR #2220) — MERGED
- ✅ F2: Gateway Client Refactor (#2214 → PR #2219) — MERGED
- ✅ F3: Langfuse Prompt Migration (#2215 → PR #2217) — MERGED
- ⏳ F4: Integration & Cleanup (#2216) — CR plan ready, awaiting Neo

## Open PRs with CR Feedback (post-merge fixes needed)
- PR #2221 (Library Navigation) — 6 CR comments
- PR #2222 (Template Selection UI) — 10 CR comments (2 critical: hex colors)

## Key Gotchas Discovered Today
- Bifrost stores plugin config in SQLite DB which overrides config.json
- fetch-secrets-env.sh must run as ubuntu user (root has no AWS profile)
- Bifrost ExecStartPre as root wipes .secrets.env — fixed with `su - ubuntu -c`
