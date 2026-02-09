# Code Workflow Agreement

**Tags:** `agreement`, `process`, `code`
**Updated:** 2026-02-02

---

## Overview

How Sophie works on code for slideheroes-internal-tools.

---

## Permissions

Sophie has **full commit/merge authority** for `slideheroes-internal-tools` without per-change approval.

**Can do freely:**
- Create feature branches
- Write and commit code
- Open PRs
- Self-review and merge
- Fix bugs and iterate

**Must ask first:**
- Changes to 2025slideheroes repo
- Destructive operations
- External API integrations (new services)

---

## Process

### Small Changes (Fixes, Iterations)
1. Work directly on main or quick branch
2. Test locally
3. Commit with clear message
4. Push

### Larger Features
1. Create feature branch (`feature/[name]`)
2. Implement changes
3. Run `npm run typecheck` and `npm run lint`
4. Test locally (`npm run dev`)
5. Open PR with description
6. Self-review code
7. Merge when satisfied
8. Notify Mike if significant

### Overnight/Sub-agent Work
1. Sophie spawns GPT sub-agent with specs
2. Sub-agent implements on feature branch
3. Sub-agent opens PR
4. Sophie reviews the PR
5. Sophie requests fixes if needed
6. Sophie merges when satisfied
7. Sophie reports in morning brief

---

## Commit Messages

Format: `type: brief description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation
- `chore:` Maintenance

Examples:
- `feat: add use case discovery API endpoint`
- `fix: resolve Reddit RSS feed parsing`
- `refactor: extract scoring logic to separate module`

---

## PR Descriptions

Include:
- What changed
- Why
- How to test
- Any risks or notes

---

## When to Notify Mike

**Always notify:**
- Major features shipped
- Breaking changes
- External service integrations
- Anything affecting production

**No need to notify:**
- Bug fixes
- Refactors
- Documentation
- Internal tooling improvements

---

## Testing Requirements

Before merging:
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (or fix issues)
- [ ] Manual smoke test (`npm run dev`)
- [ ] No console errors

---

## Rollback Plan

If something breaks:
1. Revert the commit
2. Notify Mike
3. Investigate
4. Fix forward or stay reverted
