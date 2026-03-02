# SOP: Rabbit Plan — Development Planning Process

## Overview

Rabbit Plan is an end-to-end development planning process that combines Sophie's orchestration with CodeRabbit's Issue Planner, GitHub Issues, and Mission Control. It produces well-scoped, product-focused specs that CodeRabbit turns into implementation-ready coding plans.

**Philosophy:** Humans define *what* and *why*. CodeRabbit handles *how*. Coding agents execute.

**Key principle:** Specs are product-focused (problem, user experience, acceptance criteria) — not implementation-focused. CodeRabbit already understands the codebase deeply through continuous analysis. Don't duplicate that work in the spec.

---

## When To Use

Use Rabbit Plan for any new feature, enhancement, or significant change to the 2025slideheroes codebase. Not needed for:
- Quick bug fixes (just create an issue and fix it)
- Config changes
- Documentation-only changes
- Anything under ~2 days of work

---

## Process Overview

```
Phase 1: Brainstorm → Design Document
Phase 2: Spec       → Spec Document + GitHub Spec Issue
Phase 3: Issues     → GitHub Feature Issues (auto-triggers CodeRabbit)
Phase 4: Auto-Execute → Neo implements, opens PR, handles reviews (no manual plan approval)
```

---

## Phase 1: Brainstorm

**Trigger:** Mike describes an idea, problem, or feature request.
**Who:** Sophie + Mike (conversational)
**Duration:** 10-30 minutes

### Process

1. **Understand the idea** — Sophie asks 4-6 focused questions, one at a time
   - Prefer multiple choice over open-ended when possible
   - Cover: use case, scope, user experience, constraints, priority
2. **Research external context** (if applicable) — APIs, services, competitor approaches
3. **Light codebase awareness** — What exists today that's relevant? What patterns are established?
4. **Present design summary** — Key capabilities, design decisions, scope boundaries, out-of-scope items
5. **Iterate** until Mike confirms the direction

### Output

Design document saved to:
```
~/clawd/plans/brainstorming/YYYY-MM-DD-<slug>.md
```

### Skip Conditions

Skip brainstorming if Mike provides a clear, detailed brief that already answers the key questions. Go straight to Phase 2.

---

## Phase 2: Spec

**Trigger:** Approved design document from Phase 1, or direct input from Mike.
**Who:** Sophie (drafts) + Mike (reviews/approves)
**Duration:** 15-45 minutes

### Process

1. **Load the Spec Template** from `~/clawd/plans/templates/spec-template.md`
2. **Fill in all sections** — No placeholders. Every section must be concrete.
3. **Identify features** — Break the spec into 3-10 day vertical slice features
4. **Map dependencies** — Which features depend on others?
5. **Present to Mike** for review
6. **Create GitHub Issue** with `type:spec` label on `slideheroes/2025slideheroes`

### Output

- Spec document: `~/clawd/plans/specs/<slug>/spec.md`
- GitHub Issue: `#<number>` with label `type:spec`

### Spec Content (What To Include)

| Section | Purpose | Example |
|---------|---------|---------|
| Problem Statement | What pain exists, for whom | "Consultants waste 2+ hours per presentation..." |
| User Story | Structured need statement | "As a consultant, I want..." |
| User Experience | Step-by-step walkthrough | "1. User clicks 'New'... 2. System shows..." |
| Acceptance Criteria | Testable success conditions | "- [ ] User can export to PPTX" |
| Scope Boundaries | What's in and what's out | "In: Basic export. Out: Custom themes" |
| Feature Breakdown | Prioritized feature list | Table with name, priority, days, dependencies |
| Visual Mockup | What it looks like (UI features) | ASCII layout or written description |
| Risks & Open Questions | What we're unsure about | "Risk: API rate limits unknown" |

### What NOT To Include

CodeRabbit handles these — don't waste spec space on them:
- File paths to modify
- Architecture decisions
- Component/library selection
- Database schema details
- Code patterns to follow
- Agent-ready implementation prompts

---

## Phase 3: Feature Issues

**Trigger:** Approved spec from Phase 2.
**Who:** Sophie (automated)
**Duration:** 2-5 minutes

### Process

1. **Read the spec's Feature Breakdown** section
2. **For each feature**, create a GitHub Issue using the Feature Issue Template
3. **Apply labels:** `type:feature`, `plan-me` (triggers CodeRabbit auto-planning)
4. **Create linked Mission Control task** for each feature
5. **Post summary** to Discord with issue links

### GitHub Issue Format

Each feature issue follows the template at `~/clawd/plans/templates/feature-issue-template.md`:
- Problem (1-2 sentences)
- User Story
- User Experience (numbered steps)
- Acceptance Criteria (checkboxes)
- Visual Reference (for UI features)
- Scope (in/out)
- Context (parent spec link, dependencies, priority, size estimate)

