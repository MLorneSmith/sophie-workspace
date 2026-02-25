# SOP: Spawning Coding Sub-Agents

**Purpose:** Maximize coding sub-agent performance through structured context engineering.
**Applies to:** Sophie (main agent) when spawning GPT or other model sub-agents for SlideHeroes development work.

---

## Why This Matters

Research (ETH Zurich, Feb 2026 — arxiv 2602.11988) found that:
- Generic/auto-generated context files **reduce** coding agent success rates
- Even good human-written context only improves by ~4%
- Both increase inference costs by 20%+ (wasted reasoning tokens)
- Agents follow instructions but unnecessary requirements make tasks harder

**The fix:** Minimal fixed context + rich task-specific context per spawn.

---

## The Template

Use `~/clawd/templates/sub-agent-task.md` for every coding sub-agent spawn.

### Fixed Sections (same every time)
- **Section 1 (Identity):** Standard engineer persona
- **Section 2 (Codebase):** ~15 lines of non-discoverable essentials (stack, structure, commands, git workflow)
- **Section 7 (Constraints):** Standard guardrails

### Task-Specific Sections (customized per spawn)
- **Section 3 (Task):** Clear, specific description of what to do
- **Section 4 (Spec & Context):** Only the relevant spec content — not entire documents
- **Section 5 (Files):** Explicit READ/MODIFY/CREATE file list
- **Section 6 (Done Criteria):** Testable checklist

---

## Process

### Before Spawning

1. **Identify the task** from Mission Control (task ID, phase, initiative)
2. **Read the relevant spec(s)** — extract only the section that applies to this task
3. **Read the implementation audit** (`deliverables/implementation-audit.md`) — what did the audit say about the component being modified?
4. **Identify specific files** — don't say "look in the ai folder"; list exact paths
5. **Define done criteria** — what would Mike click to verify this works?

### Composing the Prompt

1. Start from the template
2. Fill Section 3 with a 2-5 sentence task description
3. Fill Section 4 with extracted spec content (copy the relevant paragraphs, don't just link)
4. Fill Section 5 with explicit file paths (use `find` or `ls` to verify they exist first)
5. Fill Section 6 with 3-7 testable criteria including "builds without errors"

### Context Budget Guidelines

| Section | Target Length | Notes |
|---------|-------------|-------|
| Identity | 3 lines | Fixed |
| Codebase | 15 lines | Fixed |
| Task | 2-5 sentences | Be specific |
| Spec & Context | 50-200 lines | Extract, don't dump |
| Files | 5-15 paths | READ/MODIFY/CREATE |
| Done Criteria | 3-7 items | Testable |
| Constraints | 8 lines | Fixed |
| **Total** | **~100-250 lines** | vs. 293-line AGENTS.md + 913-line CLAUDE.md |

### Spawning

```
sessions_spawn(
  task: <composed prompt>,
  model: "openai-codex/gpt-5.2",  // or "zai/glm-4.7" as fallback
  label: "<descriptive-label>"
)
```

### After Completion

1. Review the sub-agent's output
2. Verify done criteria are met
3. If the task touched Mission Control tasks, update status
4. Log significant outcomes to `memory/YYYY-MM-DD.md`

---

## Anti-Patterns (Don't Do This)

| Anti-Pattern | Why It's Bad | Do This Instead |
|-------------|-------------|-----------------|
| "Read AGENTS.md first" | Wastes tokens on 293 lines of generic context | Include the 15 essential lines in Section 2 |
| Linking to specs without extracting | Agent reads entire 200-line spec for a 20-line task | Copy the relevant 20 lines into Section 4 |
| "Fix the Profile step" | Too vague, agent explores randomly | "Create `profile/page.tsx` with name input that calls Netrows API" |
| No file list | Agent uses `find` and `grep` extensively, burning tokens | List exact paths in Section 5 |
| No done criteria | Agent doesn't know when to stop, over-engineers | "Builds, renders card, saves to DB" |
| Dumping the full audit | 90% irrelevant to the specific task | Extract the 1-2 paragraphs about this component |
| "Follow all conventions in CLAUDE.md" | 913 lines of context for maybe 5 relevant rules | Include only the relevant conventions inline |

---

## When to Use Context7

Use the Context7 skill to fetch framework docs when the task involves:
- Framework-specific APIs the model may not know (Next.js 16 App Router specifics, Supabase edge functions)
- Recently released library features (Tailwind v4 syntax, React 19 patterns)
- Integration patterns between specific library versions

Context7 was proven effective by Vercel for framework-specific knowledge — the one case where additional context genuinely helps.

---

## Repo AGENTS.md

The repo-level `AGENTS.md` at `~/2025slideheroes-sophie/AGENTS.md` should be trimmed to essentials:
- Build/test/dev commands
- Monorepo structure (which dirs matter)
- Non-obvious conventions the linter doesn't enforce
- **Target: ~50-80 lines**

The `CLAUDE.md` (913 lines) should be reviewed and drastically reduced or removed — most of its content is either discoverable or should be task-specific.

---

## Changelog

- **2026-02-18:** Created based on ETH Zurich AGENTS.md research + discussion with Mike about maximizing GPT coding performance.
