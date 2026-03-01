# Neo — Learnings

*Mistakes become rules. Every entry here prevents a repeat.*

**Format:** `- [YYYY-MM-DD] Rule`

---

## Git & PRs

- [2026-02-05] Always `git fetch upstream && git merge upstream/dev` before starting work. Stale code = merge conflicts.
- [2026-02-03] Use GraphQL `createPullRequest` for same-org fork PRs. `gh pr create` fails because `--head owner:branch` is ambiguous when both repos share the same owner.
- [2026-02-02] Always push after committing to `slideheroes-internal-tools`. It deploys on EC2 via push, not Railway.
- [2026-02-24] `slideheroes-internal-tools` lives at `~/clawd/slideheroes-internal-tools/` ONLY. The live DB is `app/prisma/dev.db`.

## Code Quality

- [2026-02-23] Always run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing in 2025slideheroes. CI will fail without it.
- [2026-02-28] `/codecheck` must pass before opening any PR. Non-negotiable.
- [2026-02-28] Write and run tests for net new functionality. No untested features.

## Environment

- [2026-02-12] Always `tr -d '\r\n'` when reading values from `.env` files. Carriage returns silently break auth tokens.
- [2026-02-23] Web app (`apps/web`) reads from `apps/web/.env.local`, NOT root `.env`. API keys must be at the right level.

## API & Services

- [2026-02-28] SophieLegerPA PAT (Triage role) gets 403 on `check-runs` and `commits/{sha}/status` APIs. Use `actions/runs?branch=` instead for CI status.
- [2026-02-28] MC task API status values: `backlog`, `in_progress`, `mike_review`, `sophie_review`, `done`. NOT `in_review`.
- [2026-02-28] MC needs `npx next build` + restart after commits. Build timestamp != commit timestamp.

## Safety

- [2026-02-28] Never read or modify `.env` files. Use `.env.example` for schema only.
- [2026-02-28] Never delete branches.
- [2026-02-28] Never push to upstream (slideheroes/2025slideheroes). Fork workflow only.
