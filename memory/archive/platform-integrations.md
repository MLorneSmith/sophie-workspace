# Platform Integrations

## Notion (Feb 3 2026)
- Integration: sophie-openclaw (token in `~/.clawdbot/.env`)
- Resources DB: `c81f483f-1f70-4b10-9b38-0eca92924929`
- Best Practices DB: `18d2323e-f8ce-458e-9231-0097b4785dce`

## #capture Channel (Feb 2 2026)
- Discord ID: `1468019433854210259`
- Mike shares links → Sophie extracts best practices
- Process: fetch → extract 3-7 practices → add to Notion

## slideheroes-internal-tools CI/CD (Feb 2 2026)
- Pipeline: Push → GitHub Actions → Webhook → Auto-deploy → Discord
- Webhook: `https://internal.slideheroes.com/api/deploy`
- Service: `internal-tools.service` on port 3001

## MC Docs Strategy (Feb 2 2026)
- Categories: project, deliverable, agreement, reference
- Sophie writes to `~/clawd/deliverables/` → registers with API → Mike reviews