### Labels

| Label | Purpose |
|-------|---------|
| `type:feature` | Identifies as a Rabbit Plan feature |
| `plan-me` | Triggers CodeRabbit auto-planning |
| `spec:<issue-number>` | Links back to parent spec |

---

## Phase 4: Auto-Execute (No Manual Approval)

**Trigger:** CodeRabbit posts a Coding Plan comment on a `plan-me` issue.
**Who:** Fully automated — Neo's cron loop detects and executes.
**Duration:** Minutes to hours depending on feature size.

### Why No Manual Plan Approval?

Architectural decisions are made during spec design (Phase 1-2) by Sophie + Mike. By the time an issue exists, the *what* and *why* are settled. CodeRabbit's plan is purely tactical (*how to write the code*), and Mike reviews the actual code at the PR stage. Approving the plan AND the PR is redundant.

**Quality gates:**
- **Front gate:** Spec design (Sophie + Mike) → ensures right direction
- **Back gate:** PR review (Mike) → ensures right implementation

### Automated Flow

1. **`neo-issue-pickup.py`** runs every 10 min (cron)
2. Detects `plan-me` issues with a CodeRabbit Coding Plan comment
3. Checks no PR already exists for the issue
4. Queues Neo to implement (via spawn queue)
5. **Neo implements** the feature on a branch in Sophie's fork
6. **Neo runs** `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing
7. **Neo pushes** to origin (fork) and opens PR targeting upstream `dev`
8. **CodeRabbit reviews** the PR automatically
9. **`neo-review-responder.py`** detects review comments (every 10 min) and queues Neo to address them
10. **`neo-ci-fix.py`** detects CI failures (every 10 min) and queues Neo to fix them
11. **Mike reviews and merges** when PR is clean
12. **MC task** moves to `done`

### PR Naming Convention

```
feat(<scope>): <description> [RP-<spec-issue>#F<feature-number>]
```

Example: `feat(export): add PPTX export for presentations [RP-2200#F3]`

---

## Notification Architecture

### How Neo Detects Work

**Primary:** Cron-based polling (no LLM involved):

| Script | Interval | Purpose |
|--------|----------|---------|
| `neo-issue-pickup.py` | Every 10 min | Detects `plan-me` issues with CodeRabbit plans → queues implementation |
| `neo-review-responder.py` | Every 10 min | Detects new PR review comments → queues fixes |
| `neo-ci-fix.py` | Every 10 min | Detects CI failures → queues fixes |

**Backup:** GitHub webhook → `github-webhook-proxy` (port 8790) can also wake Sophie for manual intervention if needed.

All scripts are pure Python + `gh` CLI. No LLM calls in the detection/queuing loop.

---

## File Locations

| Artifact | Location |
|----------|----------|
| This SOP | `~/clawd/docs/sops/rabbit-plan.md` |
| Sophie Skill | `~/clawd/skills/rabbit-plan/SKILL.md` |
| Spec Template | `~/clawd/plans/templates/spec-template.md` |
| Issue Template | `~/clawd/plans/templates/feature-issue-template.md` |
| Brainstorm docs | `~/clawd/plans/brainstorming/` |
| Spec docs | `~/clawd/plans/specs/<slug>/` |
| CR config | `2025slideheroes/.coderabbit.yaml` |
| Webhook proxy | `~/clawd/scripts/github-webhook-proxy.py` |
| Pipeline status | `python3 ~/clawd/scripts/neo-loop/rabbit-status.py` |
| Neo Loop scripts | `~/clawd/scripts/neo-loop/` |

---

## Integration with Mission Control

### MC → GitHub
- Spec creation → GitHub Issue (`type:spec`)
- Feature creation → GitHub Issue (`type:feature`, `plan-me`)

### GitHub → MC
- CR plan posted → MC task gets activity note
- PR opened → MC task moves to `in_progress`
- PR merged → MC task moves to `done`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CR doesn't auto-plan | Check `plan-me` label is applied. Check `.coderabbit.yaml` has auto-planning enabled. |
| CR plan is low quality | Issue description may be too vague. Add more context about user experience and acceptance criteria. Reply to plan comment with refinements. |
| Neo produces wrong output | CR's agent prompt may not have enough context. Review the plan first — refine with CR before handing to Neo. |
| Webhook not waking Sophie | Known issue. Use cron fallback or manually check. See `~/clawd/docs/sops/coderabbit-workflow.md` troubleshooting. |
| Feature too large for one PR | Split the feature issue into sub-features. Each should be 3-10 days. |

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-27 | Initial creation. Designed by Mike + Sophie. |
