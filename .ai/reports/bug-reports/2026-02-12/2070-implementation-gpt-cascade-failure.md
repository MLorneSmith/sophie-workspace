## ✅ Implementation Complete

**Issue**: #2070 - Bug Fix: S2045 GPT orchestrator cascade failure — 1/14 features
**Date**: 2026-02-12
**Commit**: `07d998cd9`

### Summary
- Scoped `pnpm typecheck` → `pnpm --filter web typecheck` in sandbox.ts, implement.md, refine.md, refine.ts
- Fixed prompt escaping: `git add <file1>` → `git add src/page.tsx apps/web/lib/file.ts`
- Added `runGitWithDNSRetry()` with 3 retries + exponential backoff for transient DNS failures
- Applied DNS retry to git fetch (pre-feature sync) and git push (post-feature completion)

### Files Changed
- `.ai/alpha/scripts/lib/feature.ts` — DNS retry function + usage + lint fix
- `.ai/alpha/scripts/lib/sandbox.ts` — typecheck scope
- `.ai/alpha/scripts/lib/provider.ts` — prompt escaping
- `.ai/alpha/scripts/lib/refine.ts` — typecheck scope
- `.claude/commands/alpha/implement.md` — typecheck scope (9 locations)
- `.claude/commands/alpha/refine.md` — typecheck scope (2 locations)

### Validation
- `pnpm --filter web typecheck` — passed
- `pnpm lint` on changed files — zero errors
- `pnpm format` — no fixes needed
- Pre-commit hooks — all passed

### Follow-up
- Run `pnpm e2b:build:gpt-dev` to rebuild GPT template with zod included
